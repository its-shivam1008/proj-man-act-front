import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Plus, Play, Pause, WifiOff, AlertTriangle, Download, ShieldAlert } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";

/**
ProductionExecution.tsx — Advanced Shop Floor Control
Storage keys used (make sure these exist in your storage.ts):
- WORK_ORDERS
- WORK_LOGS
- DOWNTIME_EVENTS
- MAINTENANCE_REQUESTS
- QUALITY_CHECKS
- WORK_CENTERS
- EMPLOYEES
- ATTENDANCE
- (optional) INVENTORY, ISSUE_SLIPS (integration)
*/

type WorkOrder = any; // using any to keep integration flexible
type WorkLog = {
  id: string;
  workOrderId: string;
  operationId?: string; // if operation-level
  type: "start" | "stop" | "produce" | "reject" | "rework" | "downtime" | "attendance";
  operatorId?: string;
  workCenterId?: string;
  timestamp: string;
  durationMinutes?: number;
  producedQty?: number;
  rejectedQty?: number;
  reworkedQty?: number;
  notes?: string;
};

type DowntimeEvent = {
  id: string;
  workCenterId: string;
  start: string;
  end?: string;
  minutes?: number;
  reason: string;
  raisedBy?: string;
  maintenanceRequestId?: string;
};

type MaintenanceRequest = {
  id: string;
  workCenterId: string;
  reportedAt: string;
  status: "open" | "assigned" | "closed";
  description?: string;
  assignedTo?: string;
};

const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowISO = () => new Date().toISOString();

export default function ProductionExecution() {
  const canView = usePermission("productionExecution", "view");
  const canCreate = usePermission("productionExecution", "create");
  const canEdit = usePermission("productionExecution", "edit");
  const canDelete = usePermission("productionExecution", "delete");


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
  /* ---------- load persisted data ---------- */
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => storage.get(STORAGE_KEYS.WORK_ORDERS, []));
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(() => storage.get(STORAGE_KEYS.WORK_LOGS, []));
  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeEvent[]>(() => storage.get(STORAGE_KEYS.DOWNTIME_EVENTS, []));
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(() => storage.get(STORAGE_KEYS.MAINTENANCE_REQUESTS, []));
  const [qualityChecks, setQualityChecks] = useState<any[]>(() => storage.get(STORAGE_KEYS.QUALITY_CHECKS, []));
  const workCenters = storage.get(STORAGE_KEYS.WORK_CENTERS, []);
  const employees = storage.get(STORAGE_KEYS.EMPLOYEES, []);
  const [attendance, setAttendance] = useState<any[]>(() => storage.get(STORAGE_KEYS.ATTENDANCE, []));

  // persist any changes
  useEffect(() => storage.set(STORAGE_KEYS.WORK_LOGS, workLogs), [workLogs]);
  useEffect(() => storage.set(STORAGE_KEYS.DOWNTIME_EVENTS, downtimeEvents), [downtimeEvents]);
  useEffect(() => storage.set(STORAGE_KEYS.MAINTENANCE_REQUESTS, maintenanceRequests), [maintenanceRequests]);
  useEffect(() => storage.set(STORAGE_KEYS.QUALITY_CHECKS, qualityChecks), [qualityChecks]);
  useEffect(() => storage.set(STORAGE_KEYS.ATTENDANCE, attendance), [attendance]);

  // refresh workOrders when storage changed outside this component
  useEffect(() => {
    const handler = () => setWorkOrders(storage.get(STORAGE_KEYS.WORK_ORDERS, []));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /* ---------- UI state ---------- */
  const [selectedWO, setSelectedWO] = useState<string | "">("");
  const [selectedWC, setSelectedWC] = useState<string | "">("");
  const [selectedOp, setSelectedOp] = useState<string | "">(""); // operation id if work order has operations
  const [selectedOperator, setSelectedOperator] = useState<string | "">("");
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logForm, setLogForm] = useState<Partial<WorkLog>>({});
  const [downtimeDialogOpen, setDowntimeDialogOpen] = useState(false);
  const [downtimeForm, setDowntimeForm] = useState<Partial<DowntimeEvent>>({});
  const [filterFrom, setFilterFrom] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10);
  });
  const [filterTo, setFilterTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  // timers: map of workLog start timestamps for each running WO id (ms)
  const timersRef = useRef<Record<string, number>>({});

  /* ---------- derived / chart data ---------- */
  const filteredLogs = useMemo(() => {
    const from = new Date(filterFrom + "T00:00:00").getTime();
    const to = new Date(filterTo + "T23:59:59").getTime();
    return workLogs.filter(w => {
      const t = new Date(w.timestamp).getTime();
      return t >= from && t <= to;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [workLogs, filterFrom, filterTo]);

  const downtimeSummary = useMemo(() => {
    // sum minutes per work center in filtered range
    const map: Record<string, number> = {};
    downtimeEvents.forEach(d => {
      const s = new Date(d.start).getTime();
      if (d.end) {
        const e = new Date(d.end).getTime();
        if (e < new Date(filterFrom + "T00:00:00").getTime() || s > new Date(filterTo + "T23:59:59").getTime()) return;
      }
      map[d.workCenterId] = (map[d.workCenterId] || 0) + (d.minutes || 0);
    });
    return Object.entries(map).map(([wc, min]) => ({ workCenterId: wc, minutes: min }));
  }, [downtimeEvents, filterFrom, filterTo]);

  const productionByDay = useMemo(() => {
    const map: Record<string, number> = {};
    workLogs.forEach(l => {
      if (l.type === "produce" && l.producedQty) {
        const date = l.timestamp.slice(0, 10);
        map[date] = (map[date] || 0) + l.producedQty;
      }
    });
    return Object.entries(map).sort().map(([date, qty]) => ({ date, qty }));
  }, [workLogs]);

  /* ---------- core actions: start / stop / produce / reject / rework ---------- */

  function startOperation(woId: string, operatorId?: string, operationId?: string) {
    // create start log and start timer
    const log: WorkLog = {
      id: genId("wl"),
      workOrderId: woId,
      operationId,
      type: "start",
      operatorId,
      workCenterId: workCenters.find((w: any) => w.id === selectedWC)?.id || undefined,
      timestamp: nowISO(),
    };
    setWorkLogs(s => [log, ...s]);
    timersRef.current[woId] = Date.now();
  }

  function stopOperation(woId: string, produced = 0, rejected = 0, reworked = 0, notes?: string) {
    const startTs = timersRef.current[woId];
    let durMin = undefined;
    if (startTs) {
      durMin = Math.round((Date.now() - startTs) / 60000); // minutes
      timersRef.current[woId] = undefined;
    }

    const log: WorkLog = {
      id: genId("wl"),
      workOrderId: woId,
      operationId: selectedOp || undefined,
      type: "stop",
      operatorId: selectedOperator || undefined,
      workCenterId: selectedWC || undefined,
      timestamp: nowISO(),
      durationMinutes: durMin,
      producedQty: produced,
      rejectedQty: rejected,
      reworkedQty: reworked,
      notes,
    };
    setWorkLogs(s => [log, ...s]);

    // optionally trigger quality check if production happened
    if (produced > 0) {
      triggerQualityInspection(woId, selectedOp || undefined, produced);
    }
  }

  function recordProduction(woId: string, produced: number, rejected: number = 0, reworked: number = 0, notes?: string) {
    const log: WorkLog = {
      id: genId("wl"),
      workOrderId: woId,
      type: "produce",
      operatorId: selectedOperator || undefined,
      workCenterId: selectedWC || undefined,
      timestamp: nowISO(),
      producedQty: produced,
      rejectedQty: rejected,
      reworkedQty: reworked,
      notes,
    };
    setWorkLogs(s => [log, ...s]);
    // trigger QC
    if (produced > 0) triggerQualityInspection(woId, selectedOp || undefined, produced);
  }

  /* ---------- downtime logging & maintenance ---------- */

  function createDowntime(workCenterId: string, reason: string, startISO?: string) {
    const start = startISO || nowISO();
    const evt: DowntimeEvent = { id: genId("dt"), workCenterId, start, reason, raisedBy: selectedOperator || undefined };
    setDowntimeEvents(s => [evt, ...s]);
    // auto-create maintenance request
    const mr: MaintenanceRequest = { id: genId("mr"), workCenterId, reportedAt: nowISO(), status: "open", description: `Auto from downtime: ${reason}` };
    setMaintenanceRequests(s => [mr, ...s]);
    // link them
    setDowntimeEvents(s => s.map(d => d.id === evt.id ? { ...d, maintenanceRequestId: mr.id } : d));
  }

  function closeDowntime(downtimeId: string) {
    setDowntimeEvents(s => s.map(d => d.id === downtimeId ? { ...d, end: nowISO(), minutes: Math.round((new Date(nowISO()).getTime() - new Date(d.start).getTime()) / 60000) } : d));
  }

  function createMaintenanceRequest(workCenterId: string, description?: string) {
    const mr: MaintenanceRequest = { id: genId("mr"), workCenterId, reportedAt: nowISO(), status: "open", description };
    setMaintenanceRequests(s => [mr, ...s]);
  }

  function closeMaintenanceRequest(mrId: string) {
    setMaintenanceRequests(s => s.map(m => m.id === mrId ? { ...m, status: "closed" } : m));
  }

  /* ---------- quality integration ---------- */

  function triggerQualityInspection(workOrderId: string, operationId?: string, qty?: number) {
    const qc = {
      id: genId("qc"),
      workOrderId,
      operationId,
      requestedAt: nowISO(),
      status: "pending",
      qty: qty || 0,
    };
    setQualityChecks(s => [qc, ...s]);
  }

  function completeQuality(qcId: string, passed: boolean, remarks?: string) {
    setQualityChecks(s => s.map(q => q.id === qcId ? { ...q, status: passed ? "pass" : "fail", completedAt: nowISO(), remarks } : q));
    // if fail, create rework record / alert
    const qc = qualityChecks.find((q: any) => q.id === qcId);
    if (qc && qc.status === "fail") {
      // quick rework log
      const wl: WorkLog = {
        id: genId("wl"),
        workOrderId: qc.workOrderId,
        operationId: qc.operationId,
        type: "rework",
        timestamp: nowISO(),
        notes: "Auto rework triggered due to QC fail"
      };
      setWorkLogs(s => [wl, ...s]);
    }
  }

  /* ---------- attendance / HR quick actions ---------- */

  function operatorCheckIn(operatorId: string) {
    const entry = { id: genId("att"), operatorId, ts: nowISO(), type: "in" };
    setAttendance(s => [entry, ...s]);
    const wl: WorkLog = { id: genId("wl"), workOrderId: "", type: "attendance", operatorId, timestamp: nowISO(), notes: "check-in" };
    setWorkLogs(s => [wl, ...s]);
  }

  function operatorCheckOut(operatorId: string) {
    const entry = { id: genId("att"), operatorId, ts: nowISO(), type: "out" };
    setAttendance(s => [entry, ...s]);
    const wl: WorkLog = { id: genId("wl"), workOrderId: "", type: "attendance", operatorId, timestamp: nowISO(), notes: "check-out" };
    setWorkLogs(s => [wl, ...s]);
  }

  /* ---------- simulated IoT events (machine up/down) ---------- */
  function simulateMachineDown(workCenterId: string, reason = "simulated-failure") {
    // create downtime + maintenance
    createDowntime(workCenterId, reason);
  }

  function simulateMachineUp(downtimeId: string) {
    closeDowntime(downtimeId);
  }

  /* ---------- editing & dialogs (basic) ---------- */
  function openLogDialog(type: WorkLog["type"]) {
    setLogForm({ type, timestamp: nowISO(), operatorId: selectedOperator, workOrderId: selectedWO, workCenterId: selectedWC });
    setLogDialogOpen(true);
  }

  function persistLogForm() {
    const log: WorkLog = {
      id: genId("wl"),
      workOrderId: logForm.workOrderId || selectedWO || "",
      operationId: logForm.operationId,
      type: logForm.type as WorkLog["type"] || "produce",
      operatorId: logForm.operatorId || selectedOperator || undefined,
      workCenterId: logForm.workCenterId || selectedWC || undefined,
      timestamp: logForm.timestamp || nowISO(),
      durationMinutes: logForm.durationMinutes,
      producedQty: logForm.producedQty,
      rejectedQty: logForm.rejectedQty,
      reworkedQty: logForm.reworkedQty,
      notes: logForm.notes,
    };
    setWorkLogs(s => [log, ...s]);
    setLogDialogOpen(false);
  }

  /* ---------- exports ---------- */
  function exportLogsCSV() {
    if (!workLogs.length) return alert("No logs");
    const keys = ["id", "workOrderId", "type", "operatorId", "workCenterId", "timestamp", "durationMinutes", "producedQty", "rejectedQty", "reworkedQty", "notes"];
    const csv = [keys.join(","), ...workLogs.map(w => keys.map(k => JSON.stringify((w as any)[k] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `worklogs_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Production Execution — Shop Floor Control</h1>
          <p className="text-muted-foreground">Start/stop operations, record quantities, log downtime, and trigger maintenance & quality workflows.</p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={!canCreate}
            onClick={() => canCreate && openLogDialog("produce")}
          >
            <Plus className="mr-2 h-4 w-4" /> Quick Log</Button>
          <Button
            variant="outline"
            disabled={!canView}
            onClick={() => canView && exportLogsCSV()}
          >
            <Download className="mr-2 h-4 w-4" />Export Logs</Button>
        </div>
      </div>

      {/* selectors */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <Label>Work Order</Label>
          <select value={selectedWO} onChange={(e) => setSelectedWO(e.target.value)} className="w-full input">
            <option value="">— choose work order —</option>
            {workOrders.map((wo: any) => <option key={wo.id} value={wo.id}>{wo.orderNo || wo.id} · {wo.productName || wo.productId}</option>)}
          </select>
        </div>
        <div>
          <Label>Work Center</Label>
          <select value={selectedWC} onChange={(e) => setSelectedWC(e.target.value)} className="w-full input">
            <option value="">— choose work center —</option>
            {workCenters.map((wc: any) => <option key={wc.id} value={wc.id}>{wc.name || wc.id}</option>)}
          </select>
        </div>
        <div>
          <Label>Operator</Label>
          <select value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)} className="w-full input">
            <option value="">— choose operator —</option>
            {employees.map((op: any) => <option key={op.id} value={op.id}>{op.name || op.id}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button disabled={!canEdit}
            onClick={() => canEdit && startOperation(selectedWO || "", selectedOperator || undefined, selectedOp || undefined)}><Play className="mr-2 h-4 w-4" />Start</Button>
          <Button
            variant="destructive"
            disabled={!canEdit}
            onClick={() => canEdit && stopOperation(selectedWO || "")}
          >
            <Pause className="mr-2 h-4 w-4" />Stop</Button>
        </div>
      </div>

      {/* production quick controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader><CardTitle>Record Production</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <Input placeholder="Produced qty" type="number" id="produce_qty" />
              <Input placeholder="Rejected qty" type="number" id="reject_qty" />
              <Button
                disabled={!canCreate}
                onClick={() => {
                  if (!canCreate) return;
                  const p = Number((document.getElementById("produce_qty") as HTMLInputElement).value || 0);
                  const r = Number((document.getElementById("reject_qty") as HTMLInputElement).value || 0);
                  if (!selectedWO) return alert("Select work order");
                  recordProduction(selectedWO, p, r);
                  (document.getElementById("produce_qty") as HTMLInputElement).value = "";
                  (document.getElementById("reject_qty") as HTMLInputElement).value = "";
                }}>Record</Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Records produce logs and triggers QC automatically.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Log Downtime</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <Input placeholder="Reason" value={downtimeForm.reason || ""} onChange={(e) => setDowntimeForm({ ...downtimeForm, reason: e.target.value })} />
              <Button
                disabled={!canCreate}
                onClick={() => canCreate && createDowntime(selectedWC, downtimeForm.reason || "unplanned")}
              >Log</Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Auto creates maintenance request. Close downtime from list.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Operator Attendance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                disabled={!canCreate}
                onClick={() => canCreate && operatorCheckIn(selectedOperator)}
              >
                Check-in
              </Button>

              <Button
                disabled={!canCreate}
                onClick={() => canCreate && operatorCheckOut(selectedOperator)}
              >
                Check-out
              </Button>

            </div>
            <div className="text-xs text-muted-foreground mt-2">Quick attendance log for HR integration.</div>
          </CardContent>
        </Card>
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Throughput (produced / day)</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#82ca9d" name="Produced" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Downtime by Work Center (mins)</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={downtimeSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workCenterId" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="minutes" stroke="#ff7f50" name="Downtime (mins)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* logs table */}
      <Card>
        <CardHeader><CardTitle>Execution & Event Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Label>From</Label>
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            <Label>To</Label>
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            <div className="flex-1" />
            <Button
              disabled={!canDelete}
              onClick={() => canDelete && setWorkLogs([])}
            >
              Clear Logs
            </Button>

          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>WO / Op</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>WC</TableHead>
                <TableHead>Qty P/R</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{new Date(l.timestamp).toLocaleString()}</TableCell>
                  <TableCell><Badge>{l.type}</Badge></TableCell>
                  <TableCell>{l.workOrderId} {l.operationId ? ` / ${l.operationId}` : ""}</TableCell>
                  <TableCell>{(employees.find((e: any) => e.id === l.operatorId)?.name) || l.operatorId}</TableCell>
                  <TableCell>{l.workCenterId}</TableCell>
                  <TableCell>{(l.producedQty || 0)}/{(l.rejectedQty || 0)}</TableCell>
                  <TableCell>{l.durationMinutes ? `${l.durationMinutes}m` : "-"}</TableCell>
                  <TableCell>{l.notes || ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* downtime list & maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Downtime Events</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WC</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>MR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downtimeEvents.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.workCenterId}</TableCell>
                    <TableCell>{new Date(d.start).toLocaleString()}</TableCell>
                    <TableCell>{d.end ? new Date(d.end).toLocaleString() : "—"}</TableCell>
                    <TableCell>{d.minutes || "-"}</TableCell>
                    <TableCell>{d.reason}</TableCell>
                    <TableCell>
                      {d.maintenanceRequestId ? (
                        <div>
                          <div>{d.maintenanceRequestId}</div>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={!canEdit}
                            onClick={() => canEdit && closeDowntime(d.id)}
                          >
                            Close
                          </Button>

                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!canCreate}
                          onClick={() => canCreate && createMaintenanceRequest(d.workCenterId, d.reason)}
                        >
                          Create MR
                        </Button>

                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {downtimeEvents.length === 0 && <div className="text-center py-6 text-muted-foreground">No downtime recorded.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Maintenance Requests</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>WC</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRequests.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{m.id}</TableCell>
                    <TableCell>{m.workCenterId}</TableCell>
                    <TableCell>{new Date(m.reportedAt).toLocaleString()}</TableCell>
                    <TableCell><Badge>{m.status}</Badge></TableCell>
                    <TableCell>{m.description}</TableCell>
                    <TableCell>
                      {m.status !== "closed" ? <Button onClick={() => closeMaintenanceRequest(m.id)}>Close</Button> : <span>—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {maintenanceRequests.length === 0 && <div className="text-center py-6 text-muted-foreground">No maintenance requests.</div>}
          </CardContent>
        </Card>
      </div>

      {/* QC list */}
      <Card>
        <CardHeader><CardTitle>Quality Checks</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>WO</TableHead>
                <TableHead>Op</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualityChecks.map(q => (
                <TableRow key={q.id}>
                  <TableCell>{q.id}</TableCell>
                  <TableCell>{q.workOrderId}</TableCell>
                  <TableCell>{q.operationId || "-"}</TableCell>
                  <TableCell>{q.qty || 0}</TableCell>
                  <TableCell>{new Date(q.requestedAt).toLocaleString()}</TableCell>
                  <TableCell><Badge>{q.status}</Badge></TableCell>
                  <TableCell>
                    {q.status === "pending" ? (
                      <>
                        <Button
                          disabled={!canEdit}
                          onClick={() => canEdit && completeQuality(q.id, true)}
                        >
                          Pass
                        </Button>

                        <Button
                          variant="destructive"
                          disabled={!canEdit}
                          onClick={() => canEdit && completeQuality(q.id, false)}
                        >
                          Fail
                        </Button>

                      </>
                    ) : <span>—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {qualityChecks.length === 0 && <div className="text-center py-6 text-muted-foreground">No quality checks.</div>}
        </CardContent>
      </Card>

      {/* simulated IoT panel */}
      <Card>
        <CardHeader><CardTitle>Simulated IoT / Barcode</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <Input placeholder="Scan barcode or enter token" id="barcode_input" onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value.trim();
                // simple: if token starts with "DT-" => create downtime on selectedWC
                if (v.startsWith("DT-")) {
                  if (!selectedWC) return alert("Select work center to map downtime");
                  createDowntime(selectedWC, `Barcode triggered: ${v}`);
                } else if (v.startsWith("MR-")) {
                  if (!selectedWC) return alert("Select work center to map MR");
                  createMaintenanceRequest(selectedWC, `Barcode MR: ${v}`);
                } else {
                  alert("Scanned: " + v);
                }
                (e.target as HTMLInputElement).value = "";
              }
            }} />
            <Button
              disabled={!canCreate}
              onClick={() => canCreate && simulateMachineDown(selectedWC, "iot-simulated-failure")}
            >
              Simulate Machine Down
            </Button>

            <Button
              disabled={!canEdit || !downtimeEvents.length}
              onClick={() => canEdit && downtimeEvents[0]?.id && simulateMachineUp(downtimeEvents[0].id)}
            >
              Simulate Machine Up
            </Button>


          </div>
        </CardContent>
      </Card>
    </div>
  );
}
