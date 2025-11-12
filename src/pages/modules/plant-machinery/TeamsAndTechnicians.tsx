// @/pages/plant-machinery/Teams.tsx
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import {
  X,
  Plus,
  User,
} from 'lucide-react';

// NOTE: Assumes a Layout component exists, as in the original file
// import Layout from '../../components/Layout';

interface Technician {
  id: string;
  name: string;
  availability: 'available' | 'busy' | 'offline';
  // add skills, contact, etc. later
}

const Teams: React.FC = () => {
  const { maintenanceTeams, addMaintenanceTeam } = useData();

  const [showTeamForm, setShowTeamForm] = useState(false);

  // This was local state in the original component
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
      // FIXED: Uncommented this line to fix the 'tech' undefined bug
      const tech = technicians.find(t => t.id === id);
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

  const renderTeams = () => (
    <div className="space-y-6">
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

  return (
    // <Layout>
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Teams & Technicians</h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage your maintenance teams and technician availability.
      </p>

      {renderTeams()}

      {/* Modal */}
      {showTeamForm && <CreateTeamForm />}
    </div>
    // </Layout>
  );
};

export default Teams;