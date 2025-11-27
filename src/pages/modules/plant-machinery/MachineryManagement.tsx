import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  createMachinery,
  updateMachinery,
  deleteMachinery,
  fetchMachineries,
} from "@/redux/slices/plantandmachinary/machinerySlice";

import { Save, Plus, Edit2, Trash2, Search, X, ShieldAlert } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
type MachineryStatus = "Active" | "Inactive" | "Under Maintenance" | "Retired";

interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

interface Machinery {
  _id?: string;
  code: string;
  name: string;
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
  powerRating?: string;
  operatingHours?: number;
  frequency?: MaintenanceFrequency;
  insurance?: string;
  depreciation?: DepreciationMethod;
  status?: MachineryStatus;
  documents?: StoredFile[];
  createdAt: string;
}

// ---------- HELPERS ----------
function generateMachineryCode(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `MCH-${year}-${suffix}`;
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
export default function MachineryManagementPage() {
  const canView = usePermission("machineryManagement", "view");
  const canCreate = usePermission("machineryManagement", "create");
  const canEdit = usePermission("machineryManagement", "edit");
  const canDelete = usePermission("machineryManagement", "delete");

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

  const dispatch = useDispatch<AppDispatch>();
  const machineries = useSelector(
    (state: RootState) => state.machinery.machineries
  );

  // UI states
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Machinery | null>(null);
  const [form, setForm] = useState<Partial<Machinery>>({
    frequency: "Monthly",
    depreciation: "Straight-line",
    status: "Active",
  });

  // FETCH FROM BACKEND
  useEffect(() => {
    dispatch(fetchMachineries({ page: 1, limit: 100 }));
  }, [dispatch]);

  // CATEGORIES
  const categories = useMemo(() => {
    const set = new Set<string>();
    machineries.forEach((m) => m.category && set.add(m.category));
    return ["All", ...Array.from(set)];
  }, [machineries]);

  // LOCATIONS
  const locations = useMemo(() => {
    const set = new Set<string>();
    machineries.forEach((m) => m.location && set.add(m.location));
    return ["All", ...Array.from(set)];
  }, [machineries]);

  // FILTER + SEARCH
  const visible = useMemo(() => {
    let items = [...machineries];

    // search
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((it) =>
        [
          it.code,
          it.name,
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

    return items;
  }, [machineries, query, filterCategory, filterLocation]);

  // ---------- OPEN ADD ----------
  function openAddDialog() {
    setEditing(null);
    setForm({ frequency: "Monthly", depreciation: "Straight-line" });
    setIsDialogOpen(true);
  }

  // ---------- OPEN EDIT ----------
  function openEditDialog(machinery: Machinery) {
    setEditing(machinery);
    setForm({ ...machinery });
    setIsDialogOpen(true);
  }

  // ---------- SAVE ----------
  async function saveForm() {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }

    try {
      // UPDATE
      if (editing && editing._id) {
        await dispatch(
          updateMachinery({
            id: editing._id,
            data: form,
          })
        ).unwrap();
        toast.success("Machinery updated");
      }

      // CREATE
      else {
        const newMachinery: Partial<Machinery> = {
          ...form,
          code: form.code || generateMachineryCode(),
          createdAt: new Date().toISOString(),
        };

        await dispatch(createMachinery(newMachinery)).unwrap();
        toast.success("Machinery added");
      }

      // Refetch to ensure table is updated
      dispatch(fetchMachineries({ page: 1, limit: 100 }));

      setIsDialogOpen(false);
      setEditing(null);
      setForm({ frequency: "Monthly", depreciation: "Straight-line" });
    } catch (error: any) {
      toast.error(error || "Failed to save machinery");
    }
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
        <h1 className="text-2xl font-bold">Machinery Management</h1>
        <Button
          disabled={!canCreate}
          onClick={() => canCreate && openAddDialog()}
          className={!canCreate ? "opacity-50 cursor-not-allowed" : ""}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Machinery
        </Button>
      </div>

      {/* TABLE CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Machineries</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search machinery..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machinery ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visible.map((machinery) => (
                  <TableRow key={machinery._id}>
                    <TableCell>{machinery.code}</TableCell>
                    <TableCell>{machinery.name}</TableCell>
                    <TableCell>{machinery.category}</TableCell>
                    <TableCell>{machinery.location}</TableCell>
                    <TableCell>
                      {machinery.cost ? `₹${machinery.cost.toLocaleString()}` : "-"}
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canEdit}
                          onClick={() => canEdit && openEditDialog(machinery)}
                          className={
                            !canEdit ? "opacity-50 cursor-not-allowed" : ""
                          }
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canDelete}
                          onClick={() => {
                            if (!canDelete) return;
                            if (!machinery._id) {
                              toast.error("This item is not saved on server");
                              return;
                            }
                            dispatch(deleteMachinery(machinery._id));
                            toast.success("Deleted successfully");
                          }}
                          className={
                            !canDelete ? "opacity-50 cursor-not-allowed" : ""
                          }
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Machinery" : "Add Machinery"}
            </DialogTitle>
          </DialogHeader>

          {/* FORM FIELDS */}
          <div
            className="grid grid-cols-2 gap-4"
            style={{
              pointerEvents: editing
                ? canEdit
                  ? "auto"
                  : "none"
                : canCreate
                ? "auto"
                : "none",
              opacity: editing ? (canEdit ? 1 : 0.6) : canCreate ? 1 : 0.6,
            }}
          >
            <div>
              <Label>Machinery ID</Label>
              <Input
                value={form.code || ""}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </div>

            <div>
              <Label>Name *</Label>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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

            <div>
              <Label>Cost</Label>
              <Input
                type="number"
                value={form.cost || ""}
                onChange={(e) =>
                  setForm({ ...form, cost: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
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

            <Button
              disabled={editing ? !canEdit : !canCreate}
              onClick={() => (editing ? canEdit : canCreate) && saveForm()}
            >
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
