import React, { useEffect, useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import NotificationHeader from "./NotificationHeader";
// import { ChevronRight } from "lucide-react";
import {
  Home,
  Search,
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
  Building2,
  MessageCircle,
  Database,
  ShoppingBag,
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
import { Button } from "./ui/button";
import NotificationSidebar from "./SidebarNotidication";

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

  const buildSearchIndex = (modules: {
    parent: string;
    parentHref: string;
    links: NavLink[];
  }[]) => {
    return modules.flatMap((module) =>
      module.links.map((link) => ({
        label: link.name,
        href: link.href,
        parent: module.parent,
        key: link.key,
      }))
    );
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
    {name:"Purchase Order" , href:"/inventory/purchase-order" , icon:ShoppingBag , key:"purchase-order"},
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
  const [unreadCount, setUnreadCount] = useState(0);

  const projectLinks: NavLink[] = [
    { name: "Main Dashboard", href: "/", icon: Home },
    { name: "Project Dashboard", href: "/project-management", icon: FolderKanban, key: "projectDashboard" },
    { name: "Projects", href: "/project-management/projects", icon: FolderKanban, key: "projects" },
    { name: "WBS Management", href: "/project-management/wbs", icon: Network, key: "wbsManagement" },
    { name: "Scheduling & Planning", href: "/project-management/planning", icon: PenTool, key: "schedulingPlanning" },
    { name: "Procurement & Material Tracking", href: "/project-management/ProcurementMaterialTracking", icon: GitBranch, key: "procurementMaterialTracking" },
    { name: "Resources", href: "/project-management/resources", icon: User, key: "resources" },
    { name: "Budget & Cost", href: "/project-management/budget", icon: CircleDollarSign, key: "budgetCost" },
    { name: "Progress Updates", href: "/project-management/progress", icon: GitBranch, key: "progressUpdates" },
    { name: "Billings", href: "/project-management/billing", icon: ReceiptIndianRupee, key: "billings" },
    { name: "Projects Reports", href: "/project-management/project-reports", icon: FileText, key: "projectsReports" },
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
    {name:'Master Data' , href:'/plant-machinary/masterdata' , icon:Database, key:'plantmasterdata'}
  ];

  const activeModule = [
    { prefix: "/project-management", name: "Project" },
    { prefix: "/production", name: "Production" },
    { prefix: "/plant-machinery", name: "Plant & Machinery" },
    { prefix: "/purchase", name: "Purchase" },
    { prefix: "/inventory", name: "Inventory" },
  ].find((module) => location.pathname.startsWith(module.prefix));

  const defaultActiveAccordion = activeModule ? activeModule.name : undefined;

  const [openAccordion, setOpenAccordion] = useState<string | undefined>(
    defaultActiveAccordion
  );
  const [search, setSearch] = useState("");

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 2. Add Keyboard Shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);




  // const defaultActiveAccordion = activeModule ? activeModule.name : undefined;
  const searchItems = buildSearchIndex([
    {
      parent: "Project",
      parentHref: "/project-management",
      links: projectLinks.slice(1),
    },
    {
      parent: "Production",
      parentHref: "/production",
      links: productionLinks.slice(1),
    },
    {
      parent: "Inventory",
      parentHref: "/inventory",
      links: inventoryLinks,
    },
    {
      parent: "Purchase",
      parentHref: "/purchase",
      links: purchaseLinks.slice(1),
    },
    {
      parent: "Plant & Machinery",
      parentHref: "/plant-machinery",
      links: plantLinks.slice(1),
    },
  ]).filter((item) => hasViewAccess(item.key));
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-[#111113] shadow-xl overflow-y-auto border-r border-gray-800">
        <div className="flex h-full flex-col">
          {/* --- Header --- */}
          <div className="flex h-fit items-center justify-center border-b border-gray-800">
            <h1 className="text-xl py-4 font-bold text-white tracking-wide">ACT Bussiness Solutions</h1>
          </div>

          {/* --- Navigation --- */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            <Accordion
              type="single"
              collapsible
              value={openAccordion}
              onValueChange={setOpenAccordion}
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
                  if (visibleSubLinks.length === 0) return null;

                  const isModuleActive = location.pathname.startsWith(item.href);

                  return (
                    <AccordionItem
                      value={item.name}
                      key={item.name}
                      className="border-b-0"
                    >
                      <AccordionTrigger
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all w-full justify-between hover:no-underline
                    ${isModuleActive
                            ? "bg-blue-900/20 text-blue-400"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          }
                  `}
                      >
                        <div className="flex items-center">
                          <Icon className={`mr-3 h-5 w-5 transition-colors ${isModuleActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"}`} />
                          {item.name}
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pt-1 pb-0 pl-4 space-y-1">
                        <div className="border-l border-gray-700 pl-3 space-y-1">
                          {visibleSubLinks.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors w-full 
                            ${isSubActive
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                  }`}
                              >
                                <SubIcon className={`mr-3 h-5 w-5 transition-colors ${isSubActive ? "text-blue-400" : "text-gray-600 group-hover:text-gray-400"}`} />
                                {subItem.name}
                              </Link>
                            );
                          })}
                        </div>
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
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors 
                ${isActive
                        ? "bg-blue-900/20 text-blue-400"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </Accordion>
          </nav>

          {/* --- Footer / User Profile --- */}
          <div className="border-t border-gray-800 p-4 space-y-3 bg-[#111113]">
            <Link
              to="/profile"
              className="flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:border-gray-600">
                <User className="h-5 w-5 text-gray-400 group-hover:text-white" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">{userProfile?.fullname || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{email || "No email"}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="pl-64">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-3 flex items-center justify-between">

          {/* Left: Company & User */}
          <div className="flex items-center gap-3">
            {/* Company Icon Badge */}
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg 
                  flex items-center justify-center shadow-md ring-2 ring-blue-100">
              <Building2 className="w-5 h-5 text-white" />
            </div>

            {/* Company & User Details */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <h1 className="text-base font-semibold text-gray-900 truncate">
                {userProfile?.companyName || "ACT Business Solutions"}
              </h1>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600 truncate">
                  {userProfile?.fullname}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Search + Notifications */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="group flex items-center w-72 px-4 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-300 rounded-lg
                   hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            >
              <Search className="w-4 h-4 mr-2 text-gray-400 group-hover:text-gray-600" />
              <span className="flex-1 text-left">Search modules…</span>
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-white border rounded-md">
                CTRL&nbsp;K
              </kbd>
            </button>

            <NotificationSidebar
              open={isNotificationOpen}
              onOpenChange={setIsNotificationOpen}
              onUnreadChange={setUnreadCount}
            />


            <NotificationHeader />

            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* Main Content */}
        <main className="py-6">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {isSearchOpen && (
        <>
          {/* Backdrop with smooth blur */}
          <div
            onClick={() => {
              setIsSearchOpen(false);
              setSearch("");
            }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
          />

          {/* Modal Container */}
          <div className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
              {/* Header & Input */}
              <div className="relative border-b border-slate-100">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search for dashboards, inventory, reports, or settings..."
                  className="w-full pl-12 pr-24 py-4 text-base bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 placeholder:text-slate-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearch("");
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all duration-150"
                >
                  ESC
                </button>
              </div>

              {/* Results Area */}
              <div className="max-h-[60vh] overflow-y-auto">
                {search.length > 0 ? (
                  <div className="p-2">
                    {/* Section Label */}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Search Results
                    </div>

                    {/* Results List */}
                    <div className="space-y-1">
                      {searchItems
                        .filter((item) =>
                          item.label.toLowerCase().includes(search.toLowerCase())
                        )
                        .map((item) => (
                          <button
                            key={item.href}
                            onClick={() => {
                              setOpenAccordion(item.parent);
                              navigate(item.href);
                              setIsSearchOpen(false);
                              setSearch("");
                            }}
                            className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-transparent hover:border-blue-100 hover:shadow-sm"
                          >
                            {/* Icon Container */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                {item.label}
                              </div>
                              <div className="text-sm text-slate-500 truncate">
                                {item.parent}
                              </div>
                            </div>

                            {/* Arrow Indicator */}
                            <div className="flex-shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </button>
                        ))}

                      {/* Empty State Inside List */}
                      {searchItems.filter((i) =>
                        i.label.toLowerCase().includes(search.toLowerCase())
                      ).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                              <svg
                                className="w-8 h-8 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                              No results found
                            </h3>
                            <p className="text-sm text-slate-500 text-center max-w-sm">
                              We couldn't find anything matching{" "}
                              <span className="font-medium text-slate-700">"{search}"</span>
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                ) : (
                  /* Default State (No typing yet) */
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Where would you like to go?
                      </h3>
                      <p className="text-sm text-slate-500">
                        Search for dashboards, inventory, reports, or settings...
                      </p>
                    </div>

                    {/* Quick Suggestions */}
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                        Quick Access
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["Project", "Inventory", "Production", "Analytics", "Settings"].map(
                          (tag) => (
                            <button
                              key={tag}
                              onClick={() => setSearch(tag)}
                              className="px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-sm font-medium text-slate-700 hover:text-slate-900 transition-all duration-150 hover:shadow-sm"
                            >
                              {tag}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer / Status Bar */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-white rounded border border-slate-200 font-mono text-slate-600">
                      ↑↓
                    </kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-white rounded border border-slate-200 font-mono text-slate-600">
                      ↵
                    </kbd>
                    <span>Select</span>
                  </div>
                </div>
                <div className="text-slate-400 font-medium">SCM Pro Search</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Layout;