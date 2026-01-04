import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Eye, Edit, Trash2, X, MapPin, Clock, Package } from 'lucide-react';
import { usePermission } from '@/hooks/userPermission';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import { fetchRepairTemplates, createRepairTemplate, updateRepairTemplate, deleteRepairTemplate } from '@/redux/slices/repairTemplateSice';
import { RepairTemplate } from '@/types/repair.types';

// TemplateForm component moved outside to prevent re-creation
const TemplateForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  masterDataLocations, 
  isLocationRestricted,
  isView = false 
}: { 
  formData: any; 
  setFormData: React.Dispatch<React.SetStateAction<any>>; 
  onSubmit: (e: React.FormEvent) => void; 
  onCancel: () => void; 
  masterDataLocations: any[]; 
  isLocationRestricted: boolean;
  isView?: boolean;
}) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
      <div className="mt-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isView ? 'View' : formData._id ? 'Update' : 'Create'} Repair Template
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
     
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">Template Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.templateName}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, templateName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter template name"
                  required
                  disabled={isView}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Category *
                </label>
                <input
                  type="text"
                  value={formData.productCategory}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, productCategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product category"
                  required
                  disabled={isView}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Common Issue *
                </label>
                <input
                  type="text"
                  value={formData.commonIssue}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, commonIssue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter common issue"
                  required
                  disabled={isView}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, estimatedDuration: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter duration in minutes"
                  required
                  disabled={isView}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
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
                    disabled={isView}
                  >
                    <option value="">Select Location</option>
                    {masterDataLocations.map((location: any) => (
                      <option key={location._id} value={location._id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, isActive: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isView}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Parts (comma-separated)
              </label>
              <textarea
                rows={3}
                value={formData.defaultParts?.join(', ') || ''}
                onChange={(e) => setFormData((prev: any) => ({ 
                  ...prev, 
                  defaultParts: e.target.value.split(',').map((part: string) => part.trim()).filter(Boolean)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter default parts separated by commas"
                disabled={isView}
              />
            </div>
          </div>
          
          {!isView && (
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
                {formData._id ? 'Update' : 'Create'} Template
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  </div>
);

const RepairTemplates: React.FC = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);
  const { data: repairTemplates, loading } = useSelector((state: any) => state.repairTemplates);

  // Permissions
  const canView = usePermission('repair', 'view');
  const canCreate = usePermission('repair', 'create');
  const canEdit = usePermission('repair', 'edit');
  const canDelete = usePermission('repair', 'delete');

  // Local state
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RepairTemplate | null>(null);
  const [locationFilter, setLocationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form data
  const [templateFormData, setTemplateFormData] = useState({
    templateName: '',
    productCategory: '',
    commonIssue: '',
    estimatedDuration: 60,
    defaultParts: [] as string[],
    location: '',
    isActive: true,
  });

  // Location restrictions
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

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
  }, [dispatch]);

  // Set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Load data when filters change
  useEffect(() => {
    const organisationId = localStorage.getItem('organisationId');
    
    if (organisationId && canView && userProfile) {
      console.log('RepairTemplates: Loading data with location filter:', locationFilter);
      dispatch(fetchRepairTemplates({ 
        location: locationFilter !== 'all' ? locationFilter : undefined 
      }) as any);
    }
  }, [locationFilter, canView, dispatch, userProfile]);

  // Filter templates based on search and filters
  const filteredTemplates = React.useMemo(() => {
    let templates = repairTemplates;
    
    // Apply location restriction for restricted users (client-side filtering)
    if (isLocationRestricted && userProfile?.location) {
      templates = templates.filter((template: RepairTemplate) => {
        return template.location === userProfile.location;
      });
    }
    
    // Apply other filters
    return templates.filter((template: RepairTemplate) => {
      const matchesSearch = template.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.productCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.commonIssue.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || template.productCategory === categoryFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && template.isActive) ||
                           (statusFilter === 'inactive' && !template.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [repairTemplates, searchTerm, categoryFilter, statusFilter, isLocationRestricted, userProfile?.location]);

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(repairTemplates.map((t: RepairTemplate) => t.productCategory))];
    return uniqueCategories.filter(Boolean);
  }, [repairTemplates]);

  // Handle create template
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTemplate = {
      ...templateFormData,
      location: isLocationRestricted ? userProfile?.location : templateFormData.location,
    };
    
    try {
      await dispatch(createRepairTemplate(newTemplate) as any);
      setShowTemplateForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  // Handle update template
  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate) return;
    
    try {
      await dispatch(updateRepairTemplate({ 
        id: selectedTemplate._id, 
        data: templateFormData 
      }) as any);
      setShowTemplateForm(false);
      setSelectedTemplate(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  // Handle delete template
  const handleDeleteTemplate = async (id: string) => {
    try {
      await dispatch(deleteRepairTemplate(id) as any);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setTemplateFormData({
      templateName: '',
      productCategory: '',
      commonIssue: '',
      estimatedDuration: 60,
      defaultParts: [],
      location: '',
      isActive: true,
    });
  };

  // Handle view template
  const handleViewTemplate = (template: RepairTemplate) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      templateName: template.templateName,
      productCategory: template.productCategory,
      commonIssue: template.commonIssue,
      estimatedDuration: template.estimatedDuration,
      defaultParts: template.defaultParts,
      location: template.location,
      isActive: template.isActive,
    });
    setShowViewModal(true);
  };

  // Handle edit template
  const handleEditTemplate = (template: RepairTemplate) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      templateName: template.templateName,
      productCategory: template.productCategory,
      commonIssue: template.commonIssue,
      estimatedDuration: template.estimatedDuration,
      defaultParts: template.defaultParts,
      location: template.location,
      isActive: template.isActive,
    });
    setShowTemplateForm(true);
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setShowTemplateForm(false);
    setShowViewModal(false);
    setSelectedTemplate(null);
    resetForm();
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-600">You do not have permission to view repair templates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Repair Templates</h3>
          {canCreate && (
            <button
              onClick={() => setShowTemplateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((category: string) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No repair templates found</p>
              {canCreate && (
                <button
                  onClick={() => setShowTemplateForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Create your first template
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category & Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration & Parts
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
                  {filteredTemplates.map((template: RepairTemplate) => (
                    <tr key={template._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{template.templateName}</div>
                          <div className="text-sm text-gray-500">Created: {new Date(template.createdAt).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{template.productCategory}</div>
                          <div className="text-sm text-gray-500">{template.commonIssue}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="h-4 w-4 mr-1" />
                          {template.estimatedDuration} min
                        </div>
                        <div className="text-sm text-gray-500">{template.defaultParts.length} parts</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-1" />
                          {getLocationName(template.location)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleViewTemplate(template)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEdit && (
                            <button
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleEditTemplate(template)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              className="text-red-600 hover:text-red-900" 
                              title="Delete"
                              onClick={() => handleDeleteTemplate(template._id)}
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
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showTemplateForm && (
        <TemplateForm
          formData={templateFormData}
          setFormData={setTemplateFormData}
          onSubmit={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}
          onCancel={handleCancelForm}
          masterDataLocations={masterDataLocations}
          isLocationRestricted={isLocationRestricted}
        />
      )}

      {/* View Modal */}
      {showViewModal && (
        <TemplateForm
          formData={templateFormData}
          setFormData={setTemplateFormData}
          onSubmit={() => {}}
          onCancel={handleCancelForm}
          masterDataLocations={masterDataLocations}
          isLocationRestricted={isLocationRestricted}
          isView={true}
        />
      )}
    </div>
  );
};

export default RepairTemplates;