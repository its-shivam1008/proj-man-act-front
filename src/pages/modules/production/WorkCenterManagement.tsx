import { usePermission } from "@/hooks/userPermission";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, Download, Upload, BarChart3, ShieldAlert } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

// --- Type ---
interface WorkCenter {
  id: string;
  code: string;
  name: string;
  description: string;
  capacity: number;
  costPerHour: number;
  efficiency: number;
  status: "active" | "maintenance" | "inactive";
  shift: "single" | "double" | "triple";
  operatorCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function WorkCentersPageAdvanced() {
  const canView = usePermission("workCenterMgt", "view");
  const canCreate = usePermission("workCenterMgt", "create");
  const canEdit = usePermission("workCenterMgt", "edit");
  const canDelete = usePermission("workCenterMgt", "delete");
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
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<WorkCenter | null>(null);

  const [formData, setFormData] = useState<Omit<WorkCenter, "id" | "createdAt" | "updatedAt">>({
    code: "",
    name: "",
    description: "",
    capacity: 8,
    costPerHour: 0,
    efficiency: 100,
    status: "active",
    shift: "single",
    operatorCount: 1,
  });

  // Load
  useEffect(() => {
    const saved = storage.get<WorkCenter[]>(STORAGE_KEYS.WORK_CENTERS, []);
    setWorkCenters(saved);
  }, []);

  // Save
  const persist = (data: WorkCenter[]) => {
    storage.set(STORAGE_KEYS.WORK_CENTERS, data);
    setWorkCenters(data);
  };

  // Analytics
  const totalCenters = workCenters.length;
  const avgEfficiency = useMemo(
    () =>
      totalCenters === 0
        ? 0
        : Math.round(
          workCenters.reduce((sum, w) => sum + (w.efficiency || 0), 0) / totalCenters
        ),
    [workCenters]
  );

  const activeCenters = workCenters.filter((w) => w.status === "active").length;

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error("Please fill all required fields");
      return;
    }

    const data: WorkCenter = {
      id: editingCenter?.id || `WC-${Date.now()}`,
      ...formData,
      createdAt: editingCenter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = editingCenter
      ? workCenters.map((w) => (w.id === editingCenter.id ? data : w))
      : [...workCenters, data];

    persist(updated);
    setIsDialogOpen(false);
    toast.success(editingCenter ? "Work center updated" : "Work center created");
    resetForm();
  };

  const handleEdit = (center: WorkCenter) => {
    setEditingCenter(center);
    setFormData(center);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = workCenters.filter((w) => w.id !== id);
    persist(updated);
    toast.success("Work center deleted");
  };

  const resetForm = () => {
    setEditingCenter(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      capacity: 8,
      costPerHour: 0,
      efficiency: 100,
      status: "active",
      shift: "single",
      operatorCount: 1,
    });
  };

  // Filtering & search
  const filtered = workCenters.filter(
    (w) =>
      (filterStatus === "all" || w.status === filterStatus) &&
      (w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Simulate performance trend data
  const trendData = useMemo(
    () =>
      workCenters.map((w) => ({
        name: w.name,
        efficiency: w.efficiency,
        cost: Math.round(w.costPerHour * w.capacity),
      })),
    [workCenters]
  );

  // Export / Import
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(workCenters, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "work_centers.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      persist(parsed);
      toast.success("Work centers imported successfully");
    } else toast.error("Invalid file format");
  };

  const totalCostPerDay = (center: WorkCenter) =>
    center.costPerHour * center.capacity * center.operatorCount;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Centers</h1>
          <p className="text-muted-foreground">
            Manage production machines, resources, and performance
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="text-white"
              disabled={!canCreate}
              onClick={() => canCreate && setIsDialogOpen(true)}
              className={!canCreate ? "opacity-50 cursor-not-allowed" : "text-white"}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Work Center
            </Button>

          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingCenter ? "Edit Work Center" : "Add Work Center"}
              </DialogTitle>
            </DialogHeader>
            <div
              className="space-y-4"
              style={{
                pointerEvents: editingCenter
                  ? (canEdit ? "auto" : "none")
                  : (canCreate ? "auto" : "none"),
                opacity: editingCenter
                  ? (canEdit ? 1 : 0.6)
                  : (canCreate ? 1 : 0.6),
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Capacity (hrs/day)</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Cost/hour</Label>
                  <Input
                    type="number"
                    value={formData.costPerHour}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPerHour: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Efficiency (%)</Label>
                  <Input
                    type="number"
                    value={formData.efficiency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        efficiency: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: any) =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shift</Label>
                  <Select
                    value={formData.shift}
                    onValueChange={(v: any) =>
                      setFormData({ ...formData, shift: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Operators</Label>
                <Input
                  type="number"
                  value={formData.operatorCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operatorCount: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <Button
                onClick={() =>
                  (editingCenter ? canEdit : canCreate) && handleSave()
                }
                disabled={editingCenter ? !canEdit : !canCreate}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              >
                {editingCenter ? "Update" : "Save"}
              </Button>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search work centers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          disabled={!canView}
          onClick={() => canView && handleExport()}
        >
          <Download className="mr-2 w-4 h-4" /> Export
        </Button>
        <label>
          <input
            type="file"
            hidden
            disabled={!canView}
            onChange={(e) => canView && e.target.files && handleImport(e.target.files[0])}
          />
          <Button disabled={!canView} variant="outline">
            <Upload className="mr-2 w-4 h-4" /> Import
          </Button>
        </label>
      </div>

      {/* Analytics */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Centers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{totalCenters}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Centers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl text-green-500">
            {activeCenters}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl text-indigo-500">
            {avgEfficiency}%
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Efficiency vs Cost Trend</CardTitle>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="efficiency" fill="#6366f1" />
              <Bar dataKey="cost" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards */}
      <AnimatePresence>
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No work centers found.
            </CardContent>
          </Card>
        ) : (
          filtered.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{c.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{c.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => canEdit && handleEdit(c)}
                        className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        disabled={!canDelete}
                        onClick={() => canDelete && handleDelete(c.id)}
                        className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
                      >

                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{c.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <p>Shift: <strong>{c.shift}</strong></p>
                    <p>Operators: <strong>{c.operatorCount}</strong></p>
                    <p>Efficiency: <strong>{c.efficiency}%</strong></p>
                    <p>Daily Cost: <strong>₹{totalCostPerDay(c).toLocaleString()}</strong></p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
