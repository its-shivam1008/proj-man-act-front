"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import {
  Download, Plus, Trash2, Play, Pause, Printer,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { storage, STORAGE_KEYS } from "../../../lib/storage";

/* -----------------------------------
   Type Definitions
----------------------------------- */
type WorkOrder = {
  id: string;
  orderNo: string;
  productId: string;
  productName?: string;
  quantity: number;
  batchNo?: string;
  bomId?: string;
  routingId?: string;
  workCenterId?: string;
  operators?: string[];
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  status?: "planned" | "released" | "in-progress" | "paused" | "completed" | "cancelled";
  reservedMaterials?: { itemId: string; qty: number }[];
  attachments?: { id: string; name: string; dataUrl: string }[];
  plannedHours?: number;
  plannedCost?: number;
  actualHours?: number;
  createdAt?: string;
  updatedAt?: string;
};

type Audit = {
  id: string;
  workOrderId?: string;
  action: string;
  timestamp: string;
  details?: any;
};

type WorkLog = {
  id: string;
  workOrderId: string;
  type: "start" | "stop" | "manual" | "note";
  timestamp: string;
  durationMinutes?: number;
  notes?: string;
  user?: string;
};

const genId = (pref = "id") => `${pref}_${Math.random().toString(36).slice(2, 9)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);

/* -----------------------------------
   Main Component
----------------------------------- */
export default function WorkOrdersAdvanced() {
  const [orders, setOrders] = useState<WorkOrder[]>(() => storage.get(STORAGE_KEYS.WORK_ORDERS, []));
  const [inventory, setInventory] = useState<Record<string, any>>(() => storage.get(STORAGE_KEYS.INVENTORY, {}));
  const boms = storage.get(STORAGE_KEYS.BOMS, []);
  const routings = storage.get(STORAGE_KEYS.ROUTINGS, []);
  const workCenters = storage.get(STORAGE_KEYS.WORK_CENTERS, []);
  const items = storage.get(STORAGE_KEYS.ITEMS, []);
  const [logs, setLogs] = useState<WorkLog[]>(() => storage.get(STORAGE_KEYS.WORK_LOGS, []));
  const [audit, setAudit] = useState<Audit[]>(() => storage.get(STORAGE_KEYS.WORK_ORDER_AUDIT, []));

  const timersRef = useRef<Record<string, number | null>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState<Partial<WorkOrder>>({
    productId: "",
    productName: "",
    quantity: 0,
    batchNo: "",
    bomId: "",
    routingId: "",
    workCenterId: "",
    startDate: todayISO(),
    endDate: todayISO(),
    dueDate: todayISO(),
    status: "planned",
    operators: [],
    attachments: [],
  });

  /* -----------------------------------
     Persist to localStorage
  ----------------------------------- */
  useEffect(() => {
    storage.set(STORAGE_KEYS.WORK_ORDERS, orders);
    storage.set(STORAGE_KEYS.INVENTORY, inventory);
    storage.set(STORAGE_KEYS.WORK_LOGS, logs);
    storage.set(STORAGE_KEYS.WORK_ORDER_AUDIT, audit);
  }, [orders, inventory, logs, audit]);

  /* -----------------------------------
     Derived Data
  ----------------------------------- */
  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.status || "planned"] = (map[o.status || "planned"] || 0) + 1;
    });
    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [orders]);

  /* -----------------------------------
     CRUD Operations
  ----------------------------------- */
  const openNew = () => {
    setEditing(null);
    setForm({
      productId: "",
      productName: "",
      quantity: 0,
      batchNo: "",
      bomId: "",
      routingId: "",
      workCenterId: "",
      startDate: todayISO(),
      endDate: todayISO(),
      dueDate: todayISO(),
      status: "planned",
      operators: [],
      attachments: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (wo: WorkOrder) => {
    setEditing(wo);
    setForm({ ...wo });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.productId || !form.quantity) return alert("Product and quantity are required");

    const now = new Date().toISOString();
    const payload: WorkOrder = {
      ...(editing || {}),
      id: editing ? editing.id : genId("wo"),
      orderNo: editing ? editing.orderNo : `WO-${todayISO()}-${Math.floor(Math.random() * 9000) + 1000}`,
      productId: form.productId!,
      productName: form.productName || form.productId,
      quantity: Number(form.quantity),
      batchNo: form.batchNo,
      bomId: form.bomId,
      routingId: form.routingId,
      workCenterId: form.workCenterId,
      startDate: form.startDate,
      endDate: form.endDate,
      dueDate: form.dueDate,
      status: form.status,
      operators: form.operators || [],
      attachments: form.attachments || [],
      plannedHours: form.plannedHours || 0,
      plannedCost: form.plannedCost || 0,
      actualHours: form.actualHours || 0,
      createdAt: editing ? editing.createdAt : now,
      updatedAt: now,
    };

    const updated = editing
      ? orders.map((o) => (o.id === editing.id ? payload : o))
      : [payload, ...orders];
    setOrders(updated);
    setDialogOpen(false);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this work order?")) return;
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  /* -----------------------------------
     Inventory Safe Renderer
  ----------------------------------- */
  const renderInventory = () => {
    const entries = Object.entries(inventory || {});
    if (entries.length === 0) return <div>No inventory data</div>;

    return entries.map(([key, val]) => {
      const item = items.find((i: any) => i.id === key);
      const name = item?.name || key;
      const qty = typeof val === "object" ? val.qty : val;
      const wh = typeof val === "object" ? val.warehouse : "—";
      return (
        <div key={key} className="text-sm border-b border-dashed py-1">
          {name}: <strong>{qty}</strong> (Warehouse: {wh})
        </div>
      );
    });
  };

  /* -----------------------------------
     Export CSV
  ----------------------------------- */
  const exportOrdersCSV = () => {
    if (!orders.length) return alert("No orders to export");
    const keys = [
      "orderNo", "productName", "quantity", "workCenterId",
      "status", "plannedHours", "actualHours",
    ];
    const csv = [
      keys.join(","),
      ...orders.map((o) => keys.map((k) => `"${(o as any)[k] ?? ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workorders_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -----------------------------------
     UI Rendering
  ----------------------------------- */
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Work Orders </h2>
          <p className="text-muted-foreground">
            Create, edit, and track work orders with inventory integration.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Order</Button>
          <Button variant="outline" onClick={exportOrdersCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Inventory Snapshot */}
      <Card>
        <CardHeader><CardTitle>Inventory Snapshot</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-48 overflow-y-auto">{renderInventory()}</div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader><CardTitle>Work Orders ({orders.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Work Center</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Planned Hrs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell>{wo.orderNo}</TableCell>
                  <TableCell>{wo.productName}</TableCell>
                  <TableCell>{wo.quantity}</TableCell>
                  <TableCell>{wo.workCenterId || "—"}</TableCell>
                  <TableCell><Badge>{wo.status}</Badge></TableCell>
                  <TableCell>{wo.plannedHours ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(wo)}>✏️</Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(wo.id)}><Trash2 /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Work Order" : "New Work Order"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Product ID</Label>
              <Input value={form.productId || ""} onChange={(e) => setForm({ ...form, productId: e.target.value })} />
            </div>
            <div>
              <Label>Product Name</Label>
              <Input value={form.productName || ""} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Work Center</Label>
              <Input value={form.workCenterId || ""} onChange={(e) => setForm({ ...form, workCenterId: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Input value={form.status || "planned"} onChange={(e) => setForm({ ...form, status: e.target.value as any })} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate || todayISO()} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
