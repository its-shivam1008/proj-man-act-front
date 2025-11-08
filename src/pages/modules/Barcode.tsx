import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { ScanLine, Package, Truck, FileText, Search, Plus, CheckCircle, AlertTriangle } from 'lucide-react';

const Barcode: React.FC = () => {
  const [scanResult, setScanResult] = useState('');
  const [scanMode, setScanMode] = useState('inventory');
  const [recentScans, setRecentScans] = useState([
    { id: 1, code: 'SP-001-2024', item: 'Steel Plates', action: 'Stock Update', timestamp: '2024-01-15 10:30', status: 'success' },
    { id: 2, code: 'AR-002-2024', item: 'Aluminum Rods', action: 'Inventory Check', timestamp: '2024-01-15 09:15', status: 'success' },
    { id: 3, code: 'HP-003-2024', item: 'Hydraulic Pumps', action: 'Shipping', timestamp: '2024-01-14 16:45', status: 'warning' },
  ]);

  const handleScan = (code: string) => {
    if (code.trim()) {
      const newScan = {
        id: recentScans.length + 1,
        code: code,
        item: 'Unknown Item',
        action: scanMode === 'inventory' ? 'Stock Update' : 
                scanMode === 'shipping' ? 'Shipping' : 'Quality Check',
        timestamp: new Date().toLocaleString(),
        status: 'success'
      };
      setRecentScans([newScan, ...recentScans.slice(0, 9)]);
      setScanResult('');
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Barcode Scanner</h1>
            <p className="mt-1 text-sm text-gray-600">
              Scan barcodes for inventory tracking, shipping, and quality control
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
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
                  <p className="text-2xl font-semibold text-gray-900">127</p>
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
                  <p className="text-2xl font-semibold text-gray-900">89</p>
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
                  <p className="text-2xl font-semibold text-gray-900">23</p>
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
                  <p className="text-2xl font-semibold text-gray-900">15</p>
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
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View Details</button>
                      <button className="text-green-600 hover:text-green-900">Reprocess</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Barcode;