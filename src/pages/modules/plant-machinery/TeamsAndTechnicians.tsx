// @/pages/plant-machinery/Teams.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { Plus, User, Trash2, Edit, Search, MapPin, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/userPermission";
import { useDebounce } from "@/hooks/useDebounce";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";

interface Technician {
  id: string;
  name: string;
  availability: "available" | "busy" | "offline";
}

interface TeamMember {
  technicianId: string;
  name: string;
  availability: string;
}

interface Team {
  _id: string;
  teamName: string;
  teamLead: string;
  specializations: string[];
  workingHours: { start: string; end: string };
  members: TeamMember[];
  location: string | { _id: string; name: string };
  organisationId: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const Teams: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);
  
  // Permissions
  const canView = usePermission('teamsTechnicians', 'view');
  const canCreate = usePermission('teamsTechnicians', 'create');
  const canEdit = usePermission('teamsTechnicians', 'edit');
  const canDelete = usePermission('teamsTechnicians', 'delete');

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeams, setTotalTeams] = useState(0);

  const debouncedSearch = useDebounce(searchTerm, 500);
  const organisationId = localStorage.getItem('organisationId');

  // Location restriction check
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  const [technicians] = useState<Technician[]>([
    { id: "1", name: "John Doe", availability: "available" },
    { id: "2", name: "Jane Smith", availability: "busy" },
    { id: "3", name: "Mike Johnson", availability: "available" },
    { id: "4", name: "Sarah Wilson", availability: "available" },
    { id: "5", name: "David Brown", availability: "offline" },
  ]);

  // Fetch master data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location"));
  }, [dispatch]);

  // Set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Fetch teams
  useEffect(() => {
    if (organisationId) {
      fetchTeams();
    }
  }, [organisationId, page, debouncedSearch, locationFilter]);

  const fetchTeams = async () => {
    if (!canView) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organisationId: organisationId!,
        page: page.toString(),
        limit: "10",
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (locationFilter !== 'all') params.append('location', locationFilter);

      const response = await fetch(`${API_BASE_URL}/teams-technicians?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch teams');

      const data = await response.json();
      if (data.success) {
        setTeams(data.data.teams);
        setTotalPages(data.data.totalPages);
        setTotalTeams(data.data.totalTeams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };


  const handleCreateOrUpdateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;

    const selectedMemberIds = Array.from(
      (f.members as HTMLSelectElement).selectedOptions
    ).map((opt) => opt.value);

    const members = selectedMemberIds.map((id) => {
      const tech = technicians.find((t) => t.id === id);
      return {
        technicianId: id,
        name: tech?.name || "Unknown",
        availability: tech?.availability || "available",
      };
    });

    const teamData = {
      teamName: (f.teamName as HTMLInputElement).value.trim(),
      teamLead: (f.teamLead as HTMLInputElement).value.trim(),
      specializations: (f.specializations as HTMLInputElement).value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      workingHours: {
        start: (f.startTime as HTMLInputElement).value,
        end: (f.endTime as HTMLInputElement).value,
      },
      members,
      location: isLocationRestricted ? userProfile?.location : (f.location as HTMLSelectElement).value,
    };

    try {
      const url = editingTeam 
        ? `${API_BASE_URL}/teams-technicians/${editingTeam._id}`
        : `${API_BASE_URL}/teams-technicians`;
      
      const method = editingTeam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) throw new Error('Failed to save team');

      const data = await response.json();
      if (data.success) {
        toast.success(editingTeam ? 'Team updated successfully' : 'Team created successfully');
        setShowTeamForm(false);
        setEditingTeam(null);
        f.reset();
        fetchTeams();
      }
    } catch (error) {
      console.error('Error saving team:', error);
      toast.error('Failed to save team');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/teams-technicians/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete team');

      const data = await response.json();
      if (data.success) {
        toast.success('Team deleted successfully');
        fetchTeams();
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setShowTeamForm(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    setPage(1);
  };

  const getLocationName = (locData: string | { _id: string; name: string } | undefined) => {
    if (!locData) return "N/A";
    if (typeof locData === 'object' && locData.name) return locData.name;
    const found = locations.find((l) => l._id === locData);
    return found ? found.name : "Unknown Location";
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams & Technicians</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your maintenance teams and technician availability.
          </p>
        </div>

        {canCreate && (
          <Button onClick={() => setShowTeamForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Team
          </Button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search teams, leads, specializations..."
            className="pl-10"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <Select 
          disabled={isLocationRestricted} 
          value={locationFilter} 
          onValueChange={handleLocationFilterChange}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc._id} value={loc._id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Teams ({totalTeams})</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Team Lead</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-3">
                    <ClipLoader
                      color="#212121"
                      loading={loading}
                      size={15}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                  </TableCell>
                </TableRow>
              ) : teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No teams found.
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team._id}>
                    <TableCell className="font-medium">{team.teamName}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {team.teamLead}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {getLocationName(team.location)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {team.specializations.slice(0, 2).map((spec, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {team.specializations.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{team.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {team.workingHours.start} - {team.workingHours.end}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{team.members.length}</span>
                        <div className="flex -space-x-1">
                          {team.members.slice(0, 3).map((member, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                              title={member.name}
                            >
                              {member.name.charAt(0)}
                            </div>
                          ))}
                          {team.members.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                              +{team.members.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTeam(team)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTeam(team._id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 p-4 border-t">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} (Total: {totalTeams})
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal */}
      <Dialog open={showTeamForm} onOpenChange={setShowTeamForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Edit Maintenance Team" : "Create Maintenance Team"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateOrUpdateTeam} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label>Team Name *</Label>
                <Input
                  name="teamName"
                  defaultValue={editingTeam?.teamName}
                  required
                />
              </div>
              <div>
                <Label>Team Lead *</Label>
                <Input
                  name="teamLead"
                  defaultValue={editingTeam?.teamLead}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label>Specializations</Label>
                <Textarea
                  name="specializations"
                  defaultValue={editingTeam?.specializations.join(", ")}
                  placeholder="e.g., Electrical, HVAC, Welding"
                />
              </div>

              <div>
                <Label>Working Hours Start *</Label>
                <Input
                  type="time"
                  name="startTime"
                  required
                  defaultValue={editingTeam?.workingHours.start}
                />
              </div>
              <div>
                <Label>Working Hours End *</Label>
                <Input
                  type="time"
                  name="endTime"
                  required
                  defaultValue={editingTeam?.workingHours.end}
                />
              </div>

              {/* Location Selection */}
              <div className="md:col-span-2">
                <Label>Location *</Label>
                <select
                  name="location"
                  required
                  disabled={isLocationRestricted}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  defaultValue={
                    editingTeam 
                      ? (typeof editingTeam.location === 'object' ? editingTeam.location._id : editingTeam.location)
                      : isLocationRestricted ? userProfile?.location : ""
                  }
                >
                  {!isLocationRestricted && <option value="">Select Location</option>}
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                {isLocationRestricted && (
                  <p className="mt-1 text-xs text-gray-500">
                    *Location is fixed based on your permissions.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Team Members *</Label>
                <select
                  name="members"
                  multiple
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                >
                  {technicians.map((tech) => (
                    <option
                      key={tech.id}
                      value={tech.id}
                      selected={editingTeam?.members.some(
                        (m) => m.technicianId === tech.id
                      )}
                    >
                      {tech.name} ({tech.availability})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl/Cmd to select multiple
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTeamForm(false);
                  setEditingTeam(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingTeam ? "Update Team" : "Create Team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;
