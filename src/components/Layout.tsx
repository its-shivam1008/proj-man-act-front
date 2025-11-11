import React from 'react';
import { href, Link, useLocation, Outlet } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Package,
  Factory,
  ShoppingCart,
  Settings,
  Shield,
  GitBranch,
  Wrench,
  ScanLine,
  LogOut,
  User,
  FactoryIcon,
  LayoutDashboard,
  CircleDollarSign,
  FolderKanban,
  Network,
  Flag,
  TrendingUp,      // <-- Add this
  AlertTriangle, // <-- Add this
  Droplet,
  HandCoins,
  UserRound,
  FileText,
  ReceiptIndianRupee
} from 'lucide-react';

// interface LayoutProps {
//   children: React.ReactNode;
// }

const Layout: React.FC = () => {
  // const { user, logout } = useAuth();
  const location = useLocation();

  const mainLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Inventory', href: '/inventory/dashboard', icon: Package },
    { name: 'Production', href: '/production', icon: Factory },
    { name: 'Project', href: '/project-management', icon: FolderKanban },
    { name: 'Plant & Machinery', href: '/plant-machinery', icon: FactoryIcon },
    { name: 'Permissions', href: '/permissions', icon: UserRound },
  ];

  // Links for the Inventory Module
  const inventoryLinks = [
    { name: 'Main Dashboard', href: '/', icon: Home }, // Link to go back
    { name: 'Dashboard', href: '/inventory/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Manufacturing', href: '/inventory/manufacturing', icon: Factory },
    { name: 'Purchase', href: '/inventory/purchase', icon: ShoppingCart },
    { name: 'Maintenance', href: '/inventory/maintenance', icon: Settings },
    { name: 'Quality', href: '/inventory/quality', icon: Shield },
    { name: 'Product Lifecycle', href: '/inventory/product-lifecycle', icon: GitBranch },
    { name: 'Repair', href: '/inventory/repair', icon: Wrench },
    { name: 'Barcode', href: '/inventory/barcode', icon: ScanLine },
  ];

  // Links for the Production Module
  const productionLinks = [
    { name: 'Main Dashboard', href: '/', icon: Home }, // Link to go back
    { name: 'Production Dashboard', href: '/production', icon: LayoutDashboard },
    { name: 'PPC', href: '/production/ppc', icon: Factory },
    { name: 'Item Master', href: '/production/item-master', icon: Package },
    { name: 'BOM Management', href: '/production/bom-management', icon: FactoryIcon },
    { name: 'Product Orders', href: '/production/product-orders', icon: ShoppingCart },
    // { name: 'Quality Control', href: '/production/quality-control', icon: Shield },
    { name: 'Work Center Mgt', href: '/production/work-center-management', icon: Factory },
    { name: 'Production Execution', href: '/production/productionexecution', icon: Factory },
    { name: 'Quality Inspection ', href: '/production/qualityinspection', icon: Factory },
    { name: 'Material Issue & Consumption', href: '/production/materialissue', icon: Factory },
    {name:'Production Reporting & Analytics' , href:'/production/production-report-analytics' , icon:Factory},
    { name: 'Costing & Performance', href: '/production/costingperformance', icon: Factory },
    { name: 'Receipt', href: '/production/receipt-of-finish-goods', icon: Factory },
    { name: 'Reports', href: '/production/reports', icon: FileText },
  ];

  // Links for the Project Management Module
  const projectLinks = [
    { name: 'Main Dashboard', href: '/', icon: Home }, // Link to go back
    { name: 'Project Dashboard', href: '/project-management', icon: FolderKanban },
    { name: 'Projects', href: '/project-management/projects', icon: FolderKanban },
    { name: 'WBS Management', href: '/project-management/wbs', icon: Network },
    { name: 'Resources', href: '/project-management/resources', icon: User },
    { name: 'Budget & Cost', href: '/project-management/budget', icon: CircleDollarSign },
    { name: 'Procurement & Material Tracking', href: '/project-management/ProcurementMaterialTracking', icon: GitBranch },
    { name: 'Progress Updates', href: '/project-management/progress', icon: GitBranch },
    { name: 'Billings', href: '/project-management/billing', icon: ReceiptIndianRupee },
    // { name: 'Milestones', href: '/project-management/milestones', icon: Flag },
    { name: 'Projects Reports', href: '/project-management/project-reports', icon: FileText },

  ];

  // Links for the Plant & Machinery Module
  const plantLinks = [
    { name: 'Main Dashboard', href: '/', icon: Home }, // Link to go back
    { name: 'P&M Dashboard', href: '/plant-machinery', icon: FactoryIcon },
    { name: 'Equipment Mgt', href: '/plant-machinery/equipment', icon: Settings },
    { name: 'Preventive Maint.', href: '/plant-machinery/preventive-maintenance', icon: Wrench },
    { name: 'Breakdown Mgt', href: '/plant-machinery/breakdown', icon: AlertTriangle },
    { name: 'Spare Parts', href: '/plant-machinery/spare-parts', icon: Package },
    { name: 'Fuel & Lubricant', href: '/plant-machinery/fuel', icon: Droplet },
    { name: 'Calibration & Safety', href: '/plant-machinery/safety', icon: Shield },
    { name: 'Equipment Allocation', href: '/plant-machinery/allocation', icon: HandCoins },
    { name: 'Equipment Costing', href: '/plant-machinery/costing', icon: CircleDollarSign },
    { name: 'P&M Reports', href: '/plant-machinery/reports', icon: TrendingUp },
  ];

  // const navigation = [
  //   { name: 'Dashboard', href: '/', icon: Home },
  //   { name: 'Inventory', href: '/inventory', icon: Package },
  //   { name: 'Manufacturing', href: '/manufacturing', icon: Factory },
  //   { name: 'Purchase', href: '/purchase', icon: ShoppingCart },
  //   { name: 'Maintenance', href: '/maintenance', icon: Settings },
  //   { name: 'Quality', href: '/quality', icon: Shield },
  //   { name: 'Product Lifecycle', href: '/product-lifecycle', icon: GitBranch },
  //   { name: 'Repair', href: '/repair', icon: Wrench },
  //   { name: 'Barcode', href: '/barcode', icon: ScanLine },
  //   // { name: 'Production Management', href: '/production-management', icon: FactoryIcon },
  //   // { name: 'Production Management Dashboard', href: '/production-management/dashboard', icon: LayoutDashboard },
  //   //Projects
  //   {name:'Project Dashboard',href:'/dashboard3',icon:FolderKanban},
  //   {name:'Projects',href:'/projects' ,icon:FolderKanban},
  //   {name:'WBS Management',href:'/wbs' ,icon:Network},
  //   {name:'Resources',href:'/resources' ,icon:User},
  //   {name:'Budget & Cost',href:'/budget' ,icon:CircleDollarSign},
  //   {name:'Progress Updates',href:'/progress' ,icon:GitBranch},
  //   {name:'Milestones',href:'/milestones' ,icon:Flag},
  //   // {name:'Projects Reports',href:'/projects-reports' ,icon:Factory},

  //   {name:'Permissions',href:'/permissions' ,icon: UserRound },

  //   //Production
  //   { name: 'Production Dashboard ', href: '/dashboard2', icon: LayoutDashboard },
  //   { name: 'Item Master', href: '/item-master', icon: Package }, 
  //   { name: 'BOM Management', href: '/bom-management', icon: FactoryIcon },
  //   { name: 'Product Orders', href: '/product-orders', icon: ShoppingCart },
  //   { name: 'Quality Control', href: '/quality-control', icon: Shield },
  //   { name: 'Work Center Management', href: '/work-center-management', icon: Factory },
  //   { name: 'Reports', href: '/reports', icon: Factory },
  //   // {name:'Budget',href:'/budget' ,icon:CircleDollarSign}
  //   // { name: 'New', href: '/new', icon: Home }

  //   // --- ADD PLANT & MACHINERY LINKS BELOW ---
  //   { name: 'Plant & Machinery', href: '/plant-machinery', icon: FactoryIcon },
  //   { name: 'Equipment Mgt', href: '/plant-machinery/equipment', icon: Settings },
  //   { name: 'Preventive Maint.', href: '/plant-machinery/preventive-maintenance', icon: Wrench },
  //   { name: 'Breakdown Mgt', href: '/plant-machinery/breakdown', icon: AlertTriangle },
  //   { name: 'Spare Parts', href: '/plant-machinery/spare-parts', icon: Package },
  //   { name: 'Fuel & Lubricant', href: '/plant-machinery/fuel', icon: Droplet },
  //   { name: 'Calibration & Safety', href: '/plant-machinery/safety', icon: Shield },
  //   { name: 'Equipment Allocation', href: '/plant-machinery/allocation', icon: HandCoins },
  //   { name: 'Equipment Costing', href: '/plant-machinery/costing', icon: CircleDollarSign },
  //   { name: 'P&M Reports', href: '/plant-machinery/reports', icon: TrendingUp },
  //   // --- END OF NEW LINKS ---
  // ];

  let navigation: any[] = [];
  if (location.pathname.startsWith('/inventory')) {
    navigation = [...inventoryLinks]
  } else if (location.pathname.startsWith('/production')) {
    navigation = [...productionLinks]
  } else if (location.pathname.startsWith('/project-management')) {
    navigation = [...projectLinks]
  } else if (location.pathname.startsWith('/plant-machinery')) {
    navigation = [...plantLinks]
  } else {
    navigation = [...mainLinks]
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg overflow-y-auto ">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-fit items-center justify-center border-b border-gray-200">
            <h1 className="text-xl py-4 font-bold text-gray-900">SCM Pro</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-200 p-4 flex items-center ">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                {/* <p className="text-sm font-medium text-gray-700">{user?.name}</p> */}
                {/* <p className="text-xs text-gray-500">{user?.role}</p> */}
              </div>
            </div>
            <button
              // onClick={logout}
              className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;