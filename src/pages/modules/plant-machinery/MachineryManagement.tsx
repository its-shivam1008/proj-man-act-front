import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  createMachinery,
  updateMachinery,
  deleteMachinery,
  fetchMachineries,
} from "@/redux/slices/plantandmachinary/machinerySlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { Save, Plus, Edit2, Trash2, Search, X, ShieldAlert, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx"; // Requires: npm install xlsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------- TYPES ----------
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
  supplier?: string;
  warranty?: string;
  purchaseDate?: string;
  cost?: number;
  quantity?: number;
  unitCost?: number;
  totalAmount?: number;
  category?: string;
  serialNumber?: string;
  location?: string | { _id: string, name: string };
  capacity?: string;
  powerRating?: string;
  operatingHours?: number;
  frequency?: string;
  insurance?: string;
  depreciation?: string;
  status?: string;
  documents?: StoredFile[];
  createdAt: string;
  allocatedQuantity?: number;
  availableQuantity?: number;
}

interface ImportSummary {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

// ---------- HELPERS ----------
function generateMachineryCode(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `MCH-${year}-${suffix}`;
}

function generateUniqueMachineryCode(): string {
  const year = new Date().getFullYear();
  const uniqueSuffix = Date.now().toString().slice(-6); 
  const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  return `MCH-${year}-${uniqueSuffix}${random}`;
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

  const dispatch = useDispatch<AppDispatch>();
  const machineries = useSelector(
    (state: RootState) => state.machinery.machineries
  );

  // User & Location Data
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations: masterLocations } = useSelector((state: any) => state.masterData);

  const isLocationRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;
  const [locationFilter, setLocationFilter] = useState(isLocationRestricted ? userProfile.location : "All");

  // File Upload & Import States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const getLocationName = (loc: any) => {
    if (!loc) return "N/A";
    if (typeof loc === 'object') return loc.name || "N/A";
    const found = masterLocations.find((l: any) => l._id === loc);
    return found ? found.name : loc; 
  };

  useEffect(() => {
    dispatch(fetchMasterData("location"));
    dispatch(fetchMachineries({ 
        page: 1, 
        limit: 100, 
        location: locationFilter === "All" ? "" : locationFilter 
    }));
  }, [dispatch, locationFilter]);

  // UI states
  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Machinery | null>(null);
  const [form, setForm] = useState<Partial<Machinery>>({
    frequency: "Monthly",
    depreciation: "Straight-line",
    quantity: 1,
    unitCost: 0,
    totalAmount: 0,
    status: "Active",
  });

  // FILTER + SEARCH
  const visible = useMemo(() => {
    let items = [...machineries];
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((it) =>
        [
          it.code,
          it.name,
        ]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q))
      );
    }
    return items;
  }, [machineries, query]);

  // ---------- OPEN ADD ----------
  function openAddDialog() {
    setEditing(null);
    setForm({ 
      code: generateUniqueMachineryCode(),
      frequency: "Monthly", 
      depreciation: "Straight-line",
      quantity: 1,
      unitCost: 0,
      totalAmount: 0,
      location: isLocationRestricted ? userProfile.location : ""
    });
    setIsDialogOpen(true);
  }

  // ---------- OPEN EDIT ----------
  function openEditDialog(machinery: Machinery) {
    setEditing(machinery);
    setForm({ 
        ...machinery, 
        location: typeof machinery.location === 'object' ? (machinery.location as any)._id : machinery.location 
    });
    setIsDialogOpen(true);
  }

  // ---------- SAVE ----------
  async function saveForm() {
    if (!form.name || !form.location || (form.quantity || 0) < 1) {
      toast.error("Please fill Name, Location and Quantity (>0)");
      return;
    }

    try {
      if (editing && editing._id) {
        await dispatch(updateMachinery({ id: editing._id, data: form })).unwrap();
        toast.success("Machinery updated");
      } else {
        const newMachinery: Partial<Machinery> = {
          ...form,
          code: form.code || generateUniqueMachineryCode(),
          createdAt: new Date().toISOString(),
        };
        await dispatch(createMachinery(newMachinery)).unwrap();
        toast.success("Machinery added");
      }
      dispatch(fetchMachineries({ page: 1, limit: 100, location: locationFilter === "All" ? "" : locationFilter }));
      setIsDialogOpen(false);
      setEditing(null);
    } catch (error: any) {
      toast.error(error || "Failed to save machinery");
    }
  }

  // ---------- IMPORT FUNCTIONALITY ----------
  const handleDownloadTemplate = () => {
    // REMOVED Manufacturer and Department
    const headers = [
      ["Machinery ID", "Name", "Category", "Location Name", "Quantity", "Unit Cost", "Capacity"]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Machinery_Import_Template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportSummary(null);
    
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data.length) {
          toast.error("The file appears to be empty.");
          setImporting(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const errorLog: string[] = [];

        for (const [index, row] of (data as any[]).entries()) {
          const rowNum = index + 2; 
          const rowName = row["Name"] || `Row ${rowNum}`;

          try {
             if (!row["Name"]) throw new Error("Missing 'Name' field");

             // Resolve Location
             const locName = row["Location Name"] || row["Location"];
             let locationId = "";

             if (locName) {
               const foundLoc = masterLocations.find((l: any) => 
                  l.name.toLowerCase() === locName.toString().trim().toLowerCase()
               );
               if (foundLoc) locationId = foundLoc._id;
             }

             if (isLocationRestricted) {
                locationId = userProfile.location;
             } else if (!locationId) {
                throw new Error(`Location '${locName || "Empty"}' not found in system.`);
             }

             const quantity = Number(row["Quantity"] || 1);
             const unitCost = Number(row["Unit Cost"] || 0);

             if (quantity < 1) throw new Error("Quantity must be at least 1");

             const machineryId = row["Machinery ID"] || row["MachineryID"] || generateUniqueMachineryCode();

             const payload: Partial<Machinery> = {
               name: row["Name"],
               code: machineryId, 
               category: row["Category"] || "General",
               location: locationId,
               quantity: quantity,
               unitCost: unitCost,
               totalAmount: quantity * unitCost,
               capacity: row["Capacity"]?.toString() || "",
               createdAt: new Date().toISOString(),
               frequency: "Monthly",
               depreciation: "Straight-line",
               status: "Active"
             };

             await dispatch(createMachinery(payload)).unwrap();
             successCount++;

          } catch (err: any) {
             console.error(err);
             failCount++;
             const errMsg = err.message || err || "Unknown Error";
             errorLog.push(`Row ${rowNum} (${rowName}): ${errMsg}`);
          }
        }

        setImportSummary({
          total: data.length,
          success: successCount,
          failed: failCount,
          errors: errorLog
        });

        dispatch(fetchMachineries({ page: 1, limit: 100, location: locationFilter === "All" ? "" : locationFilter }));
      } catch (error) {
        console.error(error);
        toast.error("Failed to parse file.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    };

    reader.readAsBinaryString(file);
  };

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

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Machinery Management</h1>
        
        <div className="flex flex-wrap gap-2">
           <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
           />

           {canCreate && (
             <>
               {/* <Button variant="outline" onClick={handleDownloadTemplate} title="Download Excel Template">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600"/> Template
               </Button> */}
               <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  <Upload className="mr-2 h-4 w-4"/> {importing ? "Importing..." : "Import"}
               </Button>
               <Button onClick={() => openAddDialog()}>
                  <Plus className="mr-2 h-4 w-4" /> Add Machinery
               </Button>
             </>
           )}
        </div>
      </div>

      {/* TABLE CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Machineries</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full md:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by Name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-full md:w-64"
                />
            </div>
            
            <Select
                value={locationFilter}
                onValueChange={setLocationFilter}
                disabled={isLocationRestricted}
            >
                <SelectTrigger className="w-full md:w-[200px]">
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

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Total Qty</TableHead>
                  <TableHead className="text-center">In Use</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visible.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No machineries found.
                        </TableCell>
                    </TableRow>
                ) : (
                    visible.map((machinery) => (
                    <TableRow key={machinery._id}>
                        <TableCell className="font-mono text-xs">{machinery.code}</TableCell>
                        <TableCell className="font-medium">{machinery.name}</TableCell>
                        <TableCell>{machinery.category}</TableCell>
                        <TableCell>{getLocationName(machinery.location)}</TableCell>
                        <TableCell className="text-center font-semibold">{machinery.quantity || 1}</TableCell>
                        <TableCell className="text-center text-orange-600 font-medium">{machinery.allocatedQuantity || 0}</TableCell>
                        <TableCell className="text-center text-green-600 font-bold">
                            {machinery.availableQuantity !== undefined ? machinery.availableQuantity : (machinery.quantity || 1)}
                        </TableCell>

                        <TableCell>
                        <div className="flex gap-2">
                            <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canEdit}
                            onClick={() => canEdit && openEditDialog(machinery)}
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
                                if(window.confirm("Are you sure? This will not delete historical allocations.")) {
                                    dispatch(deleteMachinery(machinery._id));
                                    toast.success("Deleted successfully");
                                }
                            }}
                            >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* IMPORT RESULT DIALOG */}
      {importSummary && (
        <Dialog open={!!importSummary} onOpenChange={(open) => !open && setImportSummary(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Results</DialogTitle>
                    <DialogDescription>
                        Processed {importSummary.total} rows.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                         <div className="flex items-center gap-2 text-green-600">
                             <CheckCircle2 className="h-5 w-5"/>
                             <span className="font-bold">{importSummary.success} Successful</span>
                         </div>
                         <div className="flex items-center gap-2 text-red-600">
                             <AlertTriangle className="h-5 w-5"/>
                             <span className="font-bold">{importSummary.failed} Failed</span>
                         </div>
                     </div>
                     
                     {importSummary.failed > 0 && (
                         <div className="space-y-2">
                             <Label>Failure Details</Label>
                             <ScrollArea className="h-[200px] w-full rounded-md border border-red-200 bg-red-50 p-4">
                                 {importSummary.errors.map((err, i) => (
                                     <div key={i} className="flex items-start gap-2 text-sm text-red-800 mb-2 last:mb-0">
                                         <AlertCircle className="h-4 w-4 mt-0.5 shrink-0"/>
                                         <span>{err}</span>
                                     </div>
                                 ))}
                             </ScrollArea>
                         </div>
                     )}
                </div>
                <DialogFooter>
                    <Button onClick={() => setImportSummary(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Machinery" : "Add Machinery"}
            </DialogTitle>
          </DialogHeader>

          {/* FORM FIELDS */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            style={{
              pointerEvents: editing ? (canEdit ? "auto" : "none") : (canCreate ? "auto" : "none"),
              opacity: editing ? (canEdit ? 1 : 0.6) : (canCreate ? 1 : 0.6),
            }}
          >
            <div>
              <Label>Machinery ID</Label>
              <Input
                value={form.code || ""}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Auto-generated if empty"
              />
              <p className="text-xs text-muted-foreground">Unique ID (e.g., MCH-2026-X83)</p>
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
                value={form.location as string}
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
              <Label>Total Quantity Owned *</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity || ""}
                onChange={(e) => {
                  const quantity = parseFloat(e.target.value) || 0;
                  const unitCost = form.unitCost || 0;
                  setForm({ 
                    ...form, 
                    quantity,
                    totalAmount: quantity * unitCost
                  });
                }}
                placeholder="1"
              />
            </div>

            <div>
              <Label>Unit Cost</Label>
              <Input
                type="number"
                value={form.unitCost || ""}
                onChange={(e) => {
                  const unitCost = parseFloat(e.target.value) || 0;
                  const quantity = form.quantity || 0;
                  setForm({ 
                    ...form, 
                    unitCost,
                    totalAmount: quantity * unitCost
                  });
                }}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Total Value</Label>
              <Input
                type="number"
                value={form.totalAmount || 0}
                disabled
                className="bg-gray-100 font-medium"
                placeholder="Auto-calculated"
              />
            </div>
            
            <div>
              <Label>Capacity / Specs</Label>
              <Input
                value={form.capacity || ""}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="e.g. 5 Ton"
              />
            </div>

            {/* DOCUMENTS */}
            <div className="col-span-2">
              <Label>Upload Documents</Label>
              <input
                type="file"
                multiple
                onChange={(e) => handleFileAdd(e.target.files)}
                className="block mt-1 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />

              {(form.documents || []).length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {form.documents?.map((f) => (
                    <div
                      key={f.id}
                      className="border rounded px-2 py-1 text-xs flex items-center gap-2 bg-gray-50"
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