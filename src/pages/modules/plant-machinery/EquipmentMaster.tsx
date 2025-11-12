"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Save, Plus, Edit2, Trash2, UploadCloud, DownloadCloud, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { storage } from "@/lib/storage";

type DepreciationMethod = "Straight-line" | "WDV";
type MaintenanceFrequency = "Monthly" | "Quarterly" | "Yearly";

interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

interface Equipment {
  id: string;
  code: string;
  name: string;
  model: string;
  manufacturer?: string;
  supplier?: string;
  warranty?: string;
  purchaseDate?: string;
  cost?: number;
  category?: string;
  serialNumber?: string;
  location?: string;
  department?: string;
  capacity?: string;
  frequency?: MaintenanceFrequency;
  insurance?: string;
  depreciation?: DepreciationMethod;
  documents?: StoredFile[];
  createdAt: string;
}

const LS_KEY = "equipment_master_v1";


function generateEquipmentCode(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `EQP-${year}-${suffix}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdvancedEquipmentRegistrationPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterLocation, setFilterLocation] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [form, setForm] = useState<Partial<Equipment>>({
    frequency: "Monthly",
    depreciation: "Straight-line",
  });

 useEffect(() => {
  // Wait until we're in the browser
  if (typeof window === "undefined") return;

  const saved = storage.get(LS_KEY);
  if (saved && Array.isArray(saved)) {
    setEquipments(saved);
  }
}, []);

useEffect(() => {
  // Save only when we have valid data
  if (typeof window === "undefined") return;
  if (equipments.length > 0) {
    storage.set(LS_KEY, equipments);
  }
}, [equipments]);



  const categories = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((e) => e.category && set.add(e.category));
    return ["All", ...Array.from(set)];
  }, [equipments]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((e) => e.location && set.add(e.location));
    return ["All", ...Array.from(set)];
  }, [equipments]);

  const visible = useMemo(() => {
    let items = [...equipments];
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((it) =>
        [it.code, it.name, it.model, it.serialNumber, it.department, it.location]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== "All") items = items.filter((i) => i.category === filterCategory);
    if (filterLocation !== "All") items = items.filter((i) => i.location === filterLocation);

    items.sort((a, b) => {
      const av: any = (a as any)[sortBy];
      const bv: any = (b as any)[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return items;
  }, [equipments, query, filterCategory, filterLocation, sortBy, sortDir]);

  function openAddDialog() {
    setEditing(null);
    setForm({ frequency: "Monthly", depreciation: "Straight-line" });
    setIsDialogOpen(true);
  }

  function openEditDialog(equipment: Equipment) {
    setEditing(equipment);
    setForm({ ...equipment });
    setIsDialogOpen(true);
  }

  function saveForm() {
    if (!form.name || !form.model) {
      toast.error("Name and Model are required");
      return;
    }

    if (editing) {
      const updated = equipments.map((e) => (e.id === editing.id ? { ...e, ...form, id: editing.id } as Equipment : e));
      setEquipments(updated);
      toast.success("Equipment updated successfully");
    } else {
      const newEq: Equipment = {
        id: uuidv4(),
        code: generateEquipmentCode(),
        name: form.name as string,
        model: form.model as string,
        manufacturer: form.manufacturer,
        supplier: form.supplier,
        warranty: form.warranty,
        purchaseDate: form.purchaseDate,
        cost: form.cost,
        category: form.category,
        serialNumber: form.serialNumber,
        location: form.location,
        department: form.department,
        capacity: form.capacity,
        frequency: (form.frequency as MaintenanceFrequency) || "Monthly",
        insurance: form.insurance,
        depreciation: (form.depreciation as DepreciationMethod) || "Straight-line",
        documents: form.documents || [],
        createdAt: new Date().toISOString(),
      };
      setEquipments((p) => [newEq, ...p]);
      toast.success("Equipment added");
    }

    setIsDialogOpen(false);
    setEditing(null);
    setForm({ frequency: "Monthly", depreciation: "Straight-line" });
  }

  async function handleFileAdd(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const converted = await Promise.all(
      arr.map(async (f) => ({ id: uuidv4(), name: f.name, type: f.type, size: f.size, dataUrl: await fileToDataUrl(f) } as StoredFile))
    );

    setForm((prev) => ({ ...prev, documents: [...(prev.documents || []), ...converted] }));
  }

  function removeFileFromForm(fileId: string) {
    setForm((prev) => ({ ...prev, documents: (prev.documents || []).filter((d) => d.id !== fileId) }));
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Equipment Registration </h1>
        <Button onClick={openAddDialog}><Plus className="mr-2 h-4 w-4" /> Add Equipment</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Equipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search equipment..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell>{eq.code}</TableCell>
                    <TableCell>{eq.name}</TableCell>
                    <TableCell>{eq.model}</TableCell>
                    <TableCell>{eq.category}</TableCell>
                    <TableCell>{eq.location}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(eq)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEquipments((p) => p.filter((e) => e.id !== eq.id)); toast.error("Deleted"); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Equipment Name *</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Model *</Label>
              <Input value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Upload Documents</Label>
              <input type="file" multiple onChange={(e) => handleFileAdd(e.target.files)} />
              <div className="flex gap-2 flex-wrap mt-2">
                {(form.documents || []).map((f) => (
                  <div key={f.id} className="border rounded px-2 py-1 text-xs flex items-center gap-2">
                    <span>{f.name}</span>
                    <button onClick={() => removeFileFromForm(f.id)}><X className="w-3 h-3 text-red-500" /></button>
                  </div>
                ))}
              </div>
            </div>
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
// import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
// import { Button } from '../../../components/ui/button';
// import { Input } from '../../../components/ui/input';
// import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
// import { Label } from '../../../components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
// import { Textarea } from '../../../components/ui/textarea';
// import { Badge } from '../../../components/ui/badge';
// import { useToast } from '../../../hooks/use-toast';
// import { getFromStorage, saveToStorage, PM_STORAGE_KEYS, generateId } from '../../../utils/plantMachineryStorage';
// import type { Equipment } from '../../../types/plantMachinery';

// const EquipmentMaster: React.FC = () => {
//   const [equipment, setEquipment] = useState<Equipment[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState<string>('all');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
//   const { toast } = useToast();

//   const [formData, setFormData] = useState<Partial<Equipment>>({
//     equipmentCode: '',
//     name: '',
//     model: '',
//     manufacturer: '',
//     supplier: '',
//     serialNumber: '',
//     assetNumber: '',
//     category: 'heavy-machinery',
//     type: '',
//     purchaseDate: '',
//     purchaseCost: 0,
//     warrantyExpiry: '',
//     location: '',
//     department: '',
//     project: '',
//     operatingCapacity: '',
//     specifications: '',
//     maintenanceFrequency: 'monthly',
//     depreciationMethod: 'straight-line',
//     depreciationRate: 10,
//     currentValue: 0,
//     insurance: {
//       provider: '',
//       policyNumber: '',
//       expiryDate: '',
//     },
//     status: 'operational',
//     documents: [],
//   });

//   useEffect(() => {
//     loadEquipment();
//   }, []);

//   const loadEquipment = () => {
//     const data = getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT);
//     setEquipment(data);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     const equipmentData: Equipment = {
//       ...formData,
//       id: editingEquipment?.id || generateId(),
//       equipmentCode: formData.equipmentCode!,
//       name: formData.name!,
//       model: formData.model!,
//       manufacturer: formData.manufacturer!,
//       supplier: formData.supplier!,
//       serialNumber: formData.serialNumber!,
//       assetNumber: formData.assetNumber!,
//       category: formData.category!,
//       type: formData.type!,
//       purchaseDate: formData.purchaseDate!,
//       purchaseCost: formData.purchaseCost!,
//       warrantyExpiry: formData.warrantyExpiry!,
//       location: formData.location!,
//       department: formData.department!,
//       operatingCapacity: formData.operatingCapacity!,
//       specifications: formData.specifications!,
//       maintenanceFrequency: formData.maintenanceFrequency!,
//       depreciationMethod: formData.depreciationMethod!,
//       depreciationRate: formData.depreciationRate!,
//       currentValue: formData.currentValue!,
//       insurance: formData.insurance!,
//       status: formData.status!,
//       documents: formData.documents!,
//       createdAt: editingEquipment?.createdAt || new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     } as Equipment;

//     if (editingEquipment) {
//       const updated = equipment.map(e => e.id === editingEquipment.id ? equipmentData : e);
//       setEquipment(updated);
//       saveToStorage(PM_STORAGE_KEYS.EQUIPMENT, updated);
//       toast({ title: 'Equipment updated successfully' });
//     } else {
//       const updated = [...equipment, equipmentData];
//       setEquipment(updated);
//       saveToStorage(PM_STORAGE_KEYS.EQUIPMENT, updated);
//       toast({ title: 'Equipment added successfully' });
//     }

//     setIsDialogOpen(false);
//     resetForm();
//   };

//   const handleEdit = (eq: Equipment) => {
//     setEditingEquipment(eq);
//     setFormData(eq);
//     setIsDialogOpen(true);
//   };

//   const handleDelete = (id: string) => {
//     if (confirm('Are you sure you want to delete this equipment?')) {
//       const updated = equipment.filter(e => e.id !== id);
//       setEquipment(updated);
//       saveToStorage(PM_STORAGE_KEYS.EQUIPMENT, updated);
//       toast({ title: 'Equipment deleted successfully' });
//     }
//   };

//   const resetForm = () => {
//     setEditingEquipment(null);
//     setFormData({
//       equipmentCode: '',
//       name: '',
//       model: '',
//       manufacturer: '',
//       supplier: '',
//       serialNumber: '',
//       assetNumber: '',
//       category: 'heavy-machinery',
//       type: '',
//       purchaseDate: '',
//       purchaseCost: 0,
//       warrantyExpiry: '',
//       location: '',
//       department: '',
//       project: '',
//       operatingCapacity: '',
//       specifications: '',
//       maintenanceFrequency: 'monthly',
//       depreciationMethod: 'straight-line',
//       depreciationRate: 10,
//       currentValue: 0,
//       insurance: {
//         provider: '',
//         policyNumber: '',
//         expiryDate: '',
//       },
//       status: 'operational',
//       documents: [],
//     });
//   };

//   const filteredEquipment = equipment.filter(eq => {
//     const matchesSearch = 
//       eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       eq.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       eq.location.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesStatus = filterStatus === 'all' || eq.status === filterStatus;
    
//     return matchesSearch && matchesStatus;
//   });

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">Equipment Master</h1>
//           <p className="text-muted-foreground">Manage all plant and machinery assets</p>
//         </div>
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button onClick={resetForm}>
//               <Plus className="mr-2 h-4 w-4" />
//               Add Equipment
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
//             </DialogHeader>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label>Equipment Code *</Label>
//                   <Input
//                     value={formData.equipmentCode}
//                     onChange={(e) => setFormData({ ...formData, equipmentCode: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Equipment Name *</Label>
//                   <Input
//                     value={formData.name}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Category *</Label>
//                   <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="heavy-machinery">Heavy Machinery</SelectItem>
//                       <SelectItem value="light-machinery">Light Machinery</SelectItem>
//                       <SelectItem value="tools">Tools</SelectItem>
//                       <SelectItem value="vehicles">Vehicles</SelectItem>
//                       <SelectItem value="equipment">Equipment</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Type *</Label>
//                   <Input
//                     value={formData.type}
//                     onChange={(e) => setFormData({ ...formData, type: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Model</Label>
//                   <Input
//                     value={formData.model}
//                     onChange={(e) => setFormData({ ...formData, model: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Manufacturer</Label>
//                   <Input
//                     value={formData.manufacturer}
//                     onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Supplier</Label>
//                   <Input
//                     value={formData.supplier}
//                     onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Serial Number</Label>
//                   <Input
//                     value={formData.serialNumber}
//                     onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Asset Number</Label>
//                   <Input
//                     value={formData.assetNumber}
//                     onChange={(e) => setFormData({ ...formData, assetNumber: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Purchase Date *</Label>
//                   <Input
//                     type="date"
//                     value={formData.purchaseDate}
//                     onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Purchase Cost *</Label>
//                   <Input
//                     type="number"
//                     value={formData.purchaseCost}
//                     onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Current Value</Label>
//                   <Input
//                     type="number"
//                     value={formData.currentValue}
//                     onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Warranty Expiry</Label>
//                   <Input
//                     type="date"
//                     value={formData.warrantyExpiry}
//                     onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Location *</Label>
//                   <Input
//                     value={formData.location}
//                     onChange={(e) => setFormData({ ...formData, location: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Department *</Label>
//                   <Input
//                     value={formData.department}
//                     onChange={(e) => setFormData({ ...formData, department: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Project</Label>
//                   <Input
//                     value={formData.project}
//                     onChange={(e) => setFormData({ ...formData, project: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Maintenance Frequency</Label>
//                   <Select value={formData.maintenanceFrequency} onValueChange={(value: any) => setFormData({ ...formData, maintenanceFrequency: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="daily">Daily</SelectItem>
//                       <SelectItem value="weekly">Weekly</SelectItem>
//                       <SelectItem value="monthly">Monthly</SelectItem>
//                       <SelectItem value="quarterly">Quarterly</SelectItem>
//                       <SelectItem value="yearly">Yearly</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Status</Label>
//                   <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="operational">Operational</SelectItem>
//                       <SelectItem value="under-maintenance">Under Maintenance</SelectItem>
//                       <SelectItem value="breakdown">Breakdown</SelectItem>
//                       <SelectItem value="idle">Idle</SelectItem>
//                       <SelectItem value="disposed">Disposed</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="col-span-2">
//                   <Label>Operating Capacity</Label>
//                   <Input
//                     value={formData.operatingCapacity}
//                     onChange={(e) => setFormData({ ...formData, operatingCapacity: e.target.value })}
//                     placeholder="e.g., 50 tons, 500 HP"
//                   />
//                 </div>
//                 <div className="col-span-2">
//                   <Label>Specifications</Label>
//                   <Textarea
//                     value={formData.specifications}
//                     onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
//                     rows={3}
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end gap-2">
//                 <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
//                   Cancel
//                 </Button>
//                 <Button type="submit">
//                   {editingEquipment ? 'Update' : 'Add'} Equipment
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
//                   placeholder="Search equipment..."
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
//                 <SelectItem value="operational">Operational</SelectItem>
//                 <SelectItem value="under-maintenance">Under Maintenance</SelectItem>
//                 <SelectItem value="breakdown">Breakdown</SelectItem>
//                 <SelectItem value="idle">Idle</SelectItem>
//                 <SelectItem value="disposed">Disposed</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b">
//                   <th className="text-left p-3">Code</th>
//                   <th className="text-left p-3">Name</th>
//                   <th className="text-left p-3">Category</th>
//                   <th className="text-left p-3">Location</th>
//                   <th className="text-left p-3">Department</th>
//                   <th className="text-left p-3">Status</th>
//                   <th className="text-left p-3">Purchase Cost</th>
//                   <th className="text-left p-3">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredEquipment.map((eq) => (
//                   <tr key={eq.id} className="border-b hover:bg-muted/50">
//                     <td className="p-3 font-mono text-sm">{eq.equipmentCode}</td>
//                     <td className="p-3 font-medium">{eq.name}</td>
//                     <td className="p-3 capitalize">{eq.category.replace('-', ' ')}</td>
//                     <td className="p-3">{eq.location}</td>
//                     <td className="p-3">{eq.department}</td>
//                     <td className="p-3">
//                       <Badge
//                         variant={
//                           eq.status === 'operational' ? 'default' :
//                           eq.status === 'under-maintenance' ? 'secondary' :
//                           eq.status === 'breakdown' ? 'destructive' : 'outline'
//                         }
//                       >
//                         {eq.status}
//                       </Badge>
//                     </td>
//                     <td className="p-3">₹{eq.purchaseCost.toLocaleString()}</td>
//                     <td className="p-3">
//                       <div className="flex gap-2">
//                         <Button size="sm" variant="ghost" onClick={() => handleEdit(eq)}>
//                           <Edit className="h-4 w-4" />
//                         </Button>
//                         <Button size="sm" variant="ghost" onClick={() => handleDelete(eq.id)}>
//                           <Trash2 className="h-4 w-4 text-destructive" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {filteredEquipment.length === 0 && (
//                   <tr>
//                     <td colSpan={8} className="p-8 text-center text-muted-foreground">
//                       No equipment found
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

// export default EquipmentMaster;
