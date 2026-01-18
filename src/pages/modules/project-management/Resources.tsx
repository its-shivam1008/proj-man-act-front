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
import { AlertTriangle, DollarSign, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import {
  fetchResources,
  addResource,
  updateResource,
  deleteResource,
} from "@/redux/slices/resourceSlice";
import { fetchEquipments } from "@/redux/slices/equipmentSlice";
import { fetchMachineries } from "@/redux/slices/plantandmachinary/machinerySlice";
import { usePermission } from "@/hooks/userPermission";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";

// --- Define Types ---

interface ResourceAllocation {
  id: string;
  projectId: string;
  wbsId: string;
  resourceType: "equipment" | "machinery";
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
  startDate?: string;
  endDate?: string;
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
  startDate: string; 
  endDate: string;
}

// Default resourceType set to "equipment"
const EMPTY_FORM: AllocationFormState = {
  wbsId: "",
  resourceType: "equipment",
  resourceName: "",
  resourceId: "",
  quantity: "",
  rate: "",
  unit: "days", // Default unit for date-based calculation
  duration: "",
  durationUnit: "days",
  startDate: "",
  endDate: ""
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
  const { equipments } = useSelector((state: RootState) => state.equipment);
  const { machineries } = useSelector((state: RootState) => state.machinery);
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);

  const canView = usePermission('resources', 'view');
  const canCreate = usePermission('resources', 'create');
  const canEdit = usePermission('resources', 'edit');
  const canDelete = usePermission('resources', 'delete');

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<ResourceAllocation | null>(null);
  const [formData, setFormData] = useState<AllocationFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const PAGE_SIZE = 10;

  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  useEffect(() => {
    if (!projects.length) {
      dispatch(fetchProjects(DEFAULT_PROJECT_QUERY as any));
    }
    // Fetch equipments and machineries for dropdown (now includes availability data)
    dispatch(fetchEquipments({ page: 1, limit: 100 }));
    dispatch(fetchMachineries({ page: 1, limit: 100 }));
    dispatch(fetchMasterData("location"));
  }, [dispatch, projects.length]);

  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
  };

  useEffect(() => {
    dispatch(
      fetchProjects({
        ...DEFAULT_PROJECT_QUERY,
        location: locationFilter,
      } as any)
    );
  }, [locationFilter]);

  useEffect(() => {
    if (!selectedProjectId && projects.length) {
      setSelectedProjectId(projects[0]._id ?? projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWbsByProject(selectedProjectId));
      dispatch(fetchResources({ projectId: selectedProjectId, search }));
    }
  }, [dispatch, selectedProjectId, search]);


  const selectedProject = useMemo(() => {
    return projects.find((p: any) => (p._id ?? p.id) === selectedProjectId);
  }, [projects, selectedProjectId]);

  const projectWBSItems = useMemo(() => {
    if (!selectedProjectId) return [];
    return wbs.filter((item) => item.projectId === selectedProjectId);
  }, [wbs, selectedProjectId]);

  // --- Auto-calculate Duration based on Dates ---
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive of start day
        
        if (!isNaN(diffDays) && diffDays > 0) {
            setFormData(prev => ({
                ...prev,
                duration: diffDays.toString(),
                durationUnit: 'days',
                unit: 'days'
            }));
        } else {
            // Invalid date range logic (optional reset)
            setFormData(prev => ({ ...prev, duration: "0" }));
        }
    }
  }, [formData.startDate, formData.endDate]);

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
      startDate: allocation.startDate || "",
      endDate: allocation.endDate || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProjectId) return;

    // Validation
    if (
        !formData.wbsId ||
        !formData.resourceType ||
        !formData.resourceName.trim() ||
        !formData.resourceId.trim() ||
        !formData.quantity ||
        !formData.startDate || 
        !formData.endDate
      ) {
        toast({
          title: "Validation error",
          description: "Please fill all required fields including Start and End dates.",
          variant: "destructive",
        });
        return;
      }

    const wbsItem = projectWBSItems.find((w) => w.id === formData.wbsId || w._id === formData.wbsId);
    if (!wbsItem) {
        toast({ title: "Error", description: "Invalid WBS selected", variant: "destructive" });
        return;
    }

    const quantity = Number(formData.quantity);
    const rate = Number(formData.rate);
    const duration = Number(formData.duration);

    if (quantity <= 0 || duration <= 0) {
        toast({ title: "Error", description: "Quantity and Duration must be greater than 0", variant: "destructive" });
        return;
    }

    const payload = {
        projectId: selectedProjectId,
        wbsId: wbsItem.id ?? wbsItem._id,
        wbsName: wbsItem.name,
        resourceType: formData.resourceType,
        resourceName: formData.resourceName.trim(),
        resourceId: formData.resourceId.trim(),
        quantity,
        rate,
        unit: formData.unit.trim(),
        duration,
        durationUnit: formData.durationUnit.trim() || "days",
        totalCost: quantity * rate * duration,
        startDate: formData.startDate,
        endDate: formData.endDate,
        createdAt: editingAllocation?.createdAt ?? new Date().toISOString(),
    };

    setSubmitting(true);
    try {
        if (editingAllocation) {
            await dispatch(updateResource({ id: editingAllocation._id!, data: payload })).unwrap();
            toast({ title: "Success", description: "Allocation updated successfully." });
        } else {
             await dispatch(addResource(payload)).unwrap();
             toast({ title: "Success", description: "Resource allocated successfully." });
        }
        setIsDialogOpen(false);
        resetForm();
    } catch (err: any) {
      toast({
        title: "Allocation Failed",
        description: err ?? "Insufficient quantity or server error.",
        variant: "destructive",
      });
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this allocation? This will free up the resource.")) return;
    try {
      await dispatch(deleteResource(id)).unwrap();
      toast({ title: "Deleted", description: "Allocation deleted and resource freed." });
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
      resourceName: "",
      resourceId: "",
      rate: "",
      durationUnit: "days",
      unit: "days"
    }));
  };

  const handleEquipmentSelect = (equipmentId: string) => {
    const selectedEquipment = equipments.find((eq) => eq._id === equipmentId || eq.code === equipmentId);
    if (selectedEquipment) {
      setFormData((prev) => ({
        ...prev,
        resourceName: selectedEquipment.name,
        resourceId: selectedEquipment._id, // Prefer _id for backend checks
        rate: selectedEquipment.cost?.toString() || "",
      }));
    }
  };

  const handleMachinerySelect = (machineryId: string) => {
    const selectedMachinery = machineries.find((m) => m._id === machineryId || m.code === machineryId);
    if (selectedMachinery) {
      setFormData((prev) => ({
        ...prev,
        resourceName: selectedMachinery.name,
        resourceId: selectedMachinery._id, // Prefer _id
        rate: selectedMachinery.unitCost?.toString() || "",
      }));
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    resetForm();
  };

  // Show both Equipment and Machinery in the table
  const allocationsForView = selectedProjectId
    ? resources.filter((r) => r.resourceType === "equipment" || r.resourceType === "machinery")
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

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Resource Planning & Allocation
          </h2>
          <p className="text-muted-foreground">
            Manage equipment allocations with real-time availability checks.
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <Select disabled={isLocationRestricted} value={locationFilter} onValueChange={handleLocationFilterChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc: any) => (
                <SelectItem key={loc._id} value={loc._id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {canCreate && <Button
                onClick={openCreateDialog}
                disabled={!selectedProjectId || !projectWBSItems.length}
                className="w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Allocation
              </Button>}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAllocation ? "Edit allocation" : "Create allocation"}
                </DialogTitle>
                <DialogDescription>
                  Check availability and assign resources for specific dates.
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
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="machinery">Machinery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>
                      {formData.resourceType === "machinery" ? "Select Machinery *" : "Select Equipment *"}
                    </Label>
                    <Select
                      value={formData.resourceId || undefined}
                      onValueChange={formData.resourceType === "machinery" ? handleMachinerySelect : handleEquipmentSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.resourceType === "machinery" ? "Search Machinery..." : "Search Equipment..."}>
                          {formData.resourceName || "Select Item"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {formData.resourceType === "machinery" ? (
                          machineries.length ? (
                            machineries.map((machinery) => (
                              <SelectItem key={machinery._id || machinery.code} value={machinery._id || machinery.code}>
                                <span className="flex justify-between w-full gap-4">
                                  <span>{machinery.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                     (Avail: {(machinery as any).availableQuantity ?? machinery.quantity ?? '-'})
                                  </span>
                                </span>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-3 text-sm text-muted-foreground">No machinery available.</div>
                          )
                        ) : (
                          equipments.length ? (
                            equipments.map((equipment) => (
                              <SelectItem key={equipment._id || equipment.code} value={equipment._id || equipment.code}>
                                <span className="flex justify-between w-full gap-4">
                                  <span>{equipment.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    (Avail: {(equipment as any).availableQuantity ?? (equipment as any).quantity ?? '-'})
                                  </span>
                                </span>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-3 text-sm text-muted-foreground">No equipment available.</div>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
                    <div className="space-y-2">
                        <Label>Start Date *</Label>
                        <Input 
                            type="date" 
                            value={formData.startDate} 
                            onChange={(e) => setFormData(prev => ({...prev, startDate: e.target.value}))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date *</Label>
                        <Input 
                            type="date" 
                            value={formData.endDate} 
                            onChange={(e) => setFormData(prev => ({...prev, endDate: e.target.value}))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Duration (Days)</Label>
                        <Input 
                            value={formData.duration} 
                            disabled 
                            className="bg-gray-100 font-medium"
                            placeholder="Auto-calculated"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity Needed *</Label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                      }
                      placeholder="e.g. 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate (₹) / Day</Label>
                    <Input
                      type="number"
                      value={formData.rate}
                      disabled
                      placeholder="Auto-filled"
                      className="bg-gray-50"
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
                      className="font-bold bg-blue-50 text-blue-700"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={submitting}>
                    {submitting ? "Processing..." : editingAllocation ? "Update Allocation" : "Allocate Resource"}
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
                className={`p-3 rounded-full ${(selectedProject.actualCost ?? 0) > (selectedProject.budget ?? 0)
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
                  }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-sm">Remaining Budget</Label>
                <p
                  className={`text-2xl font-bold ${(selectedProject.actualCost ?? 0) > (selectedProject.budget ?? 0)
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
          <div className="flex justify-between items-center">
            <CardTitle>Resource Allocations</CardTitle>
            <Input
              placeholder="Search Resource..."
              className="w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WBS Task</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Allocation Dates</TableHead>
                <TableHead>Qty</TableHead>
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
                    No resource allocations for this project yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAllocations.map((alloc) => (
                  <TableRow key={alloc._id}>
                    <TableCell className="font-medium">{alloc.wbsName}</TableCell>
                    <TableCell>{alloc.resourceName}</TableCell>
                    <TableCell className="capitalize">{alloc.resourceType}</TableCell>
                    <TableCell>
                         <div className="flex flex-col text-sm">
                             <span>From: {alloc.startDate || 'N/A'}</span>
                             <span className="text-muted-foreground">To: {alloc.endDate || 'N/A'}</span>
                         </div>
                    </TableCell>
                    <TableCell>{alloc.quantity}</TableCell>
                    <TableCell>
                      {alloc.duration} {alloc.durationUnit}
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{alloc.totalCost.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit && <Button variant="ghost" size="icon" onClick={() => openEditDialog(alloc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>}
                        {canDelete && <Button variant="ghost" size="icon" onClick={() => handleDelete(alloc._id!)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>}
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