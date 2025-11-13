import React, { useState, useEffect } from 'react';
import { useData } from '../../../../contexts/DataContext';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import Layout from '../../../../components/Layout';
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
  X
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

interface MovesAnalysisItem {
  id: string;
  product: string;
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

interface FormData {
  product: string;
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
  const { inventory } = useData();
  const [movesAnalysisData, setMovesAnalysisData] = useState<MovesAnalysisItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisFilter, setAnalysisFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('this-month');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MovesAnalysisItem | null>(null);
  const [createForm, setCreateForm] = useState<FormData>({
    product: '',
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
  const [updateForm, setUpdateForm] = useState<FormData>({});

  useEffect(() => {
    const loadedData = storage.get<MovesAnalysisItem[]>(STORAGE_KEYS.MOVES_ANALYSIS, []);
    setMovesAnalysisData(Array.isArray(loadedData) ? loadedData : []);
  }, []);

  const refreshData = () => {
    const loadedData = storage.get<MovesAnalysisItem[]>(STORAGE_KEYS.MOVES_ANALYSIS, []);
    setMovesAnalysisData(Array.isArray(loadedData) ? loadedData : []);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: MovesAnalysisItem = {
      ...createForm,
      id: `MA-${Date.now().toString().slice(-6)}`,
      unitPrice: parseFloat(createForm.unitPrice.toString()),
      turnoverRate: parseFloat(createForm.turnoverRate.toString())
    };
    storage.push(STORAGE_KEYS.MOVES_ANALYSIS, newItem);
    refreshData();
    setShowCreateForm(false);
    setCreateForm({
      product: '',
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

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const updatedItem: Partial<MovesAnalysisItem> = {
      ...updateForm,
      unitPrice: parseFloat(updateForm.unitPrice?.toString() || '0'),
      turnoverRate: parseFloat(updateForm.turnoverRate?.toString() || '0')
    };
    storage.updateById(STORAGE_KEYS.MOVES_ANALYSIS, selectedItem.id, updatedItem);
    refreshData();
    setShowUpdateForm(false);
    setSelectedItem(null);
    setUpdateForm({});
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis item?')) return;
    storage.deleteById(STORAGE_KEYS.MOVES_ANALYSIS, id);
    refreshData();
  };

  const filteredAnalysis = movesAnalysisData.filter(item => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase());
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

  movesAnalysisData.forEach(item => {
    trendData.find(d => d.name === 'Up')!.Inbound += item.inboundTrend === 'up' ? 1 : 0;
    trendData.find(d => d.name === 'Up')!.Outbound += item.outboundTrend === 'up' ? 1 : 0;
    trendData.find(d => d.name === 'Down')!.Inbound += item.inboundTrend === 'down' ? 1 : 0;
    trendData.find(d => d.name === 'Down')!.Outbound += item.outboundTrend === 'down' ? 1 : 0;
    trendData.find(d => d.name === 'Stable')!.Inbound += item.inboundTrend === 'stable' ? 1 : 0;
    trendData.find(d => d.name === 'Stable')!.Outbound += item.outboundTrend === 'stable' ? 1 : 0;
  });

  const turnoverChartData = movesAnalysisData.map(item => ({
    name: item.product,
    turnover: item.turnoverRate
  }));

  const CreateAnalysisForm = () => (
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
          
          <form className="space-y-4" onSubmit={handleCreateSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select 
                  value={createForm.product}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, product: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Product</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Demand
                </label>
                <input
                  type="number"
                  value={createForm.demand}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, demand: parseInt(e.target.value, 10) || 0 }))}
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
                  value={createForm.snLots}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, snLots: parseInt(e.target.value, 10) || 0 }))}
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
                  value={createForm.packagingQty}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, packagingQty: parseInt(e.target.value, 10) || 0 }))}
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
                  value={createForm.unitPrice}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
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
                  value={createForm.quantity}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }))}
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
                  value={createForm.realQuantity}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, realQuantity: parseInt(e.target.value, 10) || 0 }))}
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
                  value={createForm.inboundTrend}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, inboundTrend: e.target.value as 'up' | 'down' | 'stable' }))}
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
                  value={createForm.outboundTrend}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, outboundTrend: e.target.value as 'up' | 'down' | 'stable' }))}
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
                  <p className="text-sm text-gray-900">{selectedItem.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <p className="text-sm text-gray-900">{selectedItem.product}</p>
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
                    Product
                  </label>
                  <select 
                    value={updateForm.product || selectedItem.product}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, product: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Product</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Demand
                  </label>
                  <input
                    type="number"
                    value={updateForm.demand || selectedItem.demand}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, demand: parseInt(e.target.value, 10) || 0 }))}
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
                    value={updateForm.snLots || selectedItem.snLots}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, snLots: parseInt(e.target.value, 10) || 0 }))}
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
                    value={updateForm.packagingQty || selectedItem.packagingQty}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, packagingQty: parseInt(e.target.value, 10) || 0 }))}
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
                    value={updateForm.unitPrice || selectedItem.unitPrice}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
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
                    value={updateForm.quantity || selectedItem.quantity}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }))}
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
                    value={updateForm.realQuantity || selectedItem.realQuantity}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, realQuantity: parseInt(e.target.value, 10) || 0 }))}
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
                    value={updateForm.inboundTrend || selectedItem.inboundTrend}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, inboundTrend: e.target.value as 'up' | 'down' | 'stable' }))}
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
                    value={updateForm.outboundTrend || selectedItem.outboundTrend}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, outboundTrend: e.target.value as 'up' | 'down' | 'stable' }))}
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
                    setUpdateForm({});
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
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
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
                  <p className="text-2xl font-semibold text-gray-900">{movesAnalysisData.length}</p>
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
                    {movesAnalysisData.filter(item => item.demand > 100).length}
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
                    {movesAnalysisData.filter(item => item.turnoverRate === 0).length}
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
                    {movesAnalysisData.length > 0 ? (movesAnalysisData.reduce((sum, item) => sum + item.turnoverRate, 0) / movesAnalysisData.length).toFixed(1) : '0'}
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
              {filteredAnalysis.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{item.product}</div>
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
                      className="text-green-600 hover:text-green-900 mr-3"
                      onClick={() => {
                        setSelectedItem(item);
                        setUpdateForm({
                          product: item.product,
                          demand: item.demand,
                          snLots: item.snLots,
                          packagingQty: item.packagingQty,
                          quantity: item.quantity,
                          realQuantity: item.realQuantity,
                          unitPrice: item.unitPrice,
                          inboundTrend: item.inboundTrend,
                          outboundTrend: item.outboundTrend,
                          turnoverRate: item.turnoverRate
                        });
                        setShowUpdateForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
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