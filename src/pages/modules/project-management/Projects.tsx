"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { toast } from "sonner";  // <-- using Sonner only
import {
  fetchProjects,
  addProject,
  updateProject,
  deleteProject,
} from "@/redux/slices/projectSlice";
import { ClipLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// ---------------- Types ----------------
type ProjectStatus =
  | "planning"
  | "active"
  | "on-hold"
  | "completed"
  | "cancelled";

type ProjectType =
  | "construction"
  | "manufacturing"
  | "internal"
  | "client-based"
  | "other";

interface Project {
  _id: string;
  code: string;
  name: string;
  description: string;
  clientOrDepartment: string;
  type: ProjectType;
  location?: string;
  budget?: number;
  expectedRevenue?: number;
  duration?: string;
  manager?: string;
  assignedTeam?: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  progress: number;
  actualCost: number;
  createdAt: string;
  updatedAt: string;
}

const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "active",
  "on-hold",
  "completed",
  "cancelled",
];

const PROJECT_TYPES: ProjectType[] = [
  "construction",
  "manufacturing",
  "internal",
  "client-based",
  "other",
];

// ---------------- Component Start ----------------
export default function Projects() {
  const userId = localStorage.getItem('userId');
  const dispatch = useDispatch<AppDispatch>();
  const { projects = [], loading } = useSelector(
    (state: RootState) => state.projects
  );
  const [color, setColor] = useState("#212121");
  // Dialog/Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({
    status: "planning",
    type: "construction",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ProjectStatus | "all">("all");

  useEffect(() => {
    if(userId){
      dispatch(fetchProjects());
    }
    
  }, [dispatch , userId]);


  const handleSave = async () => {
    if (
      !formData.code ||
      !formData.name ||
      !formData.description ||
      !formData.clientOrDepartment
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (editingProject) {
      const res = await dispatch(
        updateProject({ id: editingProject._id, data: formData })
      );

      if (updateProject.fulfilled.match(res)) {
        toast.success("Project updated successfully");
      } else {
        toast.error(res.payload || "Update failed");
      }
    } else {
      // -------- CREATE --------
      const res = await dispatch(addProject(formData));

      if (addProject.fulfilled.match(res)) {
        toast.success("Project created successfully");
      } else {
        toast.error(res.payload || "Failed to create project");
      }
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const res = await dispatch(deleteProject(id));

    if (deleteProject.fulfilled.match(res)) {
      toast.success("Project deleted");
    } else {
      toast.error(res.payload || "Delete failed");
    }
  };

  // ---------------- Helpers ----------------
  const resetForm = () => {
    setEditingProject(null);
    setFormData({ status: "planning", type: "construction" });
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData(project);
    setIsDialogOpen(true);
  };

  const filteredProjects = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];

    return list
      .filter((p) =>
        statusFilter === "all" ? true : p.status === statusFilter
      )
      .filter((p) => {
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.clientOrDepartment.toLowerCase().includes(q)
        );
      });
  }, [projects, searchTerm, statusFilter]);

  const getStatusBadge = (status: Project["status"]) => {
    const variants: Record<ProjectStatus, string> = {
      planning: "bg-blue-100 text-blue-800 border-blue-200",
      active: "bg-green-100 text-green-800 border-green-200",
      "on-hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
      completed: "bg-purple-100 text-purple-800 border-purple-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[status];
  };

  // ---------------- UI ----------------
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold">Projects</h2>
          <p className="text-muted-foreground">Manage all company projects.</p>
        </div>

        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, code, client..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects ({filteredProjects?.length ?? 0})</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-3">
                    <ClipLoader
                      color={color}
                      loading={loading}
                      size={15}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{p.code}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.clientOrDepartment}</TableCell>
                    <TableCell className="capitalize">{p.type}</TableCell>

                    <TableCell>
                      <Badge className={getStatusBadge(p.status)} variant="outline">
                        {p.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="w-16" />
                        <span>{p.progress}%</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {p.budget ? `₹${(p.budget / 100000).toFixed(2)}L` : "N/A"}
                    </TableCell>

                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)}>
                        <Pencil size={16} />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p._id)}>
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
            <DialogDescription>
              {editingProject ? "Modify project details." : "Fill project details."}
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <div className="grid gap-6 py-4">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Code *</Label>
                <Input
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div>
                <Label>Project Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Client + Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client / Department *</Label>
                <Input
                  value={formData.clientOrDepartment || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, clientOrDepartment: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Project Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val: ProjectType) =>
                    setFormData({ ...formData, type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget + Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Budget</Label>
                <Input
                  type="number"
                  value={formData.budget || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <Label>Expected Revenue</Label>
                <Input
                  type="number"
                  value={formData.expectedRevenue || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedRevenue: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Manager + Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Manager</Label>
                <Input
                  value={formData.manager || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, manager: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: ProjectStatus) =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Assigned Team</Label>
              <Textarea
                value={formData.assignedTeam || ""}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTeam: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingProject ? "Update Project" : "Save Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
