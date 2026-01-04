import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BarChart3, FileText, Users, Clipboard, TrendingUp, Settings, ShieldAlert } from 'lucide-react';
import { usePermission } from '@/hooks/userPermission';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import { fetchProducts } from '@/redux/slices/productSlice';

// Import repair components
import Dashboard from '@/components/repair/Dashboard';
import RepairOrders from '@/components/repair/RepairOrders';
import RepairTeams from '@/components/repair/RepairTeams';
import RepairTemplates from '@/components/repair/RepairTemplates';
import Reports from '@/components/repair/Reports';
import RepairSettings from '@/components/repair/Settings';

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

const Repair: React.FC = () => {
  const dispatch = useDispatch();
  
  // Local state for data (keeping existing structure for templates until migrated)
  const [repairTemplates, setRepairTemplates] = useState<any[]>([]);

  const canView = usePermission('repair', 'view');

  // Load master data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location") as any);
    dispatch(fetchProducts({ page: 1, limit: 1000 }) as any);
  }, [dispatch]);

  // Form states (updated for location dropdown)
  const [activeTab, setActiveTab] = useState('dashboard');
  // Template states
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showTemplateViewModal, setShowTemplateViewModal] = useState(false);
  const [showTemplateUpdateModal, setShowTemplateUpdateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const addRepairTemplate = (newTemplate: any) => {
    setRepairTemplates(prev => {
      const updated = [...prev, newTemplate];
      return updated;
    });
  };

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
      id: selectedTemplate.id,
      templateName: formData.get('templateName')?.toString() || '',
      productCategory: formData.get('productCategory')?.toString() || '',
      commonIssue: formData.get('commonIssue')?.toString() || '',
      estimatedDuration: parseInt(formData.get('estimatedDuration')?.toString() || '0', 10),
      defaultParts: (formData.get('defaultParts')?.toString() || '').split(',').map(p => p.trim()).filter(Boolean),
      isActive: (formData.get('isActive') as string) === 'on',
    };
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
    // { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <RepairOrders />;
      case 'teams':
        return <RepairTeams />;
      case 'templates':
        return (
          <RepairTemplates
            repairTemplates={repairTemplates}
            setShowTemplateForm={setShowTemplateForm}
            openTemplateViewModal={openTemplateViewModal}
            openTemplateUpdateModal={openTemplateUpdateModal}
            showTemplateForm={showTemplateForm}
            showTemplateViewModal={showTemplateViewModal}
            showTemplateUpdateModal={showTemplateUpdateModal}
            selectedTemplate={selectedTemplate}
            handleCreateTemplate={handleCreateTemplate}
            handleUpdateTemplate={handleUpdateTemplate}
            closeTemplateModal={closeTemplateModal}
            setShowTemplateViewModal={setShowTemplateViewModal}
            setShowTemplateUpdateModal={setShowTemplateUpdateModal}
            TemplateModal={TemplateModal}
            TemplateForm={TemplateForm}
          />
        );
      case 'reports':
        return <Reports />;
      // case 'settings':
      //   return <RepairSettings />;
      default:
        return <Dashboard />;
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
    </div>
  );
};

export default Repair;