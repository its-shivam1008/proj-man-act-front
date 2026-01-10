// TeamsTab.tsx
import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  X,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  clearTeams,
  createTeam,
  deleteTeam,
  fetchTeams,
  updateTeam,
} from "@/redux/slices/teamSlice";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface TeamMember {
  userId: string;
  name: string;
  availability: string; // e.g. "available", "busy", "on-leave"
}

interface Team {
  _id: string;                    // ← Change from 'id' to '_id'
  teamName: string;
  teamLead: string;
  productCategories: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  members: TeamMember[];
  location?: string;
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
const TeamsTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { teams, loading, error } = useSelector((state: RootState) => state.teams);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null); // for edit mode
  const orgId = localStorage.getItem('organisationId')
  // Fetch teams on mount
  useEffect(() => {
    if(orgId){
      dispatch(fetchTeams({ page: 1, limit: 20 }));
    }
  }, [dispatch , orgId]);
    
    

  const filteredTeams = teams.filter((team) =>
    team.teamName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateOrUpdate = (payload: any) => {
  if (editingTeam) {
    // Use _id here!
    dispatch(updateTeam({ id: editingTeam._id, payload }));
  } else {
    dispatch(createTeam(payload));
  }
  setShowModal(false);
  setEditingTeam(null);
};

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Engineering Teams</h2>
          <p className="text-sm text-gray-500">
            Manage engineering teams, members, and responsibilities
          </p>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => {
              setEditingTeam(null);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Team
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-center">Loading teams...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* TEAMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <div
            key={team._id}
            className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 border"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{team.teamName}</h3>
                  <p className="text-sm text-gray-600">Lead: {team.teamLead}</p>
                </div>
              </div>

              <button
                onClick={() =>
                  setExpandedTeam(expandedTeam === team._id ? null : team._id)
                }
                className="text-gray-500 hover:text-gray-800"
              >
                {expandedTeam === team._id ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {team.productCategories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs bg-gray-100 px-3 py-1 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {team.contactInfo?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {team.contactInfo.email}
                </div>
              )}
              {team.contactInfo?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {team.contactInfo.phone}
                </div>
              )}
            </div>

            {/* Members (expanded) */}
            {expandedTeam === team._id && (
              <div className="border-t pt-4">
                <p className="font-medium mb-3">
                  Team Members ({team.members.length})
                </p>
                <div className="space-y-2">
                  {team.members.map((m) => (
                    <div
                      key={m.userId}
                      className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm"
                    >
                      <span>{m.name}</span>
                      <span className="text-gray-500 capitalize">
                        {m.availability}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => openEditModal(team)}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this team?\nThis action cannot be undone.")) {
                    dispatch(deleteTeam(team._id));
                  }
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <AddTeamModal
          team={editingTeam}
          onClose={() => {
            setShowModal(false);
            setEditingTeam(null);
          }}
          onSave={handleCreateOrUpdate}
        />
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Modal Component
// ------------------------------------------------------------------
interface AddTeamModalProps {
  team?: Team | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

const AddTeamModal = ({ team, onClose, onSave }: AddTeamModalProps) => {
  const [form, setForm] = useState({
    teamName: team?.teamName || "",
    teamLead: team?.teamLead || "",
    productCategories: team?.productCategories.join(", ") || "",
    email: team?.contactInfo?.email || "",
    phone: team?.contactInfo?.phone || "",
    membersText: team?.members
      .map((m) => `${m.name} (${m.availability})`)
      .join("\n") || "",
  });

  const handleSubmit = () => {
    const members: TeamMember[] = form.membersText
      .split("\n")
      .filter((line) => line.trim())
      .map((line, idx) => {
        const match = line.trim().match(/^(.+?)\s*\((available|busy|on-leave|.*)\)$/i);
        if (match) {
          return {
            userId: `${Date.now()}-${idx}`, // temporary ID
            name: match[1].trim(),
            availability: match[2].toLowerCase(),
          };
        }
        return {
          userId: `${Date.now()}-${idx}`,
          name: line.trim(),
          availability: "available",
        };
      });

    const payload = {
      teamName: form.teamName,
      teamLead: form.teamLead,
      productCategories: form.productCategories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      contactInfo: {
        ...(form.email && { email: form.email }),
        ...(form.phone && { phone: form.phone }),
      },
      members,
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-xl font-semibold">
            {team ? "Edit Team" : "Add New Engineering Team"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <Input
            label="Team Name *"
            value={form.teamName}
            onChange={(v) => setForm({ ...form, teamName: v })}
          />
          <Input
            label="Team Lead *"
            value={form.teamLead}
            onChange={(v) => setForm({ ...form, teamLead: v })}
          />
          <Input
            label="Product Categories (comma-separated)"
            value={form.productCategories}
            onChange={(v) => setForm({ ...form, productCategories: v })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Contact Email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Input
              label="Contact Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
          </div>

          <Textarea
            label="Team Members (one per line: Name (availability))"
            placeholder="John Doe (available)&#10;Jane Smith (busy)"
            value={form.membersText}
            onChange={(v) => setForm({ ...form, membersText: v })}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {team ? "Update Team" : "Add Team"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Reusable Input Components
// ------------------------------------------------------------------
const Input = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? label}
      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const Textarea = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      rows={6}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default TeamsTab;