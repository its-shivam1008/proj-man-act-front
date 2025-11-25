import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ScanLine, Package, Truck, FileText, Search, Plus, CheckCircle, AlertTriangle, X, Barcode as BarcodeIcon, Edit, Trash2, ShieldAlert } from 'lucide-react';
import { storage, STORAGE_KEYS, ensureInitialized } from '@/lib/storage'; // Adjust path to your storage.ts file
import { usePermission } from '@/hooks/userPermission';

// Add this key to STORAGE_KEYS in storage.ts
// BARCODE_SCANS: "BARCODE_SCANS",

// And in ensureInitialized defaults:
// [STORAGE_KEYS.BARCODE_SCANS]: [
//   { id: 1, code: 'SP-001-2024', item: 'Steel Plates', action: 'Stock Update', timestamp: '2024-01-15 10:30', status: 'success' },
//   { id: 2, code: 'AR-002-2024', item: 'Aluminum Rods', action: 'Inventory Check', timestamp: '2024-01-15 09:15', status: 'success' },
//   { id: 3, code: 'HP-003-2024', item: 'Hydraulic Pumps', action: 'Shipping', timestamp: '2024-01-14 16:45', status: 'warning' },
// ],

const Barcode: React.FC = () => {
  const [scanResult, setScanResult] = useState('');
  const [scanMode, setScanMode] = useState('inventory');
  const [recentScans, setRecentScans] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({ itemName: '', category: 'steel' });
  const [generatedCode, setGeneratedCode] = useState('');
  const [editingScan, setEditingScan] = useState(null); // For update mode

  const canView = usePermission('barcode', 'view');

  // Initialize storage and load recentScans on mount
  useEffect(() => {
    ensureInitialized();
    const loadedScans = storage.get(STORAGE_KEYS.BARCODE_SCANS, [
      { id: 1, code: 'SP-001-2024', item: 'Steel Plates', action: 'Stock Update', timestamp: '2024-01-15 10:30', status: 'success' },
      { id: 2, code: 'AR-002-2024', item: 'Aluminum Rods', action: 'Inventory Check', timestamp: '2024-01-15 09:15', status: 'success' },
      { id: 3, code: 'HP-003-2024', item: 'Hydraulic Pumps', action: 'Shipping', timestamp: '2024-01-14 16:45', status: 'warning' },
    ]);
    setRecentScans(loadedScans);
  }, []);

  // Save recentScans to storage whenever it changes
  useEffect(() => {
    if (recentScans.length > 0) {
      storage.set(STORAGE_KEYS.BARCODE_SCANS, recentScans.slice(0, 10)); // Limit to last 10
    }
  }, [recentScans]);

  // CRUD Functions
  const addScan = (newScan: any) => {
    setRecentScans(prev => [newScan, ...prev.slice(0, 9)]);
  };

  const updateScan = (id: number, updatedFields: Partial<any>) => {
    setRecentScans(prev => prev.map(scan => 
      scan.id === id ? { ...scan, ...updatedFields } : scan
    ));
    setEditingScan(null);
  };

  const deleteScan = (id: number) => {
    if (confirm('Are you sure you want to delete this scan?')) {
      setRecentScans(prev => prev.filter(scan => scan.id !== id));
    }
  };

  const handleScan = (code: string) => {
    if (code.trim()) {
      const newScan = {
        id: Date.now(), // Use timestamp as ID for uniqueness
        code: code,
        item: 'Unknown Item', // In real app, lookup from inventory
        action: scanMode === 'inventory' ? 'Stock Update' : 
                scanMode === 'shipping' ? 'Shipping' : 
                scanMode === 'quality' ? 'Quality Check' : 'Maintenance',
        timestamp: new Date().toLocaleString(),
        status: 'success'
      };
      addScan(newScan);
      setScanResult('');
    }
  };

  const handleGenerateBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (generateForm.itemName.trim()) {
      const prefixes = {
        steel: 'SP',
        aluminum: 'AR',
        hydraulic: 'HP',
        electrical: 'EL',
      };
      const prefix = prefixes[generateForm.category as keyof typeof prefixes] || 'UN';
      const year = new Date().getFullYear();
      const number = Math.floor(Math.random() * 1000) + 1;
      const newCode = `${prefix}-${number.toString().padStart(3, '0')}-${year}`;
      
      setGeneratedCode(newCode);
      
      const newScan = {
        id: Date.now(),
        code: newCode,
        item: generateForm.itemName,
        action: 'Barcode Generated',
        timestamp: new Date().toLocaleString(),
        status: 'success'
      };
      addScan(newScan);
      
      setTimeout(() => {
        setGenerateForm({ itemName: '', category: 'steel' });
        setGeneratedCode('');
        setShowGenerateModal(false);
      }, 2000);
    }
  };

  // Handle reprocess (simple update example: change status to 'success' and action)
  const handleReprocess = (scan: any) => {
    updateScan(scan.id, { 
      status: 'success', 
      action: `${scan.action} (Reprocessed)`,
      timestamp: new Date().toLocaleString() 
    });
  };

  // Handle edit (open modal or inline, here simple prompt for demo)
  const handleEdit = (scan: any) => {
    const newItem = prompt('Edit item name:', scan.item);
    if (newItem !== null && newItem.trim()) {
      updateScan(scan.id, { item: newItem.trim() });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const categories = [
    { value: 'steel', label: 'Steel Products' },
    { value: 'aluminum', label: 'Aluminum Products' },
    { value: 'hydraulic', label: 'Hydraulic Components' },
    { value: 'electrical', label: 'Electrical Parts' },
  ];

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }


  return (
    // <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Barcode Scanner</h1>
            <p className="mt-1 text-sm text-gray-600">
              Scan barcodes for inventory tracking, shipping, and quality control
            </p>
          </div>
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Barcode
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ScanLine className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Scans Today</p>
                  <p className="text-2xl font-semibold text-gray-900">{recentScans.length}</p> {/* Dynamic from state */}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Inventory Updates</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {recentScans.filter(s => s.action.includes('Stock Update') || s.action.includes('Inventory Check')).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Truck className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Shipping Scans</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {recentScans.filter(s => s.action.includes('Shipping')).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Quality Checks</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {recentScans.filter(s => s.action.includes('Quality Check')).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scanner Interface */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <ScanLine className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Camera viewfinder</p>
                <p className="text-xs text-gray-400">Align barcode within the frame</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Scan Mode:</label>
              <select
                value={scanMode}
                onChange={(e) => setScanMode(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="inventory">Inventory Update</option>
                <option value="shipping">Shipping</option>
                <option value="quality">Quality Check</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manual Entry
                </label>
                <input
                  type="text"
                  value={scanResult}
                  onChange={(e) => setScanResult(e.target.value)}
                  placeholder="Enter barcode manually..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => handleScan(scanResult)}
                className="self-end bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Process Scan
              </button>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Scans</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {scan.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scan.item}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scan.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scan.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(scan.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(scan.status)}`}>
                          {scan.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(scan)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4 inline" /> Edit
                      </button>
                      <button 
                        onClick={() => handleReprocess(scan)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Reprocess
                      </button>
                      <button 
                        onClick={() => deleteScan(scan.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4 inline" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Barcode Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <BarcodeIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">Generate Barcode</h2>
                  </div>
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleGenerateBarcode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={generateForm.itemName}
                      onChange={(e) => setGenerateForm({ ...generateForm, itemName: e.target.value })}
                      placeholder="e.g., Steel Plates"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={generateForm.category}
                      onChange={(e) => setGenerateForm({ ...generateForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Generate Barcode
                  </button>
                </form>
                {generatedCode && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">Generated Barcode:</p>
                    <div className="flex items-center justify-between bg-white p-3 rounded border">
                      <span className="font-mono text-lg font-semibold">{generatedCode}</span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    // </Layout>
  );
};

export default Barcode;