import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Users, Plus, Mail, Phone, Search, 
  MoreVertical, Edit2, Trash2, MessageSquare, 
  ChevronDown, ChevronUp 
} from "lucide-react";

import { AppDispatch, RootState } from "@/redux/store";
import { fetchTeams, createTeam, updateTeam, deleteTeam } from "@/redux/slices/teamSlice";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Types ---
interface TeamMember {
  userId: string;
  name: string;
  availability: string;
}

interface Team {
  _id: string;
  teamName: string;
  teamLead: string;
  productCategories: string[];
  contactInfo?: { email?: string; phone?: string; };
  members: TeamMember[];
}

interface TeamsTabProps {
  onSelectTeam?: (team: Team) => void;
}

const TeamsTab = ({ onSelectTeam }: TeamsTabProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { teams, loading, error } = useSelector((state: RootState) => state.teams);

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  
  const orgId = localStorage.getItem('organisationId');

  useEffect(() => {
    if (orgId) dispatch(fetchTeams({ page: 1, limit: 20 }));
  }, [dispatch, orgId]);

  const filteredTeams = useMemo(() => 
    teams.filter((team) =>
      team.teamName.toLowerCase().includes(search.toLowerCase())
    ), [teams, search]
  );

  const handleSave = (payload: any) => {
    if (editingTeam) {
      dispatch(updateTeam({ id: editingTeam._id, payload }));
    } else {
      dispatch(createTeam(payload));
    }
    setIsModalOpen(false);
    setEditingTeam(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Engineering Teams</h2>
          <p className="text-muted-foreground">
            Manage your organization's engineering squads and member availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter teams..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => { setEditingTeam(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Team
          </Button>
        </div>
      </div>

      <Separator />

      {/* State Feedback */}
      {loading && <div className="py-20 text-center text-muted-foreground">Loading squad data...</div>}
      {error && <div className="py-20 text-center text-destructive font-medium">{error}</div>}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team._id} className="group hover:shadow-md transition-all border-border/60">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{team.teamName}</CardTitle>
                    <CardDescription>Lead: {team.teamLead}</CardDescription>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingTeam(team); setIsModalOpen(true); }}>
                      <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => window.confirm("Delete team?") && dispatch(deleteTeam(team._id))}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {team.productCategories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="font-medium">
                    {cat}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {team.contactInfo?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> {team.contactInfo.email}
                  </div>
                )}
                {team.contactInfo?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> {team.contactInfo.phone}
                  </div>
                )}
              </div>

              {/* Members Toggle */}
              <div className="pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between h-8 px-2"
                  onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}
                >
                  <span className="text-xs font-semibold">MEMBERS ({team.members.length})</span>
                  {expandedTeam === team._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {expandedTeam === team._id && (
                  <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    {team.members.map((m) => (
                      <div key={m.userId} className="flex justify-between items-center text-xs bg-muted/50 p-2 rounded">
                        <span className="font-medium">{m.name}</span>
                        <span className={m.availability === 'available' ? 'text-green-600' : 'text-orange-500'}>
                          {m.availability}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Button 
                variant="outline" 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={() => onSelectTeam?.(team)}
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Open Chat
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <TeamDialog 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        team={editingTeam}
        onSave={handleSave}
      />
    </div>
  );
};

// --- Modal Component ---
function TeamDialog({ open, onOpenChange, team, onSave }: any) {
  const [form, setForm] = useState({
    teamName: "",
    teamLead: "",
    productCategories: "",
    email: "",
    phone: "",
    membersText: "",
  });

  useEffect(() => {
    if (team) {
      setForm({
        teamName: team.teamName,
        teamLead: team.teamLead,
        productCategories: team.productCategories.join(", "),
        email: team.contactInfo?.email || "",
        phone: team.contactInfo?.phone || "",
        membersText: team.members.map((m: any) => `${m.name} (${m.availability})`).join("\n"),
      });
    } else {
      setForm({ teamName: "", teamLead: "", productCategories: "", email: "", phone: "", membersText: "" });
    }
  }, [team, open]);
// const { userProfile } = useSelector((state: RootState) => state.auth);
//   const handleSubmit = () => {
//     const members = form.membersText.split("\n").filter(l => l.trim()).map((line, idx) => {
//       const match = line.trim().match(/^(.+?)\s*\((.+)\)$/);
//       return {
//         userId: userProfile._id,
//         name: match ? match[1].trim() : line.trim(),
//         availability: match ? match[2].toLowerCase() : "available",
//       };
//     });
  const handleSubmit = () => {
    const members = form.membersText.split("\n").filter(l => l.trim()).map((line, idx) => {
      const match = line.trim().match(/^(.+?)\s*\((.+)\)$/);
      return {
        userId: `${Date.now()}-${idx}`,
        name: match ? match[1].trim() : line.trim(),
        availability: match ? match[2].toLowerCase() : "available",
      };
    });

    onSave({
      teamName: form.teamName,
      teamLead: form.teamLead,
      productCategories: form.productCategories.split(",").map(c => c.trim()).filter(Boolean),
      contactInfo: { email: form.email, phone: form.phone },
      members,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{team ? "Edit Team" : "Create New Team"}</DialogTitle>
          <DialogDescription>Fill in the details for the engineering squad.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Name</label>
              <Input value={form.teamName} onChange={(e) => setForm({...form, teamName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Lead</label>
              <Input value={form.teamLead} onChange={(e) => setForm({...form, teamLead: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Categories (comma separated)</label>
            <Input value={form.productCategories} onChange={(e) => setForm({...form, productCategories: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Members (Name (availability))</label>
            <Textarea 
              placeholder="John Doe (available)&#10;Jane Smith (busy)" 
              className="min-h-[120px]"
              value={form.membersText}
              onChange={(e) => setForm({...form, membersText: e.target.value})}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TeamsTab;