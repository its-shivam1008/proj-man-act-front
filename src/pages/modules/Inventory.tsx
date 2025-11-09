import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import Layout from '../../components/Layout';
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  Calendar,
  MapPin,
  Truck,
  Trash2,
  Edit,
  Eye,
  Settings,
  ChevronDown
} from 'lucide-react';

const Inventory: React.FC = () => {
  const { inventory } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this-month');
  const [showOperationsDropdown, setShowOperationsDropdown] = useState(false);
  const [showReportingDropdown, setShowReportingDropdown] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);

  const AddProductForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Product</h3>
            <button
              onClick={() => setShowAddProductForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Type</option>
                  <option value="goods">Goods</option>
                  <option value="services">Services</option>
                  <option value="combo">Combo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Category</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Components">Components</option>
                  <option value="Finished Goods">Finished Goods</option>
                  <option value="Services">Services</option>
                  <option value="Expenses">Expenses</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Code
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reference code"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="trackInventory"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                defaultChecked
              />
              <label htmlFor="trackInventory" className="ml-2 text-sm text-gray-700">
                Track Inventory
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory Available
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Current stock quantity"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum stock alert level"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Tax %
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Tax %
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter or scan barcode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upsell Suggestion
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select related product</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product description..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddProductForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'low-stock':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'out-of-stock':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low-stock':
        return 'bg-orange-100 text-orange-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { 
      id: 'operations', 
      name: 'Operations', 
      icon: Truck,
      hasDropdown: true,
      dropdownItems: [
        { name: 'Receipt', path: '/inventory/receipt' },
        { name: 'Deliveries', path: '/inventory/deliveries' },
        { name: 'Scrap Order', path: '/inventory/scrap-order' },
        { name: 'Forecasting', path: '/inventory/forecasting' }
      ]
    },
    { id: 'products', name: 'Products', icon: Package },
    { 
      id: 'reporting', 
      name: 'Reporting', 
      icon: TrendingUp,
      hasDropdown: true,
      dropdownItems: [
        { name: 'Stock', path: '/inventory/reporting/stock' },
        { name: 'Inventory History', path: '/inventory/reporting/inventory-history' },
        { name: 'Moves Analysis', path: '/inventory/reporting/moves-analysis' },
        { name: 'Valuation', path: '/inventory/reporting/valuation' }
      ]
    },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const handleOperationClick = (path: string) => {
    setShowOperationsDropdown(false);
    setShowReportingDropdown(false);
    navigate(path);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">{inventory.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Incoming Orders</p>
                <p className="text-2xl font-semibold text-gray-900">23</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Outgoing Orders</p>
                <p className="text-2xl font-semibold text-gray-900">18</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {inventory.filter(item => item.status === 'low-stock').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button 
            onClick={() => navigate('/inventory/receipt')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Receipt</span>
          </button>
          <button 
            onClick={() => navigate('/inventory/deliveries')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Truck className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Delivery</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Add Product</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">View Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Receipt - Steel Plates</p>
                <p className="text-sm text-gray-500">Warehouse A • 2 hours ago</p>
              </div>
            </div>
            <span className="text-sm font-medium text-green-600">+250 units</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Delivery - Hydraulic Pumps</p>
                <p className="text-sm text-gray-500">Customer ABC • 4 hours ago</p>
              </div>
            </div>
            <span className="text-sm font-medium text-blue-600">-15 units</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Scrap - Aluminum Rods</p>
                <p className="text-sm text-gray-500">Damaged • 1 day ago</p>
              </div>
            </div>
            <span className="text-sm font-medium text-red-600">-5 units</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperations = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Truck className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Operations Overview</h3>
        <p className="mt-1 text-sm text-gray-500">
          Use the dropdown menu above to access specific operation types:
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600">• Receipt - Manage incoming stock</p>
          <p className="text-sm text-gray-600">• Deliveries - Handle outgoing shipments</p>
          <p className="text-sm text-gray-600">• Scrap Order - Process damaged items</p>
          <p className="text-sm text-gray-600">• Forecasting - Plan inventory replenishment</p>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      {/* Add Product Form */}
      {showAddProductForm && <AddProductForm />}

      {/* Product Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowAddProductForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Raw Materials">Raw Materials</option>
            <option value="Components">Components</option>
            <option value="Finished Goods">Finished Goods</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-quarter">This Quarter</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
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
            {filteredInventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(item.status)}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">Last updated: {item.lastUpdated}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    {item.location}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <span className="font-medium">{item.quantity}</span>
                    <span className="text-gray-500 ml-1">/ {item.minStock} min</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${item.unitCost.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${(item.quantity * item.unitCost).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                    {item.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900 mr-3">
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
    </div>
  );

  const renderReporting = () => (
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Stock Report</h3>
              <p className="text-sm text-gray-500">Current inventory levels</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Inventory History</h3>
              <p className="text-sm text-gray-500">Transaction logs</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Moves Analysis</h3>
              <p className="text-sm text-gray-500">Stock movement trends</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Valuation</h3>
              <p className="text-sm text-gray-500">Inventory valuation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Report */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Stock Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incoming Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outgoing Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.unitCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(item.quantity * item.unitCost).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    +{Math.floor(Math.random() * 100)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    -{Math.floor(Math.random() * 50)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Form Builder Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Form Builder</h3>
        <p className="text-sm text-gray-600 mb-6">
          Customize forms by adding custom fields, repositioning elements, and configuring visibility settings.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Add Product Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize product creation form fields and layout</p>
            <button 
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Receipt Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize receipt creation form fields and layout</p>
            <button 
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Delivery Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize delivery creation form fields and layout</p>
            <button 
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Scrap Order Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize scrap order form fields and layout</p>
            <button 
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Stock Report Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize stock report form fields and layout</p>
            <button 
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Transaction History Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize transaction history form fields</p>
            <button 
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Moves Analysis Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize moves analysis form fields</p>
            <button 
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Valuation Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize valuation form fields and layout</p>
            <button 
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Operation Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Enable Packages</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Batch Transfers</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Reception Reports</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Barcode Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Nomenclature</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Default Nomenclature</option>
                <option>Custom Format</option>
              </select>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Show Quantity to Count</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Delivery Methods</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Email Confirmation</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Customer Signature</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Product Variants</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Units of Measure</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Packaging Options</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Traceability</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Lots & Serial Numbers</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Consignment Inventory</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Warehouse Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Warehouse</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Warehouse A</option>
                <option>Warehouse B</option>
                <option>Warehouse C</option>
              </select>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Multi-step Routes</span>
            </label>
          </div>
        </div>
      </div>

      {/* Shipping Connectors */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Connectors</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">UPS Connector</h4>
              <p className="text-sm text-gray-500">Real-time shipping rates</p>
            </div>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
              Configure
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">DHL Connector</h4>
              <p className="text-sm text-gray-500">International shipping</p>
            </div>
            <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">
              Not Configured
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">FedEx Connector</h4>
              <p className="text-sm text-gray-500">Express delivery</p>
            </div>
            <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">
              Not Configured
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'operations':
        return renderOperations();
      case 'products':
        return renderProducts();
      case 'reporting':
        return renderReporting();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    // <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive inventory control with operations, forecasting, and reporting
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => {
                      if (tab.hasDropdown) {
                        if (tab.id === 'operations') {
                          setShowOperationsDropdown(!showOperationsDropdown);
                          setShowReportingDropdown(false);
                        } else if (tab.id === 'reporting') {
                          setShowReportingDropdown(!showReportingDropdown);
                          setShowOperationsDropdown(false);
                        }
                      } else {
                        setActiveTab(tab.id);
                        setShowOperationsDropdown(false);
                        setShowReportingDropdown(false);
                      }
                    }}
                    className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`mr-2 h-5 w-5 transition-colors ${
                      activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {tab.name}
                    {tab.hasDropdown && (
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${
                        (tab.id === 'operations' && showOperationsDropdown) || 
                        (tab.id === 'reporting' && showReportingDropdown) ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {tab.hasDropdown && 
                   ((tab.id === 'operations' && showOperationsDropdown) || 
                    (tab.id === 'reporting' && showReportingDropdown)) && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        {tab.dropdownItems?.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => handleOperationClick(item.path)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    // </Layout>
  );
};

export default Inventory;