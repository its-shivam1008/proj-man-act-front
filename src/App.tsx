import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/inventory/receipt" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
              <Route path="/inventory/deliveries" element={<ProtectedRoute><Deliveries /></ProtectedRoute>} />
              <Route path="/inventory/scrap-order" element={<ProtectedRoute><ScrapOrder /></ProtectedRoute>} />
              <Route path="/inventory/forecasting" element={<ProtectedRoute><Forecasting /></ProtectedRoute>} />
              <Route path="/inventory/reporting/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
              <Route path="/inventory/reporting/inventory-history" element={<ProtectedRoute><InventoryHistory /></ProtectedRoute>} />
              <Route path="/inventory/reporting/moves-analysis" element={<ProtectedRoute><MovesAnalysis /></ProtectedRoute>} />
              <Route path="/inventory/reporting/valuation" element={<ProtectedRoute><Valuation /></ProtectedRoute>} />
              <Route path="/inventory/form-builder" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
              <Route path="/manufacturing" element={<ProtectedRoute><Manufacturing /></ProtectedRoute>} />
              <Route path="/purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
              <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
              <Route path="/quality" element={<ProtectedRoute><Quality /></ProtectedRoute>} />
              <Route path="/product-lifecycle" element={<ProtectedRoute><ProductLifecycle /></ProtectedRoute>} />
              <Route path="/repair" element={<ProtectedRoute><Repair /></ProtectedRoute>} />
              <Route path="/barcode" element={<ProtectedRoute><Barcode /></ProtectedRoute>} />
            </Routes>
          </div>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;