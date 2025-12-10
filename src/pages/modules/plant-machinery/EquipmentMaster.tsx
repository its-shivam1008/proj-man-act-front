import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  createEquipment,
  updateEquipment,
  deleteEquipment,
  fetchEquipments,
} from "@/redux/slices/equipmentSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const canView = usePermission("equipmentMaster", "view");
  const canCreate = usePermission("equipmentMaster", "create");
  const canEdit = usePermission("equipmentMaster", "edit");
  const canDelete = usePermission("equipmentMaster", "delete");
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
  const equipments = useSelector(
    (state: RootState) => state.equipment.equipments
  );

  // [!code ++] User & Location Data
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations: masterLocations } = useSelector((state: any) => state.masterData);

  const isLocationRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;
  const [locationFilter, setLocationFilter] = useState(isLocationRestricted ? userProfile.location : "All");

  // [!code ++] Helper
  const getLocationName = (loc: string | { name: string } | undefined) => {
    if (!loc) return "N/A";
    if (typeof loc === 'object') return loc.name || "N/A";
    const found = masterLocations.find((l: any) => l._id === loc);
    return found ? found.name : loc; // Fallback to string if not found
  };

  useEffect(() => {
    dispatch(fetchMasterData("location")); // [!code ++]
    dispatch(fetchEquipments({ 
        page: 1, 
        limit: 100, 
        location: locationFilter === "All" ? "" : locationFilter, // [!code ++]
        organisationId: localStorage.getItem("organisationId") || ""
    }));
  }, [dispatch, locationFilter]); // [!code ++] Depend on filter

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

  // // FETCH FROM BACKEND ONLY
  // useEffect(() => {
  //   dispatch(fetchEquipments({ page: 1, limit: 100 }));
  // }, [dispatch]);

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
          it.department
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
    setForm({ frequency: "Monthly", depreciation: "Straight-line", location: isLocationRestricted ? userProfile.location : ""});
    setIsDialogOpen(true);
  }

  // ---------- OPEN EDIT ----------
  function openEditDialog(eq: Equipment) {
    setEditing(eq);
    setForm({ ...eq, location: typeof eq.location === 'object' ? (eq.location as any)._id : eq.location });
    setIsDialogOpen(true);
  }

  // ---------- SAVE ----------
  async function saveForm() {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    if (!form.location) {
      toast.error("Location is required");
      return;
    }

    try {
      // UPDATE ---------------------
      if (editing && editing._id) {
        await dispatch(
          updateEquipment({
            id: editing._id,
            data: form,
          })
        ).unwrap();
        toast.success("Equipment updated");
      }

      // CREATE ---------------------
      else {
        const newEq: Partial<Equipment> = {
          ...form,
          code: form.code || generateEquipmentCode(),
          createdAt: new Date().toISOString(),
        };

        await dispatch(createEquipment(newEq)).unwrap();
        toast.success("Equipment added");
      }

      // Refetch to ensure table is updated
      dispatch(fetchEquipments({ page: 1, limit: 100 }));

      setIsDialogOpen(false);
      setEditing(null);
      setForm({ frequency: "Monthly", depreciation: "Straight-line" });
    } catch (error: any) {
      toast.error(error || "Failed to save equipment");
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
        <h1 className="text-2xl font-bold">Equipment Registration</h1>
        <Button
          disabled={!canCreate}
          onClick={() => canCreate && openAddDialog()}
          className={!canCreate ? "opacity-50 cursor-not-allowed" : ""}
        >
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
            <Select
            value={locationFilter}
            onValueChange={setLocationFilter}
            disabled={isLocationRestricted}
         >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Locations</SelectItem>
              {masterLocations.map((l: any) => (
                <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
         </Select>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visible.map((eq) => (
                  <TableRow key={eq._id}>
                    <TableCell>{eq.code}</TableCell>
                    <TableCell>{eq.name}</TableCell>
                    <TableCell>{eq.category}</TableCell>
                    <TableCell>{getLocationName(eq.location)}</TableCell>
                    <TableCell>{eq.cost ? `₹${eq.cost.toLocaleString()}` : '-'}</TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canEdit}
                          onClick={() => canEdit && openEditDialog(eq)}
                          className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                        >

                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canDelete}
                          onClick={() => {
                            if (!canDelete) return;
                            if (!eq._id) {
                              toast.error("This item is not saved on server");
                              return;
                            }
                            dispatch(deleteEquipment(eq._id));
                            toast.success("Deleted successfully");
                          }}
                          className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
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
          <div
            className="grid grid-cols-2 gap-4"
            style={{
              pointerEvents: editing ? (canEdit ? "auto" : "none") : (canCreate ? "auto" : "none"),
              opacity: editing ? (canEdit ? 1 : 0.6) : (canCreate ? 1 : 0.6),
            }}
          >
            <div>
              <Label>Equipment ID</Label>
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
              <Label>Location *</Label>
              <Select
                value={form.location}
                onValueChange={(v) => setForm({ ...form, location: v })}
                disabled={isLocationRestricted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {masterLocations.map((l: any) => (
                    <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cost</Label>
              <Input
                type="number"
                value={form.cost || ""}
                onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
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
