import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { 
  Scan, 
  Image as ImageIcon, 
  Copy, 
  Plus, 
  X, 
  Trash2, 
  Loader2, 
  Upload, 
  RefreshCw,
  History,
  Settings,
  Database,
  Save,
  Check,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

// --- TYPES ---
interface MasterPair {
  id: string;
  key: string;
  value: string;
  active: boolean;
}

interface MatchResult {
  key: string;
  value: string;
  count: number;
}

interface OCRScan {
  id: number;
  originalText: string;
  matches: MatchResult[];
  preview?: string; 
  confidence: number;
  timestamp: string;
}

// --- CONSTANTS ---
const STORAGE_KEYS = {
  OCR_HISTORY: "OCR_HISTORY_V2",
  MASTER_DATA: "MASTER_DATA_V2"
};

// --- OPENCV LOADER & UTILS ---
const loadOpenCV = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (window.cv && window.cv.Mat) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    script.onload = () => {
      // Small delay to ensure wasm is ready
      setTimeout(() => resolve(), 100);
    };
    script.onerror = () => reject(new Error('Failed to load OpenCV'));
    document.body.appendChild(script);
  });
};

const processImageOpenCV = async (imageSource: string): Promise<string> => {
  // @ts-ignore
  const cv = window.cv;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      let src: any = null;
      let gray: any = null;
      let binary: any = null;
      let horizontalLines: any = null;
      let verticalLines: any = null;
      let temp: any = null;
      let hKernel: any = null;
      let vKernel: any = null;

      try {
        // 1. Load image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        src = cv.matFromImageData(imageData);
        gray = new cv.Mat();
        
        // 2. Convert to Grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // 3. Handle Blueprints (Invert if dark background)
        // We want to work with WHITE text on BLACK background for the math to work best
        const mean = cv.mean(gray);
        if (mean[0] < 127) {
            // It's a blueprint (dark bg). Just invert it.
            cv.bitwise_not(gray, gray); 
        } else {
            // It's white paper. Invert it so we have white text on black bg.
            cv.bitwise_not(gray, gray);
        }

        // 4. Threshold (Binary Image)
        // We use Otsu's method here as it's often cleaner for distinct text than Adaptive
        binary = new cv.Mat();
        cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);

        // --- LINE REMOVAL LOGIC ---

        // Create a separate copy for line detection
        horizontalLines = binary.clone();
        verticalLines = binary.clone();

        // scale allows us to adjust how long a line must be to be removed.
        // A factor of 20 means "1/20th of the image width". 
        // For text isolation, we want to be aggressive.
        const scale = 25; 
        
        // A. DETECT & REMOVE HORIZONTAL LINES
        const horizontalSize = Math.floor(horizontalLines.cols / scale);
        // Create a 1px high, horizontalSize wide structure
        hKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(horizontalSize, 1));
        
        // Erode shrinks everything. Only long horizontal lines survive.
        cv.erode(horizontalLines, horizontalLines, hKernel, new cv.Point(-1, -1), 1);
        // Dilate expands them back to original size.
        cv.dilate(horizontalLines, horizontalLines, hKernel, new cv.Point(-1, -1), 1);

        // B. DETECT & REMOVE VERTICAL LINES
        const verticalSize = Math.floor(verticalLines.rows / scale);
        vKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, verticalSize));
        
        cv.erode(verticalLines, verticalLines, vKernel, new cv.Point(-1, -1), 1);
        cv.dilate(verticalLines, verticalLines, vKernel, new cv.Point(-1, -1), 1);

        // C. SUBTRACT LINES FROM IMAGE
        // binary = binary - horizontalLines - verticalLines
        cv.subtract(binary, horizontalLines, binary);
        cv.subtract(binary, verticalLines, binary);

        // 5. Cleanup (Morphological processing on remaining text)
        // Dilate slightly to thicken the text (helps Tesseract read thin fonts)
        temp = new cv.Mat();
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        cv.dilate(binary, binary, kernel);

        // 6. Final Inversion
        // Tesseract works best with BLACK text on WHITE background.
        // Since we are currently White on Black, we invert one last time.
        cv.bitwise_not(binary, binary);

        // Render to canvas
        cv.imshow(canvas, binary);
        resolve(canvas.toDataURL('image/jpeg', 1.0));

      } catch (err) {
        console.error("OpenCV Error:", err);
        reject(err);
      } finally {
        // MANUAL GARBAGE COLLECTION (Critical in OpenCV.js)
        if(src) src.delete();
        if(gray) gray.delete();
        if(binary) binary.delete();
        if(horizontalLines) horizontalLines.delete();
        if(verticalLines) verticalLines.delete();
        if(temp) temp.delete();
        if(hKernel) hKernel.delete();
        if(vKernel) vKernel.delete();
      }
    };
    img.onerror = (e) => reject(e);
    img.src = imageSource;
  });
};

// --- APP COMPONENT ---
const Drawing: React.FC = () => {
  // UI State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'master'>('scan');

  // Data State
  const [masterData, setMasterData] = useState<MasterPair[]>([]);
  const [history, setHistory] = useState<OCRScan[]>([]);
  const [currentMatches, setCurrentMatches] = useState<MatchResult[]>([]);
  const [rawText, setRawText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INIT ---
  useEffect(() => {
    // Load OpenCV
    loadOpenCV().then(() => console.log("OpenCV Loaded")).catch(e => console.error(e));

    // Load LocalStorage
    const savedMaster = localStorage.getItem(STORAGE_KEYS.MASTER_DATA);
    if (savedMaster) {
      const parsed = JSON.parse(savedMaster);
      // Ensure active is boolean for backward compatibility
      setMasterData(parsed.map((item: any) => ({ ...item, active: item.active ?? true })));
    }

    const savedHistory = localStorage.getItem(STORAGE_KEYS.OCR_HISTORY);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save Master Data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MASTER_DATA, JSON.stringify(masterData));
  }, [masterData]);

  // Save History
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OCR_HISTORY, JSON.stringify(history));
  }, [history]);

  // --- ACTIONS ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setSelectedImage(url);
      setProcessedImage(null);
      setRawText('');
      setCurrentMatches([]);
      setProgress(0);
      setStatus('Image loaded. Ready to scan.');
    }
  };

  const runOCR = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      // 1. Preprocessing
      setStatus('Preprocessing with OpenCV (Adaptive Thresholding)...');
      // Small timeout to allow UI to update
      await new Promise(r => setTimeout(r, 100)); 
      
      const cleanImage = await processImageOpenCV(selectedImage);
      setProcessedImage(cleanImage);
      setProgress(40);

      // 2. Tesseract OCR
      setStatus('Extracting Text...');
      const result = await Tesseract.recognize(cleanImage, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(40 + (m.progress * 50));
          }
        }
      });

      const text = result.data.text;
      setRawText(text);
      setProgress(90);

      // 3. Match against Active Master Data
      setStatus('Matching against Active Master Data...');
      const activeMasters = masterData.filter(item => item.active);
      const matches = findMatches(text, activeMasters);
      setCurrentMatches(matches);

      // 4. Save to History
      const newScan: OCRScan = {
        id: Date.now(),
        originalText: text,
        matches: matches,
        preview: selectedImage,
        confidence: result.data.confidence,
        timestamp: new Date().toLocaleString()
      };
      setHistory(prev => [newScan, ...prev]);

      setStatus('Complete');
      setProgress(100);

    } catch (err) {
      console.error(err);
      setStatus('Error during processing. See console.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- MATCHING LOGIC ---
  const findMatches = (text: string, masters: MasterPair[]): MatchResult[] => {
    // Normalize text for easier matching (remove extra spaces, uppercase)
    const normalizedText = text.toUpperCase().replace(/\s+/g, ' ');
    
    const results: MatchResult[] = [];

    masters.forEach(master => {
      if (!master.key.trim()) return;
      
      // Create a regex to find the key
      // We escape special regex characters in the key just in case
      const escapedKey = master.key.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toUpperCase();
      const regex = new RegExp(escapedKey, 'g');
      
      const found = normalizedText.match(regex);
      if (found && found.length > 0) {
        results.push({
          key: master.key,
          value: master.value,
          count: found.length
        });
      }
    });

    return results;
  };

  const updateMatchCount = (index: number, newCount: number) => {
    const updated = [...currentMatches];
    updated[index].count = newCount;
    setCurrentMatches(updated);
  };

  // --- MASTER DATA CRUD ---
  const addMasterItem = () => {
    setMasterData([...masterData, { id: crypto.randomUUID(), key: '', value: '', active: true }]);
  };

  const updateMasterItem = (id: string, field: 'key' | 'value', val: string) => {
    setMasterData(masterData.map(item => 
      item.id === id ? { ...item, [field]: val } : item
    ));
  };

  const toggleMasterActive = (id: string) => {
    setMasterData(masterData.map(item => 
      item.id === id ? { ...item, active: !item.active } : item
    ));
  };

  const deleteMasterItem = (id: string) => {
    setMasterData(masterData.filter(item => item.id !== id));
  };

  const copyRawText = () => {
    navigator.clipboard.writeText(rawText);
    // Optional: Show a toast or alert for copy success
    alert('Raw text copied to clipboard!');
  };

  const activeMasterCount = masterData.filter(item => item.active).length;

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans text-gray-800 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scan className="w-8 h-8 text-indigo-600" />
            Blueprint Scanner & Matcher
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            OpenCV Adaptive Processing • Master Data Matching
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'scan' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Scanner
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'master' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Master Data ({activeMasterCount} Active)
          </button>
        </div>
      </div>

      {/* --- MASTER DATA TAB --- */}
      {activeTab === 'master' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                Configure Master Data
              </h2>
              <p className="text-sm text-gray-500">
                Define the Keys (e.g., "P7") you want to find in blueprints and their meanings (e.g., "Steel Rods"). Only active items will be matched during scans.
              </p>
            </div>
            <button 
              onClick={addMasterItem}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {masterData.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-400">No master data defined yet.</p>
                <button onClick={addMasterItem} className="mt-2 text-indigo-600 font-medium hover:underline">
                  Add your first Key-Value pair
                </button>
              </div>
            )}
            
            {masterData.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full border text-xs font-bold text-gray-400">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Search Key</label>
                  <input 
                    type="text" 
                    value={item.key}
                    onChange={(e) => updateMasterItem(item.id, 'key', e.target.value)}
                    placeholder="e.g. P7 5 INCH"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Meaning / Value</label>
                  <input 
                    type="text" 
                    value={item.value}
                    onChange={(e) => updateMasterItem(item.id, 'value', e.target.value)}
                    placeholder="e.g. Steel Rods"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => toggleMasterActive(item.id)}
                  className={`p-2 rounded-lg transition ${
                    item.active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <div className="pt-5">
                  <button 
                    onClick={() => deleteMasterItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Active Items:</strong> {activeMasterCount} / {masterData.length} items are active and will be used for matching extracted text.
            </p>
          </div>
        </div>
      )}

      {/* --- SCANNER TAB --- */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Left Column: Image Area */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Image Source</h3>
                {selectedImage && (
                  <button 
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-xs bg-white border px-2 py-1 rounded shadow-sm hover:bg-gray-50"
                  >
                    {showDebug ? 'Show Original' : 'Show Processed'}
                  </button>
                )}
              </div>
              
              <div className="relative min-h-[400px] flex flex-col items-center justify-center bg-slate-100">
                {!selectedImage ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer text-center p-8 hover:bg-slate-200 transition-colors rounded-full w-full h-full flex flex-col items-center justify-center"
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Upload className="w-8 h-8 text-indigo-500" />
                    </div>
                    <p className="text-gray-600 font-medium">Click to Upload Blueprint</p>
                    <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black/5 p-4 flex items-center justify-center">
                    <img 
                      src={showDebug && processedImage ? processedImage : selectedImage} 
                      alt="Source" 
                      className="max-h-[500px] object-contain shadow-lg bg-white"
                    />
                    
                    {/* Clear Button */}
                    <button 
                      onClick={() => {
                        setSelectedImage(null);
                        setProcessedImage(null);
                        setCurrentMatches([]);
                        setRawText('');
                      }}
                      className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                    <p className="font-medium text-gray-800">{status}</p>
                    <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload} 
              />
            </div>

            <button
              onClick={runOCR}
              disabled={!selectedImage || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-sm flex items-center justify-center gap-2 transition-all ${
                !selectedImage || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              <Scan className="w-6 h-6" />
              {isProcessing ? 'Processing...' : 'Start Extraction & Match'}
            </button>
          </div>

          {/* Right Column: Results Area */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Raw Extracted Text Section */}
            {rawText && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    Extracted Raw Text
                  </h3>
                  <button 
                    onClick={copyRawText}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="p-4 max-h-48 overflow-y-auto">
                  <textarea
                    value={rawText}
                    readOnly
                    className="w-full h-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none resize-none font-mono"
                    placeholder="Extracted text will appear here..."
                  />
                </div>
              </div>
            )}

            {/* Matched Results Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Matched Results (Active Masters)
                </h3>
                {currentMatches.length > 0 && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                    {currentMatches.reduce((acc, curr) => acc + curr.count, 0)} Found
                  </span>
                )}
              </div>

              <div className="flex-1 p-4 overflow-y-auto max-h-[600px] bg-slate-50">
                {currentMatches.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 min-h-[300px]">
                    <AlertCircle className="w-12 h-12 text-gray-300" />
                    <p className="text-center text-sm">
                      {rawText ? "No matches found in extracted text." : "Scan an image to see results here."}
                    </p>
                    {rawText && (
                      <button 
                        onClick={() => setActiveTab('master')}
                        className="text-indigo-600 text-sm hover:underline"
                      >
                        Check/Add Active Master Data Keys
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentMatches.map((match, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="bg-indigo-50 w-16 h-16 rounded-lg flex flex-col items-center justify-center border border-indigo-100 shrink-0">
                          <input 
                            type="number"
                            value={match.count}
                            onChange={(e) => updateMatchCount(idx, parseInt(e.target.value) || 0)}
                            className="w-12 text-center bg-transparent font-bold text-2xl text-indigo-700 focus:outline-none"
                          />
                          <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">Count</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate" title={match.key}>
                            {match.key}
                          </h4>
                          <p className="text-sm text-gray-500 truncate" title={match.value}>
                            {match.value}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4 mt-4 border-t border-gray-200">
                       <button 
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        onClick={() => alert("Data Saved! (Mock Action)")}
                       >
                         <Save className="w-4 h-4" /> Save Adjusted Counts
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && activeTab === 'scan' && (
        <div className="mt-8">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700 flex items-center gap-2">
               <History className="w-5 h-5" /> Recent Scans
             </h3>
             <button onClick={() => setHistory([])} className="text-xs text-red-500 hover:text-red-700">Clear History</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {history.slice(0, 3).map(scan => (
               <div key={scan.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                 <div className="flex items-start gap-3">
                   {scan.preview && (
                     <img src={scan.preview} className="w-12 h-12 object-cover rounded bg-gray-100" />
                   )}
                   <div>
                     <p className="text-xs text-gray-400">{scan.timestamp}</p>
                     <p className="font-medium text-sm text-gray-800 mt-1">
                       {scan.matches.length} matches found
                     </p>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
};

export default Drawing;