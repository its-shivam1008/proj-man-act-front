// inventory/operations/OperationsModule.tsx
// Full Operations module (Option A) — nested routes + UI for Receipts, Deliveries, Scrap Orders, Forecasting
// Drop this file into: src/pages/inventory/operations/OperationsModule.tsx

import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Package, Truck, Trash2, BarChart3 } from 'lucide-react';
import Receipt from './inventory/Receipt';
import Deliveries from './inventory/Deliveries';
import ScrapOrder from './inventory/ScrapOrder';
import Forecasting from './inventory/Forecasting';


const tabItems = [
  { name: 'Receipts', path: 'receipt', icon: Package },
  { name: 'Deliveries', path: 'deliveries', icon: Truck },
  { name: 'Scrap Orders', path: 'scrap-order', icon: Trash2 },
  { name: 'Forecasting', path: 'forecasting', icon: BarChart3 },
];

export default function OperationsModule() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/inventory/operations' || location.pathname === '/inventory/operations/') {
      navigate('receipt', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      

      {/* Sub-tabs */}
      {/* <div className="sticky  z-30 bg-white border-b">
        <nav className="max-w-full mx-0 px-0 sm:px-0">
          <div className="flex gap-6 overflow-x-auto py-3 px-1">
            {tabItems.map((t) => {
              const Icon = t.icon;
              // Use NavLink to auto-apply active styles
              return (
                <NavLink
                  key={t.path}
                  to={t.path}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2 py-2 px-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {t.name}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div> */}

      {/* Subpage container: your nested routes will render here */}
      <div className="pt-4">
        <Outlet />
      </div>
    </div>
  );
}


export function ReceiptsPage() {
  return (
    <Receipt/>
  );
}

export function DeliveriesPage() {
  return (
    <Deliveries/>
  );
}

export function ScrapPage() {
  return (
   <ScrapOrder/>
  );
}

export function ForecastingPage() {
  return (
    <Forecasting/>
  );
}

