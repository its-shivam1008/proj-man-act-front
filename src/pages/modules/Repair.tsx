import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import Layout from '../../components/Layout';
import { Wrench, Plus, Clock, CheckCircle, AlertTriangle, XCircle, Search, Filter, Calendar, User, Package, DollarSign, FileText, Settings, Users, BarChart3, Edit, Eye, Trash2, Play, Pause, MapPin, Phone, Mail, Upload, Download, Clipboard, PenTool as Tool, Star, TrendingUp, Activity } from 'lucide-react';

const Repair: React.FC = () => {
  const { 
    repairOrders, 
    repairOrdersDetailed, 
    repairTeams, 
    repairTemplates, 
    inventory,
    addRepairOrderDetailed,
    updateRepairOrderDetailed,
    addRepairTeam,
    addRepairTemplate
  } = useData();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'orders', name: 'Repair Orders', icon: FileText },
    { id: 'teams', name: 'Repair Teams', icon: Users },
    { id: 'templates', name: 'Repair Templates', icon: Clipboard },
    { id: 'reports', name: 'Reports & Analytics', icon: TrendingUp },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const filteredOrders = repairOrdersDetailed.filter(order => {
    const product = inventory.find(item => item.id === order.productId);
    const matchesSearch = product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.repairType === typeFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'under-repair':
        return 'bg-yellow-100 text-yellow-800';
      case 'testing':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warranty':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'internal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'under-repair':
        return <Wrench className="h-5 w-5 text-yellow-500" />;
      case 'testing':
        return <Activity className="h-5 w-5 text-purple-500" />;
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const CreateRepairOrderForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Repair Order</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product to Repair *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select Product</option>
                    {inventory.map(item => (
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
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter quantity"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial/Lot Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter serial or lot number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer/Department *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer name or internal department"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Repair Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Repair Details</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repair Type *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select Type</option>
                    <option value="warranty">In-Warranty</option>
                    <option value="paid">Out-of-Warranty (Paid)</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Root Cause *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select Cause</option>
                    <option value="damage">Physical Damage</option>
                    <option value="defect">Manufacturing Defect</option>
                    <option value="misuse">Misuse/Abuse</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Description *
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed description of the issue..."
                  required
                />
              </div>
            </div>

            {/* Assignment & Timeline */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Assignment & Timeline</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsible Team *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select Team</option>
                    {repairTeams.map(team => (
                      <option key={team.id} value={team.id}>{team.teamName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Technician *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select Technician</option>
                    {repairTeams.flatMap(team => team.members).map(member => (
                      <option key={member.technicianId} value={member.technicianId}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Completion *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select Location</option>
                    <option value="Repair Center A">Repair Center A</option>
                    <option value="Repair Center B">Repair Center B</option>
                    <option value="Customer Site">Customer Site</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Additional Information</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Document
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Sale order, MO, or PO reference"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="in-warranty">In-Warranty</option>
                    <option value="extended">Extended Warranty</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachments
                </label>
                <input
                  type="file"
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <p className="text-xs text-gray-500 mt-1">Upload photos, reports, or documentation</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes or special instructions..."
                />
              </div>

              <div className="mt-4 flex items-center">
                <input
                  type="checkbox"
                  id="chargeable"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="chargeable" className="ml-2 text-sm text-gray-700">
                  This repair is chargeable to customer
                </label>
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
                Create Repair Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wrench className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{repairOrdersDetailed.length}</p>
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
                <p className="text-sm font-medium text-gray-500">Under Repair</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {repairOrdersDetailed.filter(order => order.status === 'under-repair').length}
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
                  {repairOrdersDetailed.filter(order => order.status === 'done').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${repairOrdersDetailed.reduce((sum, order) => sum + order.totalCost, 0).toLocaleString()}
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
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Repair Order</span>
          </button>
          <button 
            onClick={() => setActiveTab('teams')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Manage Teams</span>
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Clipboard className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Repair Templates</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">View Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Repair Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {repairOrdersDetailed.slice(0, 5).map((order) => {
            const product = inventory.find(item => item.id === order.productId);
            return (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{product?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-gray-500">{order.customerName} • {order.assignedTechnician}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
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
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="under-repair">Under Repair</option>
            <option value="testing">Testing</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="warranty">Warranty</option>
            <option value="paid">Paid</option>
            <option value="internal">Internal</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type & Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Technician
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timeline
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const product = inventory.find(item => item.id === order.productId);
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      <div className="text-sm text-gray-500">Qty: {order.quantity}</div>
                      {order.serialLotNumber && (
                        <div className="text-xs text-gray-400">S/N: {order.serialLotNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{product?.name || 'Unknown Product'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customerName}</div>
                    {order.sourceDocument && (
                      <div className="text-xs text-gray-500">Ref: {order.sourceDocument}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(order.repairType)}`}>
                        {order.repairType}
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace('-', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{order.assignedTechnician}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="text-sm font-medium">Due: {order.expectedCompletion}</div>
                      <div className="text-sm text-gray-500">Created: {order.createdDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">${order.totalCost.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Parts: ${order.partsCost.toFixed(2)} | Labor: ${order.laborCost.toFixed(2)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      {order.status === 'confirmed' && (
                        <button className="text-purple-600 hover:text-purple-900">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-6">
      {/* Teams Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Repair Teams</h3>
          <button 
            onClick={() => setShowTeamForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {repairTeams.map((team) => (
            <div key={team.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-900">{team.teamName}</h4>
                <span className="text-sm text-gray-500">{team.members.length} members</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  Lead: {team.teamLead}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location: {team.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Hours: {team.workingHours.start} - {team.workingHours.end}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {team.contactInfo.email}
                </div>
              </div>
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Team Members:</h5>
                <div className="space-y-1">
                  {team.members.map((member) => (
                    <div key={member.technicianId} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-900">{member.name}</span>
                        <div className="text-xs text-gray-500">${member.hourlyRate}/hr</div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.availability === 'available' ? 'bg-green-100 text-green-800' :
                        member.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.availability}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      {/* Templates Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Repair Templates</h3>
          <button 
            onClick={() => setShowTemplateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Common Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default Parts
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
              {repairTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{template.templateName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.productCategory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.commonIssue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.estimatedDuration}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.defaultParts.length} parts
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900">
                        Use Template
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Repair Summary</h3>
              <p className="text-sm text-gray-500">By status, type, date</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Cost Analysis</h3>
              <p className="text-sm text-gray-500">Parts vs labor costs</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Turnaround Time</h3>
              <p className="text-sm text-gray-500">Average repair duration</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Quality Metrics</h3>
              <p className="text-sm text-gray-500">Repeat repairs, satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Reports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Repair Summary Report</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Repairs by Type</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Warranty</span>
                  <span className="text-sm font-medium text-gray-900">
                    {repairOrdersDetailed.filter(r => r.repairType === 'warranty').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paid</span>
                  <span className="text-sm font-medium text-gray-900">
                    {repairOrdersDetailed.filter(r => r.repairType === 'paid').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Internal</span>
                  <span className="text-sm font-medium text-gray-900">
                    {repairOrdersDetailed.filter(r => r.repairType === 'internal').length}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Cost Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Parts Cost</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${repairOrdersDetailed.reduce((sum, r) => sum + r.partsCost, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Labor Cost</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${repairOrdersDetailed.reduce((sum, r) => sum + r.laborCost, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Repair Cost</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${(repairOrdersDetailed.reduce((sum, r) => sum + r.totalCost, 0) / repairOrdersDetailed.length || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Settings Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Repair Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">In-Warranty</span>
              <span className="text-xs text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Out-of-Warranty (Paid)</span>
              <span className="text-xs text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Internal</span>
              <span className="text-xs text-green-600">Active</span>
            </div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            + Add Repair Type
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Labor Rates</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Standard Rate</span>
              <span className="text-sm font-medium">$75/hour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Specialist Rate</span>
              <span className="text-sm font-medium">$95/hour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Emergency Rate</span>
              <span className="text-sm font-medium">$120/hour</span>
            </div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            Edit Rates
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Default Locations</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">Repair Center A</div>
            <div className="text-sm text-gray-700">Repair Center B</div>
            <div className="text-sm text-gray-700">Customer Site</div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            Manage Locations
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Email customer on status change</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Internal team alerts</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Auto Actions</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Auto scrap unusable parts</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Auto generate invoices</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Reserve parts automatically</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Fields</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">Customer PO Number</div>
            <div className="text-sm text-gray-700">Warranty Expiry Date</div>
            <div className="text-sm text-gray-700">Return Shipping Method</div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            Add Custom Field
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'orders':
        return renderOrders();
      case 'teams':
        return renderTeams();
      case 'templates':
        return renderTemplates();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    // <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Repair Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive repair operations management with workflow tracking and cost analysis
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Create Forms */}
        {showCreateForm && <CreateRepairOrderForm />}
      </div>
    // </Layout>
  );
};

export default Repair;