import React from "react";
// Import 'Link' and 'useLocation' from 'react-router-dom', not 'href' or 'Outlet'
import { Link, useLocation, Outlet, useNavigate, href } from "react-router-dom";
import NotificationHeader from "./NotificationHeader";
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
  TrendingUp,
  AlertTriangle,
  Droplet,
  HandCoins,
  UserRound,
  FileText,
  ReceiptIndianRupee,
  CircuitBoard,
  Users,
  PlaneTakeoff,
  CassetteTape,
  PenTool,
  FolderClosed,
  BarChart3,
  Warehouse,
  MapPin,
  Truck,
  FileTextIcon,
  Paintbrush,
  DatabaseZap,
} from "lucide-react";
import {} from "@/redux/slices/authSlice";
// --- ADD these imports for shadcn/ui Accordion ---
// (Adjust the path if your components are located elsewhere)
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
// interface LayoutProps {
//   children: React.ReactNode;
// }

const Layout: React.FC = () => {
  // const { user, logout } = useAuth();
  const { email } = useSelector((state: RootState) => state.auth);
  console.log("User email in Layout:", email);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const {log} = useSelector((state:RootState) => state.auth)

  // --- All your link arrays remain unchanged ---
  // (Keep mainLinks, inventoryLinks, productionLinks, projectLinks, and plantLinks exactly as they are)

  const handleLogout = () => {
    navigate("/login");
    dispatch(logout());
  };

  const mainLinks = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Project", href: "/project-management", icon: FolderKanban },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Purchase", href: "/purchase", icon: ShoppingCart },
    { name: "Production", href: "/production", icon: Factory },
    { name: "Quality Control", href: "/quality", icon: Shield },
    { name: "Plant & Machinery", href: "/plant-machinery", icon: FactoryIcon },
    { name: "Product Lifecycle", href: "/product-lifecycle", icon: GitBranch },
    { name: "Repair", href: "/repair", icon: Wrench },
    { name: "Barcode", href: "/barcode", icon: ScanLine },
    { name: "Permissions", href: "/permissions", icon: UserRound },
    { name: "Drawing", href: "/drawing", icon: Paintbrush },
  ];

  // Links for the Production Module
  const productionLinks = [
    { name: "Main Dashboard", href: "/", icon: Home }, // Link to go back
    {
      name: "Production Dashboard",
      href: "/production",
      icon: LayoutDashboard,
    },
    { name: "PPC", href: "/production/ppc", icon: Factory },
    { name: "Item Master", href: "/production/item-master", icon: Package },
    {
      name: "BOM Management",
      href: "/production/bom-management",
      icon: FactoryIcon,
    },
    {
      name: "Product Orders",
      href: "/production/product-orders",
      icon: ShoppingCart,
    },
    {
      name: "Work Center Mgt",
      href: "/production/work-center-management",
      icon: Factory,
    },
    {
      name: "Production Execution",
      href: "/production/productionexecution",
      icon: Factory,
    },
    {
      name: "Quality Inspection ",
      href: "/production/qualityinspection",
      icon: Factory,
    },
    {
      name: "Material Issue & Consumption",
      href: "/production/materialissue",
      icon: Factory,
    },
    {
      name: "Production Reporting & Analytics",
      href: "/production/production-report-analytics",
      icon: Factory,
    },
    {
      name: "Costing & Performance",
      href: "/production/costingperformance",
      icon: Factory,
    },
    {
      name: "Receipt",
      href: "/production/receipt-of-finish-goods",
      icon: Factory,
    },
    { name: "Reports", href: "/production/reports", icon: FileText },
  ];
  const inventoryLinks = [
    { name: "Inventory Dashboard", href: "/inventory", icon: Package },
    { name: "Overview", href: "/inventory", icon: BarChart3 },
    { name: "Products", href: "/inventory/products", icon: Package },
    { name: "Raw Materials", href: "/inventory/rawmaterials", icon: Warehouse },
    { name: "Warehouses", href: "/inventory/warehouses", icon: MapPin },
    { name: "Stores", href: "/inventory/stores", icon: Package },
    {
      name: "Forecasting",
      href: "/inventory/operations/forecasting",
      icon: Truck,
    },
    { name: "Delivery", href: "/inventory/operations/deliveries", icon: Truck },
    {
      name: "Scrap Orders",
      href: "/inventory/operations/scrap-order",
      icon: FileText,
    },
    {
      name: "Receipts",
      href: "/inventory/operations/receipt",
      icon: ReceiptIndianRupee,
    },
    { name: "Stock", href: "/inventory/reporting/stock", icon: Package },
    {
      name: "Inventory History",
      href: "/inventory/reporting/inventory-history",
      icon: FileText,
    },
    {
      name: "Move Analysis",
      href: "/inventory/reporting/moves-analysis",
      icon: FileText,
    },
    {
      name: "Valuation",
      href: "/inventory/reporting/valuation",
      icon: CircleDollarSign,
    },
    { name: "Operations", href: "/inventory/operations", icon: Warehouse },
    {
      name: "Reporting",
      href: "/inventory/reporting",
      icon: TrendingUp,
    },
    { name: "Settings", href: "/inventory/settings", icon: Settings },
    {name:"Master Data" , href:"/inventory/masterdata" , icon:DatabaseZap}
  ];

  // Links for the Purchase Module (tabs converted to pages)
  const purchaseLinks = [
    { name: "Main Dashboard", href: "/", icon: Home },
    {
      name: "Purchase Overview",
      href: "/purchase/overview",
      icon: LayoutDashboard,
    },
    { name: "RFQ", href: "/purchase/rfq", icon: FileText },
    { name: "Purchase Orders", href: "/purchase/orders", icon: ShoppingCart },
    { name: "Agreements", href: "/purchase/agreements", icon: FileText },
    { name: "Vendors", href: "/purchase/vendors", icon: Users },
    { name: "Reporting", href: "/purchase/reporting", icon: TrendingUp },
    { name: "Settings", href: "/purchase/settings", icon: Settings },
  ];

  // Links for the Project Management Module
  const projectLinks = [
    { name: "Main Dashboard", href: "/", icon: Home }, // Link to go back
    {
      name: "Project Dashboard",
      href: "/project-management",
      icon: FolderKanban,
    },
    {
      name: "Projects",
      href: "/project-management/projects",
      icon: FolderKanban,
    },
    { name: "WBS Management", href: "/project-management/wbs", icon: Network },
    { name: "Resources", href: "/project-management/resources", icon: User },
    {
      name: "Budget & Cost",
      href: "/project-management/budget",
      icon: CircleDollarSign,
    },
    {
      name: "Procurement & Material Tracking",
      href: "/project-management/ProcurementMaterialTracking",
      icon: GitBranch,
    },
    {
      name: "Progress Updates",
      href: "/project-management/progress",
      icon: GitBranch,
    },
    {
      name: "Billings",
      href: "/project-management/billing",
      icon: ReceiptIndianRupee,
    },
    {
      name: "Projects Reports",
      href: "/project-management/project-reports",
      icon: FileText,
    },
    {
      name: "Scheduling & Planning",
      href: "/project-management/planning",
      icon: PenTool,
    },
    {
      name: "Project Closure",
      href: "/project-management/project-closure",
      icon: FolderClosed,
    },
    {
      name: "Master Data",
      href: "/project-management/master-data",
      icon: FileTextIcon,
    },
  ];

  // Links for the Plant & Machinery Module
  const plantLinks = [
    { name: "Main Dashboard", href: "/", icon: Home }, // Link to go back
    { name: "P&M Dashboard", href: "/plant-machinery", icon: FactoryIcon },
    {
      name: "Equipment Mgt",
      href: "/plant-machinery/equipment",
      icon: Settings,
    },
    {
      name: "Machinery Mgt",
      href: "/plant-machinery/machinery",
      icon: Settings,
    },
    {
      name: "Preventive Maint.",
      href: "/plant-machinery/preventive-maintenance",
      icon: Wrench,
    },
    {
      name: "Breakdown Mgt",
      href: "/plant-machinery/breakdown",
      icon: AlertTriangle,
    },
    {
      name: "Spare Parts",
      href: "/plant-machinery/spare-parts",
      icon: Package,
    },
    // { name: 'Fuel & Lubricant', href: '/plant-machinery/fuel', icon: Droplet },
    {
      name: "Calibration & Safety",
      href: "/plant-machinery/safety",
      icon: Shield,
    },
    {
      name: "Equipment Allocation",
      href: "/plant-machinery/allocation",
      icon: HandCoins,
    },
    {
      name: "Equipment Costing",
      href: "/plant-machinery/costing",
      icon: CircleDollarSign,
    },
    {
      name: "Assets Disposal  Transafer",
      href: "/plant-machinery/assets-disposal",
      icon: CassetteTape,
    },
    { name: "P&M Reports", href: "/plant-machinery/reports", icon: TrendingUp },
    {
      name: "Preventive Planning",
      href: "/plant-machinery/preventive-planning",
      icon: PlaneTakeoff,
    },
    {
      name: "Teams and Technicians",
      href: "/plant-machinery/teams",
      icon: Users,
    },
    {
      name: "Kanban board",
      href: "/plant-machinery/kanban",
      icon: CircuitBoard,
    },
  ];

  // --- DELETE the old navigation logic ---
  // (Remove this entire block)
  /*
  let navigation: any[] = [];
  if (location.pathname.startsWith('/production')) {
    navigation = [...productionLinks]
  } else if (location.pathname.startsWith('/project-management')) {
    navigation = [...projectLinks]
  } else if (location.pathname.startsWith('/plant-machinery')) {
    navigation = [...plantLinks]
  } else {
    navigation = [...mainLinks]
  }
  */

  // --- ADD this logic to find the active module ---
  const activeModule = [
    { prefix: "/project-management", name: "Project" },
    { prefix: "/production", name: "Production" },
    { prefix: "/plant-machinery", name: "Plant & Machinery" },
    { prefix: "/purchase", name: "Purchase" },
  ].find((module) => location.pathname.startsWith(module.prefix));

  // This will keep the correct accordion open on page load
  const defaultActiveAccordion = activeModule ? activeModule.name : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg overflow-y-auto ">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-fit items-center justify-center border-b border-gray-200">
            <h1 className="text-xl py-4 font-bold text-gray-900">SCM Pro</h1>
          </div>

          {/* --- REPLACE the <nav> section with this Accordion logic --- */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            <Accordion
              type="single"
              collapsible
              defaultValue={defaultActiveAccordion}
              className="w-full"
            >
              {mainLinks.map((item) => {
                const Icon = item.icon;

                // Check if this item is a module that should have an accordion
                let subLinks: any[] | undefined;
                if (item.name === "Project") {
                  subLinks = projectLinks.slice(1); // Get all project links except "Main Dashboard"
                } else if (item.name === "Production") {
                  subLinks = productionLinks.slice(1); // Get all production links except "Main Dashboard"
                } else if (item.name === "Plant & Machinery") {
                  subLinks = plantLinks.slice(1); // Get all plant links except "Main Dashboard"
                } else if (item.name === "Purchase") {
                  subLinks = purchaseLinks.slice(1); // Get all purchase links except "Overview"
                } else if (item.name === "Inventory") {
                  subLinks = inventoryLinks.slice(1);
                }

                // --- If it has subLinks, render an Accordion Item ---
                if (subLinks) {
                  const isModuleActive = location.pathname.startsWith(
                    item.href
                  );

                  return (
                    <AccordionItem
                      value={item.name}
                      key={item.name}
                      className="border-b-0"
                    >
                      <AccordionTrigger
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors w-full justify-between hover:no-underline
                        ${
                          isModuleActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }
                        `}
                      >
                        <div className="flex items-center">
                          <Icon
                            className={`mr-3 h-5 w-5 transition-colors ${
                              isModuleActive
                                ? "text-blue-500"
                                : "text-gray-400 group-hover:text-gray-500"
                            }`}
                          />
                          {item.name}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-0 pl-7 space-y-1">
                        {subLinks.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive =
                            location.pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors w-full ${
                                isSubActive
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              <SubIcon
                                className={`mr-3 h-5 w-5 transition-colors ${
                                  isSubActive
                                    ? "text-blue-500"
                                    : "text-gray-400 group-hover:text-gray-500"
                                }`}
                              />
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  );
                }

                // --- Otherwise, render a regular Link ---
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 transition-colors ${
                        isActive
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </Accordion>
          </nav>
          {/* --- End of new <nav> section --- */}

          {/* User Profile */}
          <div className="border-t border-gray-200 p-4 grid grid-cols-2 ">
            {/* ... (user profile code remains the same) ... */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">{email || "No email"}</p>

                <p className="text-xs text-gray-500">Logged In</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Notification Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">SCM Pro</h1>
          <NotificationHeader />
        </div>
        
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
