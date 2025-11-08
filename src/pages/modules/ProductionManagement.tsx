import React, { useState } from 'react';
import { 
  Factory, Package, Users, Settings, CheckCircle, Clock, 
  TrendingUp, AlertTriangle, Calendar, BarChart3, PlayCircle,
  PauseCircle, StopCircle, Edit2, Eye, Trash2, Plus, Filter,
  Search, Download, Upload, FileText, Wrench, Shield, DollarSign,
  Box, Layers, Activity, XCircle, ChevronRight, RefreshCw, Zap,
  ClipboardList, Target, Gauge, Timer, Hash, MapPin, User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ProductionManagement = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [productionOrders, setProductionOrders] = useState([
    {
      id: 1,
      orderNumber: 'PO-2024-001',
      product: 'Widget A-Series',
      sku: 'WDG-A-001',
      quantity: 1000,
      produced: 650,
      status: 'in-progress',
      priority: 'high',
      startDate: '2024-11-01',
      endDate: '2024-11-15',
      machine: 'Line 1 - Press A',
      operator: 'John Smith',
      shift: 'Morning',
      rawMaterials: [
        { name: 'Steel Sheet', required: 500, allocated: 500, unit: 'kg' },
        { name: 'Bolts', required: 2000, allocated: 2000, unit: 'pcs' },
        { name: 'Paint', required: 50, allocated: 45, unit: 'L' }
      ],
      qualityChecks: 3,
      defects: 12,
      downtime: 2.5,
      cost: 45000,
      estimatedCost: 50000
    },
    {
      id: 2,
      orderNumber: 'PO-2024-002',
      product: 'Component B-Pro',
      sku: 'CMP-B-002',
      quantity: 500,
      produced: 500,
      status: 'completed',
      priority: 'medium',
      startDate: '2024-10-25',
      endDate: '2024-11-05',
      machine: 'Line 2 - Assembly B',
      operator: 'Sarah Johnson',
      shift: 'Evening',
      rawMaterials: [
        { name: 'Aluminum', required: 200, allocated: 200, unit: 'kg' },
        { name: 'Screws', required: 1000, allocated: 1000, unit: 'pcs' }
      ],
      qualityChecks: 2,
      defects: 3,
      downtime: 0,
      cost: 18000,
      estimatedCost: 20000
    },
    {
      id: 3,
      orderNumber: 'PO-2024-003',
      product: 'Assembly C-Max',
      sku: 'ASM-C-003',
      quantity: 750,
      produced: 0,
      status: 'scheduled',
      priority: 'low',
      startDate: '2024-11-20',
      endDate: '2024-12-05',
      machine: 'Line 3 - CNC Mill',
      operator: 'Mike Wilson',
      shift: 'Night',
      rawMaterials: [
        { name: 'Plastic Resin', required: 300, allocated: 0, unit: 'kg' },
        { name: 'Electronics', required: 750, allocated: 0, unit: 'pcs' }
      ],
      qualityChecks: 0,
      defects: 0,
      downtime: 0,
      cost: 0,
      estimatedCost: 35000
    },
    {
      id: 4,
      orderNumber: 'PO-2024-004',
      product: 'Part D-Elite',
      sku: 'PRT-D-004',
      quantity: 2000,
      produced: 450,
      status: 'on-hold',
      priority: 'high',
      startDate: '2024-11-08',
      endDate: '2024-11-25',
      machine: 'Line 1 - Press A',
      operator: 'Emily Brown',
      shift: 'Morning',
      rawMaterials: [
        { name: 'Copper Wire', required: 400, allocated: 200, unit: 'kg' },
        { name: 'Insulation', required: 150, allocated: 0, unit: 'kg' }
      ],
      qualityChecks: 1,
      defects: 8,
      downtime: 5,
      cost: 15000,
      estimatedCost: 60000
    }
  ]);

  const [machines, setMachines] = useState([
    { id: 1, name: 'Press A', line: 'Line 1', status: 'running', efficiency: 87, utilization: 92, maintenance: 'good' },
    { id: 2, name: 'Assembly B', line: 'Line 2', status: 'idle', efficiency: 95, utilization: 45, maintenance: 'good' },
    { id: 3, name: 'CNC Mill', line: 'Line 3', status: 'maintenance', efficiency: 0, utilization: 0, maintenance: 'scheduled' },
    { id: 4, name: 'Welding Station', line: 'Line 4', status: 'running', efficiency: 78, utilization: 88, maintenance: 'warning' }
  ]);

  const [workforce, setWorkforce] = useState([
    { id: 1, name: 'John Smith', role: 'Operator', shift: 'Morning', status: 'active', orders: 2, efficiency: 92 },
    { id: 2, name: 'Sarah Johnson', role: 'Supervisor', shift: 'Evening', status: 'active', orders: 3, efficiency: 95 },
    { id: 3, name: 'Mike Wilson', role: 'Operator', shift: 'Night', status: 'break', orders: 1, efficiency: 88 },
    { id: 4, name: 'Emily Brown', role: 'Quality Inspector', shift: 'Morning', status: 'active', orders: 4, efficiency: 97 }
  ]);

  const stats = {
    activeOrders: productionOrders.filter(o => o.status === 'in-progress').length,
    completedToday: 2,
    totalProduction: productionOrders.reduce((sum, o) => sum + o.produced, 0),
    efficiency: 87,
    onTimeDelivery: 94,
    qualityRate: 98.5,
    machineUtilization: 75,
    activeWorkers: workforce.filter(w => w.status === 'active').length
  };

  const openModal = (type, order = null) => {
    setModalType(type);
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setProductionOrders(productionOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const Header = () => (
    <div className=" ">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Factory className="w-8 h-8 mr-3" />
              Production Management
            </h1>
            <p className=" mt-1">Complete manufacturing control and monitoring system</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-blue text-white' : 'bg-white text-white hover:bg-blue-400'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('orders')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'orders' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-400'}`}
            >
              Production Orders
            </button>
            <button 
              onClick={() => setCurrentView('planning')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'planning' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-400'}`}
            >
              Planning
            </button>
            <button 
              onClick={() => openModal('create')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <PlayCircle className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-90">Active</span>
            </div>
            <p className="text-4xl font-bold">{stats.activeOrders}</p>
            <p className="text-sm opacity-90 mt-1">Production Orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-90">Today</span>
            </div>
            <p className="text-4xl font-bold">{stats.completedToday}</p>
            <p className="text-sm opacity-90 mt-1">Orders Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Box className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-90">Units</span>
            </div>
            <p className="text-4xl font-bold">{stats.totalProduction.toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-1">Total Produced</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Gauge className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-90">Overall</span>
            </div>
            <p className="text-4xl font-bold">{stats.efficiency}%</p>
            <p className="text-sm opacity-90 mt-1">Efficiency Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-6 h-6 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.onTimeDelivery}%</span>
            </div>
            <p className="text-sm text-gray-600">On-Time Delivery</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.onTimeDelivery}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{stats.qualityRate}%</span>
            </div>
            <p className="text-sm text-gray-600">Quality Rate</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.qualityRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Settings className="w-6 h-6 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{stats.machineUtilization}%</span>
            </div>
            <p className="text-sm text-gray-600">Machine Utilization</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${stats.machineUtilization}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-6 h-6 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{stats.activeWorkers}</span>
            </div>
            <p className="text-sm text-gray-600">Active Workers</p>
            <p className="text-xs text-gray-500 mt-2">Out of {workforce.length} total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-6 h-6 mr-2 text-blue-600" />
            Active Production Orders
          </CardTitle>
          <CardDescription>Currently in progress on the production floor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productionOrders.filter(o => o.status === 'in-progress').map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Factory className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{order.orderNumber}</h4>
                      <p className="text-sm text-gray-600">{order.product}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{order.machine}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{order.operator}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{order.shift} Shift</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Due: {order.endDate}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Production Progress</span>
                    <span className="font-medium">{order.produced} / {order.quantity} units ({((order.produced / order.quantity) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all" 
                      style={{ width: `${(order.produced / order.quantity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">{order.qualityChecks} QC</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-gray-600">{order.defects} defects</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Timer className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-600">{order.downtime}h downtime</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openModal('view', order)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-6 h-6 mr-2 text-purple-600" />
              Machine Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {machines.map(machine => (
                <div key={machine.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      machine.status === 'running' ? 'bg-green-500' :
                      machine.status === 'idle' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{machine.name}</p>
                      <p className="text-xs text-gray-500">{machine.line}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{machine.efficiency}% eff</p>
                    <p className="text-xs text-gray-500">{machine.utilization}% util</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-6 h-6 mr-2 text-orange-600" />
              Workforce Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workforce.map(worker => (
                <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{worker.name}</p>
                      <p className="text-xs text-gray-500">{worker.role} • {worker.shift}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      worker.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {worker.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{worker.efficiency}% efficiency</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ProductionOrders = () => {
    const filteredOrders = productionOrders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           order.product.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Export
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.product}</p>
                          <p className="text-xs text-gray-500">{order.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">{order.produced} / {order.quantity}</span>
                            <span className="font-medium">{((order.produced / order.quantity) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(order.produced / order.quantity) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{order.machine}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{order.endDate}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openModal('view', order)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => openModal('edit', order)}
                            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-orange-600" />
                          </button>
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const Planning = () => (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="w-6 h-6 mr-2 text-blue-600" />
            Production Schedule
          </CardTitle>
          <CardDescription>Timeline view of all production orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productionOrders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{order.orderNumber} - {order.product}</h4>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm mb-3">
                  <span className="text-gray-600">Start: {order.startDate}</span>
                  <span className="text-gray-600">End: {order.endDate}</span>
                  <span className={`px-2 py-1 rounded-full ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Materials Allocation</span>
                    <span className="font-medium">{order.rawMaterials.reduce((sum, m) => sum + m.allocated, 0)} / {order.rawMaterials.reduce((sum, m) => sum + m.required, 0)} allocated</span>
                  </div>
                  <div className="flex space-x-1">
                    {order.rawMaterials.map((material, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gray-200 rounded h-2"
                        title={material.name}
                      >
                        <div
                          className={`h-2 rounded transition-all ${
                            material.allocated === material.required ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${(material.allocated / material.required) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-green-600" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionOrders.map(order => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                    <span className="text-sm font-semibold text-gray-900">${order.cost.toLocaleString()} / ${order.estimatedCost.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div
                      className={`h-2 rounded transition-all ${
                        order.cost <= order.estimatedCost ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((order.cost / order.estimatedCost) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.cost <= order.estimatedCost ? 'Under budget' : 'Over budget'} by ${Math.abs(order.cost - order.estimatedCost).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-orange-600" />
              Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionOrders.map(order => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                    <span className="text-sm font-semibold">
                      {order.produced > 0 ? (((order.produced - order.defects) / order.produced) * 100).toFixed(1) : '0'}% pass rate
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">QC Checks: {order.qualityChecks}</span>
                    <span className="text-red-600 font-medium">Defects: {order.defects}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const Modal = () => {
    if (!showModal) return null;

    const renderModalContent = () => {
      switch(modalType) {
        case 'view':
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Order Number:</span> <span className="font-medium">{selectedOrder?.orderNumber}</span></p>
                    <p><span className="text-gray-600">Product:</span> <span className="font-medium">{selectedOrder?.product}</span></p>
                    <p><span className="text-gray-600">SKU:</span> <span className="font-medium">{selectedOrder?.sku}</span></p>
                    <p><span className="text-gray-600">Quantity:</span> <span className="font-medium">{selectedOrder?.quantity} units</span></p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Execution Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Machine:</span> <span className="font-medium">{selectedOrder?.machine}</span></p>
                    <p><span className="text-gray-600">Operator:</span> <span className="font-medium">{selectedOrder?.operator}</span></p>
                    <p><span className="text-gray-600">Shift:</span> <span className="font-medium">{selectedOrder?.shift}</span></p>
                    <p><span className="text-gray-600">Status:</span> <span className={`font-medium px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder?.status)}`}>{selectedOrder?.status}</span></p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Raw Materials</h3>
                <div className="space-y-2">
                  {selectedOrder?.rawMaterials.map((material, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{material.name}</span>
                      <span className="text-sm text-gray-600">{material.allocated} / {material.required} {material.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600">Quality Checks</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedOrder?.qualityChecks}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-gray-600">Defects Found</p>
                  <p className="text-2xl font-bold text-red-600">{selectedOrder?.defects}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-gray-600">Downtime (hours)</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedOrder?.downtime}</p>
                </div>
              </div>
            </div>
          );
        
        case 'edit':
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Order</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>scheduled</option>
                    <option>in-progress</option>
                    <option>on-hold</option>
                    <option>completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>low</option>
                    <option>medium</option>
                    <option>high</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produced Units</label>
                  <input type="number" defaultValue={selectedOrder?.produced} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          );
        
        case 'create':
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Product Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="Quantity" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Select Machine</option>
                  {machines.map(m => <option key={m.id}>{m.name}</option>)}
                </select>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          );
        
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            {renderModalContent()}
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {modalType === 'view' ? 'Close' : 'Save'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'orders' && <ProductionOrders />}
      {currentView === 'planning' && <Planning />}
      <Modal />
    </div>
  );
};

export default ProductionManagement;