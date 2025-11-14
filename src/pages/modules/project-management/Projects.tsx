import { useState, useEffect, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Textarea } from "../../../components/ui/textarea"; // Added Textarea
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react"; // Added Search
// import { Project } from "../..//types/production"; // Assuming this type is defined elsewhere
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "../../../utils/localStorage";
import { useToast } from "../../../hooks/use-toast";
import { Progress } from "../../../components/ui/progress";

// Define Project type here based on requirements, as the file isn't provided
type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
type ProjectType = 'construction' | 'manufacturing' | 'internal' | 'client-based' | 'other';

interface Project {
  id: string;
  code: string;
  name: string;
  description: string; // New
  clientOrDepartment: string; // Renamed from client
  type: ProjectType; // Updated types
  location?: string;
  budget?: number;
  expectedRevenue?: number; // New
  duration?: string; // New
  manager?: string;
  assignedTeam?: string; // New
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  progress: number;
  actualCost: number;
  createdAt: string;
  updatedAt: string;
}

const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
const PROJECT_TYPES: ProjectType[] = ['construction', 'manufacturing', 'internal', 'client-based', 'other'];


export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const { toast } = useToast();
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const data = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    setProjects(data);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code || !formData.clientOrDepartment || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in Name, Code, Description, and Client/Department.",
        variant: "destructive",
      });
      return;
    }

    let updatedProjects: Project[];
    const now = new Date().toISOString();

    if (editingProject) {
      updatedProjects = projects.map((p) =>
        p.id === editingProject.id
          ? { ...editingProject, ...formData, id: p.id, updatedAt: now } as Project
          : p
      );
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } else {
      const newProject: Project = {
        id: generateId(),
        progress: 0,
        actualCost: 0,
        createdAt: now,
        updatedAt: now,
        status: 'planning',
        type: 'construction',
        ...formData,
      } as Project;
      updatedProjects = [...projects, newProject];
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    }

    saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);
    setProjects(updatedProjects);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    // We can add a custom confirmation modal here instead of window.confirm
    // For now, just delete
    const updatedProjects = projects.filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);
    setProjects(updatedProjects);
    toast({
      title: "Success",
      description: "Project deleted successfully",
    });
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData(project);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      type: "construction",
      status: "planning",
    });
  };

  const handleViewDetails = (project: Project) => {
    toast({
      title: "Details View",
      description: `Viewing WBS for ${project.name} (Not Implemented).`,
    });
    // Here you would navigate to a WBS page or open a different modal
    // e.g., navigate(`/projects/${project.id}/wbs`)
  };

  const getStatusBadge = (status: Project["status"]) => {
    const variants: Record<Project["status"], string> = {
      planning: "bg-blue-100 text-blue-800 border-blue-200",
      active: "bg-green-100 text-green-800 border-green-200",
      "on-hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
      completed: "bg-purple-100 text-purple-800 border-purple-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Memoized filtering logic
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        if (statusFilter === "all") return true;
        return project.status === statusFilter;
      })
      .filter((project) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          project.name.toLowerCase().includes(searchLower) ||
          project.code.toLowerCase().includes(searchLower) ||
          project.clientOrDepartment.toLowerCase().includes(searchLower)
        );
      });
  }, [projects, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Projects</h2>
          <p className="text-muted-foreground">Define, track, and manage all your projects.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
              <DialogDescription>
                {editingProject ? "Update project details" : "Add a new project to the system"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Project Code *</Label>
                  <Input
                    id="code"
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="P-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Build Factory Shed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the project scope..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientOrDepartment">Client / Department *</Label>
                  <Input
                    id="clientOrDepartment"
                    value={formData.clientOrDepartment || ""}
                    onChange={(e) => setFormData({ ...formData, clientOrDepartment: e.target.value })}
                    placeholder="ABC Corporation / Internal R&D"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Project Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: ProjectType) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="budget">Budget (₹)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget || ""}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    placeholder="10,00,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedRevenue">Expected Revenue (₹)</Label>
                  <Input
                    id="expectedRevenue"
                    type="number"
                    value={formData.expectedRevenue || ""}
                    onChange={(e) => setFormData({ ...formData, expectedRevenue: parseFloat(e.target.value) || 0 })}
                    placeholder="15,00,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Expected Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration || ""}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 6 Months"
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="location">Location / Site</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Mumbai, Maharashtra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manager">Project Manager</Label>
                  <Input
                    id="manager"
                    value={formData.manager || ""}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map(status => (
                         <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTeam">Assigned Team</Label>
                <Textarea
                  id="assignedTeam"
                  value={formData.assignedTeam || ""}
                  onChange={(e) => setFormData({ ...formData, assignedTeam: e.target.value })}
                  placeholder="e.g., John Doe (Engineer), Jane Smith (Architect)..."
                />
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or client..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: ProjectStatus | "all") => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PROJECT_STATUSES.map(status => (
              <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects ({filteredProjects.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Client / Dept.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.code}</TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.clientOrDepartment}</TableCell>
                    <TableCell className="capitalize">{project.type}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(project.status)} variant="outline">
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="w-16" />
                        <span className="text-sm text-muted-foreground">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.budget ? `₹${(project.budget / 100000).toFixed(2)}L` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                         <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(project)}
                          title="View Details / WBS"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(project)}
                          title="Edit Project"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(project.id)}
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                     <p className="text-muted-foreground">No projects found matching your criteria.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}