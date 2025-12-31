import { usePermission } from "@/hooks/userPermission";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, Download, Upload, BarChart3, ShieldAlert, X, Loader2, MapPin } from "lucide-react";
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
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Pagination } from "../../../components/ui/pagination";
import { fetchSpareParts } from "@/redux/slices/plantandmachinary/sparePartsSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchWorkOrders } from "@/redux/slices/production/workOrderSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { fetchEquipments } from "@/redux/slices/equipmentSlice";
import { fetchMachineries } from "@/redux/slices/plantandmachinary/machinerySlice";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import { fetchProducts } from "@/redux/slices/productSlice";
import {
  fetchWorkCenters,
  createWorkCenter,
  updateWorkCenter,
  deleteWorkCenter,
  fetchWorkCenterAnalytics,
  clearError,
  type WorkCenter,
  type WorkCenterResource,
} from "@/redux/slices/production/workCenterSlice";
import axios from "../../../utils/axiosApi";

// Helper function to create movement entry
const createMovementEntry = async (data: {
  materialId?: string;
  materialName: string;
  quantity: number;
  unit: string;
  source: string;
  destination: string;
  referenceNumber: string;
  remarks?: string;
  itemType: "material" | "product";
  unitCost?: number;
}) => {
  try {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) return false;

    const movementData = {
      organisationId,
      materialId: data.materialId || null,
      materialName: data.materialName,
      movementType: "outbound",
      quantity: data.quantity,
      unit: data.unit,
      source: data.source,
      destination: data.destination,
      referenceNumber: data.referenceNumber,
      remarks: data.remarks || "",
      unitCost: data.unitCost || 0,
      totalCost: (data.unitCost || 0) * data.quantity,
      itemType: data.itemType,
      movementDate: new Date().toISOString(),
    };

    const response = await axios.post("/material-movements", movementData);
    return response.data.success;
  } catch (error: any) {
    console.error("Failed to create movement entry:", error);
    return false;
  }
};

export default function WorkCentersPageAdvanced() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Permission checks - must be called before any conditional logic
  const canView = usePermission("workCenterMgt", "view");
  const canCreate = usePermission("workCenterMgt", "create");
  const canEdit = usePermission("workCenterMgt", "edit");
  const canDelete = usePermission("workCenterMgt", "delete");
  
  // Redux selectors with proper fallbacks
  const { list: workCenters = [], loading, error, analytics, pagination } = useSelector((state: RootState) => state.workCenters);
  const { items: spareParts = [] } = useSelector((state: RootState) => state.spareParts);
  const { wbs: wbsTasks = [] } = useSelector((state: RootState) => state.wbs);
  const { projects = [] } = useSelector((state: RootState) => state.projects);
  const { list: workOrders = [] } = useSelector((state: RootState) => state.workOrders);
  const { locations = [] } = useSelector((state: RootState) => state.masterData);
  const { equipments = [] } = useSelector((state: RootState) => state.equipment);
  const { machineries = [] } = useSelector((state: RootState) => state.machinery);
  const { materials: rawMaterials = [] } = useSelector((state: RootState) => state.rawMaterials);
  const { products = [] } = useSelector((state: RootState) => state.products);
  
  // ✅ LOCATION FILTERING STATE
  const { userProfile } = useSelector((state: RootState) => state.auth);

  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  // Stock management functions for raw materials
  // Function to fetch current stock for a raw material
  const fetchMaterialStock = async (materialId: string) => {
    try {
      const response = await axios.get(`/raw/single/${materialId}`);
      if (response.data.success && response.data.material) {
        const material = response.data.material;
        // Calculate total stock from all warehouses using remainingQuantity
        const totalStock = material.stocks?.reduce((sum: number, stock: any) => sum + (stock.remainingQuantity || 0), 0) || 0;
        return totalStock;
      }
      return 0;
    } catch (error: any) {
      console.error("Failed to fetch material stock:", error);
      return 0;
    }
  };

  // Function to deduct stock from raw material
  const deductMaterialStock = async (materialId: string, quantityToDeduct: number) => {
    try {
      // First get the current material details
      const response = await axios.get(`/raw/single/${materialId}`);
      if (response.data.success && response.data.material) {
        const material = response.data.material;
        
        // Calculate total current stock using remainingQuantity
        const totalCurrentStock = material.stocks?.reduce((sum: number, stock: any) => sum + (stock.remainingQuantity || 0), 0) || 0;
        
        // Check if there's enough stock
        if (totalCurrentStock < quantityToDeduct) {
          toast.warning(`Insufficient stock for ${material.name}! Available: ${totalCurrentStock}, Required: ${quantityToDeduct}`);
          return false;
        }
        
        // Calculate new stock quantities by deducting from each warehouse using FIFO logic
        let remainingToDeduct = quantityToDeduct;
        const updatedStocks = material.stocks?.map((stock: any) => {
          const currentQty = stock.remainingQuantity || 0;
          
          if (remainingToDeduct > 0 && currentQty > 0) {
            const deductFromThisStock = Math.min(currentQty, remainingToDeduct);
            remainingToDeduct -= deductFromThisStock;
            
            return {
              ...stock,
              remainingQuantity: currentQty - deductFromThisStock
            };
          }
          return stock;
        }) || [];

        // Update the material with new stock quantities
        const updateResponse = await axios.put(`/raw/update/${materialId}`, {
          ...material,
          stocks: updatedStocks
        });

        if (updateResponse.data.success) {
          console.log(`✅ Successfully deducted ${quantityToDeduct} units from material ${materialId}`);
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error("Failed to deduct material stock:", error);
      return false;
    }
  };

  // Function to validate stock availability for machine configuration inputs
  const validateMachineInputStockAvailability = async (inputs: any[]) => {
    const stockValidations = [];
    
    for (const input of inputs) {
      if (input.quantity > 0) {
        try {
          const response = await axios.get(`/raw/single/${input.id}`);
          if (response.data.success && response.data.material) {
            const totalCurrentStock = response.data.material.stocks?.reduce((sum: number, stock: any) => sum + (stock.remainingQuantity || 0), 0) || 0;
            
            stockValidations.push({
              materialId: input.id,
              materialName: input.name,
              required: input.quantity,
              available: totalCurrentStock,
              sufficient: totalCurrentStock >= input.quantity
            });
          }
        } catch (error: any) {
          console.error(`Failed to check stock for material ${input.id}:`, error);
          stockValidations.push({
            materialId: input.id,
            materialName: input.name,
            required: input.quantity,
            available: 0,
            sufficient: false
          });
        }
      }
    }
    
    return stockValidations;
  };
  
  // All state hooks must be declared before any early returns
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<WorkCenter | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Multi-select state for checkboxes
  const [selectedSpareParts, setSelectedSpareParts] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectedWbsTasks, setSelectedWbsTasks] = useState<Set<string>>(new Set());
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<Set<string>>(new Set());
  const [selectedEquipments, setSelectedEquipments] = useState<Set<string>>(new Set());
  const [selectedMachines, setSelectedMachines] = useState<Set<string>>(new Set());
  
  // Resources list
  const [resources, setResources] = useState<WorkCenterResource[]>([]);

  // New state for projects and WBS tasks (separate section)
  const [workCenterProjects, setWorkCenterProjects] = useState<any[]>([]);
  const [workCenterWbsTasks, setWorkCenterWbsTasks] = useState<any[]>([]);

  // Machine configuration state
  const [isMachineConfigOpen, setIsMachineConfigOpen] = useState(false);
  const [selectedMachineForConfig, setSelectedMachineForConfig] = useState<any>(null);
  const [machineConfig, setMachineConfig] = useState({
    inputs: [] as any[],
    personHours: 0,
    output: null as any // Changed from outputs array to single output
  });

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    capacity: 8,
    costPerHour: 0,
    efficiency: 100,
    status: "active" as const,
    shift: "single" as const,
    operatorCount: 1,
    location: "",
    locationName: "",
  });

  // Fetch data for dropdowns
  useEffect(() => {
    const organisationId = localStorage.getItem("organisationId");
    const token = localStorage.getItem("token");
    
    if (organisationId && token) {
      dispatch(fetchSpareParts({ organisationId, page: 1, limit: 100 }));
      dispatch(fetchProjects({ organisationId }));
      dispatch(fetchMasterData("location"));
      dispatch(fetchEquipments({ organisationId }));
      dispatch(fetchMachineries({ page: 1, limit: 100, location: "" }));
      dispatch(fetchMaterials({ page: 1, limit: 100, location: "", warehouse: "" }));
      dispatch(fetchProducts({ page: 1, limit: 100 }));
      
      // Fetch work orders from Redux store
      dispatch(fetchWorkOrders());
    }
  }, [dispatch]);

  // Fetch work centers data with pagination
  useEffect(() => {
    // Only fetch if user is authenticated
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(fetchWorkCenters({ 
        search: searchTerm, 
        status: filterStatus, 
        location: locationFilter,
        page: currentPage, 
        limit: itemsPerPage 
      }));
      dispatch(fetchWorkCenterAnalytics());
    }
  }, [dispatch, searchTerm, filterStatus, locationFilter, currentPage, itemsPerPage]);

  // Auto-set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Analytics - use Redux analytics data when available, fallback to calculated values
  const totalCenters = analytics?.total || workCenters.length;
  const calculatedAvgEfficiency = useMemo(() => {
  if (workCenters.length === 0) return 0;
  return Math.round(
    workCenters.reduce((sum, w) => sum + (w.efficiency || 0), 0) / workCenters.length
  );
}, [workCenters]);

const avgEfficiency = analytics?.avgEfficiency ?? calculatedAvgEfficiency;

  const activeCenters = analytics?.active || workCenters.filter((w) => w.status === "active").length;

  // Filtering & search - now handled by backend pagination
  const filtered = workCenters; // No client-side filtering needed

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Search handler with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Status filter handler
  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Location filter handler
  const handleLocationFilterChange = (location: string) => {
    setLocationFilter(location);
    setCurrentPage(1); // Reset to first page when filtering
  };

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
  
  // Early return after all hooks are declared
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

  // Show loading state
  if (loading && workCenters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading work centers...</span>
      </div>
    );
  }

  // Show error state
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={() => {
          dispatch(clearError());
          dispatch(fetchWorkCenters());
        }}>
          Retry
        </Button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      // Create work center data with all sections, excluding legacy fields
      const data: Partial<WorkCenter> = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        capacity: formData.capacity,
        costPerHour: formData.costPerHour,
        efficiency: formData.efficiency,
        status: formData.status,
        shift: formData.shift,
        operatorCount: formData.operatorCount,
        location: formData.location || undefined, // Only include if not empty
        resources: resources, // Include resources array
        projects: workCenterProjects, // Include projects
        wbsTasks: workCenterWbsTasks, // Include WBS tasks
      };

      if (editingCenter) {
        await dispatch(updateWorkCenter({ id: editingCenter._id, data })).unwrap();
        toast.success("Work center updated successfully");
      } else {
        await dispatch(createWorkCenter(data)).unwrap();
        toast.success("Work center created successfully");
        // Refresh the list to ensure new data is displayed
        dispatch(fetchWorkCenters({ 
          search: searchTerm, 
          status: filterStatus, 
          location: locationFilter,
          page: currentPage, 
          limit: itemsPerPage 
        }));
        dispatch(fetchWorkCenterAnalytics());
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error || "Failed to save work center");
    }
  };

  const handleEdit = (center: any) => {
    setEditingCenter(center);
    setFormData({
      ...center,
      location: center.location?._id || center.location || "",
      locationName: center.location?.name || center.locationName || "",
    });
    
    // Load existing projects and WBS tasks
    setWorkCenterProjects(center.projects || []);
    setWorkCenterWbsTasks(center.wbsTasks || []);
    
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work center?")) return;
    
    try {
      await dispatch(deleteWorkCenter(id)).unwrap();
      toast.success("Work center deleted successfully");
    } catch (error: any) {
      toast.error(error || "Failed to delete work center");
    }
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
    });
    setSelectedSpareParts(new Set());
    setSelectedProjects(new Set());
    setSelectedWbsTasks(new Set());
    setSelectedWorkOrders(new Set());
    setSelectedEquipments(new Set());
    setSelectedMachines(new Set());
    setResources([]);
    setWorkCenterProjects([]);
    setWorkCenterWbsTasks([]);
  };

  // Handle checkbox toggle
  const handleCheckboxToggle = (
    type: "sparePart" | "project" | "wbsTask" | "workOrder" | "equipment" | "machine",
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
    } else if (type === "equipment") {
      const newSet = new Set(selectedEquipments);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      setSelectedEquipments(newSet);
    } else if (type === "machine") {
      const newSet = new Set(selectedMachines);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      setSelectedMachines(newSet);
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
      const wo = workOrders?.find((w) => w._id === id);
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

    // Add equipments
    selectedEquipments.forEach((id) => {
      const equipment = equipments?.find((eq) => eq._id === id);
      if (equipment) {
        newResources.push({
          id: `RES-EQ-${Date.now()}-${id}`,
          resourceType: "equipment",
          equipmentId: id,
          equipmentName: equipment.name,
          equipmentCode: equipment.code,
          priority: "medium",
          estimatedHours: 0,
          actualHours: 0,
          status: "planned",
        });
      }
    });

    // Add machines
    selectedMachines.forEach((id) => {
      const machine = machineries?.find((mc) => mc._id === id);
      if (machine) {
        newResources.push({
          id: `RES-MC-${Date.now()}-${id}`,
          resourceType: "machine",
          machineId: id,
          machineName: machine.name,
          machineCode: machine.code,
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
    setSelectedEquipments(new Set());
    setSelectedMachines(new Set());
    toast.success(`${newResources.length} resource(s) added`);
  };

  // Remove resource
  const handleRemoveResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
    toast.success("Resource removed");
  };

  // Add selected projects and WBS tasks (for the new separate section)
  const handleAddSelectedProjectsAndTasks = () => {
    const newProjects: any[] = [];
    const newWbsTasks: any[] = [];

    // Add projects
    selectedProjects.forEach((id) => {
      const project = projects?.find((p) => p._id === id);
      if (project) {
        newProjects.push({
          id: `PRJ-${Date.now()}-${id}`,
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
        newWbsTasks.push({
          id: `WBS-${Date.now()}-${id}`,
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

    if (newProjects.length === 0 && newWbsTasks.length === 0) {
      toast.error("Please select at least one project or WBS task");
      return;
    }

    setWorkCenterProjects([...workCenterProjects, ...newProjects]);
    setWorkCenterWbsTasks([...workCenterWbsTasks, ...newWbsTasks]);
    
    // Clear selections
    setSelectedProjects(new Set());
    setSelectedWbsTasks(new Set());
    toast.success(`${newProjects.length + newWbsTasks.length} item(s) added`);
  };

  // Remove functions for projects and WBS tasks
  const handleRemoveProject = (id: string) => {
    setWorkCenterProjects(workCenterProjects.filter((p) => p.id !== id));
    toast.success("Project removed");
  };

  const handleRemoveWbsTask = (id: string) => {
    setWorkCenterWbsTasks(workCenterWbsTasks.filter((t) => t.id !== id));
    toast.success("WBS task removed");
  };

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
      // Import functionality would need to be implemented with backend API
      toast.error("Import functionality not yet implemented");
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

              {/* Projects and WBS Tasks Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Projects and WBS Tasks</h3>
                
                <Tabs defaultValue="project" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="project">Projects</TabsTrigger>
                    <TabsTrigger value="wbsTask">WBS Tasks</TabsTrigger>
                  </TabsList>

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
                </Tabs>

                {/* Add Selected Projects and Tasks Button */}
                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={handleAddSelectedProjectsAndTasks}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Selected Projects & Tasks
                  </Button>
                </div>

                {/* Added Projects and Tasks List */}
                {(workCenterProjects.length > 0 || workCenterWbsTasks.length > 0) && (
                  <div className="mt-4 space-y-2">
                    <Label>Added Items ({workCenterProjects.length + workCenterWbsTasks.length})</Label>
                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {workCenterProjects.map((project) => (
                        <div key={project.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-800">
                                Project
                              </span>
                              <span className="font-medium text-sm">{project.projectName}</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProject(project.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {workCenterWbsTasks.map((task) => (
                        <div key={task.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-1 rounded font-medium bg-purple-100 text-purple-800">
                                WBS Task
                              </span>
                              <span className="font-medium text-sm">{task.wbsTaskName}</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveWbsTask(task.id)}
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

              {/* Work Center Resources Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Work Center Resources</h3>
                
                <Tabs defaultValue="sparePart" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="sparePart">Spare Parts</TabsTrigger>
                    <TabsTrigger value="equipment">Equipments</TabsTrigger>
                    <TabsTrigger value="machine">Machines</TabsTrigger>
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

                  {/* Equipments Tab */}
                  <TabsContent value="equipment" className="space-y-2">
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {equipments && equipments.length > 0 ? (
                        equipments.map((equipment) => (
                          <div key={equipment._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={`eq-${equipment._id}`}
                              checked={selectedEquipments.has(equipment._id)}
                              onCheckedChange={(checked) =>
                                handleCheckboxToggle("equipment", equipment._id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`eq-${equipment._id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {equipment.name} ({equipment.code})
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">No equipments available</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedEquipments.size} selected
                    </div>
                  </TabsContent>

                  {/* Machines Tab */}
                  <TabsContent value="machine" className="space-y-2">
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {machineries && machineries.length > 0 ? (
                        machineries.map((machine) => (
                          <div 
                            key={machine._id} 
                            className="flex items-center justify-between p-3 hover:bg-blue-50 rounded border cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedMachineForConfig(machine);
                              setMachineConfig({
                                inputs: [],
                                personHours: 0,
                                output: null
                              });
                              setIsMachineConfigOpen(true);
                            }}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{machine.name}</div>
                              <div className="text-xs text-gray-500">Code: {machine.code}</div>
                            </div>
                            <div className="text-blue-600 text-sm">
                              Configure →
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">No machines available</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Click on a machine to configure its inputs, person hours, and outputs
                    </div>
                  </TabsContent>

                  {/* Projects Tab */}
                  {/* <TabsContent value="project" className="space-y-2">
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
                  </TabsContent> */}

                  {/* WBS Tasks Tab */}
                  {/* <TabsContent value="wbsTask" className="space-y-2">
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
                  </TabsContent> */}

                  {/* Work Orders Tab */}
                  <TabsContent value="workOrder" className="space-y-2">
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      {workOrders && workOrders.length > 0 ? (
                        workOrders.map((wo) => (
                          <div key={wo._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={`wo-${wo._id}`}
                              checked={selectedWorkOrders.has(wo._id)}
                              onCheckedChange={(checked) =>
                                handleCheckboxToggle("workOrder", wo._id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`wo-${wo._id}`}
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
                                resource.resourceType === "equipment" ? "bg-cyan-100 text-cyan-800" :
                                resource.resourceType === "machine" ? "bg-indigo-100 text-indigo-800" :
                                "bg-orange-100 text-orange-800"
                              }`}>
                                {resource.resourceType === "sparePart" ? "Spare Part" :
                                 resource.resourceType === "project" ? "Project" :
                                 resource.resourceType === "wbsTask" ? "WBS Task" :
                                 resource.resourceType === "equipment" ? "Equipment" :
                                 resource.resourceType === "machine" ? "Machine" : "Work Order"}
                              </span>
                              <span className="font-medium text-sm">
                                {resource.sparePartName || resource.projectName || resource.wbsTaskName || 
                                 resource.equipmentName || resource.machineName || resource.productName}
                              </span>
                              {resource.resourceType === "machine" && resource.machineConfig && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Inputs: {resource.machineConfig.inputs.length} | 
                                  Person Hours: {resource.machineConfig.personHours} | 
                                  Output: {resource.machineConfig.output ? resource.machineConfig.output.name : 'None'}
                                </div>
                              )}
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

        {/* Machine Configuration Dialog */}
        <Dialog open={isMachineConfigOpen} onOpenChange={setIsMachineConfigOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Configure Machine: {selectedMachineForConfig?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedMachineForConfig && (
              <div className="space-y-6">
                {/* Machine Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Machine Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span> {selectedMachineForConfig.name}
                    </div>
                    <div>
                      <span className="text-gray-600">Code:</span> {selectedMachineForConfig.code}
                    </div>
                  </div>
                </div>

                {/* Person Hours */}
                <div>
                  <Label className="text-base font-medium">Person Hours Required</Label>
                  <Input
                    type="number"
                    value={machineConfig.personHours}
                    onChange={(e) =>
                      setMachineConfig({
                        ...machineConfig,
                        personHours: parseFloat(e.target.value) || 0
                      })
                    }
                    placeholder="Enter person hours required"
                    className="mt-2"
                  />
                </div>

                {/* Inputs Section */}
                <div>
                  <Label className="text-base font-medium">Input Materials</Label>
                  <div className="mt-2 space-y-3">
                    {/* Raw Materials Selection */}
                    <div className="border rounded-lg p-4">
                      <Label className="text-sm font-medium">Select Raw Materials</Label>
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                        {rawMaterials && rawMaterials.length > 0 ? (
                          rawMaterials.map((material) => (
                            <div key={material._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`input-${material._id}`}
                                onCheckedChange={async (checked) => {
                                  if (checked) {
                                    // Fetch current stock for the selected material
                                    const currentStock = await fetchMaterialStock(material._id);
                                    setMaterialStocks(prev => ({ ...prev, [material._id]: currentStock }));
                                    
                                    setMachineConfig({
                                      ...machineConfig,
                                      inputs: [...machineConfig.inputs, {
                                        id: material._id,
                                        name: material.name,
                                        quantity: 0,
                                        unit: material.unit || 'pcs',
                                        currentStock: currentStock
                                      }]
                                    });
                                  } else {
                                    setMachineConfig({
                                      ...machineConfig,
                                      inputs: machineConfig.inputs.filter(input => input.id !== material._id)
                                    });
                                    // Remove from stock tracking
                                    setMaterialStocks(prev => {
                                      const newStocks = { ...prev };
                                      delete newStocks[material._id];
                                      return newStocks;
                                    });
                                  }
                                }}
                              />
                              <label htmlFor={`input-${material._id}`} className="text-sm cursor-pointer">
                                {material.name} ({material.unit || 'pcs'})
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">No raw materials available</div>
                        )}
                      </div>
                    </div>

                    {/* Selected Inputs with Quantities */}
                    {machineConfig.inputs.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Selected Input Materials</Label>
                        {machineConfig.inputs.map((input, index) => (
                          <div key={input.id} className="space-y-2">
                            <div className="flex items-center gap-2 p-2 border rounded">
                              <span className="flex-1 text-sm">{input.name}</span>
                              <Input
                                type="number"
                                value={input.quantity}
                                onChange={(e) => {
                                  const newInputs = [...machineConfig.inputs];
                                  newInputs[index].quantity = parseFloat(e.target.value) || 0;
                                  setMachineConfig({
                                    ...machineConfig,
                                    inputs: newInputs
                                  });
                                }}
                                placeholder="Qty"
                                className="w-20"
                              />
                              <span className="text-sm text-gray-500">{input.unit}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setMachineConfig({
                                    ...machineConfig,
                                    inputs: machineConfig.inputs.filter((_, i) => i !== index)
                                  });
                                  // Remove from stock tracking
                                  setMaterialStocks(prev => {
                                    const newStocks = { ...prev };
                                    delete newStocks[input.id];
                                    return newStocks;
                                  });
                                }}
                                className="text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {/* Stock validation indicator */}
                            {input.currentStock !== undefined && input.quantity > 0 && (
                              <div className={`text-xs p-2 rounded mx-2 ${
                                input.currentStock >= input.quantity 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {input.currentStock >= input.quantity 
                                  ? `✅ Stock: ${input.currentStock} (Sufficient)`
                                  : `⚠️ Stock: ${input.currentStock} (Need: ${input.quantity})`
                                }
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Overall stock status summary */}
                        {machineConfig.inputs.some(input => input.currentStock !== undefined) && (
                          <div className="mt-3 text-center">
                            {(() => {
                              const inputsWithStock = machineConfig.inputs.filter(input => input.currentStock !== undefined);
                              const sufficientInputs = inputsWithStock.filter(input => (input.currentStock || 0) >= input.quantity);
                              const insufficientInputs = inputsWithStock.filter(input => (input.currentStock || 0) < input.quantity);
                              
                              if (insufficientInputs.length === 0) {
                                return (
                                  <div className="text-sm p-2 bg-green-50 text-green-700 border border-green-200 rounded">
                                    ✅ All materials have sufficient stock
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-sm p-2 bg-red-50 text-red-700 border border-red-200 rounded">
                                    ⚠️ {insufficientInputs.length} material(s) have insufficient stock
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Outputs Section */}
                <div>
                  <Label className="text-base font-medium">Output Product (Select One)</Label>
                  <div className="mt-2 space-y-3">
                    {/* Products Selection */}
                    <div className="border rounded-lg p-4">
                      <Label className="text-sm font-medium">Select Product</Label>
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                        {products && products.length > 0 ? (
                          products.map((product) => (
                            <div key={product._id} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`output-${product._id}`}
                                name="outputProduct"
                                checked={machineConfig.output?.id === product._id}
                                onChange={() => {
                                  setMachineConfig({
                                    ...machineConfig,
                                    output: {
                                      id: product._id,
                                      name: product.name,
                                      quantity: 0,
                                      unit: product.unit || 'pcs',
                                      isCustom: false
                                    }
                                  });
                                }}
                                className="w-4 h-4"
                              />
                              <label htmlFor={`output-${product._id}`} className="text-sm cursor-pointer">
                                {product.name} ({product.unit || 'pcs'})
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">No products available</div>
                        )}
                      </div>
                      
                      {/* Add Custom Product */}
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const customName = prompt("Enter custom product name:");
                            if (customName) {
                              setMachineConfig({
                                ...machineConfig,
                                output: {
                                  id: `custom-${Date.now()}`,
                                  name: customName,
                                  quantity: 0,
                                  unit: 'pcs',
                                  isCustom: true
                                }
                              });
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Custom Product
                        </Button>
                      </div>
                    </div>

                    {/* Selected Output with Quantity */}
                    {machineConfig.output && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Selected Output Product</Label>
                        <div className="flex items-center gap-2 p-2 border rounded">
                          <span className="flex-1 text-sm">
                            {machineConfig.output.name}
                            {machineConfig.output.isCustom && <span className="ml-1 text-xs text-blue-600">(Custom)</span>}
                          </span>
                          <Input
                            type="number"
                            value={machineConfig.output.quantity}
                            onChange={(e) => {
                              setMachineConfig({
                                ...machineConfig,
                                output: {
                                  ...machineConfig.output,
                                  quantity: parseFloat(e.target.value) || 0
                                }
                              });
                            }}
                            placeholder="Qty"
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">{machineConfig.output.unit}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMachineConfig({
                                ...machineConfig,
                                output: null
                              });
                            }}
                            className="text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={async () => {
                      // Validate stock availability for input materials
                      if (machineConfig.inputs.length > 0) {
                        try {
                          const stockValidations = await validateMachineInputStockAvailability(machineConfig.inputs);
                          const insufficientItems = stockValidations.filter(v => !v.sufficient);
                          
                          if (insufficientItems.length > 0) {
                            const errorMessage = insufficientItems.map(item => 
                              `${item.materialName}: Available ${item.available}, Required ${item.required}`
                            ).join('\n');
                            
                            toast.error(`Cannot save machine configuration! Insufficient stock for:\n${errorMessage}`);
                            return;
                          }
                        } catch (error: any) {
                          console.error("Failed to validate stock availability:", error);
                          toast.error("Failed to verify stock availability");
                          return;
                        }
                      }

                      // Deduct stock from input materials
                      let allStockDeducted = true;
                      const deductionResults = [];
                      const movementResults = [];
                      
                      for (const input of machineConfig.inputs) {
                        if (input.quantity > 0) {
                          const stockDeducted = await deductMaterialStock(input.id, input.quantity);
                          deductionResults.push({
                            materialName: input.name,
                            quantity: input.quantity,
                            success: stockDeducted
                          });
                          
                          if (!stockDeducted) {
                            allStockDeducted = false;
                          } else {
                            // Create movement entry for the stock deduction
                            const movementCreated = await createMovementEntry({
                              materialId: input.id,
                              materialName: input.name,
                              quantity: input.quantity,
                              unit: input.unit,
                              source: "Raw Material Inventory",
                              destination: `Work Center Machine: ${selectedMachineForConfig.name}`,
                              referenceNumber: `WC-MACHINE-${Date.now()}`,
                              remarks: `Material consumed for machine configuration in work center`,
                              itemType: "material",
                              unitCost: 0 // You may want to get actual cost from material
                            });
                            
                            movementResults.push({
                              materialName: input.name,
                              movementCreated
                            });
                          }
                        }
                      }

                      // Add the configured machine to resources
                      const newResource: WorkCenterResource = {
                        id: `RES-MC-${Date.now()}-${selectedMachineForConfig._id}`,
                        resourceType: "machine" as const,
                        machineId: selectedMachineForConfig._id,
                        machineName: selectedMachineForConfig.name,
                        machineCode: selectedMachineForConfig.code,
                        machineConfig: machineConfig,
                        priority: "medium" as const,
                        estimatedHours: 0,
                        actualHours: 0,
                        status: "planned" as const,
                      };
                      
                      setResources([...resources, newResource]);
                      setIsMachineConfigOpen(false);
                      setSelectedMachineForConfig(null);
                      setMachineConfig({ inputs: [], personHours: 0, output: null });
                      
                      // Show appropriate success message
                      if (machineConfig.inputs.length === 0) {
                        toast.success("Machine configuration saved and added to resources");
                      } else if (allStockDeducted) {
                        const totalMaterials = deductionResults.length;
                        const successfulMovements = movementResults.filter(r => r.movementCreated).length;
                        
                        if (successfulMovements === totalMaterials) {
                          toast.success(`Machine configured, stock deducted for ${totalMaterials} materials, and movement entries created`);
                        } else {
                          toast.success(`Machine configured and stock deducted for ${totalMaterials} materials`);
                          if (successfulMovements < totalMaterials) {
                            toast.warning(`Could not create movement entries for ${totalMaterials - successfulMovements} materials`);
                          }
                        }
                      } else {
                        toast.success("Machine configuration saved");
                        const failedDeductions = deductionResults.filter(r => !r.success);
                        if (failedDeductions.length > 0) {
                          toast.warning(`Could not deduct stock for ${failedDeductions.length} materials - please check manually`);
                        }
                      }

                      // Refresh materials data to show updated stock
                      const organisationId = localStorage.getItem("organisationId");
                      if (organisationId) {
                        dispatch(fetchMaterials({ page: 1, limit: 100, location: "", warehouse: "" }));
                      }
                    }}
                    className="flex-1"
                  >
                    Save Configuration & Add to Resources
                  </Button>
                  <Button
                    onClick={() => {
                      setIsMachineConfigOpen(false);
                      setSelectedMachineForConfig(null);
                      setMachineConfig({ inputs: [], personHours: 0, output: null });
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={handleStatusFilterChange}>
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
        <Select 
          value={locationFilter} 
          onValueChange={handleLocationFilterChange}
          disabled={isLocationRestricted}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Location" />
          </SelectTrigger>
          <SelectContent>
            {!isLocationRestricted && <SelectItem value="all">All Locations</SelectItem>}
            {locations
              .filter(location => !isLocationRestricted || location._id === userProfile?.location)
              .map((location) => (
                <SelectItem key={location._id} value={location._id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {location.name}
                  </div>
                </SelectItem>
              ))}
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
              key={c._id}
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
                        onClick={() => canDelete && handleDelete(c._id)}
                        className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
                      >

                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{c.description}</p>
                  
                  {/* Projects and WBS Tasks Display */}
                  {(c.projects && c.projects.length > 0) || (c.wbsTasks && c.wbsTasks.length > 0) ? (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">
                        Projects & Tasks ({(c.projects?.length || 0) + (c.wbsTasks?.length || 0)}):
                      </h4>
                      <div className="space-y-1 text-xs">
                        {c.projects?.map((project) => (
                          <div key={project.id} className="flex items-center gap-2">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">Project</span>
                            <span className="font-medium">{project.projectName}</span>
                            <span className="text-gray-500">({project.projectAllocation}% allocation)</span>
                          </div>
                        ))}
                        {c.wbsTasks?.map((task) => (
                          <div key={task.id} className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">WBS Task</span>
                            <span className="font-medium">{task.wbsTaskName}</span>
                            <span className="text-gray-500">({task.wbsTaskDuration}h duration)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Resources Section - Show new resources array or legacy single resources */}
                  {((c as any).resources && (c as any).resources.length > 0) ? (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Resources ({(c as any).resources.length}):</h4>
                      <div className="space-y-2 text-xs">
                        {(c as any).resources.map((resource: WorkCenterResource) => (
                          <div key={resource.id} className="border-l-2 border-gray-300 pl-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded font-medium ${
                                resource.resourceType === "sparePart" ? "bg-blue-100 text-blue-800" :
                                resource.resourceType === "project" ? "bg-green-100 text-green-800" :
                                resource.resourceType === "wbsTask" ? "bg-purple-100 text-purple-800" :
                                resource.resourceType === "equipment" ? "bg-cyan-100 text-cyan-800" :
                                resource.resourceType === "machine" ? "bg-indigo-100 text-indigo-800" :
                                "bg-orange-100 text-orange-800"
                              }`}>
                                {resource.resourceType === "sparePart" ? "Spare Part" :
                                 resource.resourceType === "project" ? "Project" :
                                 resource.resourceType === "wbsTask" ? "WBS Task" :
                                 resource.resourceType === "equipment" ? "Equipment" :
                                 resource.resourceType === "machine" ? "Machine" : "Work Order"}
                              </span>
                              <span className="font-medium">
                                {resource.sparePartName || resource.projectName || resource.wbsTaskName || 
                                 resource.equipmentName || resource.machineName || resource.productName}
                              </span>
                            </div>
                            
                            {/* Machine Configuration Details */}
                            {resource.resourceType === "machine" && resource.machineConfig && (
                              <div className="ml-4 mt-1 space-y-1">
                                <div className="text-gray-600">
                                  <strong>Person Hours:</strong> {resource.machineConfig.personHours}
                                </div>
                                
                                {resource.machineConfig.inputs.length > 0 && (
                                  <div className="text-gray-600">
                                    <strong>Input Materials:</strong>
                                    <div className="ml-2 mt-1">
                                      {resource.machineConfig.inputs.map((input, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                          <span>• {input.name}</span>
                                          <span className="text-gray-500">({input.quantity} {input.unit})</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {resource.machineConfig.output && (
                                  <div className="text-gray-600">
                                    <strong>Output Product:</strong>
                                    <div className="ml-2 flex items-center gap-1">
                                      <span>• {resource.machineConfig.output.name}</span>
                                      <span className="text-gray-500">({resource.machineConfig.output.quantity} {resource.machineConfig.output.unit})</span>
                                      {resource.machineConfig.output.isCustom && (
                                        <span className="text-blue-600 text-xs">(Custom)</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
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
                      <div className="col-span-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>Location: <strong>{c.locationName || (c as any).location?.name}</strong></span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </AnimatePresence>

      {/* Pagination */}
      {pagination && pagination.totalItems > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}
    </div>
  );
}
