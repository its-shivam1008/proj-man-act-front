import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import { DataProvider } from './contexts/DataContext';
// import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/modules/Inventory';
import Receipt from './pages/modules/inventory/Receipt';
import Deliveries from './pages/modules/inventory/Deliveries';
import ScrapOrder from './pages/modules/inventory/ScrapOrder';
import Forecasting from './pages/modules/inventory/Forecasting';
import Stock from './pages/modules/inventory/reporting/Stock';
import InventoryHistory from './pages/modules/inventory/reporting/InventoryHistory';
import MovesAnalysis from './pages/modules/inventory/reporting/MovesAnalysis';
import Valuation from './pages/modules/inventory/reporting/Valuation';
import FormBuilder from './pages/modules/inventory/FormBuilder';
import Manufacturing from './pages/modules/Manufacturing';
import Purchase from './pages/modules/Purchase';
import Maintenance from './pages/modules/Maintenance';
import Quality from './pages/modules/Quality';
import ProductLifecycle from './pages/modules/ProductLifecycle';
import Repair from './pages/modules/Repair';
import Barcode from './pages/modules/Barcode';
// import ProductionManagement from './pages/modules/ProductionManagement';
// import ProductionDashboard from './pages/modules/ProductionDashboard';
import Dash from './pages/modules/Dashboard2';
import ItemMaster from './pages/modules/ItemMaster';
import BOMManagement from './pages/modules/BOMManagement';
import ProductionOrders from './pages/modules/ProductOrder';
import QualityControl from './pages/modules/QualityControl';
import WorkCenterManagement from './pages/modules/WorkCenterManagement';
import ReportsPage from './pages/modules/Reports'; 
import Dashboard3 from './pages/modules/Dashboard3';
import BudgetPage from './pages/modules/Budget';
import Projects from './pages/modules/Projects';
import Reports from './pages/modules/Reports2';
import Progress from './pages/modules/Progress';
import WBS from './pages/modules/WBS';
import Resources from './pages/modules/Resources';
import Milestones from './pages/modules/MileStones';
// import Page from './pages/modules/Page';
// import ProtectedRoute from './components/ProtectedRoute';
import PlantMachinery from './pages/modules/PlantMachinery';
import BreakdownMaintenancePage from './pages/modules/plant-machinery/BreakdownMaintenance';
import CalibrationSafetyPage from './pages/modules/plant-machinery/CalibrationSafety';
import PlantMachineryDashboard from './pages/modules/plant-machinery/Dashboard';
import EquipmentAllocationPage from './pages/modules/plant-machinery/EquipmentAllocation';
import EquipmentCostingPage from './pages/modules/plant-machinery/EquipmentCosting';
import EquipmentMaster from './pages/modules/plant-machinery/EquipmentMaster';
import FuelLubricantPage from './pages/modules/plant-machinery/FuelLubricant';
import PreventiveMaintenancePage from './pages/modules/plant-machinery/PreventiveMaintenance';
import PlantMachineryReportsPage from './pages/modules/plant-machinery/Reports';
import SparePartsPage from './pages/modules/plant-machinery/SpareParts';


function App() {
  return (
    <Router>
      {/* <AuthProvi> */}
      <DataProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* <Route path="/login" element={<Login />} /> */}
            <Route element={<Layout />}>
            <Route path="/dashboard3" element={<Dashboard3 />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/wbs" element={<WBS />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/projects-reports" element={<Reports />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/milestones" element={<Milestones />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/" element={<Dashboard />} />
            {/* <Route path="/new" element={<Page />} /> */}
            <Route path="/work-center-management" element={<WorkCenterManagement />} />
            <Route path="/quality-control" element={<QualityControl />} />
            <Route path="/product-orders" element={<ProductionOrders />} />
            <Route path="/bom-management" element={<BOMManagement />} />
            <Route path="/item-master" element={<ItemMaster />} />
            <Route path="/dashboard2" element={<Dash />} />
            {/* <Route path="/production-management" element={<ProductionManagement />} /> */}
            {/* <Route path="/production-management/dashboard" element={<ProductionDashboard />} /> */}
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/receipt" element={<Receipt />} />
            <Route path="/inventory/deliveries" element={<Deliveries />} />
            <Route path="/inventory/scrap-order" element={<ScrapOrder />} />
            <Route path="/inventory/forecasting" element={<Forecasting />} />
            <Route path="/inventory/reporting/stock" element={<Stock />} />
            <Route path="/inventory/reporting/inventory-history" element={<InventoryHistory />} />
            <Route path="/inventory/reporting/moves-analysis" element={<MovesAnalysis />} />
            <Route path="/inventory/reporting/valuation" element={<Valuation />} />
            <Route path="/inventory/form-builder" element={<FormBuilder />} />
            <Route path="/manufacturing" element={<Manufacturing />} />
            <Route path="/purchase" element={<Purchase />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/quality" element={<Quality />} />
            <Route path="/product-lifecycle" element={<ProductLifecycle />} />
            <Route path="/repair" element={<Repair />} />
            <Route path="/barcode" element={<Barcode />} />
            <Route path="/plant-machinery" element={<PlantMachineryDashboard />} />
            <Route path="/plant-machinery/equipment" element={<EquipmentMaster />} />
            <Route path="/plant-machinery/preventive-maintenance" element={<PreventiveMaintenancePage />} />
            <Route path="/plant-machinery/breakdown" element={<BreakdownMaintenancePage />} />
            <Route path="/plant-machinery/spare-parts" element={<SparePartsPage />} />
            <Route path="/plant-machinery/fuel" element={<FuelLubricantPage />} />
            <Route path="/plant-machinery/allocation" element={<EquipmentAllocationPage />} />
            <Route path="/plant-machinery/Safety" element={<CalibrationSafetyPage />} />
            <Route path="/plant-machinery/costing" element={<EquipmentCostingPage />} />
            <Route path="/plant-machinery/reports" element={<PlantMachineryReportsPage />} />
            </Route>
          </Routes>
        </div>
      </DataProvider>
      {/* </AuthProvider> */}
    </Router>
  );
}

export default App;