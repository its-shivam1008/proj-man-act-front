import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/userPermission';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import {
  fetchQualityTeams,
  addQualityTeam,
  updateQualityTeam,
  deleteQualityTeam,
  clearError,
} from '@/redux/slices/qualityTeamSlice';
import {
  QualityTeam,
  CreateQualityTeamData,
  UpdateQualityTeamData,
  QualityTeamDepartment,
} from '@/types/quality.types';
import {
  Plus,
  Users,
  Edit,
  Trash2,
  X,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Grid3X3,
  List,
  MapPin,
  Mail,
  Phone,
  UserCheck,
  Building
} from 'lucide-react';
import { ClipLoader } from 'react-spinners';

interface QualityTeamsProps {
  // Remove props since we'll use Redux
}

const QualityTeams: React.FC<QualityTeamsProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const {
    qualityTeams = [],
    loading,
    currentPage,
    totalPages,
    totalTeams,
    error,
  } = useSelector((state: RootState) => state.qualityTeams);

  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);

  // Permissions
  const canView = usePermission('qualityControl', 'view');
  const canCreate = usePermission('qualityControl', 'create');
  const canEdit = usePermission('qualityControl', 'edit');
  const canDelete = usePermission('qualityControl', 'delete');

  // Local state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<QualityTeam | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<QualityTeam | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Location restrictions
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  // Get organisation ID
  const organisationId = localStorage.getItem('organisationId');

  // Load master data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location"));
  }, [dispatch]);

  // Load data on mount and filter changes
  useEffect(() => {
    if (organisationId && canView) {
      dispatch(
        fetchQualityTeams({
          organisationId,
          page,
          limit: 10,
          department: departmentFilter,
          isActive: isActiveFilter,
          search: debouncedSearch,
          location: locationFilter,
        })
      );
    }
  }, [organisationId, page, departmentFilter, isActiveFilter, debouncedSearch, locationFilter, canView, dispatch]);

  // Set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Filter change handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setPage(1);
  };

  const handleIsActiveFilterChange = (value: string) => {
    setIsActiveFilter(value);
    setPage(1);
  };

  const handleLocationFilterChange = (value: string) => {
    setLocationFilter(value);
    setPage(1);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  };

  // CRUD handlers
  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    const teamData: CreateQualityTeamData = {
      teamName: (form.elements.namedItem('teamName') as HTMLInputElement).value,
      teamLeader: (form.elements.namedItem('teamLeader') as HTMLInputElement).value,
      department: (form.elements.namedItem('department') as HTMLSelectElement).value as QualityTeamDepartment,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value || undefined,
      relatedProducts: [],
      isActive: (form.elements.namedItem('isActive') as HTMLInputElement).checked,
      location: isLocationRestricted ? userProfile?.location : (form.elements.namedItem('location') as HTMLSelectElement)?.value,
    };

    try {
      await dispatch(addQualityTeam(teamData)).unwrap();
      toast.success('Quality team created successfully');
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error || 'Failed to create quality team');
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTeam) return;
    
    const form = e.currentTarget;
    
    const updateData: UpdateQualityTeamData = {
      teamName: (form.elements.namedItem('teamName') as HTMLInputElement).value,
      teamLeader: (form.elements.namedItem('teamLeader') as HTMLInputElement).value,
      department: (form.elements.namedItem('department') as HTMLSelectElement).value as QualityTeamDepartment,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value || undefined,
      isActive: (form.elements.namedItem('isActive') as HTMLInputElement).checked,
    };

    try {
      await dispatch(updateQualityTeam({ id: editingTeam._id, data: updateData })).unwrap();
      toast.success('Quality team updated successfully');
      setShowUpdateForm(false);
      setEditingTeam(null);
    } catch (error: any) {
      toast.error(error || 'Failed to update quality team');
    }
  };

  const handleDeleteTeam = async () => {
    if (!itemToDelete) return;

    try {
      await dispatch(deleteQualityTeam(itemToDelete._id)).unwrap();
      toast.success('Quality team deleted successfully');
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error(error || 'Failed to delete quality team');
    }
  };

  const openEditTeam = (team: QualityTeam) => {
    setEditingTeam(team);
    setShowUpdateForm(true);
  };

  const openDeleteConfirm = (team: QualityTeam) => {
    setItemToDelete(team);
    setShowDeleteConfirm(true);
  };

  // Helper functions
  const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    const location = locations.find(loc => loc._id === locationId);
    return location ? location.name : locationId;
  };

  const getDepartmentDisplayName = (department: string) => {
    return department.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Permission check
  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view quality teams.</p>
      </div>
    );
  }

  const CreateTeamForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Quality Team</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Auto-generated"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                <input
                  name="teamName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Leader *</label>
                <input
                  name="teamLeader"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team leader name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  name="department"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="quality-control">Quality Control</option>
                  <option value="production">Production</option>
                  <option value="incoming-inspection">Incoming Inspection</option>
                  <option value="final-inspection">Final Inspection</option>
                  <option value="laboratory">Laboratory</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            {!isLocationRestricted && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  name="location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={true}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">Active Team</label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const UpdateTeamForm = () => {
    if (!editingTeam) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Quality Team</h3>
              <button
                onClick={() => {
                  setShowUpdateForm(false);
                  setEditingTeam(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team ID</label>
                  <input
                    type="text"
                    value={editingTeam.teamId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                  <input
                    name="teamName"
                    type="text"
                    defaultValue={editingTeam.teamName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Leader *</label>
                  <input
                    name="teamLeader"
                    type="text"
                    defaultValue={editingTeam.teamLeader}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    name="department"
                    defaultValue={editingTeam.department}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="quality-control">Quality Control</option>
                    <option value="production">Production</option>
                    <option value="incoming-inspection">Incoming Inspection</option>
                    <option value="final-inspection">Final Inspection</option>
                    <option value="laboratory">Laboratory</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingTeam.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editingTeam.phone || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={editingTeam.isActive}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Active Team</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setEditingTeam(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Card View Component
  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {qualityTeams.map((team) => (
        <div key={team._id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{team.teamName}</h3>
                <p className="text-sm text-gray-500">{team.teamId}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  team.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {team.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Leader:</span>
                <span className="ml-1">{team.teamLeader}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Building className="h-4 w-4 mr-2 text-green-500" />
                <span className="font-medium">Dept:</span>
                <span className="ml-1">{getDepartmentDisplayName(team.department)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-purple-500" />
                <span className="font-medium">Email:</span>
                <span className="ml-1 truncate">{team.email}</span>
              </div>
              {team.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="font-medium">Phone:</span>
                  <span className="ml-1">{team.phone}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-red-500" />
                <span className="font-medium">Location:</span>
                <span className="ml-1">{getLocationName(team.location || '')}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2 text-indigo-500" />
                <span className="font-medium">Members:</span>
                <span className="ml-1">{team.assignedUsers?.length || 0}</span>
              </div>
            </div>

            {/* Related Products */}
            {team.relatedProducts && team.relatedProducts.length > 0 && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">Products:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {team.relatedProducts.slice(0, 3).map((product: string, index: number) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {product}
                    </span>
                  ))}
                  {team.relatedProducts.length > 3 && (
                    <span className="inline-flex px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                      +{team.relatedProducts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              {canEdit && (
                <button
                  onClick={() => openEditTeam(team)}
                  className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                  title="Edit Team"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => openDeleteConfirm(team)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Team"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={departmentFilter}
              onChange={(e) => handleDepartmentFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="quality-control">Quality Control</option>
              <option value="production">Production</option>
              <option value="incoming-inspection">Incoming Inspection</option>
              <option value="final-inspection">Final Inspection</option>
              <option value="laboratory">Laboratory</option>
            </select>
            <select
              value={isActiveFilter}
              onChange={(e) => handleIsActiveFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {!isLocationRestricted && (
              <select
                value={locationFilter}
                onChange={(e) => handleLocationFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Locations</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Card View"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>

          {canCreate && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Team
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <ClipLoader
              color="#3B82F6"
              loading={loading}
              size={40}
              aria-label="Loading Spinner"
            />
            <p className="mt-4 text-gray-600">Loading quality teams...</p>
          </div>
        </div>
      ) : qualityTeams.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center text-gray-500">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quality teams found</h3>
            <p className="text-gray-500">Get started by creating your first quality team.</p>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* View Mode Content */}
          {viewMode === 'cards' ? (
            <CardView />
          ) : (
            /* Table View */
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Quality Teams ({totalTeams})</h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Leader
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {qualityTeams.map((team) => (
                        <tr key={team._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                            <div className="text-sm text-gray-500">{team.teamId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {team.teamLeader}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getDepartmentDisplayName(team.department)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{team.email}</div>
                            {team.phone && <div className="text-gray-500">{team.phone}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getLocationName(team.location || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {team.assignedUsers?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              team.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {team.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {canEdit && (
                                <button
                                  onClick={() => openEditTeam(team)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => openDeleteConfirm(team)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span> (Total: {totalTeams} teams)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pagination for Card View */}
      {viewMode === 'cards' && qualityTeams.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> (Total: {totalTeams} teams)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateForm && <CreateTeamForm />}
      {showUpdateForm && <UpdateTeamForm />}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Team?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this team? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityTeams;