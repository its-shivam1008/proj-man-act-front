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
import { Download, Plus, ShieldAlert } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

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
  organisationId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type MrpLine = {
  _id?: string;
  id?: string;
  materialId: string;
  requiredQty: number;
  availableQty: number;
  shortageQty: number;
  prCreated?: boolean;
  organisationId?: string;
};

type PlannedOrder = {
  _id?: string;
  id?: string;
  productId: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status?: "planned" | "released" | "closed";
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
  const { forecasts = [], mps = [], plannedOrders = [] } = ppcState;
  
  // Check authentication state
  const authState = useSelector((state: any) => state.auth || {});
  const { userProfile, organisationId, isAuthenticated } = authState;
  
  const canView = usePermission("ppc", "view");
  const canCreate = usePermission("ppc", "create");
  const canEdit = usePermission("ppc", "edit");
  const canDelete = usePermission("ppc", "delete");

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
  const [mrpLines, setMrpLines] = useState<MrpLine[]>([]);
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
    } catch (error) {
      console.error("Failed to fetch products:", error);
      console.error("Error response:", error.response?.data);
    }
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
    
    // Only load data if user is authenticated
    if (isAuthenticated && organisationId) {
      console.log("PPC: Loading data...");
      dispatch(fetchForecasts() as any);
      dispatch(fetchMPS() as any);
      dispatch(fetchPlannedOrders() as any);
      dispatch(fetchMRPLines() as any); // Fetch MRP lines on page load
      console.log("PPC: About to fetch products...");
      fetchProducts(); // Fetch products list
    } else {
      console.log("PPC: User not authenticated or no organisation ID");
      console.log("PPC: isAuthenticated:", isAuthenticated);
      console.log("PPC: organisationId:", organisationId);
    }
  }, [dispatch, isAuthenticated, organisationId]);

  // Update local MRP lines when Redux state changes
  const reduxMrpLines = useSelector((state: any) => state.ppc?.mrpLines || []);
  useEffect(() => {
    if (reduxMrpLines && reduxMrpLines.length > 0) {
      setMrpLines(reduxMrpLines);
    }
  }, [reduxMrpLines]);

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
  const openNewForecast = () => { 
    setEditingForecast(null); 
    setForecastForm({ 
      productId: "", 
      currentStock: 0, 
      demandForecast: 0, 
      suggestedReplenishment: 0, 
      leadTime: 0,
      priority: "low",
      replenishmentRule: "automatic"
    }); 
    setForecastDialogOpen(true); 
  };
  
  const openEditForecast = (f: Forecast) => { 
    setEditingForecast(f); 
    setForecastForm({ ...f }); 
    setForecastDialogOpen(true); 
  };
  
  const saveForecast = async () => {
    if (!forecastForm.productId || !forecastForm.demandForecast) {
      toast.error("Product and demand forecast are required");
      return;
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
        toast.success("Forecast created successfully");
      }
      
      setForecastDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save forecast");
      console.error(error);
    }
  };
  
  const deleteForecast = async (id: string) => {
    try {
      await dispatch(deleteForecastAction(id) as any);
      toast.success("Forecast deleted successfully");
    } catch (error) {
      toast.error("Failed to delete forecast");
      console.error(error);
    }
  };

  /* ----------------------------- MPS CRUD ----------------------------- */
  const openNewMps = () => { 
    setEditingMps(null); 
    setMpsForm({ productId: "", period: "", plannedQty: 0 }); 
    setMpsDialogOpen(true); 
  };
  
  const openEditMps = (x: MPS) => { 
    setEditingMps(x); 
    setMpsForm({ ...x }); 
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
    } catch (error) {
      toast.error("Failed to save MPS");
      console.error(error);
    }
  };
  
  const deleteMps = async (id: string) => {
    try {
      await dispatch(deleteMPSAction(id) as any);
      toast.success("MPS deleted successfully");
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to run MRP");
      console.error(error);
    }
  };

  const createPrForLine = async (id: string) => {
    try {
      await axios.post(`/ppc/mrp/${id}/create-pr`);
      setMrpLines(mrpLines.map((l) => l._id === id || l.id === id ? { ...l, prCreated: true } : l));
      toast.success("Purchase Requisition created successfully");
    } catch (error) {
      toast.error("Failed to create Purchase Requisition");
      console.error(error);
    }
  };

  const updateMrpAvailable = async (id: string, val: number) => {
    try {
      await axios.put(`/ppc/mrp/${id}`, { availableQty: val });
      setMrpLines(mrpLines.map((l) => 
        (l._id === id || l.id === id) ? { 
          ...l, 
          availableQty: val, 
          shortageQty: Math.max(0, l.requiredQty - val) 
        } : l
      ));
    } catch (error) {
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
      endDate: new Date().toISOString().slice(0, 10) 
    }); 
    setPoDialogOpen(true); 
  };
  
  const openEditPo = (p: PlannedOrder) => { 
    setEditingPo(p); 
    setPoForm({ ...p }); 
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
    } catch (error) {
      toast.error("Failed to save planned order");
      console.error(error);
    }
  };
  
  const deletePo = async (id: string) => {
    try {
      await dispatch(deletePlannedOrderAction(id) as any);
      toast.success("Planned order deleted successfully");
    } catch (error) {
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
    } catch (error) {
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
  const shortages = mrpLines.filter((l) => l.shortageQty > 0);
  const overloaded = crpLoadByWC.filter((l) => l.utilizationPercent > 100);

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

  const crpChartData = useMemo(() => crpLoadByWC.map((r) => ({ name: r.workCenterName, utilization: r.utilizationPercent })), [crpLoadByWC]);

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
          <Button onClick={() => { /* quick export example: export MRP */ const csv = mrpLines.map((r) => `${r.materialId},${r.requiredQty},${r.availableQty},${r.shortageQty}`).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `mrp_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url); }}>
            <Download className="mr-2 h-4 w-4" /> Export MRP</Button>
        </div>
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
                  <CardHeader><CardTitle>Forecast List</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
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
                  <CardHeader><CardTitle>MPS Table</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
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
                <CardHeader><CardTitle>MRP Lines & Purchase Reqs</CardTitle></CardHeader>
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
                      {mrpLines.map((l) => (
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
                        {crpLoadByWC.map((r) => (
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
                <CardHeader><CardTitle>Planned Orders</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
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
              onValueChange={(value) => setForecastForm({ ...forecastForm, productId: value })}
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
            <Label>Current Stock</Label>
            <Input type="number" value={forecastForm.currentStock ?? 0} onChange={(e) => setForecastForm({ ...forecastForm, currentStock: Number(e.target.value) })} />
            <Label>Demand Forecast</Label>
            <Input type="number" value={forecastForm.demandForecast ?? 0} onChange={(e) => setForecastForm({ ...forecastForm, demandForecast: Number(e.target.value) })} />
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
