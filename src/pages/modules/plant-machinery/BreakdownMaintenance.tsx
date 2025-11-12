"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  AlertCircle,
  Wrench,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  BarChart3,
  DownloadCloud,
  UploadCloud,
  FilePlus,
  Eye,
  Download,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  isBefore,
  differenceInDays,
} from "date-fns";

/* -----------------------
   Types
   ----------------------- */
type Status = "Reported" | "Assigned" | "In Progress" | "Completed" | "Cancelled";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

interface Breakdown {
  id: string;
  equipmentCode: string;
  reportedBy: string;
  reportDate: string; // ISO
  failureDescription: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignedTo?: string;
  assignDate?: string; // ISO
  startRepair?: string; // ISO
  endRepair?: string; // ISO
  downtimeMinutes?: number;
  repairCost?: number;
  rca?: string;
  attachments?: Attachment[];
  status: Status;
  createdAt: string;
}

interface MaintenanceWorkOrder {
  id: string;
  breakdownId: string;
  equipmentCode: string;
  technician?: string;
  startDate?: string;
  endDate?: string;
  totalDowntimeMinutes?: number;
  totalRepairCost?: number;
  rca?: string;
  status: "Open" | "Closed";
  createdAt: string;
}

/* -----------------------
   Keys
   ----------------------- */
const LS_KEY = STORAGE_KEYS.BREAKDOWN_MAINTENANCE_V1 || "breakdown_maintenance_v1"; // if you added constant
const FALLBACK_LS_KEY = "breakdown_maintenance_v1";
const MWO_KEY = STORAGE_KEYS.MAINTENANCE_WORK_ORDERS_V1 || "maintenance_work_orders_v1";

/* -----------------------
   Component
   ----------------------- */
export default function BreakdownCalendarWithMWO() {
  const [records, setRecords] = useState<Breakdown[]>([]);
  const [mwos, setMwos] = useState<MaintenanceWorkOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Breakdown | null>(null);
  const [form, setForm] = useState<Partial<Breakdown>>({
    priority: "Medium",
    reportDate: new Date().toISOString().slice(0, 16),
    repairCost: 0,
    attachments: [],
  });

  // view mode + calendar month state
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- load data once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = storage.get<Breakdown[]>(LS_KEY, storage.get(FALLBACK_LS_KEY, []));
    if (Array.isArray(saved) && saved.length > 0) setRecords(saved);
    const savedMwo = storage.get<MaintenanceWorkOrder[]>(MWO_KEY, []);
    if (Array.isArray(savedMwo) && savedMwo.length > 0) setMwos(savedMwo);
    setLoaded(true);
  }, []);

  // --- save when changed and loaded
  useEffect(() => {
    if (!loaded) return;
    storage.set(LS_KEY, records);
  }, [records, loaded]);

  useEffect(() => {
    if (!loaded) return;
    storage.set(MWO_KEY, mwos);
  }, [mwos, loaded]);

  // cross-tab sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === LS_KEY || e.key === FALLBACK_LS_KEY) {
        const remote = storage.get<Breakdown[]>(LS_KEY, storage.get(FALLBACK_LS_KEY, []));
        setRecords(remote || []);
      }
      if (e.key === MWO_KEY) {
        const remoteM = storage.get<MaintenanceWorkOrder[]>(MWO_KEY, []);
        setMwos(remoteM || []);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /* -----------------------
     CRUD & Workflow
  ----------------------- */
  function openAdd() {
    setEditing(null);
    setForm({
      priority: "Medium",
      reportDate: new Date().toISOString().slice(0, 16),
      repairCost: 0,
      attachments: [],
    });
    setIsDialogOpen(true);
  }

  function openEdit(b: Breakdown) {
    setEditing(b);
    setForm({ ...b });
    setIsDialogOpen(true);
  }

  async function handleAttachments(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const converted: Attachment[] = await Promise.all(
      arr.map(
        (f) =>
          new Promise<Attachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: uuidv4(),
                name: f.name,
                type: f.type,
                size: f.size,
                dataUrl: reader.result as string,
              });
            reader.onerror = reject;
            reader.readAsDataURL(f);
          })
      )
    );
    setForm((p) => ({ ...p, attachments: [...(p?.attachments || []), ...converted] }));
  }

  function removeAttachment(id: string) {
    setForm((p) => ({ ...p, attachments: (p?.attachments || []).filter((a) => a.id !== id) }));
  }

  function saveForm() {
    if (!form.equipmentCode || !form.reportedBy || !form.failureDescription) {
      toast.error("Equipment, reporter and failure description are required.");
      return;
    }

    if (editing) {
      const updated = records.map((r) => (r.id === editing.id ? { ...r, ...form } as Breakdown : r));
      setRecords(updated);
      toast.success("Breakdown updated");
    } else {
      const newRec: Breakdown = {
        id: uuidv4(),
        equipmentCode: form.equipmentCode!,
        reportedBy: form.reportedBy!,
        reportDate: form.reportDate || new Date().toISOString(),
        failureDescription: form.failureDescription!,
        priority: (form.priority as any) || "Medium",
        assignedTo: form.assignedTo,
        assignDate: form.assignDate,
        status: "Reported",
        attachments: form.attachments || [],
        repairCost: form.repairCost || 0,
        downtimeMinutes: form.downtimeMinutes || 0,
        rca: form.rca || "",
        createdAt: new Date().toISOString(),
      };
      setRecords((p) => [newRec, ...p]);
      toast.success("Breakdown reported");
    }
    setIsDialogOpen(false);
  }

  function removeRecord(id: string) {
    if (!confirm("Delete this breakdown record?")) return;
    setRecords((p) => p.filter((r) => r.id !== id));
    toast.error("Deleted");
  }

  function assignTo(id: string, tech: string) {
    const now = new Date().toISOString();
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, assignedTo: tech, assignDate: now, status: "Assigned" } : r))
    );
    toast.success("Assigned");
  }

  function startRepair(id: string) {
    const now = new Date().toISOString();
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, startRepair: now, status: "In Progress" } : r)));
    toast.success("Repair started");
  }

  function completeRepair(id: string, additionalCost = 0, rca = "") {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const end = new Date().toISOString();
        const start = r.startRepair ? new Date(r.startRepair) : new Date(r.assignDate || r.reportDate);
        const downtimeMinutes = Math.max(
          0,
          Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60))
        );
        const updated: Breakdown = {
          ...r,
          endRepair: end,
          downtimeMinutes: downtimeMinutes > 0 ? downtimeMinutes : (r.downtimeMinutes || 0),
          repairCost: (r.repairCost || 0) + additionalCost,
          rca: rca || r.rca,
          status: "Completed",
        };

        // create MWO
        const mwo: MaintenanceWorkOrder = {
          id: uuidv4(),
          breakdownId: r.id,
          equipmentCode: r.equipmentCode,
          technician: r.assignedTo,
          startDate: r.startRepair || r.assignDate || r.reportDate,
          endDate: end,
          totalDowntimeMinutes: updated.downtimeMinutes,
          totalRepairCost: updated.repairCost,
          rca: updated.rca,
          status: "Closed",
          createdAt: new Date().toISOString(),
        };

        setMwos((prevMwos) => {
          const next = [mwo, ...prevMwos];
          storage.set(MWO_KEY, next);
          toast.success("Work Order created");
          return next;
        });

        return updated;
      })
    );
    toast.success("Marked Completed & MWO created");
  }

  /* -----------------------
     Metrics & charts
  ----------------------- */
  const mttr = useMemo(() => {
    const done = records.filter((r) => r.status === "Completed" && r.startRepair && r.endRepair);
    if (done.length === 0) return 0;
    const total = done.reduce((s, r) => s + (r.downtimeMinutes || 0), 0);
    return +(total / done.length).toFixed(1);
  }, [records]);

  const mtbf = useMemo(() => {
    const byEquip: Record<string, string[]> = {};
    records.forEach((r) => {
      if (!byEquip[r.equipmentCode]) byEquip[r.equipmentCode] = [];
      byEquip[r.equipmentCode].push(r.reportDate);
    });
    let intervalsInDays: number[] = [];
    Object.values(byEquip).forEach((dates) => {
      const sorted = dates.map((d) => new Date(d).getTime()).sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        const diffDays = (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
        intervalsInDays.push(diffDays);
      }
    });
    if (intervalsInDays.length === 0) return 0;
    const avg = intervalsInDays.reduce((s, v) => s + v, 0) / intervalsInDays.length;
    return +avg.toFixed(2);
  }, [records]);

  const downtimeChart = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      map[r.equipmentCode] = (map[r.equipmentCode] || 0) + (r.downtimeMinutes || 0);
    });
    return Object.entries(map).map(([equipment, downtimeMinutes]) => ({
      equipment,
      downtimeHours: +(downtimeMinutes / 60).toFixed(2),
      downtimeMinutes,
    }));
  }, [records]);

  const failureCountChart = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      map[r.equipmentCode] = (map[r.equipmentCode] || 0) + 1;
    });
    return Object.entries(map).map(([equipment, count]) => ({ equipment, count }));
  }, [records]);

  /* -----------------------
     Export / Import
  ----------------------- */
  function exportJSON() {
    const payload = JSON.stringify(records, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `breakdown_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  }

  function importJSON(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data)) throw new Error("Invalid file");
        const normalized = data.map((d) => ({ id: d.id || uuidv4(), ...d }));
        setRecords(normalized);
        toast.success("Imported successfully");
      } catch (err) {
        toast.error("Import failed: invalid file");
      }
    };
    reader.readAsText(file);
  }

  /* -----------------------
     Attachments utils
  ----------------------- */
  function viewAttachment(a: Attachment) {
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Popup blocked");
      return;
    }
    w.document.write(`<title>${a.name}</title>`);
    if (a.type.startsWith("image/")) {
      w.document.write(`<img src="${a.dataUrl}" style="max-width:100%;height:auto" />`);
    } else if (a.type === "application/pdf") {
      w.document.write(`<iframe src="${a.dataUrl}" style="width:100%;height:100vh;border:none"></iframe>`);
    } else {
      const link = document.createElement("a");
      link.href = a.dataUrl;
      link.download = a.name;
      link.click();
      w.close();
    }
  }

  function downloadAttachment(a: Attachment) {
    const link = document.createElement("a");
    link.href = a.dataUrl;
    link.download = a.name;
    link.click();
  }

  function formatMinutes(min?: number) {
    if (!min || min <= 0) return "--";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  }

  /* -----------------------
     Calendar logic (full month navigation)
  ----------------------- */
  function prevMonth() {
    setCurrentMonth((m) => subMonths(m, 1));
  }
  function nextMonth() {
    setCurrentMonth((m) => addMonths(m, 1));
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // produce array of days to render
  const calendarRows = useMemo(() => {
    const rows: Date[][] = [];
    let cur = startDate;
    while (cur <= endDate) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(cur);
        cur = addDays(cur, 1);
      }
      rows.push(week);
    }
    return rows;
  }, [startDate, endDate]);

  // group breakdowns by date string (yyyy-MM-dd)
  const byDate = useMemo(() => {
    const map: Record<string, Breakdown[]> = {};
    records.forEach((r) => {
      const day = format(parseISO(r.reportDate), "yyyy-MM-dd");
      if (!map[day]) map[day] = [];
      map[day].push(r);
    });
    return map;
  }, [records]);

  // determine color class for a breakdown
  function statusColorClass(r: Breakdown) {
    if (r.status === "Completed") return "bg-green-100 text-green-800";
    const reportDate = r.reportDate ? parseISO(r.reportDate) : parseISO(r.createdAt);
    const daysOld = differenceInDays(new Date(), reportDate);
    if (daysOld > 7 && r.status !== "Completed") return "bg-red-100 text-red-800"; // overdue heuristic
    return "bg-blue-100 text-blue-800";
  }

  /* -----------------------
     Last 5 MWOs
  ----------------------- */
  const last5Mwos = useMemo(() => mwos.slice(0, 5), [mwos]);

  /* -----------------------
     Render
  ----------------------- */
  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertCircle className="h-6 w-6" /> Breakdown & Corrective Maintenance
        </h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => document.getElementById("import-breakdown")?.click()}>
            <UploadCloud className="mr-2 h-4 w-4" /> Import
          </Button>
          <input id="import-breakdown" type="file" accept="application/json" className="hidden" onChange={(e) => importJSON(e.target.files?.[0] || null)} />

          <Button variant="outline" onClick={exportJSON}>
            <DownloadCloud className="mr-2 h-4 w-4" /> Export
          </Button>

          <Button variant="ghost" onClick={() => setViewMode(viewMode === "table" ? "calendar" : "table")}>
            <CalendarDays className="mr-2 h-4 w-4" /> {viewMode === "table" ? "Calendar View" : "Table View"}
          </Button>

          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> New Report
          </Button>
        </div>
      </div>

      {/* top KPIs + last MWOs */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">Total Breakdowns</h3><div className="text-2xl font-bold">{records.length}</div></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">Open / In Progress</h3><div className="text-2xl font-bold">{records.filter((r)=> r.status !== "Completed" && r.status !== "Cancelled").length}</div></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">MTTR (mins)</h3><div className="text-2xl font-bold">{mttr}</div></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">MTBF (days)</h3><div className="text-2xl font-bold">{mtbf}</div></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">Total Downtime (hrs)</h3><div className="text-2xl font-bold">{((records.reduce((s, r) => s + (r.downtimeMinutes || 0), 0) || 0) / 60).toFixed(1)}</div></CardContent></Card>
        <Card>
          <CardHeader><CardTitle>Last 5 MWOs</CardTitle></CardHeader>
          <CardContent>
            {last5Mwos.length === 0 ? <div className="text-sm text-muted-foreground">No MWOs yet</div> : (
              <ul className="space-y-2 text-sm">
                {last5Mwos.map((m) => (
                  <li key={m.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{m.equipmentCode}</div>
                      <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">₹{(m.totalRepairCost||0).toFixed(0)}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Downtime (hours) per Equipment</CardTitle></CardHeader>
          <CardContent>
            {downtimeChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={downtimeChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="equipment" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="downtimeHours" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="text-sm text-muted-foreground">No data yet</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Failures Count per Equipment</CardTitle></CardHeader>
          <CardContent>
            {failureCountChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={failureCountChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="equipment" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="text-sm text-muted-foreground">No data yet</div>}
          </CardContent>
        </Card>
      </div>

      {/* main content: table or calendar */}
      {viewMode === "table" ? (
        <>
          <div className="flex items-center gap-2 max-w-md">
            <Input placeholder="Search equipment, reporter, tech..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <Card>
            <CardHeader><CardTitle>Breakdown Records</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reported</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Downtime</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.filter((r) =>
                      [r.equipmentCode, r.reportedBy, r.assignedTo, r.failureDescription].join(" ").toLowerCase().includes(query.toLowerCase())
                    ).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{new Date(r.reportDate).toLocaleString()}</TableCell>
                        <TableCell>{r.equipmentCode}</TableCell>
                        <TableCell>{r.priority}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>{formatMinutes(r.downtimeMinutes)}</TableCell>
                        <TableCell>₹{(r.repairCost||0).toFixed(0)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                              if (r.status === "Assigned") startRepair(r.id);
                              else if (r.status === "In Progress") completeRepair(r.id, 0, r.rca || "");
                              else if (r.status === "Reported") assignTo(r.id, "TechName");
                              else openEdit(r);
                            }}>
                              <Wrench className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => removeRecord(r.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div>
          {/* month nav */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={prevMonth}><ChevronLeft /></Button>
              <div className="font-medium">{format(currentMonth, "MMMM yyyy")}</div>
              <Button variant="ghost" onClick={nextMonth}><ChevronRight /></Button>
            </div>
            <div className="text-sm text-muted-foreground">Click a breakdown to edit</div>
          </div>

          {/* calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* weekday headers */}
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="text-xs font-medium text-center">{d}</div>
            ))}

            {calendarRows.map((week, wi) => (
              <React.Fragment key={wi}>
                {week.map((day) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  const items = byDate[dayKey] || [];
                  return (
                    <div
                      key={dayKey}
                      className={`min-h-[88px] border rounded p-2 text-xs ${isSameMonth(day, currentMonth) ? "" : "bg-gray-50 text-muted-foreground"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`text-sm font-semibold ${isSameDay(day, new Date()) ? "underline" : ""}`}>{format(day, "d")}</div>
                        <div className="text-[10px] text-muted-foreground">{format(day, "MMM")}</div>
                      </div>

                      <div className="mt-2 space-y-1 overflow-hidden">
                        {items.slice(0, 4).map((r) => (
                          <button
                            key={r.id}
                            onClick={() => openEdit(r)}
                            className={`w-full text-left truncate px-1 py-0.5 rounded ${statusColorClass(r)}`}
                            title={`${r.equipmentCode} — ${r.failureDescription}`}
                          >
                            <div className="text-[11px] font-medium">{r.equipmentCode}</div>
                            <div className="text-[10px]">{r.priority}</div>
                          </button>
                        ))}

                        {items.length > 4 && (
                          <div className="text-[11px] mt-1 text-muted-foreground">+{items.length - 4} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Breakdown" : "New Breakdown Report"}</DialogTitle></DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Equipment Code *</Label>
              <Input value={form.equipmentCode || ""} onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Reported By *</Label>
              <Input value={form.reportedBy || ""} onChange={(e) => setForm({ ...form, reportedBy: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Report Date</Label>
              <Input type="datetime-local" value={(form.reportDate || "").slice(0, 16)} onChange={(e) => setForm({ ...form, reportDate: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <select className="border rounded px-2 py-2 w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Failure Description *</Label>
              <Input value={form.failureDescription || ""} onChange={(e) => setForm({ ...form, failureDescription: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Assign To (Technician)</Label>
              <Input value={form.assignedTo || ""} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Estimated Repair Cost</Label>
              <Input type="number" value={form.repairCost || 0} onChange={(e) => setForm({ ...form, repairCost: Number(e.target.value) })} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>RCA / Notes</Label>
              <Input value={form.rca || ""} onChange={(e) => setForm({ ...form, rca: e.target.value })} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Attachments (photos, reports)</Label>
              <input type="file" multiple onChange={(e) => handleAttachments(e.target.files)} />
              <div className="flex gap-2 flex-wrap mt-2">
                {(form.attachments || []).map((a) => (
                  <div key={a.id} className="border rounded px-2 py-1 text-xs flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{a.name}</span>
                    <button onClick={() => viewAttachment(a)} className="text-xs ml-2" title="View"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => downloadAttachment(a)} className="text-xs" title="Download"><Download className="w-4 h-4" /></button>
                    <button onClick={() => removeAttachment(a.id)} className="text-xs text-red-500">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveForm}><FilePlus className="mr-2 h-4 w-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
