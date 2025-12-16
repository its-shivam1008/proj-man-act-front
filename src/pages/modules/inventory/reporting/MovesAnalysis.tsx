import { usePermission } from "@/hooks/userPermission";

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import { fetchProducts } from '../../../../redux/slices/productSlice';
import {
  fetchMovesAnalysis,
  addMovesAnalysis,
  updateMovesAnalysis,
  deleteMovesAnalysis,
  MovesAnalysis as MovesAnalysisType,
} from '../../../../redux/slices/movesAnalysisSlice';
import {
  BarChart3,
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Edit,
  Eye,
  Trash2,
  Target,
  X,
  ShieldAlert
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface FormData {
  productId: string;
  demand: number;
  snLots: number;
  packagingQty: number;
  quantity: number;
  realQuantity: number;
  unitPrice: number;
  inboundTrend: 'up' | 'down' | 'stable';
  outboundTrend: 'up' | 'down' | 'stable';
  turnoverRate: number;
}

const MovesAnalysis: React.FC = () => {
  const canView = usePermission("moveanalysis", "view");
  const canCreate = usePermission("moveanalysis", "create");
  const canEdit = usePermission("moveanalysis", "edit");
  const canDelete = usePermission("moveanalysis", "delete");

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
  const { movesAnalysis, loading } = useSelector((state: RootState) => state.movesAnalysis);
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisFilter, setAnalysisFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('this-month');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MovesAnalysisType | null>(null);
  // Form state moved inside form components - old state removed
  const orgId = localStorage.getItem('organisationId');
  useEffect(() => {
    dispatch(fetchProducts(orgId));
    dispatch(fetchMovesAnalysis());
  }, [dispatch]);

  // Stable handlers for form inputs
  const handleProductIdChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCreateForm(prev => ({ ...prev, productId: e.target.value }));
  }, []);

  const handleDemandChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm(prev => ({ ...prev, demand: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleSnLotsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm(prev => ({ ...prev, snLots: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handlePackagingQtyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm(prev => ({ ...prev, packagingQty: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleUnitPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }));
  }, []);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleRealQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm(prev => ({ ...prev, realQuantity: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleInboundTrendChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCreateForm(prev => ({ ...prev, inboundTrend: e.target.value as 'up' | 'down' | 'stable' }));
  }, []);

  const handleOutboundTrendChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCreateForm(prev => ({ ...prev, outboundTrend: e.target.value as 'up' | 'down' | 'stable' }));
  }, []);

  // Update form handlers
  const handleUpdateProductIdChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setUpdateForm(prev => ({ ...prev, productId: e.target.value }));
  }, []);

  const handleUpdateDemandChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, demand: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleUpdateSnLotsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, snLots: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleUpdatePackagingQtyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, packagingQty: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleUpdateUnitPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }));
  }, []);

  const handleUpdateQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleUpdateRealQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateForm(prev => ({ ...prev, realQuantity: parseInt(e.target.value, 10) || 0 }));
  }, []);

  const handleUpdateInboundTrendChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setUpdateForm(prev => ({ ...prev, inboundTrend: e.target.value as 'up' | 'down' | 'stable' }));
  }, []);

  const handleUpdateOutboundTrendChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setUpdateForm(prev => ({ ...prev, outboundTrend: e.target.value as 'up' | 'down' | 'stable' }));
  }, []);

  const safeProducts = Array.isArray(products) ? products : [];
  const safeMovesAnalysis = Array.isArray(movesAnalysis) ? movesAnalysis : [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = localStorage.getItem('organisationId');
    if (!orgId) {
      alert('No organisationId found');
      return;
    }

    const newItem: Partial<MovesAnalysisType> = {
      organisationId: orgId,
      productId: createForm.productId,
      demand: createForm.demand,
      snLots: createForm.snLots,
      packagingQty: createForm.packagingQty,
      quantity: createForm.quantity,
      realQuantity: createForm.realQuantity,
      unitPrice: createForm.unitPrice,
      inboundTrend: createForm.inboundTrend,
      outboundTrend: createForm.outboundTrend,
      turnoverRate: createForm.turnoverRate,
    };

    await dispatch(addMovesAnalysis(newItem as MovesAnalysisType));
    dispatch(fetchMovesAnalysis());
    setShowCreateForm(false);
    setCreateForm({
      productId: '',
      demand: 0,
      snLots: 0,
      packagingQty: 0,
      quantity: 0,
      realQuantity: 0,
      unitPrice: 0,
      inboundTrend: 'stable',
      outboundTrend: 'stable',
      turnoverRate: 0
    });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const updatedItem: Partial<MovesAnalysisType> = {
      productId: updateForm.productId || selectedItem.productId,
      demand: updateForm.demand !== undefined ? updateForm.demand : selectedItem.demand,
      snLots: updateForm.snLots !== undefined ? updateForm.snLots : selectedItem.snLots,
      packagingQty: updateForm.packagingQty !== undefined ? updateForm.packagingQty : selectedItem.packagingQty,
      quantity: updateForm.quantity !== undefined ? updateForm.quantity : selectedItem.quantity,
      realQuantity: updateForm.realQuantity !== undefined ? updateForm.realQuantity : selectedItem.realQuantity,
      unitPrice: updateForm.unitPrice !== undefined ? updateForm.unitPrice : selectedItem.unitPrice,
      inboundTrend: updateForm.inboundTrend || selectedItem.inboundTrend,
      outboundTrend: updateForm.outboundTrend || selectedItem.outboundTrend,
      turnoverRate: updateForm.turnoverRate !== undefined ? updateForm.turnoverRate : selectedItem.turnoverRate,
    };

    await dispatch(updateMovesAnalysis({ id: selectedItem._id || '', data: updatedItem }));
    dispatch(fetchMovesAnalysis());
    setShowUpdateForm(false);
    setSelectedItem(null);
    setUpdateForm({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis item?')) return;
    await dispatch(deleteMovesAnalysis(id));
    dispatch(fetchMovesAnalysis());
  };

  const filteredAnalysis = safeMovesAnalysis.filter(item => {
    const productId = typeof item.productId === 'string' ? item.productId : item.productId?._id || item.productId?.id || '';
    const product = safeProducts.find(p => p._id === productId || p.id === productId);
    const productName = product?.name || (typeof item.productId === 'object' && item.productId?.name) || '';
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAnalysis = analysisFilter === 'all' ||
      (analysisFilter === 'high-demand' && item.demand > 100) ||
      (analysisFilter === 'low-stock' && item.quantity < 50) ||
      (analysisFilter === 'dead-stock' && item.turnoverRate === 0);
    return matchesSearch && matchesAnalysis;
  });

  // Prepare data for charts
  const trendData = [
    { name: 'Up', Inbound: 0, Outbound: 0 },
    { name: 'Down', Inbound: 0, Outbound: 0 },
    { name: 'Stable', Inbound: 0, Outbound: 0 }
  ];

  safeMovesAnalysis.forEach(item => {
    trendData.find(d => d.name === 'Up')!.Inbound += item.inboundTrend === 'up' ? 1 : 0;
    trendData.find(d => d.name === 'Up')!.Outbound += item.outboundTrend === 'up' ? 1 : 0;
    trendData.find(d => d.name === 'Down')!.Inbound += item.inboundTrend === 'down' ? 1 : 0;
    trendData.find(d => d.name === 'Down')!.Outbound += item.outboundTrend === 'down' ? 1 : 0;
    trendData.find(d => d.name === 'Stable')!.Inbound += item.inboundTrend === 'stable' ? 1 : 0;
    trendData.find(d => d.name === 'Stable')!.Outbound += item.outboundTrend === 'stable' ? 1 : 0;
  });

  const turnoverChartData = safeMovesAnalysis.map(item => {
    const productId = typeof item.productId === 'string' ? item.productId : item.productId?._id || item.productId?.id || '';
    const product = safeProducts.find(p => p._id === productId || p.id === productId);
    return {
      name: product?.name || (typeof item.productId === 'object' && item.productId?.name) || 'Unknown',
      turnover: item.turnoverRate
    };
  });

  const CreateAnalysisForm = () => {
    const [formData, setFormData] = useState<FormData>({
      productId: '',
      demand: 0,
      snLots: 0,
      packagingQty: 0,
      quantity: 0,
      realQuantity: 0,
      unitPrice: 0,
      inboundTrend: 'stable',
      outboundTrend: 'stable',
      turnoverRate: 0
    });

    const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      const orgId = localStorage.getItem('organisationId');
      if (!orgId) {
        alert('No organisationId found');
        return;
      }

      const newItem: Partial<MovesAnalysisType> = {
        organisationId: orgId,
        productId: formData.productId,
        demand: formData.demand,
        snLots: formData.snLots,
        packagingQty: formData.packagingQty,
        quantity: formData.quantity,
        realQuantity: formData.realQuantity,
        unitPrice: formData.unitPrice,
        inboundTrend: formData.inboundTrend,
        outboundTrend: formData.outboundTrend,
        turnoverRate: formData.turnoverRate,
      };

      await dispatch(addMovesAnalysis(newItem as MovesAnalysisType));
      dispatch(fetchMovesAnalysis());
      setShowCreateForm(false);
      setFormData({
        productId: '',
        demand: 0,
        snLots: 0,
        packagingQty: 0,
        quantity: 0,
        realQuantity: 0,
        unitPrice: 0,
        inboundTrend: 'stable',
        outboundTrend: 'stable',
        turnoverRate: 0
      });
    }, [formData, dispatch]);

    const handleFieldChange = useCallback((field: keyof FormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const value = ['demand', 'snLots', 'packagingQty', 'quantity', 'realQuantity', 'unitPrice', 'turnoverRate'].includes(field)
        ? ((e.target as HTMLInputElement).valueAsNumber || 0)
        : e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);
    if (!canCreate) {
      return (
        <p className="text-center text-red-600 py-6">
          You do not have permission to create moves analysis.
        </p>
      );
    }

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Moves Analysis</h3>
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
                    Demand
                  </label>
                  <input
                    type="number"
                    value={formData.demand || ''}
                    onChange={handleFieldChange('demand')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter demand quantity"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of SN/Lots
                  </label>
                  <input
                    type="number"
                    value={formData.snLots || ''}
                    onChange={handleFieldChange('snLots')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Serial/Lot numbers"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packaging Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.packagingQty || ''}
                    onChange={handleFieldChange('packagingQty')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Package quantity"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice || ''}
                    onChange={handleFieldChange('unitPrice')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Unit price"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={handleFieldChange('quantity')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Current quantity"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Real Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.realQuantity || ''}
                    onChange={handleFieldChange('realQuantity')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Actual quantity"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inbound Trend
                  </label>
                  <select
                    value={formData.inboundTrend || 'stable'}
                    onChange={handleFieldChange('inboundTrend')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="up">Increasing</option>
                    <option value="down">Decreasing</option>
                    <option value="stable">Stable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outbound Trend
                  </label>
                  <select
                    value={formData.outboundTrend || 'stable'}
                    onChange={handleFieldChange('outboundTrend')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="up">Increasing</option>
                    <option value="down">Decreasing</option>
                    <option value="stable">Stable</option>
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
                  Add Analysis
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const ViewAnalysisForm = () => {
    if (!selectedItem) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">View Moves Analysis</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  {(() => {
                    const productId = typeof selectedItem.productId === 'string' ? selectedItem.productId : selectedItem.productId?._id || selectedItem.productId?.id || '';
                    const product = safeProducts.find(p => p._id === productId || p.id === productId);
                    return (
                      <p className="text-sm text-gray-900">{product?.name || (typeof selectedItem.productId === 'object' && selectedItem.productId?.name) || 'Unknown Product'}</p>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Demand</label>
                  <p className="text-sm text-gray-900">{selectedItem.demand}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SN/Lots</label>
                  <p className="text-sm text-gray-900">{selectedItem.snLots}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Qty</label>
                  <p className="text-sm text-gray-900">{selectedItem.packagingQty}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <p className="text-sm text-gray-900">{selectedItem.quantity}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Real Quantity</label>
                  <p className="text-sm text-gray-900">{selectedItem.realQuantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="text-sm text-gray-900">{selectedItem.unitPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inbound Trend</label>
                  <div className="flex items-center">
                    {getTrendIcon(selectedItem.inboundTrend)}
                    <span className={`ml-2 text-sm ${getTrendColor(selectedItem.inboundTrend)}`}>{selectedItem.inboundTrend}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outbound Trend</label>
                  <div className="flex items-center">
                    {getTrendIcon(selectedItem.outboundTrend)}
                    <span className={`ml-2 text-sm ${getTrendColor(selectedItem.outboundTrend)}`}>{selectedItem.outboundTrend}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turnover Rate</label>
                <p className="text-sm font-medium text-gray-900">{selectedItem.turnoverRate.toFixed(1)}x</p>
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

  const UpdateAnalysisForm = () => {
    if (!selectedItem) return null;

    const productIdValue = typeof selectedItem.productId === 'string' ? selectedItem.productId : selectedItem.productId?._id || selectedItem.productId?.id || '';

    const [formData, setFormData] = useState<FormData>({
      productId: productIdValue,
      demand: selectedItem.demand || 0,
      snLots: selectedItem.snLots || 0,
      packagingQty: selectedItem.packagingQty || 0,
      quantity: selectedItem.quantity || 0,
      realQuantity: selectedItem.realQuantity || 0,
      unitPrice: selectedItem.unitPrice || 0,
      inboundTrend: selectedItem.inboundTrend || 'stable',
      outboundTrend: selectedItem.outboundTrend || 'stable',
      turnoverRate: selectedItem.turnoverRate || 0,
    });

    const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem) return;

      const updatedItem: Partial<MovesAnalysisType> = {
        productId: formData.productId,
        demand: formData.demand,
        snLots: formData.snLots,
        packagingQty: formData.packagingQty,
        quantity: formData.quantity,
        realQuantity: formData.realQuantity,
        unitPrice: formData.unitPrice,
        inboundTrend: formData.inboundTrend,
        outboundTrend: formData.outboundTrend,
        turnoverRate: formData.turnoverRate,
      };

      await dispatch(updateMovesAnalysis({ id: selectedItem._id || '', data: updatedItem }));
      dispatch(fetchMovesAnalysis());
      setShowUpdateForm(false);
      setSelectedItem(null);
    }, [selectedItem, formData, dispatch]);
    if (!canEdit) {
      return (
        <p className="text-center text-red-600 py-6">
          You do not have permission to edit moves analysis.
        </p>
      );
    }
    const handleFieldChange = useCallback((field: keyof FormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const value = ['demand', 'snLots', 'packagingQty', 'quantity', 'realQuantity', 'unitPrice', 'turnoverRate'].includes(field)
        ? ((e.target as HTMLInputElement).valueAsNumber || 0)
        : e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Moves Analysis</h3>
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

            <form className="space-y-4" onSubmit={handleFormSubmit}>
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
                    Demand
                  </label>
                  <input
                    type="number"
                    value={formData.demand || ''}
                    onChange={handleFieldChange('demand')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of SN/Lots
                  </label>
                  <input
                    type="number"
                    value={formData.snLots || ''}
                    onChange={handleFieldChange('snLots')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packaging Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.packagingQty || ''}
                    onChange={handleFieldChange('packagingQty')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice || ''}
                    onChange={handleFieldChange('unitPrice')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Real Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.realQuantity || ''}
                    onChange={handleFieldChange('realQuantity')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inbound Trend
                  </label>
                  <select
                    value={formData.inboundTrend || 'stable'}
                    onChange={handleFieldChange('inboundTrend')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="up">Increasing</option>
                    <option value="down">Decreasing</option>
                    <option value="stable">Stable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outbound Trend
                  </label>
                  <select
                    value={formData.outboundTrend || 'stable'}
                    onChange={handleFieldChange('outboundTrend')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="up">Increasing</option>
                    <option value="down">Decreasing</option>
                    <option value="stable">Stable</option>
                  </select>
                </div>
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
                  Update Analysis
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    // <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moves Analysis</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive analysis of stock movements, trends, and turnover rates
          </p>
        </div>
        <button
          disabled={!canCreate}
          onClick={() => canCreate && setShowCreateForm(true)}
          className={`px-4 py-2 rounded-lg flex items-center
    ${canCreate
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-400 text-white cursor-not-allowed"
            }`}>

          <Plus className="h-4 w-4 mr-2" />
          Add Moves Analysis
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Analysis</p>
                <p className="text-2xl font-semibold text-gray-900">{safeMovesAnalysis.length}</p>
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
                <p className="text-sm font-medium text-gray-500">High Demand Items</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeMovesAnalysis.filter(item => item.demand > 100).length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Dead Stock</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeMovesAnalysis.filter(item => item.turnoverRate === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Avg Turnover</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeMovesAnalysis.length > 0 ? (safeMovesAnalysis.reduce((sum, item) => sum + item.turnoverRate, 0) / safeMovesAnalysis.length).toFixed(1) : '0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inbound/Outbound Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Inbound" fill="#8884d8" name="Inbound" />
              <Bar dataKey="Outbound" fill="#82ca9d" name="Outbound" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Turnover Rate Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={turnoverChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="turnover" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            value={analysisFilter}
            onChange={(e) => setAnalysisFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Analysis</option>
            <option value="high-demand">High Demand</option>
            <option value="low-stock">Low Stock</option>
            <option value="dead-stock">Dead Stock</option>
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

      {/* Analysis Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Demand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SN/Lots
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Packaging Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Real Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trends
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turnover Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredAnalysis.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                  No analysis found
                </td>
              </tr>
            ) : (
              filteredAnalysis.map((item) => {
                const productId = typeof item.productId === 'string' ? item.productId : item.productId?._id || item.productId?.id || '';
                const product = safeProducts.find(p => p._id === productId || p.id === productId);
                const productName = product?.name || (typeof item.productId === 'object' && item.productId?.name) || 'Unknown Product';
                return (
                  <tr key={item._id || productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{productName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.demand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.snLots}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.packagingQty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.realQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        {item.unitPrice.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {getTrendIcon(item.inboundTrend)}
                          <span className={`ml-1 text-xs ${getTrendColor(item.inboundTrend)}`}>In</span>
                        </div>
                        <div className="flex items-center">
                          {getTrendIcon(item.outboundTrend)}
                          <span className={`ml-1 text-xs ${getTrendColor(item.outboundTrend)}`}>Out</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.turnoverRate.toFixed(1)}x
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
                        onClick={() => canEdit && (setSelectedItem(item), setShowUpdateForm(true))}
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

      {/* Create Analysis Form Modal */}
      {showCreateForm && <CreateAnalysisForm />}
      {/* View Analysis Form Modal */}
      {showViewForm && <ViewAnalysisForm />}
      {/* Update Analysis Form Modal */}
      {showUpdateForm && <UpdateAnalysisForm />}
    </div>
    // </Layout>
  );
};

export default MovesAnalysis;