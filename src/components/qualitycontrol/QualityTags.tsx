import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/userPermission';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import {
  fetchQualityTags,
  addQualityTag,
  updateQualityTag,
  deleteQualityTag,
  clearError,
} from '@/redux/slices/qualityTagSlice';
import {
  QualityTag,
  CreateQualityTagData,
  UpdateQualityTagData,
  QualityTagCategory,
  QualityTagColor,
} from '@/types/quality.types';
import {
  Plus,
  Tag,
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
  Hash,
  Palette
} from 'lucide-react';
import { ClipLoader } from 'react-spinners';

interface QualityTagsProps {
  // Remove props since we'll use Redux
}

const QualityTags: React.FC<QualityTagsProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const {
    qualityTags = [],
    loading,
    currentPage,
    totalPages,
    totalTags,
    error,
  } = useSelector((state: RootState) => state.qualityTags);

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
  const [editingTag, setEditingTag] = useState<QualityTag | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<QualityTag | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
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
        fetchQualityTags({
          organisationId,
          page,
          limit: 10,
          category: categoryFilter,
          color: colorFilter,
          search: debouncedSearch,
          location: locationFilter,
        })
      );
    }
  }, [organisationId, page, categoryFilter, colorFilter, debouncedSearch, locationFilter, canView, dispatch]);

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

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleColorFilterChange = (value: string) => {
    setColorFilter(value);
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
  const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    const tagData: CreateQualityTagData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      category: (form.elements.namedItem('category') as HTMLSelectElement).value as QualityTagCategory,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim() || undefined,
      color: (form.elements.namedItem('color') as HTMLSelectElement).value as QualityTagColor,
      location: isLocationRestricted ? userProfile?.location : (form.elements.namedItem('location') as HTMLSelectElement)?.value,
    };

    try {
      await dispatch(addQualityTag(tagData)).unwrap();
      toast.success('Quality tag created successfully');
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error || 'Failed to create quality tag');
    }
  };

  const handleUpdateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTag) return;
    
    const form = e.currentTarget;
    
    const updateData: UpdateQualityTagData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      category: (form.elements.namedItem('category') as HTMLSelectElement).value as QualityTagCategory,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim() || undefined,
      color: (form.elements.namedItem('color') as HTMLSelectElement).value as QualityTagColor,
    };

    try {
      await dispatch(updateQualityTag({ id: editingTag._id, data: updateData })).unwrap();
      toast.success('Quality tag updated successfully');
      setShowUpdateForm(false);
      setEditingTag(null);
    } catch (error: any) {
      toast.error(error || 'Failed to update quality tag');
    }
  };

  const handleDeleteTag = async () => {
    if (!itemToDelete) return;

    try {
      await dispatch(deleteQualityTag(itemToDelete._id)).unwrap();
      toast.success('Quality tag deleted successfully');
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error(error || 'Failed to delete quality tag');
    }
  };

  const openEditTag = (tag: QualityTag) => {
    setEditingTag(tag);
    setShowUpdateForm(true);
  };

  const openDeleteConfirm = (tag: QualityTag) => {
    setItemToDelete(tag);
    setShowDeleteConfirm(true);
  };

  // Helper functions
  const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    const location = locations.find(loc => loc._id === locationId);
    return location ? location.name : locationId;
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      case 'pink':
        return 'bg-pink-100 text-pink-800';
      case 'gray':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getColorDisplayName = (color: string) => {
    switch (color) {
      case 'red':
        return 'Red';
      case 'orange':
        return 'Orange';
      case 'yellow':
        return 'Yellow';
      case 'green':
        return 'Green';
      case 'blue':
        return 'Blue';
      case 'purple':
        return 'Purple';
      case 'pink':
        return 'Pink';
      case 'gray':
        return 'Gray';
      default:
        return 'Gray';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Permission check
  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view quality tags.</p>
      </div>
    );
  }

  const CreateTagForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Quality Tag</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleCreateTag} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Auto-generated"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name *</label>
                <input
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Critical, Cosmetic, Safety"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="defect-type">Defect Type</option>
                  <option value="severity">Severity</option>
                  <option value="process">Process</option>
                  <option value="product">Product</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                <select
                  name="color"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Color</option>
                  <option value="red">Red</option>
                  <option value="orange">Orange</option>
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="gray">Gray</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of when to use this tag..."
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
                {loading ? 'Creating...' : 'Create Tag'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const UpdateTagForm = () => {
    if (!editingTag) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Quality Tag</h3>
              <button
                onClick={() => {
                  setShowUpdateForm(false);
                  setEditingTag(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateTag} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag ID</label>
                  <input
                    type="text"
                    value={editingTag.tagId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name *</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingTag.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    defaultValue={editingTag.category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="defect-type">Defect Type</option>
                    <option value="severity">Severity</option>
                    <option value="process">Process</option>
                    <option value="product">Product</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                  <select
                    name="color"
                    defaultValue={editingTag.color}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Color</option>
                    <option value="red">Red</option>
                    <option value="orange">Orange</option>
                    <option value="yellow">Yellow</option>
                    <option value="green">Green</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="pink">Pink</option>
                    <option value="gray">Gray</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingTag.description || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setEditingTag(null);
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
                  {loading ? 'Updating...' : 'Update Tag'}
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
      {qualityTags.map((tag) => (
        <div key={tag._id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getColorClasses(tag.color || 'gray')}`}>
                  {tag.name}
                </span>
                <p className="text-sm text-gray-500 mt-1">{tag.tagId}</p>
              </div>
              <div className="flex space-x-2">
                {canEdit && (
                  <button
                    onClick={() => openEditTag(tag)}
                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                    title="Edit Tag"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => openDeleteConfirm(tag)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Tag"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Hash className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Category:</span>
                <span className="ml-1">{getCategoryDisplayName(tag.category || '')}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Palette className="h-4 w-4 mr-2 text-purple-500" />
                <span className="font-medium">Color:</span>
                <span className="ml-1">{getColorDisplayName(tag.color || 'gray')}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-red-500" />
                <span className="font-medium">Location:</span>
                <span className="ml-1">{getLocationName(tag.location || '')}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Tag className="h-4 w-4 mr-2 text-green-500" />
                <span className="font-medium">Usage:</span>
                <span className="ml-1">{tag.usageCount || 0} times</span>
              </div>
            </div>

            {/* Description */}
            {tag.description && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">{tag.description}</p>
              </div>
            )}
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
                placeholder="Search tags..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="defect-type">Defect Type</option>
              <option value="severity">Severity</option>
              <option value="process">Process</option>
              <option value="product">Product</option>
              <option value="inspection">Inspection</option>
            </select>
            <select
              value={colorFilter}
              onChange={(e) => handleColorFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Colors</option>
              <option value="red">Red</option>
              <option value="orange">Orange</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="pink">Pink</option>
              <option value="gray">Gray</option>
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
              New Tag
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
            <p className="mt-4 text-gray-600">Loading quality tags...</p>
          </div>
        </div>
      ) : qualityTags.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center text-gray-500">
            <Tag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quality tags found</h3>
            <p className="text-gray-500">Get started by creating your first quality tag.</p>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
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
                    <Tag className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Quality Tags ({totalTags})</h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tag
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Color
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {qualityTags.map((tag) => (
                        <tr key={tag._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getColorClasses(tag.color || 'gray')}`}>
                                {tag.name}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{tag.tagId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getCategoryDisplayName(tag.category || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {getColorDisplayName(tag.color || 'gray')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getLocationName(tag.location || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tag.usageCount || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {tag.description || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {canEdit && (
                                <button
                                  onClick={() => openEditTag(tag)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => openDeleteConfirm(tag)}
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
                      <span className="font-medium">{totalPages}</span> (Total: {totalTags} tags)
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
      {viewMode === 'cards' && qualityTags.length > 0 && (
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
                  <span className="font-medium">{totalPages}</span> (Total: {totalTags} tags)
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
      {showCreateForm && <CreateTagForm />}
      {showUpdateForm && <UpdateTagForm />}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Tag?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this tag? This action cannot be undone.
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
                onClick={handleDeleteTag}
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

export default QualityTags;