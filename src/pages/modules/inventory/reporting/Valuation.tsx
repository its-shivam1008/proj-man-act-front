import React, { useState } from 'react';
import { useData } from '../../../../contexts/DataContext';
import Layout from '../../../../components/Layout';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Package,
  TrendingUp,
  BarChart3,
  Edit,
  Eye,
  Trash2,
  X
} from 'lucide-react';

const Valuation: React.FC = () => {
  const { inventory } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('this-month');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Sample valuation data
  const [valuationData] = useState([
    {
      id: 'VAL-001',
      date: '2024-01-15',
      reference: 'REC-001',
      product: 'Steel Plates',
      quantity: 250,
      unitValue: 150.00,
      totalValue: 37500.00,
      method: 'FIFO'
    },
    {
      id: 'VAL-002',
      date: '2024-01-14',
      reference: 'DEL-001',
      product: 'Hydraulic Pumps',
      quantity: -15,
      unitValue: 500.00,
      totalValue: -7500.00,
      method: 'LIFO'
    },
    {
      id: 'VAL-003',
      date: '2024-01-13',
      reference: 'ADJ-001',
      product: 'Aluminum Rods',
      quantity: 5,
      unitValue: 75.00,
      totalValue: 375.00,
      method: 'Average Cost'
    }
  ]);

  const filteredValuation = valuationData.filter(item => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || item.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement update logic here, e.g., update via context
    // Assuming useData has an updateValuation function: updateValuation(selectedItem.id, formData);
    console.log('Updating valuation:', selectedItem);
    setShowUpdateForm(false);
    setSelectedItem(null);
  };

  const CreateValuationForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Valuation</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reference number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select Product</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity (+ for in, - for out)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter unit value"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valuation Method
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="FIFO">FIFO (First In, First Out)</option>
                  <option value="LIFO">LIFO (Last In, First Out)</option>
                  <option value="Average Cost">Average Cost</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about this valuation..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Valuation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const ViewValuationForm = () => {
    if (!selectedItem) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">View Valuation</h3>
              <button
                onClick={() => {
                  setShowViewForm(false);
                  setSelectedItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <p className="text-sm text-gray-900">{selectedItem.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900">{selectedItem.date}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <p className="text-sm text-gray-900">{selectedItem.reference}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900">{selectedItem.product}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <p className={`text-sm font-medium ${selectedItem.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedItem.quantity > 0 ? '+' : ''}{selectedItem.quantity}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Value</label>
                  <p className="text-sm text-gray-900">${selectedItem.unitValue.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
                  <p className={`text-sm font-medium ${selectedItem.totalValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${selectedItem.totalValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(selectedItem.method)}`}>
                    {selectedItem.method}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewForm(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UpdateValuationForm = () => {
    if (!selectedItem) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Valuation</h3>
              <button
                onClick={() => {
                  setShowUpdateForm(false);
                  setSelectedItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={handleUpdateSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    defaultValue={selectedItem.date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedItem.reference}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select 
                    defaultValue={selectedItem.product}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Select Product</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    defaultValue={selectedItem.quantity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedItem.unitValue}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valuation Method
                  </label>
                  <select 
                    defaultValue={selectedItem.method}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="FIFO">FIFO (First In, First Out)</option>
                    <option value="LIFO">LIFO (Last In, First Out)</option>
                    <option value="Average Cost">Average Cost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  defaultValue={selectedItem.notes || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Update Valuation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'FIFO':
        return 'bg-green-100 text-green-800';
      case 'LIFO':
        return 'bg-blue-100 text-blue-800';
      case 'Average Cost':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalValuation = valuationData.reduce((sum, item) => sum + item.totalValue, 0);
  const positiveValuation = valuationData.filter(item => item.totalValue > 0).reduce((sum, item) => sum + item.totalValue, 0);
  const negativeValuation = Math.abs(valuationData.filter(item => item.totalValue < 0).reduce((sum, item) => sum + item.totalValue, 0));

  return (
    // <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Valuation</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track inventory valuation with FIFO, LIFO, and Average Cost methods
            </p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Valuation
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Valuation</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${totalValuation.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Inbound Value</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${positiveValuation.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Outbound Value</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${negativeValuation.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Records</p>
                  <p className="text-2xl font-semibold text-gray-900">{valuationData.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Valuation Methods Overview */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Valuation Methods Overview</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-green-800">FIFO Method</h4>
                  <p className="text-xs text-green-600">First In, First Out</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {valuationData.filter(item => item.method === 'FIFO').length}
                </span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-800">LIFO Method</h4>
                  <p className="text-xs text-blue-600">Last In, First Out</p>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {valuationData.filter(item => item.method === 'LIFO').length}
                </span>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-purple-800">Average Cost</h4>
                  <p className="text-xs text-purple-600">Weighted Average</p>
                </div>
                <span className="text-lg font-bold text-purple-600">
                  {valuationData.filter(item => item.method === 'Average Cost').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search valuations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="FIFO">FIFO</option>
              <option value="LIFO">LIFO</option>
              <option value="Average Cost">Average Cost</option>
            </select>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-quarter">This Quarter</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Valuation Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredValuation.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {item.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      {item.product}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.quantity > 0 ? '+' : ''}{item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.unitValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`${item.totalValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${item.totalValue.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(item.method)}`}>
                      {item.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowViewForm(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-900 mr-3"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowUpdateForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Valuation Form Modal */}
        {showCreateForm && <CreateValuationForm />}
        {/* View Valuation Form Modal */}
        {showViewForm && <ViewValuationForm />}
        {/* Update Valuation Form Modal */}
        {showUpdateForm && <UpdateValuationForm />}
      </div>
    // </Layout>
  );
};

export default Valuation;