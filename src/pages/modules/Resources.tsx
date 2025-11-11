import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, DollarSign, AlertTriangle } from "lucide-react";
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "@/utils/localStorage"; // Corrected import path
import { useToast } from "@/hooks/use-toast";

// --- Mock Master Data Keys ---
// These simulate data from other modules
const MOCK_DATA_KEYS = {
  HR_MANPOWER: "erp_master_manpower",
  INVENTORY_ITEMS: "erp_master_inventory",
  ASSETS_EQUIPMENT: "erp_master_assets",
};

// --- Define Types ---
// (Ideally, these would be in a central types file)

interface Project {
  id: string;
  name: string;
  budget: number;
  actualCost: number; // We will update this
  // ... other project fields
}

interface WBSItem {
  id: string;
  projectId: string;
  name: string;
  type: "phase" | "activity" | "task" | "subtask";
  startDate?: string;
  endDate?: string;
  plannedCost?: number;
  actualCost: number; // We will update this
  // ... other wbs fields
}

// Master Resource Types
interface Manpower {
  id: string;
  name: string;
  skill: string;
  rate: number; // per hour
  unit: string; // e.g., "hour"
}

interface Material {
  id: string;
  name: string;
  rate: number; // per unit
  unit: string; // e.g., "bag", "ton"
  inStock: number;
}

interface Equipment {
  id: string;
  name: string;
  rate: number; // per hour
  unit: string; // e.g., "hour"
  status: "available" | "booked" | "maintenance";
}

// This is the main data type for this page
interface ResourceAllocation {
  id: string;
  projectId: string;
  wbsId: string;
  resourceType: "manpower" | "material" | "equipment";
  resourceId: string; // ID from one of the master lists
  resourceName: string; // Denormalized for display
  wbsName: string; // Denormalized for display
  quantity: number;
  rate: number;
  unit: string;
  duration: number; // In hours or units depending on resource
  durationUnit: string; // 'hours', 'days', or the material unit
  totalCost: number;
  startDate: string; // Copied from WBS item for overlap checks
  endDate: string; // Copied from WBS item for overlap checks
  createdAt: string;
}

// --- Helper Function to Setup Mock Data ---
const setupMockData = () => {
  // 1. Manpower (from HR Module)
  if (getFromStorage(MOCK_DATA_KEYS.HR_MANPOWER).length === 0) {
    const mockManpower: Manpower[] = [
      { id: generateId(), name: "John Doe", skill: "Civil Engineer", rate: 100, unit: "hour" },
      { id: generateId(), name: "Jane Smith", skill: "Site Supervisor", rate: 80, unit: "hour" },
      { id: generateId(), name: "Bob Johnson", skill: "Skilled Laborer", rate: 40, unit: "hour" },
      { id: generateId(), name: "Alice Brown", skill: "Electrician", rate: 70, unit: "hour" },
    ];
    saveToStorage(MOCK_DATA_KEYS.HR_MANPOWER, mockManpower);
  }

  // 2. Materials (from Inventory Module)
  if (getFromStorage(MOCK_DATA_KEYS.INVENTORY_ITEMS).length === 0) {
    const mockMaterials: Material[] = [
      { id: generateId(), name: "Cement (50kg Bag)", rate: 350, unit: "bag", inStock: 1000 },
      { id: generateId(), name: "TMT Steel (Ton)", rate: 45000, unit: "ton", inStock: 50 },
      { id: generateId(), name: "Sand (Cubic Meter)", rate: 1200, unit: "m³", inStock: 200 },
      { id: generateId(), name: "Bricks (per 1000)", rate: 5000, unit: "1000 units", inStock: 100 },
    ];
    saveToStorage(MOCK_DATA_KEYS.INVENTORY_ITEMS, mockMaterials);
  }

  // 3. Equipment (from Asset Module)
  if (getFromStorage(MOCK_DATA_KEYS.ASSETS_EQUIPMENT).length === 0) {
    const mockEquipment: Equipment[] = [
      { id: generateId(), name: "Excavator-01", rate: 2500, unit: "hour", status: "available" },
      { id: generateId(), name: "Concrete Mixer-01", rate: 800, unit: "hour", status: "available" },
      { id: generateId(), name: "Dump Truck-01", rate: 1500, unit: "hour", status: "available" },
      { id: generateId(), name: "Crane-01", rate: 4000, unit: "hour", status: "maintenance" },
    ];
    saveToStorage(MOCK_DATA_KEYS.ASSETS_EQUIPMENT, mockEquipment);
  }
};

// --- Main Component ---
export default function Resources() {
  // State for this page's data
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  
  // State for data from other "modules"
  const [projects, setProjects] = useState<Project[]>([]);
  const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
  const [manpower, setManpower] = useState<Manpower[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  // UI State
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<ResourceAllocation | null>(null);
  const [formData, setFormData] = useState<Partial<ResourceAllocation>>({});
  
  const { toast } = useToast();

  // Load all data on component mount
  useEffect(() => {
    setupMockData(); // Ensure mock data exists
    loadData();
  }, []);

  const loadData = () => {
    setProjects(getFromStorage<Project>(STORAGE_KEYS.PROJECTS));
    setWbsItems(getFromStorage<WBSItem>(STORAGE_KEYS.WBS_ITEMS));
    setAllocations(getFromStorage<ResourceAllocation>(STORAGE_KEYS.RESOURCES)); // This page now owns the 'RESOURCES' key
    setManpower(getFromStorage<Manpower>(MOCK_DATA_KEYS.HR_MANPOWER));
    setMaterials(getFromStorage<Material>(MOCK_DATA_KEYS.INVENTORY_ITEMS));
    setEquipment(getFromStorage<Equipment>(MOCK_DATA_KEYS.ASSETS_EQUIPMENT));
  };

  // --- Date Overlap Helper ---
  const isDateOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    if (!start1 || !end1 || !start2 || !end2) return false; // Can't check if dates are missing
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return (s1 < e2 && e1 > s2);
  };

  // --- Cost Update Helper (Integration) ---
  const updateProjectAndWBSCosts = (projectId: string, currentAllocations: ResourceAllocation[]) => {
    let allProjects = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    let allWbsItems = getFromStorage<WBSItem>(STORAGE_KEYS.WBS_ITEMS);

    // 1. Update WBS Items
    allWbsItems = allWbsItems.map(wbs => {
      if (wbs.projectId === projectId) {
        const wbsAllocations = currentAllocations.filter(a => a.wbsId === wbs.id);
        const newActualCost = wbsAllocations.reduce((sum, a) => sum + a.totalCost, 0);
        return { ...wbs, actualCost: newActualCost };
      }
      return wbs;
    });

    // 2. Update Project
    allProjects = allProjects.map(proj => {
      if (proj.id === projectId) {
        const projectAllocations = currentAllocations.filter(a => a.projectId === proj.id);
        const newActualCost = projectAllocations.reduce((sum, a) => sum + a.totalCost, 0);
        return { ...proj, actualCost: newActualCost };
      }
      return proj;
    });

    // 3. Save updated data
    saveToStorage(STORAGE_KEYS.WBS_ITEMS, allWbsItems);
    saveToStorage(STORAGE_KEYS.PROJECTS, allProjects);

    // 4. Refresh local state
    setProjects(allProjects);
    setWbsItems(allWbsItems);
  };

  // --- Main Save Handler ---
  const handleSave = () => {
    if (!formData.projectId || !formData.wbsId || !formData.resourceType || !formData.resourceId || !formData.quantity || !formData.duration) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedWBS = wbsItems.find(w => w.id === formData.wbsId);
    if (!selectedWBS) {
      toast({ title: "Error", description: "WBS Item not found.", variant: "destructive" });
      return;
    }

    const wbsStartDate = selectedWBS.startDate || "";
    const wbsEndDate = selectedWBS.endDate || "";

    // --- Double-Booking & Inventory Checks ---
    if (formData.resourceType === "manpower" || formData.resourceType === "equipment") {
      const otherAllocations = allocations.filter(
        a => a.resourceId === formData.resourceId && a.id !== editingAllocation?.id
      );
      
      for (const other of otherAllocations) {
        if (isDateOverlap(wbsStartDate, wbsEndDate, other.startDate, other.endDate)) {
          toast({
            title: "Booking Conflict",
            description: `${formData.resourceName} is already booked for WBS task "${other.wbsName}" during this time.`,
            variant: "destructive",
          });
          return;
        }
      }
    } else if (formData.resourceType === "material") {
      const material = materials.find(m => m.id === formData.resourceId);
      const originalQty = editingAllocation ? editingAllocation.quantity : 0;
      const netChange = formData.quantity - originalQty;

      if (material && material.inStock < netChange) {
        toast({
          title: "Inventory Check Failed",
          description: `Only ${material.inStock} ${material.unit}(s) of ${material.name} available.`,
          variant: "destructive",
        });
        return;
      }
    }
    // --- End Checks ---

    const totalCost = (formData.quantity || 0) * (formData.rate || 0) * (formData.duration || 0);

    let updatedAllocations: ResourceAllocation[];
    const now = new Date().toISOString();

    let updatedMaterials = [...materials]; // For stock updates

    if (editingAllocation) {
      // Handle inventory change on edit
      if (formData.resourceType === 'material') {
        const original = allocations.find(a => a.id === editingAllocation.id);
        if (original && original.resourceId === formData.resourceId) {
          const qtyChange = formData.quantity - original.quantity;
          updatedMaterials = updatedMaterials.map(m => 
            m.id === formData.resourceId ? { ...m, inStock: m.inStock - qtyChange } : m
          );
        } else {
          // Resource changed, TODO: more complex logic to revert old and apply new
          toast({ title: "Warning", description: "Changing material type on edit is complex. Re-add if needed."});
        }
      }
      
      updatedAllocations = allocations.map((r) =>
        r.id === editingAllocation.id
          ? { ...editingAllocation, ...formData, totalCost, startDate: wbsStartDate, endDate: wbsEndDate } as ResourceAllocation
          : r
      );
      toast({ title: "Success", description: "Allocation updated successfully" });
    } else {
      // Handle inventory change on create
      if (formData.resourceType === 'material') {
        updatedMaterials = updatedMaterials.map(m => 
          m.id === formData.resourceId ? { ...m, inStock: m.inStock - formData.quantity! } : m
        );
      }

      const newAllocation: ResourceAllocation = {
        ...formData,
        id: generateId(),
        totalCost,
        startDate: wbsStartDate,
        endDate: wbsEndDate,
        createdAt: now,
      } as ResourceAllocation;
      updatedAllocations = [...allocations, newAllocation];
      toast({ title: "Success", description: "Resource allocated successfully" });
    }

    // Save all changes
    saveToStorage(STORAGE_KEYS.RESOURCES, updatedAllocations);
    setAllocations(updatedAllocations);

    if (formData.resourceType === 'material') {
      saveToStorage(MOCK_DATA_KEYS.INVENTORY_ITEMS, updatedMaterials);
      setMaterials(updatedMaterials);
    }
    
    // This is the integration step
    updateProjectAndWBSCosts(formData.projectId, updatedAllocations);

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const allocation = allocations.find(a => a.id === id);
    if (!allocation) return;

    let updatedAllocations = allocations.filter((r) => r.id !== id);
    let updatedMaterials = [...materials];

    // Restore stock on delete
    if (allocation.resourceType === 'material') {
      updatedMaterials = updatedMaterials.map(m => 
        m.id === allocation.resourceId ? { ...m, inStock: m.inStock + allocation.quantity } : m
      );
      saveToStorage(MOCK_DATA_KEYS.INVENTORY_ITEMS, updatedMaterials);
      setMaterials(updatedMaterials);
    }

    saveToStorage(STORAGE_KEYS.RESOURCES, updatedAllocations);
    setAllocations(updatedAllocations);

    // Re-run cost calculation
    updateProjectAndWBSCosts(allocation.projectId, updatedAllocations);
    
    toast({ title: "Success", description: "Allocation removed successfully" });
  };

  const openEditDialog = (allocation: ResourceAllocation) => {
    setEditingAllocation(allocation);
    setFormData(allocation);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    if (!selectedProjectId) return;
    resetForm();
    setFormData({ projectId: selectedProjectId });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAllocation(null);
    setFormData({});
  };

  // --- Dynamic Form Handlers ---
  const handleWBSSelect = (wbsId: string) => {
    const wbs = wbsItems.find(w => w.id === wbsId);
    if (wbs) {
      setFormData(prev => ({ ...prev, wbsId, wbsName: wbs.name }));
    }
  };

  const handleResourceTypeSelect = (type: ResourceAllocation["resourceType"]) => {
    setFormData(prev => ({
      ...prev,
      resourceType: type,
      resourceId: undefined,
      resourceName: undefined,
      rate: undefined,
      unit: undefined,
      durationUnit: type === 'material' ? 'units' : 'hours'
    }));
  };

  const handleResourceSelect = (resourceId: string) => {
    let resource: Manpower | Material | Equipment | undefined;
    let name: string = "";
    let rate: number = 0;
    let unit: string = "";

    if (formData.resourceType === "manpower") {
      resource = manpower.find(r => r.id === resourceId);
      if (resource) {
        name = resource.name;
        rate = resource.rate;
        unit = resource.unit;
      }
    } else if (formData.resourceType === "material") {
      resource = materials.find(r => r.id === resourceId);
      if (resource) {
        name = resource.name;
        rate = resource.rate;
        unit = resource.unit;
      }
    } else if (formData.resourceType === "equipment") {
      resource = equipment.find(r => r.id === resourceId);
      if (resource) {
        name = resource.name;
        rate = resource.rate;
        unit = resource.unit;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      resourceId,
      resourceName: name,
      rate,
      unit,
      durationUnit: formData.resourceType === 'material' ? unit : 'hours'
    }));
  };

  // --- Memoized Values for Performance ---
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const projectWBSItems = useMemo(() => {
    if (!selectedProjectId) return [];
    // Only allow allocating to tasks and subtasks
    return wbsItems.filter(w => w.projectId === selectedProjectId && (w.type === 'task' || w.type === 'subtask'));
  }, [wbsItems, selectedProjectId]);

  const projectAllocations = useMemo(() => {
    if (!selectedProjectId) return [];
    return allocations.filter(a => a.projectId === selectedProjectId);
  }, [allocations, selectedProjectId]);

  const dynamicResourceList = useMemo(() => {
    switch (formData.resourceType) {
      case "manpower": return manpower;
      case "material": return materials;
      case "equipment": return equipment.filter(e => e.status !== 'maintenance'); // Can book available/booked (for check)
      default: return [];
    }
  }, [formData.resourceType, manpower, materials, equipment]);

  const calculatedTotalCost = (formData.quantity || 0) * (formData.rate || 0) * (formData.duration || 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Resource Planning & Allocation
          </h2>
          <p className="text-muted-foreground">
            Assign manpower, materials, and equipment to WBS tasks.
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select a Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} disabled={!selectedProjectId} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Allocation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAllocation ? "Edit Allocation" : "Create New Allocation"}</DialogTitle>
                <DialogDescription>Assign a resource to a specific WBS task.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* WBS and Resource Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wbsId">WBS Task *</Label>
                    <Select onValueChange={handleWBSSelect} value={formData.wbsId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a WBS task" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectWBSItems.length > 0 ? projectWBSItems.map((wbs) => (
                          <SelectItem key={wbs.id} value={wbs.id}>
                            {wbs.name} ({wbs.type})
                          </SelectItem>
                        )) : <div className="p-4 text-sm text-muted-foreground">No tasks for this project.</div>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resourceType">Resource Type *</Label>
                    <Select onValueChange={handleResourceTypeSelect} value={formData.resourceType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manpower">Manpower</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Resource Selection */}
                <div className="space-y-2">
                  <Label htmlFor="resourceId">Resource *</Label>
                  <Select onValueChange={handleResourceSelect} value={formData.resourceId} disabled={!formData.resourceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {dynamicResourceList.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} 
                          {r.skill ? ` (${r.skill})` : ''}
                          {r.inStock !== undefined ? ` (In Stock: ${r.inStock})` : ''}
                          {r.status ? ` (${r.status})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity, Rate, Duration */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input id="quantity" type="number" value={formData.quantity || ""}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                      placeholder="e.g., 2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate">Rate (₹) *</Label>
                    <Input id="rate" type="number" value={formData.rate || ""}
                      onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                      placeholder="e.g., 100" />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="duration">Usage/Duration *</Label>
                    <Input id="duration" type="number" value={formData.duration || ""}
                      onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                      placeholder="e.g., 40" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="durationUnit">Unit</Label>
                    <Input id="durationUnit" value={formData.durationUnit || ""}
                     onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
                     placeholder={formData.resourceType === 'material' ? 'units' : 'hours'}/>
                  </div>
                </div>

                {/* Total Cost */}
                <div className="space-y-2">
                  <Label>Total Cost</Label>
                  <Input
                    value={`₹ ${calculatedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    disabled
                    className="font-bold text-lg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Allocation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project Summary Card */}
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
                  ₹ {selectedProject.budget.toLocaleString()}
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
                  ₹ {selectedProject.actualCost.toLocaleString()}
                </p>
              </div>
            </div>
             <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${selectedProject.actualCost > selectedProject.budget ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-sm">Remaining Budget</Label>
                <p className={`text-2xl font-bold ${selectedProject.actualCost > selectedProject.budget ? 'text-red-600' : 'text-green-600'}`}>
                  ₹ {(selectedProject.budget - selectedProject.actualCost).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocations Table */}
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
                    Please select a project to view allocations.
                  </TableCell>
                </TableRow>
              ) : projectAllocations.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No resources allocated yet for this project.
                  </TableCell>
                </TableRow>
              ) : (
                projectAllocations.map((alloc) => (
                  <TableRow key={alloc.id}>
                    <TableCell className="font-medium">{alloc.wbsName}</TableCell>
                    <TableCell>{alloc.resourceName}</TableCell>
                    <TableCell className="capitalize">{alloc.resourceType}</TableCell>
                    <TableCell>{alloc.quantity}</TableCell>
                    <TableCell>₹{alloc.rate.toLocaleString()}</TableCell>
                    <TableCell>{alloc.duration} {alloc.durationUnit}</TableCell>
                    <TableCell className="font-medium">₹{alloc.totalCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(alloc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(alloc.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}