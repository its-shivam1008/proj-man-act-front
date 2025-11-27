import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Plus, Edit2, Trash2, Download, Upload, ShieldAlert } from "lucide-react";
type StandardCost = {
  id: string;
  productId: string;
  productName?: string;
  unitQty: number; // per unit basis
  material: number;
  labour: number;
  machine: number;
  overheads: number;
  updatedAt?: string;
};

type ActualCost = {
  id: string;
  workOrderId?: string;
  productId: string;
  batchNo?: string;
  producedQty: number;
  material: number;
  labour: number;
  machine: number;
  overheads: number;
  startTime?: string; // ISO
  endTime?: string; // ISO
  remarks?: string;
  recordedAt?: string;
};

type PerfMetric = {
  id: string;
  productId?: string;
  date: string;
  yieldPct?: number; // 0-100
  scrapPct?: number;
  machineUtilPct?: number;
  labourEffPct?: number;
  notes?: string;
};

/* ----------------------------- Keys ----------------------------- */
const KEYS = {
  STANDARDS: "COST_STANDARDS",
  ACTUALS: "COST_ACTUALS",
  METRICS: "PERF_METRICS",
  AUDIT: "COST_AUDIT", // optional extra audit log
};

/* --------------------------- Helpers ---------------------------- */
const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowISO = () => new Date().toISOString();

const sum = (arr: number[]) => arr.reduce((s, v) => s + Number(v || 0), 0);

/* --------------------------- Component -------------------------- */
export default function CostingPerformance() {


  const canView = usePermission("costingPerformance", "view");
  const canCreate = usePermission("costingPerformance", "create");
  const canEdit = usePermission("costingPerformance", "edit");
  const canDelete = usePermission("costingPerformance", "delete");

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
  // load from storage
  const [standards, setStandards] = useState<StandardCost[]>(() => storage.get<StandardCost[]>(KEYS.STANDARDS, []));
  const [actuals, setActuals] = useState<ActualCost[]>(() => storage.get<ActualCost[]>(KEYS.ACTUALS, []));
  const [metrics, setMetrics] = useState<PerfMetric[]>(() => storage.get<PerfMetric[]>(KEYS.METRICS, []));

  // dialogs / forms
  const [tab, setTab] = useState<"overview" | "standards" | "actuals" | "metrics">("overview");

  const [stdDialogOpen, setStdDialogOpen] = useState(false);
  const [stdForm, setStdForm] = useState<Partial<StandardCost>>({});

  const [actDialogOpen, setActDialogOpen] = useState(false);
  const [actForm, setActForm] = useState<Partial<ActualCost>>({ producedQty: 0 });

  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [metricForm, setMetricForm] = useState<Partial<PerfMetric>>({ date: new Date().toISOString().slice(0, 10) });

  // persist changes
  useEffect(() => storage.set(KEYS.STANDARDS, standards), [standards]);
  useEffect(() => storage.set(KEYS.ACTUALS, actuals), [actuals]);
  useEffect(() => storage.set(KEYS.METRICS, metrics), [metrics]);

  // audit helper
  const audit = (action: string, details?: any) => {
    const entry = { id: genId("audit"), timestamp: nowISO(), action, details };
    try {
      storage.push(KEYS.AUDIT, entry);
    } catch {
      // if COST_AUDIT not present, attempt AUDIT_LOGS
      storage.push(STORAGE_KEYS.AUDIT_LOGS || "AUDIT_LOGS", entry);
    }
  };

  /* --------------------- Derived analytics --------------------- */

  // Combine standards + actuals to compute variances per actual record where standard exists
  const actualsWithVariance = useMemo(() => {
    return actuals.map((a) => {
      const std = standards.find((s) => s.productId === a.productId);
      const standardTotal = std ? (std.material + std.labour + std.machine + std.overheads) * (a.producedQty / (std.unitQty || 1)) : 0;
      const actualTotal = sum([a.material, a.labour, a.machine, a.overheads]);
      const variance = actualTotal - standardTotal;
      const variancePct = standardTotal !== 0 ? (variance / standardTotal) * 100 : 0;
      // time variance: if start/end present -> duration in hours vs standard expected time (not in standard type, so we show recorded duration)
      let durationHours: number | null = null;
      if (a.startTime && a.endTime) {
        const dur = (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / (1000 * 60 * 60);
        durationHours = Math.round(dur * 100) / 100;
      }
      return { ...a, standardTotal, actualTotal, variance, variancePct, durationHours };
    });
  }, [actuals, standards]);

  // KPI calculations (simple but useful)
  const kpis = useMemo(() => {
    const totalProduced = sum(actuals.map((a) => a.producedQty));
    const totalMaterial = sum(actuals.map((a) => a.material));
    const totalLabour = sum(actuals.map((a) => a.labour));
    const totalMachine = sum(actuals.map((a) => a.machine));
    const totalOverheads = sum(actuals.map((a) => a.overheads));
    const totalActualCost = totalMaterial + totalLabour + totalMachine + totalOverheads;

    // yield & scrap: use metrics entries (average)
    const avgYield = metrics.length ? Math.round((sum(metrics.map((m) => m.yieldPct || 0)) / metrics.length) * 100) / 100 : 0;
    const avgScrap = metrics.length ? Math.round((sum(metrics.map((m) => m.scrapPct || 0)) / metrics.length) * 100) / 100 : 0;
    const avgMachineUtil = metrics.length ? Math.round((sum(metrics.map((m) => m.machineUtilPct || 0)) / metrics.length) * 100) / 100 : 0;
    const avgLabourEff = metrics.length ? Math.round((sum(metrics.map((m) => m.labourEffPct || 0)) / metrics.length) * 100) / 100 : 0;

    // average variance %
    const avgVariancePct = actualsWithVariance.length
      ? Math.round((sum(actualsWithVariance.map((a) => a.variancePct || 0)) / actualsWithVariance.length) * 100) / 100
      : 0;

    return {
      totalProduced,
      totalActualCost,
      avgYield,
      avgScrap,
      avgMachineUtil,
      avgLabourEff,
      avgVariancePct,
    };
  }, [actuals, metrics, /* actualsWithVariance used inside */]);

  /* ---------------------- CRUD Handlers ----------------------- */

  // Standards
  const saveStandard = () => {
    if (!stdForm.productId) return alert("Product ID required");
    const now = nowISO();
    if (stdForm.id) {
      setStandards((prev) => prev.map((s) => (s.id === stdForm.id ? { ...(s as StandardCost), ...(stdForm as StandardCost), updatedAt: now } : s)));
      audit("update-standard", stdForm);
    } else {
      const s: StandardCost = { id: genId("std"), unitQty: 1, material: 0, labour: 0, machine: 0, overheads: 0, updatedAt: now, ...(stdForm as any) };
      setStandards((prev) => [s, ...prev]);
      audit("create-standard", s);
    }
    setStdDialogOpen(false);
    setStdForm({});
  };

  const editStandard = (id: string) => {
    const s = standards.find((x) => x.id === id);
    if (s) {
      setStdForm(s);
      setStdDialogOpen(true);
    }
  };

  const deleteStandard = (id: string) => {
    if (!confirm("Delete standard?")) return;
    setStandards((p) => p.filter((x) => x.id !== id));
    audit("delete-standard", { id });
  };

  // Actuals
  const saveActual = () => {
    if (!actForm.productId) return alert("Product ID required");
    if (!actForm.producedQty || actForm.producedQty <= 0) return alert("Produced Qty required");
    const now = nowISO();
    if (actForm.id) {
      setActuals((prev) => prev.map((a) => (a.id === actForm.id ? { ...(a as ActualCost), ...(actForm as ActualCost), recordedAt: now } : a)));
      audit("update-actual", actForm);
    } else {
      const rec: ActualCost = { id: genId("act"), producedQty: actForm.producedQty || 0, material: 0, labour: 0, machine: 0, overheads: 0, recordedAt: now, ...(actForm as any) };
      setActuals((prev) => [rec, ...prev]);
      audit("create-actual", rec);
    }
    setActDialogOpen(false);
    setActForm({ producedQty: 0 });
  };

  const editActual = (id: string) => {
    const a = actuals.find((x) => x.id === id);
    if (a) {
      setActForm(a);
      setActDialogOpen(true);
    }
  };

  const deleteActual = (id: string) => {
    if (!confirm("Delete actual record?")) return;
    setActuals((p) => p.filter((x) => x.id !== id));
    audit("delete-actual", { id });
  };

  // Metrics
  const saveMetric = () => {
    if (!metricForm.date) return alert("Date required");
    const m: PerfMetric = { id: metricForm.id || genId("met"), ...(metricForm as any) } as PerfMetric;
    if (metricForm.id) {
      setMetrics((p) => p.map((x) => (x.id === m.id ? m : x)));
      audit("update-metric", m);
    } else {
      setMetrics((p) => [m, ...p]);
      audit("create-metric", m);
    }
    setMetricDialogOpen(false);
    setMetricForm({ date: new Date().toISOString().slice(0, 10) });
  };

  const editMetric = (id: string) => {
    const m = metrics.find((x) => x.id === id);
    if (m) {
      setMetricForm(m);
      setMetricDialogOpen(true);
    }
  };

  const deleteMetric = (id: string) => {
    if (!confirm("Delete metric?")) return;
    setMetrics((p) => p.filter((x) => x.id !== id));
    audit("delete-metric", { id });
  };

  /* ----------------------- Export / Import ---------------------- */
  const exportModule = () => {
    const dump = {
      standards,
      actuals,
      metrics,
      exportedAt: nowISO(),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CostingBackup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importModule = async (file?: File) => {
    try {
      const f = file || (document.querySelector<HTMLInputElement>("#costing-import")?.files?.[0] as File);
      if (!f) return alert("Choose a JSON file to import");
      const txt = await f.text();
      const parsed = JSON.parse(txt);
      if (parsed.standards) setStandards(parsed.standards);
      if (parsed.actuals) setActuals(parsed.actuals);
      if (parsed.metrics) setMetrics(parsed.metrics);
      audit("import-module", { fileName: f.name });
      alert("Import complete");
    } catch (err) {
      console.error(err);
      alert("Import failed");
    }
  };

  /* ------------------------- Charts Data ----------------------- */
  const costVarianceBar = useMemo(() => {
    // show top N variances by productId
    const grouped: Record<string, { variance: number; productName?: string }> = {};
    actualsWithVariance.forEach((a) => {
      const key = a.productId || "unknown";
      grouped[key] = grouped[key] || { variance: 0, productName: a.productId };
      grouped[key].variance += a.variance || 0;
    });
    return Object.entries(grouped).map(([productId, v]) => ({ productId, variance: Math.round(v.variance * 100) / 100, name: v.productName }));
  }, [actualsWithVariance]);

  const timeVarianceLine = useMemo(() => {
    // average durationHours per day
    const map: Record<string, { total: number; count: number }> = {};
    actualsWithVariance.forEach((a) => {
      if (!a.durationHours) return;
      const day = (a.startTime || a.recordedAt || nowISO()).slice(0, 10);
      map[day] = map[day] || { total: 0, count: 0 };
      map[day].total += a.durationHours || 0;
      map[day].count += 1;
    });
    return Object.entries(map).map(([date, v]) => ({ date, avgHours: Math.round((v.total / v.count) * 100) / 100 }));
  }, [actualsWithVariance]);

  const budgetUtilDonut = useMemo(() => {
    // compare planned (sum of standards for produced qty) vs actual cost
    const planned = sum(actualsWithVariance.map((a) => a.standardTotal || 0));
    const actual = sum(actualsWithVariance.map((a) => a.actualTotal || 0));
    const used = Math.min(actual, planned);
    const remaining = Math.max(0, planned - actual);
    return [
      { name: "Actual", value: actual },
      { name: "Remaining (Planned - Actual)", value: remaining },
    ];
  }, [actualsWithVariance]);

  /* --------------- small UI helpers --------------- */
  const openNewStandard = () => {
    setStdForm({});
    setStdDialogOpen(true);
  };
  const openNewActual = () => {
    setActForm({ producedQty: 0, recordedAt: nowISO() });
    setActDialogOpen(true);
  };
  const openNewMetric = () => {
    setMetricForm({ date: new Date().toISOString().slice(0, 10) });
    setMetricDialogOpen(true);
  };

  /* ----------------------- Render --------------------------- */
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Costing & Performance Analysis</h1>
          <p className="text-muted-foreground mt-1">Standard vs Actual costing, variance analysis, and production KPIs.</p>
        </div>

        <div className="flex gap-2">
          <Button
            className="w-full"
            disabled={!canCreate && !canEdit} // or choose canEdit only
            onClick={() => (canCreate || canEdit) && exportModule()}
          >
            <Download className="mr-2" />Export
          </Button>

          <label className="w-full">
            <input id="costing-import" type="file" accept="application/json" className="hidden" onChange={() => importModule()} />
            <Button className="w-full"><Upload className="mr-2" />Import</Button>
          </label>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="actuals">Actuals</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle>Total Produced</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-semibold">{kpis.totalProduced}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Actual Cost</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-semibold">₹{kpis.totalActualCost.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Avg Variance %</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-semibold">{kpis.avgVariancePct}%</div></CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Cost Variance (by product)</CardTitle></CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costVarianceBar}>
                    <XAxis dataKey="productId" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="variance" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Time Variance (avg hrs)</CardTitle></CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeVarianceLine}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="avgHours" stroke="#2563EB" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Budget Utilisation</CardTitle></CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={budgetUtilDonut} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                      {budgetUtilDonut.map((_, i) => <Cell key={i} fill={i === 0 ? "#10B981" : "#F59E0B"} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="standards">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-xl font-semibold">Standard Costs</h2>
            <Button
              disabled={!canCreate}
              onClick={() => canCreate && openNewActual()}
              className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
            >
              <Plus className="mr-2" />New Standard</Button>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Per Unit (material/labour/machine/overhead)</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standards.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.productId} {s.productName ? `— ${s.productName}` : ""}</TableCell>
                      <TableCell>
                        ₹{((s.material + s.labour + s.machine + s.overheads) || 0).toFixed(2)}<div className="text-sm text-muted-foreground">
                          M:{s.material} L:{s.labour} Mc:{s.machine} O:{s.overheads}
                        </div>
                      </TableCell>
                      <TableCell>{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "—"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          className="w-full"
                          disabled={!canEdit}
                          onClick={() => canEdit && editStandard(s.id)}
                        >
                          <Edit2 className="mr-2" />Edit
                        </Button>

                        <Button
                          className="w-full"
                          disabled={!canDelete}
                          onClick={() => canDelete && deleteStandard(s.id)}
                        >
                          <Trash2 className="mr-2" />Delete
                        </Button>

                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actuals">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-xl font-semibold">Actual Costs (Production Runs)</h2>
            <Button
              className="w-full md:w-48"
              disabled={!canCreate}
              onClick={() => canCreate && openNewActual()}
            >
              <Plus className="mr-2" />New Actual
            </Button>

          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WO / Batch</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Actual vs Std (₹ / %)</TableHead>
                    <TableHead>Time (hrs)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actualsWithVariance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.workOrderId || a.batchNo || a.id}</TableCell>
                      <TableCell>{a.productId}</TableCell>
                      <TableCell>{a.producedQty}</TableCell>
                      <TableCell>
                        ₹{(a.actualTotal || 0).toFixed(2)} vs ₹{(a.standardTotal || 0).toFixed(2)} <div className="text-sm">{(a.variancePct || 0).toFixed(2)}%</div>
                      </TableCell>
                      <TableCell>{a.durationHours ?? "—"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          className="w-full"
                          disabled={!canEdit}
                          onClick={() => canEdit && editActual(a.id)}
                        >
                          <Edit2 className="mr-2" />Edit
                        </Button>

                        <Button
                          className="w-full"
                          disabled={!canDelete}
                          onClick={() => canDelete && deleteActual(a.id)}
                        >
                          <Trash2 className="mr-2" />Delete
                        </Button>

                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-xl font-semibold">Performance Metrics</h2>
            <Button
              disabled={!canCreate}
              onClick={() => canCreate && openNewMetric()}
              className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
            >
              <Plus className="mr-2" />New Metric</Button>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Yield %</TableHead>
                    <TableHead>Scrap %</TableHead>
                    <TableHead>Machine Util %</TableHead>
                    <TableHead>Labour Eff %</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.date}</TableCell>
                      <TableCell>{m.productId || "—"}</TableCell>
                      <TableCell>{m.yieldPct ?? "—"}</TableCell>
                      <TableCell>{m.scrapPct ?? "—"}</TableCell>
                      <TableCell>{m.machineUtilPct ?? "—"}</TableCell>
                      <TableCell>{m.labourEffPct ?? "—"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          disabled={!canEdit}
                          onClick={() => canEdit && editMetric(m.id)}
                          className={canEdit ? "" : "opacity-50 cursor-not-allowed"}
                        >
                          Edit
                        </Button>

                        <Button
                          disabled={!canDelete}
                          onClick={() => canDelete && deleteMetric(m.id)}
                          className={canDelete ? "" : "opacity-50 cursor-not-allowed"}
                        >
                          Delete
                        </Button>

                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Standard Dialog */}
      <Dialog open={stdDialogOpen} onOpenChange={setStdDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{stdForm.id ? "Edit Standard" : "New Standard"}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Product ID</Label>
            <Input value={stdForm.productId || ""} onChange={(e) => setStdForm({ ...stdForm, productId: e.target.value })} />
            <Label>Product Name</Label>
            <Input value={stdForm.productName || ""} onChange={(e) => setStdForm({ ...stdForm, productName: e.target.value })} />
            <Label>Unit Qty (per standard)</Label>
            <Input type="number" value={stdForm.unitQty ?? 1} onChange={(e) => setStdForm({ ...stdForm, unitQty: Number(e.target.value) })} />
            <Label>Material</Label>
            <Input type="number" value={stdForm.material ?? 0} onChange={(e) => setStdForm({ ...stdForm, material: Number(e.target.value) })} />
            <Label>Labour</Label>
            <Input type="number" value={stdForm.labour ?? 0} onChange={(e) => setStdForm({ ...stdForm, labour: Number(e.target.value) })} />
            <Label>Machine</Label>
            <Input type="number" value={stdForm.machine ?? 0} onChange={(e) => setStdForm({ ...stdForm, machine: Number(e.target.value) })} />
            <Label>Overheads</Label>
            <Input type="number" value={stdForm.overheads ?? 0} onChange={(e) => setStdForm({ ...stdForm, overheads: Number(e.target.value) })} />
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!(stdForm.id ? canEdit : canCreate)}
              onClick={() => (stdForm.id ? canEdit : canCreate) && saveStandard()}
            >
              Save Standard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actual Dialog */}
      <Dialog open={actDialogOpen} onOpenChange={setActDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{actForm.id ? "Edit Actual" : "New Actual"}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Work Order / Batch</Label>
            <Input value={actForm.workOrderId || actForm.batchNo || ""} onChange={(e) => setActForm({ ...actForm, workOrderId: e.target.value })} />
            <Label>Product ID</Label>
            <Input value={actForm.productId || ""} onChange={(e) => setActForm({ ...actForm, productId: e.target.value })} />
            <Label>Produced Qty</Label>
            <Input type="number" value={actForm.producedQty || 0} onChange={(e) => setActForm({ ...actForm, producedQty: Number(e.target.value) })} />
            <Label>Material Cost (total)</Label>
            <Input type="number" value={actForm.material || 0} onChange={(e) => setActForm({ ...actForm, material: Number(e.target.value) })} />
            <Label>Labour Cost (total)</Label>
            <Input type="number" value={actForm.labour || 0} onChange={(e) => setActForm({ ...actForm, labour: Number(e.target.value) })} />
            <Label>Machine Cost (total)</Label>
            <Input type="number" value={actForm.machine || 0} onChange={(e) => setActForm({ ...actForm, machine: Number(e.target.value) })} />
            <Label>Overheads (total)</Label>
            <Input type="number" value={actForm.overheads || 0} onChange={(e) => setActForm({ ...actForm, overheads: Number(e.target.value) })} />
            <Label>Start Time (ISO)</Label>
            <Input value={actForm.startTime || ""} onChange={(e) => setActForm({ ...actForm, startTime: e.target.value })} />
            <Label>End Time (ISO)</Label>
            <Input value={actForm.endTime || ""} onChange={(e) => setActForm({ ...actForm, endTime: e.target.value })} />
            <Label>Remarks</Label>
            <Input value={actForm.remarks || ""} onChange={(e) => setActForm({ ...actForm, remarks: e.target.value })} />
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!(actForm.id ? canEdit : canCreate)}
              onClick={() => (actForm.id ? canEdit : canCreate) && saveActual()}
            >
              Save Actual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Dialog */}
      <Dialog open={metricDialogOpen} onOpenChange={setMetricDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{metricForm.id ? "Edit Metric" : "New Metric"}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input value={metricForm.date || ""} onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })} />
            <Label>Product ID (optional)</Label>
            <Input value={metricForm.productId || ""} onChange={(e) => setMetricForm({ ...metricForm, productId: e.target.value })} />
            <Label>Yield %</Label>
            <Input type="number" value={metricForm.yieldPct || ""} onChange={(e) => setMetricForm({ ...metricForm, yieldPct: Number(e.target.value) })} />
            <Label>Scrap %</Label>
            <Input type="number" value={metricForm.scrapPct || ""} onChange={(e) => setMetricForm({ ...metricForm, scrapPct: Number(e.target.value) })} />
            <Label>Machine Util %</Label>
            <Input type="number" value={metricForm.machineUtilPct || ""} onChange={(e) => setMetricForm({ ...metricForm, machineUtilPct: Number(e.target.value) })} />
            <Label>Labour Eff %</Label>
            <Input type="number" value={metricForm.labourEffPct || ""} onChange={(e) => setMetricForm({ ...metricForm, labourEffPct: Number(e.target.value) })} />
            <Label>Notes</Label>
            <Input value={metricForm.notes || ""} onChange={(e) => setMetricForm({ ...metricForm, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!(metricForm.id ? canEdit : canCreate)}
              onClick={() => (metricForm.id ? canEdit : canCreate) && saveMetric()}
            >
              Save Metric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
