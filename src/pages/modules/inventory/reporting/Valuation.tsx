import { usePermission } from "@/hooks/userPermission";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import { fetchProducts } from '../../../../redux/slices/productSlice';
import {
  fetchValuations,
  addValuation,
  updateValuation,
  deleteValuation,
  Valuation as ValuationType,
} from '../../../../redux/slices/valuationSlice';
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
  X,
  ShieldAlert
} from 'lucide-react';

interface FormData {
  date: string;
  reference: string;
  productId: string;
  quantity: number;
  unitValue: number;
  method: string;
  notes: string;
}

const Valuation: React.FC = () => {
  const canView = usePermission("inventoryReporting", "view");
  const canCreate = usePermission("inventoryReporting", "create");
  const canEdit = usePermission("inventoryReporting", "edit");
  const canDelete = usePermission("inventoryReporting", "delete");

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
    );
  }
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading: productsLoading } = useSelector((state: RootState) => state.products);
  const { valuations, loading } = useSelector((state: RootState) => state.valuations);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('this-month');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ValuationType | null>(null);
  const [createForm, setCreateForm] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    productId: '',
    quantity: 0,
    unitValue: 0,
    method: 'FIFO',
    notes: ''
  });
  const [updateForm, setUpdateForm] = useState<FormData>({});

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchValuations());
  }, [dispatch]);

  // Form state moved inside form component - handlers removed

  // Update form handlers
  const handleUpdateDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, date: e.target.value }));
  }, []);

  const handleUpdateReferenceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, reference: e.target.value }));
  }, []);

  const handleUpdateProductIdChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setUpdateForm(prev => ({ ...prev, productId: e.target.value }));
  }, []);

  const handleUpdateQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleUpdateUnitValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, unitValue: parseFloat(e.target.value) || 0 }));
  }, []);

  const handleUpdateMethodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setUpdateForm(prev => ({ ...prev, method: e.target.value }));
  }, []);

  const handleUpdateNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUpdateForm(prev => ({ ...prev, notes: e.target.value }));
  }, []);

  const safeProducts = Array.isArray(products) ? products : [];
  const safeValuations = Array.isArray(valuations) ? valuations : [];

  // Form submit handler moved inside form component

  const handleUpdateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const quantity = updateForm.quantity !== undefined ? updateForm.quantity : selectedItem.quantity;
    const unitValue = updateForm.unitValue !== undefined ? updateForm.unitValue : selectedItem.unitValue;
    const totalValue = quantity * unitValue;

    const updatedItem: Partial<ValuationType> = {
      date: updateForm.date || selectedItem.date,
      reference: updateForm.reference || selectedItem.reference,
      productId: updateForm.productId || selectedItem.productId,
      quantity: quantity,
      unitValue: unitValue,
      totalValue: totalValue,
      method: updateForm.method || selectedItem.method,
      notes: updateForm.notes !== undefined ? updateForm.notes : selectedItem.notes || '',
    };

    await dispatch(updateValuation({ id: selectedItem._id || '', data: updatedItem }));
    dispatch(fetchValuations());
    setShowUpdateForm(false);
    setSelectedItem(null);
    setUpdateForm({});
  }, [selectedItem, updateForm, dispatch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this valuation?')) return;
    await dispatch(deleteValuation(id));
    dispatch(fetchValuations());
  };

  const filteredValuation = safeValuations.filter(item => {
    const productId = typeof item.productId === 'string' ? item.productId : item.productId?._id || item.productId?.id || '';
    const product = safeProducts.find(p => p._id === productId || p.id === productId);
    const productName = product?.name || (typeof item.productId === 'object' && item.productId?.name) || '';
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || item.method === methodFilter;
    // TODO: Implement period filter logic
    const matchesPeriod = true;
    return matchesSearch && matchesMethod && matchesPeriod;
  });

  const handleCloseCreateForm = useCallback(() => {
    setShowCreateForm(false);
  }, []);

  const CreateValuationForm = () => {
    const [formData, setFormData] = useState<FormData>({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      productId: '',
      quantity: 0,
      unitValue: 0,
      method: 'FIFO',
      notes: ''
    });

    const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      const orgId = localStorage.getItem('organisationId');
      if (!orgId) {
        alert('No organisationId found');
        return;
      }

      const totalValue = formData.quantity * formData.unitValue;
      const newItem: Partial<ValuationType> = {
        organisationId: orgId,
        date: formData.date,
        reference: formData.reference,
        productId: formData.productId,
        quantity: formData.quantity,
        unitValue: formData.unitValue,
        totalValue: totalValue,
        method: formData.method,
        notes: formData.notes || '',
      };

      await dispatch(addValuation(newItem as ValuationType));
      dispatch(fetchValuations());
      setShowCreateForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        productId: '',
        quantity: 0,
        unitValue: 0,
        method: 'FIFO',
        notes: ''
      });
    }, [formData, dispatch]);

    const handleFieldChange = useCallback((field: keyof FormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const value = field === 'quantity' || field === 'unitValue'
        ? (e.target as HTMLInputElement).valueAsNumber || 0
        : e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);
    if (!canCreate) {
      return (
        <p className="text-center py-6 text-red-600">
          You do not have permission to create valuation.
        </p>
      );
    }

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Valuation</h3>
              <button
                onClick={handleCloseCreateForm}
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
                    placeholder="Enter quantity (+ for in, - for out)"
                    required
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
                    value={formData.unitValue || ''}
                    onChange={handleFieldChange('unitValue')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter unit value"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valuation Method
                  </label>
                  <select
                    value={formData.method || 'FIFO'}
                    onChange={handleFieldChange('method')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                  value={formData.notes || ''}
                  onChange={handleFieldChange('notes')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this valuation..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCreateForm}
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
  };

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
                  <p className="text-sm text-gray-900">{selectedItem._id || 'N/A'}</p>
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
                    {(() => {
                      const productId = typeof selectedItem.productId === 'string' ? selectedItem.productId : selectedItem.productId?._id || selectedItem.productId?.id || '';
                      const product = safeProducts.find(p => p._id === productId || p.id === productId);
                      return (
                        <p className="text-sm text-gray-900">{product?.name || (typeof selectedItem.productId === 'object' && selectedItem.productId?.name) || 'Unknown Product'}</p>
                      );
                    })()}
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

              {selectedItem.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-sm text-gray-900">{selectedItem.notes}</p>
                </div>
              )}

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
    if (!canEdit) {
      return (
        <p className="text-center py-6 text-red-600">
          You do not have permission to edit valuation.
        </p>
      );
    }

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
                  setUpdateForm({});
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
                    value={updateForm.date !== undefined ? updateForm.date : (selectedItem?.date || '')}
                    onChange={handleUpdateDateChange}
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
                    value={updateForm.reference !== undefined ? updateForm.reference : (selectedItem?.reference || '')}
                    onChange={handleUpdateReferenceChange}
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
                    value={updateForm.productId !== undefined ? updateForm.productId : (typeof selectedItem?.productId === 'string' ? selectedItem.productId : selectedItem?.productId?._id || selectedItem?.productId?.id || '')}
                    onChange={handleUpdateProductIdChange}
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
                    value={updateForm.quantity !== undefined ? updateForm.quantity : (selectedItem?.quantity || '')}
                    onChange={handleUpdateQuantityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                    value={updateForm.unitValue !== undefined ? updateForm.unitValue : (selectedItem?.unitValue || '')}
                    onChange={handleUpdateUnitValueChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valuation Method
                  </label>
                  <select
                    value={updateForm.method || (selectedItem?.method || 'FIFO')}
                    onChange={handleUpdateMethodChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                  value={updateForm.notes || selectedItem.notes || ''}
                  onChange={handleUpdateNotesChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedItem(null);
                    setUpdateForm({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className={`px-4 py-2 rounded-lg text-white ${canEdit ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
                    }`}
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

  const totalValuation = safeValuations.reduce((sum, item) => sum + item.totalValue, 0);
  const positiveValuation = safeValuations.filter(item => item.totalValue > 0).reduce((sum, item) => sum + item.totalValue, 0);
  const negativeValuation = Math.abs(safeValuations.filter(item => item.totalValue < 0).reduce((sum, item) => sum + item.totalValue, 0));

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
          type="submit"
          disabled={!canCreate}
          className={`px-4 py-2 rounded-lg text-white ${canCreate ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
            }`}
        >
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
                <p className="text-2xl font-semibold text-gray-900">{safeValuations.length}</p>
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
                {safeValuations.filter(item => item.method === 'FIFO').length}
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
                {safeValuations.filter(item => item.method === 'LIFO').length}
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
                {safeValuations.filter(item => item.method === 'Average Cost').length}
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
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredValuation.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No valuations found
                </td>
              </tr>
            ) : (
              filteredValuation.map((item) => {
                const productId = typeof item.productId === 'string' ? item.productId : item.productId?._id || item.productId?.id || '';
                const product = safeProducts.find(p => p._id === productId || p.id === productId);
                const productName = product?.name || (typeof item.productId === 'object' && item.productId?.name) || 'Unknown Product';
                return (
                  <tr key={item._id || productId} className="hover:bg-gray-50">
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
                        {productName}
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
                        disabled={!canEdit}
                        onClick={() => {
                          if (!canEdit) return;
                          const productIdValue =
                            typeof item.productId === 'string'
                              ? item.productId
                              : item.productId?._id || item.productId?.id || '';
                          setSelectedItem(item);
                          setUpdateForm({
                            date: item.date,
                            reference: item.reference,
                            productId: productIdValue,
                            quantity: item.quantity,
                            unitValue: item.unitValue,
                            method: item.method,
                            notes: item.notes || ''
                          });
                          setShowUpdateForm(true);
                        }}
                        className={`${canEdit ? "text-green-600 hover:text-green-900" : "text-gray-400 cursor-not-allowed"} mr-3`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        disabled={!canDelete}
                        onClick={() => canDelete && handleDelete(item._id || "")}
                        className={`${canDelete ? "text-red-600 hover:text-red-900" : "text-gray-400 cursor-not-allowed"}`}
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