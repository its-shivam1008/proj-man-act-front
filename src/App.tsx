import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Form } from "react-router-dom";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { DataProvider } from "./contexts/DataContext";
import { ensureInitialized } from "./lib/storage";
// import Login from './pages/Login';
import InventoryDashboard from "./pages/InventoryDashboard";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/modules/Inventory";
import Receipt from "./pages/modules/inventory/Receipt";
import Deliveries from "./pages/modules/inventory/Deliveries";
import ScrapOrder from "./pages/modules/inventory/ScrapOrder";
import Forecasting from "./pages/modules/inventory/Forecasting";
import Stock from "./pages/modules/inventory/reporting/Stock";
import InventoryHistory from "./pages/modules/inventory/reporting/InventoryHistory";
import MovesAnalysis from "./pages/modules/inventory/reporting/MovesAnalysis";
import Valuation from "./pages/modules/inventory/reporting/Valuation";
import FormBuilder from "./pages/modules/inventory/FormBuilder";
// import Manufacturing from './pages/modules/Manufacturing';
import Purchase from "./pages/modules/Purchase";
// import Maintenance from './pages/modules/Maintenance';
import Quality from "./pages/modules/Quality";
import ProductLifecycle from "./pages/modules/ProductLifecycle";
import Repair from "./pages/modules/Repair";
import Barcode from "./pages/modules/Barcode";
// import ProductionManagement from './pages/modules/ProductionManagement';
// import ProductionDashboard from './pages/modules/ProductionDashboard';
import ProductionManagementDashboard from "./pages/modules/production/ProductionManagementDashboard";
import PPCDashboard from "./pages/modules/production/PPC";
import ItemMaster from "./pages/modules/production/ItemMaster";
import BOMManagement from "./pages/modules/production/BOMManagement";
import ProductionOrders from "./pages/modules/production/ProductOrder";
import QualityControl from "./pages/modules/QualityControl";
import WorkCenterManagement from "./pages/modules/production/WorkCenterManagement";
import ReportsPage from "./pages/modules/production/Reports";
import ProjectManagementDashboard from "./pages/modules/project-management/ProjectManagementDashboard";
import MaterialIssue from "./pages/modules/production/MaterialIssue&Consumption";
import BudgetPage from "./pages/modules/project-management/Budget";
import Projects from "./pages/modules/project-management/Projects";
import Reports from "./pages/modules/project-management/Reports2";
import Progress from "./pages/modules/project-management/Progress";
import WBS from "./pages/modules/project-management/WBS";
import Resources from "./pages/modules/project-management/Resources";
import BillingPage from "./pages/modules/project-management/Billing";
// import Milestones from './pages/modules/MileStones';
import ProcurementPage from "./pages/modules/project-management/Procurement&MaterialTracking";
// import ProductionExecution from './pages/modules/ProductionExecution';
// import Page from './pages/modules/Page';
// import ProtectedRoute from './components/ProtectedRoute';
import PlantMachinery from "./pages/modules/PlantMachinery";
import BreakdownMaintenancePage from "./pages/modules/plant-machinery/BreakdownMaintenance";
import CalibrationSafetyPage from "./pages/modules/plant-machinery/CalibrationSafety";
import PlantMachineryDashboard from "./pages/modules/plant-machinery/Dashboard";
import EquipmentAllocationPage from "./pages/modules/plant-machinery/EquipmentAllocation";
import EquipmentCostingPage from "./pages/modules/plant-machinery/EquipmentCosting";
import EquipmentMaster from "./pages/modules/plant-machinery/EquipmentMaster";
import MachineryManagement from "./pages/modules/plant-machinery/MachineryManagement";
import FuelLubricantPage from "./pages/modules/plant-machinery/FuelLubricant";
import PreventiveMaintenancePage from "./pages/modules/plant-machinery/PreventiveMaintenance";
import PlantMachineryReportsPage from "./pages/modules/plant-machinery/Reports";
import SparePartsPage from "./pages/modules/plant-machinery/SpareParts";
import Products from "./pages/modules/inventory/Products";
import QualityInspectionPage from "./pages/modules/production/QualityInspectionPage";
import ReceiptOfFinishedGoods from "./pages/modules/production/ReceiptOfFinishedGoods";
import CostingPerformance from "./pages/modules/production/CostingPerformance";
import ProductionExecution from "./pages/modules/production/ProductionExecution";
import { UserPermissionsPage } from "./pages/modules/UserPermissions";
import ProductionReportingAnalytics from "./pages/modules/production/ProductionReportingAnalytics";
import KanbanBoard from "./pages/modules/plant-machinery/KanbanBoard";
import PreventivePlanning from "./pages/modules/plant-machinery/PreventivePlanning";
import Teams from "./pages/modules/plant-machinery/TeamsAndTechnicians";
import AssetDisposalTransferPage from "./pages/modules/plant-machinery/AssetDisposalTransfer";
import MasterDataPage from "./pages/modules/project-management/MasterData";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";
import RFQ from "./pages/modules/purchase/RFQ";
import PurchaseOrder from "./pages/modules/purchase/PurchaseOrder";
import PurchaseOverview from "./pages/modules/purchase/PurchaseOverview";
import PurchaseAgreement from "./pages/modules/purchase/PurchaseAgreement";
import PurchaseVendors from "./pages/modules/purchase/PurchaseVendors";
import PurchaseReporting from "./pages/modules/purchase/PurchaseReporting";
import PurchaseSettings from "./pages/modules/purchase/PurchaseSettings";
import SchedulingPlaning from "./pages/modules/project-management/SchedulingPlaning";
import ProjectClosure from "./pages/modules/project-management/ProjectClosure";
import RawMaterialMaster from "./pages/modules/inventory/Raw-Material";
import WarehouseManagement from "./pages/modules/inventory/Warehouse";
import StoresManagement from "./pages/modules/inventory/Storage";
import Operations, {
  DeliveriesPage,
  ForecastingPage,
  ReceiptsPage,
  ScrapPage,
} from "./pages/modules/Operations";
import OperationsModule from "./pages/modules/Operations";
import ReportingModule, { InventoryHistoryPage, MovesAnalysisPage, StockPage, ValuationPage } from "./pages/modules/ReportingModule";
import Drawing from "./pages/modules/Drawing";
function App() {
  useEffect(() => {
    ensureInitialized();
  }, []);
  return (
    <Router>
      {/* <AuthProvi> */}
      <DataProvider>
        <div className="min-h-screen bg-gray-50">
          <Toaster richColors closeButton position="top-right" expand={true} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            {/* <Route path="/login" element={<Login />} /> */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/drawing" element={<Drawing />} />
              <Route path="/permissions" element={<UserPermissionsPage />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/product-lifecycle" element={<ProductLifecycle />} />
              <Route path="/repair" element={<Repair />} />
              <Route path="/barcode" element={<Barcode />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/receipt" element={<Receipt />} />
              <Route path="/inventory/deliveries" element={<Deliveries />} />
              <Route path="/inventory/products" element={<Products />} />
              <Route
                path="/inventory/rawmaterials"
                element={<RawMaterialMaster />}
              />
              <Route
                path="/inventory/warehouses"
                element={<WarehouseManagement />}
              />
              <Route path="/inventory/stores" element={<StoresManagement />} />
            
              <Route path="/inventory/form-builder" element={<FormBuilder />} />

              {/* <Route path="/inventory/manufacturing" element={<Manufacturing />} /> */}
              {/* <Route path="/inventory/maintenance" element={<Maintenance />} /> */}

              {/* production management */}
              <Route
                path="/production"
                element={<ProductionManagementDashboard />}
              />
              <Route
                path="/production/work-center-management"
                element={<WorkCenterManagement />}
              />
              <Route path="/production/ppc" element={<PPCDashboard />} />
              <Route
                path="/production/quality-control"
                element={<QualityControl />}
              />
              <Route
                path="/production/product-orders"
                element={<ProductionOrders />}
              />
              <Route
                path="/production/bom-management"
                element={<BOMManagement />}
              />
              <Route
                path="/production/qualityinspection"
                element={<QualityInspectionPage />}
              />
              <Route path="/production/item-master" element={<ItemMaster />} />
              <Route
                path="/production/productionexecution"
                element={<ProductionExecution />}
              />
              <Route
                path="/production/materialissue"
                element={<MaterialIssue />}
              />
              <Route path="/production/reports" element={<ReportsPage />} />
              <Route
                path="/production/receipt-of-finish-goods"
                element={<ReceiptOfFinishedGoods />}
              />
              <Route
                path="/production/costingperformance"
                element={<CostingPerformance />}
              />
              <Route
                path="/production/production-report-analytics"
                element={<ProductionReportingAnalytics />}
              />
              <Route
                path="/inventory/operations"
                element={<OperationsModule />}
              >
                <Route path="receipt" element={<ReceiptsPage />} />
                <Route path="deliveries" element={<DeliveriesPage />} />
                <Route path="scrap-order" element={<ScrapPage />} />
                <Route path="forecasting" element={<ForecastingPage />} />
              </Route>
              <Route path="/inventory/settings" element={<FormBuilder />} />
              <Route path="/inventory/reporting" element={<ReportingModule />}>
                <Route path="stock" element={<StockPage />} />
                <Route
                  path="inventory-history"
                  element={<InventoryHistoryPage />}
                />
                <Route path="moves-analysis" element={<MovesAnalysisPage />} />
                <Route path="valuation" element={<ValuationPage />} />
              </Route>
              {/* Project Management */}
              <Route
                path="/project-management"
                element={<ProjectManagementDashboard />}
              />
              <Route
                path="/project-management/budget"
                element={<BudgetPage />}
              />
              <Route
                path="/project-management/projects"
                element={<Projects />}
              />
              <Route path="/project-management/wbs" element={<WBS />} />
              <Route
                path="/project-management/resources"
                element={<Resources />}
              />
              <Route
                path="/project-management/ProcurementMaterialTracking"
                element={<ProcurementPage />}
              />
              <Route
                path="/project-management/project-reports"
                element={<Reports />}
              />
              <Route
                path="/project-management/progress"
                element={<Progress />}
              />
              <Route
                path="/project-management/billing"
                element={<BillingPage />}
              />
              <Route
                path="/project-management/planning"
                element={<SchedulingPlaning />}
              />
              <Route
                path="/project-management/project-closure"
                element={<ProjectClosure />}
              />
              <Route
                path="/project-management/master-data"
                element={<MasterDataPage />}
              />

              {/* <Route path="/project-management/milestones" element={<Milestones />} /> */}

              {/* Plant and Machinery */}
              <Route
                path="/plant-machinery"
                element={<PlantMachineryDashboard />}
              />
              <Route
                path="/plant-machinery/equipment"
                element={<EquipmentMaster />}
              />
              <Route
                path="/plant-machinery/machinery"
                element={<MachineryManagement />}
              />
              <Route
                path="/plant-machinery/preventive-maintenance"
                element={<PreventiveMaintenancePage />}
              />
              <Route
                path="/plant-machinery/breakdown"
                element={<BreakdownMaintenancePage />}
              />
              <Route
                path="/plant-machinery/spare-parts"
                element={<SparePartsPage />}
              />
              <Route
                path="/plant-machinery/fuel"
                element={<FuelLubricantPage />}
              />
              <Route
                path="/plant-machinery/allocation"
                element={<EquipmentAllocationPage />}
              />
              <Route
                path="/plant-machinery/Safety"
                element={<CalibrationSafetyPage />}
              />
              <Route
                path="/plant-machinery/costing"
                element={<EquipmentCostingPage />}
              />
              <Route
                path="/plant-machinery/reports"
                element={<PlantMachineryReportsPage />}
              />
              <Route path="/plant-machinery/kanban" element={<KanbanBoard />} />
              <Route
                path="/plant-machinery/preventive-planning"
                element={<PreventivePlanning />}
              />
              <Route path="/plant-machinery/teams" element={<Teams />} />
              <Route
                path="/plant-machinery/assets-disposal"
                element={<AssetDisposalTransferPage />}
              />

              {/* purchase order  */}
              <Route path="/purchase/rfq" element={<RFQ />} />
              <Route path="/purchase/orders" element={<PurchaseOrder />} />
              <Route
                path="/purchase/agreements"
                element={<PurchaseAgreement />}
              />
              <Route path="/purchase/vendors" element={<PurchaseVendors />} />
              <Route
                path="/purchase/reporting"
                element={<PurchaseReporting />}
              />
              <Route path="/purchase/settings" element={<PurchaseSettings />} />
              <Route path="/purchase/overview" element={<PurchaseOverview />} />
            </Route>
          </Routes>
        </div>
      </DataProvider>
      {/* </AuthProvider> */}
    </Router>
  );
}
// test commit
export default App;
