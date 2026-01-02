import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Wrench, Plus, Clock, CheckCircle, XCircle, Search, User, Package, DollarSign, FileText, Settings, Users, BarChart3, Edit, Eye, Trash2, Play, MapPin, Phone, Mail, Download, Clipboard, PenTool as Tool, Star, TrendingUp, Activity, X, ShieldAlert } from 'lucide-react';
import { usePermission } from '@/hooks/userPermission';
import { fetchRepairTeams, createRepairTeam, deleteRepairTeam } from '@/redux/slices/repairTeamSlice';
import { fetchRepairOrders, createRepairOrder, updateRepairOrder, deleteRepairOrder } from '@/redux/slices/repairOrderSlice';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import { RepairTeam } from '@/types/repair.types';
import api from '@/utils/axiosApi';

// Function to create sample locations if none exist
const createSampleLocations = async (dispatch: any) => {
  try {
    await api.post('/master/location/sample');
    // Refresh master data
    dispatch(fetchMasterData('location') as any);
  } catch (error) {
    console.error('Error creating sample locations:', error);
  }
};

// RepairOrderForm component moved outside to prevent re-creation on every render
interface RepairOrderFormProps {
  isUpdate?: boolean;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  inventory: any[];
  filteredRepairTeams: RepairTeam[];
  allLocations: string[];
  hasLocations: boolean;
  dispatch: any;
}

const RepairOrderForm: React.FC<RepairOrderFormProps> = ({ 
  isUpdate = false, 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel,
  inventory,
  filteredRepairTeams,
  allLocations,
  hasLocations,
  dispatch
}) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
      <div className="mt-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isUpdate ? 'Update Repair Order' : 'Create New Repair Order'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
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
                  onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Product</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, serialLotNumber: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, repairType: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, rootCause: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, issueDescription: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, teamId: e.target.value, technicianId: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Team</option>
                  {filteredRepairTeams.map((team: RepairTeam) => (
                    <option key={team._id} value={team._id}>{team.teamName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Technician *
                </label>
                <select
                  value={formData.technicianId}
                  onChange={(e) => setFormData(prev => ({ ...prev, technicianId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Technician</option>
                  {filteredRepairTeams.flatMap((team: RepairTeam) => team.members).map((member: any) => (
                    <option key={member.technicianId} value={member.technicianId}>{member.name}</option>
                  ))}
                </select>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, requestedDate: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedCompletion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Location</option>
                  {hasLocations ? (
                    allLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))
                  ) : (
                    <option value="" disabled>No locations available - Please add locations in Master Data</option>
                  )}
                </select>
                {!hasLocations && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      No locations found. You can create sample locations to get started.
                    </p>
                    <button
                      type="button"
                      onClick={createSampleLocations}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Create Sample Locations
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Additional Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">Additional Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Document
                </label>
                <input
                  type="text"
                  value={formData.sourceDocument}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceDocument: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sale order, MO, or PO reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Type
                </label>
                <select
                  value={formData.warrantyType}
                  onChange={(e) => setFormData(prev => ({ ...prev, warrantyType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="in-warranty">In-Warranty</option>
                  <option value="extended">Extended Warranty</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <input
                type="file"
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-xs text-gray-500 mt-1">Upload photos, reports, or documentation</p>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes or special instructions..."
              />
            </div>
            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                id="chargeable"
                checked={formData.isChargeable}
                onChange={(e) => setFormData(prev => ({ ...prev, isChargeable: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="chargeable" className="ml-2 block text-sm text-gray-700">
                This repair is chargeable to customer
              </label>
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
              {isUpdate ? 'Update Repair Order' : 'Create Repair Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

// TeamForm component moved outside to prevent re-creation on every render
interface TeamMember {
  technicianId: string;
  name: string;
  hourlyRate?: number;
  availability?: 'available' | 'busy' | 'unavailable';
}

interface TeamFormProps {
  teamFormData: {
    teamName: string;
    teamLead: string;
    location: string;
    contactInfo: { email: string; phone: string };
    members: TeamMember[];
  };
  setTeamFormData: React.Dispatch<React.SetStateAction<{
    teamName: string;
    teamLead: string;
    location: string;
    contactInfo: { email: string; phone: string };
    members: TeamMember[];
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  allLocations: string[];
  hasLocations: boolean;
  dispatch: any;
}

const TeamForm: React.FC<TeamFormProps> = ({ 
  teamFormData, 
  setTeamFormData, 
  onSubmit, 
  onCancel, 
  allLocations, 
  hasLocations,
  dispatch
}) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
      <div className="mt-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Repair Team</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
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
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamFormData.teamName}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, teamName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Lead *
                </label>
                <input
                  type="text"
                  value={teamFormData.teamLead}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, teamLead: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team lead name"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <select
                  value={teamFormData.location}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Location</option>
                  {hasLocations ? (
                    allLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))
                  ) : (
                    <option value="" disabled>No locations available - Please add locations in Master Data</option>
                  )}
                </select>
                {!hasLocations && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      No locations found. You can create sample locations to get started.
                    </p>
                    <button
                      type="button"
                      onClick={createSampleLocations}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Create Sample Locations
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={teamFormData.contactInfo.email}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={teamFormData.contactInfo.phone}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, phone: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
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
              Add Team
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

const Repair: React.FC = () => {
  const dispatch = useDispatch();
  const { userProfile } = useSelector((state: any) => state.auth);
  const { data: repairTeams, loading: teamsLoading } = useSelector((state: any) => state.repairTeams);
  const { data: repairOrders, loading: ordersLoading } = useSelector((state: any) => state.repairOrders);
  const { locations } = useSelector((state: any) => state.masterData);
  
  // Local state for data (keeping existing structure for templates, inventory until migrated)
  const [repairTemplates, setRepairTemplates] = useState<any[]>([]);
  const [inventory] = useState<any[]>([]);

  const canView = usePermission('repair', 'view');
  const canCreate = usePermission('repair', 'create');
  const canDelete = usePermission('repair', 'delete');

  // Get user's location restriction if any
  const userLocation = userProfile?.location || userProfile?.allowedLocations?.[0];
  
  // Get locations from master data instead of hardcoded values
  const masterDataLocations = React.useMemo(() => {
    return locations?.map((loc: any) => loc.name) || [];
  }, [locations]);
  
  // Get unique locations from existing teams and merge with master data
  const allLocations = React.useMemo(() => {
    const teamLocations = repairTeams.map((team: RepairTeam) => team.location).filter(Boolean);
    const combined = [...new Set([...masterDataLocations, ...teamLocations])];
    return combined;
  }, [masterDataLocations, repairTeams]);

  // If no locations available, show a fallback message
  const hasLocations = allLocations.length > 0;

  // Filter teams based on user location restriction
  const filteredRepairTeams = userLocation 
    ? repairTeams.filter((team: RepairTeam) => team.location === userLocation)
    : repairTeams;

  // Form states (updated for location dropdown)
  const [teamFormData, setTeamFormData] = useState({
    teamName: '',
    teamLead: '',
    location: '',
    contactInfo: { email: '', phone: '' },
    members: [] as TeamMember[],
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
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
    technicianId: '',
    requestedDate: '',
    expectedCompletion: '',
    location: '',
    sourceDocument: '',
    warrantyType: 'in-warranty',
    notes: '',
    isChargeable: false,
  });
  const [updateFormData, setUpdateFormData] = useState({
    productId: '',
    quantity: 1,
    serialLotNumber: '',
    customerName: '',
    repairType: '',
    priority: '',
    rootCause: '',
    issueDescription: '',
    teamId: '',
    technicianId: '',
    requestedDate: '',
    expectedCompletion: '',
    location: '',
    sourceDocument: '',
    warrantyType: 'in-warranty',
    notes: '',
    isChargeable: false,
  });
  // Template states
  const [showTemplateViewModal, setShowTemplateViewModal] = useState(false);
  const [showTemplateUpdateModal, setShowTemplateUpdateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch master data locations
        await dispatch(fetchMasterData('location') as any);
        
        // Fetch repair teams from API with location filter if user has restriction
        await dispatch(fetchRepairTeams(userLocation) as any);
        
        // Fetch repair orders from API with location filter if user has restriction
        await dispatch(fetchRepairOrders({ location: userLocation }) as any);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
    
    // Keep existing local storage for other data until they're migrated
    // setRepairTemplates(storage.get(STORAGE_KEYS.REPAIR_TEMPLATES, []));
    // setInventory(storage.get(STORAGE_KEYS.INVENTORY, []));
  }, [dispatch, userLocation]);

  const handleCreateRepairOrder = useCallback(async (orderData: any) => {
    try {
      await dispatch(createRepairOrder(orderData) as any);
    } catch (error) {
      console.error('Failed to create repair order:', error);
    }
  }, [dispatch]);

  const handleUpdateRepairOrder = useCallback(async (id: string, orderData: any) => {
    try {
      await dispatch(updateRepairOrder({ id, data: orderData }) as any);
    } catch (error) {
      console.error('Failed to update repair order:', error);
    }
  }, [dispatch]);

  const handleDeleteRepairOrder = useCallback(async (id: string) => {
    try {
      await dispatch(deleteRepairOrder(id) as any);
    } catch (error) {
      console.error('Failed to delete repair order:', error);
    }
  }, [dispatch]);

  // Repair team functions now use Redux actions
  const handleCreateTeam = useCallback(async (teamData: Partial<RepairTeam>) => {
    try {
      await dispatch(createRepairTeam(teamData) as any);
      // Refresh teams list with location filter
      dispatch(fetchRepairTeams(userLocation) as any);
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  }, [dispatch, userLocation]);

  const handleDeleteTeam = async (id: string) => {
    try {
      await dispatch(deleteRepairTeam(id) as any);
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  const addRepairTemplate = (newTemplate: any) => {
    setRepairTemplates(prev => {
      const updated = [...prev, newTemplate];
      // storage.set(STORAGE_KEYS.REPAIR_TEMPLATES, updated);
      return updated;
    });
  };

  // Rest of the component code remains the same, but replace useData destructuring with local states/functions
  // For example, in handleCreateSubmit, use local addRepairOrderDetailed, etc.
  // (Full code below with replacements)

  useEffect(() => {
    if (selectedOrder && showUpdateForm) {
      const order = repairOrders.find((o: any) => o._id === selectedOrder);
      if (order) {
        setUpdateFormData({
          productId: order.productId || '',
          quantity: order.quantity || 1,
          serialLotNumber: order.serialLotNumber || '',
          customerName: order.customerName || '',
          repairType: order.repairType || '',
          priority: order.priority || '',
          rootCause: order.rootCause || '',
          issueDescription: order.issueDescription || '',
          teamId: order.teamId || '',
          technicianId: order.technicianId || '',
          requestedDate: order.requestedDate || '',
          expectedCompletion: order.expectedCompletion || '',
          location: order.location || '',
          sourceDocument: order.sourceDocument || '',
          warrantyType: order.warrantyType || 'in-warranty',
          notes: order.notes || '',
          isChargeable: order.isChargeable || false,
        });
      }
    }
  }, [selectedOrder, showUpdateForm, repairOrders]);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeam = filteredRepairTeams.find((t: RepairTeam) => t._id === createFormData.teamId);
    const selectedTechnician = selectedTeam?.members.find((m: any) => m.technicianId === createFormData.technicianId);
    
    const newOrder = {
      ...createFormData,
      status: 'draft' as const,
      assignedTechnician: selectedTechnician?.name || '',
      // Remove local ID generation - let backend handle it
    };
    
    try {
      await handleCreateRepairOrder(newOrder);
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
        technicianId: '',
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
  }, [createFormData, filteredRepairTeams, handleCreateRepairOrder]);

  const handleUpdateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    const selectedTeam = filteredRepairTeams.find((t: RepairTeam) => t._id === updateFormData.teamId);
    const selectedTechnician = selectedTeam?.members.find((m: any) => m.technicianId === updateFormData.technicianId);
    
    const updatedOrder = {
      ...updateFormData,
      assignedTechnician: selectedTechnician?.name || (updateFormData as any).assignedTechnician || '',
    };
    
    try {
      await handleUpdateRepairOrder(selectedOrder, updatedOrder);
      setShowUpdateForm(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to update repair order:', error);
    }
  }, [selectedOrder, updateFormData, filteredRepairTeams, handleUpdateRepairOrder]);

  const handleCancelCreateForm = useCallback(() => {
    setShowCreateForm(false);
  }, []);

  const handleCancelUpdateForm = useCallback(() => {
    setShowUpdateForm(false);
    setSelectedOrder(null);
  }, []);

  // Note: For simplicity, handleTechnicianChange is approximate; in real, use callback or separate handlers
  // Template handlers
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newTemplate = {
      id: `TPL-${Date.now()}`,
      templateName: formData.get('templateName')?.toString() || '',
      productCategory: formData.get('productCategory')?.toString() || '',
      commonIssue: formData.get('commonIssue')?.toString() || '',
      estimatedDuration: parseInt(formData.get('estimatedDuration')?.toString() || '0', 10),
      defaultParts: (formData.get('defaultParts')?.toString() || '').split(',').map(p => p.trim()).filter(Boolean),
      isActive: (formData.get('isActive') as string) === 'on',
    };
    addRepairTemplate(newTemplate);
    setShowTemplateForm(false);
  };
  const handleUpdateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const updatedTemplate = {
      id: selectedTemplate.id, // Preserve original ID
      templateName: formData.get('templateName')?.toString() || '',
      productCategory: formData.get('productCategory')?.toString() || '',
      commonIssue: formData.get('commonIssue')?.toString() || '',
      estimatedDuration: parseInt(formData.get('estimatedDuration')?.toString() || '0', 10),
      defaultParts: (formData.get('defaultParts')?.toString() || '').split(',').map(p => p.trim()).filter(Boolean),
      isActive: (formData.get('isActive') as string) === 'on',
    };
    // Use storage.push for upsert (update if ID exists)
    // storage.push(STORAGE_KEYS.REPAIR_TEMPLATES, updatedTemplate);
    // Reload templates to reflect update
    setRepairTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    setShowTemplateUpdateModal(false);
    setSelectedTemplate(null);
  };
  const openTemplateViewModal = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateViewModal(true);
  };
  const openTemplateUpdateModal = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateUpdateModal(true);
  };
  const closeTemplateModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
    if (setter === setShowTemplateUpdateModal || setter === setShowTemplateViewModal) {
      setSelectedTemplate(null);
    }
  };
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'orders', name: 'Repair Orders', icon: FileText },
    { id: 'teams', name: 'Repair Teams', icon: Users },
    { id: 'templates', name: 'Repair Templates', icon: Clipboard },
    { id: 'reports', name: 'Reports & Analytics', icon: TrendingUp },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];
  const filteredOrders = repairOrders.filter((order: any) => {
    const product = inventory.find(item => item.id === order.productId);
    const matchesSearch = product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.repairType === typeFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });
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

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wrench className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{repairOrders.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Under Repair</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {repairOrders.filter((order: any) => order.status === 'under-repair').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {repairOrders.filter((order: any) => order.status === 'done').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${repairOrders.reduce((sum: number, order: any) => sum + (order.totalCost || 0), 0).toLocaleString()}
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
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Repair Order</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Manage Teams</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Clipboard className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Repair Templates</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">View Reports</span>
          </button>
        </div>
      </div>
      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Repair Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {repairOrders.slice(0, 5).map((order: any) => {
            const product = inventory.find(item => item.id === order.productId);
            return (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{product?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-gray-500">{order.customerName} • {order.assignedTechnician}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  const ViewRepairOrderModal = ({ order, onClose }: { order: any; onClose: () => void }) => {
    const product = inventory.find((item) => item.id === order.productId);
    const team = filteredRepairTeams.find((t: RepairTeam) => t._id === order.teamId);
    if (!order) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Wrench className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">Repair Order Details</h3>
                <span className="ml-3 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {order.id}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <p className="text-sm text-gray-900 font-medium">{product?.name || 'Unknown Product'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <p className="text-sm text-gray-900">{order.quantity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial/Lot Number</label>
                    <p className="text-sm text-gray-900">{order.serialLotNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer/Department</label>
                    <p className="text-sm text-gray-900">{order.customerName}</p>
                  </div>
                </div>
                {order.sourceDocument && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Document</label>
                    <p className="text-sm text-gray-900">{order.sourceDocument}</p>
                  </div>
                )}
              </div>
              {/* Repair Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Tool className="h-4 w-4 mr-2 text-gray-500" />
                  Repair Details
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repair Type</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(order.repairType)}`}>
                      {order.repairType}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
                    <p className="text-sm text-gray-900 capitalize">{order.rootCause}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.issueDescription}</p>
                </div>
                {order.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
              </div>
              {/* Assignment & Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  Assignment & Timeline
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Team</label>
                    <p className="text-sm text-gray-900">{team?.teamName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Technician</label>
                    <p className="text-sm text-gray-900">{order.assignedTechnician || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested Date</label>
                    <p className="text-sm text-gray-900">{order.requestedDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion</label>
                    <p className="text-sm text-gray-900 font-medium">{order.expectedCompletion}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <p className="text-sm text-gray-900">{order.location}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              {/* Additional Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Type</label>
                    <p className="text-sm text-gray-900 capitalize">{order.warrantyType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chargeable</label>
                    <p className="text-sm text-gray-900">{order.isChargeable ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Breakdown</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-semibold text-gray-900">${order.totalCost.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs text-gray-500">Parts</p>
                      <p className="text-sm font-semibold text-gray-900">${order.partsCost.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs text-gray-500">Labor</p>
                      <p className="text-sm font-semibold text-gray-900">${order.laborCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderOrders = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
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
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </button>
        </div>
      </div>
      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-x-scroll">
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
            {filteredOrders.map((order) => {
              const product = inventory.find(item => item.id === order.productId);
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      <div className="text-sm text-gray-500">Qty: {order.quantity}</div>
                      {order.serialLotNumber && (
                        <div className="text-xs text-gray-400">S/N: {order.serialLotNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{product?.name || 'Unknown Product'}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="text-sm font-medium">Due: {order.expectedCompletion}</div>
                      <div className="text-sm text-gray-500">Created: {order.createdDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">${order.totalCost.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Parts: ${order.partsCost.toFixed(2)} | Labor: ${order.laborCost.toFixed(2)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          setSelectedOrder(order.id);
                          setShowViewModal(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => {
                          setSelectedOrder(order.id);
                          setShowUpdateForm(true);
                        }}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {order.status === 'confirmed' && (
                        <button className="text-purple-600 hover:text-purple-900" title="Start Repair">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button className="text-red-600 hover:text-red-900" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
    </div>
  );
  const handleCancelTeamForm = useCallback(() => {
    setShowTeamForm(false);
  }, []);

  const handleAddTeamSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamFormData.teamName.trim()) {
      const newTeam = {
        teamName: teamFormData.teamName,
        teamLead: teamFormData.teamLead,
        location: teamFormData.location,
        contactInfo: teamFormData.contactInfo,
        members: [],
      };
      
      try {
        await handleCreateTeam(newTeam);
        setShowTeamForm(false);
        setTeamFormData({
          teamName: '',
          teamLead: '',
          location: '',
          contactInfo: { email: '', phone: '' },
          members: [],
        });
      } catch (error) {
        console.error('Failed to create team:', error);
      }
    }
  }, [teamFormData, handleCreateTeam]);

  const renderTeams = () => (
    <div className="space-y-6">
      {/* Teams Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Repair Teams</h3>
          {canCreate && (
            <button
              onClick={() => setShowTeamForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {teamsLoading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading teams...</p>
            </div>
          ) : filteredRepairTeams.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No repair teams found</p>
              {canCreate && (
                <button
                  onClick={() => setShowTeamForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Create your first team
                </button>
              )}
            </div>
          ) : (
            filteredRepairTeams.map((team: RepairTeam) => (
              <div key={team._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">{team.teamName}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{team.members?.length || 0} members</span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteTeam(team._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Team"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Lead: {team.teamLead}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location: {team.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {team.contactInfo.email}
                  </div>
                  {team.contactInfo.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {team.contactInfo.phone}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Team Members:</h5>
                  <div className="space-y-1">
                    {team.members && team.members.length > 0 ? (
                      team.members.map((member) => (
                        <div key={member.technicianId} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-gray-900">{member.name}</span>
                            {member.hourlyRate && (
                              <div className="text-xs text-gray-500">${member.hourlyRate}/hr</div>
                            )}
                          </div>
                          {member.availability && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              member.availability === 'available' ? 'bg-green-100 text-green-800' :
                              member.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {member.availability}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">No members assigned</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Team Form Modal */}
      {showTeamForm && (
        <TeamForm 
          teamFormData={teamFormData}
          setTeamFormData={setTeamFormData}
          onSubmit={handleAddTeamSubmit}
          onCancel={handleCancelTeamForm}
          allLocations={allLocations}
          hasLocations={hasLocations}
          dispatch={dispatch}
        />
      )}
    </div>
  );
  // Template Modal Components
  const TemplateModal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) =>
    isOpen ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    ) : null;
  const TemplateForm = ({ initialData = {}, isView = false, onSubmit, onClose }: { initialData?: any; isView?: boolean; onSubmit: (e: React.FormEvent) => void; onClose: () => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
        <input
          type="text"
          name="templateName"
          defaultValue={initialData.templateName || ''}
          required={!isView}
          readOnly={isView}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
        <input
          type="text"
          name="productCategory"
          defaultValue={initialData.productCategory || ''}
          required={!isView}
          readOnly={isView}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Common Issue</label>
        <input
          type="text"
          name="commonIssue"
          defaultValue={initialData.commonIssue || ''}
          required={!isView}
          readOnly={isView}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (hours)</label>
        <input
          type="number"
          name="estimatedDuration"
          defaultValue={initialData.estimatedDuration || ''}
          required={!isView}
          readOnly={isView}
          min="0"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Default Parts (comma-separated)</label>
        <textarea
          name="defaultParts"
          defaultValue={initialData.defaultParts ? initialData.defaultParts.join(', ') : ''}
          required={!isView}
          readOnly={isView}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initialData.isActive || false}
          disabled={isView}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">Active</label>
      </div>
      {!isView && (
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {initialData.id ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      )}
      {isView && (
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      )}
    </form>
  );
  const renderTemplates = () => (
    <div className="space-y-6">
      {/* Templates Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Repair Templates</h3>
          <button
            onClick={() => setShowTemplateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
       <div className="w-full overflow-x-auto rounded-lg shadow-sm border border-gray-200">
  <table className="min-w-full divide-y divide-gray-200 table-auto">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
          Template Name
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
          Product Category
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
          Common Issue
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
          Est. Duration
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
          Default Parts
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
          Status
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200 text-sm">
      {repairTemplates.map((template) => (
        <tr key={template.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
            {template.templateName}
            <div className="text-gray-500 text-xs sm:hidden">
              {template.productCategory} • {template.estimatedDuration}h
            </div>
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-gray-700 hidden sm:table-cell">
            {template.productCategory}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-gray-700 hidden sm:table-cell">
            {template.commonIssue}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-gray-700 hidden md:table-cell">
            {template.estimatedDuration}h
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-gray-700 hidden md:table-cell">
            {template.defaultParts.length} parts
          </td>
          <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                template.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {template.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openTemplateViewModal(template)}
                className="text-blue-600 hover:text-blue-900"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => openTemplateUpdateModal(template)}
                className="text-green-600 hover:text-green-900"
                title="Edit Template"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button className="text-purple-600 hover:text-purple-900 text-xs font-semibold">
                Use
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
      </div>
      {/* Template Modals */}
      <TemplateModal
        isOpen={showTemplateForm}
        onClose={() => closeTemplateModal(setShowTemplateForm)}
        title="Create Repair Template"
      >
        <TemplateForm onSubmit={handleCreateTemplate} onClose={() => closeTemplateModal(setShowTemplateForm)} />
      </TemplateModal>
      <TemplateModal
        isOpen={showTemplateViewModal}
        onClose={() => closeTemplateModal(setShowTemplateViewModal)}
        title={`View Template: ${selectedTemplate?.templateName || ''}`}
      >
        <TemplateForm initialData={selectedTemplate || {}} isView={true} onSubmit={() => {}} onClose={() => closeTemplateModal(setShowTemplateViewModal)} />
      </TemplateModal>
      <TemplateModal
        isOpen={showTemplateUpdateModal}
        onClose={() => closeTemplateModal(setShowTemplateUpdateModal)}
        title={`Update Template: ${selectedTemplate?.templateName || ''}`}
      >
        <TemplateForm initialData={selectedTemplate || {}} onSubmit={handleUpdateTemplate} onClose={() => closeTemplateModal(setShowTemplateUpdateModal)} />
      </TemplateModal>
    </div>
  );
  const renderReports = () => (
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Repair Summary</h3>
              <p className="text-sm text-gray-500">By status, type, date</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Cost Analysis</h3>
              <p className="text-sm text-gray-500">Parts vs labor costs</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Turnaround Time</h3>
              <p className="text-sm text-gray-500">Average repair duration</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Quality Metrics</h3>
              <p className="text-sm text-gray-500">Repeat repairs, satisfaction</p>
            </div>
          </div>
        </div>
      </div>
      {/* Sample Reports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Repair Summary Report</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Repairs by Type</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Warranty</span>
                  <span className="text-sm font-medium text-gray-900">
                    {repairOrders.filter((r: any) => r.repairType === 'warranty').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paid</span>
                  <span className="text-sm font-medium text-gray-900">
                    {repairOrders.filter((r: any) => r.repairType === 'paid').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Internal</span>
                  <span className="text-sm font-medium text-gray-900">
                    {repairOrders.filter((r: any) => r.repairType === 'internal').length}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Cost Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Parts Cost</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${repairOrders.reduce((sum: number, r: any) => sum + (r.partsCost || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Labor Cost</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${repairOrders.reduce((sum: number, r: any) => sum + (r.laborCost || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Repair Cost</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${(repairOrders.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0) / repairOrders.length || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  const renderSettings = () => (
    <div className="space-y-6">
      {/* Settings Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Repair Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">In-Warranty</span>
              <span className="text-xs text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Out-of-Warranty (Paid)</span>
              <span className="text-xs text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Internal</span>
              <span className="text-xs text-green-600">Active</span>
            </div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            + Add Repair Type
          </button>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Labor Rates</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Standard Rate</span>
              <span className="text-sm font-medium">$75/hour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Specialist Rate</span>
              <span className="text-sm font-medium">$95/hour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Emergency Rate</span>
              <span className="text-sm font-medium">$120/hour</span>
            </div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            Edit Rates
          </button>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Default Locations</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">Repair Center A</div>
            <div className="text-sm text-gray-700">Repair Center B</div>
            <div className="text-sm text-gray-700">Customer Site</div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            Manage Locations
          </button>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Email customer on status change</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Internal team alerts</span>
            </label>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Auto Actions</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Auto scrap unusable parts</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Auto generate invoices</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Reserve parts automatically</span>
            </label>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Fields</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">Customer PO Number</div>
            <div className="text-sm text-gray-700">Warranty Expiry Date</div>
            <div className="text-sm text-gray-700">Return Shipping Method</div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            Add Custom Field
          </button>
        </div>
      </div>
    </div>
  );
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'orders':
        return renderOrders();
      case 'teams':
        return renderTeams();
      case 'templates':
        return renderTemplates();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

  return (
    // <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Repair Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive repair operations management with workflow tracking and cost analysis
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
        {/* Create/Update Forms */}
        {showCreateForm && (
          <RepairOrderForm
            formData={createFormData}
            setFormData={setCreateFormData}
            onSubmit={handleCreateSubmit}
            onCancel={handleCancelCreateForm}
            inventory={inventory}
            filteredRepairTeams={filteredRepairTeams}
            allLocations={allLocations}
            hasLocations={hasLocations}
            dispatch={dispatch}
          />
        )}
        {showUpdateForm && (
          <RepairOrderForm
            isUpdate={true}
            formData={updateFormData}
            setFormData={setUpdateFormData}
            onSubmit={handleUpdateSubmit}
            onCancel={handleCancelUpdateForm}
            inventory={inventory}
            filteredRepairTeams={filteredRepairTeams}
            allLocations={allLocations}
            hasLocations={hasLocations}
            dispatch={dispatch}
          />
        )}
      </div>
    // </Layout>
  );
};

export default Repair;