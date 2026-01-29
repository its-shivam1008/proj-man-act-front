import React, { useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import NotificationHeader from "./NotificationHeader";
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
  TrendingUp,
  AlertTriangle,
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
  Paintbrush,
  DatabaseZap,
  FileTextIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";

interface NavLink {
  name: string;
  href: string;
  icon: React.ElementType;
  key?: string;
}

const Layout: React.FC = () => {
  const { email, userProfile } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    navigate("/login");
    dispatch(logout());
  };

  const hasViewAccess = (key?: string) => {
    if (!key) return true;
    if (userProfile?.role === 'admin') return true;
    const perms = userProfile?.permissions || {};
    return perms[key]?.view === true;
  };

  const mainLinks: NavLink[] = [
    { name: "Dashboard", href: "/", icon: Home, key: "dashboard" },
    { name: "Project", href: "/project-management", icon: FolderKanban, key: "project" },
    { name: "Inventory", href: "/inventory", icon: Package, key: "inventory" },
    { name: "Purchase", href: "/purchase", icon: ShoppingCart, key: "purchase" },
    { name: "Production", href: "/production", icon: Factory, key: "production" },
    { name: "Quality Control", href: "/quality", icon: Shield, key: "qualityControl" },
    { name: "Plant & Machinery", href: "/plant-machinery", icon: FactoryIcon, key: "plantMachinery" },
    { name: "Product Lifecycle", href: "/product-lifecycle", icon: GitBranch, key: "productLifecycle" },
    { name: "Repair", href: "/repair", icon: Wrench, key: "repair" },
    { name: "Barcode", href: "/barcode", icon: ScanLine, key: "barcode" },
    { name: "Permissions", href: "/permissions", icon: UserRound, key: "permissions" },
    { name: "Drawing", href: "/drawing", icon: Paintbrush, key: "drawing" },
  ];

  const productionLinks: NavLink[] = [
    { name: "Main Dashboard", href: "/", icon: Home },
    { name: "Production Dashboard", href: "/production", icon: LayoutDashboard, key: "productionDashboard" },
    { name: "PPC", href: "/production/ppc", icon: Factory, key: "ppc" },
    { name: "Item Master", href: "/production/item-master", icon: Package, key: "itemMaster" },
    { name: 'Routing', href: '/production/routing', icon: Package, key: 'routing' },
    { name: "BOM Management", href: "/production/bom-management", icon: FactoryIcon, key: "bomManagement" },
    { name: "Product Orders", href: "/production/product-orders", icon: ShoppingCart, key: "productOrders" },
    { name: "Work Center Mgt", href: "/production/work-center-management", icon: Factory, key: "workCenterMgt" },
    { name: "Production Execution", href: "/production/productionexecution", icon: Factory, key: "productionExecution" },
    { name: "Quality Inspection ", href: "/production/qualityinspection", icon: Factory, key: "qualityInspection" },
    { name: "Material Issue & Consumption", href: "/production/materialissue", icon: Factory, key: "materialIssueConsumption" },
    { name: "Production Reporting & Analytics", href: "/production/production-report-analytics", icon: Factory, key: "productionReportingAnalytics" },
    { name: "Costing & Performance", href: "/production/costingperformance", icon: Factory, key: "costingPerformance" },
    { name: "Receipt", href: "/production/receipt-of-finish-goods", icon: Factory, key: "receipt" },
    { name: "Reports", href: "/production/reports", icon: FileText, key: "productionReports" },
  ];

  const inventoryLinks: NavLink[] = [
    { name: "Inventory Dashboard", href: "/inventory", icon: Package, key: "inventoryDashboard" },
    { name: "Overview", href: "/inventory", icon: BarChart3, key: "inventoryOverview" },
    { name: "Products", href: "/inventory/products", icon: Package, key: "products" },
    { name: "Raw Materials", href: "/inventory/rawmaterials", icon: Warehouse, key: "rawMaterials" },
    { name: "Warehouses", href: "/inventory/warehouses", icon: MapPin, key: "warehouses" },
    { name: "Stores", href: "/inventory/stores", icon: Package, key: "stores" },
    { name: "Forecasting", href: "/inventory/operations/forecasting", icon: Truck, key: "forecasting" },
    { name: "Delivery", href: "/inventory/operations/deliveries", icon: Truck, key: "deliveries" },
    { name: "Scrap Orders", href: "/inventory/operations/scrap-order", icon: FileText, key: "scrap" },
    { name: "Stock", href: "/inventory/reporting/stock", icon: Package, key: "stocks" },
    { name: "Inventory History", href: "/inventory/reporting/inventory-history", icon: FileText, key: "inventoryHistory" },
    { name: "Move Analysis", href: "/inventory/reporting/moves-analysis", icon: FileText, key: "movesAnalysis" },
    { name: "Valuation", href: "/inventory/reporting/valuation", icon: CircleDollarSign, key: "valuation" },
    { name: "Settings", href: "/inventory/settings", icon: Settings, key: "inventorySettings" },
    { name: "Master Data", href: "/inventory/masterdata", icon: DatabaseZap, key: "masterdatainv" },
  ];

  const purchaseLinks: NavLink[] = [
    { name: "Main Dashboard", href: "/", icon: Home },
    { name: "Purchase Overview", href: "/purchase/overview", icon: LayoutDashboard, key: "purchaseOverview" },
    { name: "RFQ", href: "/purchase/rfq", icon: FileText, key: "rfq" },
    { name: "Purchase Orders", href: "/purchase/orders", icon: ShoppingCart, key: "purchaseOrders" },
    { name: "Agreements", href: "/purchase/agreements", icon: FileText, key: "agreements" },
    { name: "Vendors", href: "/purchase/vendors", icon: Users, key: "vendors" },
    { name: "Reporting", href: "/purchase/reporting", icon: TrendingUp, key: "purchaseReporting" },
    { name: "Settings", href: "/purchase/settings", icon: Settings, key: "purchaseSettings" },
  ];

  const projectLinks: NavLink[] = [
    { name: "Main Dashboard", href: "/", icon: Home },
    { name: "Project Dashboard", href: "/project-management", icon: FolderKanban, key: "projectDashboard" },
    { name: "Projects", href: "/project-management/projects", icon: FolderKanban, key: "projects" },
    { name: "WBS Management", href: "/project-management/wbs", icon: Network, key: "wbsManagement" },
    { name: "Resources", href: "/project-management/resources", icon: User, key: "resources" },
    { name: "Budget & Cost", href: "/project-management/budget", icon: CircleDollarSign, key: "budgetCost" },
    { name: "Procurement & Material Tracking", href: "/project-management/ProcurementMaterialTracking", icon: GitBranch, key: "procurementMaterialTracking" },
    { name: "Progress Updates", href: "/project-management/progress", icon: GitBranch, key: "progressUpdates" },
    { name: "Billings", href: "/project-management/billing", icon: ReceiptIndianRupee, key: "billings" },
    { name: "Projects Reports", href: "/project-management/project-reports", icon: FileText, key: "projectsReports" },
    { name: "Scheduling & Planning", href: "/project-management/planning", icon: PenTool, key: "schedulingPlanning" },
    { name: "Project Closure", href: "/project-management/project-closure", icon: FolderClosed, key: "projectClosure" },
    { name: "Master Data", href: "/project-management/master-data", icon: FileTextIcon, key: "masterData" },
  ];

  const plantLinks: NavLink[] = [
    { name: "Main Dashboard", href: "/", icon: Home },
    { name: "P&M Dashboard", href: "/plant-machinery", icon: FactoryIcon, key: "pmDashboard" },
    { name: "Equipment Mgt", href: "/plant-machinery/equipment", icon: Settings, key: "equipmentMaster" },
    { name: "Machinery Mgt", href: "/plant-machinery/machinery", icon: Settings, key: "machineryManagement" },
    { name: "Preventive Maint.", href: "/plant-machinery/preventive-maintenance", icon: Wrench, key: "preventiveMaint" },
    { name: "Breakdown Mgt", href: "/plant-machinery/breakdown", icon: AlertTriangle, key: "breakdownMgt" },
    { name: "Spare Parts", href: "/plant-machinery/spare-parts", icon: Package, key: "spareParts" },
    { name: "Calibration & Safety", href: "/plant-machinery/safety", icon: Shield, key: "calibrationSafety" },
    { name: "Equipment Allocation", href: "/plant-machinery/allocation", icon: HandCoins, key: "equipmentAllocation" },
    { name: "Equipment Costing", href: "/plant-machinery/costing", icon: CircleDollarSign, key: "equipmentCosting" },
    { name: "Assets Disposal Transafer", href: "/plant-machinery/assets-disposal", icon: CassetteTape, key: "assetsDisposalTransfer" },
    { name: "P&M Reports", href: "/plant-machinery/reports", icon: TrendingUp, key: "pmReports" },
    { name: "Preventive Planning", href: "/plant-machinery/preventive-planning", icon: PlaneTakeoff, key: "preventivePlanning" },
    { name: "Teams and Technicians", href: "/plant-machinery/teams", icon: Users, key: "teamsTechnicians" },
    { name: "Kanban board", href: "/plant-machinery/kanban", icon: CircuitBoard, key: "kanbanBoard" },
  ];

  const activeModule = [
    { prefix: "/project-management", name: "Project" },
    { prefix: "/production", name: "Production" },
    { prefix: "/plant-machinery", name: "Plant & Machinery" },
    { prefix: "/purchase", name: "Purchase" },
    { prefix: "/inventory", name: "Inventory" },
  ].find((module) => location.pathname.startsWith(module.prefix));

  const defaultActiveAccordion = activeModule ? activeModule.name : undefined;

  // --- Auto-Redirect Logic ---
  useEffect(() => {
    if (location.pathname === "/" && !hasViewAccess("dashboard")) {
      const findFirstAllowedRoute = () => {
        for (const item of mainLinks) {

          let subLinks: NavLink[] | undefined;

          if (item.name === "Project") subLinks = projectLinks.slice(1);
          else if (item.name === "Production") subLinks = productionLinks.slice(1);
          else if (item.name === "Plant & Machinery") subLinks = plantLinks.slice(1);
          else if (item.name === "Purchase") subLinks = purchaseLinks.slice(1);
          else if (item.name === "Inventory") subLinks = inventoryLinks;

          if (subLinks) {
            // Check children only
            const firstChild = subLinks.find((sub) => hasViewAccess(sub.key));
            if (firstChild) return firstChild.href;
          }
          else {
            if (hasViewAccess(item.key)) return item.href;
          }
        }
        return null;
      };

      const validRoute = findFirstAllowedRoute();
      if (validRoute) {
        navigate(validRoute, { replace: true });
      }
    }
  }, [location.pathname, userProfile]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg overflow-y-auto ">
        <div className="flex h-full flex-col">
          <div className="flex h-fit items-center justify-center border-b border-gray-200">
            <h1 className="text-xl py-4 font-bold text-gray-900">SCM Pro</h1>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            <Accordion
              type="single"
              collapsible
              defaultValue={defaultActiveAccordion}
              className="w-full"
            >
              {mainLinks.map((item) => {
                const Icon = item.icon;
                let subLinks: NavLink[] | undefined;

                if (item.name === "Project") subLinks = projectLinks.slice(1);
                else if (item.name === "Production") subLinks = productionLinks.slice(1);
                else if (item.name === "Plant & Machinery") subLinks = plantLinks.slice(1);
                else if (item.name === "Purchase") subLinks = purchaseLinks.slice(1);
                else if (item.name === "Inventory") subLinks = inventoryLinks;

                // --- MODULES RENDER LOGIC ---
                if (subLinks) {
                  const visibleSubLinks = subLinks.filter(sub => hasViewAccess(sub.key));

                  // [LOGIC UPDATED]: 
                  // If there are NO visible children, hide the entire parent Accordion.
                  // This applies even if the parent permission is TRUE.
                  if (visibleSubLinks.length === 0) {
                    return null;
                  }

                  const isModuleActive = location.pathname.startsWith(item.href);

                  return (
                    <AccordionItem
                      value={item.name}
                      key={item.name}
                      className="border-b-0"
                    >
                      <AccordionTrigger
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors w-full justify-between hover:no-underline
                        ${isModuleActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
                        `}
                      >
                        <div className="flex items-center">
                          <Icon className={`mr-3 h-5 w-5 transition-colors ${isModuleActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`} />
                          {item.name}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-0 pl-7 space-y-1">
                        {visibleSubLinks.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors w-full ${isSubActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            >
                              <SubIcon className={`mr-3 h-5 w-5 transition-colors ${isSubActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`} />
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  );
                }

                // --- STANDALONE LINKS RENDER LOGIC ---
                if (!hasViewAccess(item.key)) return null;

                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </Accordion>
          </nav>

          <div className="border-t border-gray-200 p-4 space-y-3">
            <Link
              to="/profile"
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.fullname || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{email || "No email"}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="pl-64">
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