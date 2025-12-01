import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store"; // Adjust path to your store
import { 
  Scan, 
  Image as ImageIcon, 
  Copy, 
  Plus, 
  X, 
  Trash2, 
  Loader2, 
  Upload, 
  History,
  Database,
  Save,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  ListFilter,
  Calendar,
  Briefcase,
  Layers
} from 'lucide-react';

// --- REDUX ACTIONS ---
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import { createBulkMRS } from "@/redux/slices/mrsSlice";
import { toast } from 'sonner'; // Assuming you use sonner or similar for toasts

// --- TYPES ---
interface MasterPair {
  id: string;
  key: string;
  value: string;
  active: boolean;
}

interface ScanResultItem {
  id: string;
  key: string;
  value: string;
  count: number;
  isMasterMatch: boolean;
}

interface OCRScan {
  id: number;
  originalText: string;
  results: ScanResultItem[];
  preview?: string; 
  timestamp: string;
}

// --- CONSTANTS ---
const STORAGE_KEYS = {
  OCR_HISTORY: "OCR_HISTORY_GEMINI_V2",
  MASTER_DATA: "MASTER_DATA_V2",
  API_KEY: "GEMINI_API_KEY"
};

const Drawing: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // --- REDUX STATE ---
  const { projects } = useSelector((state: RootState) => state.projects);
  const { wbs } = useSelector((state: RootState) => state.wbs);
  
  // --- UI STATE ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'scan' | 'master'>('scan');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // --- SAVE MODAL STATE ---
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedWbsId, setSelectedWbsId] = useState<string>("");
  const [requiredDate, setRequiredDate] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // --- HISTORY MODAL STATE ---
  const [viewHistoryItem, setViewHistoryItem] = useState<OCRScan | null>(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // --- DATA STATE ---
  // 1. Initialize Master Data directly from Storage to prevent overwriting on mount
  const [masterData, setMasterData] = useState<MasterPair[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MASTER_DATA);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load master data", e);
      return [];
    }
  });

  // 2. Initialize History directly from Storage
  const [history, setHistory] = useState<OCRScan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OCR_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  const [scanResults, setScanResults] = useState<ScanResultItem[]>([]);
  const [rawText, setRawText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INIT (Only Network Calls) ---
  useEffect(() => {
    // Fetch Projects for Dropdown
    dispatch(fetchProjects({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Fetch WBS when Project Changes
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWbsByProject(selectedProjectId));
    }
  }, [selectedProjectId, dispatch]);

  // --- PERSISTENCE EFFECTS ---
  // These will now safe to run because state is already initialized with data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MASTER_DATA, JSON.stringify(masterData));
  }, [masterData]);

  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEYS.OCR_HISTORY, JSON.stringify(history));
    } catch (e) {
        console.warn("LocalStorage quota exceeded, could not save history image.");
    }
  }, [history]);

  // --- HELPER UTILS ---
  const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]); 
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // --- GEMINI ACTIONS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setSelectedImage(url);
      setRawText('');
      setScanResults([]);
      setStatus('Image loaded. Ready to scan.');
    }
  };

  const runOCR = async () => {
    if (!selectedImage) return;
    if (!apiKey) {
        alert("Please enter a valid Gemini API Key.");
        setShowKeyInput(true);
        return;
    }

    setIsProcessing(true);
    setStatus('Preparing image for Gemini...');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const base64Data = await urlToBase64(selectedImage);
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      };

      const prompt = `
        Look at this technical drawing or blueprint. 
        Extract ALL text visible in the image. 
        Return the raw text exactly as it appears. 
        Do not markdown format it. 
        Just give me the content.
      `;

      setStatus('Sending to Gemini (AI Analysis)...');

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      setRawText(text);

      setStatus('Processing extracted text...');
      const results = processExtractedText(text, masterData);
      setScanResults(results);

      // Save to History
      const newScan: OCRScan = {
        id: Date.now(),
        originalText: text,
        results: results,
        preview: selectedImage,
        timestamp: new Date().toLocaleString()
      };
      setHistory(prev => [newScan, ...prev]);

      setStatus('Complete');

    } catch (err: any) {
      console.error("Gemini Error:", err);
      setStatus(`Error: ${err.message || 'Failed to process image'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processExtractedText = (text: string, masters: MasterPair[]): ScanResultItem[] => {
    const rawTokens = text.split(/\s+/).map(t => t.trim()).filter(t => t.length > 0);
    const tokenMap = new Map<string, number>();
    
    rawTokens.forEach(token => {
      const key = token.toUpperCase();
      tokenMap.set(key, (tokenMap.get(key) || 0) + 1);
    });

    const results: ScanResultItem[] = [];
    
    tokenMap.forEach((count, key) => {
      const masterMatch = masters.find(m => m.active && m.key.toUpperCase() === key);
      results.push({
        id: crypto.randomUUID(),
        key: key, 
        value: masterMatch ? masterMatch.value : '', 
        count: count,
        isMasterMatch: !!masterMatch
      });
    });

    return results.sort((a, b) => {
      if (a.isMasterMatch && !b.isMasterMatch) return -1;
      if (!a.isMasterMatch && b.isMasterMatch) return 1;
      return b.count - a.count;
    });
  };

  // --- CRUD HANDLERS ---
  const updateResultItem = (id: string, field: keyof ScanResultItem, val: string | number) => {
    setScanResults(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: val } : item
    ));
  };

  const deleteResultItem = (id: string) => {
    setScanResults(prev => prev.filter(item => item.id !== id));
  };

  // --- SAVE TO MRS LOGIC ---
  const handleOpenSaveModal = () => {
    if (scanResults.length === 0) {
        toast.error("No items to save.");
        return;
    }
    setShowSaveModal(true);
  };

  const handleFinalSave = async () => {
    if (!selectedProjectId || !selectedWbsId) {
        toast.error("Please select a Project and a WBS Task.");
        return;
    }

    // Double check meanings
    const missingMeanings = scanResults.filter(i => !i.value || i.value.trim() === '');
    if (missingMeanings.length > 0) {
        toast.error(`Cannot save: ${missingMeanings.length} items are missing a Meaning/Value.`);
        return;
    }

    setIsSaving(true);
    try {
        const selectedWbs = wbs.find(w => w.id === selectedWbsId);
        
        // Prepare Payload
        const payload = scanResults.map(item => ({
            projectId: selectedProjectId,
            task: selectedWbs?.name || "Unspecified Task", // The MRS model expects a string for task name
            item: item.value, // Mapping MEANING to Item Name
            quantity: item.count,
            status: "open",
            requiredDate: requiredDate || undefined
        }));

        await dispatch(createBulkMRS(payload)).unwrap();
        
        toast.success("MRS Items created successfully!");
        setShowSaveModal(false);
        setScanResults([]); // Clear results after save
        setRawText('');
        setSelectedImage(null);
    } catch (error: any) {
        console.error("Save Failed", error);
        toast.error(typeof error === 'string' ? error : "Failed to save MRS items.");
    } finally {
        setIsSaving(false);
    }
  };

  // --- MASTER DATA HANDLERS ---
  const addMasterItem = () => setMasterData([...masterData, { id: crypto.randomUUID(), key: '', value: '', active: true }]);
  const updateMasterItem = (id: string, field: 'key' | 'value', val: string) => setMasterData(masterData.map(item => item.id === id ? { ...item, [field]: val } : item));
  const toggleMasterActive = (id: string) => setMasterData(masterData.map(item => item.id === id ? { ...item, active: !item.active } : item));
  const deleteMasterItem = (id: string) => setMasterData(masterData.filter(item => item.id !== id));

  // --- COMPUTED ---
  const allMeaningsFilled = scanResults.length > 0 && scanResults.every(r => r.value && r.value.trim() !== '');

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans text-gray-800 space-y-6 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scan className="w-8 h-8 text-indigo-600" />
            AI Blueprint Scanner
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('scan')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'scan' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Scanner</button>
                <button onClick={() => setActiveTab('master')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'master' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Master Data</button>
            </div>
        </div>
      </div>

      {/* --- MASTER DATA TAB --- */}
      {activeTab === 'master' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
           {/* (Master Data UI Code - kept same as before) */}
           <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2"><Database className="w-5 h-5 text-indigo-500" />Configure Master Data</h2>
            </div>
            <button onClick={addMasterItem} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus className="w-4 h-4" /> Add Item</button>
          </div>
          <div className="space-y-3">
            {masterData.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full border text-xs font-bold text-gray-400">{index + 1}</div>
                <input type="text" value={item.key} onChange={(e) => updateMasterItem(item.id, 'key', e.target.value)} placeholder="Key (e.g. P7)" className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                <input type="text" value={item.value} onChange={(e) => updateMasterItem(item.id, 'value', e.target.value)} placeholder="Value (e.g. Steel Rods)" className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                <button onClick={() => deleteMasterItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SCANNER TAB --- */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Left Column: Image Area */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Image Source</h3>
              </div>
              <div className="relative min-h-[400px] flex flex-col items-center justify-center bg-slate-100">
                {!selectedImage ? (
                  <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-center p-8 hover:bg-slate-200 transition-colors rounded-full w-full h-full flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-indigo-500 mb-4" />
                    <p className="text-gray-600 font-medium">Click to Upload Blueprint</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black/5 p-4 flex items-center justify-center">
                    <img src={selectedImage} alt="Source" className="max-h-[500px] object-contain shadow-lg bg-white" />
                    <button onClick={() => { setSelectedImage(null); setScanResults([]); setRawText(''); }} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:text-red-600"><X className="w-5 h-5" /></button>
                  </div>
                )}
                {isProcessing && <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" /><p className="font-medium text-gray-800">{status}</p></div>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          
            <button onClick={runOCR} disabled={!selectedImage || isProcessing} className={`w-full py-4 rounded-xl font-bold text-lg shadow-sm flex items-center justify-center gap-2 transition-all ${!selectedImage || isProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}>
              <Scan className="w-6 h-6" /> {isProcessing ? 'Processing...' : 'Analyze with Gemini'}
            </button>
          </div>

          {/* Right Column: Results Area */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2"><ListFilter className="w-4 h-4 text-indigo-600" /> Extracted Items</h3>
                {scanResults.length > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">{scanResults.length} Found</span>}
              </div>

              <div className="flex-1 p-3 overflow-y-auto max-h-[600px] bg-slate-50">
                {scanResults.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 min-h-[300px]">
                    <AlertCircle className="w-12 h-12 text-gray-300" />
                    <p className="text-center text-sm">Upload an image and run scan to see data.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scanResults.map((item) => (
                      <div key={item.id} className={`relative p-3 rounded-lg shadow-sm border transition-all ${item.isMasterMatch ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center gap-1">
                            <input type="number" value={item.count} onChange={(e) => updateResultItem(item.id, 'count', parseInt(e.target.value) || 0)} className="w-12 text-center bg-white border border-gray-300 rounded-md py-1 font-bold text-lg text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            <span className="text-[9px] text-gray-400 uppercase font-bold">Count</span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-gray-400 w-8">Key</span>
                                <input type="text" value={item.key} onChange={(e) => updateResultItem(item.id, 'key', e.target.value)} className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-800 focus:outline-none" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-gray-400 w-8">Value</span>
                                <input type="text" placeholder="Required for save..." value={item.value} onChange={(e) => updateResultItem(item.id, 'value', e.target.value)} className={`w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${!item.value ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
                            </div>
                          </div>
                          <button onClick={() => deleteResultItem(item.id)} className="text-gray-400 hover:text-red-500 self-center p-2"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4 mt-4 border-t border-gray-200">
                       {!allMeaningsFilled && (
                         <div className="text-xs text-red-500 mb-2 flex items-center gap-1">
                           <AlertCircle className="w-3 h-3" />
                           Fill the required fields. Or delete them.
                         </div>
                       )}
                       <button 
                        onClick={handleOpenSaveModal}
                        disabled={!allMeaningsFilled}
                        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-sm transition-all
                            ${allMeaningsFilled ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                        `}
                       >
                         <Save className="w-5 h-5" /> Save Final Results
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY SECTION --- */}
      {history.length > 0 && activeTab === 'scan' && (
        <div className="mt-8">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700 flex items-center gap-2"><History className="w-5 h-5" /> Recent Scans</h3>
             <button onClick={() => setHistory([])} className="text-xs text-red-500 hover:text-red-700">Clear History</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {history.slice(0, 3).map(scan => (
               <div key={scan.id} onClick={() => setViewHistoryItem(scan)} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition">
                 <div className="flex items-start gap-3">
                   {scan.preview && <img src={scan.preview} className="w-12 h-12 object-cover rounded bg-gray-100" />}
                   <div>
                     <p className="text-xs text-gray-400">{scan.timestamp}</p>
                     <p className="font-medium text-sm text-gray-800 mt-1">{scan.results.length} unique items found</p>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* --- MODAL: SAVE TO MRS --- */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Save className="w-5 h-5 text-indigo-600" />
                        Save to Project (MRS)
                    </h2>
                    <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                    {/* Project Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Select Project</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={selectedProjectId}
                            onChange={(e) => {
                                setSelectedProjectId(e.target.value);
                                setSelectedWbsId(""); // Reset WBS
                            }}
                        >
                            <option value="">-- Choose Project --</option>
                            {projects.map((p: any) => (
                                <option key={p._id} value={p._id}>{p.name} ({p.code || 'No Code'})</option>
                            ))}
                        </select>
                    </div>

                    {/* WBS Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Layers className="w-4 h-4" /> Select WBS Task</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={selectedWbsId}
                            onChange={(e) => setSelectedWbsId(e.target.value)}
                            disabled={!selectedProjectId}
                        >
                            <option value="">-- Choose WBS Task --</option>
                            {wbs.map((w: any) => (
                                <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                            ))}
                        </select>
                    </div>

                    {/* Required Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> Required Date (Optional)</label>
                        <input 
                            type="date"
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={requiredDate}
                            onChange={(e) => setRequiredDate(e.target.value)}
                        />
                    </div>

                    <div className="bg-indigo-50 text-indigo-800 p-3 rounded-lg text-sm mt-2">
                        <p className="font-semibold">Summary:</p>
                        <p>You are about to create <strong>{scanResults.length}</strong> MRS items.</p>
                    </div>
                </div>

                <div className="flex gap-3 justify-end mt-8">
                    <button 
                        onClick={() => setShowSaveModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleFinalSave}
                        disabled={isSaving || !selectedProjectId || !selectedWbsId}
                        className={`px-4 py-2 text-white rounded-lg font-medium flex items-center gap-2
                            ${isSaving || !selectedProjectId || !selectedWbsId ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                        `}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Confirm Save
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL: HISTORY VIEWER --- */}
      {viewHistoryItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Scan History Detail</h2>
                        <p className="text-xs text-gray-500">{viewHistoryItem.timestamp}</p>
                    </div>
                    <button onClick={() => setViewHistoryItem(null)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image View */}
                    <div className="bg-slate-100 rounded-lg flex items-center justify-center border p-2">
                         {viewHistoryItem.preview ? (
                            <img src={viewHistoryItem.preview} alt="Scan Snapshot" className="max-w-full max-h-[500px] object-contain" />
                         ) : (
                             <span className="text-gray-400">Image not available</span>
                         )}
                    </div>

                    {/* Data View */}
                    <div className="overflow-auto border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0">
                                <tr>
                                    <th className="p-3 border-b">Key</th>
                                    <th className="p-3 border-b">Meaning (Item)</th>
                                    <th className="p-3 border-b text-center">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewHistoryItem.results.map((r) => (
                                    <tr key={r.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-mono font-medium text-indigo-600">{r.key}</td>
                                        <td className="p-3">{r.value || <span className="text-gray-400 italic">No Meaning</span>}</td>
                                        <td className="p-3 text-center font-bold">{r.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button onClick={() => setViewHistoryItem(null)} className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Close
                    </button>
                </div>
             </div>
        </div>
      )}

    </div>
  );
};

export default Drawing;