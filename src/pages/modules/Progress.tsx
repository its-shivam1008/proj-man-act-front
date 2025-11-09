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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ProgressUpdate, Project, WBSItem } from "../../types/production";
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "../../utils/localStorage";
import { useToast } from "../../hooks/use-toast";
import { Textarea } from "../../components/ui/textarea";
import { Progress as ProgressBar } from "../../components/ui/progress";

export default function Progress() {
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ProgressUpdate | null>(null);
  const [formData, setFormData] = useState<Partial<ProgressUpdate>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const updatesData = getFromStorage<ProgressUpdate>(STORAGE_KEYS.PROGRESS_UPDATES);
    const projectsData = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const wbsData = getFromStorage<WBSItem>(STORAGE_KEYS.WBS_ITEMS);
    setProgressUpdates(updatesData);
    setProjects(projectsData);
    setWbsItems(wbsData);
  };

  const handleSave = () => {
    if (!formData.projectId || !formData.wbsItemId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    let updatedProgress: ProgressUpdate[];
    const now = new Date().toISOString();

    if (editingUpdate) {
      updatedProgress = progressUpdates.map((p) =>
        p.id === editingUpdate.id
          ? { ...formData, id: p.id, createdAt: p.createdAt } as ProgressUpdate
          : p
      );
      toast({
        title: "Success",
        description: "Progress update saved successfully",
      });
    } else {
      const newUpdate: ProgressUpdate = {
        ...formData,
        id: generateId(),
        date: formData.date || now.split("T")[0],
        materialUsed: formData.materialUsed || [],
        createdAt: now,
      } as ProgressUpdate;
      updatedProgress = [...progressUpdates, newUpdate];
      toast({
        title: "Success",
        description: "Progress update created successfully",
      });
    }

    saveToStorage(STORAGE_KEYS.PROGRESS_UPDATES, updatedProgress);
    setProgressUpdates(updatedProgress);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updatedProgress = progressUpdates.filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.PROGRESS_UPDATES, updatedProgress);
    setProgressUpdates(updatedProgress);
    toast({
      title: "Success",
      description: "Progress update deleted successfully",
    });
  };

  const openEditDialog = (update: ProgressUpdate) => {
    setEditingUpdate(update);
    setFormData(update);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUpdate(null);
    setFormData({
      percentComplete: 0,
      labourHours: 0,
      equipmentHours: 0,
      materialUsed: [],
    });
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown";
  };

  const getWBSName = (wbsItemId: string) => {
    return wbsItems.find((w) => w.id === wbsItemId)?.name || "Unknown";
  };

  const filteredWbsItems = formData.projectId
    ? wbsItems.filter((w) => w.projectId === formData.projectId)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Progress Tracking</h2>
          <p className="text-muted-foreground">Monitor and record project progress updates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Progress Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUpdate ? "Edit Progress Update" : "Record Progress Update"}
              </DialogTitle>
              <DialogDescription>
                {editingUpdate ? "Update progress details" : "Record daily or weekly progress"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value, wbsItemId: undefined })
                  }
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
                <Label htmlFor="wbsItemId">WBS Item *</Label>
                <Select
                  value={formData.wbsItemId}
                  onValueChange={(value) => setFormData({ ...formData, wbsItemId: value })}
                  disabled={!formData.projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select WBS item" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredWbsItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="percentComplete">% Complete</Label>
                  <Input
                    id="percentComplete"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentComplete || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, percentComplete: parseFloat(e.target.value) })
                    }
                    placeholder="75"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="labourHours">Labour Hours</Label>
                  <Input
                    id="labourHours"
                    type="number"
                    value={formData.labourHours || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, labourHours: parseFloat(e.target.value) })
                    }
                    placeholder="40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipmentHours">Equipment Hours</Label>
                  <Input
                    id="equipmentHours"
                    type="number"
                    value={formData.equipmentHours || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, equipmentHours: parseFloat(e.target.value) })
                    }
                    placeholder="8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="updatedBy">Updated By</Label>
                <Input
                  id="updatedBy"
                  value={formData.updatedBy || ""}
                  onChange={(e) => setFormData({ ...formData, updatedBy: e.target.value })}
                  placeholder="Site Manager Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks || ""}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Progress notes, issues, or observations..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress Updates ({progressUpdates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>WBS Item</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Labour Hrs</TableHead>
                <TableHead>Equipment Hrs</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progressUpdates.map((update) => (
                <TableRow key={update.id}>
                  <TableCell className="font-medium">
                    {new Date(update.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getProjectName(update.projectId)}</TableCell>
                  <TableCell>{getWBSName(update.wbsItemId)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={update.percentComplete} className="w-20" />
                      <span className="text-sm text-muted-foreground">
                        {update.percentComplete}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{update.labourHours}</TableCell>
                  <TableCell>{update.equipmentHours}</TableCell>
                  <TableCell className="text-muted-foreground">{update.updatedBy}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(update)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(update.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {progressUpdates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No progress updates yet. Record your first progress update!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
