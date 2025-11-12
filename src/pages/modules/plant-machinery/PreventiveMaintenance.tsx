"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  CalendarDays,
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Save,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const LS_KEY = STORAGE_KEYS.PREVENTIVE_MAINTENANCE_V1;

interface MaintenancePlan {
  id: string;
  equipmentCode: string;
  planType: "Time-based" | "Usage-based" | "Condition-based";
  intervalValue: number;
  intervalUnit: string;
  lastServiceDate: string;
  nextServiceDate: string;
  assignedTechnician: string;
  estimatedHours: number;
  estimatedCost: number;
  status: "Scheduled" | "Completed" | "Overdue";
  remarks?: string;
  createdAt: string;
}

export default function PreventiveMaintenanceDashboard() {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenancePlan | null>(null);
  const [form, setForm] = useState<Partial<MaintenancePlan>>({
    planType: "Time-based",
    intervalUnit: "Days",
    status: "Scheduled",
  });
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  // ✅ Load saved data once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = storage.get<MaintenancePlan[]>(LS_KEY, []);
    if (Array.isArray(saved) && saved.length > 0) {
      console.log("📦 Loaded plans from storage", saved);
      setPlans(saved);
    }
    setLoaded(true);
  }, []);

  // ✅ Save data only after first load and when plans change
  useEffect(() => {
    if (!loaded) return;
    if (!Array.isArray(plans)) return;

    console.log("💾 Saving plans to localStorage", plans);
    storage.set(LS_KEY, plans);
  }, [plans, loaded]);

  const calculateNextDate = (plan: Partial<MaintenancePlan>) => {
    if (!plan.lastServiceDate || !plan.intervalValue) return "";
    const date = new Date(plan.lastServiceDate);
    const val = plan.intervalValue;
    const unit = plan.intervalUnit?.toLowerCase();
    switch (unit) {
      case "days":
        date.setDate(date.getDate() + val);
        break;
      case "months":
        date.setMonth(date.getMonth() + val);
        break;
      case "hours":
        date.setDate(date.getDate() + Math.floor(val / 24));
        break;
    }
    return date.toISOString().split("T")[0];
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ planType: "Time-based", intervalUnit: "Days", status: "Scheduled" });
    setIsDialogOpen(true);
  };

  const openEdit = (plan: MaintenancePlan) => {
    setEditing(plan);
    setForm(plan);
    setIsDialogOpen(true);
  };

  const saveForm = () => {
    if (!form.equipmentCode || !form.lastServiceDate || !form.intervalValue) {
      toast.error("Equipment, interval, and last service date are required.");
      return;
    }

    const nextDate = calculateNextDate(form);
    if (editing) {
      const updated = plans.map((p) =>
        p.id === editing.id
          ? { ...p, ...form, nextServiceDate: nextDate } as MaintenancePlan
          : p
      );
      setPlans(updated);
      toast.success("Plan updated successfully");
    } else {
      const newPlan: MaintenancePlan = {
        id: uuidv4(),
        equipmentCode: form.equipmentCode!,
        planType: form.planType!,
        intervalValue: Number(form.intervalValue),
        intervalUnit: form.intervalUnit!,
        lastServiceDate: form.lastServiceDate!,
        nextServiceDate: nextDate,
        assignedTechnician: form.assignedTechnician || "",
        estimatedHours: Number(form.estimatedHours) || 0,
        estimatedCost: Number(form.estimatedCost) || 0,
        status: "Scheduled",
        createdAt: new Date().toISOString(),
      };
      setPlans((prev) => [newPlan, ...prev]);
      toast.success("Plan added successfully");
    }
    setIsDialogOpen(false);
  };

  const deletePlan = (id: string) => {
    if (confirm("Delete this maintenance plan?")) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast.error("Plan deleted");
    }
  };

  // ✅ Filtering and derived data
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return plans.filter((p) =>
      [p.equipmentCode, p.assignedTechnician].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [plans, query]);

  const today = new Date();
  const overdueCount = plans.filter((p) => p.status === "Overdue").length;
  const upcomingCount = plans.filter(
    (p) => new Date(p.nextServiceDate) >= today && p.status === "Scheduled"
  ).length;
  const completedCount = plans.filter((p) => p.status === "Completed").length;
  const totalCost = plans.reduce((sum, p) => sum + (p.estimatedCost || 0), 0);

  // ✅ Auto mark overdue
  useEffect(() => {
    if (!loaded) return;
    const updated = plans.map((p) => {
      if (p.status === "Completed") return p;
      const next = new Date(p.nextServiceDate);
      return next < today ? { ...p, status: "Overdue" } : p;
    });
    setPlans(updated);
  }, [loaded]);

  // Technician workload
  const technicianData = useMemo(() => {
    const map: Record<string, number> = {};
    plans.forEach((p) => {
      if (p.assignedTechnician)
        map[p.assignedTechnician] = (map[p.assignedTechnician] || 0) + 1;
    });
    return Object.entries(map).map(([tech, count]) => ({
      technician: tech,
      tasks: count,
    }));
  }, [plans]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="h-6 w-6" /> Preventive Maintenance Dashboard
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "table" ? "calendar" : "table")}>
            <CalendarDays className="mr-2 h-4 w-4" /> {viewMode === "table" ? "Calendar View" : "Table View"}
          </Button>
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Plan
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="py-4 text-center"><h2 className="text-xl font-bold">{overdueCount}</h2><p className="text-sm text-red-600">Overdue</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h2 className="text-xl font-bold">{upcomingCount}</h2><p className="text-sm text-blue-600">Upcoming</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h2 className="text-xl font-bold">{completedCount}</h2><p className="text-sm text-green-600">Completed</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h2 className="text-xl font-bold">₹{totalCost.toFixed(0)}</h2><p className="text-sm text-gray-500">Est. Total Cost</p></CardContent></Card>
      </div>

      {/* Technician Workload Chart */}
      <Card>
        <CardHeader><CardTitle><Users className="h-5 w-5 inline-block mr-2" /> Technician Workload</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={technicianData}>
              <XAxis dataKey="technician" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tasks" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table View */}
      <Card>
        <CardHeader><CardTitle>Maintenance Plans</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-2 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search equipment, technician..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.equipmentCode}</TableCell>
                    <TableCell>{p.planType}</TableCell>
                    <TableCell>{p.nextServiceDate}</TableCell>
                    <TableCell>{p.assignedTechnician}</TableCell>
                    <TableCell>
                      {p.status === "Overdue" ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Overdue
                        </span>
                      ) : p.status === "Completed" ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Done
                        </span>
                      ) : (
                        <span className="text-blue-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Scheduled
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deletePlan(p.id)}>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Plan" : "Add Plan"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Equipment</Label><Input value={form.equipmentCode || ""} onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })} /></div>
            <div><Label>Plan Type</Label>
              <select className="border rounded px-2 py-2 w-full" value={form.planType} onChange={(e) => setForm({ ...form, planType: e.target.value as any })}>
                <option>Time-based</option><option>Usage-based</option><option>Condition-based</option>
              </select></div>
            <div><Label>Interval Value</Label><Input type="number" value={form.intervalValue || ""} onChange={(e) => setForm({ ...form, intervalValue: Number(e.target.value) })} /></div>
            <div><Label>Interval Unit</Label><Input value={form.intervalUnit || "Days"} onChange={(e) => setForm({ ...form, intervalUnit: e.target.value })} /></div>
            <div><Label>Last Service Date</Label><Input type="date" value={form.lastServiceDate || ""} onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })} /></div>
            <div><Label>Technician</Label><Input value={form.assignedTechnician || ""} onChange={(e) => setForm({ ...form, assignedTechnician: e.target.value })} /></div>
            <div><Label>Est. Hours</Label><Input type="number" value={form.estimatedHours || ""} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} /></div>
            <div><Label>Est. Cost</Label><Input type="number" value={form.estimatedCost || ""} onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveForm}><Save className="mr-2 h-4 w-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// import React, { useState, useEffect } from 'react';
// import { Plus, Search, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
// import { Button } from '../../../components/ui/button';
// import { Input } from '../../../components/ui/input';
// import { Card, CardContent, CardHeader } from '../../../components/ui/card';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
// import { Label } from '../../../components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
// import { Textarea } from '../../../components/ui/textarea';
// import { Badge } from '../../../components/ui/badge';
// import { useToast } from '../../../hooks/use-toast';
// import { getFromStorage, saveToStorage, PM_STORAGE_KEYS, generateId } from '../../../utils/plantMachineryStorage';
// import type { PreventiveMaintenance, Equipment } from '../../../types/plantMachinery';

// const PreventiveMaintenancePage: React.FC = () => {
//   const [maintenanceRecords, setMaintenanceRecords] = useState<PreventiveMaintenance[]>([]);
//   const [equipment, setEquipment] = useState<Equipment[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState<string>('all');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState<PreventiveMaintenance | null>(null);
//   const { toast } = useToast();

//   const [formData, setFormData] = useState<Partial<PreventiveMaintenance>>({
//     equipmentId: '',
//     equipmentName: '',
//     maintenanceType: 'time-based',
//     frequency: '',
//     intervalHours: 0,
//     intervalDays: 0,
//     lastMaintenanceDate: '',
//     nextMaintenanceDate: '',
//     assignedTechnician: '',
//     estimatedDuration: 0,
//     checklist: [],
//     spareParts: [],
//     totalCost: 0,
//     status: 'scheduled',
//     completionDate: '',
//     remarks: '',
//   });

//   useEffect(() => {
//     loadMaintenanceRecords();
//     loadEquipment();
//   }, []);

//   const loadMaintenanceRecords = () => {
//     const data = getFromStorage<PreventiveMaintenance>(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE);
//     setMaintenanceRecords(data);
//   };

//   const loadEquipment = () => {
//     const data = getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT);
//     setEquipment(data);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId);
    
//     const maintenanceData: PreventiveMaintenance = {
//       ...formData,
//       id: editingRecord?.id || generateId(),
//       equipmentId: formData.equipmentId!,
//       equipmentName: selectedEquipment?.name || formData.equipmentName!,
//       maintenanceType: formData.maintenanceType!,
//       frequency: formData.frequency!,
//       intervalHours: formData.intervalHours || 0,
//       intervalDays: formData.intervalDays || 0,
//       lastMaintenanceDate: formData.lastMaintenanceDate!,
//       nextMaintenanceDate: formData.nextMaintenanceDate!,
//       assignedTechnician: formData.assignedTechnician!,
//       estimatedDuration: formData.estimatedDuration!,
//       checklist: formData.checklist || [],
//       spareParts: formData.spareParts || [],
//       totalCost: formData.totalCost!,
//       status: formData.status!,
//       remarks: formData.remarks!,
//       createdAt: editingRecord?.createdAt || new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     } as PreventiveMaintenance;

//     if (editingRecord) {
//       const updated = maintenanceRecords.map(m => m.id === editingRecord.id ? maintenanceData : m);
//       setMaintenanceRecords(updated);
//       saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
//       toast({ title: 'Maintenance record updated successfully' });
//     } else {
//       const updated = [...maintenanceRecords, maintenanceData];
//       setMaintenanceRecords(updated);
//       saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
//       toast({ title: 'Maintenance scheduled successfully' });
//     }

//     setIsDialogOpen(false);
//     resetForm();
//   };

//   const handleEdit = (record: PreventiveMaintenance) => {
//     setEditingRecord(record);
//     setFormData(record);
//     setIsDialogOpen(true);
//   };

//   const handleDelete = (id: string) => {
//     if (confirm('Are you sure you want to delete this maintenance record?')) {
//       const updated = maintenanceRecords.filter(m => m.id !== id);
//       setMaintenanceRecords(updated);
//       saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
//       toast({ title: 'Maintenance record deleted successfully' });
//     }
//   };

//   const handleComplete = (id: string) => {
//     const updated = maintenanceRecords.map(m =>
//       m.id === id ? { ...m, status: 'completed' as const, completionDate: new Date().toISOString() } : m
//     );
//     setMaintenanceRecords(updated);
//     saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
//     toast({ title: 'Maintenance marked as completed' });
//   };

//   const resetForm = () => {
//     setEditingRecord(null);
//     setFormData({
//       equipmentId: '',
//       equipmentName: '',
//       maintenanceType: 'time-based',
//       frequency: '',
//       intervalHours: 0,
//       intervalDays: 0,
//       lastMaintenanceDate: '',
//       nextMaintenanceDate: '',
//       assignedTechnician: '',
//       estimatedDuration: 0,
//       checklist: [],
//       spareParts: [],
//       totalCost: 0,
//       status: 'scheduled',
//       completionDate: '',
//       remarks: '',
//     });
//   };

//   const filteredRecords = maintenanceRecords.filter(record => {
//     const matchesSearch =
//       record.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       record.assignedTechnician.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
//     return matchesSearch && matchesStatus;
//   });

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">Preventive Maintenance</h1>
//           <p className="text-muted-foreground">Schedule and track preventive maintenance activities</p>
//         </div>
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button onClick={resetForm}>
//               <Plus className="mr-2 h-4 w-4" />
//               Schedule Maintenance
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>{editingRecord ? 'Edit Maintenance' : 'Schedule Maintenance'}</DialogTitle>
//             </DialogHeader>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="col-span-2">
//                   <Label>Equipment *</Label>
//                   <Select value={formData.equipmentId} onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select equipment" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {equipment.map(eq => (
//                         <SelectItem key={eq.id} value={eq.id}>
//                           {eq.equipmentCode} - {eq.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Maintenance Type *</Label>
//                   <Select value={formData.maintenanceType} onValueChange={(value: any) => setFormData({ ...formData, maintenanceType: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="time-based">Time-based</SelectItem>
//                       <SelectItem value="usage-based">Usage-based</SelectItem>
//                       <SelectItem value="condition-based">Condition-based</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Frequency *</Label>
//                   <Input
//                     value={formData.frequency}
//                     onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
//                     placeholder="e.g., Monthly, 500 hours"
//                     required
//                   />
//                 </div>
//                 {formData.maintenanceType === 'usage-based' && (
//                   <div>
//                     <Label>Interval Hours</Label>
//                     <Input
//                       type="number"
//                       value={formData.intervalHours}
//                       onChange={(e) => setFormData({ ...formData, intervalHours: parseInt(e.target.value) })}
//                     />
//                   </div>
//                 )}
//                 {formData.maintenanceType === 'time-based' && (
//                   <div>
//                     <Label>Interval Days</Label>
//                     <Input
//                       type="number"
//                       value={formData.intervalDays}
//                       onChange={(e) => setFormData({ ...formData, intervalDays: parseInt(e.target.value) })}
//                     />
//                   </div>
//                 )}
//                 <div>
//                   <Label>Last Maintenance Date *</Label>
//                   <Input
//                     type="date"
//                     value={formData.lastMaintenanceDate}
//                     onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Next Maintenance Date *</Label>
//                   <Input
//                     type="date"
//                     value={formData.nextMaintenanceDate}
//                     onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Assigned Technician *</Label>
//                   <Input
//                     value={formData.assignedTechnician}
//                     onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Estimated Duration (hours) *</Label>
//                   <Input
//                     type="number"
//                     value={formData.estimatedDuration}
//                     onChange={(e) => setFormData({ ...formData, estimatedDuration: parseFloat(e.target.value) })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Total Cost</Label>
//                   <Input
//                     type="number"
//                     value={formData.totalCost}
//                     onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Status</Label>
//                   <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="scheduled">Scheduled</SelectItem>
//                       <SelectItem value="in-progress">In Progress</SelectItem>
//                       <SelectItem value="completed">Completed</SelectItem>
//                       <SelectItem value="overdue">Overdue</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 {formData.status === 'completed' && (
//                   <div>
//                     <Label>Completion Date</Label>
//                     <Input
//                       type="date"
//                       value={formData.completionDate}
//                       onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
//                     />
//                   </div>
//                 )}
//                 <div className="col-span-2">
//                   <Label>Remarks</Label>
//                   <Textarea
//                     value={formData.remarks}
//                     onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
//                     rows={3}
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end gap-2">
//                 <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
//                   Cancel
//                 </Button>
//                 <Button type="submit">
//                   {editingRecord ? 'Update' : 'Schedule'}
//                 </Button>
//               </div>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="flex gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search maintenance records..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <Select value={filterStatus} onValueChange={setFilterStatus}>
//               <SelectTrigger className="w-48">
//                 <SelectValue placeholder="Filter by status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Status</SelectItem>
//                 <SelectItem value="scheduled">Scheduled</SelectItem>
//                 <SelectItem value="in-progress">In Progress</SelectItem>
//                 <SelectItem value="completed">Completed</SelectItem>
//                 <SelectItem value="overdue">Overdue</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b">
//                   <th className="text-left p-3">Equipment</th>
//                   <th className="text-left p-3">Type</th>
//                   <th className="text-left p-3">Frequency</th>
//                   <th className="text-left p-3">Next Due</th>
//                   <th className="text-left p-3">Technician</th>
//                   <th className="text-left p-3">Duration</th>
//                   <th className="text-left p-3">Status</th>
//                   <th className="text-left p-3">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredRecords.map((record) => (
//                   <tr key={record.id} className="border-b hover:bg-muted/50">
//                     <td className="p-3 font-medium">{record.equipmentName}</td>
//                     <td className="p-3 capitalize">{record.maintenanceType.replace('-', ' ')}</td>
//                     <td className="p-3">{record.frequency}</td>
//                     <td className="p-3">{new Date(record.nextMaintenanceDate).toLocaleDateString()}</td>
//                     <td className="p-3">{record.assignedTechnician}</td>
//                     <td className="p-3">{record.estimatedDuration}h</td>
//                     <td className="p-3">
//                       <Badge
//                         variant={
//                           record.status === 'completed' ? 'default' :
//                           record.status === 'in-progress' ? 'secondary' :
//                           record.status === 'overdue' ? 'destructive' : 'outline'
//                         }
//                       >
//                         {record.status}
//                       </Badge>
//                     </td>
//                     <td className="p-3">
//                       <div className="flex gap-2">
//                         {record.status !== 'completed' && (
//                           <Button size="sm" variant="ghost" onClick={() => handleComplete(record.id)}>
//                             <CheckCircle className="h-4 w-4 text-success" />
//                           </Button>
//                         )}
//                         <Button size="sm" variant="ghost" onClick={() => handleEdit(record)}>
//                           <Edit className="h-4 w-4" />
//                         </Button>
//                         <Button size="sm" variant="ghost" onClick={() => handleDelete(record.id)}>
//                           <Trash2 className="h-4 w-4 text-destructive" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {filteredRecords.length === 0 && (
//                   <tr>
//                     <td colSpan={8} className="p-8 text-center text-muted-foreground">
//                       No maintenance records found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default PreventiveMaintenancePage;
