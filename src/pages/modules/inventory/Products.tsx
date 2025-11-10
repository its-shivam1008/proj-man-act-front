import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Upload,
  Download,
  Tag,
  DollarSign,
  MapPin,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  Trash2,
  TrendingDown,
  Minus,
  X
} from 'lucide-react';

// Mock data for demonstration
const mockProducts = [
  {
    id: 'PRD-001',
    name: 'Premium Steel Pipes',
    category: 'Raw Materials',
    sku: 'SKU-SP-001',
    unitCost: 245.50,
    quantity: 150,
    minStock: 50,
    location: 'Warehouse A',
    status: 'in-stock',
    lastUpdated: '2024-11-08'
  },
  {
    id: 'PRD-002',
    name: 'Industrial Bolts M10',
    category: 'Components',
    sku: 'SKU-BT-002',
    unitCost: 0.85,
    quantity: 25,
    minStock: 100,
    location: 'Warehouse B',
    status: 'low-stock',
    lastUpdated: '2024-11-05'
  },
  {
    id: 'PRD-003',
    name: 'Hydraulic Oil 5L',
    category: 'Raw Materials',
    sku: 'SKU-HO-003',
    unitCost: 32.99,
    quantity: 0,
    minStock: 20,
    location: 'Warehouse A',
    status: 'out-of-stock',
    lastUpdated: '2024-11-01'
  },
  {
    id: 'PRD-004',
    name: 'Safety Helmets',
    category: 'Finished Goods',
    sku: 'SKU-SH-004',
    unitCost: 24.99,
    quantity: 200,
    minStock: 30,
    location: 'Warehouse C',
    status: 'in-stock',
    lastUpdated: '2024-11-09'
  },
  {
    id: 'PRD-005',
    name: 'Circuit Breakers 20A',
    category: 'Components',
    sku: 'SKU-CB-005',
    unitCost: 15.75,
    quantity: 45,
    minStock: 50,
    location: 'Warehouse B',
    status: 'low-stock',
    lastUpdated: '2024-11-07'
  },
  {
    id: 'PRD-006',
    name: 'Welding Rods',
    category: 'Raw Materials',
    sku: 'SKU-WR-006',
    unitCost: 8.50,
    quantity: 500,
    minStock: 100,
    location: 'Warehouse A',
    status: 'in-stock',
    lastUpdated: '2024-11-10'
  }
];

const Products: React.FC = () => {
  const [products] = useState(mockProducts);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this-month');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  const filteredInventory = products.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'low-stock':
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      case 'out-of-stock':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleImport = () => {
    console.log('Import products');
  };

  const handleExport = () => {
    console.log('Export products');
  };

  const handleAddProduct = () => {
    console.log('Adding product...');
    setShowAddProductForm(false);
  };

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: any) => {
    setEditFormData({ ...product });
    setSelectedProduct(product);
    setShowEditModal(true);
    setShowViewModal(false);
  };

  const handleUpdateProduct = () => {
    console.log('Updating product:', editFormData);
    // Here you would update the product in your state/backend
    setShowEditModal(false);
    setEditFormData(null);
  };

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const ViewProductModal = () => {
    if (!selectedProduct) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Product Header */}
              <div className="flex items-start space-x-4 pb-6 border-b border-gray-200">
                <div className="flex-shrink-0">
                  {getStatusIcon(selectedProduct.status)}
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-semibold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">Product ID: {selectedProduct.id}</p>
                  <div className="mt-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedProduct.status)}`}>
                      {selectedProduct.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">SKU</label>
                    <p className="mt-1 text-base text-gray-900 font-medium">{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <div className="mt-1 flex items-center">
                      <Tag className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-base text-gray-900">{selectedProduct.category}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <div className="mt-1 flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="text-base text-gray-900">{selectedProduct.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unit Cost</label>
                    <div className="mt-1 flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                      <p className="text-base text-gray-900 font-semibold">{selectedProduct.unitCost.toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Quantity</label>
                    <p className="mt-1 text-base text-gray-900">
                      <span className="font-semibold">{selectedProduct.quantity}</span>
                      <span className="text-gray-500 ml-2">/ {selectedProduct.minStock} minimum</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Value</label>
                    <div className="mt-1 flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                      <p className="text-base text-gray-900 font-bold">
                        {(selectedProduct.quantity * selectedProduct.unitCost).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Status Card */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Stock Status</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Stock:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedProduct.quantity} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Minimum Stock:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedProduct.minStock} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available Stock:</span>
                    <span className={`text-sm font-medium ${selectedProduct.quantity > selectedProduct.minStock ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.max(0, selectedProduct.quantity - selectedProduct.minStock)} units
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedProduct.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditProduct(selectedProduct);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditProductModal = () => {
    if (!editFormData) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
        <div className="relative w-full md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-y-auto bg-white rounded-md shadow-lg p-5">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Product ID (Read-only) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product ID</label>
                    <p className="mt-1 text-base text-gray-900 font-medium">{editFormData.id}</p>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(editFormData.status)}
                    <span className={`ml-2 inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(editFormData.status)}`}>
                      {editFormData.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => handleEditInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={editFormData.sku}
                      onChange={(e) => handleEditInputChange('sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SKU-XXX-XXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select 
                      value={editFormData.category}
                      onChange={(e) => handleEditInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>Raw Materials</option>
                      <option>Components</option>
                      <option>Finished Goods</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editFormData.location}
                      onChange={(e) => handleEditInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Warehouse location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.unitCost}
                      onChange={(e) => handleEditInputChange('unitCost', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={editFormData.quantity}
                      onChange={(e) => handleEditInputChange('quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Stock
                    </label>
                    <input
                      type="number"
                      value={editFormData.minStock}
                      onChange={(e) => handleEditInputChange('minStock', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minimum stock level"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select 
                    value={editFormData.status}
                    onChange={(e) => handleEditInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>

                {/* Summary Card */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h5 className="text-sm font-semibold text-blue-900 mb-3">Updated Summary</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-blue-700">Total Value:</span>
                      <p className="text-lg font-bold text-blue-900">
                        ${(editFormData.quantity * editFormData.unitCost).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-blue-700">Available Stock:</span>
                      <p className="text-lg font-bold text-blue-900">
                        {Math.max(0, editFormData.quantity - editFormData.minStock)} units
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditFormData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SKU-XXX-XXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select Category</option>
                  <option>Raw Materials</option>
                  <option>Components</option>
                  <option>Finished Goods</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Warehouse location"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Stock
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum stock level"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowAddProductForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your product catalog and inventory
        </p>
      </div>

      {/* Add Product Form */}
      {showAddProductForm && <AddProductForm />}

      {/* View Product Modal */}
      {showViewModal && <ViewProductModal />}

      {/* Edit Product Modal */}
      {showEditModal && <EditProductModal />}

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
          <button 
            onClick={handleImport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button 
            onClick={handleExport}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
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
      <div className="bg-white shadow rounded-lg overflow-hidden w-full">
  <div className="overflow-x-auto w-full">
    <table className="min-w-full divide-y divide-gray-200 table-auto">

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
                  <button 
                    onClick={() => handleViewProduct(item)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900 mr-3" title="Edit">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default Products;