import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../../../contexts/DataContext';
import Layout from '../../../components/Layout';
import { 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Edit,
  Eye,
  X
} from 'lucide-react';

import { storage, STORAGE_KEYS } from '@/lib/storage'; // Adjust path as needed

interface ScrapOrderItem {
  id: string;
  productId: string;
  quantity: number;
  reason: 'damaged' | 'expired' | 'lost' | 'obsolete';
  scrapLocation: string;
  status: 'pending' | 'approved' | 'completed';
  date: string;
  remark?: string;
}

const ScrapOrder: React.FC = () => {
  const { inventory } = useData();
  const [scrapOrders, setScrapOrders] = useState<ScrapOrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    const initScrapOrders = () => {
      if (!storage.has(STORAGE_KEYS.SCRAP_ORDERS)) {
        storage.set(STORAGE_KEYS.SCRAP_ORDERS, []);
      }
    };
    initScrapOrders();

    const data = storage.get<ScrapOrderItem[]>(STORAGE_KEYS.SCRAP_ORDERS, []);
    setScrapOrders(Array.isArray(data) ? data : []);
  }, []);

  const safeScrapOrders = Array.isArray(scrapOrders) ? scrapOrders : [];
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const filteredScrapOrders = safeScrapOrders.filter(scrap => {
    const product = safeInventory.find(item => item.id === scrap.productId);
    const matchesSearch = product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scrap.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || scrap.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || scrap.reason === reasonFilter;
    return matchesSearch && matchesStatus && matchesReason;
  });

  const handleCloseForms = useCallback(() => {
    setShowCreateForm(false);
    setShowUpdateForm(false);
    setShowViewForm(false);
    setEditingId(null);
    setViewingId(null);
  }, []);

  const handleSubmit = useCallback((formData: any) => {
    const commonData = {
      productId: formData.productId,
      quantity: Number(formData.quantity) || 0,
      reason: formData.reason as 'damaged' | 'expired' | 'lost' | 'obsolete',
      scrapLocation: formData.scrapLocation,
      status: editingId ? safeScrapOrders.find(s => s.id === editingId)?.status || 'pending' : 'pending',
      date: editingId ? safeScrapOrders.find(s => s.id === editingId)?.date || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      remark: formData.remark,
    };

    const newScrap: ScrapOrderItem = {
      ...commonData,
      id: editingId || Date.now().toString(),
    };

    if (editingId) {
      storage.updateById(STORAGE_KEYS.SCRAP_ORDERS, editingId, newScrap);
    } else {
      storage.push(STORAGE_KEYS.SCRAP_ORDERS, newScrap);
    }

    const updatedScrapOrders = storage.get<ScrapOrderItem[]>(STORAGE_KEYS.SCRAP_ORDERS, []);
    setScrapOrders(Array.isArray(updatedScrapOrders) ? updatedScrapOrders : []);
    handleCloseForms();
  }, [editingId, safeScrapOrders, handleCloseForms]);

  const handleEdit = useCallback((id: string) => {
    setEditingId(id);
    setShowUpdateForm(true);
  }, []);

  const handleView = useCallback((id: string) => {
    setViewingId(id);
    setShowViewForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this scrap order?')) {
      storage.deleteById(STORAGE_KEYS.SCRAP_ORDERS, id);
      const updatedScrapOrders = storage.get<ScrapOrderItem[]>(STORAGE_KEYS.SCRAP_ORDERS, []);
      setScrapOrders(Array.isArray(updatedScrapOrders) ? updatedScrapOrders : []);
    }
  }, []);

  const handleApprove = useCallback((id: string) => {
    const updated: Partial<ScrapOrderItem> = { status: 'approved' as const };
    storage.updateById(STORAGE_KEYS.SCRAP_ORDERS, id, updated);
    const updatedScrapOrders = storage.get<ScrapOrderItem[]>(STORAGE_KEYS.SCRAP_ORDERS, []);
    setScrapOrders(Array.isArray(updatedScrapOrders) ? updatedScrapOrders : []);
  }, []);

  const handleAddClick = useCallback(() => {
    setEditingId(null);
    setShowCreateForm(true);
  }, []);

  const ScrapOrderForm = ({ initialData }: { initialData?: Partial<ScrapOrderItem> }) => {
    const [formData, setFormData] = useState({
      productId: initialData?.productId || '',
      quantity: (initialData?.quantity || 0).toString(),
      reason: initialData?.reason || 'damaged',
      scrapLocation: initialData?.scrapLocation || 'Scrap Yard A',
      remark: initialData?.remark || '',
    });

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit(formData);
    };

    const isEditing = !!initialData;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Update Scrap Order' : 'Create New Scrap Order'}
              </h3>
              <button
                onClick={handleCloseForms}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <select 
                    value={formData.productId}
                    onChange={handleChange('productId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Product</option>
                    {safeInventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange('quantity')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter quantity to scrap"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scrap Reason *
                  </label>
                  <select 
                    value={formData.reason}
                    onChange={handleChange('reason')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="damaged">Damaged</option>
                    <option value="expired">Expired</option>
                    <option value="lost">Lost</option>
                    <option value="obsolete">Obsolete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scrap Location *
                  </label>
                  <select 
                    value={formData.scrapLocation}
                    onChange={handleChange('scrapLocation')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option>Scrap Yard A</option>
                    <option>Scrap Yard B</option>
                    <option>Disposal Center</option>
                    <option>Recycling Center</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remark
                </label>
                <textarea
                  value={formData.remark}
                  onChange={handleChange('remark')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter detailed reason for scrapping..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForms}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {isEditing ? 'Update Scrap Order' : 'Create Scrap Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const ViewScrapOrderForm = ({ item }: { item: ScrapOrderItem | undefined }) => {
    if (!item) return null;
    const product = safeInventory.find(p => p.id === item.productId);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">View Scrap Order: {item.id}</h3>
              <button
                onClick={handleCloseForms}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scrap ID</label>
                  <p className="text-sm text-gray-900">{item.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <p className="text-sm text-gray-900">{product?.name || 'Unknown Product'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <p className="text-sm text-gray-900">{item.quantity} units</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReasonColor(item.reason)}`}>
                    {item.reason}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scrap Location</label>
                  <p className="text-sm text-gray-900">{item.scrapLocation}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center">
                    {getStatusIcon(item.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <p className="text-sm text-gray-900">{item.date}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                <p className="text-sm text-gray-900">{item.remark}</p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseForms}
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'damaged':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'lost':
        return 'bg-purple-100 text-purple-800';
      case 'obsolete':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    // <Layout>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scrap Order Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage inventory scrapping for damaged, expired, or obsolete items
            </p>
          </div>
          <button 
            onClick={handleAddClick}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Scrap Order
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trash2 className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Scrap Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">{safeScrapOrders.length}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {safeScrapOrders.filter(scrap => scrap.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {safeScrapOrders.filter(scrap => scrap.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Damaged Items</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {safeScrapOrders.filter(scrap => scrap.reason === 'damaged').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search scrap orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Reasons</option>
                <option value="damaged">Damaged</option>
                <option value="expired">Expired</option>
                <option value="lost">Lost</option>
                <option value="obsolete">Obsolete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrap Orders Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scrap ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remark
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scrap Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScrapOrders.map((scrap) => {
                const product = safeInventory.find(item => item.id === scrap.productId);
                return (
                  <tr key={scrap.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {scrap.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{product?.name || 'Unknown Product'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scrap.quantity} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReasonColor(scrap.reason)}`}>
                        {scrap.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                      {scrap.remark}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scrap.scrapLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(scrap.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(scrap.status)}`}>
                          {scrap.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        {scrap.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => handleView(scrap.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900 mr-3"
                        onClick={() => handleEdit(scrap.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900 mr-3"
                        onClick={() => handleDelete(scrap.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {scrap.status === 'pending' && (
                        <button 
                          className="text-purple-600 hover:text-purple-900"
                          onClick={() => handleApprove(scrap.id)}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Forms Modals */}
        {showCreateForm && <ScrapOrderForm initialData={undefined} />}
        {showUpdateForm && editingId && <ScrapOrderForm initialData={safeScrapOrders.find(s => s.id === editingId)} />}
        {showViewForm && viewingId && <ViewScrapOrderForm item={safeScrapOrders.find(s => s.id === viewingId)} />}
      </div>
    // </Layout>
  );
};

export default ScrapOrder;