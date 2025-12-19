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
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import { toast } from 'sonner'; // Assuming you use sonner or similar for toasts
import { BASE_URL } from '@/utils/constants';

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
  const { materials } = useSelector((state: RootState) => state.rawMaterials);

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

  // --- AUTOCOMPLETE STATE ---
  const [autocompleteStates, setAutocompleteStates] = useState<{[key: string]: {
    isOpen: boolean;
    searchTerm: string;
    filteredMaterials: any[];
  }}>({});

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
    // Fetch Raw Materials for Autocomplete
    dispatch(fetchMaterials({ page: 1, limit: 1000 }));
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

  // --- PDF EXTRACTION FUNCTION ---
  const runPDFExtraction = async (file: File) => {
    setIsProcessing(true);
    setStatus('Uploading PDF...');

    try {
      console.log('Starting PDF extraction for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const formData = new FormData();
      formData.append('pdf', file);

      setStatus('Extracting data from PDF...');
      
      console.log('Sending request to API...');
      const response = await fetch(`${BASE_URL}/api/extract-drawing`, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to extract data from PDF');
      }

      setStatus('Processing extracted data...');

      // Convert PDF extraction result to our format
      const extractedText = formatPDFDataToText(result.data);
      setRawText(extractedText);

      // Process the extracted text
      const results = processPDFExtractedData(result.data, masterData);
      setScanResults(results);

      // Save to History
      const newScan: OCRScan = {
        id: Date.now(),
        originalText: extractedText,
        results: results,
        preview: selectedImage,
        timestamp: new Date().toLocaleString()
      };
      setHistory(prev => [newScan, ...prev]);

      setStatus('Complete');

    } catch (err: any) {
      console.error("PDF Extraction Error:", err);
      
      // Show user-friendly error messages
      let errorMessage = 'Failed to process PDF';
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Make sure the backend is running on http://localhost:4000';
      } else if (err.message.includes('HTTP error')) {
        errorMessage = `Server error: ${err.message}`;
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setStatus(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- FORMAT PDF DATA TO TEXT ---
  const formatPDFDataToText = (data: any): string => {
    let text = '';
    
    // Add drawing metadata
    if (data.drawing_metadata) {
      text += 'DRAWING METADATA:\n';
      Object.entries(data.drawing_metadata).forEach(([key, value]) => {
        if (value) {
          text += `${key.toUpperCase()}: ${value}\n`;
        }
      });
      text += '\n';
    }

    // Add BOM items
    if (data.bill_of_materials && data.bill_of_materials.length > 0) {
      text += 'BILL OF MATERIALS:\n';
      data.bill_of_materials.forEach((item: any) => {
        if (item.mark_no) text += `${item.mark_no} `;
        if (item.part_no) text += `${item.part_no} `;
        if (item.description) text += `${item.description} `;
        if (item.material) text += `${item.material} `;
        if (item.quantity) text += `QTY:${item.quantity} `;
        if (item.length_or_area && item.uom) text += `${item.length_or_area} ${item.uom} `;
        if (item.weight_per_unit_kg) text += `${item.weight_per_unit_kg}KG `;
        text += '\n';
      });
    }

    return text;
  };

  // --- PROCESS PDF EXTRACTED DATA ---
  const processPDFExtractedData = (data: any, masters: MasterPair[]): ScanResultItem[] => {
    const results: ScanResultItem[] = [];

    // Process BOM items
    if (data.bill_of_materials && data.bill_of_materials.length > 0) {
      data.bill_of_materials.forEach((item: any) => {
        if (item.mark_no) {
          const key = item.mark_no.toUpperCase();
          const masterMatch = masters.find(m => m.active && m.key.toUpperCase() === key);
          
          results.push({
            id: crypto.randomUUID(),
            key: key,
            value: masterMatch ? masterMatch.value : (item.description || ''),
            count: item.quantity || 1,
            isMasterMatch: !!masterMatch
          });
        }
      });
    }

    // If no BOM items found, try to extract from raw text patterns
    if (results.length === 0 && data.drawing_metadata) {
      // Look for part numbers in metadata
      Object.values(data.drawing_metadata).forEach((value: any) => {
        if (typeof value === 'string') {
          const matches = value.match(/[A-Z]\d+/g);
          if (matches) {
            matches.forEach(match => {
              const key = match.toUpperCase();
              const masterMatch = masters.find(m => m.active && m.key.toUpperCase() === key);
              
              results.push({
                id: crypto.randomUUID(),
                key: key,
                value: masterMatch ? masterMatch.value : '',
                count: 1,
                isMasterMatch: !!masterMatch
              });
            });
          }
        }
      });
    }

    return results.sort((a, b) => {
      if (a.isMasterMatch && !b.isMasterMatch) return -1;
      if (!a.isMasterMatch && b.isMasterMatch) return 1;
      return b.count - a.count;
    });
  };

  // --- GEMINI ACTIONS ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setRawText('');
      setScanResults([]);
      
      if (file.type === 'application/pdf') {
        setFileType('pdf');
        setSelectedImage(null); // Don't set image URL for PDFs
        setStatus('PDF loaded. Ready to extract data.');
      } else {
        setFileType('image');
        const url = URL.createObjectURL(file);
        setSelectedImage(url);
        setStatus('Image loaded. Ready to scan.');
      }
    }
  };

  const runOCR = async () => {
    if (!selectedFile) return;
    
    // Check if it's a PDF file
    if (selectedFile.type === 'application/pdf') {
      return await runPDFExtraction(selectedFile);
    }
    
    if (!selectedImage) return;
    
    if (!apiKey) {
      alert("Please enter a valid API Key.");
      setShowKeyInput(true);
      return;
    }

    setIsProcessing(true);
    setStatus('Preparing image...');

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
You are analyzing an engineering drawing/blueprint to extract structured data.

EXTRACT THE FOLLOWING DATA:
Extract ALL p-series items also like P-1, P-2, P-3, and like these 

1. DRAWING METADATA (look for title blocks, headers):
   - Drawing number/ID
   - Drawing title/name
   - Job number
   - Project name
   - Owner/client
   - Contractor
   - Revision number
   - Drawing date
   - Scale
   - Sheet size

2. BILL OF MATERIALS (look for BOM tables):
   For each item in the BOM table, extract:
   - Mark number (like A1, B2, P7, etc.)
   - Part number
   - Description
   - Material type
   - Quantity
   - Length/area/dimensions
   - Unit of measure (mm, inch, kg, etc.)
   - Weight per unit
   - Total weight

RULES:
- Extract ALL visible text from tables and title blocks
- Keep numbers with their units (e.g., "25 INCH", "6 MM", "10 KG")
- Include part numbers exactly as shown
- Capture material descriptions completely
- Don't skip any table rows
- Include duplicate entries if they appear multiple times
- Return raw extracted text, one item per line
- Focus on tabular data and title block information

Extract everything visible in the drawing.
`;


// const prompt = `
// You are reading a structural engineering drawing.

// STRICT RULES:
// 1. ALWAYS extract number + unit together as one phrase.
//    Examples:
//    "5 INCH", "25 INCH", "20 mm", "6\"", "12 in", etc.
// 2. NEVER split numbers and units.
// 3. Keep key + measurement on the same line:
//    - "P7 5 INCH"
//    - "P65 25 INCH"
// 4. Return ONLY the raw extracted text.
// 5. No formatting, no markdown, no summarizing.

// Extract EVERYTHING visible in the image.
// `;


      setStatus('Processing...');

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
      console.error("Error:", err);
      setStatus(`Error: ${err.message || 'Failed to process image'}`);
    } finally {
      setIsProcessing(false);
    }
  };

const processExtractedText = (text: string, masters: MasterPair[]): ScanResultItem[] => {
  const rawTokens = text
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const merged: string[] = [];
  let i = 0;

  const UNIT_WORDS = ["INCH", "IN", "MM", "CM", "FT", "M", "KG", "G", "L", "ML", "\"", "'"];
  const PART_PATTERNS = [
    /^[A-Z]\d+$/i,     // P7, A1, B2, etc.
    /^[A-Z]{2,}\d+$/i, // UB305, UC203, etc.
    /^\d{4}-\d{3}-\d{3}$/i, // Drawing numbers like 3847-534-015
  ];
  
  while (i < rawTokens.length) {
    const token = rawTokens[i].toUpperCase();
    const next = rawTokens[i + 1]?.toUpperCase() || "";
    const next2 = rawTokens[i + 2]?.toUpperCase() || "";

    // CASE 1: number + unit => merge
    if (!isNaN(Number(token)) && UNIT_WORDS.includes(next)) {
      merged.push(`${token} ${next}`);
      i += 2;
      continue;
    }

    // CASE 2: number + number + unit => merge (e.g., 25 0 INCH)
    if (!isNaN(Number(token)) && !isNaN(Number(next)) && UNIT_WORDS.includes(next2)) {
      merged.push(`${token}${next} ${next2}`);
      i += 3;
      continue;
    }

    // CASE 3: part pattern + measurement
    const isPartPattern = PART_PATTERNS.some(pattern => pattern.test(token));
    if (isPartPattern && !isNaN(Number(next)) && UNIT_WORDS.includes(next2)) {
      merged.push(`${token} ${next} ${next2}`);
      i += 3;
      continue;
    }

    // CASE 4: part pattern + number (without unit)
    if (isPartPattern && !isNaN(Number(next))) {
      if (UNIT_WORDS.includes(next2)) {
        merged.push(`${token} ${next} ${next2}`);
        i += 3;
        continue;
      } else {
        merged.push(`${token} ${next}`);
        i += 2;
        continue;
      }
    }

    // CASE 5: Material descriptions (keep multi-word materials together)
    if (token.includes("STEEL") || token.includes("CONCRETE") || token.includes("ALUMINUM")) {
      let materialDesc = token;
      let j = i + 1;
      while (j < rawTokens.length && j < i + 4) { // Look ahead max 4 words
        const nextToken = rawTokens[j].toUpperCase();
        if (UNIT_WORDS.includes(nextToken) || !isNaN(Number(nextToken))) break;
        materialDesc += ` ${nextToken}`;
        j++;
      }
      merged.push(materialDesc);
      i = j;
      continue;
    }

    // DEFAULT: push token alone
    merged.push(token);
    i++;
  }

  // Count merged occurrences
  const tokenMap = new Map<string, number>();
  merged.forEach(item => tokenMap.set(item, (tokenMap.get(item) || 0) + 1));

  const results: ScanResultItem[] = [];

  tokenMap.forEach((count, key) => {
    // Skip common words that aren't useful
    const skipWords = ["THE", "AND", "OR", "OF", "TO", "FOR", "WITH", "BY", "FROM", "AS", "IS", "ARE", "WAS", "WERE"];
    if (skipWords.includes(key) || key.length < 2) return;

    const masterMatch = masters.find(m => m.active && m.key.toUpperCase() === key);
    results.push({
      id: crypto.randomUUID(),
      key,
      value: masterMatch ? masterMatch.value : "",
      count,
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

  // --- AUTOCOMPLETE HANDLERS ---
  const initAutocompleteState = (itemId: string) => {
    if (!autocompleteStates[itemId]) {
      setAutocompleteStates(prev => ({
        ...prev,
        [itemId]: {
          isOpen: false,
          searchTerm: '',
          filteredMaterials: []
        }
      }));
    }
  };

  const updateAutocompleteState = (itemId: string, updates: Partial<typeof autocompleteStates[string]>) => {
    setAutocompleteStates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...updates
      }
    }));
  };

  const handleAutocompleteInput = (itemId: string, value: string) => {
    // Update the actual item value
    updateResultItem(itemId, 'value', value);
    
    // Filter materials based on input (search in name and itemCode)
    const filtered = materials.filter((material: any) => {
      const searchTerm = value.toLowerCase();
      return (
        material.name.toLowerCase().includes(searchTerm) ||
        (material.itemCode && material.itemCode.toLowerCase().includes(searchTerm))
      );
    }).slice(0, 15); // Increased to 15 results for better selection
    
    updateAutocompleteState(itemId, {
      searchTerm: value,
      filteredMaterials: filtered,
      isOpen: value.length > 0 && filtered.length > 0
    });
  };

  const selectMaterial = (itemId: string, materialName: string, material?: any) => {
    console.log(`🔄 Selecting material for item ${itemId}: ${materialName}`);
    
    // Update the item value with selected material name
    updateResultItem(itemId, 'value', materialName);
    
    // If we have full material data, we could also update other fields
    if (material) {
      console.log(`✅ Selected existing material: ${materialName}`);
      console.log(`📋 Material details:`, {
        name: material.name,
        code: material.itemCode || 'N/A',
        unit: material.unitOfMeasure || 'N/A',
        stock: material.quantity || 'N/A'
      });
      // You can add more fields here if needed, like:
      // updateResultItem(itemId, 'itemCode', material.itemCode);
      // updateResultItem(itemId, 'unit', material.unitOfMeasure);
    } else {
      console.log(`✅ Selected custom material: ${materialName}`);
    }
    
    // Close the autocomplete dropdown
    updateAutocompleteState(itemId, {
      searchTerm: materialName,
      filteredMaterials: [],
      isOpen: false
    });
    
    console.log(`✅ Material selection completed for item ${itemId}`);
  };

  const closeAutocomplete = (itemId: string) => {
    updateAutocompleteState(itemId, { isOpen: false });
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
            Blueprint Scanner
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
                <h3 className="font-semibold text-gray-700">File Source</h3>
              </div>
              <div className="relative min-h-[400px] flex flex-col items-center justify-center bg-slate-100">
                {!selectedFile ? (
                  <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-center p-8 hover:bg-slate-200 transition-colors rounded-full w-full h-full flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-indigo-500 mb-4" />
                    <p className="text-gray-600 font-medium">Click to Upload Blueprint</p>
                    <p className="text-gray-400 text-sm mt-2">Supports images (JPG, PNG) and PDF files</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black/5 p-4 flex items-center justify-center">
                    {fileType === 'pdf' ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg">
                        <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-800">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500 mt-1">PDF Document</p>
                        <p className="text-xs text-gray-400 mt-2">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <img src={selectedImage} alt="Source" className="max-h-[500px] object-contain shadow-lg bg-white" />
                    )}
                    <button 
                      onClick={() => { 
                        setSelectedImage(null); 
                        setSelectedFile(null); 
                        setFileType(null); 
                        setScanResults([]); 
                        setRawText(''); 
                      }} 
                      className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {isProcessing && <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" /><p className="font-medium text-gray-800">{status}</p></div>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleImageUpload} />
            </div>

            <button onClick={runOCR} disabled={!selectedFile || isProcessing} className={`w-full py-4 rounded-xl font-bold text-lg shadow-sm flex items-center justify-center gap-2 transition-all ${!selectedFile || isProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}>
              <Scan className="w-6 h-6" /> {isProcessing ? 'Processing...' : 'Extract Data'}
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
                              <div className="relative w-full">
                                <input 
                                  type="text" 
                                  placeholder="Type to search materials..." 
                                  value={item.value} 
                                  onChange={(e) => {
                                    initAutocompleteState(item.id);
                                    handleAutocompleteInput(item.id, e.target.value);
                                  }}
                                  onFocus={() => {
                                    initAutocompleteState(item.id);
                                    if (item.value.length > 0) {
                                      const filtered = materials.filter((material: any) => {
                                        const searchTerm = item.value.toLowerCase();
                                        return (
                                          material.name.toLowerCase().includes(searchTerm) ||
                                          (material.itemCode && material.itemCode.toLowerCase().includes(searchTerm))
                                        );
                                      }).slice(0, 15);
                                      updateAutocompleteState(item.id, {
                                        filteredMaterials: filtered,
                                        isOpen: filtered.length > 0
                                      });
                                    }
                                  }}
                                  onBlur={() => {
                                    // Delay closing to allow clicking on dropdown items
                                    setTimeout(() => {
                                      console.log(`🔄 Closing autocomplete for item ${item.id} after blur`);
                                      closeAutocomplete(item.id);
                                    }, 300);
                                  }}
                                  onKeyDown={(e) => {
                                    // Add keyboard navigation support
                                    if (e.key === 'Escape') {
                                      closeAutocomplete(item.id);
                                    }
                                  }}
                                  className={`w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${!item.value ? 'border-red-300 bg-red-50 focus:bg-white' : 'border-gray-300'}`} 
                                />
                                
                                {/* Autocomplete Dropdown */}
                                {autocompleteStates[item.id]?.isOpen && (
                                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                    {autocompleteStates[item.id].filteredMaterials.length > 0 ? (
                                      autocompleteStates[item.id].filteredMaterials.map((material: any) => (
                                        <div
                                          key={material._id}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log(`🖱️ Clicked on material: ${material.name}`);
                                            
                                            // Add visual feedback
                                            const element = e.currentTarget;
                                            element.style.backgroundColor = '#10b981';
                                            element.style.color = 'white';
                                            
                                            setTimeout(() => {
                                              selectMaterial(item.id, material.name, material);
                                            }, 100);
                                          }}
                                          className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-all duration-200"
                                        >
                                          <div className="font-medium text-gray-900">{material.name}</div>
                                          <div className="flex justify-between items-center mt-1">
                                            {material.itemCode && (
                                              <div className="text-xs text-gray-500">Code: {material.itemCode}</div>
                                            )}
                                            {material.unitOfMeasure && (
                                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                {material.unitOfMeasure}
                                              </div>
                                            )}
                                          </div>
                                          {material.quantity !== undefined && (
                                            <div className="text-xs text-green-600 mt-1">
                                              Stock: {material.quantity} {material.unitOfMeasure || 'units'}
                                            </div>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                        No materials found matching "{autocompleteStates[item.id].searchTerm}"
                                      </div>
                                    )}
                                    
                                    {/* Show "Add as custom" option if no exact match */}
                                    {item.value && !materials.some((m: any) => m.name.toLowerCase() === item.value.toLowerCase()) && (
                                      <div
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log(`🖱️ Clicked on custom material: ${item.value}`);
                                          
                                          // Add visual feedback
                                          const element = e.currentTarget;
                                          element.style.backgroundColor = '#059669';
                                          element.style.color = 'white';
                                          
                                          setTimeout(() => {
                                            selectMaterial(item.id, item.value);
                                          }, 100);
                                        }}
                                        className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-t border-gray-200 bg-green-25 transition-all duration-200"
                                      >
                                        <div className="font-medium text-green-700 flex items-center gap-2">
                                          <Plus className="w-3 h-3" />
                                          Add "{item.value}" as custom material
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
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

// import React, { useState, useEffect, useRef } from 'react';
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/redux/store"; // Adjust path to your store
// import { 
//   Scan, 
//   Image as ImageIcon, 
//   Copy, 
//   Plus, 
//   X, 
//   Trash2, 
//   Loader2, 
//   Upload, 
//   History,
//   Database,
//   Save,
//   Check,
//   AlertCircle,
//   Eye,
//   EyeOff,
//   Key,
//   ListFilter,
//   Calendar,
//   Briefcase,
//   Layers
// } from 'lucide-react';

// // --- REDUX ACTIONS ---
// import { fetchProjects } from "@/redux/slices/projectSlice";
// import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
// import { createBulkMRS } from "@/redux/slices/mrsSlice";
// import { toast } from 'sonner'; // Assuming you use sonner or similar for toasts

// // --- TYPES ---
// interface MasterPair {
//   id: string;
//   key: string;
//   value: string;
//   active: boolean;
// }

// interface ScanResultItem {
//   id: string;
//   key: string;
//   value: string;
//   count: number;
//   isMasterMatch: boolean;
// }

// interface OCRScan {
//   id: number;
//   originalText: string;
//   results: ScanResultItem[];
//   preview?: string; 
//   timestamp: string;
// }

// // --- CONSTANTS ---
// const STORAGE_KEYS = {
//   OCR_HISTORY: "OCR_HISTORY_GEMINI_V2",
//   MASTER_DATA: "MASTER_DATA_V2",
//   API_KEY: "GEMINI_API_KEY"
// };

// const Drawing: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>();

//   // --- REDUX STATE ---
//   const { projects } = useSelector((state: RootState) => state.projects);
//   const { wbs } = useSelector((state: RootState) => state.wbs);
  
//   // --- UI STATE ---
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [status, setStatus] = useState('');
//   const [activeTab, setActiveTab] = useState<'scan' | 'master'>('scan');
//   const [showKeyInput, setShowKeyInput] = useState(false);

//   // --- SAVE MODAL STATE ---
//   const [showSaveModal, setShowSaveModal] = useState(false);
//   const [selectedProjectId, setSelectedProjectId] = useState<string>("");
//   const [selectedWbsId, setSelectedWbsId] = useState<string>("");
//   const [requiredDate, setRequiredDate] = useState<string>("");
//   const [isSaving, setIsSaving] = useState(false);

//   // --- HISTORY MODAL STATE ---
//   const [viewHistoryItem, setViewHistoryItem] = useState<OCRScan | null>(null);

//   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

//   // --- DATA STATE ---
//   // 1. Initialize Master Data directly from Storage to prevent overwriting on mount
//   const [masterData, setMasterData] = useState<MasterPair[]>(() => {
//     try {
//       const saved = localStorage.getItem(STORAGE_KEYS.MASTER_DATA);
//       return saved ? JSON.parse(saved) : [];
//     } catch (e) {
//       console.error("Failed to load master data", e);
//       return [];
//     }
//   });

//   // 2. Initialize History directly from Storage
//   const [history, setHistory] = useState<OCRScan[]>(() => {
//     try {
//       const saved = localStorage.getItem(STORAGE_KEYS.OCR_HISTORY);
//       return saved ? JSON.parse(saved) : [];
//     } catch (e) {
//       console.error("Failed to load history", e);
//       return [];
//     }
//   });

//   const [scanResults, setScanResults] = useState<ScanResultItem[]>([]);
//   const [rawText, setRawText] = useState('');

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // --- INIT (Only Network Calls) ---
//   useEffect(() => {
//     // Fetch Projects for Dropdown
//     dispatch(fetchProjects({ page: 1, limit: 100 }));
//   }, [dispatch]);

//   // Fetch WBS when Project Changes
//   useEffect(() => {
//     if (selectedProjectId) {
//       dispatch(fetchWbsByProject(selectedProjectId));
//     }
//   }, [selectedProjectId, dispatch]);

//   // --- PERSISTENCE EFFECTS ---
//   // These will now safe to run because state is already initialized with data
//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEYS.MASTER_DATA, JSON.stringify(masterData));
//   }, [masterData]);

//   useEffect(() => {
//     try {
//         localStorage.setItem(STORAGE_KEYS.OCR_HISTORY, JSON.stringify(history));
//     } catch (e) {
//         console.warn("LocalStorage quota exceeded, could not save history image.");
//     }
//   }, [history]);

//   // --- HELPER UTILS ---
//   const urlToBase64 = async (url: string): Promise<string> => {
//     const response = await fetch(url);
//     const blob = await response.blob();
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         const base64String = reader.result as string;
//         resolve(base64String.split(',')[1]); 
//       };
//       reader.onerror = reject;
//       reader.readAsDataURL(blob);
//     });
//   };

//   // --- GEMINI ACTIONS ---
//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files?.[0]) {
//       const url = URL.createObjectURL(e.target.files[0]);
//       setSelectedImage(url);
//       setRawText('');
//       setScanResults([]);
//       setStatus('Image loaded. Ready to scan.');
//     }
//   };

//   const runOCR = async () => {
//     if (!selectedImage) return;
//     if (!apiKey) {
//         alert("Please enter a valid API Key.");
//         setShowKeyInput(true);
//         return;
//     }

//     setIsProcessing(true);
//     setStatus('Preparing image...');

//     try {
//       const genAI = new GoogleGenerativeAI(apiKey);
//       const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//       const base64Data = await urlToBase64(selectedImage);
      
//       const imagePart = {
//         inlineData: {
//           data: base64Data,
//           mimeType: "image/jpeg",
//         },
//       };

//       const prompt = `
//         Look at this technical drawing or blueprint. 
//         Extract ALL text visible in the image with there units like INCH, CM, KG, L etc like this W5 6 INCH, P2, W10 25 CM, P5 10 INCH.
//         Return the raw text exactly as it appears. 
//         Do not markdown format it. 
//         Just give me the content.
//       `;

//       setStatus('Processing...');

//       const result = await model.generateContent([prompt, imagePart]);
//       const response = await result.response;
//       const text = response.text();

//       setRawText(text);

//       setStatus('Processing extracted text...');
//       const results = processExtractedText(text, masterData);
//       setScanResults(results);

//       // Save to History
//       const newScan: OCRScan = {
//         id: Date.now(),
//         originalText: text,
//         results: results,
//         preview: selectedImage,
//         timestamp: new Date().toLocaleString()
//       };
//       setHistory(prev => [newScan, ...prev]);

//       setStatus('Complete');

//     } catch (err: any) {
//       console.error("Error:", err);
//       setStatus(`Error: ${err.message || 'Failed to process image'}`);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const processExtractedText = (text: string, masters: MasterPair[]): ScanResultItem[] => {
//     const rawTokens = text.split(/\s+/).map(t => t.trim()).filter(t => t.length > 0);
//     const tokenMap = new Map<string, number>();
    
//     rawTokens.forEach(token => {
//       const key = token.toUpperCase();
//       tokenMap.set(key, (tokenMap.get(key) || 0) + 1);
//     });

//     const results: ScanResultItem[] = [];
    
//     tokenMap.forEach((count, key) => {
//       const masterMatch = masters.find(m => m.active && m.key.toUpperCase() === key);
//       results.push({
//         id: crypto.randomUUID(),
//         key: key, 
//         value: masterMatch ? masterMatch.value : '', 
//         count: count,
//         isMasterMatch: !!masterMatch
//       });
//     });

//     return results.sort((a, b) => {
//       if (a.isMasterMatch && !b.isMasterMatch) return -1;
//       if (!a.isMasterMatch && b.isMasterMatch) return 1;
//       return b.count - a.count;
//     });
//   };

//   // --- CRUD HANDLERS ---
//   const updateResultItem = (id: string, field: keyof ScanResultItem, val: string | number) => {
//     setScanResults(prev => prev.map(item => 
//       item.id === id ? { ...item, [field]: val } : item
//     ));
//   };

//   const deleteResultItem = (id: string) => {
//     setScanResults(prev => prev.filter(item => item.id !== id));
//   };

//   // --- SAVE TO MRS LOGIC ---
//   const handleOpenSaveModal = () => {
//     if (scanResults.length === 0) {
//         toast.error("No items to save.");
//         return;
//     }
//     setShowSaveModal(true);
//   };

//   const handleFinalSave = async () => {
//     if (!selectedProjectId || !selectedWbsId) {
//         toast.error("Please select a Project and a WBS Task.");
//         return;
//     }

//     // Double check meanings
//     const missingMeanings = scanResults.filter(i => !i.value || i.value.trim() === '');
//     if (missingMeanings.length > 0) {
//         toast.error(`Cannot save: ${missingMeanings.length} items are missing a Meaning/Value.`);
//         return;
//     }

//     setIsSaving(true);
//     try {
//         const selectedWbs = wbs.find(w => w.id === selectedWbsId);
        
//         // Prepare Payload
//         const payload = scanResults.map(item => ({
//             projectId: selectedProjectId,
//             task: selectedWbs?.name || "Unspecified Task", // The MRS model expects a string for task name
//             item: item.value, // Mapping MEANING to Item Name
//             quantity: item.count,
//             status: "open",
//             requiredDate: requiredDate || undefined
//         }));

//         await dispatch(createBulkMRS(payload)).unwrap();
        
//         toast.success("MRS Items created successfully!");
//         setShowSaveModal(false);
//         setScanResults([]); // Clear results after save
//         setRawText('');
//         setSelectedImage(null);
//     } catch (error: any) {
//         console.error("Save Failed", error);
//         toast.error(typeof error === 'string' ? error : "Failed to save MRS items.");
//     } finally {
//         setIsSaving(false);
//     }
//   };

//   // --- MASTER DATA HANDLERS ---
//   const addMasterItem = () => setMasterData([...masterData, { id: crypto.randomUUID(), key: '', value: '', active: true }]);
//   const updateMasterItem = (id: string, field: 'key' | 'value', val: string) => setMasterData(masterData.map(item => item.id === id ? { ...item, [field]: val } : item));
//   const toggleMasterActive = (id: string) => setMasterData(masterData.map(item => item.id === id ? { ...item, active: !item.active } : item));
//   const deleteMasterItem = (id: string) => setMasterData(masterData.filter(item => item.id !== id));

//   // --- COMPUTED ---
//   const allMeaningsFilled = scanResults.length > 0 && scanResults.every(r => r.value && r.value.trim() !== '');

//   return (
//     <div className="max-w-6xl mx-auto p-6 font-sans text-gray-800 space-y-6 relative">
      
//       {/* Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
//             <Scan className="w-8 h-8 text-indigo-600" />
//             Blueprint Scanner
//           </h1>
//         </div>
        
//         <div className="flex items-center gap-3">
//             <div className="flex bg-gray-100 p-1 rounded-lg">
//                 <button onClick={() => setActiveTab('scan')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'scan' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Scanner</button>
//                 <button onClick={() => setActiveTab('master')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'master' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Master Data</button>
//             </div>
//         </div>
//       </div>

//       {/* --- MASTER DATA TAB --- */}
//       {activeTab === 'master' && (
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
//            {/* (Master Data UI Code - kept same as before) */}
//            <div className="flex justify-between items-center mb-6">
//             <div>
//               <h2 className="text-lg font-semibold flex items-center gap-2"><Database className="w-5 h-5 text-indigo-500" />Configure Master Data</h2>
//             </div>
//             <button onClick={addMasterItem} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus className="w-4 h-4" /> Add Item</button>
//           </div>
//           <div className="space-y-3">
//             {masterData.map((item, index) => (
//               <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
//                 <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full border text-xs font-bold text-gray-400">{index + 1}</div>
//                 <input type="text" value={item.key} onChange={(e) => updateMasterItem(item.id, 'key', e.target.value)} placeholder="Key (e.g. P7)" className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
//                 <input type="text" value={item.value} onChange={(e) => updateMasterItem(item.id, 'value', e.target.value)} placeholder="Value (e.g. Steel Rods)" className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
//                 <button onClick={() => deleteMasterItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* --- SCANNER TAB --- */}
//       {activeTab === 'scan' && (
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
//           {/* Left Column: Image Area */}
//           <div className="lg:col-span-7 space-y-4">
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
//               <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
//                 <h3 className="font-semibold text-gray-700">Image Source</h3>
//               </div>
//               <div className="relative min-h-[400px] flex flex-col items-center justify-center bg-slate-100">
//                 {!selectedImage ? (
//                   <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-center p-8 hover:bg-slate-200 transition-colors rounded-full w-full h-full flex flex-col items-center justify-center">
//                     <Upload className="w-8 h-8 text-indigo-500 mb-4" />
//                     <p className="text-gray-600 font-medium">Click to Upload Blueprint</p>
//                   </div>
//                 ) : (
//                   <div className="relative w-full h-full bg-black/5 p-4 flex items-center justify-center">
//                     <img src={selectedImage} alt="Source" className="max-h-[500px] object-contain shadow-lg bg-white" />
//                     <button onClick={() => { setSelectedImage(null); setScanResults([]); setRawText(''); }} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:text-red-600"><X className="w-5 h-5" /></button>
//                   </div>
//                 )}
//                 {isProcessing && <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" /><p className="font-medium text-gray-800">{status}</p></div>}
//               </div>
//               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
//             </div>
          
//             <button onClick={runOCR} disabled={!selectedImage || isProcessing} className={`w-full py-4 rounded-xl font-bold text-lg shadow-sm flex items-center justify-center gap-2 transition-all ${!selectedImage || isProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}>
//               <Scan className="w-6 h-6" /> {isProcessing ? 'Processing...' : 'Start Analyzing'}
//             </button>
//           </div>

//           {/* Right Column: Results Area */}
//           <div className="lg:col-span-5 space-y-4">
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
//               <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
//                 <h3 className="font-semibold text-gray-700 flex items-center gap-2"><ListFilter className="w-4 h-4 text-indigo-600" /> Extracted Items</h3>
//                 {scanResults.length > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">{scanResults.length} Found</span>}
//               </div>

//               <div className="flex-1 p-3 overflow-y-auto max-h-[600px] bg-slate-50">
//                 {scanResults.length === 0 ? (
//                   <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 min-h-[300px]">
//                     <AlertCircle className="w-12 h-12 text-gray-300" />
//                     <p className="text-center text-sm">Upload an image and run scan to see data.</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {scanResults.map((item) => (
//                       <div key={item.id} className={`relative p-3 rounded-lg shadow-sm border transition-all ${item.isMasterMatch ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'}`}>
//                         <div className="flex gap-3">
//                           <div className="flex flex-col items-center gap-1">
//                             <input type="number" value={item.count} onChange={(e) => updateResultItem(item.id, 'count', parseInt(e.target.value) || 0)} className="w-12 text-center bg-white border border-gray-300 rounded-md py-1 font-bold text-lg text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
//                             <span className="text-[9px] text-gray-400 uppercase font-bold">Count</span>
//                           </div>
//                           <div className="flex-1 space-y-2">
//                             <div className="flex items-center gap-2">
//                                 <span className="text-[10px] uppercase font-bold text-gray-400 w-8">Key</span>
//                                 <input type="text" value={item.key} onChange={(e) => updateResultItem(item.id, 'key', e.target.value)} className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-800 focus:outline-none" />
//                             </div>
//                             <div className="flex items-center gap-2">
//                                 <span className="text-[10px] uppercase font-bold text-gray-400 w-8">Value</span>
//                                 <input type="text" placeholder="Required for save..." value={item.value} onChange={(e) => updateResultItem(item.id, 'value', e.target.value)} className={`w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${!item.value ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
//                             </div>
//                           </div>
//                           <button onClick={() => deleteResultItem(item.id)} className="text-gray-400 hover:text-red-500 self-center p-2"><Trash2 className="w-4 h-4" /></button>
//                         </div>
//                       </div>
//                     ))}
                    
//                     <div className="pt-4 mt-4 border-t border-gray-200">
//                        {!allMeaningsFilled && (
//                          <div className="text-xs text-red-500 mb-2 flex items-center gap-1">
//                            <AlertCircle className="w-3 h-3" />
//                            Fill the required fields. Or delete them.
//                          </div>
//                        )}
//                        <button 
//                         onClick={handleOpenSaveModal}
//                         disabled={!allMeaningsFilled}
//                         className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-sm transition-all
//                             ${allMeaningsFilled ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
//                         `}
//                        >
//                          <Save className="w-5 h-5" /> Save Final Results
//                        </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* --- HISTORY SECTION --- */}
//       {history.length > 0 && activeTab === 'scan' && (
//         <div className="mt-8">
//            <div className="flex justify-between items-center mb-4">
//              <h3 className="font-bold text-gray-700 flex items-center gap-2"><History className="w-5 h-5" /> Recent Scans</h3>
//              <button onClick={() => setHistory([])} className="text-xs text-red-500 hover:text-red-700">Clear History</button>
//            </div>
           
//            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//              {history.slice(0, 3).map(scan => (
//                <div key={scan.id} onClick={() => setViewHistoryItem(scan)} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition">
//                  <div className="flex items-start gap-3">
//                    {scan.preview && <img src={scan.preview} className="w-12 h-12 object-cover rounded bg-gray-100" />}
//                    <div>
//                      <p className="text-xs text-gray-400">{scan.timestamp}</p>
//                      <p className="font-medium text-sm text-gray-800 mt-1">{scan.results.length} unique items found</p>
//                    </div>
//                  </div>
//                </div>
//              ))}
//            </div>
//         </div>
//       )}

//       {/* --- MODAL: SAVE TO MRS --- */}
//       {showSaveModal && (
//         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
//                 <div className="flex justify-between items-center mb-6">
//                     <h2 className="text-xl font-bold flex items-center gap-2">
//                         <Save className="w-5 h-5 text-indigo-600" />
//                         Save to Project (MRS)
//                     </h2>
//                     <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
//                 </div>

//                 <div className="space-y-4">
//                     {/* Project Dropdown */}
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Select Project</label>
//                         <select 
//                             className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
//                             value={selectedProjectId}
//                             onChange={(e) => {
//                                 setSelectedProjectId(e.target.value);
//                                 setSelectedWbsId(""); // Reset WBS
//                             }}
//                         >
//                             <option value="">-- Choose Project --</option>
//                             {projects.map((p: any) => (
//                                 <option key={p._id} value={p._id}>{p.name} ({p.code || 'No Code'})</option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* WBS Dropdown */}
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Layers className="w-4 h-4" /> Select WBS Task</label>
//                         <select 
//                             className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
//                             value={selectedWbsId}
//                             onChange={(e) => setSelectedWbsId(e.target.value)}
//                             disabled={!selectedProjectId}
//                         >
//                             <option value="">-- Choose WBS Task --</option>
//                             {wbs.map((w: any) => (
//                                 <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* Required Date */}
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> Required Date (Optional)</label>
//                         <input 
//                             type="date"
//                             className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
//                             value={requiredDate}
//                             onChange={(e) => setRequiredDate(e.target.value)}
//                         />
//                     </div>

//                     <div className="bg-indigo-50 text-indigo-800 p-3 rounded-lg text-sm mt-2">
//                         <p className="font-semibold">Summary:</p>
//                         <p>You are about to create <strong>{scanResults.length}</strong> MRS items.</p>
//                     </div>
//                 </div>

//                 <div className="flex gap-3 justify-end mt-8">
//                     <button 
//                         onClick={() => setShowSaveModal(false)}
//                         className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
//                     >
//                         Cancel
//                     </button>
//                     <button 
//                         onClick={handleFinalSave}
//                         disabled={isSaving || !selectedProjectId || !selectedWbsId}
//                         className={`px-4 py-2 text-white rounded-lg font-medium flex items-center gap-2
//                             ${isSaving || !selectedProjectId || !selectedWbsId ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
//                         `}
//                     >
//                         {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
//                         Confirm Save
//                     </button>
//                 </div>
//             </div>
//         </div>
//       )}

//       {/* --- MODAL: HISTORY VIEWER --- */}
//       {viewHistoryItem && (
//         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
//              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
//                 <div className="p-4 border-b flex justify-between items-center bg-gray-50">
//                     <div>
//                         <h2 className="text-lg font-bold text-gray-800">Scan History Detail</h2>
//                         <p className="text-xs text-gray-500">{viewHistoryItem.timestamp}</p>
//                     </div>
//                     <button onClick={() => setViewHistoryItem(null)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
//                 </div>
                
//                 <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {/* Image View */}
//                     <div className="bg-slate-100 rounded-lg flex items-center justify-center border p-2">
//                          {viewHistoryItem.preview ? (
//                             <img src={viewHistoryItem.preview} alt="Scan Snapshot" className="max-w-full max-h-[500px] object-contain" />
//                          ) : (
//                              <span className="text-gray-400">Image not available</span>
//                          )}
//                     </div>

//                     {/* Data View */}
//                     <div className="overflow-auto border rounded-lg">
//                         <table className="w-full text-sm text-left">
//                             <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0">
//                                 <tr>
//                                     <th className="p-3 border-b">Key</th>
//                                     <th className="p-3 border-b">Meaning (Item)</th>
//                                     <th className="p-3 border-b text-center">Qty</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {viewHistoryItem.results.map((r) => (
//                                     <tr key={r.id} className="border-b hover:bg-gray-50">
//                                         <td className="p-3 font-mono font-medium text-indigo-600">{r.key}</td>
//                                         <td className="p-3">{r.value || <span className="text-gray-400 italic">No Meaning</span>}</td>
//                                         <td className="p-3 text-center font-bold">{r.count}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>

//                 <div className="p-4 border-t bg-gray-50 flex justify-end">
//                     <button onClick={() => setViewHistoryItem(null)} className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
//                         Close
//                     </button>
//                 </div>
//              </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default Drawing;