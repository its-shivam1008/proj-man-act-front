import React, { useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import {
  ShoppingCart,
  Plus,
  DollarSign,
  FileText,
  Users,
  CheckCircle,
  Send,
  Package
} from 'lucide-react';

interface PurchaseOrder {
  id: string;
  totalAmount: number;
}

interface RFQ {
  id: string;
}

interface Vendor {
  id: string;
  isActive: boolean;
}

const PurchaseOverview: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const loadedPOs = storage.get<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, []);
    setPurchaseOrders(Array.isArray(loadedPOs) ? loadedPOs : []);
    const loadedRFQs = storage.get<RFQ[]>(STORAGE_KEYS.RFQS, []);
    setRfqs(Array.isArray(loadedRFQs) ? loadedRFQs : []);
    const loadedVendors = storage.get<Vendor[]>(STORAGE_KEYS.VENDORS, []);
    setVendors(Array.isArray(loadedVendors) ? loadedVendors : []);
  }, []);

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Overview</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive procurement management with RFQ, PO, vendor management, and reporting
          </p>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Purchase Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{purchaseOrders.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${purchaseOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Active RFQs</p>
                <p className="text-2xl font-semibold text-gray-900">{rfqs.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Active Vendors</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {vendors.filter(vendor => vendor.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {/* <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Plus className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New RFQ</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ShoppingCart className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Purchase Order</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Agreement</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Add Vendor</span>
          </button>
        </div>
      </div> */}

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Purchase Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="px-6 py-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">Purchase Order PO-2024-001 confirmed with Steel Corp Ltd</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center">
            <Send className="h-5 w-5 text-blue-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">RFQ RFQ-2024-001 sent to 3 vendors</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center">
            <Users className="h-5 w-5 text-purple-500 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">New vendor Aluminum Co added to database</p>
              <p className="text-xs text-gray-500">2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOverview;