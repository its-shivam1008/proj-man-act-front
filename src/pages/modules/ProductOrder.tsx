import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { ProductionOrder, ItemMaster, BOM, Routing } from '../../types/production';
import { getFromStorage, addToStorage, updateInStorage, deleteFromStorage, generateId, STORAGE_KEYS } from '../../utils/localStorage';

export default function ProductionOrders() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [formData, setFormData] = useState<Partial<ProductionOrder>>({
    orderNumber: '',
    productId: '',
    productName: '',
    quantity: 0,
    bomId: '',
    routingId: '',
    startDate: '',
    dueDate: '',
    status: 'created',
    priority: 'medium',
    batchNumber: '',
    plannedCost: 0,
    actualCost: 0,
  });

  useEffect(() => {
    loadOrders();
    loadItems();
    loadBOMs();
  }, []);

  const loadOrders = () => {
    const data = getFromStorage<ProductionOrder>(STORAGE_KEYS.PRODUCTION_ORDERS);
    setOrders(data);
  };

  const loadItems = () => {
    const data = getFromStorage<ItemMaster>(STORAGE_KEYS.ITEMS);
    setItems(data);
  };

  const loadBOMs = () => {
    const data = getFromStorage<BOM>(STORAGE_KEYS.BOMS);
    setBOMs(data);
  };

  const finishedProducts = items.filter(item => item.type === 'finished');

  const handleProductChange = (productId: string) => {
    const product = items.find(i => i.id === productId);
    const productBOMs = boms.filter(b => b.productId === productId && b.isActive);

    if (product && productBOMs.length > 0) {
      const plannedCost = productBOMs[0].totalCost * (formData.quantity || 0);
      setFormData({
        ...formData,
        productId,
        productName: product.itemName,
        bomId: productBOMs[0].id,
        plannedCost,
        orderNumber: `PO-${Date.now()}`,
        batchNumber: `BATCH-${Date.now()}`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrder) {
      const updated = { ...editingOrder, ...formData } as ProductionOrder;
      updateInStorage(STORAGE_KEYS.PRODUCTION_ORDERS, editingOrder.id, updated);
    } else {
      const newOrder: ProductionOrder = {
        ...formData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      } as ProductionOrder;
      addToStorage(STORAGE_KEYS.PRODUCTION_ORDERS, newOrder);
    }
    resetForm();
    loadOrders();
  };

  const handleEdit = (order: ProductionOrder) => {
    setEditingOrder(order);
    setFormData(order);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this production order?')) {
      deleteFromStorage(STORAGE_KEYS.PRODUCTION_ORDERS, id);
      loadOrders();
    }
  };

  const handleStatusChange = (id: string, status: ProductionOrder['status']) => {
    const order = orders.find(o => o.id === id);
    if (order) {
      const updated = { ...order, status };
      updateInStorage(STORAGE_KEYS.PRODUCTION_ORDERS, id, updated);
      loadOrders();
    }
  };

  const resetForm = () => {
    setFormData({
      orderNumber: '',
      productId: '',
      productName: '',
      quantity: 0,
      bomId: '',
      routingId: '',
      startDate: '',
      dueDate: '',
      status: 'created',
      priority: 'medium',
      batchNumber: '',
      plannedCost: 0,
      actualCost: 0,
    });
    setEditingOrder(null);
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-100 text-gray-800';
      case 'material-issued': return 'bg-blue-100 text-blue-800';
      case 'in-production': return 'bg-yellow-100 text-yellow-800';
      case 'quality-check': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Production Orders</h2>
          <p className="text-gray-600">Create and manage production work orders</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Order
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingOrder ? 'Edit Production Order' : 'Create Production Order'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product*</label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product</option>
                    {finishedProducts.map(item => (
                      <option key={item.id} value={item.id}>{item.itemCode} - {item.itemName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity*</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => {
                      const qty = parseFloat(e.target.value) || 0;
                      const bom = boms.find(b => b.id === formData.bomId);
                      setFormData({
                        ...formData,
                        quantity: qty,
                        plannedCost: bom ? bom.totalCost * qty : 0,
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date*</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority*</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="created">Created</option>
                    <option value="material-issued">Material Issued</option>
                    <option value="in-production">In Production</option>
                    <option value="quality-check">Quality Check</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Order Number:</span>
                    <span className="ml-2 font-medium">{formData.orderNumber || 'Auto-generated'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Batch Number:</span>
                    <span className="ml-2 font-medium">{formData.batchNumber || 'Auto-generated'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Planned Cost:</span>
                    <span className="ml-2 font-medium">${formData.plannedCost?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingOrder ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="mx-auto mb-2" size={48} />
                    <p>No production orders found. Create your first order to get started.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.startDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.dueDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                        className={`px-2 py-1 text-xs rounded-full border-0 ${getStatusColor(order.status)}`}
                      >
                        <option value="created">Created</option>
                        <option value="material-issued">Material Issued</option>
                        <option value="in-production">In Production</option>
                        <option value="quality-check">Quality Check</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
