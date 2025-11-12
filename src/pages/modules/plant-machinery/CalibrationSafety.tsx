"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Shield,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  UploadCloud,
  DownloadCloud,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

/* ----------------------------------
   Type Definitions
---------------------------------- */
type RecordType = "Calibration" | "Safety Inspection" | "Training" | "License";
type Status = "Pending" | "Completed" | "Expired";

interface ComplianceRecord {
  id: string;
  recordType: RecordType;
  equipmentCode?: string;
  description: string;
  responsiblePerson?: string;
  datePerformed: string;
  nextDueDate: string;
  status: Status;
  certificateNumber?: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

/* ----------------------------------
   Constants
---------------------------------- */
const LS_KEY =
  (STORAGE_KEYS && STORAGE_KEYS.SAFETY_COMPLIANCE_V1) || "safety_compliance_v1";

/* ----------------------------------
   Component
---------------------------------- */
export default function CalibrationSafetyPage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ComplianceRecord | null>(null);
  const [form, setForm] = useState<Partial<ComplianceRecord>>({
    recordType: "Calibration",
    status: "Pending",
    datePerformed: "",
    nextDueDate: "",
  });

  /* ----------------------------------
     ✅ Fixed Load / Save Logic
  ---------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load data on mount
    const saved = storage.get<ComplianceRecord[]>(LS_KEY, []);
    if (saved && Array.isArray(saved)) {
      setRecords(saved);
    }
  }, []);

  // Save only when records change (and not empty on mount)
  useEffect(() => {
    if (records.length > 0) {
      storage.set(LS_KEY, records);
    }
  }, [records]);

  /* ----------------------------------
     CRUD Operations
  ---------------------------------- */
  function openAdd() {
    setEditing(null);
    setForm({
      recordType: "Calibration",
      status: "Pending",
      datePerformed: "",
      nextDueDate: "",
    });
    setDialogOpen(true);
  }

  function openEdit(rec: ComplianceRecord) {
    setEditing(rec);
    setForm({ ...rec });
    setDialogOpen(true);
  }

  function deleteRecord(id: string) {
    if (!confirm("Delete this record?")) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.error("Record deleted");
  }

  function saveRecord() {
    if (!form.description || !form.nextDueDate) {
      toast.error("Description and Next Due Date are required");
      return;
    }

    const newRec: ComplianceRecord = {
      id: editing ? editing.id : uuidv4(),
      recordType: form.recordType as RecordType,
      equipmentCode: form.equipmentCode,
      description: form.description!,
      responsiblePerson: form.responsiblePerson,
      datePerformed: form.datePerformed || new Date().toISOString().split("T")[0],
      nextDueDate: form.nextDueDate!,
      certificateNumber: form.certificateNumber,
      remarks: form.remarks,
      status: form.status || "Pending",
      createdAt: editing ? form.createdAt! : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editing) {
      setRecords((prev) => prev.map((r) => (r.id === editing.id ? newRec : r)));
      toast.success("Record updated");
    } else {
      setRecords((prev) => [newRec, ...prev]);
      toast.success("Record added");
    }
    setDialogOpen(false);
  }

  /* ----------------------------------
     Derived Data & Filters
  ---------------------------------- */
  const today = new Date();
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return records.filter(
      (r) =>
        r.description.toLowerCase().includes(q) ||
        r.recordType.toLowerCase().includes(q) ||
        r.equipmentCode?.toLowerCase().includes(q) ||
        r.responsiblePerson?.toLowerCase().includes(q)
    );
  }, [query, records]);

  // Auto-update expired status
  // ✅ Auto-update expired status only when records are loaded
  useEffect(() => {
    if (records.length === 0) return; // Don't run on empty
    const today = new Date();
    const updated = records.map((r) => {
      const due = new Date(r.nextDueDate);
      if (r.status === "Completed") return r;
      return due < today ? { ...r, status: "Expired" } : r;
    });
    setRecords(updated);
  }, [records.length]);


  const upcomingCount = filtered.filter(
    (r) => new Date(r.nextDueDate) > today && r.status !== "Completed"
  ).length;
  const expiredCount = filtered.filter((r) => r.status === "Expired").length;
  const completedCount = filtered.filter((r) => r.status === "Completed").length;

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((r) => {
      map[r.recordType] = (map[r.recordType] || 0) + 1;
    });
    return Object.entries(map).map(([type, count]) => ({ type, count }));
  }, [filtered]);

  /* ----------------------------------
     Import / Export
  ---------------------------------- */
  function exportData() {
    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safety_compliance_backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  }

  function importData(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data)) throw new Error();
        setRecords(data);
        toast.success("Import successful");
      } catch {
        toast.error("Invalid file");
      }
    };
    reader.readAsText(file);
  }

  /* ----------------------------------
     Render
  ---------------------------------- */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-500" /> Calibration, Safety &
          Compliance
        </h1>
        <div className="flex gap-2">
          <input
            id="import-data"
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importData(e.target.files?.[0] || null)}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("import-data")?.click()}
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" onClick={exportData}>
            <DownloadCloud className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Record
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-sm text-muted-foreground">Upcoming</div>
            <div className="text-xl font-bold text-blue-600">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-sm text-muted-foreground">Expired</div>
            <div className="text-xl font-bold text-red-600">{expiredCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Search + Table */}
      <div className="flex items-center gap-2 max-w-md">
        <Input
          placeholder="Search equipment, type, or person..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Safety & Calibration Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.recordType}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell>{r.equipmentCode}</TableCell>
                    <TableCell>{r.nextDueDate}</TableCell>
                    <TableCell>
                      {r.status === "Completed" ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Done
                        </span>
                      ) : r.status === "Expired" ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Expired
                        </span>
                      ) : (
                        <span className="text-blue-600 flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" /> Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Record" : "Add Safety / Calibration Record"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select
                value={form.recordType}
                onChange={(e) =>
                  setForm({ ...form, recordType: e.target.value as RecordType })
                }
                className="border rounded px-2 py-2 w-full"
              >
                <option>Calibration</option>
                <option>Safety Inspection</option>
                <option>Training</option>
                <option>License</option>
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Equipment Code</Label>
              <Input
                value={form.equipmentCode || ""}
                onChange={(e) =>
                  setForm({ ...form, equipmentCode: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Responsible Person</Label>
              <Input
                value={form.responsiblePerson || ""}
                onChange={(e) =>
                  setForm({ ...form, responsiblePerson: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Date Performed</Label>
              <Input
                type="date"
                value={form.datePerformed || ""}
                onChange={(e) =>
                  setForm({ ...form, datePerformed: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Next Due Date</Label>
              <Input
                type="date"
                value={form.nextDueDate || ""}
                onChange={(e) =>
                  setForm({ ...form, nextDueDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Certificate No.</Label>
              <Input
                value={form.certificateNumber || ""}
                onChange={(e) =>
                  setForm({ ...form, certificateNumber: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Status })
                }
                className="border rounded px-2 py-2 w-full"
              >
                <option>Pending</option>
                <option>Completed</option>
                <option>Expired</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>Remarks</Label>
              <Input
                value={form.remarks || ""}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRecord}>
              <ClipboardList className="mr-2 h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
