import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Users, User, MapPin, Mail, Phone, Trash2, X } from 'lucide-react';
import { usePermission } from '@/hooks/userPermission';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import { fetchRepairTeams, createRepairTeam, deleteRepairTeam } from '@/redux/slices/repairTeamSlice';
import { RepairTeam, TeamMember } from '@/types/repair.types';

// TeamForm component moved outside to prevent re-creation
const TeamForm = ({ 
  teamFormData, 
  setTeamFormData, 
  onSubmit, 
  onCancel, 
  masterDataLocations, 
  isLocationRestricted 
}: { 
  teamFormData: any; 
  setTeamFormData: React.Dispatch<React.SetStateAction<any>>; 
  onSubmit: (e: React.FormEvent) => void; 
  onCancel: () => void; 
  masterDataLocations: any[]; 
  isLocationRestricted: boolean; 
}) => {
  // Local state for member management
  const [newMemberName, setNewMemberName] = useState('');

  // Add member function
  const addMember = () => {
    if (newMemberName.trim()) {
      const newMember: TeamMember = {
        name: newMemberName.trim(),
        technicianId: `temp_${Date.now()}`, // Temporary ID
        hourlyRate: 0,
        availability: 'available'
      };
      
      setTeamFormData((prev: any) => ({
        ...prev,
        members: [...(prev.members || []), newMember]
      }));
      
      setNewMemberName('');
    }
  };

  // Remove member function
  const removeMember = (index: number) => {
    setTeamFormData((prev: any) => ({
      ...prev,
      members: prev.members.filter((_: any, i: number) => i !== index)
    }));
  };

  // Handle Enter key for adding members
  const handleMemberKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Repair Team</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
       
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={teamFormData.teamName}
                    onChange={(e) => setTeamFormData((prev: any) => ({ ...prev, teamName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter team name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Lead *
                  </label>
                  <input
                    type="text"
                    value={teamFormData.teamLead}
                    onChange={(e) => setTeamFormData((prev: any) => ({ ...prev, teamLead: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter team lead name"
                    required
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
                      value={teamFormData.location}
                      onChange={(e) => setTeamFormData((prev: any) => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
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
                    Email *
                  </label>
                  <input
                    type="email"
                    value={teamFormData.contactInfo.email}
                    onChange={(e) => setTeamFormData((prev: any) => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={teamFormData.contactInfo.phone}
                    onChange={(e) => setTeamFormData((prev: any) => ({ ...prev, contactInfo: { ...prev.contactInfo, phone: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Team Members Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Team Members</h4>
              
              {/* Add Member Input */}
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyPress={handleMemberKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter member name and press Enter or click Add"
                />
                <button
                  type="button"
                  onClick={addMember}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Member
                </button>
              </div>

              {/* Members List */}
              {teamFormData.members && teamFormData.members.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Team Members ({teamFormData.members.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    {teamFormData.members.map((member: TeamMember, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="text-sm text-gray-900">{member.name}</span>
                        <button
                          type="button"
                          onClick={() => removeMember(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No members added yet. Add members using the input above.</p>
              )}
            </div>
            
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
                Add Team
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const RepairTeams: React.FC = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);
  const { data: repairTeams, loading: teamsLoading } = useSelector((state: any) => state.repairTeams);

  // Permissions
  const canView = usePermission('repair', 'view');
  const canCreate = usePermission('repair', 'create');
  const canDelete = usePermission('repair', 'delete');

  // Local state
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');
  const [teamFormData, setTeamFormData] = useState({
    teamName: '',
    teamLead: '',
    location: '',
    contactInfo: { email: '', phone: '' },
    members: [] as TeamMember[],
  });

  // Location restrictions (same as QualityChecks)
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  // Get locations from master data (same as QualityChecks)
  const masterDataLocations = React.useMemo(() => {
    return locations || [];
  }, [locations]);

  // Helper function to get location name by ID (same as QualityChecks)
  const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    const location = masterDataLocations.find((loc: any) => loc._id === locationId);
    return location ? location.name : locationId;
  };

  // Load master data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location"));
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
    
    if (organisationId && canView) {
      dispatch(fetchRepairTeams(locationFilter !== 'all' ? locationFilter : undefined) as any);
    }
  }, [locationFilter, canView, dispatch]);

  // Filter teams based on user location restriction (same as QualityChecks pattern)
  const filteredRepairTeams = React.useMemo(() => {
    if (!isLocationRestricted || !userProfile?.location) {
      return repairTeams;
    }
    
    // Filter teams by matching location
    return repairTeams.filter((team: RepairTeam) => {
      return team.location === userProfile.location;
    });
  }, [repairTeams, isLocationRestricted, userProfile?.location]);

  // Handle team creation
  const handleAddTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamFormData.teamName.trim()) {
      const newTeam = {
        teamName: teamFormData.teamName,
        teamLead: teamFormData.teamLead,
        // For location-restricted users, use their location; otherwise use form data
        location: isLocationRestricted ? userProfile?.location : teamFormData.location,
        contactInfo: teamFormData.contactInfo,
        members: teamFormData.members || [],
      };
      
      try {
        await dispatch(createRepairTeam(newTeam) as any);
        setShowTeamForm(false);
        setTeamFormData({
          teamName: '',
          teamLead: '',
          location: '',
          contactInfo: { email: '', phone: '' },
          members: [],
        });
        // Refresh teams list with current location filter
        const refreshLocationParam = locationFilter !== 'all' ? locationFilter : undefined;
        dispatch(fetchRepairTeams(refreshLocationParam) as any);
      } catch (error) {
        console.error('Failed to create team:', error);
      }
    }
  };

  // Handle team deletion
  const handleDeleteTeam = async (id: string) => {
    try {
      await dispatch(deleteRepairTeam(id) as any);
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  // Handle form cancel
  const handleCancelTeamForm = () => {
    setShowTeamForm(false);
    setTeamFormData({
      teamName: '',
      teamLead: '',
      location: '',
      contactInfo: { email: '', phone: '' },
      members: [],
    });
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-600">You do not have permission to view repair teams.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Repair Teams</h3>
          <div className="flex items-center space-x-4">
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
            {canCreate && (
              <button
                onClick={() => setShowTeamForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Teams Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {teamsLoading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading teams...</p>
            </div>
          ) : filteredRepairTeams.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No repair teams found</p>
              {canCreate && (
                <button
                  onClick={() => setShowTeamForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Create your first team
                </button>
              )}
            </div>
          ) : (
            filteredRepairTeams.map((team: RepairTeam) => (
              <div key={team._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">{team.teamName}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{team.members?.length || 0} members</span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteTeam(team._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Team"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Lead: {team.teamLead}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location: {getLocationName(team.location)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {team.contactInfo.email}
                  </div>
                  {team.contactInfo.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {team.contactInfo.phone}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Team Members ({team.members?.length || 0}):
                  </h5>
                  <div className="space-y-1">
                    {team.members && team.members.length > 0 ? (
                      team.members.map((member) => (
                        <div key={member.technicianId} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <div>
                            <span className="text-gray-900 font-medium">{member.name}</span>
                            {member.hourlyRate && member.hourlyRate > 0 && (
                              <div className="text-xs text-gray-500">${member.hourlyRate}/hr</div>
                            )}
                          </div>
                          {member.availability && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              member.availability === 'available' ? 'bg-green-100 text-green-800' :
                              member.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {member.availability}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No members assigned</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Team Form Modal */}
      {showTeamForm && (
        <TeamForm
          teamFormData={teamFormData}
          setTeamFormData={setTeamFormData}
          onSubmit={handleAddTeamSubmit}
          onCancel={handleCancelTeamForm}
          masterDataLocations={masterDataLocations}
          isLocationRestricted={isLocationRestricted}
        />
      )}
    </div>
  );
};

export default RepairTeams;