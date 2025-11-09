import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Plus, Pencil, Trash2, Flag } from "lucide-react";
import { Milestone, Project } from "../../types/production";
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "../../utils/localStorage";
import { useToast } from "../../hooks/use-toast";
import { Textarea } from "../../components/ui/textarea";

export default function Milestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState<Partial<Milestone>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const milestonesData = getFromStorage<Milestone>(STORAGE_KEYS.MILESTONES);
    const projectsData = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    setMilestones(milestonesData);
    setProjects(projectsData);
  };

  const handleSave = () => {
    if (!formData.name || !formData.projectId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    let updatedMilestones: Milestone[];
    const now = new Date().toISOString();

    if (editingMilestone) {
      updatedMilestones = milestones.map((m) =>
        m.id === editingMilestone.id
          ? { ...formData, id: m.id, createdAt: m.createdAt } as Milestone
          : m
      );
      toast({
        title: "Success",
        description: "Milestone updated successfully",
      });
    } else {
      const newMilestone: Milestone = {
        ...formData,
        id: generateId(),
        status: "pending",
        billingStatus: "not-billed",
        createdAt: now,
      } as Milestone;
      updatedMilestones = [...milestones, newMilestone];
      toast({
        title: "Success",
        description: "Milestone created successfully",
      });
    }

    saveToStorage(STORAGE_KEYS.MILESTONES, updatedMilestones);
    setMilestones(updatedMilestones);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updatedMilestones = milestones.filter((m) => m.id !== id);
    saveToStorage(STORAGE_KEYS.MILESTONES, updatedMilestones);
    setMilestones(updatedMilestones);
    toast({
      title: "Success",
      description: "Milestone deleted successfully",
    });
  };

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData(milestone);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingMilestone(null);
    setFormData({
      status: "pending",
      billingStatus: "not-billed",
    });
  };

  const getStatusColor = (status: Milestone["status"]) => {
    const colors: Record<Milestone["status"], string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      achieved: "bg-success/10 text-success border-success/20",
      delayed: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return colors[status];
  };

  const getBillingColor = (status: Milestone["billingStatus"]) => {
    const colors: Record<Milestone["billingStatus"], string> = {
      "not-billed": "bg-muted text-muted-foreground",
      billed: "bg-primary/10 text-primary border-primary/20",
      paid: "bg-success/10 text-success border-success/20",
    };
    return colors[status];
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Milestones</h2>
          <p className="text-muted-foreground">Track project milestones and billing events</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMilestone ? "Edit Milestone" : "Create New Milestone"}</DialogTitle>
              <DialogDescription>
                {editingMilestone
                  ? "Update milestone details"
                  : "Add a new project milestone or billing event"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Milestone Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Foundation Completion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details about this milestone..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate || ""}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value (₹)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value || ""}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentValue">% Value</Label>
                  <Input
                    id="percentValue"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentValue || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, percentValue: parseFloat(e.target.value) })
                    }
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Milestone["status"]) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="achieved">Achieved</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingStatus">Billing Status</Label>
                  <Select
                    value={formData.billingStatus}
                    onValueChange={(value: Milestone["billingStatus"]) =>
                      setFormData({ ...formData, billingStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-billed">Not Billed</SelectItem>
                      <SelectItem value="billed">Billed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievedDate">Achieved Date</Label>
                  <Input
                    id="achievedDate"
                    type="date"
                    value={formData.achievedDate || ""}
                    onChange={(e) => setFormData({ ...formData, achievedDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Milestone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Milestones ({milestones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>% Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((milestone) => (
                <TableRow key={milestone.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-primary" />
                      <span className="font-medium">{milestone.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getProjectName(milestone.projectId)}</TableCell>
                  <TableCell>{new Date(milestone.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>₹{(milestone.value / 100000).toFixed(2)}L</TableCell>
                  <TableCell>{milestone.percentValue}%</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(milestone.status)} variant="outline">
                      {milestone.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getBillingColor(milestone.billingStatus)} variant="outline">
                      {milestone.billingStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(milestone)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(milestone.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {milestones.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No milestones yet. Create your first milestone!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
