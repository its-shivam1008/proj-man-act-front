import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Plus, Download, Upload, ShieldAlert } from "lucide-react";

/* ============================================================
   Types
   ============================================================ */
type DPR = {
  id: string;
  date: string;
  project?: string;
  manager?: string;
  totalProduced: number;
  totalRejected: number;
  totalDowntimeMin: number;
  remarks?: string;
};

type WorkCenter = {
  id: string;
  date: string;
  workCenter: string;
  producedQty: number;
  runTimeMin: number;
  downtimeMin: number;
  availableMin: number;
  operator?: string;
  remarks?: string;
};

type Material = {
  id: string;
  date: string;
  itemId: string;
  consumedQty: number;
  unit: string;
  project?: string;
  issuedBy?: string;
  remarks?: string;
};

type Downtime = {
  id: string;
  date: string;
  workCenter: string;
  durationMin: number;
  reason?: string;
  severity?: string;
};

type Quality = {
  id: string;
  date: string;
  productId: string;
  qtyRejected: number;
  defectReason?: string;
  inspector?: string;
};

type OEE = {
  id: string;
  date: string;
  workCenter: string;
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
};

type Order = {
  id: string;
  orderId: string;
  plannedQty: number;
  producedQty: number;
  startDate: string;
  endDate: string;
  status?: string;
};

type WIP = {
  id: string;
  productId: string;
  wipQty: number;
  location?: string;
};

type Cost = {
  id: string;
  date: string;
  productId: string;
  producedQty: number;
  totalCost: number;
};

type Labour = {
  id: string;
  date: string;
  workerId: string;
  hoursWorked: number;
  outputQty: number;
};

type Equipment = {
  id: string;
  date: string;
  equipmentId: string;
  availableMin: number;
  runMin: number;
};

/* ============================================================
   Helper Functions
   ============================================================ */
const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();

/* ============================================================
   Component
   ============================================================ */
export default function ProductionReportingAnalytics() {


  const canView = usePermission("productionReportingAnalytics", "view");
  const canCreate = usePermission("productionReportingAnalytics", "create");
  const canEdit = usePermission("productionReportingAnalytics", "edit");
  const canDelete = usePermission("productionReportingAnalytics", "delete");
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
  const [tab, setTab] = useState("dashboard");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [formType, setFormType] = useState<string>("");

  const [dprs, setDprs] = useState<DPR[]>(() => storage.get("REPORTS_DPR", []));
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>(() =>
    storage.get("REPORTS_WORKCENTER", [])
  );
  const [materials, setMaterials] = useState<Material[]>(() =>
    storage.get("REPORTS_MATERIAL", [])
  );
  const [downtimes, setDowntimes] = useState<Downtime[]>(() =>
    storage.get("REPORTS_DOWNTIME", [])
  );
  const [quality, setQuality] = useState<Quality[]>(() =>
    storage.get("REPORTS_QUALITY", [])
  );
  const [oees, setOees] = useState<OEE[]>(() => storage.get("REPORTS_OEE", []));
  const [orders, setOrders] = useState<Order[]>(() =>
    storage.get("REPORTS_ORDER_PROGRESS", [])
  );
  const [wips, setWips] = useState<WIP[]>(() => storage.get("REPORTS_WIP", []));
  const [costs, setCosts] = useState<Cost[]>(() =>
    storage.get("REPORTS_COST_OUTPUT", [])
  );
  const [labours, setLabours] = useState<Labour[]>(() =>
    storage.get("REPORTS_LABOUR", [])
  );
  const [equips, setEquips] = useState<Equipment[]>(() =>
    storage.get("REPORTS_EQUIP", [])
  );

  /* Save to localStorage */
  useEffect(() => {
    storage.set("REPORTS_DPR", dprs);
    storage.set("REPORTS_WORKCENTER", workCenters);
    storage.set("REPORTS_MATERIAL", materials);
    storage.set("REPORTS_DOWNTIME", downtimes);
    storage.set("REPORTS_QUALITY", quality);
    storage.set("REPORTS_OEE", oees);
    storage.set("REPORTS_ORDER_PROGRESS", orders);
    storage.set("REPORTS_WIP", wips);
    storage.set("REPORTS_COST_OUTPUT", costs);
    storage.set("REPORTS_LABOUR", labours);
    storage.set("REPORTS_EQUIP", equips);
  }, [
    dprs,
    workCenters,
    materials,
    downtimes,
    quality,
    oees,
    orders,
    wips,
    costs,
    labours,
    equips,
  ]);

  /* ============================================================
     Add / Edit / Delete
     ============================================================ */
  const handleSave = () => {
    const id = form?.id || genId(formType);
    const newItem = { ...form, id };
    const setMap: any = {
      DPR: setDprs,
      WorkCenter: setWorkCenters,
      Material: setMaterials,
      Downtime: setDowntimes,
      Quality: setQuality,
      OEE: setOees,
      Order: setOrders,
      WIP: setWips,
      Cost: setCosts,
      Labour: setLabours,
      Equipment: setEquips,
    };
    const dataMap: any = {
      DPR: dprs,
      WorkCenter: workCenters,
      Material: materials,
      Downtime: downtimes,
      Quality: quality,
      OEE: oees,
      Order: orders,
      WIP: wips,
      Cost: costs,
      Labour: labours,
      Equipment: equips,
    };
    const list = [...(dataMap[formType] || [])];
    const idx = list.findIndex((i) => i.id === id);
    if (idx >= 0) list[idx] = newItem;
    else list.push(newItem);
    setMap[formType](list);
    setDialogOpen(false);
    setForm({});
  };

  const openDialog = (type: string) => {
    setFormType(type);
    setForm({});
    setDialogOpen(true);
  };

  /* ============================================================
     Charts
     ============================================================ */
  const dprTrend = useMemo(() => {
    const map: Record<string, { produced: number; rejected: number }> = {};
    dprs.forEach((d) => {
      map[d.date] = map[d.date] || { produced: 0, rejected: 0 };
      map[d.date].produced += d.totalProduced;
      map[d.date].rejected += d.totalRejected;
    });
    return Object.entries(map).map(([date, v]) => ({
      date,
      produced: v.produced,
      rejected: v.rejected,
    }));
  }, [dprs]);

  const downtimeChart = useMemo(() => {
    const map: Record<string, number> = {};
    downtimes.forEach((d) => {
      map[d.workCenter] = (map[d.workCenter] || 0) + d.durationMin;
    });
    return Object.entries(map).map(([workCenter, minutes]) => ({
      workCenter,
      minutes,
    }));
  }, [downtimes]);

  const oeeChart = useMemo(() => {
    return oees.map((o) => ({
      date: o.date,
      oee:
        ((o.availabilityPct * o.performancePct * o.qualityPct) / 10000).toFixed(
          2
        ),
    }));
  }, [oees]);

  /* ============================================================
     UI
     ============================================================ */
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Production Reporting & Analytics
          </h1>
          <p className="text-muted-foreground">
            Real-time dashboards with editable report data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={!canCreate}
            onClick={() => canCreate && openDialog("DPR")}
            className={!canCreate ? "opacity-50 cursor-not-allowed" : ""}
          >
            <Plus className="mr-2" /> New DPR
          </Button>
          <Button
            disabled={!canCreate}
            onClick={() => canCreate && openDialog("WorkCenter")}
            className={!canCreate ? "opacity-50 cursor-not-allowed" : ""}
          >WorkCenter</Button>
          <Button
            disabled={!canCreate}
            onClick={() => canCreate && openDialog("Downtime")}
            className={!canCreate ? "opacity-50 cursor-not-allowed" : ""}>Downtime</Button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Production Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dprTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="produced" stroke="#16a34a" />
                    <Line dataKey="rejected" stroke="#dc2626" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Downtime Summary</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={downtimeChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="workCenter" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OEE Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={oeeChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="oee" stroke="#6366f1" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Daily Production Reports (DPR)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produced</TableHead>
                    <TableHead>Rejected</TableHead>
                    <TableHead>Downtime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dprs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.date}</TableCell>
                      <TableCell>{d.totalProduced}</TableCell>
                      <TableCell>{d.totalRejected}</TableCell>
                      <TableCell>{d.totalDowntimeMin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CRUD Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {formType} Record</DialogTitle>
          </DialogHeader>

          <div
            style={{
              pointerEvents: form?.id
                ? (canEdit ? "auto" : "none")
                : (canCreate ? "auto" : "none"),
              opacity: form?.id
                ? (canEdit ? 1 : 0.6)
                : (canCreate ? 1 : 0.6),
            }}
          >
            {renderForm(formType, form, setForm)}
          </div>


          <DialogFooter>
            <Button
              className="w-full"
              disabled={form?.id ? !canEdit : !canCreate}
              onClick={() => (form?.id ? canEdit : canCreate) && handleSave()}
            >
              Save Record
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}

/* ============================================================
   Dynamic Form Renderer
   ============================================================ */
function renderForm(type: string, form: any, setForm: Function) {
  const onChange = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  const input = (
    label: string,
    key: string,
    type: string = "text",
    placeholder = ""
  ) => (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <Input
        type={type}
        value={form?.[key] ?? ""}
        onChange={(e) =>
          onChange(key, type === "number" ? Number(e.target.value) : e.target.value)
        }
        placeholder={placeholder}
      />
    </div>
  );

  switch (type) {
    case "DPR":
      return (
        <div className="grid gap-2">
          {input("Date", "date", "date")}
          {input("Project", "project")}
          {input("Manager", "manager")}
          {input("Total Produced", "totalProduced", "number")}
          {input("Total Rejected", "totalRejected", "number")}
          {input("Downtime (min)", "totalDowntimeMin", "number")}
          {input("Remarks", "remarks")}
        </div>
      );

    case "WorkCenter":
      return (
        <div className="grid gap-2">
          {input("Date", "date", "date")}
          {input("Work Center", "workCenter")}
          {input("Produced Qty", "producedQty", "number")}
          {input("Run Time (min)", "runTimeMin", "number")}
          {input("Downtime (min)", "downtimeMin", "number")}
          {input("Available (min)", "availableMin", "number")}
          {input("Operator", "operator")}
          {input("Remarks", "remarks")}
        </div>
      );

    case "Downtime":
      return (
        <div className="grid gap-2">
          {input("Date", "date", "date")}
          {input("Work Center", "workCenter")}
          {input("Duration (min)", "durationMin", "number")}
          {input("Reason", "reason")}
          {input("Severity", "severity")}
        </div>
      );

    default:
      return <p className="text-muted-foreground">Form not defined.</p>;
  }
}
