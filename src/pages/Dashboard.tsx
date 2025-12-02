import React, { useEffect } from 'react';
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
  ShieldAlert
} from 'lucide-react';
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

  useEffect(() => {
    fetch(`${BASE_URL}/ok`)
    .then((res) => {
      if(!res.ok){
         throw new Error("CANNOT connect to BACKEND");
      }
      return res.json();
    })
    .then((data:any) => console.log("Message from backend ->", data.message))
    .catch((err) => console.log(err))
  }, [])
  

  const modules = [
    {
      name: 'Project',
      href: '/project-management',
      icon: FolderKanban,
      color: 'bg-green-500',
      count: manufacturingOrders.length,
      status: manufacturingOrders.filter(order => order.status === 'in-progress').length,
      description: 'Production orders and planning'
    },
    {
      name: 'Production',
      href: '/production',
      icon: Factory,
      color: 'bg-orange-500',
      count: maintenanceRecords.length,
      status: maintenanceRecords.filter(record => record.status === 'scheduled').length,
      description: 'Equipment maintenance and schedules'
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      color: 'bg-blue-500',
      count: inventory.length,
      status: inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').length,
      description: 'Stock levels and warehouse management'
    },
    {
      name: 'Purchase',
      href: '/purchase',
      icon: ShoppingCart,
      color: 'bg-purple-500',
      count: purchaseOrders.length,
      status: purchaseOrders.filter(order => order.status === 'sent').length,
      description: 'Purchase orders and suppliers'
    },
    {
      name: 'Quality',
      href: '/quality',
      icon: Shield,
      color: 'bg-red-500',
      count: qualityChecks.length,
      status: qualityChecks.filter(check => check.result === 'pending').length,
      description: 'Quality control and testing'
    },
    {
      name: 'Product Lifecycle',
      href: '/product-lifecycle',
      icon: GitBranch,
      color: 'bg-indigo-500',
      count: productRevisions.length,
      status: productRevisions.filter(revision => revision.status === 'review').length,
      description: 'Product revisions and change management'
    },
    {
      name: 'Repair',
      href: '/repair',
      icon: Wrench,
      color: 'bg-yellow-500',
      count: repairOrders.length,
      status: repairOrders.filter(order => order.status === 'open').length,
      description: 'Repair orders and tracking'
    },
    {
      name: 'Barcode',
      href: '/barcode',
      icon: ScanLine,
      color: 'bg-teal-500',
      count: 0,
      status: 0,
      description: 'Barcode scanning and tracking'
    }
  ];

  const stats = [
    {
      name: 'Total Inventory Items',
      value: inventory.length,
      change: '+12%',
      changeType: 'positive',
      icon: Package
    },
    {
      name: 'Active Manufacturing Orders',
      value: manufacturingOrders.filter(order => order.status === 'in-progress').length,
      change: '+8%',
      changeType: 'positive',
      icon: Factory
    },
    {
      name: 'Pending Quality Checks',
      value: qualityChecks.filter(check => check.result === 'pending').length,
      change: '-3%',
      changeType: 'negative',
      icon: Shield
    },
    {
      name: 'Overdue Maintenance',
      value: maintenanceRecords.filter(record => record.status === 'scheduled').length,
      change: '+5%',
      changeType: 'positive',
      icon: AlertTriangle
    }
  ];

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }


  return (
    // <Layout>
      <div className="space-y-6">
        {/* Header with Notification Center */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of your supply chain operations and key metrics
            </p>
          </div>
          
          {/* Notification Center Integration */}
          {/* <div className="flex items-center">
             <NotificationCenter destination="dashboard" title="dashboardAlerts" />
          </div> */}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stat.value}
                          </div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.changeType === 'positive' ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            {stat.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.name}
                to={module.href}
                className="group relative bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div>
                  <span className={`inline-flex p-3 rounded-lg ${module.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {module.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{module.count}</span>
                    {module.status > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {module.status} alerts
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">Quality check completed for Industrial Valve batch IV-2024-001</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">Low stock alert: Aluminum Rods (45 units remaining)</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center">
              <Factory className="h-5 w-5 text-blue-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">Manufacturing order MO-001 started production</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center">
              <ShoppingCart className="h-5 w-5 text-purple-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">Purchase order PO-001 sent to Steel Corp Ltd</p>
                <p className="text-xs text-gray-500">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    // </Layout>
  );
};

export default Dashboard;