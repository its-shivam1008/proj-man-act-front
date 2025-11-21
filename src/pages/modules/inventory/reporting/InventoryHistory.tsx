import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import { fetchProducts } from '../../../../redux/slices/productSlice';
import {
  fetchInventoryHistory,
  addInventoryHistory,
  updateInventoryHistory,
  deleteInventoryHistory,
  InventoryHistory as InventoryHistoryType,
} from '../../../../redux/slices/inventoryHistorySlice';
import {
  History,
  Plus,
  Search,
  Filter,
  Calendar,
  Package,
  MapPin,
  ArrowRight,
  Edit,
  Eye,
  Trash2,
  X
} from 'lucide-react';

interface FormData {
  date: string;
  reference: string;
  productId: string;
  quantity: string | number;
  fromLocation: string;
  toLocation: string;
  operationType: string;
  status: string;
}

const InventoryHistory: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading: productsLoading } = useSelector((state: RootState) => state.products);
  const { inventoryHistory, loading } = useSelector((state: RootState) => state.inventoryHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [operationFilter, setOperationFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('this-month');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [selectedMove, setSelectedMove] = useState<InventoryHistoryType | null>(null);
  const [selectedViewMove, setSelectedViewMove] = useState<InventoryHistoryType | null>(null);
  const defaultForm: FormData = {
    date: new Date().toISOString().split("T")[0],
    reference: "",
    productId: "",
    quantity: "",  // keep as string
    fromLocation: "",
    toLocation: "",
    operationType: "receipt",
    status: "draft",
  };

  // Form state moved inside form components - old state removed


  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchInventoryHistory());
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    await dispatch(deleteInventoryHistory(id));
    dispatch(fetchInventoryHistory());
  };

  const handleView = (move: InventoryHistoryType) => {
    setSelectedViewMove(move);
    setShowViewForm(true);
  };

  // Form submit handlers moved inside form components - old handlers removed

  const safeProducts = Array.isArray(products) ? products : [];
  const safeInventoryHistory = Array.isArray(inventoryHistory) ? inventoryHistory : [];
  
  const filteredMoves = safeInventoryHistory.filter(move => {
    const productId = typeof move.productId === 'string' ? move.productId : move.productId?._id || move.productId?.id || '';
    const product = safeProducts.find(item => item._id === productId || item.id === productId);
    const productName = product?.name || (typeof move.productId === 'object' && move.productId?.name) || '';
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      move.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = productFilter === 'all' || productId === productFilter;
    const matchesLocation = locationFilter === 'all' ||
      move.fromLocation.includes(locationFilter) ||
      move.toLocation.includes(locationFilter);
    const matchesOperation = operationFilter === 'all' || move.operationType === operationFilter;
    // TODO: Implement month filter logic here
    const matchesMonth = true; // Placeholder
    return matchesSearch && matchesProduct && matchesLocation && matchesOperation && matchesMonth;
  });

  const CreateHistoryForm = () => {
    const [formData, setFormData] = useState<FormData>(defaultForm);

    const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      const orgId = localStorage.getItem('organisationId');
      if (!orgId) {
        alert('No organisationId found');
        return;
      }

      const newItem: Partial<InventoryHistoryType> = {
        organisationId: orgId,
        date: formData.date,
        reference: formData.reference,
        productId: formData.productId,
        quantity: Number(formData.quantity) || 0,
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        operationType: formData.operationType,
        status: formData.status,
      };

      await dispatch(addInventoryHistory(newItem as InventoryHistoryType));
      dispatch(fetchInventoryHistory());
      setShowCreateForm(false);
      setFormData(defaultForm);
    }, [formData, dispatch, defaultForm]);

    const handleFieldChange = useCallback((field: keyof FormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    }, []);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Transaction History</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={handleFieldChange('date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={formData.reference || ''}
                  onChange={handleFieldChange('reference')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reference number"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  value={formData.productId || ''}
                  onChange={handleFieldChange('productId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Product</option>
                  {productsLoading ? (
                    <option value="" disabled>Loading products...</option>
                  ) : safeProducts.length === 0 ? (
                    <option value="" disabled>No products available</option>
                  ) : (
                    safeProducts.map(product => (
                      <option key={product._id || product.id} value={product._id || product.id}>
                        {product.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={handleFieldChange('quantity')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />

              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Location
                </label>
                <input
                  type="text"
                  value={formData.fromLocation || ''}
                  onChange={handleFieldChange('fromLocation')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Source location"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Location
                </label>
                <input
                  type="text"
                  value={formData.toLocation || ''}
                  onChange={handleFieldChange('toLocation')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Destination location"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operation Type
                </label>
                <select
                  value={formData.operationType || ''}
                  onChange={handleFieldChange('operationType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="receipt">Receipt</option>
                  <option value="delivery">Delivery</option>
                  <option value="internal">Internal Transfer</option>
                  <option value="scrap">Scrap</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || ''}
                  onChange={handleFieldChange('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
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
                Add Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    );
  };

  const UpdateHistoryForm = () => {
    const productIdValue = selectedMove ? (typeof selectedMove.productId === 'string' ? selectedMove.productId : selectedMove.productId?._id || selectedMove.productId?.id || '') : '';
    
    const [formData, setFormData] = useState<FormData>({
      date: selectedMove?.date || new Date().toISOString().split("T")[0],
      reference: selectedMove?.reference || "",
      productId: productIdValue,
      quantity: selectedMove?.quantity ? String(selectedMove.quantity) : "",
      fromLocation: selectedMove?.fromLocation || "",
      toLocation: selectedMove?.toLocation || "",
      operationType: selectedMove?.operationType || "receipt",
      status: selectedMove?.status || "draft",
    });

    const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedMove) return;

      const updatedData: Partial<InventoryHistoryType> = {
        date: formData.date,
        reference: formData.reference,
        productId: formData.productId,
        quantity: Number(formData.quantity) || 0,
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        operationType: formData.operationType,
        status: formData.status,
      };

      await dispatch(updateInventoryHistory({ id: selectedMove._id || '', data: updatedData }));
      dispatch(fetchInventoryHistory());
      setShowUpdateForm(false);
      setSelectedMove(null);
    }, [selectedMove, formData, dispatch]);

    const handleFieldChange = useCallback((field: keyof FormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    }, []);

    return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Update Transaction History</h3>
            <button
              onClick={() => {
                setShowUpdateForm(false);
                setSelectedMove(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={handleFieldChange('date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={formData.reference || ''}
                  onChange={handleFieldChange('reference')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  value={formData.productId || ''}
                  onChange={handleFieldChange('productId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Product</option>
                  {productsLoading ? (
                    <option value="" disabled>Loading products...</option>
                  ) : safeProducts.length === 0 ? (
                    <option value="" disabled>No products available</option>
                  ) : (
                    safeProducts.map(product => (
                      <option key={product._id || product.id} value={product._id || product.id}>
                        {product.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={handleFieldChange('quantity')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />

              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Location
                </label>
                <input
                  type="text"
                  value={formData.fromLocation || ''}
                  onChange={handleFieldChange('fromLocation')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Location
                </label>
                <input
                  type="text"
                  value={formData.toLocation || ''}
                  onChange={handleFieldChange('toLocation')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operation Type
                </label>
                <select
                  value={formData.operationType || ''}
                  onChange={handleFieldChange('operationType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="receipt">Receipt</option>
                  <option value="delivery">Delivery</option>
                  <option value="internal">Internal Transfer</option>
                  <option value="scrap">Scrap</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || ''}
                  onChange={handleFieldChange('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateForm(false);
                  setSelectedMove(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Update Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    );
  };

  const ViewHistoryForm = () => {
    if (!selectedViewMove) return null;
    const productId = typeof selectedViewMove.productId === 'string' ? selectedViewMove.productId : selectedViewMove.productId?._id || selectedViewMove.productId?.id || '';
    const product = safeProducts.find(item => item._id === productId || item.id === productId);
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">View Transaction History</h3>
              <button
                onClick={() => {
                  setShowViewForm(false);
                  setSelectedViewMove(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={selectedViewMove.date}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={selectedViewMove.reference}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <input
                    type="text"
                    value={product?.name || (typeof selectedViewMove.productId === 'object' && selectedViewMove.productId?.name) || 'Unknown Product'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="text"
                    value={selectedViewMove.quantity.toString()}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Location
                  </label>
                  <input
                    type="text"
                    value={selectedViewMove.fromLocation}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Location
                  </label>
                  <input
                    type="text"
                    value={selectedViewMove.toLocation}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operation Type
                  </label>
                  <input
                    type="text"
                    value={selectedViewMove.operationType}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <input
                    type="text"
                    value={selectedViewMove.status}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewForm(false);
                    setSelectedViewMove(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'receipt':
        return 'bg-green-100 text-green-800';
      case 'delivery':
        return 'bg-blue-100 text-blue-800';
      case 'internal':
        return 'bg-purple-100 text-purple-800';
      case 'scrap':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    // <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory History</h1>
          <p className="mt-1 text-sm text-gray-600">
            Complete transaction history and stock movement tracking
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction History
        </button>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <History className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{safeInventoryHistory.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Receipts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeInventoryHistory.filter(move => move.operationType === 'receipt').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowRight className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Deliveries</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeInventoryHistory.filter(move => move.operationType === 'delivery').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeInventoryHistory.filter(move => {
                    // Simple this-month filter (adjust as needed)
                    const moveDate = new Date(move.date);
                    const now = new Date();
                    return moveDate.getFullYear() === now.getFullYear() &&
                      moveDate.getMonth() === now.getMonth();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Products</option>
            {safeProducts.map(product => (
              <option key={product._id || product.id} value={product._id || product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Locations</option>
            <option value="Warehouse A">Warehouse A</option>
            <option value="Warehouse B">Warehouse B</option>
            <option value="Warehouse C">Warehouse C</option>
          </select>
          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Operations</option>
            <option value="receipt">Receipt</option>
            <option value="delivery">Delivery</option>
            <option value="internal">Internal</option>
            <option value="scrap">Scrap</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-quarter">This Quarter</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>
      {/* History Table */}
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
                Movement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operation Type
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
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredMoves.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              filteredMoves.map((move) => {
                const productId = typeof move.productId === 'string' ? move.productId : move.productId?._id || move.productId?.id || '';
                const product = safeProducts.find(item => item._id === productId || item.id === productId);
                return (
                <tr key={move._id || move.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {move.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {move.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      {product?.name || (typeof move.productId === 'object' && move.productId?.name) || 'Unknown Product'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-xs">{move.fromLocation}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400 mx-1" />
                      <span className="text-xs">{move.toLocation}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {move.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOperationColor(move.operationType)}`}>
                      {move.operationType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(move.status)}`}>
                      {move.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => handleView(move)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-900 mr-3"
                      onClick={() => {
                        const productIdValue = typeof move.productId === 'string' ? move.productId : move.productId?._id || move.productId?.id || '';
                        setSelectedMove(move);
                        setUpdateForm({
                          date: move.date,
                          reference: move.reference,
                          productId: productIdValue,
                          quantity: String(move.quantity),
                          fromLocation: move.fromLocation,
                          toLocation: move.toLocation,
                          operationType: move.operationType,
                          status: move.status,
                        });

                        setShowUpdateForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(move._id || '')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Create History Form Modal */}
      {showCreateForm && <CreateHistoryForm />}
      {/* Update History Form Modal */}
      {showUpdateForm && <UpdateHistoryForm />}
      {/* View History Form Modal */}
      {showViewForm && <ViewHistoryForm />}
    </div>
    // </Layout>
  );
};

export default InventoryHistory;