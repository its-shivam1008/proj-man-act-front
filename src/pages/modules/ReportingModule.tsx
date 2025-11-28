// src/pages/inventory/reporting/ReportingModule.tsx
// Full Reporting module (Option R1) — nested routes + UI for Stock, Inventory History, Moves Analysis, Valuation

import React, { useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';

// Import your actual reporting pages
import Stock from '@/pages/modules/inventory/reporting/Stock';
import InventoryHistory from '@/pages/modules/inventory/reporting/InventoryHistory';
import MovesAnalysis from '@/pages/modules/project-management/MovesAnalysis';
import Valuation from '@/pages/modules/inventory/reporting/Valuation';

// Tab list without icons (R1 option)
const reportTabs = [
  { name: 'Stock', path: 'stock' },
  { name: 'Inventory History', path: 'inventory-history' },
  { name: 'Moves Analysis', path: 'moves-analysis' },
  { name: 'Valuation', path: 'valuation' }
];

export default function ReportingModule() {
  const location = useLocation();
  const navigate = useNavigate();

  // Auto redirect when landing on /inventory/reporting
  useEffect(() => {
    if (location.pathname === '/inventory/reporting' || location.pathname === '/inventory/reporting/') {
      navigate('stock', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reporting</h1>
        <p className="text-sm text-gray-500 mt-1">Analyze stock, movements, valuation and history.</p>
      </div>

      {/* Sub-tabs */}
      <div className="sticky top-14 z-30 bg-white border-b">
        <nav className="max-w-full">
          <div className="flex gap-6 overflow-x-auto py-3 px-1">
            {reportTabs.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                end
                className={({ isActive }) =>
                  `py-2 px-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`
                }
              >
                {t.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Subpage Content */}
      <div className="pt-4">
        <Outlet />
      </div>
    </div>
  );
}

// --------------------
// Subpage wrappers (use your actual components)
// --------------------

export function StockPage() {
  return <Stock />;
}

export function InventoryHistoryPage() {
  return <InventoryHistory />;
}

export function MovesAnalysisPage() {
  return <MovesAnalysis />;
}

export function ValuationPage() {
  return <Valuation />;
}

