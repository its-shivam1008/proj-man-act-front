import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { AlertTriangle, Download, Plus, ShieldAlert, Trash2 } from "lucide-react";

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
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { storage, STORAGE_KEYS } from "../../../lib/storage";

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

const genId = (pref = "id") => `${pref}_${Math.random().toString(36).slice(2, 9)}`;

/* ----------------------------- Types ----------------------------- */
type Forecast = {
  id: string;
  productId: string;
  period: string; // e.g., 2025-11 or 2025-W45
  forecastQty: number;
  createdAt?: string;
};

type MPS = {
  id: string;
  productId: string;
  period: string;
  plannedQty: number;
  status?: "planned" | "released" | "closed";
  createdAt?: string;
};

type MrpLine = {
  id: string;
  materialId: string;
  requiredQty: number;
  availableQty: number;
  shortageQty: number;
  prCreated?: boolean;
};

type PlannedOrder = {
  id: string;
  productId: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status?: "planned" | "released" | "closed";
  createdAt?: string;
};

type WorkCenter = {
  id: string;
  name: string;
  workingHoursPerDay?: number;
  costRatePerHour?: number;
};

/* ----------------------------- Helpers ----------------------------- */
const safeGet = <T,>(key: string, def: T) => storage.get(key, def);

/* ----------------------------- Component ----------------------------- */
export default function PPCDashboard() {
  const canView = usePermission("ppc", "view");
  const canCreate = usePermission("ppc", "create");
  const canEdit = usePermission("ppc", "edit");
  const canDelete = usePermission("ppc", "delete");

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
  /* ----------------------------- Data states ----------------------------- */
  const [forecasts, setForecasts] = useState<Forecast[]>(() => safeGet(STORAGE_KEYS.FORECASTS, []));
  const [mps, setMps] = useState<MPS[]>(() => safeGet(STORAGE_KEYS.MPS_PLANS, []));
  const [mrpLines, setMrpLines] = useState<MrpLine[]>(() => safeGet(STORAGE_KEYS.MRP_REQUIREMENTS, []));
  const [plannedOrders, setPlannedOrders] = useState<PlannedOrder[]>(() => safeGet(STORAGE_KEYS.PLANNED_ORDERS, []));
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>(() => safeGet(STORAGE_KEYS.WORK_CENTERS, []));
  const items = safeGet(STORAGE_KEYS.ITEMS, []); // for display
  const boms = safeGet(STORAGE_KEYS.BOMS, []); // BOMs used by MRP
  const inventory = safeGet(STORAGE_KEYS.INVENTORY, {}); // map itemId -> qty

  /* ----------------------------- Persist to storage ----------------------------- */
  useEffect(() => storage.set(STORAGE_KEYS.FORECASTS, forecasts), [forecasts]);
  useEffect(() => storage.set(STORAGE_KEYS.MPS_PLANS, mps), [mps]);
  useEffect(() => storage.set(STORAGE_KEYS.MRP_REQUIREMENTS, mrpLines), [mrpLines]);
  useEffect(() => storage.set(STORAGE_KEYS.PLANNED_ORDERS, plannedOrders), [plannedOrders]);

  /* ----------------------------- UI/CRUD states: Forecast ----------------------------- */
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  const [editingForecast, setEditingForecast] = useState<Forecast | null>(null);
  const [forecastForm, setForecastForm] = useState<Partial<Forecast>>({ productId: "", period: "", forecastQty: 0 });

  /* ----------------------------- UI/CRUD states: MPS ----------------------------- */
  const [mpsDialogOpen, setMpsDialogOpen] = useState(false);
  const [editingMps, setEditingMps] = useState<MPS | null>(null);
  const [mpsForm, setMpsForm] = useState<Partial<MPS>>({ productId: "", period: "", plannedQty: 0 });

  /* ----------------------------- UI/CRUD states: Planned Orders ----------------------------- */
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PlannedOrder | null>(null);
  const [poForm, setPoForm] = useState<Partial<PlannedOrder>>({ productId: "", quantity: 0, startDate: "", endDate: "" });

  /* ----------------------------- UI: MRP lines are edited inline, CRP just views ----------------------------- */

  /* ----------------------------- Forecast CRUD ----------------------------- */
  useEffect(() => setForecasts(safeGet(STORAGE_KEYS.FORECASTS, [])), []); // reload on mount
  const openNewForecast = () => { setEditingForecast(null); setForecastForm({ productId: "", period: "", forecastQty: 0 }); setForecastDialogOpen(true); };
  const openEditForecast = (f: Forecast) => { setEditingForecast(f); setForecastForm({ ...f }); setForecastDialogOpen(true); };
  const saveForecast = () => {
    if (!forecastForm.productId || !forecastForm.period) return alert("Product and period required");
    const now = new Date().toISOString();
    if (editingForecast) {
      setForecasts(forecasts.map((x) => x.id === editingForecast.id ? { ...x, ...forecastForm, forecastQty: Number(forecastForm.forecastQty) || 0, createdAt: now } as Forecast : x));
    } else {
      setForecasts([...forecasts, { id: genId("f"), productId: forecastForm.productId!, period: forecastForm.period!, forecastQty: Number(forecastForm.forecastQty) || 0, createdAt: now }]);
    }
    setForecastDialogOpen(false);
  };
  const deleteForecast = (id: string) => setForecasts(forecasts.filter((f) => f.id !== id));

  /* ----------------------------- MPS CRUD ----------------------------- */
  useEffect(() => setMps(safeGet(STORAGE_KEYS.MPS_PLANS, [])), []);
  const openNewMps = () => { setEditingMps(null); setMpsForm({ productId: "", period: "", plannedQty: 0 }); setMpsDialogOpen(true); };
  const openEditMps = (x: MPS) => { setEditingMps(x); setMpsForm({ ...x }); setMpsDialogOpen(true); };
  const saveMps = () => {
    if (!mpsForm.productId || !mpsForm.period) return alert("Product and period required");
    const now = new Date().toISOString();
    if (editingMps) {
      setMps(mps.map((m) => m.id === editingMps.id ? { ...m, ...mpsForm, plannedQty: Number(mpsForm.plannedQty) || 0, createdAt: now } as MPS : m));
    } else {
      setMps([...mps, { id: genId("mps"), productId: mpsForm.productId!, period: mpsForm.period!, plannedQty: Number(mpsForm.plannedQty) || 0, status: "planned", createdAt: now }]);
    }
    setMpsDialogOpen(false);
  };
  const deleteMps = (id: string) => setMps(mps.filter((m) => m.id !== id));

  /* Auto-generate MPS from Forecast: sums forecasts grouped by product+period */
  const generateMpsFromForecast = () => {
    if (!Array.isArray(forecasts) || forecasts.length === 0) return alert("No forecasts to generate MPS from");
    const map: Record<string, number> = {};
    forecasts.forEach((f) => {
      const key = `${f.productId}||${f.period}`;
      map[key] = (map[key] || 0) + (Number(f.forecastQty) || 0);
    });
    const generated: MPS[] = Object.keys(map).map((k) => {
      const [productId, period] = k.split("||");
      return { id: genId("mps"), productId, period, plannedQty: map[k], status: "planned", createdAt: new Date().toISOString() };
    });
    // merge (replace same product+period)
    const others = mps.filter((m) => !generated.some((g) => g.productId === m.productId && g.period === m.period));
    setMps([...others, ...generated]);
  };

  /* ----------------------------- MRP (run from MPS & BOMs & INVENTORY) ----------------------------- */
  useEffect(() => setMrpLines(safeGet(STORAGE_KEYS.MRP_REQUIREMENTS, [])), []);
  const runMrp = () => {
    const mpsList: MPS[] = safeGet(STORAGE_KEYS.MPS_PLANS, []);
    const bomsList: any[] = safeGet(STORAGE_KEYS.BOMS, []);
    const inventoryMap: Record<string, number> = safeGet(STORAGE_KEYS.INVENTORY, {});
    const reqMap: Record<string, number> = {};

    // Expand each MPS row using matching BOM (if BOM missing, skip)
    (mpsList || []).forEach((plan) => {
      const plannedQty = Number(plan.plannedQty) || 0;
      if (plannedQty <= 0) return;
      const bom = (bomsList || []).find((b: any) => b.productId === plan.productId);
      if (!bom || !Array.isArray(bom.lines)) return;
      bom.lines.forEach((ln: any) => {
        const itemId = ln.itemId;
        const qtyPer = Number(ln.qty) || 0;
        reqMap[itemId] = (reqMap[itemId] || 0) + qtyPer * plannedQty;
      });
    });

    const lines: MrpLine[] = Object.keys(reqMap).map((itemId) => {
      const req = reqMap[itemId] || 0;
      const avail = Number(inventoryMap[itemId] || 0);
      const shortage = Math.max(0, req - avail);
      return { id: genId("mrp"), materialId: itemId, requiredQty: req, availableQty: avail, shortageQty: shortage, prCreated: false };
    });

    setMrpLines(lines);
  };

  const createPrForLine = (id: string) => {
    setMrpLines(mrpLines.map((l) => l.id === id ? { ...l, prCreated: true } : l));
    alert("Purchase Requisition simulated/created.");
  };

  const updateMrpAvailable = (id: string, val: number) => {
    setMrpLines(mrpLines.map((l) => l.id === id ? { ...l, availableQty: val, shortageQty: Math.max(0, l.requiredQty - val) } : l));
  };

  /* ----------------------------- Planned Orders CRUD & auto-generate from MPS ----------------------------- */
  useEffect(() => setPlannedOrders(safeGet(STORAGE_KEYS.PLANNED_ORDERS, [])), []);
  const openNewPo = () => { setEditingPo(null); setPoForm({ productId: "", quantity: 0, startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) }); setPoDialogOpen(true); };
  const openEditPo = (p: PlannedOrder) => { setEditingPo(p); setPoForm({ ...p }); setPoDialogOpen(true); };
  const savePo = () => {
    if (!poForm.productId || !poForm.startDate) return alert("Product & start date required");
    const now = new Date().toISOString();
    if (editingPo) {
      setPlannedOrders(plannedOrders.map((x) => x.id === editingPo.id ? { ...x, ...poForm, quantity: Number(poForm.quantity) || 0, createdAt: now } as PlannedOrder : x));
    } else {
      setPlannedOrders([...plannedOrders, { id: genId("po"), productId: poForm.productId!, quantity: Number(poForm.quantity) || 0, startDate: poForm.startDate!, endDate: poForm.endDate || poForm.startDate!, status: "planned", createdAt: now }]);
    }
    setPoDialogOpen(false);
  };
  const deletePo = (id: string) => setPlannedOrders(plannedOrders.filter((p) => p.id !== id));

  const generatePoFromMps = () => {
    const mpsList = safeGet(STORAGE_KEYS.MPS_PLANS, []);
    if (!Array.isArray(mpsList) || mpsList.length === 0) return alert("No MPS rows to generate orders from");
    const newOrders: PlannedOrder[] = (mpsList || []).map((m) => ({
      id: genId("po"),
      productId: m.productId,
      quantity: Number(m.plannedQty) || 0,
      startDate: `${m.period}-01`, // naive mapping: month start; adapt as needed
      endDate: `${m.period}-01`,
      status: "planned",
      createdAt: new Date().toISOString(),
    }));
    setPlannedOrders([...plannedOrders, ...newOrders]);
  };

  /* ----------------------------- CRP: calculate load from plannedOrders & routings ----------------------------- */
  const routings = safeGet(STORAGE_KEYS.ROUTINGS, []);
  const crpLoadByWC = useMemo(() => {
    const map: Record<string, number> = {}; // minutes
    (plannedOrders || []).forEach((po) => {
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
    // aggregate qty by period
    const map: Record<string, number> = {};
    forecasts.forEach((f) => map[f.period] = (map[f.period] || 0) + (Number(f.forecastQty) || 0));
    return Object.keys(map).sort().map((p) => ({ period: p, qty: map[p] }));
  }, [forecasts]);

  const mpsTrend = useMemo(() => {
    const map: Record<string, number> = {};
    mps.forEach((x) => map[x.period] = (map[x.period] || 0) + (Number(x.plannedQty) || 0));
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
            {overloaded.length > 0 && <Badge variant="warning">Overloaded WCs: {overloaded.length}</Badge>}
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
                          <TableHead>Period</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {forecasts.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell>{(items.find((it: any) => it.id === f.productId)?.name) || f.productId}</TableCell>
                            <TableCell>{f.period}</TableCell>
                            <TableCell>{f.forecastQty}</TableCell>
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
                                  onClick={() => canDelete && deleteForecast(f.id)}
                                  className={canDelete ? "" : "opacity-50 cursor-not-allowed"}
                                >
                                  🗑</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {forecasts.length === 0 && <div className="text-center text-muted-foreground py-6">No forecasts yet.</div>}
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
                        {mps.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{(items.find((it: any) => it.id === r.productId)?.name) || r.productId}</TableCell>
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
                                  onClick={() => canDelete && deleteMps(r.id)}
                                  className={canDelete ? "" : "opacity-50 cursor-not-allowed"}
                                >
                                  🗑</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {mps.length === 0 && <div className="text-center text-muted-foreground py-6">No MPS plans defined.</div>}
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
                    onClick={() => canCreate && runMrp()}
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
                        <TableRow key={l.id}>
                          <TableCell>{(items.find((it: any) => it.id === l.materialId)?.name) || l.materialId}</TableCell>
                          <TableCell>{l.requiredQty}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={l.availableQty}
                              disabled={!canEdit}
                              onChange={(e) => canEdit && updateMrpAvailable(l.id, Number(e.target.value) || 0)}
                              className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                            />

                          </TableCell>
                          <TableCell>{l.shortageQty}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                disabled={!canCreate || l.prCreated || l.shortageQty <= 0}
                                onClick={() => canCreate && createPrForLine(l.id)}
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
                      {plannedOrders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>{(items.find((it: any) => it.id === o.productId)?.name) || o.productId}</TableCell>
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
                                onClick={() => canDelete && deletePo(o.id)}
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
                  {plannedOrders.length === 0 && <div className="text-center text-muted-foreground py-6">No planned orders yet.</div>}
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
            <Label>Product ID</Label>
            <Input value={forecastForm.productId || ""} onChange={(e) => setForecastForm({ ...forecastForm, productId: e.target.value })} />
            <Label>Period (e.g., 2025-11)</Label>
            <Input value={forecastForm.period || ""} onChange={(e) => setForecastForm({ ...forecastForm, period: e.target.value })} />
            <Label>Forecast Qty</Label>
            <Input type="number" value={forecastForm.forecastQty ?? 0} onChange={(e) => setForecastForm({ ...forecastForm, forecastQty: Number(e.target.value) })} />
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
            <Label>Product ID</Label>
            <Input value={mpsForm.productId || ""} onChange={(e) => setMpsForm({ ...mpsForm, productId: e.target.value })} />
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
            <Label>Product ID</Label>
            <Input value={poForm.productId || ""} onChange={(e) => setPoForm({ ...poForm, productId: e.target.value })} />
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
    </div>
  );
}
