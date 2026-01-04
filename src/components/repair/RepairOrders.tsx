import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, 
  Download, 
  Plus, 
  Package, 
  User, 
  MapPin, 
  Eye, 
  Edit, 
  Play, 
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Wrench,
  Activity,
  X
} from 'lucide-react';
import { usePermission } from '@/hooks/userPermission';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import { fetchRepairOrders, createRepairOrder, deleteRepairOrder } from '@/redux/slices/repairOrderSlice';
import { fetchProducts } from '@/redux/slices/productSlice';
import { fetchRepairTeams } from '@/redux/slices/repairTeamSlice';

// CreateRepairOrderModal component moved outside to prevent re-creation
const CreateRepairOrderModal = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  products, 
  repairTeams, 
  masterDataLocations, 
  isLocationRestricted 
}: { 
  formData: any; 
  setFormData: React.Dispatch<React.SetStateAction<any>>; 
  onSubmit: (e: React.FormEvent) => void; 
  onCancel: () => void; 
  products: any[]; 
  repairTeams: any[]; 
  masterDataLocations: any[]; 
  isLocationRestricted: boolean; 
}) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
      <div className="mt-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Repair Order</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
     
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product to Repair *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product._id || product.id} value={product._id || product.id}>
                      {product.name || product.productName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial/Lot Number
                </label>
                <input
                  type="text"
                  value={formData.serialLotNumber}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, serialLotNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter serial or lot number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer/Department *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Customer name or internal department"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Repair Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">Repair Details</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repair Type *
                </label>
                <select
                  value={formData.repairType}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, repairType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="warranty">In-Warranty</option>
                  <option value="paid">Out-of-Warranty (Paid)</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Root Cause *
                </label>
                <select
                  value={formData.rootCause}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, rootCause: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Cause</option>
                  <option value="damage">Physical Damage</option>
                  <option value="defect">Manufacturing Defect</option>
                  <option value="misuse">Misuse/Abuse</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Description *
              </label>
              <textarea
                rows={3}
                value={formData.issueDescription}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, issueDescription: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the issue..."
                required
              />
            </div>
          </div>
          
          {/* Assignment & Timeline */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">Assignment & Timeline</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsible Team *
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, teamId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Team</option>
                  {repairTeams.map((team: any) => (
                    <option key={team._id} value={team._id}>{team.teamName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Technician *
                </label>
                <input
                  type="text"
                  value={formData.assignedTechnician || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, assignedTechnician: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter technician name"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Date *
                </label>
                <input
                  type="date"
                  value={formData.requestedDate}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, requestedDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Completion *
                </label>
                <input
                  type="date"
                  value={formData.expectedCompletion}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, expectedCompletion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              {!isLocationRestricted && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Location</option>
                    {masterDataLocations.map((location: any) => (
                      <option key={location._id} value={location._id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Repair Order
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

const RepairOrders: React.FC = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);
  const { data: repairOrders, loading } = useSelector((state: any) => state.repairOrders);
  const { products } = useSelector((state: any) => state.products);
  const { data: repairTeams } = useSelector((state: any) => state.repairTeams);

  // Debug Redux state
  console.log('Redux State Debug:', {
    repairOrdersState: useSelector((state: any) => state.repairOrders),
    repairOrdersData: repairOrders,
    repairOrdersLength: repairOrders?.length,
    loading,
    userProfile: userProfile ? { role: userProfile.role, location: userProfile.location } : null
  });

  // Permissions
  const canView = usePermission('repair', 'view');
  const canCreate = usePermission('repair', 'create');
  const canEdit = usePermission('repair', 'edit');
  const canDelete = usePermission('repair', 'delete');

  // Local state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Create form data
  const [createFormData, setCreateFormData] = useState({
    productId: '',
    quantity: 1,
    serialLotNumber: '',
    customerName: '',
    repairType: '',
    priority: '',
    rootCause: '',
    issueDescription: '',
    teamId: '',
    assignedTechnician: '',
    requestedDate: '',
    expectedCompletion: '',
    location: '',
    sourceDocument: '',
    warrantyType: 'in-warranty',
    notes: '',
    isChargeable: false,
  });

  // Location restrictions
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  // Location restriction working correctly
  console.log('RepairOrders: Location filter set to:', locationFilter);

  // Get locations from master data
  const masterDataLocations = React.useMemo(() => {
    return locations || [];
  }, [locations]);

  // Helper function to get location name by ID
  const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    const location = masterDataLocations.find((loc: any) => loc._id === locationId);
    return location ? location.name : locationId;
  };

  // Load master data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location") as any);
    dispatch(fetchProducts({ page: 1, limit: 1000 }) as any);
    dispatch(fetchRepairTeams() as any);
  }, [dispatch]);

  // Set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      console.log('Setting location filter for restricted user:', userProfile.location);
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Load data when filters change
  useEffect(() => {
    const organisationId = localStorage.getItem('organisationId');
    
    if (organisationId && canView && userProfile) {
      console.log('Frontend: Sending API request with location filter:', {
        locationFilter,
        userProfileLocation: userProfile?.location,
        isLocationRestricted,
        organisationId,
        apiParams: { location: locationFilter !== 'all' ? locationFilter : undefined }
      });
      
      dispatch(fetchRepairOrders({ 
        location: locationFilter !== 'all' ? locationFilter : undefined 
      }) as any);
    } else {
      console.log('Frontend: Not making API call because:', {
        organisationId: !!organisationId,
        canView,
        userProfile: !!userProfile
      });
    }
  }, [locationFilter, canView, dispatch, userProfile]);

  // Filter orders based on all filters
  const filteredOrders = React.useMemo(() => {
    return repairOrders.filter((order: any) => {
      const product = products.find((item: any) => (item._id || item.id) === order.productId);
      const matchesSearch = product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order._id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesType = typeFilter === 'all' || order.repairType === typeFilter;
      const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      const matchesLocation = locationFilter === 'all' || order.location === locationFilter;
      return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesLocation;
    });
  }, [repairOrders, products, searchTerm, statusFilter, typeFilter, priorityFilter, locationFilter]);

  // Handle delete
  const handleDeleteRepairOrder = async (id: string) => {
    try {
      await dispatch(deleteRepairOrder(id) as any);
    } catch (error) {
      console.error('Failed to delete repair order:', error);
    }
  };

  // Handle create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newOrder = {
      ...createFormData,
      // For location-restricted users, use their location; otherwise use form data
      location: isLocationRestricted ? userProfile?.location : createFormData.location,
      status: 'draft' as const,
      repairType: createFormData.repairType as "warranty" | "paid" | "internal",
      priority: createFormData.priority as "low" | "medium" | "high",
      rootCause: createFormData.rootCause as "damage" | "defect" | "misuse" | "unknown",
      warrantyType: createFormData.warrantyType as "in-warranty" | "extended" | "expired",
    };
    
    try {
      await dispatch(createRepairOrder(newOrder) as any);
      setShowCreateForm(false);
      setCreateFormData({
        productId: '',
        quantity: 1,
        serialLotNumber: '',
        customerName: '',
        repairType: '',
        priority: '',
        rootCause: '',
        issueDescription: '',
        teamId: '',
        assignedTechnician: '',
        requestedDate: '',
        expectedCompletion: '',
        location: '',
        sourceDocument: '',
        warrantyType: 'in-warranty',
        notes: '',
        isChargeable: false,
      });
    } catch (error) {
      console.error('Failed to create repair order:', error);
    }
  };

  const handleCancelCreateForm = () => {
    setShowCreateForm(false);
    setCreateFormData({
      productId: '',
      quantity: 1,
      serialLotNumber: '',
      customerName: '',
      repairType: '',
      priority: '',
      rootCause: '',
      issueDescription: '',
      teamId: '',
      assignedTechnician: '',
      requestedDate: '',
      expectedCompletion: '',
      location: '',
      sourceDocument: '',
      warrantyType: 'in-warranty',
      notes: '',
      isChargeable: false,
    });
  };

  // Status color functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'under-repair':
        return 'bg-yellow-100 text-yellow-800';
      case 'testing':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warranty':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'internal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'under-repair':
        return <Wrench className="h-5 w-5 text-yellow-500" />;
      case 'testing':
        return <Activity className="h-5 w-5 text-purple-500" />;
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  // ViewRepairOrderModal component
  const ViewRepairOrderModal = ({ order, onClose }: { order: any; onClose: () => void }) => {
    if (!order) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Repair Order Details</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order ID</label>
                  <p className="text-sm text-gray-900">{order._id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{order.status}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <p className="text-sm text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Issue Description</label>
                <p className="text-sm text-gray-900">{order.issueDescription}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="text-sm text-gray-900">{getLocationName(order.location)}</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-600">You do not have permission to view repair orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Repair Orders</h3>
          {canCreate && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="under-repair">Under Repair</option>
            <option value="testing">Testing</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="warranty">Warranty</option>
            <option value="paid">Paid</option>
            <option value="internal">Internal</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {!isLocationRestricted && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {masterDataLocations.map((location: any) => (
                <option key={location._id} value={location._id}>{location.name}</option>
              ))}
            </select>
          )}
          {isLocationRestricted && (
            <div className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg border">
              Location: {getLocationName(userProfile?.location)}
            </div>
          )}
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading repair orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No repair orders found</p>
              {canCreate && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Create your first repair order
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technician
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order: any) => {
                    const product = products.find((item: any) => (item._id || item.id) === order.productId);
                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order._id}</div>
                            <div className="text-sm text-gray-500">Qty: {order.quantity}</div>
                            {order.serialLotNumber && (
                              <div className="text-xs text-gray-400">S/N: {order.serialLotNumber}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">{product?.name || product?.productName || 'Unknown Product'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.customerName}</div>
                          {order.sourceDocument && (
                            <div className="text-xs text-gray-500">Ref: {order.sourceDocument}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(order.repairType)}`}>
                              {order.repairType}
                            </span>
                            <br />
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                              {order.priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(order.status)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.replace('-', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">{order.assignedTechnician}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">{getLocationName(order.location)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="text-sm font-medium">Due: {order.expectedCompletion}</div>
                            <div className="text-sm text-gray-500">Created: {new Date(order.createdAt).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">${(order.totalCost || 0).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              Parts: ${(order.partsCost || 0).toFixed(2)} | Labor: ${(order.laborCost || 0).toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => {
                                setSelectedOrder(order._id);
                                setShowViewModal(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canEdit && (
                              <button
                                className="text-green-600 hover:text-green-900"
                                onClick={() => {
                                  setSelectedOrder(order._id);
                                  // setShowUpdateForm(true);
                                }}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button className="text-purple-600 hover:text-purple-900" title="Start Repair">
                                <Play className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                className="text-red-600 hover:text-red-900" 
                                title="Delete"
                                onClick={() => handleDeleteRepairOrder(order._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedOrder && (
        <ViewRepairOrderModal
          order={repairOrders.find((o: any) => o._id === selectedOrder)}
          onClose={() => {
            setShowViewModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateRepairOrderModal
          formData={createFormData}
          setFormData={setCreateFormData}
          onSubmit={handleCreateSubmit}
          onCancel={handleCancelCreateForm}
          products={products}
          repairTeams={repairTeams}
          masterDataLocations={masterDataLocations}
          isLocationRestricted={isLocationRestricted}
        />
      )}
    </div>
  );
};

export default RepairOrders;