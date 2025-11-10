import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import Layout from '../../components/Layout';
import {
  X,
  Settings,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Wrench,
  Users,
  BarChart3,
  FileText,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  XCircle,
  MapPin,
  User,
  DollarSign,
  Package,
  ChevronDown
} from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  availability: 'available' | 'busy' | 'offline';
  // add skills, contact, etc. later
}

const Maintenance: React.FC = () => {
  const {
    maintenanceRecords,
    equipment,
    preventiveMaintenancePlans,
    maintenanceTeams,
    addMaintenanceRecord,
    addEquipment,
    addPreventiveMaintenancePlan,
    addMaintenanceTeam
  } = useData();

  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [showViewEquipment, setShowViewEquipment] = useState(false);
  const [showEditEquipment, setShowEditEquipment] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showViewPlan, setShowViewPlan] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const [showTeamForm, setShowTeamForm] = useState(false);

  const [technicians] = useState<Technician[]>([
  { id: '1', name: 'John Doe', availability: 'available' },
  { id: '2', name: 'Jane Smith', availability: 'busy' },
  { id: '3', name: 'Mike Johnson', availability: 'available' },
]);
  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;

    const selectedMemberIds = Array.from(
      f.members.selectedOptions as HTMLOptionsCollection
    ).map((opt: HTMLOptionElement) => opt.value);

    const members = selectedMemberIds.map(id => {
      // const tech = technicians.find(t => t.id === id);
      return {
        technicianId: id,
        name: tech?.name || 'Unknown',
        availability: tech?.availability || 'available',
      };
    });

    const newTeam = {
      id: Date.now().toString(),
      teamName: (f.teamName as HTMLInputElement).value.trim(),
      teamLead: (f.teamLead as HTMLInputElement).value.trim(),
      specializations: (f.specializations as HTMLInputElement).value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      workingHours: {
        start: (f.startTime as HTMLInputElement).value,
        end: (f.endTime as HTMLInputElement).value,
      },
      members,
    };

    addMaintenanceTeam?.(newTeam);
    setShowTeamForm(false);
    f.reset();
  };

  const openViewPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowViewPlan(true);
  };

  const openEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowEditPlan(true);
  };

  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;

    const newPlan = {
      id: Date.now().toString(),
      planName: (f.planName as HTMLInputElement).value.trim(),
      equipmentId: (f.equipmentId as HTMLSelectElement).value,
      frequency: (f.frequency as HTMLSelectElement).value,
      nextExecutionDate: (f.nextExecutionDate as HTMLInputElement).value,
      maintenanceTeam: (f.maintenanceTeam as HTMLInputElement).value.trim(),
      isActive: true,
    };

    addPreventivePlan?.(newPlan);
    setShowPlanForm(false);
  };

  const handleUpdatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;

    const updated = {
      ...selectedPlan,
      planName: (f.planName as HTMLInputElement).value.trim(),
      equipmentId: (f.equipmentId as HTMLSelectElement).value,
      frequency: (f.frequency as HTMLSelectElement).value,
      nextExecutionDate: (f.nextExecutionDate as HTMLInputElement).value,
      maintenanceTeam: (f.maintenanceTeam as HTMLInputElement).value.trim(),
    };

    updatePreventivePlan?.(updated);
    setShowEditPlan(false);
    setSelectedPlan(null);
  };

  const togglePlanStatus = (id: string) => {
    togglePreventivePlanStatus?.(id);
  };
  const openView = (eq: any) => {
    setSelectedEquipment(eq);
    setShowViewEquipment(true);
  };

  const openEdit = (eq: any) => {
    setSelectedEquipment(eq);
    setShowEditEquipment(true);
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;

    const newEq = {
      id: Date.now().toString(),
      name: (f.name as HTMLInputElement).value.trim(),
      equipmentId: (f.equipmentId as HTMLInputElement).value.trim(),
      manufacturer: (f.manufacturer as HTMLInputElement).value.trim(),
      category: (f.category as HTMLSelectElement).value,
      location: (f.location as HTMLInputElement).value.trim(),
      status: (f.status as HTMLSelectElement).value,
      nextPreventiveMaintenance: (f.nextMaintenance as HTMLInputElement).value,
      totalDowntime: Number((f.totalDowntime as HTMLInputElement).value) || 0,
    };

    addEquipment?.(newEq);
    setShowEquipmentForm(false);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;

    const updated = {
      ...selectedEquipment,
      name: (f.name as HTMLInputElement).value.trim(),
      equipmentId: (f.equipmentId as HTMLInputElement).value.trim(),
      manufacturer: (f.manufacturer as HTMLInputElement).value.trim(),
      category: (f.category as HTMLSelectElement).value,
      location: (f.location as HTMLInputElement).value.trim(),
      status: (f.status as HTMLSelectElement).value,
      nextPreventiveMaintenance: (f.nextMaintenance as HTMLInputElement).value,
      totalDowntime: Number((f.totalDowntime as HTMLInputElement).value) || 0,
    };

    updateEquipment?.(updated);
    setShowEditEquipment(false);
    setSelectedEquipment(null);
  };
  const filteredRecords = maintenanceRecords.filter(record => {
    const matchesSearch = record.requestTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.equipment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || record.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'requests', name: 'Maintenance Requests', icon: FileText },
    { id: 'equipment', name: 'Equipment Management', icon: Settings },
    { id: 'preventive', name: 'Preventive Planning', icon: Calendar },
    { id: 'teams', name: 'Teams & Technicians', icon: Users },
    { id: 'kanban', name: 'Kanban Board', icon: Wrench },
    { id: 'reports', name: 'Reports & Analytics', icon: BarChart3 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preventive':
        return 'bg-green-100 text-green-800';
      case 'corrective':
        return 'bg-yellow-100 text-yellow-800';
      case 'emergency':
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
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const CreateTeamForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-medium text-gray-900">Create Maintenance Team</h3>
          <button onClick={() => setShowTeamForm(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleCreateTeam} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Team Name *</label>
              <input
                name="teamName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Alpha Crew"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Team Lead *</label>
              <input
                name="teamLead"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Specializations</label>
              <input
                name="specializations"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Electrical, HVAC, Welding"
              />
              <p className="mt-1 text-xs text-gray-500">Separate with commas</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Working Hours Start *</label>
              <input
                name="startTime"
                type="time"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Working Hours End *</label>
              <input
                name="endTime"
                type="time"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Team Members *</label>
              <select
                name="members"
                multiple
                required
                size={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.availability})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowTeamForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const CreatePlanForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-medium text-gray-900">Create Preventive Plan</h3>
          <button onClick={() => setShowPlanForm(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Plan Name *</label>
              <input name="planName" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Equipment *</label>
              <select name="equipmentId" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">Select Equipment</option>
                {equipment.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name} ({eq.equipmentId})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Frequency *</label>
              <select name="frequency" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Bi-Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Next Execution *</label>
              <input name="nextExecutionDate" type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Maintenance Team</label>
              <input name="maintenanceTeam" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., Team A, John & Sarah" />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setShowPlanForm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Create Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const ViewPlanModal = () => {
    if (!selectedPlan) return null;

    const eq = equipment.find(e => e.id === selectedPlan.equipmentId);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="text-lg font-medium text-gray-900">{selectedPlan.planName}</h3>
            <button onClick={() => { setShowViewPlan(false); setSelectedPlan(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6 space-y-3 text-sm">
            <div><strong>Equipment:</strong> {eq?.name || '—'} ({eq?.equipmentId})</div>
            <div><strong>Frequency:</strong> {selectedPlan.frequency}</div>
            <div><strong>Next Execution:</strong> {selectedPlan.nextExecutionDate}</div>
            <div><strong>Team:</strong> {selectedPlan.maintenanceTeam || '—'}</div>
            <div><strong>Status:</strong> <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedPlan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {selectedPlan.isActive ? 'Active' : 'Inactive'}
            </span></div>
          </div>
          <div className="flex justify-end p-4 border-t">
            <button onClick={() => { setShowViewPlan(false); setSelectedPlan(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditPlanModal = () => {
    if (!selectedPlan) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="text-lg font-medium text-gray-900">Edit Plan</h3>
            <button onClick={() => { setShowEditPlan(false); setSelectedPlan(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleUpdatePlan} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name *</label>
                <input name="planName" defaultValue={selectedPlan.planName} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Equipment *</label>
                <select name="equipmentId" defaultValue={selectedPlan.equipmentId} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.equipmentId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency *</label>
                <select name="frequency" defaultValue={selectedPlan.frequency} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Bi-Weekly</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Next Execution *</label>
                <input name="nextExecutionDate" type="date" defaultValue={selectedPlan.nextExecutionDate} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Maintenance Team</label>
                <input name="maintenanceTeam" defaultValue={selectedPlan.maintenanceTeam} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={() => { setShowEditPlan(false); setSelectedPlan(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  const AddEquipmentForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-medium text-gray-900">Add New Equipment</h3>
          <button onClick={() => setShowEquipmentForm(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Equipment ID *</label>
              <input name="equipmentId" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
              <input name="manufacturer" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select name="category" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">Select...</option>
                <option>Machine</option>
                <option>Tool</option>
                <option>Vehicle</option>
                <option>Instrument</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location *</label>
              <input name="location" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., Line A, Warehouse 2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status *</label>
              <select name="status" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="active">Active</option>
                <option value="under-maintenance">Under Maintenance</option>
                <option value="out-of-order">Out of Order</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Next Preventive Maintenance *</label>
              <input name="nextMaintenance" type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Downtime (hrs)</label>
              <input name="totalDowntime" type="number" min="0" defaultValue="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setShowEquipmentForm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add Equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const ViewEquipmentModal = () => {
    if (!selectedEquipment) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="text-lg font-medium text-gray-900">{selectedEquipment.name}</h3>
            <button onClick={() => { setShowViewEquipment(false); setSelectedEquipment(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div><strong>ID:</strong> {selectedEquipment.equipmentId}</div>
            <div><strong>Manufacturer:</strong> {selectedEquipment.manufacturer || '—'}</div>
            <div><strong>Category:</strong> {selectedEquipment.category}</div>
            <div><strong>Location:</strong> {selectedEquipment.location}</div>
            <div><strong>Status:</strong> <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedEquipment.status === 'active' ? 'bg-green-100 text-green-800' :
              selectedEquipment.status === 'under-maintenance' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{selectedEquipment.status.replace('-', ' ')}</span></div>
            <div><strong>Next PM:</strong> {selectedEquipment.nextPreventiveMaintenance}</div>
            <div><strong>Total Downtime:</strong> {selectedEquipment.totalDowntime}h</div>
          </div>
          <div className="flex justify-end p-4 border-t">
            <button onClick={() => { setShowViewEquipment(false); setSelectedEquipment(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditEquipmentModal = () => {
    if (!selectedEquipment) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="text-lg font-medium text-gray-900">Edit Equipment</h3>
            <button onClick={() => { setShowEditEquipment(false); setSelectedEquipment(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input name="name" defaultValue={selectedEquipment.name} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Equipment ID *</label>
                <input name="equipmentId" defaultValue={selectedEquipment.equipmentId} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <input name="manufacturer" defaultValue={selectedEquipment.manufacturer} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <select name="category" defaultValue={selectedEquipment.category} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option>Machine</option>
                  <option>Tool</option>
                  <option>Vehicle</option>
                  <option>Instrument</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location *</label>
                <input name="location" defaultValue={selectedEquipment.location} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status *</label>
                <select name="status" defaultValue={selectedEquipment.status} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="active">Active</option>
                  <option value="under-maintenance">Under Maintenance</option>
                  <option value="out-of-order">Out of Order</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Next Preventive Maintenance *</label>
                <input name="nextMaintenance" type="date" defaultValue={selectedEquipment.nextPreventiveMaintenance} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Downtime (hrs)</label>
                <input name="totalDowntime" type="number" min="0" defaultValue={selectedEquipment.totalDowntime} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={() => { setShowEditEquipment(false); setSelectedEquipment(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  const CreateMaintenanceRequestForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Maintenance Request</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Title *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Short description of maintenance needed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Equipment</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.equipmentId})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Type *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Type</option>
                  <option value="preventive">Preventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Team *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Team</option>
                  {maintenanceTeams.map(team => (
                    <option key={team.id} value={team.id}>{team.teamName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsible Technician *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Technician</option>
                  {maintenanceTeams.flatMap(team => team.members).map(member => (
                    <option key={member.technicianId} value={member.technicianId}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Category *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select Category</option>
                  <option value="mechanical">Mechanical</option>
                  <option value="electrical">Electrical</option>
                  <option value="software">Software</option>
                  <option value="hydraulic">Hydraulic</option>
                  <option value="pneumatic">Pneumatic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter estimated hours"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the maintenance work required..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <input
                type="file"
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-xs text-gray-500 mt-1">Upload photos, manuals, or documentation</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{maintenanceRecords.length}</p>
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
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {maintenanceRecords.filter(record => record.status === 'in-progress').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Critical Priority</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {maintenanceRecords.filter(record => record.priority === 'critical').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Equipment Count</p>
                <p className="text-2xl font-semibold text-gray-900">{equipment.length}</p>
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
            <span className="text-sm font-medium text-gray-700">New Request</span>
          </button>
          <button
            onClick={() => setShowEquipmentForm(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Add Equipment</span>
          </button>
          <button
            onClick={() => setShowPlanForm(true)}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Schedule Preventive</span>
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
          <h3 className="text-lg font-medium text-gray-900">Recent Maintenance Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {maintenanceRecords.slice(0, 5).map((record) => (
            <div key={record.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${record.status === 'completed' ? 'bg-green-100' :
                    record.status === 'in-progress' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                    {record.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : record.status === 'in-progress' ? (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <Calendar className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{record.requestTitle}</p>
                  <p className="text-sm text-gray-500">{record.equipment} • {record.technician}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(record.priority)}`}>
                  {record.priority}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                  {record.status.replace('-', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
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
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="emergency">Emergency</option>
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
            <option value="critical">Critical</option>
          </select>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Technician
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{record.requestTitle}</div>
                    <div className="text-sm text-gray-500">{record.id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 text-gray-400 mr-2" />
                    <div className="text-sm text-gray-900">{record.equipment}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(record.type)}`}>
                    {record.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(record.priority)}`}>
                    {record.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                    {record.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div className="text-sm text-gray-900">{record.technician}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="text-sm font-medium">Due: {record.deadlineDate}</div>
                    <div className="text-sm text-gray-500">Scheduled: {record.scheduledDate}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    {record.status === 'scheduled' && (
                      <button className="text-purple-600 hover:text-purple-900">
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    <button className="text-red-600 hover:text-red-900">
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

  const renderEquipment = () => (
    <div className="space-y-6">
      {/* Equipment Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Equipment</p>
                <p className="text-2xl font-semibold text-gray-900">{equipment.length}</p>
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
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {equipment.filter(eq => eq.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wrench className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Under Maintenance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {equipment.filter(eq => eq.status === 'under-maintenance').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Out of Order</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {equipment.filter(eq => eq.status === 'out-of-order').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Equipment Registry</h3>
          <button
            onClick={() => setShowEquipmentForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Maintenance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Downtime
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {equipment.map((eq) => (
              <tr key={eq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{eq.name}</div>
                    <div className="text-sm text-gray-500">{eq.equipmentId} • {eq.manufacturer}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {eq.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <div className="text-sm text-gray-900">{eq.location}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${eq.status === 'active' ? 'bg-green-100 text-green-800' :
                    eq.status === 'under-maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      eq.status === 'out-of-order' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {eq.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    {eq.nextPreventiveMaintenance}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {eq.totalDowntime}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => openView(eq)} className="text-blue-600 hover:text-blue-900" title="View">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(eq)} className="text-green-600 hover:text-green-900" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-purple-600 hover:text-purple-900" title="Maintenance Log">
                      <Wrench className="h-4 w-4" />
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

  const renderPreventive = () => (
    <div className="space-y-6">
      {/* Preventive Plans */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Preventive Maintenance Plans</h3>
          <button
            onClick={() => setShowPlanForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Execution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
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
              {preventiveMaintenancePlans.map((plan) => {
                const equipmentItem = equipment.find(eq => eq.id === plan.equipmentId);
                return (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.planName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {equipmentItem?.name || 'Unknown Equipment'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.frequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {plan.nextExecutionDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.maintenanceTeam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openViewPlan(plan)} className="text-blue-600 hover:text-blue-900" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEditPlan(plan)} className="text-green-600 hover:text-green-900" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => togglePlanStatus(plan.id)}
                          className={`${plan.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={plan.isActive ? 'Pause Plan' : 'Activate Plan'}
                        >
                          {plan.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-6">
      {/* Teams Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Maintenance Teams</h3>
          <button
            onClick={() => setShowTeamForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {maintenanceTeams.map((team) => (
            <div key={team.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-900">{team.teamName}</h4>
                <span className="text-sm text-gray-500">{team.members.length} members</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  Lead: {team.teamLead}
                </div>
                <div className="text-sm text-gray-600">
                  Specializations: {team.specializations.join(', ')}
                </div>
                <div className="text-sm text-gray-600">
                  Hours: {team.workingHours.start} - {team.workingHours.end}
                </div>
              </div>
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Team Members:</h5>
                <div className="space-y-1">
                  {team.members.map((member) => (
                    <div key={member.technicianId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">{member.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${member.availability === 'available' ? 'bg-green-100 text-green-800' :
                        member.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {member.availability}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKanban = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Maintenance Kanban Board</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {['scheduled', 'in-progress', 'completed', 'cancelled'].map((status) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wider">
                {status.replace('-', ' ')} ({maintenanceRecords.filter(r => r.status === status).length})
              </h4>
              <div className="space-y-3">
                {maintenanceRecords
                  .filter(record => record.status === status)
                  .map((record) => (
                    <div key={record.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {record.requestTitle}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {record.equipment}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(record.priority)}`}>
                          {record.priority}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(record.type)}`}>
                          {record.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Due: {record.deadlineDate}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Request Summary</h3>
              <p className="text-sm text-gray-500">By type, status, date</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Downtime Analysis</h3>
              <p className="text-sm text-gray-500">Equipment downtime</p>
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
              <p className="text-sm text-gray-500">Maintenance costs</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Compliance Rate</h3>
              <p className="text-sm text-gray-500">Preventive vs missed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Reports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Maintenance Summary Report</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Requests by Type</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Preventive</span>
                  <span className="text-sm font-medium text-gray-900">
                    {maintenanceRecords.filter(r => r.type === 'preventive').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Corrective</span>
                  <span className="text-sm font-medium text-gray-900">
                    {maintenanceRecords.filter(r => r.type === 'corrective').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Emergency</span>
                  <span className="text-sm font-medium text-gray-900">
                    {maintenanceRecords.filter(r => r.type === 'emergency').length}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Equipment Downtime</h4>
              <div className="space-y-3">
                {equipment.slice(0, 3).map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{eq.name}</span>
                    <span className="text-sm font-medium text-gray-900">{eq.totalDowntime}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'requests':
        return renderRequests();
      case 'equipment':
        return renderEquipment();
      case 'preventive':
        return renderPreventive();
      case 'teams':
        return renderTeams();
      case 'kanban':
        return renderKanban();
      case 'reports':
        return renderReports();
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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive maintenance planning, equipment tracking, and team management
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
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className={`mr-2 h-5 w-5 transition-colors ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Create Forms */}
      {showCreateForm && <CreateMaintenanceRequestForm />}
      {/* Equipment Modals */}
      {/* Preventive Maintenance Modals */}
      {showPlanForm && <CreatePlanForm />}
      {showViewPlan && <ViewPlanModal />}
      {showEditPlan && <EditPlanModal />}
      {/* Team Modal */}
      {showTeamForm && <CreateTeamForm />}
      {showEquipmentForm && <AddEquipmentForm />}
      {showViewEquipment && <ViewEquipmentModal />}
      {showEditEquipment && <EditEquipmentModal />}
    </div>
    // </Layout>
  );
};

export default Maintenance;