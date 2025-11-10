import React, { useState, useEffect } from 'react';
import { Factory, Calendar, Users, MapPin, Package, FileText, Edit2, Trash2, Eye } from 'lucide-react';

const CreateManufacturingOrderForm = () => {
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    bom: '',
    routing: '',
    workCenter: '',
    responsible: '',
    startDate: '',
    deadline: '',
    rawMaterialLocation: '',
    finishedProductLocation: '',
    status: 'draft'
  });

  const [orders, setOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'list'

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('manufacturingOrders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('manufacturingOrders', JSON.stringify(orders));
    }
  }, [orders]);

  // Sample data
  const products = [
    { id: 'industrial-valve', name: 'Industrial Valve' },
    { id: 'pressure-gauge', name: 'Pressure Gauge' },
    { id: 'hydraulic-pump', name: 'Hydraulic Pump' }
  ];

  const boms = [
    { id: 'BOM-001', product: 'Industrial Valve', version: 'v2.1' },
    { id: 'BOM-002', product: 'Pressure Gauge', version: 'v1.0' }
  ];

  const routings = [
    { id: 'RT-001', name: 'Standard Valve Production' },
    { id: 'RT-002', name: 'Gauge Manufacturing' }
  ];

  const workCenters = [
    { id: 'WC-001', name: 'CNC Machine #1', code: 'CNC01' },
    { id: 'WC-002', name: 'Assembly Line A', code: 'ASM01' },
    { id: 'WC-003', name: 'QC Station', code: 'QC01' }
  ];

  const employees = [
    { id: 'EMP-001', name: 'John Smith', role: 'Machine Operator' },
    { id: 'EMP-002', name: 'Sarah Wilson', role: 'Assembly Technician' },
    { id: 'EMP-004', name: 'David Brown', role: 'Production Manager' }
  ];

  const locations = [
    { id: 'warehouse-a', name: 'Warehouse A' },
    { id: 'warehouse-b', name: 'Warehouse B' },
    { id: 'finished-goods', name: 'Finished Goods' }
  ];

  // Create or Update order
  const handleSubmit = () => {
    if (!formData.product || !formData.quantity || !formData.routing || !formData.workCenter || !formData.responsible) {
      alert('Please fill in all required fields (*)');
      return;
    }

    if (editingId) {
      // Update existing order
      const updatedOrders = orders.map(order => 
        order.id === editingId ? { ...formData, id: editingId } : order
      );
      setOrders(updatedOrders);
      alert('Manufacturing Order Updated Successfully!');
      setEditingId(null);
    } else {
      // Create new order
      const newOrder = {
        ...formData,
        id: `MO-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setOrders([...orders, newOrder]);
      alert('Manufacturing Order Created Successfully!');
    }

    // Reset form
    setFormData({
      product: '',
      quantity: '',
      bom: '',
      routing: '',
      workCenter: '',
      responsible: '',
      startDate: '',
      deadline: '',
      rawMaterialLocation: '',
      finishedProductLocation: '',
      status: 'draft'
    });
  };

  // Read/View order
  const handleView = (order) => {
    alert(`Order Details:\nID: ${order.id}\nProduct: ${order.product}\nQuantity: ${order.quantity}\nStatus: ${order.status}`);
  };

  // Edit order
  const handleEdit = (order) => {
    setFormData(order);
    setEditingId(order.id);
    setViewMode('form');
  };

  // Delete order
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const updatedOrders = orders.filter(order => order.id !== id);
      setOrders(updatedOrders);
      localStorage.setItem('manufacturingOrders', JSON.stringify(updatedOrders));
      alert('Order deleted successfully!');
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setFormData({
      product: '',
      quantity: '',
      bom: '',
      routing: '',
      workCenter: '',
      responsible: '',
      startDate: '',
      deadline: '',
      rawMaterialLocation: '',
      finishedProductLocation: '',
      status: 'draft'
    });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Manufacturing Orders Management</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('form')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'form' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Create Order
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              View All Orders ({orders.length})
            </button>
          </div>
        </div>

        {/* Form View */}
        {viewMode === 'form' && (
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <Factory className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Manufacturing Order' : 'Create New Manufacturing Order'}
              </h2>
            </div>
            {editingId && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                Editing Mode
              </span>
            )}
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Product and Quantity */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Product to Manufacture *
                </label>
                <select
                  value={formData.product}
                  onChange={(e) => handleChange('product', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Produce *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                />
              </div>
            </div>

            {/* BOM and Routing */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  BOM (Bill of Materials)
                </label>
                <select
                  value={formData.bom}
                  onChange={(e) => handleChange('bom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Auto-filled after product selection</option>
                  {boms.map(bom => (
                    <option key={bom.id} value={bom.id}>{bom.product} - {bom.version}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">BOM will be automatically selected based on product</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing (Operations Path) *
                </label>
                <select
                  value={formData.routing}
                  onChange={(e) => handleChange('routing', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Routing</option>
                  {routings.map(routing => (
                    <option key={routing.id} value={routing.id}>{routing.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Work Center and Responsible Person */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Factory className="inline h-4 w-4 mr-1" />
                  Work Center *
                </label>
                <select
                  value={formData.workCenter}
                  onChange={(e) => handleChange('workCenter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Work Center</option>
                  {workCenters.map(wc => (
                    <option key={wc.id} value={wc.id}>{wc.name} ({wc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Responsible Person *
                </label>
                <select
                  value={formData.responsible}
                  onChange={(e) => handleChange('responsible', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Responsible Person</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Planned Start Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Raw Material Location
                </label>
                <select
                  value={formData.rawMaterialLocation}
                  onChange={(e) => handleChange('rawMaterialLocation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Finished Product Location
                </label>
                <select
                  value={formData.finishedProductLocation}
                  onChange={(e) => handleChange('finishedProductLocation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Factory className="h-4 w-4 mr-2" />
                {editingId ? 'Update Order' : 'Create Manufacturing Order'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Form Summary</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• Product: {formData.product || 'Not selected'}</p>
            <p>• Quantity: {formData.quantity || 'Not specified'}</p>
            <p>• Work Center: {formData.workCenter || 'Not selected'}</p>
            <p>• Status: {formData.status}</p>
          </div>
        </div>
      </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">All Manufacturing Orders</h2>
              <p className="text-sm text-gray-600 mt-1">Total orders: {orders.length}</p>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <Factory className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-4">Create your first manufacturing order to get started</p>
                <button
                  onClick={() => setViewMode('form')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Order
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Work Center
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.product}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.workCenter}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'done' ? 'bg-green-100 text-green-800' :
                            order.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.deadline ? new Date(order.deadline).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(order)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(order)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateManufacturingOrderForm;