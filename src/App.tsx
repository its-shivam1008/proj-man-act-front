import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';
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
import ProductionManagement from './pages/modules/ProductionManagement';
import ProductionDashboard from './pages/modules/ProductionDashboard';
import Dash from './pages/modules/Dashboard2';
import ItemMaster from './pages/modules/ItemMaster';
import BOMManagement from './pages/modules/BOMManagement';
import ProductionOrders from './pages/modules/ProductOrder';
import QualityControl from './pages/modules/QualityControl';
import WorkCenterManagement from './pages/modules/WorkCenterManagement';
import ReportsPage from './pages/modules/Reports'; 
// import Page from './pages/modules/Page';
// import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      {/* <AuthProvi> */}
      <DataProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* <Route path="/login" element={<Login />} /> */}
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/" element={<Dashboard />} />
            {/* <Route path="/new" element={<Page />} /> */}
            <Route path="/work-center-management" element={<WorkCenterManagement />} />
            <Route path="/quality-control" element={<QualityControl />} />
            <Route path="/product-orders" element={<ProductionOrders />} />
            <Route path="/bom-management" element={<BOMManagement />} />
            <Route path="/item-master" element={<ItemMaster />} />
            <Route path="/dashboard2" element={<Dash />} />
            <Route path="/production-management" element={<ProductionManagement />} />
            <Route path="/production-management/dashboard" element={<ProductionDashboard />} />
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
          </Routes>
        </div>
      </DataProvider>
      {/* </AuthProvider> */}
    </Router>
  );
}

export default App;