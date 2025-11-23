import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { RootState, AppDispatch } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchProjects,
} from "@/redux/slices/projectSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, DollarSign, Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import {
  fetchResources,
  addResource,
  updateResource,
  deleteResource,
} from "@/redux/slices/resourceSlice";

// --- Define Types ---

interface ResourceAllocation {
  id: string;
  projectId: string;
  wbsId: string;
  resourceType: "equipment"; // Restricted to equipment
  resourceName: string;
  resourceId: string;
  quantity: string;
  rate: string;
  unit: string;
  duration: string;
  durationUnit: string;
  _id?: string;
  totalCost: number;
  wbsName?: string;
  createdAt?: string;
}

interface AllocationFormState {
  wbsId: string;
  resourceType: string;
  resourceName: string;
  resourceId: string;
  quantity: string;
  rate: string;
  unit: string;
  duration: string;
  durationUnit: string;
}

// Default resourceType set to "equipment"
const EMPTY_FORM: AllocationFormState = {
  wbsId: "",
  resourceType: "equipment",
  resourceName: "",
  resourceId: "",
  quantity: "",
  rate: "",
  unit: "",
  duration: "",
  durationUnit: "hours",
};

const DEFAULT_PROJECT_QUERY = {
  page: 1,
  limit: 50,
  status: "all",
  search: "",
};

export default function Resources() {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const { projects } = useSelector((state: RootState) => state.projects);
  const { wbs, loading: wbsLoading } = useSelector((state: RootState) => state.wbs);
  const {
    resources,
    loading: resourcesLoading,
  } = useSelector((state: RootState) => state.resources);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<ResourceAllocation | null>(null);
  const [formData, setFormData] = useState<AllocationFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!projects.length) {
      dispatch(fetchProjects(DEFAULT_PROJECT_QUERY as any));
    }
  }, [dispatch, projects.length]);

  useEffect(() => {
    if (!selectedProjectId && projects.length) {
      setSelectedProjectId(projects[0]._id ?? projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWbsByProject(selectedProjectId));
      dispatch(fetchResources(selectedProjectId));
    }
  }, [dispatch, selectedProjectId]);

  const selectedProject = useMemo(() => {
    return projects.find((p: any) => (p._id ?? p.id) === selectedProjectId);
  }, [projects, selectedProjectId]);

  const projectWBSItems = useMemo(() => {
    if (!selectedProjectId) return [];
    return wbs.filter((item) => item.projectId === selectedProjectId);
  }, [wbs, selectedProjectId]);

  const calculatedTotalCost = useMemo(() => {
    const quantity = Number(formData.quantity) || 0;
    const rate = Number(formData.rate) || 0;
    const duration = Number(formData.duration) || 0;

    return quantity * rate * duration;
  }, [formData]);

  const resetForm = () => {
    setEditingAllocation(null);
    setFormData(EMPTY_FORM);
    setSubmitting(false);
  };

  const openCreateDialog = () => {
    if (!selectedProjectId) return;
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (allocation: ResourceAllocation) => {
    setEditingAllocation(allocation);
    setFormData({
      wbsId: allocation.wbsId,
      resourceType: allocation.resourceType,
      resourceId: allocation.resourceId,
      resourceName: allocation.resourceName,
      quantity: allocation.quantity.toString(),
      rate: allocation.rate.toString(),
      unit: allocation.unit,
      duration: allocation.duration.toString(),
      durationUnit: allocation.durationUnit,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProjectId) return;

    if (
      !formData.wbsId ||
      !formData.resourceType ||
      !formData.resourceName.trim() ||
      !formData.resourceId.trim() ||
      !formData.unit.trim() ||
      !formData.quantity ||
      !formData.rate ||
      !formData.duration
    ) {
      toast({
        title: "Validation error",
        description: "Please fill every required field.",
        variant: "destructive",
      });
      return;
    }

    const wbsItem = projectWBSItems.find((item) => item.id === formData.wbsId || item._id === formData.wbsId);
    if (!wbsItem) {
      toast({
        title: "Invalid WBS",
        description: "Selected WBS item is not available.",
        variant: "destructive",
      });
      return;
    }

    const quantity = Number(formData.quantity);
    const rate = Number(formData.rate);
    const duration = Number(formData.duration);

    if (Number.isNaN(quantity) || Number.isNaN(rate) || Number.isNaN(duration)) {
      toast({
        title: "Validation error",
        description: "Quantity, rate and duration must be numeric.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      projectId: selectedProjectId,
      wbsId: wbsItem.id ?? wbsItem._id,
      wbsName: wbsItem.name,
      resourceType: "equipment", // Hardcoded to equipment
      resourceName: formData.resourceName.trim(),
      resourceId: formData.resourceId.trim(),
      quantity,
      rate,
      unit: formData.unit.trim(),
      duration,
      durationUnit: formData.durationUnit.trim() || "hours",
      totalCost: quantity * rate * duration,
      startDate: wbsItem.startDate,
      endDate: wbsItem.endDate,
      createdAt: editingAllocation?.createdAt ?? new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      if (editingAllocation) {
        await dispatch(
          updateResource({ id: editingAllocation._id!, data: payload })
        ).unwrap();
        toast({ title: "Success", description: "Allocation updated successfully." });
      } else {
        await dispatch(addResource(payload)).unwrap();
        toast({ title: "Success", description: "Allocation created successfully." });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({
        title: "Request failed",
        description: err ?? "Please try again later.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this allocation?")) return;
    try {
      await dispatch(deleteResource(id)).unwrap();
      toast({ title: "Deleted", description: "Allocation deleted." });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err ?? "Unable to delete allocation.",
        variant: "destructive",
      });
    }
  };

  const handleResourceTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      resourceType: value,
      durationUnit: "hours", // Default for equipment
    }));
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    resetForm();
  };

  // Filter resources to only show Equipment in the table as well
  const allocationsForView = selectedProjectId 
    ? resources.filter((r) => r.resourceType === "equipment") 
    : [];

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId, resources.length]);

  const totalPages = Math.max(1, Math.ceil(allocationsForView.length / PAGE_SIZE));

  const paginatedAllocations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return allocationsForView.slice(start, start + PAGE_SIZE);
  }, [allocationsForView, currentPage]);

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );

  const handlePageChange = (direction: "prev" | "next") => {
    setCurrentPage((prev) => {
      if (direction === "prev") return Math.max(1, prev - 1);
      return Math.min(totalPages, prev + 1);
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Equipment Planning & Allocation
          </h2>
          <p className="text-muted-foreground">
            Create, update and delete equipment allocations.
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <Select
            value={selectedProjectId || undefined}
            onValueChange={handleProjectChange}
            disabled={!projects.length}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project: any) => {
                const value = project._id ?? project.id;
                return (
                  <SelectItem key={value} value={value}>
                    {project.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openCreateDialog}
                disabled={!selectedProjectId || !projectWBSItems.length}
                className="w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Allocation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAllocation ? "Edit allocation" : "Create allocation"}
                </DialogTitle>
                <DialogDescription>
                  Assign equipment to a specific WBS task.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>WBS Task *</Label>
                    <Select
                      value={formData.wbsId || undefined}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, wbsId: value }))
                      }
                      disabled={!projectWBSItems.length || wbsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={wbsLoading ? "Loading..." : "Select WBS"} />
                      </SelectTrigger>
                      <SelectContent>
                        {projectWBSItems.length ? (
                          projectWBSItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground">
                            No WBS items available for this project.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Resource Type *</Label>
                    <Select
                      value={formData.resourceType}
                      onValueChange={(value) => handleResourceTypeChange(value)}
                      disabled // Disabled since it's only equipment now
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Equipment Name *</Label>
                    <Input
                      value={formData.resourceName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, resourceName: e.target.value }))
                      }
                      placeholder="e.g. Crane - 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Equipment Code / ID *</Label>
                    <Input
                      value={formData.resourceId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, resourceId: e.target.value }))
                      }
                      placeholder="Unique identifier"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                      }
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate (₹) *</Label>
                    <Input
                      type="number"
                      value={formData.rate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, rate: e.target.value }))
                      }
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration *</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, duration: e.target.value }))
                      }
                      placeholder="8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration Unit *</Label>
                    <Input
                      value={formData.durationUnit}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, durationUnit: e.target.value }))
                      }
                      placeholder="hours"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unit *</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, unit: e.target.value }))
                      }
                      placeholder="e.g. machine-hours"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Cost</Label>
                    <Input
                      value={`₹ ${calculatedTotalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                      disabled
                      className="font-semibold"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Allocation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedProject && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Project Cost Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-sm">Original Budget</Label>
                <p className="text-2xl font-bold">
                  ₹ {(selectedProject.budget ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-sm">Total Allocated Cost</Label>
                <p className="text-2xl font-bold">
                  ₹ {(selectedProject.actualCost ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-full ${
                  (selectedProject.actualCost ?? 0) > (selectedProject.budget ?? 0)
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-sm">Remaining Budget</Label>
                <p
                  className={`text-2xl font-bold ${
                    (selectedProject.actualCost ?? 0) > (selectedProject.budget ?? 0)
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  ₹ {((selectedProject.budget ?? 0) - (selectedProject.actualCost ?? 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resource Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WBS Task</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedProjectId ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Please select a project first.
                  </TableCell>
                </TableRow>
              ) : resourcesLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Loading allocations...
                  </TableCell>
                </TableRow>
              ) : !allocationsForView.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No equipment allocations for this project yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAllocations.map((alloc) => (
                  <TableRow key={alloc._id}>
                    <TableCell className="font-medium">{alloc.wbsName}</TableCell>
                    <TableCell>{alloc.resourceName}</TableCell>
                    <TableCell className="capitalize">{alloc.resourceType}</TableCell>
                    <TableCell>{alloc.quantity}</TableCell>
                    <TableCell>₹{alloc.rate.toLocaleString()}</TableCell>
                    <TableCell>
                      {alloc.duration} {alloc.durationUnit}
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{alloc.totalCost.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(alloc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(alloc._id!)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {allocationsForView.length > PAGE_SIZE && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("prev")}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {pageNumbers.map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("next")}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}