import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import Layout from '../../components/Layout';
import {
  Shield,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  Settings,
  BarChart3,
  FileText,
  Target,
  Camera,
  Upload,
  Tag,
  Calendar,
  User,
  Package,
  Factory,
  Truck,
  Warehouse,
  TrendingUp,
  TrendingDown,
  Activity,
  Bell,
  CheckSquare,
  X
} from 'lucide-react';
import { storage, STORAGE_KEYS } from '@/lib/storage'; // Adjust path as needed

const Quality: React.FC = () => {
  const { inventory } = useData(); // Keep inventory from context, assume it's managed elsewhere

  // Local state for quality data
  const [qualityChecks, setQualityChecks] = useState<any[]>([]);
  const [qualityControlPoints, setQualityControlPoints] = useState<any[]>([]);
  const [qualityAlerts, setQualityAlerts] = useState<any[]>([]);
  const [qualityTeams, setQualityTeams] = useState<any[]>([]);
  const [qualityTags, setQualityTags] = useState<any[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    setQualityChecks(storage.get(STORAGE_KEYS.QUALITY_CHECKS, []));
    setQualityControlPoints(storage.get(STORAGE_KEYS.QUALITY_CONTROL_POINTS, []));
    setQualityAlerts(storage.get(STORAGE_KEYS.QUALITY_ALERTS, []));
    setQualityTeams(storage.get(STORAGE_KEYS.QUALITY_TEAMS, []));
    setQualityTags(storage.get(STORAGE_KEYS.QUALITY_TAGS, []));
  }, []);

  // CRUD functions for Quality Checks
  const addQualityCheck = (newCheck: any) => {
    const updated = [...qualityChecks, newCheck];
    storage.set(STORAGE_KEYS.QUALITY_CHECKS, updated);
    setQualityChecks(updated);
  };

  const updateQualityCheck = (updatedCheck: any) => {
    const updated = qualityChecks.map((c) => (c.id === updatedCheck.id ? updatedCheck : c));
    storage.set(STORAGE_KEYS.QUALITY_CHECKS, updated);
    setQualityChecks(updated);
  };

  const deleteQualityCheck = (id: string) => {
    const updated = qualityChecks.filter((c) => c.id !== id);
    storage.set(STORAGE_KEYS.QUALITY_CHECKS, updated);
    setQualityChecks(updated);
  };

  // CRUD functions for Quality Control Points
  const addQualityControlPoint = (newCP: any) => {
    const updated = [...qualityControlPoints, newCP];
    storage.set(STORAGE_KEYS.QUALITY_CONTROL_POINTS, updated);
    setQualityControlPoints(updated);
  };

  const updateQualityControlPoint = (updatedCP: any) => {
    const updated = qualityControlPoints.map((cp) => (cp.id === updatedCP.id ? updatedCP : cp));
    storage.set(STORAGE_KEYS.QUALITY_CONTROL_POINTS, updated);
    setQualityControlPoints(updated);
  };

  const deleteQualityControlPoint = (id: string) => {
    const updated = qualityControlPoints.filter((cp) => cp.id !== id);
    storage.set(STORAGE_KEYS.QUALITY_CONTROL_POINTS, updated);
    setQualityControlPoints(updated);
  };

  // CRUD functions for Quality Alerts
  const addQualityAlert = (newAlert: any) => {
    const updated = [...qualityAlerts, newAlert];
    storage.set(STORAGE_KEYS.QUALITY_ALERTS, updated);
    setQualityAlerts(updated);
  };

  const updateQualityAlert = (updatedAlert: any) => {
    const updated = qualityAlerts.map((a) => (a.id === updatedAlert.id ? updatedAlert : a));
    storage.set(STORAGE_KEYS.QUALITY_ALERTS, updated);
    setQualityAlerts(updated);
  };

  const deleteQualityAlert = (id: string) => {
    const updated = qualityAlerts.filter((a) => a.id !== id);
    storage.set(STORAGE_KEYS.QUALITY_ALERTS, updated);
    setQualityAlerts(updated);
  };

  // CRUD functions for Quality Teams
  const addQualityTeam = (newTeam: any) => {
    const updated = [...qualityTeams, newTeam];
    storage.set(STORAGE_KEYS.QUALITY_TEAMS, updated);
    setQualityTeams(updated);
  };

  const updateQualityTeam = (updatedTeam: any) => {
    const updated = qualityTeams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t));
    storage.set(STORAGE_KEYS.QUALITY_TEAMS, updated);
    setQualityTeams(updated);
  };

  const deleteQualityTeam = (id: string) => {
    const updated = qualityTeams.filter((t) => t.id !== id);
    storage.set(STORAGE_KEYS.QUALITY_TEAMS, updated);
    setQualityTeams(updated);
  };

  // CRUD functions for Quality Tags
  const addQualityTag = (newTag: any) => {
    const updated = [...qualityTags, newTag];
    storage.set(STORAGE_KEYS.QUALITY_TAGS, updated);
    setQualityTags(updated);
  };

  const updateQualityTag = (updatedTag: any) => {
    const updated = qualityTags.map((t) => (t.id === updatedTag.id ? updatedTag : t));
    storage.set(STORAGE_KEYS.QUALITY_TAGS, updated);
    setQualityTags(updated);
  };

  const deleteQualityTag = (id: string) => {
    const updated = qualityTags.filter((t) => t.id !== id);
    storage.set(STORAGE_KEYS.QUALITY_TAGS, updated);
    setQualityTags(updated);
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [resultFilter, setResultFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [operationFilter, setOperationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateCheckForm, setShowCreateCheckForm] = useState(false);
  const [showCreateControlPointForm, setShowCreateControlPointForm] = useState(false);
  const [showCreateAlertForm, setShowCreateAlertForm] = useState(false);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [showCreateTagForm, setShowCreateTagForm] = useState(false);
  const [showViewCheckForm, setShowViewCheckForm] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showViewAlertForm, setShowViewAlertForm] = useState(false);
  const [showUpdateAlertForm, setShowUpdateAlertForm] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [showUpdateTagForm, setShowUpdateTagForm] = useState(false);
  const [editingCheck, setEditingCheck] = useState<any>(null);
  const [showUpdateCheckForm, setShowUpdateCheckForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [showViewControlPointForm, setShowViewControlPointForm] = useState(false);
  const [showUpdateControlPointForm, setShowUpdateControlPointForm] = useState(false);
  const [selectedControlPoint, setSelectedControlPoint] = useState<any>(null);

  const openEditTag = (tag: any) => {
    setEditingTag(tag);
    setShowUpdateTagForm(true);
  };

  const handleCreateTag = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newTag = {
      id: Date.now().toString(),
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      category: (form.elements.namedItem('category') as HTMLInputElement).value.trim(),
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim(),
      color: (form.elements.namedItem('color') as HTMLSelectElement).value,
    };
    addQualityTag(newTag);
    setShowCreateTagForm(false);
  };

  const handleUpdateTag = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const updated = {
      ...editingTag,
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      category: (form.elements.namedItem('category') as HTMLInputElement).value.trim(),
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim(),
      color: (form.elements.namedItem('color') as HTMLSelectElement).value,
    };
    updateQualityTag(updated);
    setShowUpdateTagForm(false);
    setEditingTag(null);
  };

  const openViewAlert = (alert: any) => {
    setSelectedAlert(alert);
    setShowViewAlertForm(true);
  };

  const openEditAlert = (alert: any) => {
    setSelectedAlert(alert);
    setShowUpdateAlertForm(true);
  };

  const handleUpdateAlert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const tags = Array.from(form.querySelectorAll('input[name="tags"]:checked')).map((el: any) => el.value);
    const updated = {
      ...selectedAlert,
      product: (form.elements.namedItem('product') as HTMLSelectElement).value,
      operation: (form.elements.namedItem('operation') as HTMLSelectElement).value,
      priority: (form.elements.namedItem('priority') as HTMLSelectElement).value,
      status: (form.elements.namedItem('status') as HTMLSelectElement).value,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
      assignedTo: (form.elements.namedItem('assignedTo') as HTMLSelectElement).value,
      tags,
    };
    updateQualityAlert(updated);
    setShowUpdateAlertForm(false);
    setSelectedAlert(null);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'checks', name: 'Quality Checks', icon: CheckSquare },
    { id: 'control-points', name: 'Control Points', icon: Target },
    { id: 'alerts', name: 'Quality Alerts', icon: Bell },
    { id: 'teams', name: 'Quality Teams', icon: Users },
    { id: 'tags', name: 'Quality Tags', icon: Tag },
    { id: 'reports', name: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const filteredChecks = qualityChecks.filter((check) => {
    const matchesSearch = check.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.checkId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResult = resultFilter === 'all' || check.result === resultFilter;
    const matchesOperation = operationFilter === 'all' || check.relatedOperation === operationFilter;
    return matchesSearch && matchesResult && matchesOperation;
  });

  const filteredAlerts = qualityAlerts.filter((alert) => {
    const matchesSearch = alert.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alertNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
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
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openViewControlPoint = (cp: any) => {
    setSelectedControlPoint(cp);
    setShowViewControlPointForm(true);
  };

  const openEditControlPoint = (cp: any) => {
    setSelectedControlPoint(cp);
    setShowUpdateControlPointForm(true);
  };

  const handleUpdateControlPoint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const updated = {
      ...selectedControlPoint,
      controlPointName: (form.elements.namedItem('controlPointName') as HTMLInputElement).value,
      operationType: (form.elements.namedItem('operationType') as HTMLSelectElement).value,
      product: (form.elements.namedItem('product') as HTMLSelectElement).value,
      qualityTeamId: (form.elements.namedItem('qualityTeam') as HTMLSelectElement).value,
      controlType: (form.elements.namedItem('controlType') as HTMLSelectElement).value,
      frequency: Number((form.elements.namedItem('frequency') as HTMLInputElement).value) || null,
      instruction: (form.elements.namedItem('instruction') as HTMLTextAreaElement).value,
      responsible: (form.elements.namedItem('responsible') as HTMLSelectElement).value,
      typeOfCheck: (form.elements.namedItem('typeOfCheck') as HTMLSelectElement).value,
      toleranceMin: Number((form.elements.namedItem('toleranceMin') as HTMLInputElement).value) || null,
      toleranceMax: Number((form.elements.namedItem('toleranceMax') as HTMLInputElement).value) || null,
      active: (form.elements.namedItem('active') as HTMLInputElement).checked,
    };
    updateQualityControlPoint(updated);
    setShowUpdateControlPointForm(false);
    setSelectedControlPoint(null);
  };

  // CRUD Handlers
  const handleCreateCheck = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newCheck = {
      id: Date.now().toString(),
      checkId: `QC-${Date.now().toString().slice(-6)}`,
      product: (form.elements.namedItem('product') as HTMLSelectElement).value,
      batchNumber: (form.elements.namedItem('batchNumber') as HTMLInputElement).value,
      relatedOperation: (form.elements.namedItem('operation') as HTMLSelectElement).value,
      testType: (form.elements.namedItem('testType') as HTMLInputElement).value,
      quantityChecked: Number((form.elements.namedItem('quantity') as HTMLInputElement).value),
      measurementValue: Number((form.elements.namedItem('measurementValue') as HTMLInputElement).value) || null,
      result: (form.elements.namedItem('result') as HTMLSelectElement).value,
      performedBy: (form.elements.namedItem('performedBy') as HTMLSelectElement).value,
      date: new Date().toISOString().split('T')[0],
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value,
      photo: '', // Omit photo handling for brevity
    };
    addQualityCheck(newCheck);
    setShowCreateCheckForm(false);
  };

  const openEditModal = (check: any) => {
    setEditingCheck(check);
    setShowUpdateCheckForm(true);
  };

  const handleUpdateCheck = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const updated = {
      ...editingCheck,
      product: (form.elements.namedItem('product') as HTMLSelectElement).value,
      batchNumber: (form.elements.namedItem('batchNumber') as HTMLInputElement).value,
      relatedOperation: (form.elements.namedItem('operation') as HTMLSelectElement).value,
      testType: (form.elements.namedItem('testType') as HTMLInputElement).value,
      quantityChecked: Number((form.elements.namedItem('quantity') as HTMLInputElement).value),
      result: (form.elements.namedItem('result') as HTMLSelectElement).value,
      performedBy: (form.elements.namedItem('performedBy') as HTMLSelectElement).value,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value,
    };
    updateQualityCheck(updated);
    setShowUpdateCheckForm(false);
    setEditingCheck(null);
  };

  const openDeleteConfirmCheck = (check: any) => {
    setItemToDelete(check);
    setShowDeleteConfirm(true);
  };

  const openDeleteConfirmCP = (cp: any) => {
    setItemToDelete(cp);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.checkId) {
        deleteQualityCheck(itemToDelete.id);
      } else if (itemToDelete.controlPointName) {
        deleteQualityControlPoint(itemToDelete.id);
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  // Handler for create alert
  const handleCreateAlert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const tags = Array.from(form.querySelectorAll('input[name="tags"]:checked')).map((el: any) => el.value);
    const newAlert = {
      id: Date.now().toString(),
      alertNumber: `QA-${Date.now().toString().slice(-6)}`,
      product: (form.elements.namedItem('product') as HTMLSelectElement).value,
      operation: (form.elements.namedItem('operation') as HTMLSelectElement).value,
      priority: (form.elements.namedItem('priority') as HTMLSelectElement).value,
      status: 'new',
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
      rootCause: (form.elements.namedItem('rootCause') as HTMLSelectElement).value || '',
      responsibleTeam: (form.elements.namedItem('responsibleTeam') as HTMLSelectElement).value,
      assignedTo: (form.elements.namedItem('assignedTo') as HTMLSelectElement).value,
      nextActionDate: (form.elements.namedItem('nextActionDate') as HTMLInputElement).value || '',
      tags,
      attachments: [], // Omit file handling
      date: new Date().toISOString().split('T')[0],
    };
    addQualityAlert(newAlert);
    setShowCreateAlertForm(false);
  };

  // Handler for create control point
  const handleCreateControlPoint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newCP = {
      id: Date.now().toString(),
      controlPointName: (form.elements.namedItem('controlPointName') as HTMLInputElement).value,
      operationType: (form.elements.namedItem('operationType') as HTMLSelectElement).value,
      product: (form.elements.namedItem('product') as HTMLSelectElement).value,
      qualityTeamId: (form.elements.namedItem('qualityTeam') as HTMLSelectElement).value,
      controlType: (form.elements.namedItem('controlType') as HTMLSelectElement).value,
      frequency: Number((form.elements.namedItem('frequency') as HTMLInputElement).value) || null,
      instruction: (form.elements.namedItem('instruction') as HTMLTextAreaElement).value,
      responsible: (form.elements.namedItem('responsible') as HTMLSelectElement).value,
      typeOfCheck: (form.elements.namedItem('typeOfCheck') as HTMLSelectElement).value,
      toleranceMin: Number((form.elements.namedItem('toleranceMin') as HTMLInputElement).value) || null,
      toleranceMax: Number((form.elements.namedItem('toleranceMax') as HTMLInputElement).value) || null,
      active: (form.elements.namedItem('active') as HTMLInputElement).checked,
    };
    addQualityControlPoint(newCP);
    setShowCreateControlPointForm(false);
  };

  // Handler for create team
  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const relatedProducts = Array.from(form.querySelectorAll('input[name="relatedProducts"]:checked')).map((el: any) => el.value);
    const newTeam = {
      id: Date.now().toString(),
      teamName: (form.elements.namedItem('teamName') as HTMLInputElement).value,
      teamLeader: (form.elements.namedItem('teamLeader') as HTMLInputElement).value,
      department: (form.elements.namedItem('department') as HTMLSelectElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value || '',
      relatedProducts,
      assignedUsers: [], // Members can be added later
      isActive: (form.elements.namedItem('isActive') as HTMLInputElement).checked,
    };
    addQualityTeam(newTeam);
    setShowCreateTeamForm(false);
  };

  const CreateTagForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Tag</h3>
            <button
              onClick={() => setShowCreateTagForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleCreateTag} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Name *
              </label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Critical, Cosmetic, Safety"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                name="category"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Defect Type, Severity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of when to use this tag..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <select
                name="color"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="bg-red-100 text-red-800">Red</option>
                <option value="bg-orange-100 text-orange-800">Orange</option>
                <option value="bg-yellow-100 text-yellow-800">Yellow</option>
                <option value="bg-green-100 text-green-800">Green</option>
                <option value="bg-blue-100 text-blue-800">Blue</option>
                <option value="bg-purple-100 text-purple-800">Purple</option>
                <option value="bg-pink-100 text-pink-800">Pink</option>
                <option value="bg-gray-100 text-gray-800">Gray</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateTagForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Tag
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const UpdateTagModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Update Tag</h3>
            <button
              onClick={() => {
                setShowUpdateTagForm(false);
                setEditingTag(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleUpdateTag} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Name *
              </label>
              <input
                name="name"
                type="text"
                defaultValue={editingTag?.name}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                name="category"
                type="text"
                defaultValue={editingTag?.category}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                defaultValue={editingTag?.description}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <select
                name="color"
                defaultValue={editingTag?.color}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="bg-red-100 text-red-800">Red</option>
                <option value="bg-orange-100 text-orange-800">Orange</option>
                <option value="bg-yellow-100 text-yellow-800">Yellow</option>
                <option value="bg-green-100 text-green-800">Green</option>
                <option value="bg-blue-100 text-blue-800">Blue</option>
                <option value="bg-purple-100 text-purple-800">Purple</option>
                <option value="bg-pink-100 text-pink-800">Pink</option>
                <option value="bg-gray-100 text-gray-800">Gray</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateTagForm(false);
                  setEditingTag(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const ViewAlertModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Alert Details – {selectedAlert?.alertNumber}
            </h3>
            <button
              onClick={() => {
                setShowViewAlertForm(false);
                setSelectedAlert(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {selectedAlert && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Alert Number</label>
                  <p className="mt-1 text-gray-900">{selectedAlert.alertNumber}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Product</label>
                  <p className="mt-1 text-gray-900">{selectedAlert.product}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Operation</label>
                  <p className="mt-1 text-gray-900 capitalize">{selectedAlert.operation}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedAlert.priority)}`}>
                    {selectedAlert.priority}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAlert.status)}`}>
                    {selectedAlert.status.replace('-', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Assigned To</label>
                  <p className="mt-1 text-gray-900">{selectedAlert.assignedTo}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedAlert.description}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Tags</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedAlert.tags.map((tag: string) => {
                    const tagInfo = qualityTags.find((t) => t.name === tag);
                    return (
                      <span
                        key={tag}
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${tagInfo?.color || 'bg-gray-100 text-gray-800'}`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              onClick={() => {
                setShowViewAlertForm(false);
                setSelectedAlert(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowViewAlertForm(false);
                openEditAlert(selectedAlert);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const UpdateAlertModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Update Alert – {selectedAlert?.alertNumber}
            </h3>
            <button
              onClick={() => {
                setShowUpdateAlertForm(false);
                setSelectedAlert(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleUpdateAlert} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <select
                  name="product"
                  defaultValue={selectedAlert?.product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation *</label>
                <select
                  name="operation"
                  defaultValue={selectedAlert?.operation}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Operation</option>
                  <option value="reception">Reception</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="delivery">Delivery</option>
                  <option value="storage">Storage</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select
                  name="priority"
                  defaultValue={selectedAlert?.priority}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  name="status"
                  defaultValue={selectedAlert?.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={selectedAlert?.description}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To *</label>
              <select
                name="assignedTo"
                defaultValue={selectedAlert?.assignedTo}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Assignee</option>
                {qualityTeams.flatMap((t) => t.assignedUsers).map((u: any) => (
                  <option key={u.userId} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {qualityTags.map((tag) => (
                  <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag.name}
                      defaultChecked={selectedAlert?.tags.includes(tag.name)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className={`px-2 py-1 text-xs rounded-full ${tag.color}`}>
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateAlertForm(false);
                  setSelectedAlert(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const UpdateControlPointModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Update Control Point</h3>
            <button
              onClick={() => {
                setShowUpdateControlPointForm(false);
                setSelectedControlPoint(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleUpdateControlPoint} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Control Point Name *</label>
                <input
                  name="controlPointName"
                  type="text"
                  defaultValue={selectedControlPoint?.controlPointName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type *</label>
                <select
                  name="operationType"
                  defaultValue={selectedControlPoint?.operationType}
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
                  defaultValue={selectedControlPoint?.product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  <option value="All Products">All Products</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Team *</label>
                <select
                  name="qualityTeam"
                  defaultValue={selectedControlPoint?.qualityTeamId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Team</option>
                  {qualityTeams.map((team) => (
                    <option key={team.id} value={team.id}>{team.teamName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Control Type *</label>
                <select
                  name="controlType"
                  defaultValue={selectedControlPoint?.controlType}
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
                  defaultValue={selectedControlPoint?.frequency ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instruction *</label>
              <textarea
                name="instruction"
                rows={3}
                defaultValue={selectedControlPoint?.instruction}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsible *</label>
                <select
                  name="responsible"
                  defaultValue={selectedControlPoint?.responsible}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Responsible</option>
                  {qualityTeams.flatMap((t) => t.assignedUsers).map((u: any) => (
                    <option key={u.userId} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check Type *</label>
                <select
                  name="typeOfCheck"
                  defaultValue={selectedControlPoint?.typeOfCheck}
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
                  defaultValue={selectedControlPoint?.toleranceMin ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tolerance Max</label>
                <input
                  name="toleranceMax"
                  type="number"
                  step="0.01"
                  defaultValue={selectedControlPoint?.toleranceMax ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                name="active"
                type="checkbox"
                defaultChecked={selectedControlPoint?.active}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">Active</label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateControlPointForm(false);
                  setSelectedControlPoint(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const UpdateQualityCheckForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Update Quality Check</h3>
            <button
              onClick={() => {
                setShowUpdateCheckForm(false);
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
                  value={editingCheck?.checkId ?? ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related Operation *</label>
                <select
                  name="operation"
                  defaultValue={editingCheck?.relatedOperation}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
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
                <select
                  name="product"
                  defaultValue={editingCheck?.product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                <input
                  name="batchNumber"
                  type="text"
                  defaultValue={editingCheck?.batchNumber ?? ''}
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
                  defaultValue={editingCheck?.quantityChecked ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                <input
                  name="testType"
                  type="text"
                  defaultValue={editingCheck?.testType ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Result *</label>
                <select
                  name="result"
                  defaultValue={editingCheck?.result}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Performed By *</label>
                <select
                  name="performedBy"
                  defaultValue={editingCheck?.performedBy}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Inspector</option>
                  {qualityTeams.flatMap((t) => t.assignedUsers).map((u: any) => (
                    <option key={u.userId} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={editingCheck?.notes ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateCheckForm(false);
                  setEditingCheck(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Record?</h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete this record?
          This action cannot be undone.
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
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const CreateQualityCheckForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Quality Check</h3>
            <button
              onClick={() => setShowCreateCheckForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleCreateCheck} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check ID *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Auto-generated"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related Operation *
                </label>
                <select name="operation" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product *
                </label>
                <select name="product" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Product</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Number
                </label>
                <input
                  name="batchNumber"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter batch number"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Checked *
                </label>
                <input
                  name="quantity"
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Check *
                </label>
                <select name="typeOfCheck" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Type</option>
                  <option value="text">Text</option>
                  <option value="measurement">Measurement</option>
                  <option value="pass-fail">Pass-Fail</option>
                  <option value="picture">Picture</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Type
                </label>
                <input
                  name="testType"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Pressure Test, Visual Inspection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Measurement Value
                </label>
                <input
                  name="measurementValue"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter measured value"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Result *
                </label>
                <select name="result" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Result</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performed By *
                </label>
                <select name="performedBy" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Inspector</option>
                  {qualityTeams.flatMap((team) => team.assignedUsers).map((user: any) => (
                    <option key={user.userId} value={user.name}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about the quality check..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo Upload
              </label>
              <input
                name="photo"
                type="file"
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateCheckForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Check
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const CreateControlPointForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Control Point</h3>
            <button
              onClick={() => setShowCreateControlPointForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleCreateControlPoint} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Control Point Name *
                </label>
                <input
                  name="controlPointName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter control point name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operation Type *
                </label>
                <select name="operationType" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Operation</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="reception">Reception</option>
                  <option value="delivery">Delivery</option>
                  <option value="storage">Storage</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product *
                </label>
                <select name="product" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Product</option>
                  <option value="All Products">All Products</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Team *
                </label>
                <select name="qualityTeam" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Team</option>
                  {qualityTeams.map((team) => (
                    <option key={team.id} value={team.id}>{team.teamName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Control Type *
                </label>
                <select name="controlType" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Type</option>
                  <option value="all-operations">All Operations</option>
                  <option value="random">Random</option>
                  <option value="periodic">Periodic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency (1 in X operations)
                </label>
                <input
                  name="frequency"
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 5 for 1 in 5 operations"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instruction *
              </label>
              <textarea
                name="instruction"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed instructions for the quality check..."
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsible *
                </label>
                <select name="responsible" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Responsible</option>
                  {qualityTeams.flatMap((team) => team.assignedUsers).map((user: any) => (
                    <option key={user.userId} value={user.name}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Check *
                </label>
                <select name="typeOfCheck" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Type</option>
                  <option value="text">Text</option>
                  <option value="measurement">Measurement</option>
                  <option value="pass-fail">Pass-Fail</option>
                  <option value="picture">Picture</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolerance Min
                </label>
                <input
                  name="toleranceMin"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum acceptable value"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolerance Max
                </label>
                <input
                  name="toleranceMax"
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Maximum acceptable value"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                name="active"
                type="checkbox"
                id="active"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                defaultChecked
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateControlPointForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Control Point
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const CreateAlertForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Quality Alert</h3>
            <button
              onClick={() => setShowCreateAlertForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Number *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Auto-generated"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product *
                </label>
                <select name="product" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Product</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operation *
                </label>
                <select name="operation" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Operation</option>
                  <option value="reception">Reception</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="delivery">Delivery</option>
                  <option value="storage">Storage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select name="priority" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the quality issue..."
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Root Cause
                </label>
                <select name="rootCause" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Root Cause</option>
                  <option value="Supplier Issue">Supplier Issue</option>
                  <option value="Manufacturing Process">Manufacturing Process</option>
                  <option value="Equipment Failure">Equipment Failure</option>
                  <option value="Material Defect">Material Defect</option>
                  <option value="Human Error">Human Error</option>
                  <option value="Design Issue">Design Issue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsible Team *
                </label>
                <select name="responsibleTeam" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Team</option>
                  {qualityTeams.map((team) => (
                    <option key={team.id} value={team.id}>{team.teamName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To *
                </label>
                <select name="assignedTo" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Assignee</option>
                  {qualityTeams.flatMap((team) => team.assignedUsers).map((user: any) => (
                    <option key={user.userId} value={user.name}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Action Date
                </label>
                <input
                  name="nextActionDate"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {qualityTags.map((tag) => (
                  <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag.name}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className={`px-2 py-1 text-xs rounded-full ${tag.color}`}>
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <input
                name="attachments"
                type="file"
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateAlertForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Create Alert
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const CreateTeamForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Quality Team</h3>
            <button
              onClick={() => setShowCreateTeamForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
                </label>
                <input
                  name="teamName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Leader *
                </label>
                <input
                  name="teamLeader"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter team leader name"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select name="department" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Department</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Receiving">Receiving</option>
                  <option value="Shipping">Shipping</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Warehouse">Warehouse</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="team@company.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1-555-0123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Products
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {inventory.map((item) => (
                  <label key={item.id} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      name="relatedProducts"
                      value={item.name}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <input
                name="isActive"
                type="checkbox"
                id="isActive"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                defaultChecked
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active Team
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateTeamForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Team
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // ... (renderOverview, renderQualityChecks, etc. remain the same, but update delete buttons)

  const renderQualityChecks = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search checks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Operations</option>
            <option value="incoming">Incoming</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="delivery">Delivery</option>
            <option value="storage">Storage</option>
          </select>
          <button
            onClick={() => setShowCreateCheckForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Check
          </button>
        </div>
      </div>
      {/* Quality Checks Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredChecks.map((check) => (
              <tr key={check.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {check.checkId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{check.product}</div>
                      <div className="text-sm text-gray-500">Batch: {check.batchNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {check.relatedOperation === 'manufacturing' && <Factory className="h-4 w-4 text-blue-500 mr-2" />}
                    {check.relatedOperation === 'incoming' && <Truck className="h-4 w-4 text-green-500 mr-2" />}
                    {check.relatedOperation === 'delivery' && <Truck className="h-4 w-4 text-purple-500 mr-2" />}
                    {check.relatedOperation === 'storage' && <Warehouse className="h-4 w-4 text-orange-500 mr-2" />}
                    <span className="text-sm text-gray-900 capitalize">{check.relatedOperation}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {check.testType}
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{check.performedBy}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {check.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCheck(check);
                        setShowViewCheckForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(check)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirmCheck(check)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {check.result === 'fail' && (
                      <button className="text-red-600 hover:text-red-900" title="Create Alert">
                        <Bell className="h-4 w-4" />
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
  );

  const ViewControlPointModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Control Point Details</h3>
            <button
              onClick={() => {
                setShowViewControlPointForm(false);
                setSelectedControlPoint(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {selectedControlPoint && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Control Point</label>
                  <p className="mt-1 text-gray-900">{selectedControlPoint.controlPointName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Operation</label>
                  <p className="mt-1 text-gray-900 capitalize">{selectedControlPoint.operationType}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Product</label>
                  <p className="mt-1 text-gray-900">{selectedControlPoint.product}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Quality Team</label>
                  <p className="mt-1 text-gray-900">
                    {qualityTeams.find((t) => t.id === selectedControlPoint.qualityTeamId)?.teamName ?? '—'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Control Type</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedControlPoint.controlType === 'all-operations'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedControlPoint.controlType === 'random'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedControlPoint.controlType.replace('-', ' ')}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Frequency</label>
                  <p className="mt-1 text-gray-900">
                    {selectedControlPoint.frequency ? `1 in ${selectedControlPoint.frequency}` : '—'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Responsible</label>
                  <p className="mt-1 text-gray-900">{selectedControlPoint.responsible}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Check Type</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedControlPoint.typeOfCheck === 'measurement'
                        ? 'bg-green-100 text-green-800'
                        : selectedControlPoint.typeOfCheck === 'picture'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedControlPoint.typeOfCheck === 'pass-fail'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedControlPoint.typeOfCheck.replace('-', ' ')}
                    </span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Tolerance Min</label>
                  <p className="mt-1 text-gray-900">{selectedControlPoint.toleranceMin ?? '—'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Tolerance Max</label>
                  <p className="mt-1 text-gray-900">{selectedControlPoint.toleranceMax ?? '—'}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Instruction</label>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                  {selectedControlPoint.instruction}
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedControlPoint.active}
                  disabled
                  className="rounded border-gray-300 text-blue-600"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              onClick={() => {
                setShowViewControlPointForm(false);
                setSelectedControlPoint(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowViewControlPointForm(false);
                openEditControlPoint(selectedControlPoint);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ViewQualityCheckModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Quality Check Details</h3>
            <button
              onClick={() => {
                setShowViewCheckForm(false);
                setSelectedCheck(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {selectedCheck && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Check ID</label>
                  <p className="mt-1 text-gray-900">{selectedCheck.checkId}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Related Operation</label>
                  <p className="mt-1 text-gray-900 capitalize">{selectedCheck.relatedOperation}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Product</label>
                  <p className="mt-1 text-gray-900">{selectedCheck.product}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Batch Number</label>
                  <p className="mt-1 text-gray-900">{selectedCheck.batchNumber || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Quantity Checked</label>
                  <p className="mt-1 text-gray-900">{selectedCheck.quantityChecked}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Test Type</label>
                  <p className="mt-1 text-gray-900">{selectedCheck.testType || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Result</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(selectedCheck.result)}`}>
                      {selectedCheck.result}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Performed By</label>
                  <p className="mt-1 text-gray-900">{selectedCheck.performedBy}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Date</label>
                <p className="mt-1 text-gray-900">{selectedCheck.date}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Notes</label>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                  {selectedCheck.notes || 'No notes'}
                </p>
              </div>
              {selectedCheck.photo && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">Photo</label>
                  <img
                    src={selectedCheck.photo}
                    alt="Quality check"
                    className="mt-1 max-w-xs rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              onClick={() => {
                setShowViewCheckForm(false);
                setSelectedCheck(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowViewCheckForm(false);
                openEditModal(selectedCheck);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderControlPoints = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Quality Control Points</h3>
          <button
            onClick={() => setShowCreateControlPointForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Control Point
          </button>
        </div>
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
                Control Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responsible
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check Type
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
            {qualityControlPoints.map((controlPoint) => (
              <tr key={controlPoint.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{controlPoint.controlPointName}</div>
                  <div className="text-sm text-gray-500">{controlPoint.instruction.substring(0, 50)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {controlPoint.operationType === 'manufacturing' && <Factory className="h-4 w-4 text-blue-500 mr-2" />}
                    {controlPoint.operationType === 'reception' && <Truck className="h-4 w-4 text-green-500 mr-2" />}
                    {controlPoint.operationType === 'delivery' && <Truck className="h-4 w-4 text-purple-500 mr-2" />}
                    {controlPoint.operationType === 'storage' && <Warehouse className="h-4 w-4 text-orange-500 mr-2" />}
                    <span className="text-sm text-gray-900 capitalize">{controlPoint.operationType}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {controlPoint.product}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    controlPoint.controlType === 'all-operations'
                      ? 'bg-blue-100 text-blue-800'
                      : controlPoint.controlType === 'random'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {controlPoint.controlType.replace('-', ' ')}
                  </span>
                  {controlPoint.frequency && (
                    <div className="text-xs text-gray-500 mt-1">1 in {controlPoint.frequency}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {controlPoint.responsible}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    controlPoint.typeOfCheck === 'measurement'
                      ? 'bg-green-100 text-green-800'
                      : controlPoint.typeOfCheck === 'picture'
                      ? 'bg-purple-100 text-purple-800'
                      : controlPoint.typeOfCheck === 'pass-fail'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {controlPoint.typeOfCheck.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    controlPoint.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {controlPoint.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openViewControlPoint(controlPoint)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditControlPoint(controlPoint)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirmCP(controlPoint)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQualityAlerts = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
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
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
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
            <option value="urgent">Urgent</option>
          </select>
          <button
            onClick={() => setShowCreateAlertForm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </button>
        </div>
      </div>
      {/* Kanban Board */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Quality Alerts Kanban</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {['new', 'in-progress', 'resolved', 'cancelled'].map((status) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wider">
                {status.replace('-', ' ')} ({filteredAlerts.filter((alert) => alert.status === status).length})
              </h4>
              <div className="space-y-3">
                {filteredAlerts
                  .filter((alert) => alert.status === status)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openViewAlert(alert)}
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {alert.alertNumber}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {alert.product} - {alert.operation}
                      </div>
                      <div className="text-xs text-gray-700 mb-2">
                        {alert.description.substring(0, 60)}...
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {alert.tags.slice(0, 2).map((tag, index) => {
                            const tagInfo = qualityTags.find((t) => t.name === tag);
                            return (
                              <span key={index} className={`inline-flex px-1 py-0.5 text-xs rounded ${tagInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Assigned: {alert.assignedTo}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Quality Alerts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alert
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAlerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{alert.alertNumber}</div>
                    <div className="text-sm text-gray-500">{alert.description.substring(0, 40)}...</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {alert.product}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {alert.operation}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                    {alert.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {alert.assignedTo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {alert.tags.slice(0, 2).map((tag, index) => {
                      const tagInfo = qualityTags.find((t) => t.name === tag);
                      return (
                        <span key={index} className={`inline-flex px-2 py-1 text-xs rounded-full ${tagInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                          {tag}
                        </span>
                      );
                    })}
                    {alert.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{alert.tags.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openViewAlert(alert)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditAlert(alert)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => updateQualityAlert({ ...alert, status: 'resolved' })}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Delete this alert?')) {
                          deleteQualityAlert(alert.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Quality Teams</h3>
          <button
            onClick={() => setShowCreateTeamForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {qualityTeams.map((team) => (
            <div key={team.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-900">{team.teamName}</h4>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  team.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {team.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  Lead: {team.teamLeader}
                </div>
                <div className="text-sm text-gray-600">
                  Department: {team.department}
                </div>
                <div className="text-sm text-gray-600">
                  Members: {team.assignedUsers.length}
                </div>
                <div className="text-sm text-gray-600">
                  Products: {team.relatedProducts.length}
                </div>
              </div>
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Team Members:</h5>
                <div className="space-y-1">
                  {team.assignedUsers.map((member: any) => (
                    <div key={member.userId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">{member.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.availability === 'available'
                          ? 'bg-green-100 text-green-800'
                          : member.availability === 'busy'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.availability}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <button
                  className="text-green-600 hover:text-green-900"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this team?')) {
                      deleteQualityTeam(team.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTags = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Quality Tags</h3>
          <button
            onClick={() => setShowCreateTagForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tag
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {qualityTags.map((tag) => (
              <div key={tag.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${tag.color}`}>
                    {tag.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditTag(tag)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete tag "${tag.name}"? This may affect alerts.`)) {
                          deleteQualityTag(tag.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  Category: {tag.category || '—'}
                </div>
                <div className="text-sm text-gray-500">
                  {tag.description || 'No description'}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Used in {qualityAlerts.filter((a) => a.tags.includes(tag.name)).length} alerts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // renderOverview, renderReports, renderSettings remain the same as in the original code

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Checks</p>
                <p className="text-2xl font-semibold text-gray-900">{qualityChecks.length}</p>
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
                <p className="text-sm font-medium text-gray-500">Passed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {qualityChecks.filter((check) => check.result === 'pass').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {qualityAlerts.filter((alert) => alert.status !== 'resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Control Points</p>
                <p className="text-2xl font-semibold text-gray-900">{qualityControlPoints.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Pass Rate Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Pass Rate</h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {qualityChecks.length > 0
                ? Math.round((qualityChecks.filter((check) => check.result === 'pass').length / qualityChecks.length) * 100)
                : 0}
              %
            </div>
            <p className="text-sm text-gray-500 mt-1">Overall Pass Rate</p>
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setShowCreateCheckForm(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckSquare className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">New Quality Check</span>
          </button>
          <button
            onClick={() => setShowCreateControlPointForm(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Target className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Add Control Point</span>
          </button>
          <button
            onClick={() => setShowCreateAlertForm(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Create Alert</span>
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
          <h3 className="text-lg font-medium text-gray-900">Recent Quality Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {qualityChecks.slice(0, 5).map((check) => (
            <div key={check.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getResultIcon(check.result)}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{check.testType} - {check.product}</p>
                  <p className="text-sm text-gray-500">Batch: {check.batchNumber} • {check.performedBy}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(check.result)}`}>
                  {check.result}
                </span>
                <span className="text-sm text-gray-500">{check.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Other render functions (renderReports, renderSettings) remain unchanged

  const renderReports = () => (
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckSquare className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Quality Checks</h3>
              <p className="text-sm text-gray-500">Pass/Fail analysis</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Failure Rate</h3>
              <p className="text-sm text-gray-500">By product/supplier</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Bell className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Alert Analysis</h3>
              <p className="text-sm text-gray-500">Resolution times</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Trends</h3>
              <p className="text-sm text-gray-500">Quality improvements</p>
            </div>
          </div>
        </div>
      </div>
      {/* Sample Reports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quality Summary Report</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Checks by Result</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Passed</span>
                  <span className="text-sm font-medium text-green-600">
                    {qualityChecks.filter((check) => check.result === 'pass').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="text-sm font-medium text-red-600">
                    {qualityChecks.filter((check) => check.result === 'fail').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {qualityChecks.filter((check) => check.result === 'pending').length}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Alerts by Priority</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Urgent</span>
                  <span className="text-sm font-medium text-red-600">
                    {qualityAlerts.filter((alert) => alert.priority === 'urgent').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High</span>
                  <span className="text-sm font-medium text-orange-600">
                    {qualityAlerts.filter((alert) => alert.priority === 'high').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medium</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {qualityAlerts.filter((alert) => alert.priority === 'medium').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low</span>
                  <span className="text-sm font-medium text-green-600">
                    {qualityAlerts.filter((alert) => alert.priority === 'low').length}
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Control Point Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Auto-trigger checks</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Require photos for failures</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Email notifications</span>
            </label>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-create alerts on failure</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Always</option>
                <option>Only for critical checks</option>
                <option>Never</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default priority</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Medium</option>
                <option>High</option>
                <option>Low</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SLA Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgent alerts (hours)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">High priority (hours)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medium priority (hours)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="72"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Integration Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Module Integration</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Inventory Integration</h4>
            <p className="text-sm text-gray-600 mb-3">Trigger quality checks on receipt/delivery</p>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Enable integration</span>
            </label>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Manufacturing Integration</h4>
            <p className="text-sm text-gray-600 mb-3">In-process quality inspections</p>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Enable integration</span>
            </label>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Purchase Integration</h4>
            <p className="text-sm text-gray-600 mb-3">Vendor quality rating</p>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Enable integration</span>
            </label>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Maintenance Integration</h4>
            <p className="text-sm text-gray-600 mb-3">Link equipment failures to quality</p>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-gray-700">Enable integration</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'checks':
        return renderQualityChecks();
      case 'control-points':
        return renderControlPoints();
      case 'alerts':
        return renderQualityAlerts();
      case 'teams':
        return renderTeams();
      case 'tags':
        return renderTags();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Management System</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive quality control with checks, alerts, and compliance reporting
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
                <Icon
                  className={`mr-2 h-5 w-5 transition-colors ${
                    activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
      {/* Tab Content */}
      {renderTabContent()}
      {/* Modals */}
      {showCreateTagForm && <CreateTagForm />}
      {showUpdateTagForm && <UpdateTagModal />}
      {showViewAlertForm && <ViewAlertModal />}
      {showUpdateAlertForm && <UpdateAlertModal />}
      {showViewControlPointForm && <ViewControlPointModal />}
      {showUpdateControlPointForm && <UpdateControlPointModal />}
      {showCreateCheckForm && <CreateQualityCheckForm />}
      {showUpdateCheckForm && <UpdateQualityCheckForm />}
      {showDeleteConfirm && <DeleteConfirmModal />}
      {showViewCheckForm && <ViewQualityCheckModal />}
      {showCreateControlPointForm && <CreateControlPointForm />}
      {showCreateAlertForm && <CreateAlertForm />}
      {showCreateTeamForm && <CreateTeamForm />}
    </div>
  );
};

export default Quality;