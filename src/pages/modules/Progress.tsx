"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Avatar } from "../../components/ui/avatar";
import { Upload, Trash2, Edit2, Globe, MapPin } from "lucide-react";
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "../../utils/localStorage";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Types
type DailyProgressItem = {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  task?: string;
  percentComplete: number; // 0-100
  materialUsed?: string;
  labourHours?: number;
  machineHours?: number;
  remarks?: string;
  photos?: { id: string; dataUrl: string; gps?: { lat: number; lng: number } }[];
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Storage helpers
const getProgress = () => getFromStorage<DailyProgressItem[]>(STORAGE_KEYS.DAILY_PROGRESS) || [];
const saveProgress = (list: DailyProgressItem[]) => saveToStorage(STORAGE_KEYS.DAILY_PROGRESS, list);

// Gantt / planned progress storage key
const getGantt = () => getFromStorage<{ date: string; planned: number }[]>(STORAGE_KEYS.GANTT_PROGRESS) || [];
const saveGantt = (list: { date: string; planned: number }[]) => saveToStorage(STORAGE_KEYS.GANTT_PROGRESS, list);

export default function DailyProgressPage() {
  const [items, setItems] = useState<DailyProgressItem[]>([]);
  const [gantt, setGantt] = useState<{ date: string; planned: number }[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DailyProgressItem | null>(null);
  const [form, setForm] = useState<Partial<DailyProgressItem>>({ date: new Date().toISOString().slice(0, 10), percentComplete: 0 });

  useEffect(() => {
    setItems(getProgress());
    setGantt(getGantt());
  }, []);

  const persistItems = (list: DailyProgressItem[]) => {
    setItems(list);
    saveProgress(list);
  };
  const persistGantt = (list: { date: string; planned: number }[]) => {
    setGantt(list);
    saveGantt(list);
  };

  // Create / Edit handlers
  const openCreate = () => {
    setEditing(null);
    setForm({ date: new Date().toISOString().slice(0, 10), percentComplete: 0 });
    setIsDialogOpen(true);
  };

  const openEdit = (it: DailyProgressItem) => {
    setEditing(it);
    setForm({ ...it });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.date || typeof form.percentComplete !== "number") return;
    const now = new Date().toISOString();
    if (editing) {
      const updated = items.map((it) => (it.id === editing.id ? { ...it, ...form, updatedAt: now } as DailyProgressItem : it));
      persistItems(updated);
    } else {
      const newItem: DailyProgressItem = {
        id: generateId(),
        date: form.date!,
        task: form.task || "",
        percentComplete: form.percentComplete || 0,
        materialUsed: form.materialUsed || "",
        labourHours: form.labourHours || 0,
        machineHours: form.machineHours || 0,
        remarks: form.remarks || "",
        photos: form.photos || [],
        updatedBy: form.updatedBy || "",
        createdAt: now,
        updatedAt: now,
      };
      persistItems([...items, newItem].sort((a, b) => (a.date > b.date ? 1 : -1)));
    }
    setIsDialogOpen(false);
    setEditing(null);
    setForm({ date: new Date().toISOString().slice(0, 10), percentComplete: 0 });
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    persistItems(updated);
  };

  // Photo upload helper -> converts file to dataURL and attempts to attach GPS using geolocation at time of upload
  const handlePhotoUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      // try to get GPS
      const gps = await new Promise<{ lat: number; lng: number } | undefined>((resolve) => {
        if (!navigator.geolocation) return resolve(undefined);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(undefined),
          { timeout: 5000 },
        );
      });

      const photo = { id: generateId(), dataUrl, gps };
      setForm((f) => ({ ...(f || {}), photos: [...((f && f.photos) || []), photo] }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (photoId: string) => {
    setForm((f) => ({ ...(f || {}), photos: (f.photos || []).filter((p) => p.id !== photoId) }));
  };

  // Integration: Update Gantt Progress
  // This will push today's actual percent into the Gantt planned dataset as "actual update" simulation.
  const updateGanttProgress = () => {
    // For simplicity: find latest item per date and push into gantt as planned/actual record
    const series = items
      .map((it) => ({ date: it.date, actual: it.percentComplete }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // Merge into gantt: if a date exists update planned to current actual; otherwise append
    const existing = [...gantt];
    series.forEach((s) => {
      const idx = existing.findIndex((g) => g.date === s.date);
      if (idx >= 0) existing[idx] = { date: s.date, planned: s.actual };
      else existing.push({ date: s.date, planned: s.actual });
    });

    persistGantt(existing.sort((a, b) => (a.date > b.date ? 1 : -1)));
    window.alert("Gantt progress updated with current actuals (simulation).");
  };

  // Chart data: planned vs actual
  const chartData = useMemo(() => {
    // Build a union of dates from gantt (planned) and items (actual)
    const dateSet = new Set<string>();
    (gantt || []).forEach((g) => dateSet.add(g.date));
    (items || []).forEach((i) => dateSet.add(i.date));
    const dates = Array.from(dateSet).sort((a, b) => (a > b ? 1 : -1));

    return dates.map((d) => ({
      date: d,
      planned: (gantt.find((g) => g.date === d) || { planned: 0 }).planned || 0,
      actual: (items.find((i) => i.date === d) || { percentComplete: 0 }).percentComplete || 0,
    }));
  }, [gantt, items]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Daily Progress</h2>
          <p className="text-muted-foreground">Track daily %complete, resources used, photos & GPS, and update Gantt.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate}><Upload className="mr-2 h-4 w-4" /> Add Daily Progress</Button>
          <Button variant="outline" onClick={updateGanttProgress}>Update Gantt Progress</Button>
        </div>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Planned vs Actual Progress</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="planned" name="Planned %" stroke="#8884d8" />
              <Line type="monotone" dataKey="actual" name="Actual %" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Form & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form (Dialog) handled separately */}

        {/* Table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Daily Progress Records ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>% Completed</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Photos</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{it.task || "—"}</TableCell>
                      <TableCell>{it.percentComplete}%</TableCell>
                      <TableCell className="max-w-[240px] truncate">{it.remarks || "—"}</TableCell>
                      <TableCell>{it.updatedBy || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {(it.photos || []).map((p) => (
                            <div key={p.id} className="w-12 h-12 rounded overflow-hidden border" title={p.gps ? `GPS: ${p.gps.lat.toFixed(4)}, ${p.gps.lng.toFixed(4)}` : "No GPS"}>
                              <img src={p.dataUrl} alt="photo" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Edit2 className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(it.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {items.length === 0 && <div className="text-center py-8 text-muted-foreground">No daily progress yet. Click “Add Daily Progress” to start.</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Add / Edit Daily Progress */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Daily Progress" : "Add Daily Progress"}</DialogTitle>
            <DialogDescription>Add percent completed, materials used, labour/machine hours, photos & GPS.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Task</Label>
                <Input value={form.task || ""} onChange={(e) => setForm({ ...form, task: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>% Completed</Label>
                <Input type="number" min={0} max={100} value={form.percentComplete ?? 0} onChange={(e) => setForm({ ...form, percentComplete: parseFloat(e.target.value || "0") })} />
              </div>
              <div>
                <Label>Material Used</Label>
                <Input value={form.materialUsed || ""} onChange={(e) => setForm({ ...form, materialUsed: e.target.value })} />
              </div>
              <div>
                <Label>Labour Hours</Label>
                <Input type="number" value={form.labourHours ?? 0} onChange={(e) => setForm({ ...form, labourHours: parseFloat(e.target.value || "0") })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Machine Hours</Label>
                <Input type="number" value={form.machineHours ?? 0} onChange={(e) => setForm({ ...form, machineHours: parseFloat(e.target.value || "0") })} />
              </div>
              <div>
                <Label>Updated By</Label>
                <Input value={form.updatedBy || ""} onChange={(e) => setForm({ ...form, updatedBy: e.target.value })} placeholder="Name" />
              </div>
            </div>

            <div>
              <Label>Remarks</Label>
              <Textarea value={form.remarks || ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </div>

            <div>
              <Label>Photos (attach one at a time)</Label>
              <div className="flex gap-2 items-center">
                <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files)} />
                <span className="text-sm text-muted-foreground">(GPS tag attempted at upload time)</span>
              </div>

              {(form.photos || []).length > 0 && (
                <div className="mt-2 flex gap-2">
                  {(form.photos || []).map((p) => (
                    <div key={p.id} className="border rounded overflow-hidden w-24 h-24 relative">
                      <img src={p.dataUrl} alt="preview" className="w-full h-full object-cover" />
                      <button className="absolute top-1 right-1 bg-white p-1 rounded" onClick={() => removePhoto(p.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> GPS: {((form.photos || []).find((p) => p.gps)?.gps && `${(form.photos || []).find((p) => p.gps)!.gps!.lat.toFixed(4)}, ${(form.photos || []).find((p) => p.gps)!.gps!.lng.toFixed(4)}`) || "No GPS recorded"}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save" : "Add Progress"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/*
Notes:
- This file relies on your existing `../../utils/localStorage` helpers: getFromStorage, saveToStorage, generateId, STORAGE_KEYS.
  STORAGE_KEYS must include: DAILY_PROGRESS and GANTT_PROGRESS.
- Photo uploads are stored as data URLs in localStorage. For production, swap to Cloudinary/S3 and store only URLs.
- GPS tagging uses navigator.geolocation at upload time and is best-effort (may be denied by user).
- "Update Gantt Progress" simulates integration by copying actual daily progress into the Gantt planned dataset. Adapt to your real Gantt backend as needed.
- Recharts is used for the line chart. Install with: `npm i recharts`.
*/


// import { useState, useEffect } from "react";
// import { Button } from "../../components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "../../components/ui/dialog";
// import { Input } from "../../components/ui/input";
// import { Label } from "../../components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../../components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../../components/ui/table";
// import { Plus, Pencil, Trash2 } from "lucide-react";
// import { ProgressUpdate, Project, WBSItem } from "../../types/production";
// import {
//   getFromStorage,
//   saveToStorage,
//   generateId,
//   STORAGE_KEYS,
// } from "../../utils/localStorage";
// import { useToast } from "../../hooks/use-toast";
// import { Textarea } from "../../components/ui/textarea";
// import { Progress as ProgressBar } from "../../components/ui/progress";

// export default function Progress() {
//   const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingUpdate, setEditingUpdate] = useState<ProgressUpdate | null>(null);
//   const [formData, setFormData] = useState<Partial<ProgressUpdate>>({});
//   const { toast } = useToast();

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = () => {
//     const updatesData = getFromStorage<ProgressUpdate>(STORAGE_KEYS.PROGRESS_UPDATES);
//     const projectsData = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
//     const wbsData = getFromStorage<WBSItem>(STORAGE_KEYS.WBS_ITEMS);
//     setProgressUpdates(updatesData);
//     setProjects(projectsData);
//     setWbsItems(wbsData);
//   };

//   const handleSave = () => {
//     if (!formData.projectId || !formData.wbsItemId) {
//       toast({
//         title: "Validation Error",
//         description: "Please fill in all required fields",
//         variant: "destructive",
//       });
//       return;
//     }

//     let updatedProgress: ProgressUpdate[];
//     const now = new Date().toISOString();

//     if (editingUpdate) {
//       updatedProgress = progressUpdates.map((p) =>
//         p.id === editingUpdate.id
//           ? { ...formData, id: p.id, createdAt: p.createdAt } as ProgressUpdate
//           : p
//       );
//       toast({
//         title: "Success",
//         description: "Progress update saved successfully",
//       });
//     } else {
//       const newUpdate: ProgressUpdate = {
//         ...formData,
//         id: generateId(),
//         date: formData.date || now.split("T")[0],
//         materialUsed: formData.materialUsed || [],
//         createdAt: now,
//       } as ProgressUpdate;
//       updatedProgress = [...progressUpdates, newUpdate];
//       toast({
//         title: "Success",
//         description: "Progress update created successfully",
//       });
//     }

//     saveToStorage(STORAGE_KEYS.PROGRESS_UPDATES, updatedProgress);
//     setProgressUpdates(updatedProgress);
//     setIsDialogOpen(false);
//     resetForm();
//   };

//   const handleDelete = (id: string) => {
//     const updatedProgress = progressUpdates.filter((p) => p.id !== id);
//     saveToStorage(STORAGE_KEYS.PROGRESS_UPDATES, updatedProgress);
//     setProgressUpdates(updatedProgress);
//     toast({
//       title: "Success",
//       description: "Progress update deleted successfully",
//     });
//   };

//   const openEditDialog = (update: ProgressUpdate) => {
//     setEditingUpdate(update);
//     setFormData(update);
//     setIsDialogOpen(true);
//   };

//   const openCreateDialog = () => {
//     resetForm();
//     setIsDialogOpen(true);
//   };

//   const resetForm = () => {
//     setEditingUpdate(null);
//     setFormData({
//       percentComplete: 0,
//       labourHours: 0,
//       equipmentHours: 0,
//       materialUsed: [],
//     });
//   };

//   const getProjectName = (projectId: string) => {
//     return projects.find((p) => p.id === projectId)?.name || "Unknown";
//   };

//   const getWBSName = (wbsItemId: string) => {
//     return wbsItems.find((w) => w.id === wbsItemId)?.name || "Unknown";
//   };

//   const filteredWbsItems = formData.projectId
//     ? wbsItems.filter((w) => w.projectId === formData.projectId)
//     : [];

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold tracking-tight text-foreground">Progress Tracking</h2>
//           <p className="text-muted-foreground">Monitor and record project progress updates</p>
//         </div>
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button onClick={openCreateDialog}>
//               <Plus className="mr-2 h-4 w-4" />
//               New Progress Update
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>
//                 {editingUpdate ? "Edit Progress Update" : "Record Progress Update"}
//               </DialogTitle>
//               <DialogDescription>
//                 {editingUpdate ? "Update progress details" : "Record daily or weekly progress"}
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="space-y-2">
//                 <Label htmlFor="projectId">Project *</Label>
//                 <Select
//                   value={formData.projectId}
//                   onValueChange={(value) =>
//                     setFormData({ ...formData, projectId: value, wbsItemId: undefined })
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select project" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {projects.map((project) => (
//                       <SelectItem key={project.id} value={project.id}>
//                         {project.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="wbsItemId">WBS Item *</Label>
//                 <Select
//                   value={formData.wbsItemId}
//                   onValueChange={(value) => setFormData({ ...formData, wbsItemId: value })}
//                   disabled={!formData.projectId}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select WBS item" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {filteredWbsItems.map((item) => (
//                       <SelectItem key={item.id} value={item.id}>
//                         {item.name} ({item.type})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="date">Date</Label>
//                   <Input
//                     id="date"
//                     type="date"
//                     value={formData.date || ""}
//                     onChange={(e) => setFormData({ ...formData, date: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="percentComplete">% Complete</Label>
//                   <Input
//                     id="percentComplete"
//                     type="number"
//                     min="0"
//                     max="100"
//                     value={formData.percentComplete || ""}
//                     onChange={(e) =>
//                       setFormData({ ...formData, percentComplete: parseFloat(e.target.value) })
//                     }
//                     placeholder="75"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="labourHours">Labour Hours</Label>
//                   <Input
//                     id="labourHours"
//                     type="number"
//                     value={formData.labourHours || ""}
//                     onChange={(e) =>
//                       setFormData({ ...formData, labourHours: parseFloat(e.target.value) })
//                     }
//                     placeholder="40"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="equipmentHours">Equipment Hours</Label>
//                   <Input
//                     id="equipmentHours"
//                     type="number"
//                     value={formData.equipmentHours || ""}
//                     onChange={(e) =>
//                       setFormData({ ...formData, equipmentHours: parseFloat(e.target.value) })
//                     }
//                     placeholder="8"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="updatedBy">Updated By</Label>
//                 <Input
//                   id="updatedBy"
//                   value={formData.updatedBy || ""}
//                   onChange={(e) => setFormData({ ...formData, updatedBy: e.target.value })}
//                   placeholder="Site Manager Name"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="remarks">Remarks</Label>
//                 <Textarea
//                   id="remarks"
//                   value={formData.remarks || ""}
//                   onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
//                   placeholder="Progress notes, issues, or observations..."
//                   rows={4}
//                 />
//               </div>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleSave}>Save Update</Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Progress Updates ({progressUpdates.length})</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Project</TableHead>
//                 <TableHead>WBS Item</TableHead>
//                 <TableHead>Progress</TableHead>
//                 <TableHead>Labour Hrs</TableHead>
//                 <TableHead>Equipment Hrs</TableHead>
//                 <TableHead>Updated By</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {progressUpdates.map((update) => (
//                 <TableRow key={update.id}>
//                   <TableCell className="font-medium">
//                     {new Date(update.date).toLocaleDateString()}
//                   </TableCell>
//                   <TableCell>{getProjectName(update.projectId)}</TableCell>
//                   <TableCell>{getWBSName(update.wbsItemId)}</TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <ProgressBar value={update.percentComplete} className="w-20" />
//                       <span className="text-sm text-muted-foreground">
//                         {update.percentComplete}%
//                       </span>
//                     </div>
//                   </TableCell>
//                   <TableCell>{update.labourHours}</TableCell>
//                   <TableCell>{update.equipmentHours}</TableCell>
//                   <TableCell className="text-muted-foreground">{update.updatedBy}</TableCell>
//                   <TableCell>
//                     <div className="flex gap-2">
//                       <Button variant="ghost" size="icon" onClick={() => openEditDialog(update)}>
//                         <Pencil className="h-4 w-4" />
//                       </Button>
//                       <Button variant="ghost" size="icon" onClick={() => handleDelete(update.id)}>
//                         <Trash2 className="h-4 w-4 text-destructive" />
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//           {progressUpdates.length === 0 && (
//             <div className="text-center py-12">
//               <p className="text-muted-foreground">
//                 No progress updates yet. Record your first progress update!
//               </p>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
