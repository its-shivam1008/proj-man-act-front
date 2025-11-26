"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  createEquipment,
  updateEquipment,
  deleteEquipment,
  fetchEquipments,
} from "@/redux/slices/equipmentSlice";

import { Save, Plus, Edit2, Trash2, Search, X } from "lucide-react";

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

// ---------- TYPES ----------
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
  _id?: string;
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

// ---------- HELPERS ----------
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

// ---------- MAIN COMPONENT ----------
export default function AdvancedEquipmentRegistrationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const equipments = useSelector(
    (state: RootState) => state.equipment.equipments
  );

  // UI states
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [form, setForm] = useState<Partial<Equipment>>({
    frequency: "Monthly",
    depreciation: "Straight-line",
  });

  // FETCH FROM BACKEND ONLY
  useEffect(() => {
    dispatch(fetchEquipments({ page: 1, limit: 100 }));
  }, [dispatch]);

  // CATEGORIES
  const categories = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((e) => e.category && set.add(e.category));
    return ["All", ...Array.from(set)];
  }, [equipments]);

  // LOCATIONS
  const locations = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach((e) => e.location && set.add(e.location));
    return ["All", ...Array.from(set)];
  }, [equipments]);

  // FILTER + SORT + SEARCH
  const visible = useMemo(() => {
    let items = [...equipments];

    // search
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((it) =>
        [
          it.code,
          it.name,
          it.model,
          it.serialNumber,
          it.department,
          it.location,
        ]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q))
      );
    }

    // filters
    if (filterCategory !== "All")
      items = items.filter((i) => i.category === filterCategory);

    if (filterLocation !== "All")
      items = items.filter((i) => i.location === filterLocation);

    // sorting
    items.sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];

      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;

      if (typeof av === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }

      return sortDir === "asc" ? av - bv : bv - av;
    });

    return items;
  }, [equipments, query, filterCategory, filterLocation, sortBy, sortDir]);

  // ---------- OPEN ADD ----------
  function openAddDialog() {
    setEditing(null);
    setForm({ frequency: "Monthly", depreciation: "Straight-line" });
    setIsDialogOpen(true);
  }

  // ---------- OPEN EDIT ----------
  function openEditDialog(eq: Equipment) {
    setEditing(eq);
    setForm({ ...eq });
    setIsDialogOpen(true);
  }

  // ---------- SAVE ----------
  function saveForm() {
    if (!form.name || !form.model) {
      toast.error("Name and Model are required");
      return;
    }

    // UPDATE ---------------------
    if (editing && editing._id) {
      dispatch(
        updateEquipment({
          id: editing._id,
          data: form,
        })
      );
      toast.success("Equipment updated");
    }

    // CREATE ---------------------
    else {
      const newEq: Partial<Equipment> = {
        ...form,
        code: generateEquipmentCode(),
        createdAt: new Date().toISOString(),
      };

      dispatch(createEquipment(newEq));
      toast.success("Equipment added");
    }

    setIsDialogOpen(false);
    setEditing(null);
    setForm({ frequency: "Monthly", depreciation: "Straight-line" });
  }

  // ---------- FILES ----------
  async function handleFileAdd(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);

    const converted = await Promise.all(
      arr.map(async (f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        type: f.type,
        size: f.size,
        dataUrl: await fileToDataUrl(f),
      }))
    );

    setForm((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), ...converted],
    }));
  }

  function removeFileFromForm(fileId: string) {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents?.filter((d) => d.id !== fileId) || [],
    }));
  }

  // ---------- UI ----------
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Equipment Registration</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Equipment
        </Button>
      </div>

      {/* TABLE CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Equipments</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* TABLE */}
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
                  <TableRow key={eq._id}>
                    <TableCell>{eq.code}</TableCell>
                    <TableCell>{eq.name}</TableCell>
                    <TableCell>{eq.model}</TableCell>
                    <TableCell>{eq.category}</TableCell>
                    <TableCell>{eq.location}</TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(eq)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (!eq._id) {
                              toast.error("This item is not saved on server");
                              return;
                            }
                            dispatch(deleteEquipment(eq._id));
                            toast.success("Deleted successfully");
                          }}
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

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Equipment" : "Add Equipment"}
            </DialogTitle>
          </DialogHeader>

          {/* FORM FIELDS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Model *</Label>
              <Input
                value={form.model || ""}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Input
                value={form.category || ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={form.location || ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            {/* DOCUMENTS */}
            <div className="col-span-2">
              <Label>Upload Documents</Label>
              <input
                type="file"
                multiple
                onChange={(e) => handleFileAdd(e.target.files)}
              />

              {(form.documents || []).length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {form.documents?.map((f) => (
                    <div
                      key={f.id}
                      className="border rounded px-2 py-1 text-xs flex items-center gap-2"
                    >
                      <span>{f.name}</span>
                      <button onClick={() => removeFileFromForm(f.id)}>
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
