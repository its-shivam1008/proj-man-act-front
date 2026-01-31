import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import Layout from '../components/Layout';
import {
  Package,
  Factory,
  ShoppingCart,
  Settings,
  Shield,
  GitBranch,
  Wrench,
  ScanLine,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  FolderKanban,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { BASE_URL } from '@/utils/constants';
import NotificationCenter from '../components/NotificationCenter';
import { usePermission } from '@/hooks/userPermission';

const Dashboard: React.FC = () => {
  const {
    inventory,
    manufacturingOrders,
    purchaseOrders,
    maintenanceRecords,
    qualityChecks,
    productRevisions,
    repairOrders
  } = useData();

  const canView = usePermission('dashboard', 'view');
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  useEffect(() => {
    fetch(`${BASE_URL}/ok`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("CANNOT connect to BACKEND");
        }
        return res.json();
      })
      .then((data: any) => console.log("Message from backend ->", data.message))
      .catch((err) => console.log(err))
  }, [])

  // Chart data
  const productionTrendData = [
    { name: 'Mon', production: 45, target: 50, efficiency: 90 },
    { name: 'Tue', production: 52, target: 50, efficiency: 104 },
    { name: 'Wed', production: 48, target: 50, efficiency: 96 },
    { name: 'Thu', production: 61, target: 50, efficiency: 122 },
    { name: 'Fri', production: 55, target: 50, efficiency: 110 },
    { name: 'Sat', production: 42, target: 50, efficiency: 84 },
    { name: 'Sun', production: 38, target: 50, efficiency: 76 },
  ];

  const inventoryStatusData = [
    { name: 'In Stock', value: inventory.filter(i => i.status === 'in-stock').length, color: '#10b981' },
    { name: 'Low Stock', value: inventory.filter(i => i.status === 'low-stock').length, color: '#f59e0b' },
    { name: 'Out of Stock', value: inventory.filter(i => i.status === 'out-of-stock').length, color: '#ef4444' },
  ];

  const orderStatusData = [
    { status: 'Completed', manufacturing: 12, purchase: 8, repair: 5 },
    { status: 'In Progress', manufacturing: 8, purchase: 6, repair: 3 },
    { status: 'Pending', manufacturing: 5, purchase: 4, repair: 2 },
    { status: 'Cancelled', manufacturing: 2, purchase: 1, repair: 1 },
  ];

  const qualityMetricsData = [
    { name: 'Pass Rate', value: 94, color: '#10b981' },
    { name: 'Defect Rate', value: 6, color: '#ef4444' },
  ];

  const modules = [
    {
      name: 'Project',
      href: '/project-management',
      icon: FolderKanban,
      gradient: 'from-emerald-500 to-teal-600',
      count: manufacturingOrders.length,
      status: manufacturingOrders.filter(order => order.status === 'in-progress').length,
      description: 'Production orders and planning',
      trend: '+12%',
      trendUp: true
    },
    {
      name: 'Production',
      href: '/production',
      icon: Factory,
      gradient: 'from-orange-500 to-red-600',
      count: maintenanceRecords.length,
      status: maintenanceRecords.filter(record => record.status === 'scheduled').length,
      description: 'Equipment maintenance and schedules',
      trend: '+8%',
      trendUp: true
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      gradient: 'from-blue-500 to-indigo-600',
      count: inventory.length,
      status: inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').length,
      description: 'Stock levels and warehouse management',
      trend: '-3%',
      trendUp: false
    },
    {
      name: 'Purchase',
      href: '/purchase',
      icon: ShoppingCart,
      gradient: 'from-purple-500 to-pink-600',
      count: purchaseOrders.length,
      status: purchaseOrders.filter(order => order.status === 'sent').length,
      description: 'Purchase orders and suppliers',
      trend: '+15%',
      trendUp: true
    },
    {
      name: 'Quality',
      href: '/quality',
      icon: Shield,
      gradient: 'from-red-500 to-rose-600',
      count: qualityChecks.length,
      status: qualityChecks.filter(check => check.result === 'pending').length,
      description: 'Quality control and testing',
      trend: '+5%',
      trendUp: true
    },
    {
      name: 'Product Lifecycle',
      href: '/product-lifecycle',
      icon: GitBranch,
      gradient: 'from-indigo-500 to-purple-600',
      count: productRevisions.length,
      status: productRevisions.filter(revision => revision.status === 'review').length,
      description: 'Product revisions and change management',
      trend: '+7%',
      trendUp: true
    },
    {
      name: 'Repair',
      href: '/repair',
      icon: Wrench,
      gradient: 'from-amber-500 to-orange-600',
      count: repairOrders.length,
      status: repairOrders.filter(order => order.status === 'open').length,
      description: 'Repair orders and tracking',
      trend: '-2%',
      trendUp: false
    },
    {
      name: 'Barcode',
      href: '/barcode',
      icon: ScanLine,
      gradient: 'from-teal-500 to-cyan-600',
      count: 0,
      status: 0,
      description: 'Barcode scanning and tracking',
      trend: '0%',
      trendUp: true
    }
  ];

  const stats = [
    {
      name: 'Total Inventory Items',
      value: inventory.length,
      change: '+12%',
      changeType: 'positive',
      icon: Package,
      gradient: 'from-blue-500 to-indigo-600',
      description: 'Active items in warehouse'
    },
    {
      name: 'Active Manufacturing Orders',
      value: manufacturingOrders.filter(order => order.status === 'in-progress').length,
      change: '+8%',
      changeType: 'positive',
      icon: Factory,
      gradient: 'from-orange-500 to-red-600',
      description: 'Currently in production'
    },
    {
      name: 'Pending Quality Checks',
      value: qualityChecks.filter(check => check.result === 'pending').length,
      change: '-3%',
      changeType: 'negative',
      icon: Shield,
      gradient: 'from-emerald-500 to-teal-600',
      description: 'Awaiting inspection'
    },
    {
      name: 'Overdue Maintenance',
      value: maintenanceRecords.filter(record => record.status === 'scheduled').length,
      change: '+5%',
      changeType: 'positive',
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-600',
      description: 'Requires attention'
    }
  ];

  if (!canView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center bg-white p-12 rounded-2xl shadow-xl max-w-md">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h3>
          <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Overview of your supply chain operations and key metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.name} 
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                      stat.changeType === 'positive' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {stat.changeType === 'positive' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.name}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stat.description}
                    </p>
                  </div>
                </div>
                <div className={`h-1 bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Production Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Production Trends</h3>
                <p className="text-sm text-gray-600 mt-1">Weekly production vs target comparison</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-blue-700">Production</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-xs font-medium text-gray-700">Target</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={productionTrendData}>
                <defs>
                  <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="production" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#colorProduction)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#9ca3af" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Inventory Status Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Inventory Status</h3>
              <p className="text-sm text-gray-600 mt-1">Current stock distribution</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {inventoryStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Order Status Overview</h3>
              <p className="text-sm text-gray-600 mt-1">Breakdown of manufacturing, purchase, and repair orders</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="manufacturing" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="purchase" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="repair" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Modules Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.name}
                  to={module.href}
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-6">
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${module.gradient} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {module.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-3xl font-bold text-gray-900">{module.count}</div>
                        <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                          module.trendUp ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {module.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {module.trend}
                        </div>
                      </div>
                      {module.status > 0 && (
                        <div className="flex flex-col items-end">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 shadow-sm">
                            {module.status}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">alerts</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`h-1 bg-gradient-to-r ${module.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600 mt-1">Latest updates from your operations</p>
              </div>
              <Activity className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Quality check completed for Industrial Valve batch IV-2024-001</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <span className="flex-shrink-0 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                Completed
              </span>
            </div>
            <div className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Low stock alert: Aluminum Rods (45 units remaining)</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <span className="flex-shrink-0 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                Alert
              </span>
            </div>
            <div className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Factory className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Manufacturing order MO-001 started production</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <span className="flex-shrink-0 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                In Progress
              </span>
            </div>
            <div className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Purchase order PO-001 sent to Steel Corp Ltd</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
              <span className="flex-shrink-0 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
                Sent
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// import React, { useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useData } from '../contexts/DataContext';
// import Layout from '../components/Layout';
// import {
//   Package,
//   Factory,
//   ShoppingCart,
//   Settings,
//   Shield,
//   GitBranch,
//   Wrench,
//   ScanLine,
//   TrendingUp,
//   TrendingDown,
//   AlertTriangle,
//   CheckCircle,
//   FolderKanban,
//   ShieldAlert
// } from 'lucide-react';
// import { BASE_URL } from '@/utils/constants';
// import NotificationCenter from '../components/NotificationCenter';
// import { usePermission } from '@/hooks/userPermission';


// const Dashboard: React.FC = () => {
//   const {
//     inventory,
//     manufacturingOrders,
//     purchaseOrders,
//     maintenanceRecords,
//     qualityChecks,
//     productRevisions,
//     repairOrders
//   } = useData();

//   const canView = usePermission('dashboard', 'view');

//   useEffect(() => {
//     fetch(`${BASE_URL}/ok`)
//     .then((res) => {
//       if(!res.ok){
//          throw new Error("CANNOT connect to BACKEND");
//       }
//       return res.json();
//     })
//     .then((data:any) => console.log("Message from backend ->", data.message))
//     .catch((err) => console.log(err))
//   }, [])
  

//   const modules = [
//     {
//       name: 'Project',
//       href: '/project-management',
//       icon: FolderKanban,
//       color: 'bg-green-500',
//       count: manufacturingOrders.length,
//       status: manufacturingOrders.filter(order => order.status === 'in-progress').length,
//       description: 'Production orders and planning'
//     },
//     {
//       name: 'Production',
//       href: '/production',
//       icon: Factory,
//       color: 'bg-orange-500',
//       count: maintenanceRecords.length,
//       status: maintenanceRecords.filter(record => record.status === 'scheduled').length,
//       description: 'Equipment maintenance and schedules'
//     },
//     {
//       name: 'Inventory',
//       href: '/inventory',
//       icon: Package,
//       color: 'bg-blue-500',
//       count: inventory.length,
//       status: inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').length,
//       description: 'Stock levels and warehouse management'
//     },
//     {
//       name: 'Purchase',
//       href: '/purchase',
//       icon: ShoppingCart,
//       color: 'bg-purple-500',
//       count: purchaseOrders.length,
//       status: purchaseOrders.filter(order => order.status === 'sent').length,
//       description: 'Purchase orders and suppliers'
//     },
//     {
//       name: 'Quality',
//       href: '/quality',
//       icon: Shield,
//       color: 'bg-red-500',
//       count: qualityChecks.length,
//       status: qualityChecks.filter(check => check.result === 'pending').length,
//       description: 'Quality control and testing'
//     },
//     {
//       name: 'Product Lifecycle',
//       href: '/product-lifecycle',
//       icon: GitBranch,
//       color: 'bg-indigo-500',
//       count: productRevisions.length,
//       status: productRevisions.filter(revision => revision.status === 'review').length,
//       description: 'Product revisions and change management'
//     },
//     {
//       name: 'Repair',
//       href: '/repair',
//       icon: Wrench,
//       color: 'bg-yellow-500',
//       count: repairOrders.length,
//       status: repairOrders.filter(order => order.status === 'open').length,
//       description: 'Repair orders and tracking'
//     },
//     {
//       name: 'Barcode',
//       href: '/barcode',
//       icon: ScanLine,
//       color: 'bg-teal-500',
//       count: 0,
//       status: 0,
//       description: 'Barcode scanning and tracking'
//     }
//   ];

//   const stats = [
//     {
//       name: 'Total Inventory Items',
//       value: inventory.length,
//       change: '+12%',
//       changeType: 'positive',
//       icon: Package
//     },
//     {
//       name: 'Active Manufacturing Orders',
//       value: manufacturingOrders.filter(order => order.status === 'in-progress').length,
//       change: '+8%',
//       changeType: 'positive',
//       icon: Factory
//     },
//     {
//       name: 'Pending Quality Checks',
//       value: qualityChecks.filter(check => check.result === 'pending').length,
//       change: '-3%',
//       changeType: 'negative',
//       icon: Shield
//     },
//     {
//       name: 'Overdue Maintenance',
//       value: maintenanceRecords.filter(record => record.status === 'scheduled').length,
//       change: '+5%',
//       changeType: 'positive',
//       icon: AlertTriangle
//     }
//   ];

//   if (!canView) {
//     return (
//       <div className="text-center py-12 px-4">
//         <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
//         <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
//       </div>
//     );
//   }


//   return (
//     // <Layout>
//       <div className="space-y-6">
//         {/* Header with Notification Center */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
//             <p className="mt-1 text-sm text-gray-600">
//               Overview of your supply chain operations and key metrics
//             </p>
//           </div>
          
//           {/* Notification Center Integration */}
//           {/* <div className="flex items-center">
//              <NotificationCenter destination="dashboard" title="dashboardAlerts" />
//           </div> */}
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
//           {stats.map((stat) => {
//             const Icon = stat.icon;
//             return (
//               <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
//                 <div className="p-5">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0">
//                       <Icon className="h-6 w-6 text-gray-400" />
//                     </div>
//                     <div className="ml-5 w-0 flex-1">
//                       <dl>
//                         <dt className="text-sm font-medium text-gray-500 truncate">
//                           {stat.name}
//                         </dt>
//                         <dd className="flex items-baseline">
//                           <div className="text-2xl font-semibold text-gray-900">
//                             {stat.value}
//                           </div>
//                           <div className={`ml-2 flex items-baseline text-sm font-semibold ${
//                             stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
//                           }`}>
//                             {stat.changeType === 'positive' ? (
//                               <TrendingUp className="h-4 w-4 mr-1" />
//                             ) : (
//                               <TrendingDown className="h-4 w-4 mr-1" />
//                             )}
//                             {stat.change}
//                           </div>
//                         </dd>
//                       </dl>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Modules Grid */}
//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {modules.map((module) => {
//             const Icon = module.icon;
//             return (
//               <Link
//                 key={module.name}
//                 to={module.href}
//                 className="group relative bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
//               >
//                 <div>
//                   <span className={`inline-flex p-3 rounded-lg ${module.color} text-white`}>
//                     <Icon className="h-6 w-6" />
//                   </span>
//                 </div>
//                 <div className="mt-4">
//                   <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
//                     {module.name}
//                   </h3>
//                   <p className="mt-1 text-sm text-gray-500">{module.description}</p>
//                   <div className="mt-3 flex items-center justify-between">
//                     <span className="text-2xl font-bold text-gray-900">{module.count}</span>
//                     {module.status > 0 && (
//                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
//                         {module.status} alerts
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </Link>
//             );
//           })}
//         </div>

//         {/* Recent Activity */}
//         <div className="bg-white shadow rounded-lg">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
//           </div>
//           <div className="divide-y divide-gray-200">
//             <div className="px-6 py-4 flex items-center">
//               <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
//               <div className="flex-1">
//                 <p className="text-sm text-gray-900">Quality check completed for Industrial Valve batch IV-2024-001</p>
//                 <p className="text-xs text-gray-500">2 hours ago</p>
//               </div>
//             </div>
//             <div className="px-6 py-4 flex items-center">
//               <AlertTriangle className="h-5 w-5 text-orange-500 mr-3" />
//               <div className="flex-1">
//                 <p className="text-sm text-gray-900">Low stock alert: Aluminum Rods (45 units remaining)</p>
//                 <p className="text-xs text-gray-500">4 hours ago</p>
//               </div>
//             </div>
//             <div className="px-6 py-4 flex items-center">
//               <Factory className="h-5 w-5 text-blue-500 mr-3" />
//               <div className="flex-1">
//                 <p className="text-sm text-gray-900">Manufacturing order MO-001 started production</p>
//                 <p className="text-xs text-gray-500">1 day ago</p>
//               </div>
//             </div>
//             <div className="px-6 py-4 flex items-center">
//               <ShoppingCart className="h-5 w-5 text-purple-500 mr-3" />
//               <div className="flex-1">
//                 <p className="text-sm text-gray-900">Purchase order PO-001 sent to Steel Corp Ltd</p>
//                 <p className="text-xs text-gray-500">2 days ago</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     // </Layout>
//   );
// };

// export default Dashboard;