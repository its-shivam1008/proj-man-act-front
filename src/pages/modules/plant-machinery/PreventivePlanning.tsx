// @/pages/plant-machinery/PreventivePlanning.tsx
import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import {
  X,
  Plus,
  Calendar,
  Eye,
  Edit,
  Play,
  Pause,
} from 'lucide-react';

// NOTE: Assumes a Layout component exists, as in the original file
// import Layout from '../../components/Layout';

const PreventivePlanning: React.FC = () => {
  const {
    equipment,
    preventiveMaintenancePlans,
    addPreventiveMaintenancePlan,
    // NOTE: updatePreventivePlan & togglePreventivePlanStatus
    // were not in the useData() hook in Maintenance.tsx
    // You will need to add them to your DataContext to make updates work.
    // updatePreventivePlan,
    // togglePreventivePlanStatus,
  } = useData();

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showViewPlan, setShowViewPlan] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

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

    // FIXED: Changed addPreventivePlan to addPreventiveMaintenancePlan from context
    addPreventiveMaintenancePlan?.(newPlan);
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

    // @ts-ignore - This function was missing from the original useData hook
    updatePreventivePlan?.(updated);
    setShowEditPlan(false);
    setSelectedPlan(null);
  };

  const togglePlanStatus = (id: string) => {
    // @ts-ignore - This function was missing from the original useData hook
    togglePreventivePlanStatus?.(id);
  };

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

  const renderPreventive = () => (
    <div className="space-y-6">
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

  return (
    // <Layout>
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Preventive Maintenance</h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage scheduled maintenance plans to prevent equipment failure.
      </p>
      
      {renderPreventive()}

      {/* Modals */}
      {showPlanForm && <CreatePlanForm />}
      {showViewPlan && <ViewPlanModal />}
      {showEditPlan && <EditPlanModal />}
    </div>
    // </Layout>
  );
};

export default PreventivePlanning;