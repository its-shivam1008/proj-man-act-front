import { usePermission } from "@/hooks/userPermission";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, Download, Upload, BarChart3, ShieldAlert, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { Checkbox } from "../../../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { fetchSpareParts } from "@/redux/slices/plantandmachinary/sparePartsSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchWorkOrders } from "@/redux/slices/production/workOrderSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";

// --- Types ---
interface WorkCenterResource {
  id: string;
  // Spare Parts
  sparePartId?: string;
  sparePartName?: string;
  sparePartQuantity?: number;
  
  // WBS Tasks
  wbsTaskId?: string;
  wbsTaskName?: string;
  wbsTaskDuration?: number;
  
  // Projects
  projectId?: string;
  projectName?: string;
  projectAllocation?: number;
  
  // Products
  productId?: string;
  productName?: string;
  productQuantity?: number;
  
  // Common fields
  resourceType: "sparePart" | "wbsTask" | "project" | "product";
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours: number;
  actualHours: number;
  status: "planned" | "in-progress" | "completed" | "on-hold";
  notes?: string;
  startDate?: string;
  endDate?: string;
}

interface WorkCenter {
  id: string;
  code: string;
  name: string;
  description: string;
  capacity: number;
  costPerHour: number;
  efficiency: number;
  status: "active" | "maintenance" | "inactive";
  shift: "single" | "double" | "triple";
  operatorCount: number;
  location?: string;
  locationName?: string;
  // Resource fields
  sparePartId?: string;
  sparePartName?: string;
  projectId?: string;
  projectName?: string;
  wbsTaskId?: string;
  wbsTaskName?: string;
  workOrderId?: string;
  workOrderNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkCentersPageAdvanced() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux selectors
  const { items: spareParts = [] } = useSelector((state: RootState) => state.spareParts);
  const { wbs: wbsTasks = [] } = useSelector((state: RootState) => state.wbs);
  const { projects = [] } = useSelector((state: RootState) => state.projects);
  const { list: workOrders = [] } = useSelector((state: RootState) => state.workOrders);
  const { locations = [] } = useSelector((state: RootState) => state.masterData);
  
  const canView = usePermission("workCenterMgt", "view");
  const canCreate = usePermission("workCenterMgt", "create");
  const canEdit = usePermission("workCenterMgt", "edit");
  const canDelete = usePermission("workCenterMgt", "delete");
  
  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
    );
  }
  
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<WorkCenter | null>(null);
  
  // Local state for work orders from localStorage
  const [localWorkOrders, setLocalWorkOrders] = useState<any[]>([]);
  
  // Multi-select state for checkboxes
  const [selectedSpareParts, setSelectedSpareParts] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectedWbsTasks, setSelectedWbsTasks] = useState<Set<string>>(new Set());
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<Set<string>>(new Set());
  
  // Resources list
  const [resources, setResources] = useState<WorkCenterResource[]>([]);

  // Fetch data for dropdowns
  useEffect(() => {
    const organisationId = localStorage.getItem("organisationId");
    if (organisationId) {
      dispatch(fetchSpareParts({ organisationId, page: 1, limit: 100 }));
      dispatch(fetchProjects({ organisationId }));
      dispatch(fetchMasterData("location"));
      
      // Load work orders from localStorage (from Product Orders page)
      const storedWorkOrders = storage.get(STORAGE_KEYS.WORK_ORDERS, []);
      setLocalWorkOrders(storedWorkOrders);
    }
  }, [dispatch]);

  const [formData, setFormData] = useState<Omit<WorkCenter, "id" | "createdAt" | "updatedAt">>({
    code: "",
    name: "",
    description: "",
    capacity: 8,
    costPerHour: 0,
    efficiency: 100,
    status: "active",
    shift: "single",
    operatorCount: 1,
    location: "",
    locationName: "",
    sparePartId: "",
    sparePartName: "",
    projectId: "",
    projectName: "",
    wbsTaskId: "",
    wbsTaskName: "",
    workOrderId: "",
    workOrderNumber: "",
  });


  // Load
  useEffect(() => {
    const saved = storage.get<WorkCenter[]>(STORAGE_KEYS.WORK_CENTERS, []);
    setWorkCenters(saved);
  }, []);

  // Save
  const persist = (data: WorkCenter[]) => {
    storage.set(STORAGE_KEYS.WORK_CENTERS, data);
    setWorkCenters(data);
  };

  // Analytics
  const totalCenters = workCenters.length;
  const avgEfficiency = useMemo(
    () =>
      totalCenters === 0
        ? 0
        : Math.round(
          workCenters.reduce((sum, w) => sum + (w.efficiency || 0), 0) / totalCenters
        ),
    [workCenters]
  );

  const activeCenters = workCenters.filter((w) => w.status === "active").length;

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error("Please fill all required fields");
      return;
    }

    // Create work center data with resources
    const data: any = {
      id: editingCenter?.id || `WC-${Date.now()}`,
      ...formData,
      resources: resources, // Include resources array
      createdAt: editingCenter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = editingCenter
      ? workCenters.map((w) => (w.id === editingCenter.id ? data : w))
      : [...workCenters, data];

    persist(updated);
    setIsDialogOpen(false);
    toast.success(editingCenter ? "Work center updated" : "Work center created");
    resetForm();
  };

  const handleEdit = (center: any) => {
    setEditingCenter(center);
    setFormData({
      ...center,
      location: center.location?._id || center.location || "",
      locationName: center.location?.name || center.locationName || "",
    });
    
    // Load existing resources if any
    if (center.resources && Array.isArray(center.resources)) {
      setResources(center.resources);
    } else {
      // For backward compatibility with old single-resource format
      const existingResources: WorkCenterResource[] = [];
      if (center.sparePartId) {
        existingResources.push({
          id: `RES-SP-${Date.now()}`,
          resourceType: "sparePart",
          sparePartId: center.sparePartId,
          sparePartName: center.sparePartName,
          sparePartQuantity: 1,
          priority: "medium",
          estimatedHours: 0,
          actualHours: 0,
          status: "planned"
        });
      }
      if (center.projectId) {
        existingResources.push({
          id: `RES-PRJ-${Date.now()}`,
          resourceType: "project",
          projectId: center.projectId,
          projectName: center.projectName,
          projectAllocation: 100,
          priority: "medium",
          estimatedHours: 0,
          actualHours: 0,
          status: "planned"
        });
      }
      if (center.wbsTaskId) {
        existingResources.push({
          id: `RES-WBS-${Date.now()}`,
          resourceType: "wbsTask",
          wbsTaskId: center.wbsTaskId,
          wbsTaskName: center.wbsTaskName,
          wbsTaskDuration: 0,
          priority: "medium",
          estimatedHours: 0,
          actualHours: 0,
          status: "planned"
        });
      }
      if (center.workOrderId) {
        existingResources.push({
          id: `RES-WO-${Date.now()}`,
          resourceType: "product",
          productId: center.workOrderId,
          productName: center.workOrderNumber,
          productQuantity: 1,
          priority: "medium",
          estimatedHours: 0,
          actualHours: 0,
          status: "planned"
        });
      }
      setResources(existingResources);
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = workCenters.filter((w) => w.id !== id);
    persist(updated);
    toast.success("Work center deleted");
  };

  const resetForm = () => {
    setEditingCenter(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      capacity: 8,
      costPerHour: 0,
      efficiency: 100,
      status: "active",
      shift: "single",
      operatorCount: 1,
      location: "",
      locationName: "",
      sparePartId: "",
      sparePartName: "",
      projectId: "",
      projectName: "",
      wbsTaskId: "",
      wbsTaskName: "",
      workOrderId: "",
      workOrderNumber: "",
    });
    setSelectedSpareParts(new Set());
    setSelectedProjects(new Set());
    setSelectedWbsTasks(new Set());
    setSelectedWorkOrders(new Set());
    setResources([]);
  };

  // Handle checkbox toggle
  const handleCheckboxToggle = (
    type: "sparePart" | "project" | "wbsTask" | "workOrder",
    id: string,
    checked: boolean
  ) => {
    if (type === "sparePart") {
      const newSet = new Set(selectedSpareParts);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      setSelectedSpareParts(newSet);
    } else if (type === "project") {
      const newSet = new Set(selectedProjects);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      setSelectedProjects(newSet);
    } else if (type === "wbsTask") {
      const newSet = new Set(selectedWbsTasks);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      setSelectedWbsTasks(newSet);
    } else if (type === "workOrder") {
      const newSet = new Set(selectedWorkOrders);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      setSelectedWorkOrders(newSet);
    }
  };

  // Add selected resources to list
  const handleAddSelectedResources = () => {
    const newResources: WorkCenterResource[] = [];

    // Add spare parts
    selectedSpareParts.forEach((id) => {
      const part = spareParts?.find((sp) => sp._id === id);
      if (part) {
        newResources.push({
          id: `RES-SP-${Date.now()}-${id}`,
          resourceType: "sparePart",
          sparePartId: id,
          sparePartName: part.name,
          sparePartQuantity: 1,
          priority: "medium",
          estimatedHours: 0,
          actualHours: 0,
          status: "planned",
        });
      }
    });

    // Add projects
    selectedProjects.forEach((id) => {
      const project = projects?.find((p) => p._id === id);
      if (project) {
        newResources.push({
          id: `RES-PRJ-${Date.now()}-${id}`,
          resourceType: "project",
          projectId: id,
          projectName: project.name,
          projectAllocation: 100,
          priority: "medium",
          estimatedHours: 0,
          actualHours: 0,
          status: "planned",
        });
      }
    });

    // Add WBS tasks
    selectedWbsTasks.forEach((id) => {
      const task = wbsTasks?.find((t) => t._id === id);
      if (task) {
        newResources.push({
          id: `RES-WBS-${Date.now()}-${id}`,
          resourceType: "wbsTask",
          wbsTaskId: id,
          wbsTaskName: task.name,
          wbsTaskDuration: 0,
          priority: "medium",
          estimatedHours: 0,
          actualHours: 0,
          status: "planned",
        });
      }
    });

    // Add work orders
    selectedWorkOrders.forEach((id) => {
      const wo = localWorkOrders?.find((w) => w.id === id);
      if (wo) {
        newResources.push({
          id: `RES-WO-${Date.now()}-${id}`,
          resourceType: "product",
          productId: id,
          productName: wo.orderNo,
          productQuantity: 1,
          priority: "medium",
          estimatedHours: 0,
          actualHours: 0,
          status: "planned",
        });
      }
    });

    if (newResources.length === 0) {
      toast.error("Please select at least one resource");
      return;
    }

    setResources([...resources, ...newResources]);
    // Clear selections
    setSelectedSpareParts(new Set());
    setSelectedProjects(new Set());
    setSelectedWbsTasks(new Set());
    setSelectedWorkOrders(new Set());
    toast.success(`${newResources.length} resource(s) added`);
  };

  // Remove resource
  const handleRemoveResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
    toast.success("Resource removed");
  };



  // Filtering & search
  const filtered = workCenters.filter(
    (w) =>
      (filterStatus === "all" || w.status === filterStatus) &&
      (w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Simulate performance trend data
  const trendData = useMemo(
    () =>
      workCenters.map((w) => ({
        name: w.name,
        efficiency: w.efficiency,
        cost: Math.round(w.costPerHour * w.capacity),
      })),
    [workCenters]
  );

  // Export / Import
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(workCenters, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "work_centers.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      persist(parsed);
      toast.success("Work centers imported successfully");
    } else toast.error("Invalid file format");
  };

  const totalCostPerDay = (center: WorkCenter) =>
    center.costPerHour * center.capacity * center.operatorCount;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Centers</h1>
          <p className="text-muted-foreground">
            Manage production machines, resources, and performance
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              // className="text-white"
              disabled={!canCreate}
              onClick={() => canCreate && setIsDialogOpen(true)}
              className={!canCreate ? "opacity-50 cursor-not-allowed" : "text-white"}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Work Center
            </Button>

          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCenter ? "Edit Work Center" : "Add Work Center"}
              </DialogTitle>
            </DialogHeader>
            <div
              className="space-y-4"
              style={{
                pointerEvents: editingCenter
                  ? (canEdit ? "auto" : "none")
                  : (canCreate ? "auto" : "none"),
                opacity: editingCenter
                  ? (canEdit ? 1 : 0.6)
                  : (canCreate ? 1 : 0.6),
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Capacity (hrs/day)</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Cost/hour</Label>
                  <Input
                    type="number"
                    value={formData.costPerHour}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPerHour: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Efficiency (%)</Label>
                  <Input
                    type="number"
                    value={formData.efficiency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        efficiency: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: any) =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shift</Label>
                  <Select
                    value={formData.shift}
                    onValueChange={(v: any) =>
                      setFormData({ ...formData, shift: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Operators</Label>
                <Input
                  type="number"
                  value={formData.operatorCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operatorCount: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => {
                    const selectedLocation = locations.find((loc) => loc._id === value);
                    setFormData({
                      ...formData,
                      location: value,
                      locationName: selectedLocation?.name || "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location._id} value={location._id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resources Section with Checkboxes */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Work Center Resources</h3>
                
                <Tabs defaultValue="sparePart" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="sparePart">Spare Parts</TabsTrigger>
                    <TabsTrigger value="project">Projects</TabsTrigger>
                    <TabsTrigger value="wbsTask">WBS Tasks</TabsTrigger>
                    <TabsTrigger value="workOrder">Work Orders</TabsTrigger>
                  </TabsList>

                  {/* Spare Parts Tab */}
                  <TabsContent value="sparePart" className="space-y-2">
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {spareParts && spareParts.length > 0 ? (
                        spareParts.map((part) => (
                          <div key={part._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={`sp-${part._id}`}
                              checked={selectedSpareParts.has(part._id)}
                              onCheckedChange={(checked) =>
                                handleCheckboxToggle("sparePart", part._id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`sp-${part._id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {part.name} ({part.code})
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">No spare parts available</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedSpareParts.size} selected
                    </div>
                  </TabsContent>

                  {/* Projects Tab */}
                  <TabsContent value="project" className="space-y-2">
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {projects && projects.length > 0 ? (
                        projects.map((project) => (
                          <div key={project._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={`prj-${project._id}`}
                              checked={selectedProjects.has(project._id)}
                              onCheckedChange={(checked) => {
                                handleCheckboxToggle("project", project._id, checked as boolean);
                                // Fetch WBS tasks when project is selected
                                if (checked) {
                                  dispatch(fetchWbsByProject(project._id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`prj-${project._id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {project.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">No projects available</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedProjects.size} selected
                    </div>
                  </TabsContent>

                  {/* WBS Tasks Tab */}
                  <TabsContent value="wbsTask" className="space-y-2">
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {wbsTasks && wbsTasks.length > 0 ? (
                        wbsTasks.map((task) => (
                          <div key={task._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={`wbs-${task._id}`}
                              checked={selectedWbsTasks.has(task._id)}
                              onCheckedChange={(checked) =>
                                handleCheckboxToggle("wbsTask", task._id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`wbs-${task._id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {task.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">
                          {selectedProjects.size > 0 ? "No WBS tasks available" : "Select a project first"}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedWbsTasks.size} selected
                    </div>
                  </TabsContent>

                  {/* Work Orders Tab */}
                  <TabsContent value="workOrder" className="space-y-2">
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {localWorkOrders && localWorkOrders.length > 0 ? (
                        localWorkOrders.map((wo) => (
                          <div key={wo.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={`wo-${wo.id}`}
                              checked={selectedWorkOrders.has(wo.id)}
                              onCheckedChange={(checked) =>
                                handleCheckboxToggle("workOrder", wo.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`wo-${wo.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {wo.orderNo} - {wo.productName}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">No work orders available</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedWorkOrders.size} selected
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Add Selected Button */}
                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={handleAddSelectedResources}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Selected Resources
                  </Button>
                </div>

                {/* Added Resources List */}
                {resources.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Added Resources ({resources.length})</Label>
                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {resources.map((resource) => (
                        <div key={resource.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                resource.resourceType === "sparePart" ? "bg-blue-100 text-blue-800" :
                                resource.resourceType === "project" ? "bg-green-100 text-green-800" :
                                resource.resourceType === "wbsTask" ? "bg-purple-100 text-purple-800" :
                                "bg-orange-100 text-orange-800"
                              }`}>
                                {resource.resourceType === "sparePart" ? "Spare Part" :
                                 resource.resourceType === "project" ? "Project" :
                                 resource.resourceType === "wbsTask" ? "WBS Task" : "Work Order"}
                              </span>
                              <span className="font-medium text-sm">
                                {resource.sparePartName || resource.projectName || resource.wbsTaskName || resource.productName}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveResource(resource.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() =>
                  (editingCenter ? canEdit : canCreate) && handleSave()
                }
                disabled={editingCenter ? !canEdit : !canCreate}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              >
                {editingCenter ? "Update" : "Save"}
              </Button>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search work centers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          disabled={!canView}
          onClick={() => canView && handleExport()}
        >
          <Download className="mr-2 w-4 h-4" /> Export
        </Button>
        <label>
          <input
            type="file"
            hidden
            disabled={!canView}
            onChange={(e) => canView && e.target.files && handleImport(e.target.files[0])}
          />
          <Button disabled={!canView} variant="outline">
            <Upload className="mr-2 w-4 h-4" /> Import
          </Button>
        </label>
      </div>

      {/* Analytics */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Centers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{totalCenters}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Centers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl text-green-500">
            {activeCenters}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl text-indigo-500">
            {avgEfficiency}%
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Efficiency vs Cost Trend</CardTitle>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="efficiency" fill="#6366f1" />
              <Bar dataKey="cost" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards */}
      <AnimatePresence>
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No work centers found.
            </CardContent>
          </Card>
        ) : (
          filtered.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle>{c.name}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          c.status === "active" ? "bg-green-100 text-green-800" :
                          c.status === "maintenance" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {c.status === "active" ? "Active" :
                           c.status === "maintenance" ? "Maintenance" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => canEdit && handleEdit(c)}
                        className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        disabled={!canDelete}
                        onClick={() => canDelete && handleDelete(c.id)}
                        className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
                      >

                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{c.description}</p>
                  
                  {/* Resources Section - Show new resources array or legacy single resources */}
                  {((c as any).resources && (c as any).resources.length > 0) ? (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Resources ({(c as any).resources.length}):</h4>
                      <div className="space-y-1 text-xs">
                        {(c as any).resources.map((resource: WorkCenterResource) => (
                          <div key={resource.id} className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded font-medium ${
                              resource.resourceType === "sparePart" ? "bg-blue-100 text-blue-800" :
                              resource.resourceType === "project" ? "bg-green-100 text-green-800" :
                              resource.resourceType === "wbsTask" ? "bg-purple-100 text-purple-800" :
                              "bg-orange-100 text-orange-800"
                            }`}>
                              {resource.resourceType === "sparePart" ? "Spare Part" :
                               resource.resourceType === "project" ? "Project" :
                               resource.resourceType === "wbsTask" ? "WBS Task" : "Work Order"}
                            </span>
                            <span>
                              {resource.sparePartName || resource.projectName || resource.wbsTaskName || resource.productName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (c.sparePartName || c.projectName || c.wbsTaskName || c.workOrderNumber) ? (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Resources (Legacy):</h4>
                      <div className="space-y-1 text-xs">
                        {c.sparePartName && (
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">Spare Part</span>
                            <span>{c.sparePartName}</span>
                          </div>
                        )}
                        {c.projectName && (
                          <div className="flex items-center gap-2">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">Project</span>
                            <span>{c.projectName}</span>
                          </div>
                        )}
                        {c.wbsTaskName && (
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">WBS Task</span>
                            <span>{c.wbsTaskName}</span>
                          </div>
                        )}
                        {c.workOrderNumber && (
                          <div className="flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">Work Order</span>
                            <span>{c.workOrderNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <p>Shift: <strong>{c.shift}</strong></p>
                    <p>Operators: <strong>{c.operatorCount}</strong></p>
                    <p>Efficiency: <strong>{c.efficiency}%</strong></p>
                    <p>Daily Cost: <strong>₹{totalCostPerDay(c).toLocaleString()}</strong></p>
                    {(c.locationName || (c as any).location?.name) && (
                      <p className="col-span-2">Location: <strong>{c.locationName || (c as any).location?.name}</strong></p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
