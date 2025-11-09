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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { WBSItem, Project } from "../../types/production";
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "../../utils/localStorage";
import { useToast } from "../../hooks/use-toast";
import { Textarea } from "../../components/ui/textarea";
import { Progress } from "../../components/ui/progress";

export default function WBS() {
  const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WBSItem | null>(null);
  const [formData, setFormData] = useState<Partial<WBSItem>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const wbsData = getFromStorage<WBSItem>(STORAGE_KEYS.WBS_ITEMS);
    const projectsData = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    setWbsItems(wbsData);
    setProjects(projectsData);
  };

  const handleSave = () => {
    if (!formData.name || !formData.projectId || !formData.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    let updatedItems: WBSItem[];
    const now = new Date().toISOString();

    if (editingItem) {
      updatedItems = wbsItems.map((item) =>
        item.id === editingItem.id ? { ...formData, id: item.id, createdAt: item.createdAt } as WBSItem : item
      );
      toast({
        title: "Success",
        description: "WBS item updated successfully",
      });
    } else {
      const newItem: WBSItem = {
        ...formData,
        id: generateId(),
        assignedTeam: formData.assignedTeam || [],
        dependencies: formData.dependencies || [],
        progress: 0,
        actualCost: 0,
        status: "not-started",
        createdAt: now,
      } as WBSItem;
      updatedItems = [...wbsItems, newItem];
      toast({
        title: "Success",
        description: "WBS item created successfully",
      });
    }

    saveToStorage(STORAGE_KEYS.WBS_ITEMS, updatedItems);
    setWbsItems(updatedItems);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updatedItems = wbsItems.filter((item) => item.id !== id);
    saveToStorage(STORAGE_KEYS.WBS_ITEMS, updatedItems);
    setWbsItems(updatedItems);
    toast({
      title: "Success",
      description: "WBS item deleted successfully",
    });
  };

  const openEditDialog = (item: WBSItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      type: "phase",
      status: "not-started",
    });
  };

  const getStatusColor = (status: WBSItem["status"]) => {
    const colors: Record<WBSItem["status"], string> = {
      "not-started": "bg-muted text-muted-foreground",
      "in-progress": "bg-primary/10 text-primary border-primary/20",
      completed: "bg-success/10 text-success border-success/20",
      delayed: "bg-destructive/10 text-destructive border-destructive/20",
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
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Work Breakdown Structure
          </h2>
          <p className="text-muted-foreground">Manage project phases, activities, and tasks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New WBS Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit WBS Item" : "Create New WBS Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update WBS item details" : "Add a new phase, activity, or task"}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: WBSItem["type"]) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phase">Phase</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Foundation Work"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the work..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate || ""}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate || ""}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration || ""}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plannedCost">Planned Cost (₹)</Label>
                  <Input
                    id="plannedCost"
                    type="number"
                    value={formData.plannedCost || ""}
                    onChange={(e) => setFormData({ ...formData, plannedCost: parseFloat(e.target.value) })}
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: WBSItem["status"]) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save WBS Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All WBS Items ({wbsItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Planned Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wbsItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="capitalize font-medium">{item.type}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{getProjectName(item.projectId)}</TableCell>
                  <TableCell>{item.duration} days</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)} variant="outline">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={item.progress} className="w-16" />
                      <span className="text-sm text-muted-foreground">{item.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>₹{(item.plannedCost / 100000).toFixed(2)}L</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {wbsItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No WBS items yet. Create your first item!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
