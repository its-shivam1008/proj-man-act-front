
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  Search,
  BarChart3,
  LineChart,
  Fuel,
  Clock,
  Wrench,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Line,
  Legend,
  LineChart as ReLineChart,
} from "recharts";
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { storage } from "@/lib/storage";

const LS_KEY = "equipment_allocation_v4";

interface EquipmentAllocation {
  id: string;
  equipmentCode: string;
  projectOrDept: string;
  operator: string;
  workingHours: number;
  idleHours: number;
  fuelConsumption: number;
  performanceRating: number;
  date: string;
  createdAt: string;
}

export default function EquipmentAllocationDashboard() {
  const [allocations, setAllocations] = useState<EquipmentAllocation[]>([]);
  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentAllocation | null>(null);
  const [form, setForm] = useState<Partial<EquipmentAllocation>>({
    date: new Date().toISOString().split("T")[0],
    workingHours: 0,
    idleHours: 0,
    fuelConsumption: 0,
    performanceRating: 3,
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = storage.get(LS_KEY);
    if (saved && Array.isArray(saved)) setAllocations(saved);
  }, []);

  // Save to localStorage
 useEffect(() => {
  if (typeof window === "undefined") return;
  const saved = storage.get(LS_KEY);
  if (saved && Array.isArray(saved)) {
    setAllocations(saved);
  }
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (allocations.length > 0) {
    storage.set(LS_KEY, allocations);
  }
}, [allocations]);


  // Filter results by search and date range
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allocations.filter((a) => {
      const matchQuery = [a.equipmentCode, a.projectOrDept, a.operator].some((f) =>
        f.toLowerCase().includes(q)
      );
      const dateOK =
        (!fromDate || new Date(a.date) >= new Date(fromDate)) &&
        (!toDate || new Date(a.date) <= new Date(toDate));
      return matchQuery && dateOK;
    });
  }, [allocations, query, fromDate, toDate]);

  // Add / Edit
  const openAdd = () => {
    setEditing(null);
    setForm({
      date: new Date().toISOString().split("T")[0],
      workingHours: 0,
      idleHours: 0,
      fuelConsumption: 0,
      performanceRating: 3,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (alloc: EquipmentAllocation) => {
    setEditing(alloc);
    setForm(alloc);
    setIsDialogOpen(true);
  };

  const saveForm = () => {
    if (!form.equipmentCode || !form.operator) {
      toast.error("Equipment code and operator are required.");
      return;
    }

    if (editing) {
      const updated = allocations.map((a) =>
        a.id === editing.id ? { ...a, ...form } : a
      );
      setAllocations(updated);
      toast.success("Updated successfully");
    } else {
      const newAlloc: EquipmentAllocation = {
        id: uuidv4(),
        equipmentCode: form.equipmentCode!,
        projectOrDept: form.projectOrDept || "General",
        operator: form.operator!,
        workingHours: Number(form.workingHours),
        idleHours: Number(form.idleHours),
        fuelConsumption: Number(form.fuelConsumption),
        performanceRating: Number(form.performanceRating),
        date: form.date || new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };
      setAllocations((prev) => [newAlloc, ...prev]);
      toast.success("New allocation added");
    }
    setIsDialogOpen(false);
  };

  const deleteAlloc = (id: string) => {
    if (confirm("Delete this record?")) {
      setAllocations((p) => p.filter((a) => a.id !== id));
      toast.error("Deleted");
    }
  };

  // ----- ANALYTICS -----
  const totalEquipment = new Set(filtered.map((a) => a.equipmentCode)).size;
  const totalWorkHours = filtered.reduce((sum, a) => sum + a.workingHours, 0);
  const totalIdleHours = filtered.reduce((sum, a) => sum + a.idleHours, 0);
  const totalFuel = filtered.reduce((sum, a) => sum + a.fuelConsumption, 0);
  const performanceAvg =
    filtered.length > 0
      ? (
          filtered.reduce((sum, a) => sum + a.performanceRating, 0) /
          filtered.length
        ).toFixed(2)
      : "0";
  const avgUtilization =
    totalWorkHours + totalIdleHours > 0
      ? ((totalWorkHours / (totalWorkHours + totalIdleHours)) * 100).toFixed(1)
      : "0";

  // Utilization chart
  const utilizationData = useMemo(() => {
    const groups: Record<string, { work: number; idle: number }> = {};
    filtered.forEach((a) => {
      if (!groups[a.equipmentCode]) groups[a.equipmentCode] = { work: 0, idle: 0 };
      groups[a.equipmentCode].work += a.workingHours;
      groups[a.equipmentCode].idle += a.idleHours;
    });
    return Object.entries(groups).map(([code, data]) => ({
      equipment: code,
      utilization:
        data.work + data.idle > 0
          ? ((data.work / (data.work + data.idle)) * 100).toFixed(1)
          : "0",
    }));
  }, [filtered]);

  // Fuel chart
  const fuelData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((a) => {
      map[a.equipmentCode] = (map[a.equipmentCode] || 0) + a.fuelConsumption;
    });
    return Object.entries(map).map(([code, value]) => ({
      equipment: code,
      fuel: value,
    }));
  }, [filtered]);

  // Trend chart (by date)
  const trendData = useMemo(() => {
    const map: Record<string, { work: number; fuel: number }> = {};
    filtered.forEach((a) => {
      if (!map[a.date]) map[a.date] = { work: 0, fuel: 0 };
      map[a.date].work += a.workingHours;
      map[a.date].fuel += a.fuelConsumption;
    });
    return Object.entries(map)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filtered]);

  // ----- RENDER -----
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> Equipment Allocation & Utilisation Dashboard
        </h1>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Record
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 items-end p-4">
          <div className="space-y-1">
            <Label>From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-1 flex-1">
            <Label>Search</Label>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment, operator, project..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Wrench className="h-8 w-8 text-blue-500 mb-2" />
            <h2 className="text-xl font-bold">{totalEquipment}</h2>
            <p className="text-sm text-muted-foreground">Total Equipment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Clock className="h-8 w-8 text-green-500 mb-2" />
            <h2 className="text-xl font-bold">{totalWorkHours + totalIdleHours}</h2>
            <p className="text-sm text-muted-foreground">Total Hours Logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <LineChart className="h-8 w-8 text-purple-500 mb-2" />
            <h2 className="text-xl font-bold">{avgUtilization}%</h2>
            <p className="text-sm text-muted-foreground">Avg. Utilization</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Fuel className="h-8 w-8 text-orange-500 mb-2" />
            <h2 className="text-xl font-bold">{totalFuel} L</h2>
            <p className="text-sm text-muted-foreground">Total Fuel Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Utilization % by Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="equipment" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="utilization" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Consumption (L) by Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fuelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="equipment" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="fuel" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trend: Working Hours & Fuel Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ReLineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="work" stroke="#3b82f6" name="Work Hours" />
              <Line type="monotone" dataKey="fuel" stroke="#f59e0b" name="Fuel (L)" />
            </ReLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Allocation Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Work (hrs)</TableHead>
                  <TableHead>Idle (hrs)</TableHead>
                  <TableHead>Fuel (L)</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.date}</TableCell>
                    <TableCell>{a.equipmentCode}</TableCell>
                    <TableCell>{a.projectOrDept}</TableCell>
                    <TableCell>{a.operator}</TableCell>
                    <TableCell>{a.workingHours}</TableCell>
                    <TableCell>{a.idleHours}</TableCell>
                    <TableCell>{a.fuelConsumption}</TableCell>
                    <TableCell>{a.performanceRating}/5</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteAlloc(a.id)}>
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Allocation" : "Add Allocation"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date || ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Equipment Code *</Label>
              <Input
                value={form.equipmentCode || ""}
                onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Project / Department</Label>
              <Input
                value={form.projectOrDept || ""}
                onChange={(e) => setForm({ ...form, projectOrDept: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Operator *</Label>
              <Input
                value={form.operator || ""}
                onChange={(e) => setForm({ ...form, operator: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Working Hours</Label>
              <Input
                type="number"
                value={form.workingHours || ""}
                onChange={(e) => setForm({ ...form, workingHours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Idle Hours</Label>
              <Input
                type="number"
                value={form.idleHours || ""}
                onChange={(e) => setForm({ ...form, idleHours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fuel Consumption (L)</Label>
              <Input
                type="number"
                value={form.fuelConsumption || ""}
                onChange={(e) => setForm({ ...form, fuelConsumption: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Performance Rating (1-5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.performanceRating || ""}
                onChange={(e) => setForm({ ...form, performanceRating: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveForm}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// import React, { useState, useEffect } from 'react';
// import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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
// import type { EquipmentAllocation, Equipment } from '../../../types/plantMachinery';

// const EquipmentAllocationPage: React.FC = () => {
//   const [allocations, setAllocations] = useState<EquipmentAllocation[]>([]);
//   const [equipment, setEquipment] = useState<Equipment[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingAllocation, setEditingAllocation] = useState<EquipmentAllocation | null>(null);
//   const { toast } = useToast();

//   const [formData, setFormData] = useState<Partial<EquipmentAllocation>>({
//     equipmentId: '',
//     equipmentName: '',
//     allocationType: 'project',
//     allocatedTo: '',
//     operator: '',
//     shift: 'day',
//     startDate: '',
//     endDate: '',
//     workingHours: 0,
//     idleHours: 0,
//     fuelConsumption: 0,
//     powerConsumption: 0,
//     meterReading: 0,
//     status: 'active',
//     remarks: '',
//   });

//   useEffect(() => {
//     loadAllocations();
//     loadEquipment();
//   }, []);

//   const loadAllocations = () => {
//     const data = getFromStorage<EquipmentAllocation>(PM_STORAGE_KEYS.ALLOCATIONS);
//     setAllocations(data);
//   };

//   const loadEquipment = () => {
//     const data = getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT);
//     setEquipment(data.filter(e => e.status === 'operational' || e.status === 'idle'));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId);
    
//     const allocationData: EquipmentAllocation = {
//       ...formData,
//       id: editingAllocation?.id || generateId(),
//       equipmentId: formData.equipmentId!,
//       equipmentName: selectedEquipment?.name || formData.equipmentName!,
//       allocationType: formData.allocationType!,
//       allocatedTo: formData.allocatedTo!,
//       operator: formData.operator!,
//       shift: formData.shift!,
//       startDate: formData.startDate!,
//       workingHours: formData.workingHours!,
//       idleHours: formData.idleHours!,
//       fuelConsumption: formData.fuelConsumption!,
//       powerConsumption: formData.powerConsumption!,
//       meterReading: formData.meterReading!,
//       status: formData.status!,
//       remarks: formData.remarks!,
//       createdAt: editingAllocation?.createdAt || new Date().toISOString(),
//     } as EquipmentAllocation;

//     if (editingAllocation) {
//       const updated = allocations.map(a => a.id === editingAllocation.id ? allocationData : a);
//       setAllocations(updated);
//       saveToStorage(PM_STORAGE_KEYS.ALLOCATIONS, updated);
//       toast({ title: 'Allocation updated successfully' });
//     } else {
//       const updated = [...allocations, allocationData];
//       setAllocations(updated);
//       saveToStorage(PM_STORAGE_KEYS.ALLOCATIONS, updated);
//       toast({ title: 'Equipment allocated successfully' });
//     }

//     setIsDialogOpen(false);
//     resetForm();
//   };

//   const handleEdit = (allocation: EquipmentAllocation) => {
//     setEditingAllocation(allocation);
//     setFormData(allocation);
//     setIsDialogOpen(true);
//   };

//   const handleDelete = (id: string) => {
//     if (confirm('Are you sure you want to delete this allocation?')) {
//       const updated = allocations.filter(a => a.id !== id);
//       setAllocations(updated);
//       saveToStorage(PM_STORAGE_KEYS.ALLOCATIONS, updated);
//       toast({ title: 'Allocation deleted successfully' });
//     }
//   };

//   const resetForm = () => {
//     setEditingAllocation(null);
//     setFormData({
//       equipmentId: '',
//       equipmentName: '',
//       allocationType: 'project',
//       allocatedTo: '',
//       operator: '',
//       shift: 'day',
//       startDate: '',
//       endDate: '',
//       workingHours: 0,
//       idleHours: 0,
//       fuelConsumption: 0,
//       powerConsumption: 0,
//       meterReading: 0,
//       status: 'active',
//       remarks: '',
//     });
//   };

//   const filteredAllocations = allocations.filter(allocation =>
//     allocation.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     allocation.allocatedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     allocation.operator.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">Equipment Allocation</h1>
//           <p className="text-muted-foreground">Track equipment usage and allocation</p>
//         </div>
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button onClick={resetForm}>
//               <Plus className="mr-2 h-4 w-4" />
//               Allocate Equipment
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>{editingAllocation ? 'Edit Allocation' : 'Allocate Equipment'}</DialogTitle>
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
//                           {eq.equipmentCode} - {eq.name} ({eq.location})
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Allocation Type *</Label>
//                   <Select value={formData.allocationType} onValueChange={(value: any) => setFormData({ ...formData, allocationType: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="project">Project</SelectItem>
//                       <SelectItem value="department">Department</SelectItem>
//                       <SelectItem value="production-line">Production Line</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Allocated To *</Label>
//                   <Input
//                     value={formData.allocatedTo}
//                     onChange={(e) => setFormData({ ...formData, allocatedTo: e.target.value })}
//                     placeholder="Project/Department name"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Operator *</Label>
//                   <Input
//                     value={formData.operator}
//                     onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Shift *</Label>
//                   <Select value={formData.shift} onValueChange={(value: any) => setFormData({ ...formData, shift: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="day">Day</SelectItem>
//                       <SelectItem value="night">Night</SelectItem>
//                       <SelectItem value="rotating">Rotating</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Start Date *</Label>
//                   <Input
//                     type="date"
//                     value={formData.startDate}
//                     onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>End Date</Label>
//                   <Input
//                     type="date"
//                     value={formData.endDate}
//                     onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Working Hours</Label>
//                   <Input
//                     type="number"
//                     value={formData.workingHours}
//                     onChange={(e) => setFormData({ ...formData, workingHours: parseFloat(e.target.value) })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Idle Hours</Label>
//                   <Input
//                     type="number"
//                     value={formData.idleHours}
//                     onChange={(e) => setFormData({ ...formData, idleHours: parseFloat(e.target.value) })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Fuel Consumption (L)</Label>
//                   <Input
//                     type="number"
//                     step="0.01"
//                     value={formData.fuelConsumption}
//                     onChange={(e) => setFormData({ ...formData, fuelConsumption: parseFloat(e.target.value) })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Power Consumption (kWh)</Label>
//                   <Input
//                     type="number"
//                     step="0.01"
//                     value={formData.powerConsumption}
//                     onChange={(e) => setFormData({ ...formData, powerConsumption: parseFloat(e.target.value) })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Meter Reading</Label>
//                   <Input
//                     type="number"
//                     value={formData.meterReading}
//                     onChange={(e) => setFormData({ ...formData, meterReading: parseFloat(e.target.value) })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Status</Label>
//                   <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="active">Active</SelectItem>
//                       <SelectItem value="completed">Completed</SelectItem>
//                       <SelectItem value="cancelled">Cancelled</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
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
//                   {editingAllocation ? 'Update' : 'Allocate'}
//                 </Button>
//               </div>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="relative">
//             <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="Search allocations..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b">
//                   <th className="text-left p-3">Equipment</th>
//                   <th className="text-left p-3">Type</th>
//                   <th className="text-left p-3">Allocated To</th>
//                   <th className="text-left p-3">Operator</th>
//                   <th className="text-left p-3">Shift</th>
//                   <th className="text-left p-3">Start Date</th>
//                   <th className="text-left p-3">Working Hours</th>
//                   <th className="text-left p-3">Status</th>
//                   <th className="text-left p-3">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredAllocations.map((allocation) => (
//                   <tr key={allocation.id} className="border-b hover:bg-muted/50">
//                     <td className="p-3 font-medium">{allocation.equipmentName}</td>
//                     <td className="p-3 capitalize">{allocation.allocationType.replace('-', ' ')}</td>
//                     <td className="p-3">{allocation.allocatedTo}</td>
//                     <td className="p-3">{allocation.operator}</td>
//                     <td className="p-3 capitalize">{allocation.shift}</td>
//                     <td className="p-3">{new Date(allocation.startDate).toLocaleDateString()}</td>
//                     <td className="p-3">{allocation.workingHours}h</td>
//                     <td className="p-3">
//                       <Badge variant={allocation.status === 'active' ? 'default' : 'secondary'}>
//                         {allocation.status}
//                       </Badge>
//                     </td>
//                     <td className="p-3">
//                       <div className="flex gap-2">
//                         <Button size="sm" variant="ghost" onClick={() => handleEdit(allocation)}>
//                           <Edit className="h-4 w-4" />
//                         </Button>
//                         <Button size="sm" variant="ghost" onClick={() => handleDelete(allocation.id)}>
//                           <Trash2 className="h-4 w-4 text-destructive" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {filteredAllocations.length === 0 && (
//                   <tr>
//                     <td colSpan={9} className="p-8 text-center text-muted-foreground">
//                       No allocations found
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

// export default EquipmentAllocationPage;
