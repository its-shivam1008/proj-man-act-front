import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import Layout from '../../components/Layout';
import { 
  ShoppingCart, 
  Plus, 
  DollarSign, 
  Truck, 
  Calendar,
  Search,
  Filter,
  FileText,
  Users,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  TrendingUp,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Star,
  Building,
  CreditCard,
  User,
  X
} from 'lucide-react';

const Purchase: React.FC = () => {
  const { purchaseOrders, rfqs, purchaseAgreements, vendors } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRfq, setShowCreateRfq] = useState(false);
  const [showCreatePo, setShowCreatePo] = useState(false);
  const [showCreateAgreement, setShowCreateAgreement] = useState(false);
  const [showCreateVendor, setShowCreateVendor] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'rfq', name: 'RFQ', icon: FileText },
    { id: 'purchase-orders', name: 'Purchase Orders', icon: ShoppingCart },
    { id: 'agreements', name: 'Agreements', icon: FileText },
    { id: 'vendors', name: 'Vendors', icon: Users },
    { id: 'reporting', name: 'Reporting', icon: TrendingUp },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const CreateRfqForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New RFQ</h3>
            <button onClick={() => setShowCreateRfq(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RFQ Number</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Auto-generated" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendors</label>
                <select multiple className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24">
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.vendorName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-5 gap-2 mb-2 text-sm font-medium text-gray-700">
                  <div>Product Name</div>
                  <div>Quantity</div>
                  <div>UoM</div>
                  <div>Unit Price</div>
                  <div>Taxes (%)</div>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Product name" />
                  <input type="number" className="px-2 py-1 border border-gray-300 rounded" placeholder="Qty" />
                  <select className="px-2 py-1 border border-gray-300 rounded">
                    <option>pieces</option>
                    <option>kg</option>
                    <option>meters</option>
                  </select>
                  <input type="number" step="0.01" className="px-2 py-1 border border-gray-300 rounded" placeholder="Price" />
                  <input type="number" step="0.01" className="px-2 py-1 border border-gray-300 rounded" placeholder="Tax %" />
                </div>
                <button type="button" className="text-blue-600 hover:text-blue-800 text-sm">+ Add Product</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Additional notes or requirements..."></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setShowCreateRfq(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create RFQ</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const CreatePoForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Purchase Order</h3>
            <button onClick={() => setShowCreatePo(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Auto-generated" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.vendorName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter delivery address"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Warehouse A</option>
                  <option>Warehouse B</option>
                  <option>Warehouse C</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incoterms</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>FOB</option>
                  <option>CIF</option>
                  <option>EXW</option>
                  <option>DDP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Truck</option>
                  <option>Air Freight</option>
                  <option>Sea Freight</option>
                  <option>Rail</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Delivery</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Lines</label>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-5 gap-2 mb-2 text-sm font-medium text-gray-700">
                  <div>Product</div>
                  <div>Quantity</div>
                  <div>Unit Price</div>
                  <div>Taxes (%)</div>
                  <div>Subtotal</div>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <select className="px-2 py-1 border border-gray-300 rounded">
                    <option>Select Product</option>
                    <option>Steel Plates</option>
                    <option>Aluminum Rods</option>
                  </select>
                  <input type="number" className="px-2 py-1 border border-gray-300 rounded" placeholder="Qty" />
                  <input type="number" step="0.01" className="px-2 py-1 border border-gray-300 rounded" placeholder="Price" />
                  <input type="number" step="0.01" className="px-2 py-1 border border-gray-300 rounded" placeholder="Tax %" />
                  <input type="number" step="0.01" className="px-2 py-1 border border-gray-300 rounded" placeholder="Subtotal" disabled />
                </div>
                <button type="button" className="text-blue-600 hover:text-blue-800 text-sm">+ Add Product Line</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsible User</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                  <option>Mike Johnson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <input type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Calculated automatically" disabled />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setShowCreatePo(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Purchase Order</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const CreateVendorForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Vendor</h3>
            <button onClick={() => setShowCreateVendor(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter vendor name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Contact person name" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="vendor@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+1-555-0123" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Complete address"></textarea>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN / Tax ID</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="GST123456789" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Products Supplied</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Comma-separated list of products" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Details</label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border border-gray-300 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Bank name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Account number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="IFSC code" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Additional notes about the vendor..."></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setShowCreateVendor(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add Vendor</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'received':
      case 'waiting-for-delivery':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'sent':
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'received':
      case 'waiting-for-delivery':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
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
                  ${purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
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
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button 
            onClick={() => setShowCreateRfq(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New RFQ</span>
          </button>
          <button 
            onClick={() => setShowCreatePo(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Purchase Order</span>
          </button>
          <button 
            onClick={() => setShowCreateVendor(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Add Vendor</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">View Reports</span>
          </button>
        </div>
      </div>

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

  const renderRfq = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Request for Quotation (RFQ)</h2>
          <p className="text-sm text-gray-600">Create and manage RFQs, compare vendor offers</p>
        </div>
        <button 
          onClick={() => setShowCreateRfq(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New RFQ
        </button>
      </div>

      {/* RFQ Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFQ Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendors</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rfqs.map((rfq) => (
              <tr key={rfq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rfq.rfqNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rfq.vendors.length} vendors</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rfq.orderDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rfq.deliveryDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${rfq.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(rfq.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rfq.status)}`}>
                      {rfq.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3"><Eye className="h-4 w-4" /></button>
                  <button className="text-green-600 hover:text-green-900 mr-3"><Edit className="h-4 w-4" /></button>
                  <button className="text-purple-600 hover:text-purple-900 mr-3"><Send className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPurchaseOrders = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-sm text-gray-600">Manage purchase orders and track deliveries</p>
        </div>
        <button 
          onClick={() => setShowCreatePo(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </button>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{po.poNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.vendor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.orderDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.scheduledDeliveryDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${po.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(po.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                      {po.status.replace('-', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3"><Eye className="h-4 w-4" /></button>
                  <button className="text-green-600 hover:text-green-900 mr-3"><Edit className="h-4 w-4" /></button>
                  <button className="text-purple-600 hover:text-purple-900 mr-3"><Package className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVendors = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-sm text-gray-600">Manage vendor database and performance</p>
        </div>
        <button 
          onClick={() => setShowCreateVendor(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </button>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{vendor.vendorName}</h3>
                  <p className="text-sm text-gray-500">{vendor.contactPerson}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm font-medium text-gray-900">{vendor.vendorRating}</span>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {vendor.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {vendor.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {vendor.address.substring(0, 50)}...
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CreditCard className="h-4 w-4 mr-2" />
                {vendor.paymentTerms}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Products Supplied:</p>
              <div className="flex flex-wrap gap-1">
                {vendor.productsSupplied.slice(0, 3).map((product, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {product}
                  </span>
                ))}
                {vendor.productsSupplied.length > 3 && (
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    +{vendor.productsSupplied.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {vendor.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-900"><Eye className="h-4 w-4" /></button>
                <button className="text-green-600 hover:text-green-900"><Edit className="h-4 w-4" /></button>
                <button className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReporting = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchase Reports & Analytics</h2>
          <p className="text-sm text-gray-600">Comprehensive purchase analysis and insights</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Purchase Volume</h3>
              <p className="text-sm text-gray-500">Volume analysis by vendor and period</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Price Trends</h3>
              <p className="text-sm text-gray-500">Purchase price trend analysis</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Lead Time Analysis</h3>
              <p className="text-sm text-gray-500">Order fulfillment lead times</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Vendor Performance</h3>
              <p className="text-sm text-gray-500">Vendor comparison matrix</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">RFQ Summary</h3>
              <p className="text-sm text-gray-500">RFQ and PO summary reports</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Cost Analysis</h3>
              <p className="text-sm text-gray-500">Purchase cost breakdown</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Report */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Purchase Summary Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Lead Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.vendorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchaseOrders.filter(po => po.vendor === vendor.vendorName).length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${purchaseOrders.filter(po => po.vendor === vendor.vendorName).reduce((sum, po) => sum + po.totalAmount, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7 days</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{vendor.vendorRating}</span>
                    </div>
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
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Purchase Settings</h2>
        <p className="text-sm text-gray-600">Configure purchase module settings and preferences</p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Warehouse</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Warehouse A</option>
                <option>Warehouse B</option>
                <option>Warehouse C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>USD</option>
                <option>EUR</option>
                <option>INR</option>
              </select>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Multi-Currency Support</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Workflow</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Enable Approval Workflow</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Threshold</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="10000" />
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Auto-Replenishment</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">SMS Notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Contract Renewal Alerts</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Types</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Local Purchase</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Import Purchase</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Drop Shipping</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Configuration</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Purchase Tax</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="10.00" />
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Tax Inclusive Pricing</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Evaluation</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Criteria</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Quality & Delivery</option>
                <option>Price & Payment Terms</option>
                <option>Service & Support</option>
              </select>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Auto Vendor Scoring</span>
            </label>
          </div>
        </div>
      </div>

      {/* Email Templates */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Purchase Order Template</h4>
            <p className="text-sm text-gray-600 mb-3">Template for sending purchase orders to vendors</p>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
              Edit Template
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">RFQ Template</h4>
            <p className="text-sm text-gray-600 mb-3">Template for sending RFQs to vendors</p>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
              Edit Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'rfq':
        return renderRfq();
      case 'purchase-orders':
        return renderPurchaseOrders();
      case 'vendors':
        return renderVendors();
      case 'reporting':
        return renderReporting();
      case 'settings':
        return renderSettings();
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
            <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive procurement management with RFQ, PO, vendor management, and reporting
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 transition-colors ${
                    activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Modals */}
        {showCreateRfq && <CreateRfqForm />}
        {showCreatePo && <CreatePoForm />}
        {showCreateVendor && <CreateVendorForm />}
      </div>
    // </Layout>
  );
};

export default Purchase;