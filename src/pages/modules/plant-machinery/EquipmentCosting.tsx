"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  BarChart3,
  DownloadCloud,
  UploadCloud,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

/* -------------------------------
   Types
------------------------------- */
type DepreciationMethod = "Straight Line" | "WDV";

interface EquipmentCost {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  purchaseCost: number;
  operationCost: number;
  maintenanceCost: number;
  downtimeCost: number;
  insuranceCost: number;
  depreciationMethod: DepreciationMethod;
  usefulLifeYears: number;
  accumulatedDepreciation: number;
  acquisitionDate: string;
  lastUpdated: string;
  allocatedTo?: string;
}

/* -------------------------------
   Constants
------------------------------- */
const LS_KEY =
  (STORAGE_KEYS && STORAGE_KEYS.EQUIPMENT_COSTING_V1) || "equipment_costing_v1";

/* -------------------------------
   Component
------------------------------- */
export default function EquipmentCostingPage() {
  const [records, setRecords] = useState<EquipmentCost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentCost | null>(null);
  const [form, setForm] = useState<Partial<EquipmentCost>>({
    depreciationMethod: "Straight Line",
    usefulLifeYears: 10,
    purchaseCost: 0,
    operationCost: 0,
    maintenanceCost: 0,
    downtimeCost: 0,
    insuranceCost: 0,
  });

  /* -------------------------------
     Load / Save
  ------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = storage.get<EquipmentCost[]>(LS_KEY, []);
    if (saved && saved.length > 0) setRecords(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storage.set(LS_KEY, records);
  }, [records, loaded]);

  // Sync between tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        const remote = storage.get<EquipmentCost[]>(LS_KEY, []);
        setRecords(remote);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /* -------------------------------
     CRUD
  ------------------------------- */
  function openAdd() {
    setEditing(null);
    setForm({
      depreciationMethod: "Straight Line",
      usefulLifeYears: 10,
      purchaseCost: 0,
      operationCost: 0,
      maintenanceCost: 0,
      downtimeCost: 0,
      insuranceCost: 0,
    });
    setIsDialogOpen(true);
  }

  function openEdit(rec: EquipmentCost) {
    setEditing(rec);
    setForm({ ...rec });
    setIsDialogOpen(true);
  }

  function deleteRecord(id: string) {
    if (!confirm("Delete this record?")) return;
    setRecords((r) => r.filter((x) => x.id !== id));
    toast.error("Deleted");
  }

  function saveRecord() {
    if (!form.equipmentCode || !form.equipmentName) {
      toast.error("Equipment Code and Name required");
      return;
    }

    const totalCost =
      (form.purchaseCost || 0) +
      (form.operationCost || 0) +
      (form.maintenanceCost || 0) +
      (form.downtimeCost || 0) +
      (form.insuranceCost || 0);

    const years =
      form.usefulLifeYears && form.usefulLifeYears > 0
        ? form.usefulLifeYears
        : 10;
    const purchaseDate = form.acquisitionDate || new Date().toISOString();
    const yearsPassed =
      (new Date().getFullYear() - new Date(purchaseDate).getFullYear()) || 1;

    let accumulatedDepreciation = 0;
    if (form.depreciationMethod === "Straight Line") {
      accumulatedDepreciation = Math.min(
        totalCost * (yearsPassed / years),
        totalCost
      );
    } else {
      // WDV 20%
      let value = totalCost;
      for (let i = 0; i < yearsPassed; i++) {
        value *= 0.8;
      }
      accumulatedDepreciation = totalCost - value;
    }

    const newRec: EquipmentCost = {
      id: editing ? editing.id : uuidv4(),
      equipmentCode: form.equipmentCode!,
      equipmentName: form.equipmentName!,
      purchaseCost: form.purchaseCost || 0,
      operationCost: form.operationCost || 0,
      maintenanceCost: form.maintenanceCost || 0,
      downtimeCost: form.downtimeCost || 0,
      insuranceCost: form.insuranceCost || 0,
      depreciationMethod: form.depreciationMethod || "Straight Line",
      usefulLifeYears: years,
      accumulatedDepreciation,
      acquisitionDate: purchaseDate,
      lastUpdated: new Date().toISOString(),
      allocatedTo: form.allocatedTo,
    };

    if (editing) {
      setRecords((prev) =>
        prev.map((r) => (r.id === editing.id ? newRec : r))
      );
      toast.success("Record updated");
    } else {
      setRecords((p) => [newRec, ...p]);
      toast.success("Record added");
    }

    setIsDialogOpen(false);
  }

  /* -------------------------------
     Derived metrics
  ------------------------------- */
  const filtered = useMemo(() => {
    if (!query.trim()) return records;
    const q = query.toLowerCase();
    return records.filter((r) =>
      [r.equipmentCode, r.equipmentName, r.allocatedTo]
        .filter(Boolean)
        .some((x) => x!.toLowerCase().includes(q))
    );
  }, [query, records]);

  const summary = useMemo(() => {
    const totalCost = filtered.reduce(
      (s, r) =>
        s +
        r.purchaseCost +
        r.operationCost +
        r.maintenanceCost +
        r.downtimeCost +
        r.insuranceCost,
      0
    );
    const depreciation = filtered.reduce(
      (s, r) => s + r.accumulatedDepreciation,
      0
    );
    const netValue = totalCost - depreciation;
    return { totalCost, depreciation, netValue };
  }, [filtered]);

  const costBreakdownChart = useMemo(() => {
    const totalPurchase = filtered.reduce((s, r) => s + r.purchaseCost, 0);
    const totalOp = filtered.reduce((s, r) => s + r.operationCost, 0);
    const totalMaint = filtered.reduce((s, r) => s + r.maintenanceCost, 0);
    const totalDown = filtered.reduce((s, r) => s + r.downtimeCost, 0);
    const totalIns = filtered.reduce((s, r) => s + r.insuranceCost, 0);
    return [
      { name: "Purchase", value: totalPurchase },
      { name: "Operation", value: totalOp },
      { name: "Maintenance", value: totalMaint },
      { name: "Downtime", value: totalDown },
      { name: "Insurance", value: totalIns },
    ];
  }, [filtered]);

  const COLORS = ["#3b82f6", "#f97316", "#10b981", "#ef4444", "#6366f1"];

  function calculateROA(r: EquipmentCost) {
    const totalCost =
      r.purchaseCost +
      r.operationCost +
      r.maintenanceCost +
      r.downtimeCost +
      r.insuranceCost;
    const netValue = totalCost - r.accumulatedDepreciation;
    if (totalCost === 0) return 0;
    const roa = ((netValue / totalCost) * 100).toFixed(2);
    return roa;
  }

  /* -------------------------------
     Export / Import
  ------------------------------- */
  function exportJSON() {
    const payload = JSON.stringify(records, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "equipment_costing_backup.json";
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
        const normalized = data.map((d: any) => ({
          id: d.id || uuidv4(),
          ...d,
        }));
        setRecords(normalized);
        toast.success("Imported successfully");
      } catch (err) {
        toast.error("Invalid file");
      }
    };
    reader.readAsText(file);
  }

  /* -------------------------------
     Render
  ------------------------------- */
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6" /> Equipment Costing & Depreciation
        </h1>
        <div className="flex gap-2">
          <input
            id="import-json"
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importJSON(e.target.files?.[0] || null)}
          />
          <Button
            variant="outline"
            onClick={() =>
              document.getElementById("import-json")?.click()
            }
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" onClick={exportJSON}>
            <DownloadCloud className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Record
          </Button>
        </div>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-sm text-gray-500">Total Cost</div>
            <div className="text-xl font-bold">
              ₹{summary.totalCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-sm text-gray-500">Depreciation</div>
            <div className="text-xl font-bold">
              ₹{summary.depreciation.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-sm text-gray-500">Net Book Value</div>
            <div className="text-xl font-bold">
              ₹{summary.netValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* charts */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {costBreakdownChart.every((c) => c.value === 0) ? (
            <div className="text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie
                  data={costBreakdownChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {costBreakdownChart.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* search */}
      <div className="flex items-center gap-2 max-w-md">
        <Input
          placeholder="Search by code, name, department..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Cost Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Depreciation</TableHead>
                  <TableHead>Net Value</TableHead>
                  <TableHead>ROA %</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const total =
                    r.purchaseCost +
                    r.operationCost +
                    r.maintenanceCost +
                    r.downtimeCost +
                    r.insuranceCost;
                  const netValue = total - r.accumulatedDepreciation;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.equipmentCode}</TableCell>
                      <TableCell>{r.equipmentName}</TableCell>
                      <TableCell>₹{total.toFixed(2)}</TableCell>
                      <TableCell>₹{r.accumulatedDepreciation.toFixed(2)}</TableCell>
                      <TableCell>₹{netValue.toFixed(2)}</TableCell>
                      <TableCell>{calculateROA(r)}%</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(r)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRecord(r.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Equipment Cost" : "Add Equipment Cost"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Equipment Code</Label>
              <Input
                value={form.equipmentCode || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, equipmentCode: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Equipment Name</Label>
              <Input
                value={form.equipmentName || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, equipmentName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Purchase Cost</Label>
              <Input
                type="number"
                value={form.purchaseCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    purchaseCost: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Operation Cost</Label>
              <Input
                type="number"
                value={form.operationCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    operationCost: Number(e.target.value),
                  }))
                }
              />
              </div>
                          <div>
              <Label>Maintenance Cost</Label>
              <Input
                type="number"
                value={form.maintenanceCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maintenanceCost: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Downtime Cost</Label>
              <Input
                type="number"
                value={form.downtimeCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    downtimeCost: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Insurance Cost</Label>
              <Input
                type="number"
                value={form.insuranceCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    insuranceCost: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label>Depreciation Method</Label>
              <select
                value={form.depreciationMethod}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    depreciationMethod: e.target
                      .value as DepreciationMethod,
                  }))
                }
                className="border rounded px-2 py-2 w-full"
              >
                <option>Straight Line</option>
                <option>WDV</option>
              </select>
            </div>

            <div>
              <Label>Useful Life (Years)</Label>
              <Input
                type="number"
                value={form.usefulLifeYears || 10}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usefulLifeYears: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label>Acquisition Date</Label>
              <Input
                type="date"
                value={form.acquisitionDate || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    acquisitionDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label>Allocated To (Dept / Project)</Label>
              <Input
                value={form.allocatedTo || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    allocatedTo: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRecord}>
              <DollarSign className="mr-2 h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

