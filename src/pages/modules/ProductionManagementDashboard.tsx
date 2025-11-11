"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Download, Clock, AlertTriangle, Activity } from "lucide-react";
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
import { storage, STORAGE_KEYS } from "../../lib/storage";

// ------------------- Types -------------------
type ProductionRecord = {
  id: string;
  date: string;
  produced: number;
  good: number;
  scrap: number;
  shift?: string;
};

type DowntimeEvent = {
  id: string;
  date: string;
  workCenterId?: string;
  minutes: number;
  reason?: string;
  createdAt?: string;
};

type QualityEvent = {
  id: string;
  date: string;
  productId?: string;
  category?: string;
  count: number;
  remarks?: string;
  createdAt?: string;
};

// ------------------- Storage Helpers -------------------
const getProductionRecords = (): ProductionRecord[] => storage.get(STORAGE_KEYS.PRODUCTION_RECORDS, []);
const saveProductionRecords = (arr: ProductionRecord[]) => storage.set(STORAGE_KEYS.PRODUCTION_RECORDS, arr);

const getDowntimeLogs = (): DowntimeEvent[] => storage.get(STORAGE_KEYS.DOWNTIME_LOGS, []);
const saveDowntimeLogs = (arr: DowntimeEvent[]) => storage.set(STORAGE_KEYS.DOWNTIME_LOGS, arr);

const getQualityEvents = (): QualityEvent[] => storage.get(STORAGE_KEYS.QUALITY_EVENTS, []);
const saveQualityEvents = (arr: QualityEvent[]) => storage.set(STORAGE_KEYS.QUALITY_EVENTS, arr);

const genId = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

// ------------------- Component -------------------
export default function ProductionAnalyticsDashboard() {
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [downtime, setDowntime] = useState<DowntimeEvent[]>([]);
  const [quality, setQuality] = useState<QualityEvent[]>([]);

  const [fromDate, setFromDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [toDate, setToDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [workCenterFilter, setWorkCenterFilter] = useState<string>("");

  // Dialog states
  const [downDialogOpen, setDownDialogOpen] = useState(false);
  const [downEdit, setDownEdit] = useState<DowntimeEvent | null>(null);
  const [downForm, setDownForm] = useState<Partial<DowntimeEvent>>({
    date: new Date().toISOString().slice(0, 10),
    minutes: 10,
    reason: "",
  });

  const [qDialogOpen, setQDialogOpen] = useState(false);
  const [qEdit, setQEdit] = useState<QualityEvent | null>(null);
  const [qForm, setQForm] = useState<Partial<QualityEvent>>({
    date: new Date().toISOString().slice(0, 10),
    category: "Process",
    count: 1,
    remarks: "",
  });

  // Load
  useEffect(() => {
    setProduction(getProductionRecords());
    setDowntime(getDowntimeLogs());
    setQuality(getQualityEvents());
  }, []);

  useEffect(() => saveProductionRecords(production), [production]);
  useEffect(() => saveDowntimeLogs(downtime), [downtime]);
  useEffect(() => saveQualityEvents(quality), [quality]);

  // ------------------- Derived Data -------------------
  const filteredProduction = useMemo(
    () => production.filter((p) => p.date >= fromDate && p.date <= toDate),
    [production, fromDate, toDate]
  );

  const filteredDowntime = useMemo(
    () => downtime.filter((d) => d.date >= fromDate && d.date <= toDate && (!workCenterFilter || d.workCenterId === workCenterFilter)),
    [downtime, fromDate, toDate, workCenterFilter]
  );

  const filteredQuality = useMemo(
    () => quality.filter((q) => q.date >= fromDate && q.date <= toDate),
    [quality, fromDate, toDate]
  );

  // ------------------- KPI Calculations -------------------
  const totalProduced = filteredProduction.reduce((s, r) => s + r.produced, 0);
  const totalGood = filteredProduction.reduce((s, r) => s + r.good, 0);
  const totalScrap = filteredProduction.reduce((s, r) => s + r.scrap, 0);
  const totalDowntimeMinutes = filteredDowntime.reduce((s, d) => s + d.minutes, 0);

  const daysInRange = Math.max(
    1,
    Math.ceil(
      (new Date(toDate).getTime() - new Date(fromDate).getTime()) / (24 * 3600 * 1000)
    )
  );

  const scheduledMinutes = daysInRange * 8 * 60;
  const availability = (scheduledMinutes - totalDowntimeMinutes) / scheduledMinutes;
  const targetPerDay = storage.get(STORAGE_KEYS.PRODUCTION_TARGET_PER_DAY, 100);
  const performance = totalProduced / (targetPerDay * daysInRange);
  const qualityRatio = totalGood / Math.max(1, totalProduced);
  const oee = availability * performance * qualityRatio;

  // ------------------- Charts -------------------
  const productionTrend = useMemo(() => {
    const map: Record<string, { produced: number; good: number; scrap: number }> = {};
    filteredProduction.forEach((r) => {
      map[r.date] = map[r.date] || { produced: 0, good: 0, scrap: 0 };
      map[r.date].produced += r.produced;
      map[r.date].good += r.good;
      map[r.date].scrap += r.scrap;
    });
    return Object.entries(map).map(([date, v]) => ({ date, ...v }));
  }, [filteredProduction]);

  const downtimeByWC = useMemo(() => {
    const map: Record<string, number> = {};
    filteredDowntime.forEach((d) => {
      const key = d.workCenterId || "Unknown";
      map[key] = (map[key] || 0) + d.minutes;
    });
    return Object.entries(map).map(([k, v]) => ({ workCenter: k, minutes: v }));
  }, [filteredDowntime]);

  const defectCategories = useMemo(() => {
    const map: Record<string, number> = {};
    filteredQuality.forEach((q) => {
      map[q.category || "Other"] = (map[q.category || "Other"] || 0) + q.count;
    });
    return Object.entries(map).map(([category, count]) => ({ category, count }));
  }, [filteredQuality]);

  // ------------------- CRUD -------------------
  const openCreateDowntime = () => {
    setDownEdit(null);
    setDownForm({ date: new Date().toISOString().slice(0, 10), minutes: 10, reason: "" });
    setDownDialogOpen(true);
  };

  const saveDowntime = () => {
    if (!downForm.date) return;
    const now = new Date().toISOString();
    if (downEdit) {
      setDowntime(
        downtime.map((d) =>
          d.id === downEdit.id ? { ...d, ...downForm, createdAt: now } : d
        )
      );
    } else {
      setDowntime([
        ...downtime,
        {
          id: genId("d"),
          date: downForm.date!,
          minutes: Number(downForm.minutes) || 0,
          reason: downForm.reason || "",
          workCenterId: downForm.workCenterId || "",
          createdAt: now,
        },
      ]);
    }
    setDownDialogOpen(false);
  };

  const deleteDowntime = (id: string) =>
    setDowntime(downtime.filter((d) => d.id !== id));

  const openCreateQuality = () => {
    setQEdit(null);
    setQForm({ date: new Date().toISOString().slice(0, 10), category: "Process", count: 1 });
    setQDialogOpen(true);
  };

  const saveQuality = () => {
    if (!qForm.date) return;
    const now = new Date().toISOString();
    if (qEdit) {
      setQuality(
        quality.map((q) =>
          q.id === qEdit.id ? { ...q, ...qForm, createdAt: now } : q
        )
      );
    } else {
      setQuality([
        ...quality,
        {
          id: genId("q"),
          date: qForm.date!,
          category: qForm.category || "Other",
          count: Number(qForm.count) || 0,
          remarks: qForm.remarks || "",
          createdAt: now,
        },
      ]);
    }
    setQDialogOpen(false);
  };

  const deleteQuality = (id: string) =>
    setQuality(quality.filter((q) => q.id !== id));

  // ------------------- Export -------------------
  const exportCSV = (rows: any[], name: string) => {
    if (!rows.length) return alert("No data to export");
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => r[k]).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ------------------- Render -------------------
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Production Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track production, downtime, OEE, and quality performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportCSV(filteredProduction, "production_data")}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Produced</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalProduced}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Good Units</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalGood}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Scrap</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{totalScrap}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Downtime (hrs)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{(totalDowntimeMinutes / 60).toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>OEE</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{(oee * 100).toFixed(1)}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quality Yield</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{(qualityRatio * 100).toFixed(1)}%</div></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Production Trend</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="produced" stroke="#8884d8" />
                <Line dataKey="good" stroke="#82ca9d" />
                <Line dataKey="scrap" stroke="#ff7f50" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Downtime by Work Center</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downtimeByWC}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workCenter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="minutes" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>OEE Breakdown</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Availability", value: availability * 100 },
                    { name: "Performance", value: performance * 100 },
                    { name: "Quality", value: qualityRatio * 100 },
                  ]}
                  dataKey="value"
                  outerRadius={90}
                  label
                >
                  <Cell fill="#82ca9d" />
                  <Cell fill="#8884d8" />
                  <Cell fill="#ffc658" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Defect Categories</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defectCategories}
                  dataKey="count"
                  nameKey="category"
                  outerRadius={90}
                  label
                >
                  {defectCategories.map((_, i) => (
                    <Cell
                      key={i}
                      fill={["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"][i % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Downtime Events ({filteredDowntime.length})</CardTitle>
            <Button onClick={openCreateDowntime}>
              <Clock className="h-4 w-4 mr-2" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Work Center</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDowntime.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.date}</TableCell>
                    <TableCell>{d.workCenterId || "—"}</TableCell>
                    <TableCell>{d.minutes}</TableCell>
                    <TableCell>{d.reason || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteDowntime(d.id)}>
                        🗑
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quality */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Quality Events ({filteredQuality.length})</CardTitle>
            <Button onClick={openCreateQuality}>
              <AlertTriangle className="h-4 w-4 mr-2" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuality.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>{q.date}</TableCell>
                    <TableCell>{q.category}</TableCell>
                    <TableCell>{q.count}</TableCell>
                    <TableCell>{q.remarks || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteQuality(q.id)}>
                        🗑
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Downtime Dialog */}
      <Dialog open={downDialogOpen} onOpenChange={setDownDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{downEdit ? "Edit Downtime" : "Add Downtime"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={downForm.date || ""}
              onChange={(e) => setDownForm({ ...downForm, date: e.target.value })}
            />
            <Label>Work Center ID</Label>
            <Input
              value={downForm.workCenterId || ""}
              onChange={(e) => setDownForm({ ...downForm, workCenterId: e.target.value })}
            />
            <Label>Minutes</Label>
            <Input
              type="number"
              value={downForm.minutes ?? 0}
              onChange={(e) => setDownForm({ ...downForm, minutes: Number(e.target.value) })}
            />
            <Label>Reason</Label>
            <Input
              value={downForm.reason || ""}
              onChange={(e) => setDownForm({ ...downForm, reason: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDowntime}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quality Dialog */}
      <Dialog open={qDialogOpen} onOpenChange={setQDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{qEdit ? "Edit Quality Event" : "Add Quality Event"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={qForm.date || ""}
              onChange={(e) => setQForm({ ...qForm, date: e.target.value })}
            />
            <Label>Category</Label>
            <Input
              value={qForm.category || ""}
              onChange={(e) => setQForm({ ...qForm, category: e.target.value })}
            />
            <Label>Count</Label>
            <Input
              type="number"
              value={qForm.count ?? 0}
              onChange={(e) => setQForm({ ...qForm, count: Number(e.target.value) })}
            />
            <Label>Remarks</Label>
            <Input
              value={qForm.remarks || ""}
              onChange={(e) => setQForm({ ...qForm, remarks: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveQuality}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// import { useEffect, useState } from 'react';
// import {KPICard} from '../../components/KPI-Card'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
// import { storage, STORAGE_KEYS } from '../../lib/storage';
// import { WorkOrder, QualityCheck, WorkCenter } from '../../types/production';
// import { Activity, Package, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

// export default function ProductionManagementDashboard() {
//   const [kpis, setKpis] = useState({
//     activeOrders: 0,
//     completedOrders: 0,
//     efficiency: 0,
//     qualityRate: 0,
//     utilizationRate: 0,
//     rejectionRate: 0,
//   });

//   const [recentActivity, setRecentActivity] = useState<WorkOrder[]>([]);

//   useEffect(() => {
//     calculateKPIs();
//   }, []);

//   const calculateKPIs = () => {
//     const workOrders: WorkOrder[] = storage.get(STORAGE_KEYS.WORK_ORDERS, []);
//     const qualityChecks: QualityCheck[] = storage.get(STORAGE_KEYS.QUALITY_CHECKS, []);
//     const workCenters: WorkCenter[] = storage.get(STORAGE_KEYS.WORK_CENTERS, []);

//     const activeOrders = workOrders.filter(wo => wo.status === 'in-progress').length;
//     const completedOrders = workOrders.filter(wo => wo.status === 'completed').length;
//     const totalProduced = workOrders.reduce((sum, wo) => sum + wo.producedQuantity, 0);
//     const totalRejected = workOrders.reduce((sum, wo) => sum + wo.rejectedQuantity, 0);

//     const passedQC = qualityChecks.filter(qc => qc.result === 'pass').length;
//     const totalQC = qualityChecks.length;

//     const activeWorkCenters = workCenters.filter(wc => wc.status === 'active').length;
//     const totalWorkCenters = workCenters.length;

//     setKpis({
//       activeOrders,
//       completedOrders,
//       efficiency: workOrders.length > 0 ? Math.round((completedOrders / workOrders.length) * 100) : 0,
//       qualityRate: totalQC > 0 ? Math.round((passedQC / totalQC) * 100) : 0,
//       utilizationRate: totalWorkCenters > 0 ? Math.round((activeWorkCenters / totalWorkCenters) * 100) : 0,
//       rejectionRate: totalProduced > 0 ? Number(((totalRejected / totalProduced) * 100).toFixed(2)) : 0,
//     });

//     setRecentActivity(workOrders.slice(0, 5));
//   };

//   return (
//     <div className="space-y-8">
//       {/* Header */}
//       <div>
//         <h1 className="text-4xl font-bold text-foreground mb-2">Production Dashboard</h1>
//         <p className="text-muted-foreground">Real-time monitoring of manufacturing operations</p>
//       </div>

//       {/* KPI Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         <KPICard
//           title="Active Work Orders"
//           value={kpis.activeOrders}
//           type="info"
//           icon={Activity}
//         />

//         <KPICard
//           title="Completed Orders"
//           value={kpis.completedOrders}
//           type="success"
//           icon={CheckCircle2}
//         />

//         <KPICard
//           title="Production Efficiency"
//           value={`${kpis.efficiency}%`}
//           change={kpis.efficiency - 85}
//           trend={kpis.efficiency > 85 ? "up" : "down"}
//           type={kpis.efficiency > 85 ? "success" : "warning"}
//           icon={TrendingUp}
//         />

//         <KPICard
//           title="Quality Pass Rate"
//           value={`${kpis.qualityRate}%`}
//           change={kpis.qualityRate - 95}
//           trend={kpis.qualityRate > 95 ? "up" : "down"}
//           type={kpis.qualityRate > 95 ? "success" : "warning"}
//           icon={CheckCircle2}
//         />

//         <KPICard
//           title="Work Center Utilization"
//           value={`${kpis.utilizationRate}%`}
//           type="info"
//           icon={Package}
//         />

//         <KPICard
//           title="Rejection Rate"
//           value={`${kpis.rejectionRate}%`}
//           type={kpis.rejectionRate < 2 ? "success" : "danger"}
//           icon={AlertTriangle}
//         />

//       </div>

//       {/* Recent Activity */}
//       <Card className="shadow-lg">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Clock className="w-5 h-5" />
//             Recent Work Orders
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {recentActivity.length === 0 ? (
//             <p className="text-center text-muted-foreground py-8">No work orders yet. Create your first one to get started!</p>
//           ) : (
//             <div className="space-y-4">
//               {recentActivity.map((order) => (
//                 <div
//                   key={order.id}
//                   className="flex items-center justify-between p-4 bg-gradient-card rounded-lg border border-border hover:shadow-md transition-shadow"
//                 >
//                   <div className="flex-1">
//                     <h4 className="font-semibold text-foreground">{order.orderNumber}</h4>
//                     <p className="text-sm text-muted-foreground">{order.productName}</p>
//                   </div>
//                   <div className="text-right mr-4">
//                     <p className="text-sm font-medium">{order.producedQuantity}/{order.quantity}</p>
//                     <p className="text-xs text-muted-foreground">Produced</p>
//                   </div>
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                     order.status === 'completed' ? 'bg-success/10 text-success' :
//                     order.status === 'in-progress' ? 'bg-primary/10 text-primary' :
//                     order.status === 'planned' ? 'bg-warning/10 text-warning' :
//                     'bg-destructive/10 text-destructive'
//                   }`}>
//                     {order.status}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
