import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Outlet } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";
import { Warehouse, Package } from "lucide-react";
// import Layout from '../../components/Layout';
import {
  Search,
  Pencil,
  Store,
  // Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  Calendar,
  MapPin,
  Truck,
  Trash2,
  Edit,
  Eye,
  Settings,
  ChevronDown
} from 'lucide-react';

import { storage, STORAGE_KEYS, ensureInitialized } from '@/lib/storage'; // Adjust path as needed
import WarehouseManagement from './inventory/Warehouse';
import StoresManagement from './inventory/Storage';
import Products from './inventory/Products';
import RawMaterial from './inventory/Raw-Material';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  location: string;
  quantity: number;
  minStock: number;
  unitCost: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
  type?: string;
  referenceCode?: string;
  trackInventory?: boolean;
  salesPrice?: number;
  salesTax?: number;
  purchaseTax?: number;
  barcode?: string;
  upsellSuggestion?: string;
  description?: string;
}

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this-month');
  const [showOperationsDropdown, setShowOperationsDropdown] = useState(false);
  const [showReportingDropdown, setShowReportingDropdown] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);


  // Add these states after existing useState declarations
  const [showViewForm, setShowViewForm] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Add this handler
  const handleView = useCallback((id: string) => {
    setViewingId(id);
    setShowViewForm(true);
  }, []);
  useEffect(() => {
    // Extend ensureInitialized to include INVENTORY if needed
    const initInventory = () => {
      if (!storage.has(STORAGE_KEYS.INVENTORY)) {
        storage.set(STORAGE_KEYS.INVENTORY, []);
      }
    };
    initInventory();
    ensureInitialized(); // Call the existing one for other keys

    const data = storage.get<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    setInventory(Array.isArray(data) ? data : []);
  }, []);

  const handleClose = useCallback(() => {
    setShowAddProductForm(false);
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback((formData: any) => {
    const commonData = {
      name: formData.name,
      sku: formData.referenceCode || `SKU-${Date.now()}`,
      category: formData.category,
      location: editingId ? inventory.find((i) => i.id === editingId)?.location || 'Warehouse A' : 'Warehouse A',
      quantity: Number(formData.inventoryAvailable) || 0,
      minStock: Number(formData.minimumStockLevel) || 0,
      unitCost: Number(formData.costPrice) || 0,
      lastUpdated: new Date().toLocaleDateString(),
      description: formData.description,
      type: formData.type,
      referenceCode: formData.referenceCode,
      trackInventory: formData.trackInventory !== undefined ? formData.trackInventory : true,
      salesPrice: Number(formData.salesPrice) || 0,
      salesTax: Number(formData.salesTax) || 0,
      purchaseTax: Number(formData.purchaseTax) || 0,
      barcode: formData.barcode,
      upsellSuggestion: formData.upsellSuggestion,
    };

    const status = commonData.quantity === 0
      ? 'out-of-stock'
      : commonData.quantity <= commonData.minStock
        ? 'low-stock'
        : 'in-stock';

    const newItem: InventoryItem = {
      ...commonData,
      status,
      id: editingId || Date.now().toString(),
    };

    if (editingId) {
      storage.updateById(STORAGE_KEYS.INVENTORY, editingId, newItem);
    } else {
      storage.push(STORAGE_KEYS.INVENTORY, newItem);
    }

    const updatedInventory = storage.get<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    setInventory(Array.isArray(updatedInventory) ? updatedInventory : []);
    handleClose();
  }, [editingId, inventory, handleClose]);

  const handleEdit = useCallback((id: string) => {
    setEditingId(id);
    setShowAddProductForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      storage.deleteById(STORAGE_KEYS.INVENTORY, id);
      const updatedInventory = storage.get<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
      setInventory(Array.isArray(updatedInventory) ? updatedInventory : []);
    }
  }, []);

  const handleAddClick = useCallback(() => {
    setEditingId(null);
    setShowAddProductForm(true);
  }, []);

  const AddProductForm = ({ initialData, inventory: propInventory }: { initialData?: Partial<InventoryItem>; inventory: InventoryItem[] }) => {
    const safeInventory = Array.isArray(propInventory) ? propInventory : [];
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      type: initialData?.type || '',
      category: initialData?.category || '',
      referenceCode: initialData?.referenceCode || initialData?.sku || '',
      trackInventory: initialData?.trackInventory ?? true,
      inventoryAvailable: (initialData?.quantity ?? 0).toString(),
      minimumStockLevel: (initialData?.minStock ?? 0).toString(),
      salesPrice: (initialData?.salesPrice ?? 0).toString(),
      salesTax: (initialData?.salesTax ?? 0).toString(),
      costPrice: (initialData?.unitCost ?? 0).toString(),
      purchaseTax: (initialData?.purchaseTax ?? 0).toString(),
      barcode: initialData?.barcode ?? '',
      upsellSuggestion: initialData?.upsellSuggestion ?? '',
      description: initialData?.description ?? '',
    });

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, trackInventory: e.target.checked }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit(formData);
    };

    // const isEditing = !!initialData;
    // const ViewProductForm = ({ item }: { item: InventoryItem | undefined }) => {
    //   if (!item) return null;

    //   return (
    //     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    //       <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
    //         <div className="mt-3">
    //           <div className="flex items-center justify-between mb-4">
    //             <h3 className="text-lg font-medium text-gray-900">View Product: {item.name}</h3>
    //             <button onClick={() => { setShowViewForm(false); setViewingId(null); }} className="text-gray-400 hover:text-gray-600">
    //               <XCircle className="h-6 w-6" />
    //             </button>
    //           </div>

    //           <div className="space-y-4">
    //             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    //               <div>
    //                 <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
    //                 <input
    //                   type="text"
    //                   value={item.name}
    //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
    //                   readOnly
    //                 />
    //               </div>
    //               <div>
    //                 <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
    //                 <input
    //                   type="text"
    //                   value={item.type || ''}
    //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
    //                   readOnly
    //                 />
    //               </div>
    //             </div>

    //             {/* Add similar read-only inputs for other fields */}
    //             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    //               <div>
    //                 <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
    //                 <input
    //                   type="text"
    //                   value={item.category}
    //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
    //                   readOnly
    //                 />
    //               </div>
    //               <div>
    //                 <label className="block text-sm font-medium text-gray-700 mb-1">Reference Code</label>
    //                 <input
    //                   type="text"
    //                   value={item.referenceCode || ''}
    //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
    //                   readOnly
    //                 />
    //               </div>
    //             </div>

    //             {/* Continue for other fields like quantity, status, etc. */}
    //             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    //               <div>
    //                 <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
    //                 <input
    //                   type="number"
    //                   value={item.quantity}
    //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
    //                   readOnly
    //                 />
    //               </div>
    //               <div>
    //                 <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
    //                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
    //                   {item.status.replace('-', ' ')}
    //                 </span>
    //               </div>
    //             </div>

    //             {/* Description */}
    //             <div>
    //               <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
    //               <textarea
    //                 rows={3}
    //                 value={item.description || ''}
    //                 className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
    //                 readOnly
    //               />
    //             </div>

    //             <div className="flex justify-end pt-4">
    //               <button
    //                 type="button"
    //                 onClick={() => { setShowViewForm(false); setViewingId(null); }}
    //                 className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
    //               >
    //                 Close
    //               </button>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   );
    // };
    return (
      <Products/>
    );
  };

  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const filteredInventory = safeInventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'low-stock':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'out-of-stock':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low-stock':
        return 'bg-orange-100 text-orange-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    {
      id: 'operations',
      name: 'Operations',
      icon: Truck,
      hasDropdown: true,
      dropdownItems: [
        { name: 'Receipt', path: 'receipt' },
        { name: 'Deliveries', path: 'deliveries' },
        { name: 'Scrap Order', path: 'scrap-order' },
        { name: 'Forecasting', path: 'forecasting' }
      ]
    },
    { id: 'products', name: 'Products', icon: Package },
    {id:"rawmaterials", name:"Raw Materials", icon:Warehouse},
    {
      id: 'reporting',
      name: 'Reporting',
      icon: TrendingUp,
      hasDropdown: true,
      dropdownItems: [
        { name: 'Stock', path: '/inventory/reporting/stock' },
        { name: 'Inventory History', path: '/inventory/reporting/inventory-history' },
        { name: 'Moves Analysis', path: '/inventory/reporting/moves-analysis' },
        { name: 'Valuation', path: '/inventory/reporting/valuation' }
      ]
    },
    {
      id: 'warehouses',
      name: 'Warehouses',
      icon: MapPin,
    },
    {
      id: 'stores',
      name: 'Stores',
      icon: Package,
    },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const handleOperationClick = (path: string) => {
    setShowOperationsDropdown(false);
    setShowReportingDropdown(false);
    navigate(path.replace('/inventory/', ''));
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">{safeInventory.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Incoming Orders</p>
                <p className="text-2xl font-semibold text-gray-900">23</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Outgoing Orders</p>
                <p className="text-2xl font-semibold text-gray-900">18</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeInventory.filter((item) => item.status === 'low-stock').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate('receipt')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Receipt</span>
          </button>
          <button
            onClick={() => navigate('/inventory/deliveries')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Truck className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Delivery</span>
          </button>
          {/* <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" onClick={handleAddClick}>
            <Package className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Add Product</span>
          </button> */}
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => navigate('reporting/inventory-history')}>
            <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">View Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Receipt - Steel Plates</p>
                <p className="text-sm text-gray-500">Warehouse A • 2 hours ago</p>
              </div>
            </div>
            <span className="text-sm font-medium text-green-600">+250 units</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Delivery - Hydraulic Pumps</p>
                <p className="text-sm text-gray-500">Customer ABC • 4 hours ago</p>
              </div>
            </div>
            <span className="text-sm font-medium text-blue-600">-15 units</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Scrap - Aluminum Rods</p>
                <p className="text-sm text-gray-500">Damaged • 1 day ago</p>
              </div>
            </div>
            <span className="text-sm font-medium text-red-600">-5 units</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperations = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Truck className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Operations Overview</h3>
        <p className="mt-1 text-sm text-gray-500">
          Use the dropdown menu above to access specific operation types:
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600">• Receipt - Manage incoming stock</p>
          <p className="text-sm text-gray-600">• Deliveries - Handle outgoing shipments</p>
          <p className="text-sm text-gray-600">• Scrap Order - Process damaged items</p>
          <p className="text-sm text-gray-600">• Forecasting - Plan inventory replenishment</p>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => <Products />;
const renderRawMaterials = () => <RawMaterial/>;

  const renderReporting = () => (
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Stock Report</h3>
              <p className="text-sm text-gray-500">Current inventory levels</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Inventory History</h3>
              <p className="text-sm text-gray-500">Transaction logs</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Moves Analysis</h3>
              <p className="text-sm text-gray-500">Stock movement trends</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Valuation</h3>
              <p className="text-sm text-gray-500">Inventory valuation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Report */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Stock Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incoming Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outgoing Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.unitCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(item.quantity * item.unitCost).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    +{Math.floor(Math.random() * 100)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    -{Math.floor(Math.random() * 50)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Form Builder Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Form Builder</h3>
        <p className="text-sm text-gray-600 mb-6">
          Customize forms by adding custom fields, repositioning elements, and configuring visibility settings.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Add Product Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize product creation form fields and layout</p>
            <button
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Receipt Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize receipt creation form fields and layout</p>
            <button
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Delivery Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize delivery creation form fields and layout</p>
            <button
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Scrap Order Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize scrap order form fields and layout</p>
            <button
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Stock Report Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize stock report form fields and layout</p>
            <button
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Transaction History Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize transaction history form fields</p>
            <button
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Moves Analysis Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize moves analysis form fields</p>
            <button
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <h4 className="font-medium text-gray-900 mb-2">Valuation Form</h4>
            <p className="text-sm text-gray-600 mb-3">Customize valuation form fields and layout</p>
            <button
              onClick={() => navigate('/inventory/form-builder')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Configure Form
            </button>
          </div>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Operation Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Enable Packages</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Batch Transfers</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Reception Reports</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Barcode Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Nomenclature</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Default Nomenclature</option>
                <option>Custom Format</option>
              </select>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Show Quantity to Count</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Delivery Methods</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Email Confirmation</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Customer Signature</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Product Variants</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Units of Measure</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Packaging Options</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Traceability</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Lots & Serial Numbers</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Consignment Inventory</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Warehouse Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Warehouse</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Warehouse A</option>
                <option>Warehouse B</option>
                <option>Warehouse C</option>
              </select>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Multi-step Routes</span>
            </label>
          </div>
        </div>
      </div>

      {/* Shipping Connectors */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Connectors</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">UPS Connector</h4>
              <p className="text-sm text-gray-500">Real-time shipping rates</p>
            </div>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
              Configure
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">DHL Connector</h4>
              <p className="text-sm text-gray-500">International shipping</p>
            </div>
            <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">
              Not Configured
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">FedEx Connector</h4>
              <p className="text-sm text-gray-500">Express delivery</p>
            </div>
            <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">
              Not Configured
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWarehouses = () => (
    <WarehouseManagement />
  );
const renderStores = () => (
  <StoresManagement/>
);


  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'operations':
        return renderOperations();
      case 'products':
        return renderProducts();
      case 'rawmaterials':
        return renderRawMaterials();
      case 'reporting':
        return renderReporting();
      case 'settings':
        return renderSettings();
      case 'warehouses':
        return renderWarehouses();
      case 'stores':
        return renderStores();
      default:
        return renderOverview();
    }
  };

  return (
    // <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive inventory control with operations, forecasting, and reporting
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div key={tab.id} className="relative">
                <button
                  onClick={() => {
                    if (tab.hasDropdown) {
                      if (tab.id === 'operations') {
                        setShowOperationsDropdown(!showOperationsDropdown);
                        setShowReportingDropdown(false);
                      } else if (tab.id === 'reporting') {
                        setShowReportingDropdown(!showReportingDropdown);
                        setShowOperationsDropdown(false);
                      }
                    } else {
                      setActiveTab(tab.id);
                      setShowOperationsDropdown(false);
                      setShowReportingDropdown(false);
                    }
                  }}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className={`mr-2 h-5 w-5 transition-colors ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                  {tab.name}
                  {tab.hasDropdown && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${(tab.id === 'operations' && showOperationsDropdown) ||
                      (tab.id === 'reporting' && showReportingDropdown) ? 'rotate-180' : ''
                      }`} />
                  )}
                </button>

                {/* Dropdown Menu */}
                {tab.hasDropdown &&
                  ((tab.id === 'operations' && showOperationsDropdown) ||
                    (tab.id === 'reporting' && showReportingDropdown)) && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        {tab.dropdownItems?.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => handleOperationClick(item.path)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
      <Outlet />
    </div>
  );
};

export default Inventory;