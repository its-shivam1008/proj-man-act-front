// @/pages/plant-machinery/Teams.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { Plus, User, Trash2, Edit } from "lucide-react";
import { storage, STORAGE_KEYS, ensureInitialized } from "@/lib/storage";

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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface Technician {
  id: string;
  name: string;
  availability: "available" | "busy" | "offline";
}

interface Team {
  id: string;
  teamName: string;
  teamLead: string;
  specializations: string[];
  workingHours: { start: string; end: string };
  members: {
    technicianId: string;
    name: string;
    availability: string;
  }[];
}

const STORAGE_KEY = STORAGE_KEYS.MAINTENANCE_TEAMS_V1;

const Teams: React.FC = () => {
  const { addMaintenanceTeam } = useData();
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [technicians] = useState<Technician[]>([
    { id: "1", name: "John Doe", availability: "available" },
    { id: "2", name: "Jane Smith", availability: "busy" },
    { id: "3", name: "Mike Johnson", availability: "available" },
  ]);
  const [initialized, setInitialized] = useState(false);

  // Load from localStorage
// Load from localStorage once
useEffect(() => {
  ensureInitialized();
  const saved = storage.get<Team[]>(STORAGE_KEY, []);
  if (saved && Array.isArray(saved)) setTeams(saved);
  setInitialized(true);
}, []);

// ✅ Only save AFTER we have loaded existing data
useEffect(() => {
  if (initialized) storage.set(STORAGE_KEY, teams);
}, [teams, initialized]);


  const handleCreateOrUpdateTeam = (e: React.FormEvent<HTMLFormElement>) => {
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

    const newTeam: Team = {
      id: editingTeam ? editingTeam.id : Date.now().toString(),
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
    };

    if (editingTeam) {
      const updated = teams.map((t) => (t.id === editingTeam.id ? newTeam : t));
      setTeams(updated);
      setEditingTeam(null);
    } else {
      setTeams((prev) => [...prev, newTeam]);
      addMaintenanceTeam?.(newTeam);
    }

    setShowTeamForm(false);
    f.reset();
  };

  const handleDeleteTeam = (id: string) => {
    if (confirm("Are you sure you want to delete this team?")) {
      const updated = teams.filter((team) => team.id !== id);
      setTeams(updated);
      storage.set(STORAGE_KEY, updated);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setShowTeamForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Teams & Technicians</h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage your maintenance teams and technician availability.
      </p>

      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Teams</h3>
          <Button onClick={() => setShowTeamForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Team
          </Button>
        </div>

        {/* Team Cards */}
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-full">
              No maintenance teams available.
            </p>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">{team.teamName}</h4>
                  <span className="text-sm text-gray-500">
                    {team.members.length} members
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Lead: {team.teamLead}
                  </div>
                  <div className="text-sm text-gray-600">
                    Specializations: {team.specializations.join(", ")}
                  </div>
                  <div className="text-sm text-gray-600">
                    Hours: {team.workingHours.start} - {team.workingHours.end}
                  </div>
                </div>

                <Separator className="my-3" />
                <ScrollArea className="h-24">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Team Members:
                  </h5>
                  {team.members.map((member) => (
                    <div
                      key={member.technicianId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{member.name}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${member.availability === "available"
                          ? "bg-green-100 text-green-800"
                          : member.availability === "busy"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {member.availability}
                      </span>
                    </div>
                  ))}
                </ScrollArea>

                <div className="flex justify-end mt-4 space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditTeam(team)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showTeamForm} onOpenChange={setShowTeamForm}>
        <DialogContent className="max-w-3xl">
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
