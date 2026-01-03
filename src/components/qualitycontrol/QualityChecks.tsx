import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/userPermission';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import {
  fetchQualityChecks,
  addQualityCheck,
  updateQualityCheck,
  deleteQualityCheck,
  clearError,
} from '@/redux/slices/qualityCheckSlice';
import {
  QualityCheck,
  CreateQualityCheckData,
  UpdateQualityCheckData,
  QualityCheckOperation,
  QualityCheckResult,
} from '@/types/quality.types';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ClipLoader } from 'react-spinners';

interface QualityChecksProps {
  // Remove props since we'll use Redux
}

const QualityChecks: React.FC<QualityChecksProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const {
    qualityChecks = [],
    loading,
    currentPage,
    totalPages,
    totalChecks,
    error,
  } = useSelector((state: RootState) => state.qualityChecks);

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
  const [showViewForm, setShowViewForm] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [editingCheck, setEditingCheck] = useState<QualityCheck | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<QualityCheck | null>(null);
  
  // Filters
  const [resultFilter, setResultFilter] = useState('all');
  const [operationFilter, setOperationFilter] = useState('all');
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
        fetchQualityChecks({
          organisationId,
          page,
          limit: 10,
          result: resultFilter,
          operation: operationFilter,
          search: debouncedSearch,
          location: locationFilter,
        })
      );
    }
  }, [organisationId, page, resultFilter, operationFilter, debouncedSearch, locationFilter, canView, dispatch]);

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

  const handleResultFilterChange = (value: string) => {
    setResultFilter(value);
    setPage(1);
  };

  const handleOperationFilterChange = (value: string) => {
    setOperationFilter(value);
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
  const handleCreateCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    const checkData: CreateQualityCheckData = {
      product: (form.elements.namedItem('product') as HTMLInputElement).value,
      batchNumber: (form.elements.namedItem('batchNumber') as HTMLInputElement).value || undefined,
      relatedOperation: (form.elements.namedItem('operation') as HTMLSelectElement).value as QualityCheckOperation,
      testType: (form.elements.namedItem('testType') as HTMLInputElement).value || undefined,
      quantityChecked: Number((form.elements.namedItem('quantity') as HTMLInputElement).value),
      measurementValue: Number((form.elements.namedItem('measurementValue') as HTMLInputElement).value) || undefined,
      result: (form.elements.namedItem('result') as HTMLSelectElement).value as QualityCheckResult,
      performedBy: (form.elements.namedItem('performedBy') as HTMLInputElement).value,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value || undefined,
      location: isLocationRestricted ? userProfile?.location : (form.elements.namedItem('location') as HTMLSelectElement)?.value,
    };

    try {
      await dispatch(addQualityCheck(checkData)).unwrap();
      toast.success('Quality check created successfully');
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error || 'Failed to create quality check');
    }
  };

  const handleUpdateCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCheck) return;
    
    const form = e.currentTarget;
    
    const updateData: UpdateQualityCheckData = {
      product: (form.elements.namedItem('product') as HTMLInputElement).value,
      batchNumber: (form.elements.namedItem('batchNumber') as HTMLInputElement).value || undefined,
      relatedOperation: (form.elements.namedItem('operation') as HTMLSelectElement).value as QualityCheckOperation,
      testType: (form.elements.namedItem('testType') as HTMLInputElement).value || undefined,
      quantityChecked: Number((form.elements.namedItem('quantity') as HTMLInputElement).value),
      result: (form.elements.namedItem('result') as HTMLSelectElement).value as QualityCheckResult,
      performedBy: (form.elements.namedItem('performedBy') as HTMLInputElement).value,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value || undefined,
    };

    try {
      await dispatch(updateQualityCheck({ id: editingCheck._id, data: updateData })).unwrap();
      toast.success('Quality check updated successfully');
      setShowUpdateForm(false);
      setEditingCheck(null);
    } catch (error: any) {
      toast.error(error || 'Failed to update quality check');
    }
  };

  const handleDeleteCheck = async () => {
    if (!itemToDelete) return;

    try {
      await dispatch(deleteQualityCheck(itemToDelete._id)).unwrap();
      toast.success('Quality check deleted successfully');
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error(error || 'Failed to delete quality check');
    }
  };

  const openViewCheck = (check: QualityCheck) => {
    setSelectedCheck(check);
    setShowViewForm(true);
  };

  const openEditCheck = (check: QualityCheck) => {
    setEditingCheck(check);
    setShowUpdateForm(true);
  };

  const openDeleteConfirm = (check: QualityCheck) => {
    setItemToDelete(check);
    setShowDeleteConfirm(true);
  };

  // Helper functions
  const getResultColor = (result: string) => {
    switch (result) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    const location = locations.find(loc => loc._id === locationId);
    return location ? location.name : locationId;
  };

  // Permission check
  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view quality checks.</p>
      </div>
    );
  }

  const CreateCheckForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Quality Check</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleCreateCheck} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check ID *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Auto-generated"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related Operation *</label>
                <select
                  name="operation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Operation</option>
                  <option value="incoming">Incoming</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="delivery">Delivery</option>
                  <option value="storage">Storage</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <input
                  name="product"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                <input
                  name="batchNumber"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter batch number"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Checked *</label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                <input
                  name="testType"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Visual Inspection, Measurement"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Value</label>
                <input
                  name="measurementValue"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Result *</label>
                <select
                  name="result"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Performed By *</label>
                <input
                  name="performedBy"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Inspector name"
                  required
                />
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or observations..."
              />
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
                {loading ? 'Creating...' : 'Create Check'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const UpdateCheckForm = () => {
    if (!editingCheck) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Quality Check</h3>
              <button
                onClick={() => {
                  setShowUpdateForm(false);
                  setEditingCheck(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateCheck} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check ID</label>
                  <input
                    type="text"
                    value={editingCheck.checkId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Related Operation *</label>
                  <select
                    name="operation"
                    defaultValue={editingCheck.relatedOperation}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Operation</option>
                    <option value="incoming">Incoming</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="delivery">Delivery</option>
                    <option value="storage">Storage</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                  <input
                    name="product"
                    type="text"
                    defaultValue={editingCheck.product}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                  <input
                    name="batchNumber"
                    type="text"
                    defaultValue={editingCheck.batchNumber || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Checked *</label>
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    defaultValue={editingCheck.quantityChecked}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                  <input
                    name="testType"
                    type="text"
                    defaultValue={editingCheck.testType || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Result *</label>
                  <select
                    name="result"
                    defaultValue={editingCheck.result}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performed By *</label>
                  <input
                    name="performedBy"
                    type="text"
                    defaultValue={editingCheck.performedBy}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingCheck.notes || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setEditingCheck(null);
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
                  {loading ? 'Updating...' : 'Update Check'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const ViewCheckForm = () => {
    if (!selectedCheck) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Quality Check Details</h3>
              <button
                onClick={() => {
                  setShowViewForm(false);
                  setSelectedCheck(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check ID</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedCheck.checkId}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Related Operation</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg capitalize">
                    {selectedCheck.relatedOperation}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedCheck.product}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedCheck.batchNumber || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Checked</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedCheck.quantityChecked}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedCheck.testType || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Value</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedCheck.measurementValue || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="flex items-center">
                      {getResultIcon(selectedCheck.result)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(selectedCheck.result)}`}>
                        {selectedCheck.result}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedCheck.performedBy}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {getLocationName(selectedCheck.location || '')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {new Date(selectedCheck.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              {selectedCheck.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {selectedCheck.notes}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  setShowViewForm(false);
                  setSelectedCheck(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                placeholder="Search checks..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={resultFilter}
              onChange={(e) => handleResultFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Results</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={operationFilter}
              onChange={(e) => handleOperationFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Operations</option>
              <option value="incoming">Incoming</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="delivery">Delivery</option>
              <option value="storage">Storage</option>
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
          {canCreate && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Check
            </button>
          )}
        </div>
      </div>

      {/* Quality Checks Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Quality Checks ({totalChecks})</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      <ClipLoader
                        color="#3B82F6"
                        loading={loading}
                        size={30}
                        aria-label="Loading Spinner"
                      />
                    </td>
                  </tr>
                ) : qualityChecks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      <div className="text-gray-500">
                        <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-sm font-medium text-gray-900">No quality checks found</h3>
                        <p className="text-sm text-gray-500 mt-1">Get started by creating your first quality check.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  qualityChecks.map((check) => (
                    <tr key={check._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{check.checkId}</div>
                        {check.batchNumber && (
                          <div className="text-sm text-gray-500">Batch: {check.batchNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {check.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {check.relatedOperation}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {check.testType || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {check.quantityChecked}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getResultIcon(check.result)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(check.result)}`}>
                            {check.result}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {check.performedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getLocationName(check.location || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(check.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openViewCheck(check)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => openEditCheck(check)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => openDeleteConfirm(check)}
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
                <span className="font-medium">{totalPages}</span> (Total: {totalChecks} checks)
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
      {showCreateForm && <CreateCheckForm />}
      {showUpdateForm && <UpdateCheckForm />}
      {showViewForm && <ViewCheckForm />}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Quality Check?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this quality check? This action cannot be undone.
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
                onClick={handleDeleteCheck}
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

export default QualityChecks;