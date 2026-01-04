import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/userPermission';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import { fetchProducts } from '@/redux/slices/productSlice';
import { fetchQualityTeams } from '@/redux/slices/qualityTeamSlice';
import {
  fetchControlPoints,
  addControlPoint,
  deleteControlPoint,
  clearError,
} from '@/redux/slices/controlPointSlice';
import {
  ControlPoint,
  CreateControlPointData,
  ControlPointOperation,
  ControlPointType,
  CheckType,
} from '@/types/quality.types';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Target,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ClipLoader } from 'react-spinners';

interface ControlPointsProps {
  // Remove props since we'll use Redux
}

const ControlPoints: React.FC<ControlPointsProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const {
    controlPoints = [],
    loading,
    currentPage,
    totalPages,
    totalControlPoints,
    error,
  } = useSelector((state: RootState) => state.controlPoints);

  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);
  const { products } = useSelector((state: RootState) => state.products);
  const { qualityTeams } = useSelector((state: RootState) => state.qualityTeams);

  // Permissions
  const canView = usePermission('qualityControl', 'view');
  const canCreate = usePermission('qualityControl', 'create');
  const canEdit = usePermission('qualityControl', 'edit');
  const canDelete = usePermission('qualityControl', 'delete');

  // Local state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ControlPoint | null>(null);
  
  // Filters
  const [operationFilter, setOperationFilter] = useState('all');
  const [controlTypeFilter, setControlTypeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
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
    // Fetch products for dropdown
    dispatch(fetchProducts({ page: 1, limit: 100 }));
    // Fetch quality teams for dropdown
    if (organisationId) {
      dispatch(fetchQualityTeams({
        organisationId,
        page: 1,
        limit: 100
      }));
    }
  }, [dispatch, organisationId]);

  // Load data on mount and filter changes
  useEffect(() => {
    if (organisationId && canView) {
      dispatch(
        fetchControlPoints({
          organisationId,
          page,
          limit: 10,
          operationType: operationFilter,
          controlType: controlTypeFilter,
          active: activeFilter,
          search: debouncedSearch,
          location: locationFilter,
        })
      );
    }
  }, [organisationId, page, operationFilter, controlTypeFilter, activeFilter, debouncedSearch, locationFilter, canView, dispatch]);

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

  const handleOperationFilterChange = (value: string) => {
    setOperationFilter(value);
    setPage(1);
  };

  const handleControlTypeFilterChange = (value: string) => {
    setControlTypeFilter(value);
    setPage(1);
  };

  const handleActiveFilterChange = (value: string) => {
    setActiveFilter(value);
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
  const handleCreateControlPoint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    const controlPointData: CreateControlPointData = {
      controlPointName: (form.elements.namedItem('controlPointName') as HTMLInputElement).value,
      operationType: (form.elements.namedItem('operationType') as HTMLSelectElement).value as ControlPointOperation,
      product: (form.elements.namedItem('product') as HTMLSelectElement).value,
      qualityTeamId: (form.elements.namedItem('qualityTeamId') as HTMLSelectElement).value,
      controlType: (form.elements.namedItem('controlType') as HTMLSelectElement).value as ControlPointType,
      frequency: Number((form.elements.namedItem('frequency') as HTMLInputElement).value) || null,
      instruction: (form.elements.namedItem('instruction') as HTMLTextAreaElement).value,
      responsible: (form.elements.namedItem('responsible') as HTMLInputElement).value,
      typeOfCheck: (form.elements.namedItem('typeOfCheck') as HTMLSelectElement).value as CheckType,
      toleranceMin: Number((form.elements.namedItem('toleranceMin') as HTMLInputElement).value) || null,
      toleranceMax: Number((form.elements.namedItem('toleranceMax') as HTMLInputElement).value) || null,
      active: (form.elements.namedItem('active') as HTMLInputElement).checked,
      location: isLocationRestricted ? userProfile?.location : (form.elements.namedItem('location') as HTMLSelectElement)?.value,
    };

    try {
      await dispatch(addControlPoint(controlPointData)).unwrap();
      toast.success('Control point created successfully');
      setShowCreateForm(false);
      
      // Refresh the control points list with current filters
      if (organisationId) {
        dispatch(
          fetchControlPoints({
            organisationId,
            page,
            limit: 10,
            operationType: operationFilter,
            controlType: controlTypeFilter,
            active: activeFilter,
            search: debouncedSearch,
            location: locationFilter,
          })
        );
      }
    } catch (error: any) {
      toast.error(error || 'Failed to create control point');
    }
  };

  const handleDeleteControlPoint = async () => {
    if (!itemToDelete) return;

    try {
      await dispatch(deleteControlPoint(itemToDelete._id)).unwrap();
      toast.success('Control point deleted successfully');
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      
      // Refresh the control points list with current filters
      if (organisationId) {
        dispatch(
          fetchControlPoints({
            organisationId,
            page,
            limit: 10,
            operationType: operationFilter,
            controlType: controlTypeFilter,
            active: activeFilter,
            search: debouncedSearch,
            location: locationFilter,
          })
        );
      }
    } catch (error: any) {
      toast.error(error || 'Failed to delete control point');
    }
  };

  const openViewControlPoint = (controlPoint: ControlPoint) => {
    // For now, just show a toast - can implement view modal later
    toast.info(`Viewing control point: ${controlPoint.controlPointName}`);
  };

  const openEditControlPoint = (controlPoint: ControlPoint) => {
    // For now, just show a toast - can implement edit modal later
    toast.info(`Editing control point: ${controlPoint.controlPointName}`);
  };

  const openDeleteConfirm = (controlPoint: ControlPoint) => {
    setItemToDelete(controlPoint);
    setShowDeleteConfirm(true);
  };

  // Helper function to get location name
  const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    const location = locations.find(loc => loc._id === locationId);
    return location ? location.name : locationId;
  };

  // Helper function to get quality team name
  const getQualityTeamName = (teamId: string) => {
    if (!teamId) return 'N/A';
    const team = qualityTeams.find((team: any) => team._id === teamId);
    return team ? team.teamName : teamId;
  };

  // Permission check
  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view control points.</p>
      </div>
    );
  }

  const CreateControlPointForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Control Point</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleCreateControlPoint} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Control Point Name *</label>
                <input
                  name="controlPointName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type *</label>
                <select
                  name="operationType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="manufacturing">Manufacturing</option>
                  <option value="reception">Reception</option>
                  <option value="delivery">Delivery</option>
                  <option value="storage">Storage</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <select
                  name="product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product: any) => (
                    <option key={product._id} value={product.name}>
                      {product.name} - {product.category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Team *</label>
                <select
                  name="qualityTeamId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Quality Team</option>
                  {qualityTeams.map((team: any) => (
                    <option key={team._id} value={team._id}>
                      {team.teamName} - {team.teamLeader}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Control Type *</label>
                <select
                  name="controlType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="all-operations">All Operations</option>
                  <option value="random">Random</option>
                  <option value="periodic">Periodic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency (1 in X)</label>
                <input
                  name="frequency"
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instruction *</label>
              <textarea
                name="instruction"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsible *</label>
                <input
                  name="responsible"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter responsible person"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check Type *</label>
                <select
                  name="typeOfCheck"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="text">Text</option>
                  <option value="measurement">Measurement</option>
                  <option value="pass-fail">Pass-Fail</option>
                  <option value="picture">Picture</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tolerance Min</label>
                <input
                  name="toleranceMin"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tolerance Max</label>
                <input
                  name="toleranceMax"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                name="active"
                type="checkbox"
                defaultChecked={true}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">Active</label>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Control Point
              </button>
            </div>
          </form>
        </div>
      </div>
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
                placeholder="Search control points..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={operationFilter}
              onChange={(e) => handleOperationFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Operations</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="reception">Reception</option>
              <option value="delivery">Delivery</option>
              <option value="storage">Storage</option>
            </select>
            <select
              value={controlTypeFilter}
              onChange={(e) => handleControlTypeFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Control Types</option>
              <option value="all-operations">All Operations</option>
              <option value="random">Random</option>
              <option value="periodic">Periodic</option>
            </select>
            <select
              value={activeFilter}
              onChange={(e) => handleActiveFilterChange(e.target.value)}
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
          {canCreate && <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Control Point
          </button>}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Quality Control Points ({totalControlPoints})</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Control Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
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
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <ClipLoader
                        color="#3B82F6"
                        loading={loading}
                        size={30}
                        aria-label="Loading Spinner"
                      />
                    </td>
                  </tr>
                ) : controlPoints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-sm font-medium text-gray-900">No control points found</h3>
                        <p className="text-sm text-gray-500 mt-1">Get started by creating your first control point.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  controlPoints.map((cp) => (
                    <tr key={cp._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cp.controlPointName}</div>
                        <div className="text-sm text-gray-500">{cp.instruction?.substring(0, 50)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {cp.operationType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cp.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getQualityTeamName(cp.qualityTeamId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {cp.typeOfCheck}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getLocationName(cp.location || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cp.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openViewControlPoint(cp)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => openEditControlPoint(cp)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => openDeleteConfirm(cp)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
                <span className="font-medium">{totalPages}</span> (Total: {totalControlPoints} control points)
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

      {/* Modals */}
      {showCreateForm && <CreateControlPointForm />}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Control Point?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this control point? This action cannot be undone.
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
                onClick={handleDeleteControlPoint}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPoints;