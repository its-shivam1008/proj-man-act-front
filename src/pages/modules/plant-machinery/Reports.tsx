"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Plus,
  Edit2,
  Trash2,
  DownloadCloud,
  UploadCloud,
  Search,
  Activity,
  Clock,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";

type RecordType = "shift" | "daily" | "weekly"; // flexible
interface MonitoringRecord {
  id: string;
  equipmentCode: string;
  date: string; // ISO yyyy-mm-dd
  uptimeMinutes: number; // minutes machine was producing
  downtimeMinutes: number; // minutes machine was down
  productionCount: number; // units produced
  rejects: number; // bad units
  energyKwh: number; // energy consumed
  maintenanceCost: number; // currency
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/* storage key */
const LS_KEY = (STORAGE_KEYS && STORAGE_KEYS.MONITORING_REPORTS_V1) || "monitoring_reports_v1";

/* helper */
function minutesToHours(min?: number) {
  if (!min) return 0;
  return +(min / 60).toFixed(2);
}

/* main component */
export default function MonitoringReportsPage() {
  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [filterEquipment, setFilterEquipment] = useState<string>("All");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MonitoringRecord | null>(null);
  const [form, setForm] = useState<Partial<MonitoringRecord>>({
    date: new Date().toISOString().slice(0, 10),
    uptimeMinutes: 480,
    downtimeMinutes: 0,
    productionCount: 0,
    rejects: 0,
    energyKwh: 0,
    maintenanceCost: 0,
  });

  /* -------- load once (no empty overwrite) -------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = storage.get<MonitoringRecord[]>(LS_KEY, []);
    if (Array.isArray(saved) && saved.length > 0) {
      setRecords(saved);
    }
    setLoaded(true);
  }, []);

  /* -------- save when records change and after initial load -------- */
  useEffect(() => {
    if (!loaded) return;
    // we intentionally allow saving an empty array if user deletes all items,
    // but we avoid writing empty array immediately on first mount by checking 'loaded'
    storage.set(LS_KEY, records);
  }, [records, loaded]);

  /* cross-tab sync */
  useEffect(() => {
    if (typeof window === "undefined") return;
    function handler(e: StorageEvent) {
      if (!e.key) return;
      if (e.key === LS_KEY) {
        const remote = storage.get<MonitoringRecord[]>(LS_KEY, []);
        setRecords(remote || []);
      }
    }
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /* CRUD */
  function openAdd() {
    setEditing(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      uptimeMinutes: 480,
      downtimeMinutes: 0,
      productionCount: 0,
      rejects: 0,
      energyKwh: 0,
      maintenanceCost: 0,
    });
    setDialogOpen(true);
  }

  function openEdit(r: MonitoringRecord) {
    setEditing(r);
    setForm({ ...r });
    setDialogOpen(true);
  }

  function saveForm() {
    if (!form.equipmentCode || !form.date) {
      toast.error("Equipment and date required");
      return;
    }
    const normalized: MonitoringRecord = {
      id: editing ? editing.id : uuidv4(),
      equipmentCode: form.equipmentCode!,
      date: form.date!,
      uptimeMinutes: Number(form.uptimeMinutes || 0),
      downtimeMinutes: Number(form.downtimeMinutes || 0),
      productionCount: Number(form.productionCount || 0),
      rejects: Number(form.rejects || 0),
      energyKwh: Number(form.energyKwh || 0),
      maintenanceCost: Number(form.maintenanceCost || 0),
      notes: form.notes || "",
      createdAt: editing ? editing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editing) {
      setRecords((prev) => prev.map((p) => (p.id === editing.id ? normalized : p)));
      toast.success("Record updated");
    } else {
      setRecords((prev) => [normalized, ...prev]);
      toast.success("Record added");
    }
    setDialogOpen(false);
  }

  function deleteRecord(id: string) {
    if (!confirm("Delete this record?")) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.error("Deleted");
  }

  /* import / export */
  function exportJSON() {
    const payload = JSON.stringify(records, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  }

  function importJSON(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data)) throw new Error("Invalid file");
        const normalized = data.map((d: any) => ({ id: d.id || uuidv4(), ...d }));
        setRecords(normalized);
        toast.success("Imported");
      } catch {
        toast.error("Import failed");
      }
    };
    reader.readAsText(file);
  }

  /* ---------------- Derived metrics ---------------- */
  // Unique equipment list
  const equipments = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.equipmentCode));
    return ["All", ...Array.from(set)];
  }, [records]);

  // filtered list by UI inputs
  const filtered = useMemo(() => {
    let list = [...records];
    if (filterEquipment !== "All") list = list.filter((r) => r.equipmentCode === filterEquipment);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => [r.equipmentCode, r.notes].join(" ").toLowerCase().includes(q));
    }
    if (filterFrom) list = list.filter((r) => r.date >= filterFrom);
    if (filterTo) list = list.filter((r) => r.date <= filterTo);
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [records, filterEquipment, query, filterFrom, filterTo]);

  // KPIs
  const totalUptime = useMemo(() => filtered.reduce((s, r) => s + (r.uptimeMinutes || 0), 0), [filtered]);
  const totalDowntime = useMemo(() => filtered.reduce((s, r) => s + (r.downtimeMinutes || 0), 0), [filtered]);
  const totalProd = useMemo(() => filtered.reduce((s, r) => s + (r.productionCount || 0), 0), [filtered]);
  const totalRejects = useMemo(() => filtered.reduce((s, r) => s + (r.rejects || 0), 0), [filtered]);
  const totalEnergy = useMemo(() => filtered.reduce((s, r) => s + (r.energyKwh || 0), 0), [filtered]);
  const totalMaintenanceCost = useMemo(() => filtered.reduce((s, r) => s + (r.maintenanceCost || 0), 0), [filtered]);

  const utilizationPct = useMemo(() => {
    const totalTime = totalUptime + totalDowntime;
    if (totalTime === 0) return 0;
    return +((totalUptime / totalTime) * 100).toFixed(2);
  }, [totalUptime, totalDowntime]);

  // simplified OEE = Availability * Performance * Quality
  // Availability = uptime / (uptime + downtime)
  // Performance = productionCount / (theoreticalMax) -> we don't have takt; use normalized where performance = 1 if production > 0 and uptime >0
  // Quality = (production - rejects) / production
  const OEE = useMemo(() => {
    const availability = totalUptime + totalDowntime === 0 ? 0 : totalUptime / (totalUptime + totalDowntime);
    const quality = totalProd === 0 ? 1 : (totalProd - totalRejects) / totalProd;
    // naive performance: units per hour normalized: use production per uptime hour vs arbitrary baseline (skip baseline -> assume 1)
    const performance = 1;
    return +((availability * performance * quality) * 100).toFixed(2);
  }, [totalUptime, totalDowntime, totalProd, totalRejects]);

  /* Charts data */
  const utilizationOverTime = useMemo(() => {
    // group by date
    const map: Record<string, { uptime: number; downtime: number }> = {};
    filtered.forEach((r) => {
      if (!map[r.date]) map[r.date] = { uptime: 0, downtime: 0 };
      map[r.date].uptime += r.uptimeMinutes;
      map[r.date].downtime += r.downtimeMinutes;
    });
    return Object.entries(map).map(([date, v]) => ({
      date,
      uptimeHours: +(v.uptime / 60).toFixed(2),
      downtimeHours: +(v.downtime / 60).toFixed(2),
      utilizationPct: +(v.uptime / (v.uptime + v.downtime || 1) * 100).toFixed(2),
    })).sort((a,b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const breakdownFreq = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      // consider a breakdown if downtime > 0
      if (r.downtimeMinutes > 0) {
        map[r.equipmentCode] = (map[r.equipmentCode] || 0) + 1;
      }
    });
    return Object.entries(map).map(([equipment, count]) => ({ equipment, count }));
  }, [records]);

  const costVsUtilization = useMemo(() => {
    // For each equipment, compute utilization and cost
    const map: Record<string, { uptime: number; downtime: number; cost: number }> = {};
    records.forEach((r) => {
      if (!map[r.equipmentCode]) map[r.equipmentCode] = { uptime: 0, downtime: 0, cost: 0 };
      map[r.equipmentCode].uptime += r.uptimeMinutes;
      map[r.equipmentCode].downtime += r.downtimeMinutes;
      map[r.equipmentCode].cost += r.maintenanceCost || 0;
    });
    return Object.entries(map).map(([equipment, v]) => ({
      equipment,
      utilizationPct: +(v.uptime / (v.uptime + v.downtime || 1) * 100).toFixed(2),
      maintenanceCost: +(v.cost || 0),
    }));
  }, [records]);

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* colors for charts */
  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6"];

  /* render */
  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BarChart3 className="h-6 w-6" /> Monitoring · Reports · Analytics
        </h1>

        <div className="flex items-center gap-2">
          <input id="import-file-monitor" type="file" accept="application/json" className="hidden" onChange={(e) => importJSON(e.target.files?.[0] || null)} />
          <Button variant="outline" onClick={() => document.getElementById("import-file-monitor")?.click()}><UploadCloud className="mr-2 h-4 w-4" />Import</Button>
          <Button variant="outline" onClick={exportJSON}><DownloadCloud className="mr-2 h-4 w-4" />Export</Button>
          <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />New Record</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-sm text-muted-foreground">Utilization</div>
            <div className="text-2xl font-bold">{utilizationPct}%</div>
            <div className="text-xs text-muted-foreground">uptime vs total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-4">
            <div className="text-sm text-muted-foreground">Total Downtime (hrs)</div>
            <div className="text-2xl font-bold">{minutesToHours(totalDowntime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-4">
            <div className="text-sm text-muted-foreground">Maintenance Cost</div>
            <div className="text-2xl font-bold">₹{totalMaintenanceCost.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-4">
            <div className="text-sm text-muted-foreground">OEE (est.)</div>
            <div className="text-2xl font-bold">{OEE}%</div>
          </CardContent>
        </Card>
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Utilization Over Time</CardTitle></CardHeader>
          <CardContent>
            {utilizationOverTime.length === 0 ? <div className="text-sm text-muted-foreground">No data</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={utilizationOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="utilizationPct" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Breakdown Frequency</CardTitle></CardHeader>
          <CardContent>
            {breakdownFreq.length === 0 ? <div className="text-sm text-muted-foreground">No breakdowns logged</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={breakdownFreq}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="equipment" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cost vs Utilization</CardTitle></CardHeader>
          <CardContent>
            {costVsUtilization.length === 0 ? <div className="text-sm text-muted-foreground">No data</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={costVsUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="equipment" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="maintenanceCost" fill="#f59e0b" />
                  <Bar dataKey="utilizationPct" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* filters */}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search equipment or notes..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div>
          <select value={filterEquipment} onChange={(e) => setFilterEquipment(e.target.value)} className="border rounded px-2 py-1">
            {equipments.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <Label>From</Label>
          <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          <Label>To</Label>
          <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
        </div>
      </div>

      {/* table */}
      <Card>
        <CardHeader><CardTitle>Monitoring Records</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Uptime (hrs)</TableHead>
                  <TableHead>Downtime (hrs)</TableHead>
                  <TableHead>Prod</TableHead>
                  <TableHead>Rejects</TableHead>
                  <TableHead>Energy (kWh)</TableHead>
                  <TableHead>Maint Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paged.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.equipmentCode}</TableCell>
                    <TableCell>{minutesToHours(r.uptimeMinutes)}</TableCell>
                    <TableCell>{minutesToHours(r.downtimeMinutes)}</TableCell>
                    <TableCell>{r.productionCount}</TableCell>
                    <TableCell>{r.rejects}</TableCell>
                    <TableCell>{r.energyKwh}</TableCell>
                    <TableCell>₹{(r.maintenanceCost||0).toFixed(0)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteRecord(r.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">Page {page} / {totalPages}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Record" : "New Monitoring Record"}</DialogTitle></DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Equipment Code</Label>
              <Input value={form.equipmentCode || ""} onChange={(e) => setForm((f) => ({ ...f, equipmentCode: e.target.value }))} />
            </div>

            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date || new Date().toISOString().slice(0,10)} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>

            <div>
              <Label>Uptime (minutes)</Label>
              <Input type="number" value={form.uptimeMinutes || 0} onChange={(e) => setForm((f) => ({ ...f, uptimeMinutes: Number(e.target.value) }))} />
            </div>

            <div>
              <Label>Downtime (minutes)</Label>
              <Input type="number" value={form.downtimeMinutes || 0} onChange={(e) => setForm((f) => ({ ...f, downtimeMinutes: Number(e.target.value) }))} />
            </div>

            <div>
              <Label>Production Count</Label>
              <Input type="number" value={form.productionCount || 0} onChange={(e) => setForm((f) => ({ ...f, productionCount: Number(e.target.value) }))} />
            </div>

            <div>
              <Label>Rejects</Label>
              <Input type="number" value={form.rejects || 0} onChange={(e) => setForm((f) => ({ ...f, rejects: Number(e.target.value) }))} />
            </div>

            <div>
              <Label>Energy (kWh)</Label>
              <Input type="number" value={form.energyKwh || 0} onChange={(e) => setForm((f) => ({ ...f, energyKwh: Number(e.target.value) }))} />
            </div>

            <div>
              <Label>Maintenance Cost</Label>
              <Input type="number" value={form.maintenanceCost || 0} onChange={(e) => setForm((f) => ({ ...f, maintenanceCost: Number(e.target.value) }))} />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveForm}><Plus className="mr-2 h-4 w-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
