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
import { Resource, Project } from "../../types/production";
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "../../utils/localStorage";
import { useToast } from "../../hooks/use-toast";

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<Partial<Resource>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const resourcesData = getFromStorage<Resource>(STORAGE_KEYS.RESOURCES);
    const projectsData = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    setResources(resourcesData);
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

    const totalCost = (formData.quantity || 0) * (formData.rate || 0);

    let updatedResources: Resource[];
    const now = new Date().toISOString();

    if (editingResource) {
      updatedResources = resources.map((r) =>
        r.id === editingResource.id
          ? { ...formData, id: r.id, totalCost, createdAt: r.createdAt } as Resource
          : r
      );
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
    } else {
      const newResource: Resource = {
        ...formData,
        id: generateId(),
        totalCost,
        availability: "available",
        createdAt: now,
      } as Resource;
      updatedResources = [...resources, newResource];
      toast({
        title: "Success",
        description: "Resource created successfully",
      });
    }

    saveToStorage(STORAGE_KEYS.RESOURCES, updatedResources);
    setResources(updatedResources);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updatedResources = resources.filter((r) => r.id !== id);
    saveToStorage(STORAGE_KEYS.RESOURCES, updatedResources);
    setResources(updatedResources);
    toast({
      title: "Success",
      description: "Resource deleted successfully",
    });
  };

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setFormData(resource);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingResource(null);
    setFormData({
      type: "labour",
      availability: "available",
    });
  };

  const getAvailabilityColor = (availability: Resource["availability"]) => {
    const colors: Record<Resource["availability"], string> = {
      available: "bg-success/10 text-success border-success/20",
      booked: "bg-warning/10 text-warning border-warning/20",
      unavailable: "bg-muted text-muted-foreground",
    };
    return colors[availability];
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Resources</h2>
          <p className="text-muted-foreground">Manage labour, equipment, and materials</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
              <DialogDescription>
                {editingResource
                  ? "Update resource details"
                  : "Add a new labour, equipment, or material resource"}
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
                    onValueChange={(value: Resource["type"]) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="labour">Labour</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Civil Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity || ""}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit || ""}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="persons"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate (₹)</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={formData.rate || ""}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                    placeholder="2000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value: Resource["availability"]) =>
                      setFormData({ ...formData, availability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedDate">Assigned Date</Label>
                  <Input
                    id="assignedDate"
                    type="date"
                    value={formData.assignedDate || ""}
                    onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Total Cost</Label>
                <Input
                  value={`₹${((formData.quantity || 0) * (formData.rate || 0)).toLocaleString()}`}
                  disabled
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Resource</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Resources ({resources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="capitalize font-medium">{resource.type}</TableCell>
                  <TableCell>{resource.name}</TableCell>
                  <TableCell className="text-muted-foreground">{getProjectName(resource.projectId)}</TableCell>
                  <TableCell>
                    {resource.quantity} {resource.unit}
                  </TableCell>
                  <TableCell>₹{resource.rate.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">₹{resource.totalCost.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getAvailabilityColor(resource.availability)} variant="outline">
                      {resource.availability}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(resource)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {resources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resources yet. Add your first resource!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
