import { usePermission } from "@/hooks/userPermission";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Pagination } from "../../../components/ui/pagination";
import { Download, Plus, ShieldAlert, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import { storage, STORAGE_KEYS } from "../../../lib/storage";
import { 
  fetchForecasts, 
  createForecast, 
  updateForecast,
  deleteForecast as deleteForecastAction,
  fetchMPS, 
  createMPS,
  updateMPS,
  deleteMPS as deleteMPSAction,
  generateMPS, 
  fetchMRPLines,
  runMRP,
  fetchPlannedOrders,
  createPlannedOrder,
  updatePlannedOrder,
  deletePlannedOrder as deletePlannedOrderAction
} from "../../../redux/slices/production/ppcSlice";
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

/**
STORAGE_KEYS used (ensure these exist in your storage.ts):
- FORECASTS
- MPS_PLANS
- MRP_REQUIREMENTS
- PLANNED_ORDERS
- WORK_CENTERS
- BOMS
- ITEMS
- INVENTORY
- (optional) PRODUCTION_TARGET_PER_DAY, SCRAP_COST_PER_UNIT
*/

/* ----------------------------- Helpers ----------------------------- */
const safeGet = <T,>(key: string, def: T) => storage.get(key, def);

/* ----------------------------- Types ----------------------------- */
type Forecast = {
  _id?: string;
  id?: string;
  productId: string;
  rawMaterialId?: string;
  currentStock: number;
  demandForecast: number;
  suggestedReplenishment: number;
  leadTime: number;
  priority: "low" | "medium" | "high" | "critical";
  replenishmentRule: "automatic" | "manual";
  location?: string;
  organisationId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type MPS = {
  _id?: string;
  id?: string;
  productId: string;
  period: string;
  plannedQty: number;
  status?: "planned" | "released" | "closed";
  location?: string;
  organisationId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type PlannedOrder = {
  _id?: string;
  id?: string;
  productId: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status?: "planned" | "released" | "closed";
  location?: string;
  organisationId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type WorkCenter = {
  id: string;
  name: string;
  workingHoursPerDay?: number;
  costRatePerHour?: number;
};

/* ----------------------------- Component ----------------------------- */
export default function PPCDashboard() {
  const dispatch = useDispatch();
  const ppcState = useSelector((state: any) => state.ppc || {});
  const { 
    forecasts = [], 
    forecastsPagination = { total: 0, page: 1, totalPages: 0, hasNext: false, hasPrev: false },
    mps = [], 
    mpsPagination = { total: 0, page: 1, totalPages: 0, hasNext: false, hasPrev: false },
    mrpPagination = { total: 0, page: 1, totalPages: 0, hasNext: false, hasPrev: false },
    plannedOrders = [],
    plannedOrdersPagination = { total: 0, page: 1, totalPages: 0, hasNext: false, hasPrev: false }
  } = ppcState;
  
  // Check authentication state
  const authState = useSelector((state: any) => state.auth || {});
  const { userProfile, organisationId, isAuthenticated } = authState;
  
  // Master data for locations
  const { locations } = useSelector((state: any) => state.masterData);
  
  const canView = usePermission("ppc", "view");
  const canCreate = usePermission("ppc", "create");
  const canEdit = usePermission("ppc", "edit");
  const canDelete = usePermission("ppc", "delete");

  // Location filter states
  const [locationFilter, setLocationFilter] = useState("all");
  const [locationOpen, setLocationOpen] = useState(false);
  
  // Pagination states
  const [forecastPage, setForecastPage] = useState(1);
  const [forecastLimit, setForecastLimit] = useState(10);
  const [forecastSearch, setForecastSearch] = useState("");
  
  const [mpsPage, setMpsPage] = useState(1);
  const [mpsLimit, setMpsLimit] = useState(10);
  const [mpsSearch, setMpsSearch] = useState("");
  
  const [mrpPage, setMrpPage] = useState(1);
  const [mrpLimit, setMrpLimit] = useState(10);
  const [mrpSearch, setMrpSearch] = useState("");
  
  const [plannedOrdersPage, setPlannedOrdersPage] = useState(1);
  const [plannedOrdersLimit, setPlannedOrdersLimit] = useState(10);
  const [plannedOrdersSearch, setPlannedOrdersSearch] = useState("");
  
  // Location restriction logic (same as Projects page)
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  // Debug authentication
  useEffect(() => {
    console.log("PPC: Auth state:", { userProfile, organisationId, isAuthenticated });
    console.log("PPC: User profile exists:", !!userProfile);
    console.log("PPC: Organisation ID:", organisationId);
  }, [userProfile, organisationId, isAuthenticated]);

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

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Required
        </h3>
        <p className="text-gray-600">
          Please log in to access the PPC dashboard.
        </p>
      </div>
    );
  }

  /* ----------------------------- Data states ----------------------------- */
  const [workCenters] = useState<WorkCenter[]>(() => safeGet(STORAGE_KEYS.WORK_CENTERS, []) || []);
  const [products, setProducts] = useState<any[]>([]);
  const items = safeGet(STORAGE_KEYS.ITEMS, []) as any[] || []; // for display
  const routings = safeGet(STORAGE_KEYS.ROUTINGS, []) as any[] || []; // for CRP calculation

  /* ----------------------------- Load data on mount ----------------------------- */
  // Function to fetch products
  const fetchProducts = async () => {
    try {
      if (organisationId) {
        console.log("PPC: Fetching products for orgId:", organisationId);
        const response = await axios.get(`/inventory/product/all/${organisationId}`);
        console.log("PPC: Products API response:", response.data);
        if (response.data.success) {
          const productsData = response.data.products || []; // products is the correct field
          console.log("PPC: Products data:", productsData);
          setProducts(productsData);
        } else {
          console.log("PPC: Products API returned success: false");
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      console.error("Error response:", error.response?.data);
    }
  };

  // Location filter change handler
  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    // You can add API calls here to filter data by location if needed
  };

  // Helper function to get product name by ID
  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product ? `${product.name} (${product.code || product._id})` : productId;
  };

  useEffect(() => {
    // Debug: Check if user is authenticated
    const token = localStorage.getItem("token");
    console.log("PPC: Token exists:", !!token);
    console.log("PPC: Token value:", token?.substring(0, 20) + "...");
    console.log("PPC: Is authenticated:", isAuthenticated);
    console.log("PPC: Organisation ID from Redux:", organisationId);
    
    // Fetch master data
    dispatch(fetchMasterData("location") as any);
    
    // Only load data if user is authenticated
    if (isAuthenticated && organisationId) {
      console.log("PPC: Loading data...");
      dispatch(fetchForecasts({ page: 1, limit: 10 }) as any);
      dispatch(fetchMPS({ page: 1, limit: 10 }) as any);
      dispatch(fetchPlannedOrders({ page: 1, limit: 10 }) as any);
      dispatch(fetchMRPLines({ page: 1, limit: 10 }) as any); // Fetch MRP lines on page load
      console.log("PPC: About to fetch products...");
      fetchProducts(); // Fetch products list
    } else {
      console.log("PPC: User not authenticated or no organisation ID");
      console.log("PPC: isAuthenticated:", isAuthenticated);
      console.log("PPC: organisationId:", organisationId);
    }
  }, [dispatch, isAuthenticated, organisationId]);

  // Auto-set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Fetch data when location filter changes
  useEffect(() => {
    if (isAuthenticated && organisationId) {
      const locationParam = locationFilter === "all" ? undefined : locationFilter;
      
      // Re-fetch all data with location filter and pagination
      dispatch(fetchForecasts({ 
        location: locationParam, 
        page: forecastPage, 
        limit: forecastLimit, 
        search: forecastSearch 
      }) as any);
      dispatch(fetchMPS({ 
        location: locationParam, 
        page: mpsPage, 
        limit: mpsLimit, 
        search: mpsSearch 
      }) as any);
      dispatch(fetchPlannedOrders({ 
        location: locationParam, 
        page: plannedOrdersPage, 
        limit: plannedOrdersLimit, 
        search: plannedOrdersSearch 
      }) as any);
      dispatch(fetchMRPLines({ 
        location: locationParam, 
        page: mrpPage, 
        limit: mrpLimit, 
        search: mrpSearch 
      }) as any);
    }
  }, [locationFilter, isAuthenticated, organisationId, dispatch, 
      forecastPage, forecastLimit, forecastSearch,
      mpsPage, mpsLimit, mpsSearch,
      mrpPage, mrpLimit, mrpSearch,
      plannedOrdersPage, plannedOrdersLimit, plannedOrdersSearch]);

  // Update local MRP lines when Redux state changes - use mrpLines from Redux directly
  const mrpLines = useSelector((state: any) => state.ppc?.mrpLines || []);

  // Pagination handlers
  const handleForecastPageChange = (page: number) => {
    setForecastPage(page);
  };

  const handleForecastLimitChange = (limit: number) => {
    setForecastLimit(limit);
    setForecastPage(1); // Reset to first page when changing limit
  };

  const handleMpsPageChange = (page: number) => {
    setMpsPage(page);
  };

  const handleMpsLimitChange = (limit: number) => {
    setMpsLimit(limit);
    setMpsPage(1);
  };

  const handleMrpPageChange = (page: number) => {
    setMrpPage(page);
  };

  const handleMrpLimitChange = (limit: number) => {
    setMrpLimit(limit);
    setMrpPage(1);
  };

  const handlePlannedOrdersPageChange = (page: number) => {
    setPlannedOrdersPage(page);
  };

  const handlePlannedOrdersLimitChange = (limit: number) => {
    setPlannedOrdersLimit(limit);
    setPlannedOrdersPage(1);
  };

  // Search handlers with debounce
  const handleForecastSearch = (value: string) => {
    setForecastSearch(value);
    setForecastPage(1); // Reset to first page when searching
  };

  const handleMpsSearch = (value: string) => {
    setMpsSearch(value);
    setMpsPage(1);
  };

  const handleMrpSearch = (value: string) => {
    setMrpSearch(value);
    setMrpPage(1);
  };

  const handlePlannedOrdersSearch = (value: string) => {
    setPlannedOrdersSearch(value);
    setPlannedOrdersPage(1);
  };

  /* ----------------------------- UI/CRUD states: Forecast ----------------------------- */
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  const [editingForecast, setEditingForecast] = useState<Forecast | null>(null);
  const [forecastForm, setForecastForm] = useState<Partial<Forecast>>({ 
    productId: "", 
    currentStock: 0, 
    demandForecast: 0, 
    suggestedReplenishment: 0, 
    leadTime: 0,
    priority: "low",
    replenishmentRule: "automatic"
  });

  /* ----------------------------- UI/CRUD states: MPS ----------------------------- */
  const [mpsDialogOpen, setMpsDialogOpen] = useState(false);
  const [editingMps, setEditingMps] = useState<MPS | null>(null);
  const [mpsForm, setMpsForm] = useState<Partial<MPS>>({ productId: "", period: "", plannedQty: 0 });

  /* ----------------------------- UI/CRUD states: MRP ----------------------------- */
  const [mrpDialogOpen, setMrpDialogOpen] = useState(false);

  /* ----------------------------- UI/CRUD states: Planned Orders ----------------------------- */
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PlannedOrder | null>(null);
  const [poForm, setPoForm] = useState<Partial<PlannedOrder>>({ productId: "", quantity: 0, startDate: "", endDate: "" });

  /* ----------------------------- UI: MRP lines are edited inline, CRP just views ----------------------------- */

  /* ----------------------------- Forecast CRUD ----------------------------- */
  // Function to fetch current stock for a product
  const fetchProductStock = async (productId: string) => {
    try {
      const response = await axios.get(`/product/single/${productId}`);
      if (response.data.success && response.data.product) {
        const product = response.data.product;
        // Calculate total stock from all warehouses
        const totalStock = product.stocks?.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0) || 0;
        return totalStock;
      }
      return 0;
    } catch (error: any) {
      console.error("Failed to fetch product stock:", error);
      return 0;
    }
  };

  // Function to handle product selection in forecast form
  const handleForecastProductChange = async (productId: string) => {
    setForecastForm({ ...forecastForm, productId });
    
    if (productId) {
      // Fetch and set current stock automatically
      const currentStock = await fetchProductStock(productId);
      setForecastForm(prev => ({ ...prev, productId, currentStock }));
    }
  };

  const openNewForecast = () => { 
    setEditingForecast(null); 
    setForecastForm({ 
      productId: "", 
      currentStock: 0, 
      demandForecast: 0, 
      suggestedReplenishment: 0, 
      leadTime: 0,
      priority: "low",
      replenishmentRule: "automatic",
      location: isLocationRestricted ? userProfile.location : undefined
    }); 
    setForecastDialogOpen(true); 
  };
  
  const openEditForecast = (f: Forecast) => { 
    setEditingForecast(f); 
    setForecastForm({ 
      ...f,
      location: f.location || (isLocationRestricted ? userProfile.location : undefined)
    }); 
    setForecastDialogOpen(true); 
  };
  
  // Function to deduct stock from product
  const deductProductStock = async (productId: string, quantityToDeduct: number) => {
    try {
      // First get the current product details
      const response = await axios.get(`/product/single/${productId}`);
      if (response.data.success && response.data.product) {
        const product = response.data.product;
        
        // Calculate total current stock
        const totalCurrentStock = product.stocks?.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0) || 0;
        
        // Check if there's enough stock
        if (totalCurrentStock < quantityToDeduct) {
          toast.warning(`Insufficient stock! Available: ${totalCurrentStock}, Required: ${quantityToDeduct}`);
          return false;
        }
        
        // Calculate new stock quantities by deducting from each warehouse proportionally
        let remainingToDeduct = quantityToDeduct;
        const updatedStocks = product.stocks?.map((stock: any) => {
          const currentQty = stock.quantity || 0;
          
          if (remainingToDeduct > 0 && currentQty > 0) {
            const deductFromThisStock = Math.min(currentQty, remainingToDeduct);
            remainingToDeduct -= deductFromThisStock;
            
            return {
              ...stock,
              quantity: currentQty - deductFromThisStock
            };
          }
          return stock;
        }) || [];

        // Update the product with new stock quantities
        const updateResponse = await axios.put(`/product/update/${productId}`, {
          ...product,
          stocks: updatedStocks
        });

        if (updateResponse.data.success) {
          console.log(`✅ Successfully deducted ${quantityToDeduct} units from product ${productId}`);
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error("Failed to deduct product stock:", error);
      return false;
    }
  };

  const saveForecast = async () => {
    if (!forecastForm.productId || !forecastForm.demandForecast) {
      toast.error("Product and demand forecast are required");
      return;
    }
    
    const demandQuantity = Number(forecastForm.demandForecast) || 0;
    
    // For new forecasts, check if there's enough stock before saving
    if (!editingForecast && demandQuantity > 0) {
      try {
        const response = await axios.get(`/product/single/${forecastForm.productId}`);
        if (response.data.success && response.data.product) {
          const totalCurrentStock = response.data.product.stocks?.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0) || 0;
          
          if (totalCurrentStock < demandQuantity) {
            toast.error(`Cannot create forecast! Insufficient stock. Available: ${totalCurrentStock}, Required: ${demandQuantity}`);
            return;
          }
        }
      } catch (error: any) {
        console.error("Failed to check stock availability:", error);
        toast.error("Failed to verify stock availability");
        return;
      }
    }
    
    try {
      if (editingForecast) {
        // Update existing forecast
        await dispatch(updateForecast({ 
          id: editingForecast._id || editingForecast.id || '', 
          data: forecastForm 
        }) as any);
        toast.success("Forecast updated successfully");
      } else {
        // Create new forecast
        await dispatch(createForecast(forecastForm) as any);
        
        // After successfully creating forecast, deduct the demand quantity from product stock
        if (demandQuantity > 0) {
          const stockDeducted = await deductProductStock(forecastForm.productId, demandQuantity);
          if (stockDeducted) {
            // Create movement entry for the stock deduction
            const product = products.find(p => p._id === forecastForm.productId);
            const movementCreated = await createMovementEntry({
              materialId: forecastForm.productId,
              materialName: product?.name || "Unknown Product",
              quantity: demandQuantity,
              unit: "pcs", // You may want to get this from product data
              source: "Finished Goods Inventory",
              destination: "PPC Forecast",
              referenceNumber: `FORECAST-${Date.now()}`,
              remarks: `Stock deducted for demand forecast`,
              itemType: "product",
              unitCost: 0 // You may want to get actual cost from product
            });

            if (movementCreated) {
              toast.success(`Forecast created, ${demandQuantity} units deducted from stock, and movement entry created`);
            } else {
              toast.success(`Forecast created and ${demandQuantity} units deducted from stock`);
              toast.warning("Could not create movement entry - please check manually");
            }
          } else {
            toast.success("Forecast created successfully");
            toast.warning("Could not deduct stock - please check manually");
          }
        } else {
          toast.success("Forecast created successfully");
        }
      }
      
      // Refresh products data to show updated stock
      fetchProducts();
      
      setForecastDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to save forecast");
      console.error(error);
    }
  };
  
  const deleteForecast = async (id: string) => {
    try {
      await dispatch(deleteForecastAction(id) as any);
      toast.success("Forecast deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete forecast");
      console.error(error);
    }
  };

  /* ----------------------------- MPS CRUD ----------------------------- */
  const openNewMps = () => { 
    setEditingMps(null); 
    setMpsForm({ 
      productId: "", 
      period: "", 
      plannedQty: 0,
      location: isLocationRestricted ? userProfile.location : undefined
    }); 
    setMpsDialogOpen(true); 
  };
  
  const openEditMps = (x: MPS) => { 
    setEditingMps(x); 
    setMpsForm({ 
      ...x,
      location: x.location || (isLocationRestricted ? userProfile.location : undefined)
    }); 
    setMpsDialogOpen(true); 
  };
  
  const saveMps = async () => {
    if (!mpsForm.productId || !mpsForm.period) {
      toast.error("Product and period are required");
      return;
    }
    
    try {
      if (editingMps) {
        // Update existing MPS
        await dispatch(updateMPS({ 
          id: editingMps._id || editingMps.id || '', 
          data: mpsForm 
        }) as any);
        toast.success("MPS updated successfully");
      } else {
        // Create new MPS
        await dispatch(createMPS(mpsForm) as any);
        toast.success("MPS created successfully");
      }
      
      setMpsDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to save MPS");
      console.error(error);
    }
  };
  
  const deleteMps = async (id: string) => {
    try {
      await dispatch(deleteMPSAction(id) as any);
      toast.success("MPS deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete MPS");
      console.error(error);
    }
  };

  /* Auto-generate MPS from Forecast */
  const generateMpsFromForecast = async () => {
    if (!Array.isArray(forecasts) || forecasts.length === 0) {
      toast.error("No forecasts to generate MPS from");
      return;
    }
    
    try {
      await dispatch(generateMPS() as any);
      toast.success("MPS generated from forecasts successfully");
    } catch (error: any) {
      toast.error("Failed to generate MPS");
      console.error(error);
    }
  };

  /* ----------------------------- MRP (run from MPS & BOMs & INVENTORY) ----------------------------- */
  const openMrpDialog = () => {
    setMrpDialogOpen(true);
  };

  const runMrpCalculation = async () => {
    try {
      await dispatch(runMRP() as any);
      toast.success("MRP calculation completed");
      setMrpDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to run MRP");
      console.error(error);
    }
  };

  const createPrForLine = async (id: string) => {
    try {
      await axios.post(`/ppc/mrp/${id}/create-pr`);
      // Re-fetch MRP lines to get updated data
      dispatch(fetchMRPLines({ 
        location: locationFilter === "all" ? undefined : locationFilter, 
        page: mrpPage, 
        limit: mrpLimit, 
        search: mrpSearch 
      }) as any);
      toast.success("Purchase Requisition created successfully");
    } catch (error: any) {
      toast.error("Failed to create Purchase Requisition");
      console.error(error);
    }
  };

  const updateMrpAvailable = async (id: string, val: number) => {
    try {
      await axios.put(`/ppc/mrp/${id}`, { availableQty: val });
      // Re-fetch MRP lines to get updated data
      dispatch(fetchMRPLines({ 
        location: locationFilter === "all" ? undefined : locationFilter, 
        page: mrpPage, 
        limit: mrpLimit, 
        search: mrpSearch 
      }) as any);
    } catch (error: any) {
      toast.error("Failed to update MRP line");
      console.error(error);
    }
  };

  /* ----------------------------- Planned Orders CRUD & auto-generate from MPS ----------------------------- */
  const openNewPo = () => { 
    setEditingPo(null); 
    setPoForm({ 
      productId: "", 
      quantity: 0, 
      startDate: new Date().toISOString().slice(0, 10), 
      endDate: new Date().toISOString().slice(0, 10),
      location: isLocationRestricted ? userProfile.location : undefined
    }); 
    setPoDialogOpen(true); 
  };
  
  const openEditPo = (p: PlannedOrder) => { 
    setEditingPo(p); 
    setPoForm({ 
      ...p,
      location: p.location || (isLocationRestricted ? userProfile.location : undefined)
    }); 
    setPoDialogOpen(true); 
  };
  
  const savePo = async () => {
    if (!poForm.productId || !poForm.startDate) {
      toast.error("Product & start date are required");
      return;
    }
    
    try {
      if (editingPo) {
        // Update existing planned order
        await dispatch(updatePlannedOrder({ 
          id: editingPo._id || editingPo.id || '', 
          data: poForm 
        }) as any);
        toast.success("Planned order updated successfully");
      } else {
        // Create new planned order
        await dispatch(createPlannedOrder(poForm) as any);
        toast.success("Planned order created successfully");
      }
      
      setPoDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to save planned order");
      console.error(error);
    }
  };
  
  const deletePo = async (id: string) => {
    try {
      await dispatch(deletePlannedOrderAction(id) as any);
      toast.success("Planned order deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete planned order");
      console.error(error);
    }
  };

  const generatePoFromMps = async () => {
    if (!Array.isArray(mps) || mps.length === 0) {
      toast.error("No MPS rows to generate orders from");
      return;
    }
    
    try {
      const newOrders = mps.map((m: any) => ({
        productId: m.productId,
        quantity: Number(m.plannedQty) || 0,
        startDate: `${m.period}-01`, // naive mapping: month start; adapt as needed
        endDate: `${m.period}-01`,
        status: "planned",
      }));
      
      // Create multiple planned orders
      await Promise.all(newOrders.map(order => dispatch(createPlannedOrder(order) as any)));
      
      toast.success("Planned orders generated from MPS successfully");
    } catch (error: any) {
      toast.error("Failed to generate planned orders");
      console.error(error);
    }
  };

  /* ----------------------------- CRP: calculate load from plannedOrders & routings ----------------------------- */
  const crpLoadByWC = useMemo(() => {
    const map: Record<string, number> = {}; // minutes
    (plannedOrders || []).forEach((po: any) => {
      const qty = Number(po.quantity) || 0;
      const routing = (routings || []).find((r: any) => r.productId === po.productId);
      if (!routing || !Array.isArray(routing.operations)) return;
      routing.operations.forEach((op: any) => {
        const wc = op.workCenterId || "Unknown";
        const minutesPerUnit = Number(op.standardMinutes) || 0;
        map[wc] = (map[wc] || 0) + minutesPerUnit * qty;
      });
    });
    // convert to array with available hours & utilization
    return Object.keys(map).map((wcId) => {
      const wc = (workCenters || []).find((w: any) => w.id === wcId) || { id: wcId, name: wcId, workingHoursPerDay: 8 };
      const loadMinutes = map[wcId] || 0;
      const availableMinutes = (Number(wc.workingHoursPerDay) || 8) * 60;
      const utilizationPercent = (loadMinutes / Math.max(1, availableMinutes)) * 100;
      return {
        workCenterId: wcId,
        workCenterName: wc.name || wcId,
        loadMinutes,
        availableMinutes,
        utilizationPercent: Math.round(utilizationPercent * 10) / 10,
      };
    });
  }, [plannedOrders, routings, workCenters]);

  /* ----------------------------- Alerts ----------------------------- */
  const shortages = mrpLines.filter((l: any) => l.shortageQty > 0);
  const overloaded = crpLoadByWC.filter((l: any) => l.utilizationPercent > 100);

  /* ----------------------------- Charts data helpers ----------------------------- */
  const forecastTrend = useMemo(() => {
    // aggregate qty by product
    const map: Record<string, number> = {};
    (forecasts || []).forEach((f: any) => {
      const productName = getProductName(f.productId);
      map[productName] = (map[productName] || 0) + (Number(f.demandForecast) || 0);
    });
    return Object.keys(map).sort().map((p) => ({ period: p, qty: map[p] }));
  }, [forecasts, products]);

  const mpsTrend = useMemo(() => {
    const map: Record<string, number> = {};
    (mps || []).forEach((x: any) => map[x.period] = (map[x.period] || 0) + (Number(x.plannedQty) || 0));
    return Object.keys(map).sort().map((p) => ({ period: p, qty: map[p] }));
  }, [mps]);

  const crpChartData = useMemo(() => crpLoadByWC.map((r: any) => ({ name: r.workCenterName, utilization: r.utilizationPercent })), [crpLoadByWC]);

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Production Planning & Control (PPC)</h1>
          <p className="text-muted-foreground">Forecast → MPS → MRP → CRP → Planned Orders — linked with Product Master & Inventory</p>
          <div className="flex gap-2 mt-2">
            {shortages.length > 0 && <Badge variant="destructive">Shortages: {shortages.length}</Badge>}
            {overloaded.length > 0 && <Badge variant="destructive">Overloaded WCs: {overloaded.length}</Badge>}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => { 
            /* quick export example: export MRP */ 
            const csv = mrpLines.map((r: any) => `${r.materialId},${r.requiredQty},${r.availableQty},${r.shortageQty}`).join("\n"); 
            const blob = new Blob([csv], { type: "text/csv" }); 
            const url = URL.createObjectURL(blob); 
            const a = document.createElement("a"); 
            a.href = url; 
            a.download = `mrp_${new Date().toISOString().slice(0, 10)}.csv`; 
            a.click(); 
            URL.revokeObjectURL(url); 
          }}>
            <Download className="mr-2 h-4 w-4" /> Export MRP</Button>
        </div>
      </div>

      {/* Location Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search forecasts, MPS, orders..."
            className="pl-10"
            // You can add search functionality here if needed
          />
        </div>
        <Select 
          disabled={isLocationRestricted} 
          value={locationFilter} 
          onValueChange={handleLocationFilterChange}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {(locations || []).map((loc: any) => (
              <SelectItem key={loc._id} value={loc._id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="forecast">
            <TabsList className="mb-4">
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
              <TabsTrigger value="mps">MPS</TabsTrigger>
              <TabsTrigger value="mrp">MRP</TabsTrigger>
              <TabsTrigger value="crp">CRP</TabsTrigger>
              <TabsTrigger value="orders">Planned Orders</TabsTrigger>
            </TabsList>

            {/* ------------------ FORECAST TAB ------------------ */}
            <TabsContent value="forecast" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Sales Forecast</h3>
                  <p className="text-sm text-muted-foreground">CRUD forecasts and visualize demand trends.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={!canCreate}
                    onClick={() => canCreate && openNewForecast()}
                    className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                  >
                    <Plus className="mr-2 h-4 w-4" /> New Forecast</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Forecast Trend</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line dataKey="qty" stroke="#8884d8" name="Forecast Qty" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Forecast List</CardTitle>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search forecasts..."
                          value={forecastSearch}
                          onChange={(e) => handleForecastSearch(e.target.value)}
                          className="w-64"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Demand Forecast</TableHead>
                          <TableHead>Current Stock</TableHead>
                          <TableHead>Suggested Replenishment</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(forecasts || []).map((f: any) => (
                          <TableRow key={f._id || f.id}>
                            <TableCell>{getProductName(f.productId)}</TableCell>
                            <TableCell>
                              {f.location 
                                ? (locations || []).find((l: any) => l._id === f.location)?.name || "Unknown"
                                : "N/A"
                              }
                            </TableCell>
                            <TableCell>{f.demandForecast}</TableCell>
                            <TableCell>{f.currentStock}</TableCell>
                            <TableCell>{f.suggestedReplenishment}</TableCell>
                            <TableCell><Badge variant={f.priority === 'high' || f.priority === 'critical' ? 'destructive' : 'default'}>{f.priority}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={!canEdit}
                                  onClick={() => canEdit && openEditForecast(f)}
                                  className={canEdit ? "" : "opacity-50 cursor-not-allowed"}
                                >
                                  ✏️</Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={!canDelete}
                                  onClick={() => canDelete && deleteForecast(f._id || f.id || '')}
                                  className={canDelete ? "" : "opacity-50 cursor-not-allowed"}
                                >
                                  🗑</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {(forecasts || []).length === 0 && <div className="text-center text-muted-foreground py-6">No forecasts yet.</div>}
                    
                    {/* Forecast Pagination */}
                    <Pagination
                      currentPage={forecastsPagination.page}
                      totalPages={forecastsPagination.totalPages}
                      totalItems={forecastsPagination.total}
                      itemsPerPage={forecastLimit}
                      onPageChange={handleForecastPageChange}
                      onItemsPerPageChange={handleForecastLimitChange}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ------------------ MPS TAB ------------------ */}
            <TabsContent value="mps" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Master Production Schedule (MPS)</h3>
                  <p className="text-sm text-muted-foreground">Top-level planned production. Auto-generate from Forecast.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={!canCreate}
                    onClick={() => canCreate && openNewMps()}
                    className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                  >
                    New MPS</Button>
                  <Button
                    variant="outline"
                    disabled={!canCreate}
                    onClick={() => canCreate && generateMpsFromForecast()}
                    className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                  >Generate from Forecast</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>MPS Trend</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mpsTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line dataKey="qty" stroke="#82ca9d" name="Planned Qty" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>MPS Table</CardTitle>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search MPS..."
                          value={mpsSearch}
                          onChange={(e) => handleMpsSearch(e.target.value)}
                          className="w-64"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(mps || []).map((r: any) => (
                          <TableRow key={r._id || r.id}>
                            <TableCell>{getProductName(r.productId)}</TableCell>
                            <TableCell>
                              {r.location 
                                ? (locations || []).find((l: any) => l._id === r.location)?.name || "Unknown"
                                : "N/A"
                              }
                            </TableCell>
                            <TableCell>{r.period}</TableCell>
                            <TableCell>{r.plannedQty}</TableCell>
                            <TableCell><Badge>{r.status || "planned"}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={!canEdit}
                                  onClick={() => canEdit && openEditMps(r)}
                                  className={canEdit ? "" : "opacity-50 cursor-not-allowed"}
                                >
                                  ✏️</Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={!canDelete}
                                  onClick={() => canDelete && deleteMps(r._id || r.id || '')}
                                  className={canDelete ? "" : "opacity-50 cursor-not-allowed"}
                                >
                                  🗑</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {(mps || []).length === 0 && <div className="text-center text-muted-foreground py-6">No MPS plans defined.</div>}
                    
                    {/* MPS Pagination */}
                    <Pagination
                      currentPage={mpsPagination.page}
                      totalPages={mpsPagination.totalPages}
                      totalItems={mpsPagination.total}
                      itemsPerPage={mpsLimit}
                      onPageChange={handleMpsPageChange}
                      onItemsPerPageChange={handleMpsLimitChange}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ------------------ MRP TAB ------------------ */}
            <TabsContent value="mrp" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Material Requirement Planning (MRP)</h3>
                  <p className="text-sm text-muted-foreground">Calculate net materials from MPS and BOM, trigger PRs for shortages.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={!canCreate}
                    onClick={() => canCreate && openMrpDialog()}
                    className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Run MRP</Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>MRP Lines & Purchase Reqs</CardTitle>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search MRP lines..."
                        value={mrpSearch}
                        onChange={(e) => handleMrpSearch(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Shortage</TableHead>
                        <TableHead>PR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mrpLines.map((l: any) => (
                        <TableRow key={l._id || l.id}>
                          <TableCell>{(items.find((it: any) => it.id === l.materialId)?.name) || l.materialId}</TableCell>
                          <TableCell>{l.requiredQty}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={l.availableQty}
                              disabled={!canEdit}
                              onChange={(e) => canEdit && updateMrpAvailable(l._id || l.id || '', Number(e.target.value) || 0)}
                              className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                            />

                          </TableCell>
                          <TableCell>{l.shortageQty}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                disabled={!canCreate || l.prCreated || l.shortageQty <= 0}
                                onClick={() => canCreate && createPrForLine(l._id || l.id || '')}
                              >
                                Create PR</Button>
                              {l.prCreated && <Badge>PR Created</Badge>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {mrpLines.length === 0 && <div className="text-center text-muted-foreground py-6">No MRP lines — run MRP first.</div>}
                  
                  {/* MRP Pagination */}
                  <Pagination
                    currentPage={mrpPagination.page}
                    totalPages={mrpPagination.totalPages}
                    totalItems={mrpPagination.total}
                    itemsPerPage={mrpLimit}
                    onPageChange={handleMrpPageChange}
                    onItemsPerPageChange={handleMrpLimitChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ------------------ CRP TAB ------------------ */}
            <TabsContent value="crp" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Capacity Requirement Planning (CRP)</h3>
                  <p className="text-sm text-muted-foreground">Check work center loads vs available capacity.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Work Center Utilization</CardTitle></CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={crpChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="utilization" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Load Table</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Work Center</TableHead>
                          <TableHead>Load (hrs)</TableHead>
                          <TableHead>Available (hrs)</TableHead>
                          <TableHead>Util (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {crpLoadByWC.map((r: any) => (
                          <TableRow key={r.workCenterId}>
                            <TableCell>{r.workCenterName}</TableCell>
                            <TableCell>{(r.loadMinutes / 60).toFixed(2)}</TableCell>
                            <TableCell>{(r.availableMinutes / 60).toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={r.utilizationPercent > 100 ? "text-red-600 font-semibold" : ""}>{r.utilizationPercent}%</span>
                              {r.utilizationPercent > 100 && <Badge variant="destructive" className="ml-2">Overloaded</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {crpLoadByWC.length === 0 && <div className="text-center text-muted-foreground py-6">No planned orders or routings to calculate load.</div>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ------------------ PLANNED ORDERS TAB ------------------ */}
            <TabsContent value="orders" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Planned Production Orders</h3>
                  <p className="text-sm text-muted-foreground">Create and manage planned orders. Auto-generate from MPS.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={!canCreate}
                    onClick={() => canCreate && openNewPo()}
                    className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                  >
                    New Order</Button>
                  <Button
                    variant="outline"
                    disabled={!canCreate}
                    onClick={() => canCreate && generatePoFromMps()}
                    className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                  >
                    Generate from MPS</Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Planned Orders</CardTitle>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search planned orders..."
                        value={plannedOrdersSearch}
                        onChange={(e) => handlePlannedOrdersSearch(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(plannedOrders || []).map((o: any) => (
                        <TableRow key={o._id || o.id}>
                          <TableCell>{getProductName(o.productId)}</TableCell>
                          <TableCell>
                            {o.location 
                              ? (locations || []).find((l: any) => l._id === o.location)?.name || "Unknown"
                              : "N/A"
                            }
                          </TableCell>
                          <TableCell>{o.quantity}</TableCell>
                          <TableCell>{o.startDate}</TableCell>
                          <TableCell>{o.endDate}</TableCell>
                          <TableCell><Badge>{o.status || "planned"}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={!canEdit}
                                onClick={() => canEdit && openEditPo(o)}
                                className={canEdit ? "" : "opacity-50 cursor-not-allowed"}
                              >
                                ✏️</Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={!canDelete}
                                onClick={() => canDelete && deletePo(o._id || o.id || '')}
                                className={canDelete ? "" : "opacity-50 cursor-not-allowed"}
                              >
                                🗑
                              </Button>

                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(plannedOrders || []).length === 0 && <div className="text-center text-muted-foreground py-6">No planned orders yet.</div>}
                  
                  {/* Planned Orders Pagination */}
                  <Pagination
                    currentPage={plannedOrdersPagination.page}
                    totalPages={plannedOrdersPagination.totalPages}
                    totalItems={plannedOrdersPagination.total}
                    itemsPerPage={plannedOrdersLimit}
                    onPageChange={handlePlannedOrdersPageChange}
                    onItemsPerPageChange={handlePlannedOrdersLimitChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* --------------- Dialogs --------------- */}

      {/* Forecast Dialog */}
      <Dialog open={forecastDialogOpen} onOpenChange={setForecastDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingForecast ? "Edit Forecast" : "New Forecast"}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Product</Label>
            <Select 
              value={forecastForm.productId || ""} 
              onValueChange={handleForecastProductChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="" disabled>No products available (Total: {products.length})</SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name} ({product.code || product._id})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Location Field */}
            <Label>Location</Label>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLocationRestricted}
                >
                  {forecastForm.location
                    ? (locations || []).find((l: any) => l._id === forecastForm.location)?.name
                    : "Select Location"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              
              {!isLocationRestricted && (
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {(locations || []).map((l: any) => (
                          <CommandItem
                            key={l._id}
                            value={l.name}
                            onSelect={() => {
                              setForecastForm({ ...forecastForm, location: l._id });
                              setLocationOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                forecastForm.location === l._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {l.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
            {isLocationRestricted && (
              <p className="text-[10px] text-muted-foreground">
                *Location is fixed based on your permissions.
              </p>
            )}

            <Label>Current Stock</Label>
            <Input type="number" value={forecastForm.currentStock ?? 0} onChange={(e) => setForecastForm({ ...forecastForm, currentStock: Number(e.target.value) })} />
            <Label>Demand Forecast</Label>
            <Input type="number" value={forecastForm.demandForecast ?? 0} onChange={(e) => setForecastForm({ ...forecastForm, demandForecast: Number(e.target.value) })} />
            {/* Stock validation indicator */}
            {forecastForm.productId && forecastForm.demandForecast && forecastForm.currentStock !== undefined && (
              <div className={`text-sm p-2 rounded ${
                Number(forecastForm.currentStock) >= Number(forecastForm.demandForecast) 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {Number(forecastForm.currentStock) >= Number(forecastForm.demandForecast) 
                  ? `✅ Sufficient stock available (${forecastForm.currentStock} ≥ ${forecastForm.demandForecast})`
                  : `⚠️ Insufficient stock! Available: ${forecastForm.currentStock}, Required: ${forecastForm.demandForecast}`
                }
              </div>
            )}
            <Label>Suggested Replenishment</Label>
            <Input type="number" value={forecastForm.suggestedReplenishment ?? 0} onChange={(e) => setForecastForm({ ...forecastForm, suggestedReplenishment: Number(e.target.value) })} />
            <Label>Lead Time (days)</Label>
            <Input type="number" value={forecastForm.leadTime ?? 0} onChange={(e) => setForecastForm({ ...forecastForm, leadTime: Number(e.target.value) })} />
            <Label>Priority</Label>
            <select 
              value={forecastForm.priority || "low"} 
              onChange={(e) => setForecastForm({ ...forecastForm, priority: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForecastDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={editingForecast ? !canEdit : !canCreate}
              onClick={() => (editingForecast ? canEdit : canCreate) && saveForecast()}
            >
              Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MPS Dialog */}
      <Dialog open={mpsDialogOpen} onOpenChange={setMpsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingMps ? "Edit MPS" : "New MPS"}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Product</Label>
            <Select 
              value={mpsForm.productId || ""} 
              onValueChange={(value) => setMpsForm({ ...mpsForm, productId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="" disabled>No products available (Total: {products.length})</SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name} ({product.code || product._id})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Location Field */}
            <Label>Location</Label>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLocationRestricted}
                >
                  {mpsForm.location
                    ? (locations || []).find((l: any) => l._id === mpsForm.location)?.name
                    : "Select Location"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              
              {!isLocationRestricted && (
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {(locations || []).map((l: any) => (
                          <CommandItem
                            key={l._id}
                            value={l.name}
                            onSelect={() => {
                              setMpsForm({ ...mpsForm, location: l._id });
                              setLocationOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                mpsForm.location === l._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {l.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
            {isLocationRestricted && (
              <p className="text-[10px] text-muted-foreground">
                *Location is fixed based on your permissions.
              </p>
            )}

            <Label>Period</Label>
            <Input value={mpsForm.period || ""} onChange={(e) => setMpsForm({ ...mpsForm, period: e.target.value })} />
            <Label>Planned Qty</Label>
            <Input type="number" value={mpsForm.plannedQty ?? 0} onChange={(e) => setMpsForm({ ...mpsForm, plannedQty: Number(e.target.value) })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMpsDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={editingMps ? !canEdit : !canCreate}
              onClick={() => (editingMps ? canEdit : canCreate) && saveMps()}
            >
              Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Planned Order Dialog */}
      <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingPo ? "Edit Order" : "New Order"}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Product</Label>
            <Select 
              value={poForm.productId || ""} 
              onValueChange={(value) => setPoForm({ ...poForm, productId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="" disabled>No products available (Total: {products.length})</SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name} ({product.code || product._id})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Location Field */}
            <Label>Location</Label>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLocationRestricted}
                >
                  {poForm.location
                    ? (locations || []).find((l: any) => l._id === poForm.location)?.name
                    : "Select Location"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              
              {!isLocationRestricted && (
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {(locations || []).map((l: any) => (
                          <CommandItem
                            key={l._id}
                            value={l.name}
                            onSelect={() => {
                              setPoForm({ ...poForm, location: l._id });
                              setLocationOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                poForm.location === l._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {l.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
            {isLocationRestricted && (
              <p className="text-[10px] text-muted-foreground">
                *Location is fixed based on your permissions.
              </p>
            )}

            <Label>Quantity</Label>
            <Input type="number" value={poForm.quantity ?? 0} onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })} />
            <Label>Start Date</Label>
            <Input type="date" value={poForm.startDate || ""} onChange={(e) => setPoForm({ ...poForm, startDate: e.target.value })} />
            <Label>End Date</Label>
            <Input type="date" value={poForm.endDate || ""} onChange={(e) => setPoForm({ ...poForm, endDate: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPoDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={editingPo ? !canEdit : !canCreate}
              onClick={() => (editingPo ? canEdit : canCreate) && savePo()}
            >
              Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MRP Configuration Dialog */}
      <Dialog open={mrpDialogOpen} onOpenChange={setMrpDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Run MRP Calculation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">MRP Process Overview</h4>
              <p className="text-sm text-blue-800 mb-2">
                Material Requirements Planning (MRP) will calculate material needs based on:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>• Current Master Production Schedule (MPS)</li>
                <li>• Bill of Materials (BOM) for each product</li>
                <li>• Current inventory levels</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Prerequisites Required</h4>
              <p className="text-sm text-yellow-800 mb-2">
                Before running MRP, ensure you have:
              </p>
              <ul className="text-sm text-yellow-800 space-y-1 ml-4">
                <li>• At least one MPS record with planned quantity</li>
                <li>• BOMs created for your products in BOM Management</li>
                <li>• Materials/Raw materials defined in BOM items</li>
              </ul>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ Important Notice</h4>
              <p className="text-sm text-red-800">
                Running MRP will clear all existing MRP lines and recalculate material requirements from scratch.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-semibold">MPS Records</Label>
                <p className="text-muted-foreground">{(mps || []).length} active plans</p>
              </div>
              <div>
                <Label className="font-semibold">Current MRP Lines</Label>
                <p className="text-muted-foreground">{mrpLines.length} existing lines</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMrpDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!canCreate}
              onClick={() => canCreate && runMrpCalculation()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Run MRP Calculation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
