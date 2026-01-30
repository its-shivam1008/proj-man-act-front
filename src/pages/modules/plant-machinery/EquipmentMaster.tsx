import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  createEquipment,
  updateEquipment,
  deleteEquipment,
  fetchEquipments,
  fetchEquipmentChildren,
} from "@/redux/slices/equipmentSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { Save, Eye, Plus, Edit2, Trash2, Search, X, ShieldAlert, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, ChevronRight, File } from "lucide-react";
import * as XLSX from "xlsx";

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
import { Badge } from "@/components/ui/badge";
import { fetchInventoryMaster } from "@/redux/slices/inventoryMasterSlice";
// import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// ---------- TYPES ----------
interface StoredFile {
  id?: string; // Add ID for local management
  name: string;
  type: string;
  size: number;
  url: string;
  publicId?: string;
  rawFile?: File; // <--- ADD THIS: To store the actual file for upload
}
interface Equipment {
  _id?: string;
  code: string;
  name: string;
  model?: string;
  manufacturer?: string;
  supplier?: string;
  warranty?: string;
  category?: string;
  serialNumber?: string;
  location?: string | { _id: string; name: string };
  capacity?: string;
  quantity?: number;

  // Pricing & GST
  basicCost?: number;
  cgst?: number;
  igst?: number;
  sgst?: number;
  totalCost?: number;
  cost?: number; // Legacy

  // Dates
  purchaseDate?: string;
  invoiceNumber?: string;

  // Maintenance
  frequency?: string;
  insurance?: string;
  depreciation?: string;
  documents?: StoredFile[];
  createdAt: string;

  // Allocation tracking
  allocatedQuantity?: number;
  availableQuantity?: number;
  hasChildren?: boolean;

  // Parent-Child
  isParent?: boolean;
  parentId?: string;
  childIndex?: number;
  allocationStatus?: string;
  allocatedTo?: {
    projectName?: string;
    siteName?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface ImportSummary {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

// ---------- HELPERS ----------
function generateEquipmentCode(): string {
  const year = new Date().getFullYear();
  const uniqueSuffix = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  return `EQP-${year}-${uniqueSuffix}${random}`;
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
export default function EquipmentMasterPage() {
  const canView = usePermission("equipmentMaster", "view");
  const canCreate = usePermission("equipmentMaster", "create");
  const canEdit = usePermission("equipmentMaster", "edit");
  const canDelete = usePermission("equipmentMaster", "delete");

  const [viewEquipment, setViewEquipment] = useState<Equipment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [imagePreview, setImagePreview] = useState<{
    url: string;
    name: string;
  } | null>(null);

  function isImage(doc: any) {
    // Cloudinary image URL
    if (doc.url?.includes("/image/upload/")) return true;

    // Fallback: check name extension
    return /\.(png|jpe?g|webp|gif)$/i.test(doc.name || "");
  }


  function handleViewDocument(doc: any) {
    if (isImage(doc)) {
      setImagePreview({
        url: doc.url,
        name: doc.name,
      });
    }
  }


  const dispatch = useDispatch<AppDispatch>();
  const { equipments, page, total, limit } = useSelector((state: RootState) => state.equipment);
  const totalPages = Math.ceil(total / limit) || 1;

  const { category, supplier } = useSelector(
    (state: RootState) => state.inventoryMaster
  );
  useEffect(() => {
    dispatch(fetchInventoryMaster({ type: "category", page: 1, limit: 100 }));
    dispatch(fetchInventoryMaster({ type: "supplier", page: 1, limit: 100 }));
  }, [dispatch]);

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
  async function downloadFile(url: string, name: string, type?: string) {
    const res = await fetch(url);
    const blob = await res.blob();

    let finalName = name;

    // Fix missing extension
    if (!/\.[a-z0-9]+$/i.test(name)) {
      if (blob.type === "application/pdf") finalName += ".pdf";
      else if (blob.type.startsWith("image/")) {
        const ext = blob.type.split("/")[1];
        finalName += `.${ext}`;
      }
    }

    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }



  useEffect(() => {
    dispatch(fetchMasterData("location"));
    dispatch(fetchEquipments({
      page: 1,
      limit: 10,
      location: locationFilter === "All" ? "" : locationFilter
    }));
  }, [dispatch, locationFilter]);

  // UI states
  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [childrenData, setChildrenData] = useState<Record<string, Equipment[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const [form, setForm] = useState<Partial<Equipment>>({
    frequency: "Monthly",
    depreciation: "Straight-line",
    quantity: 1,
    basicCost: 0,
    cgst: 0,
    igst: 0,
    sgst: 0,
    totalCost: 0,
  });

  // Toggle row expansion and fetch children
  const toggleRowExpansion = async (equipmentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(equipmentId)) {
      newExpanded.delete(equipmentId);
    } else {
      newExpanded.add(equipmentId);
      // Fetch children if not already loaded
      if (!childrenData[equipmentId]) {
        setLoadingChildren(prev => new Set(prev).add(equipmentId));
        try {
          const result = await dispatch(fetchEquipmentChildren(equipmentId)).unwrap();
          setChildrenData(prev => ({ ...prev, [equipmentId]: result.children || [] }));
        } catch (error) {
          console.error("Failed to fetch children:", error);
          toast.error("Failed to load child equipment");
        } finally {
          setLoadingChildren(prev => {
            const newSet = new Set(prev);
            newSet.delete(equipmentId);
            return newSet;
          });
        }
      }
    }
    setExpandedRows(newExpanded);
  };

  // Auto-calculate total cost
  useEffect(() => {
    const total = (form.basicCost || 0) + (form.cgst || 0) + (form.igst || 0) + (form.sgst || 0);
    setForm(prev => ({ ...prev, totalCost: total }));
  }, [form.basicCost, form.cgst, form.igst, form.sgst]);

  // FILTER + SEARCH
  const visible = useMemo(() => {
    let items = [...equipments];
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((it) =>
        [it.code, it.name, it.model]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q))
      );
    }
    return items;
  }, [equipments, query]);

  // ---------- OPEN ADD ----------
  function openAddDialog() {
    setEditing(null);
    setForm({
      code: generateEquipmentCode(),
      frequency: "Monthly",
      depreciation: "Straight-line",
      quantity: 1,
      basicCost: 0,
      cgst: 0,
      igst: 0,
      sgst: 0,
      totalCost: 0,
      location: isLocationRestricted ? userProfile.location : ""
    });
    setIsDialogOpen(true);
  }

  // ---------- OPEN EDIT ----------
  function openEditDialog(equipment: Equipment) {
    const matchedSupplier = supplier.find(
      (s: any) => s.name === equipment.supplier
    );

    setEditing(equipment);
    setForm({
      ...equipment,
      supplier: matchedSupplier?._id, // ✅ STRING → ID
      location:
        typeof equipment.location === "object"
          ? (equipment.location as any)._id
          : equipment.location,
    });

    setIsDialogOpen(true);
  }

  // ---------- SAVE ----------
  // In EquipmentMaster.tsx
  async function saveForm() {
    if (!form.name || !form.location || (form.quantity || 0) < 1) {
      toast.error("Please fill Name, Location and Quantity");
      return;
    }

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "documents" && Array.isArray(value)) {
          value.forEach((file: File) => {
            fd.append("documents", file);
          });
        } else if (value !== undefined && value !== null) {
          fd.append(key, String(value));
        }
      });

      if (editing?._id) {
        await dispatch(updateEquipment({ id: editing._id, data: fd })).unwrap();
        toast.success("Equipment updated");
      } else {
        await dispatch(createEquipment(fd)).unwrap();
        toast.success("Equipment added");
      }

      setIsDialogOpen(false);
      setEditing(null);
      dispatch(fetchEquipments({ page: 1, limit: 10 }));
    } catch (err) {
      toast.error("Failed to save equipment");
    }
  }



  // ---------- IMPORT FUNCTIONALITY ----------
  const handleDownloadTemplate = () => {
    const headers = [
      [
        "Equipment ID",
        "Name",
        "Model",
        "Category",
        "Location Name",
        "Quantity",
        "Basic Cost",
        "CGST",
        "IGST",
        "SGST",
        "Invoice Number",
        "Purchase Date",
        "Supplier",
        "Manufacturer",
        "Warranty"
      ]
    ];
    // Add example row
    const exampleRow = [
      "EQP-2026-0001 (Optional)",
      "Power Drill (Required)",
      "XDR-500",
      "Hand Tools",
      "Main Site (Required)",
      "1 (Required)",
      "25000",
      "2250",
      "0",
      "2250",
      "INV-001",
      "2026-01-15",
      "Tool Suppliers Ltd",
      "Bosch",
      "1 Year"
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers[0], exampleRow]);

    // Set column widths
    ws['!cols'] = headers[0].map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(wb, ws, "Equipment_Template");
    XLSX.writeFile(wb, "Equipment_Import_Template.xlsx");
    toast.success("Template downloaded! Fields marked (Required) are mandatory.");
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
          const missingFields: string[] = [];

          try {
            // Check required fields
            if (!row["Name"]) missingFields.push("Name");

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
            } else if (!locationId && !isLocationRestricted) {
              missingFields.push("Location Name");
            }

            const quantity = Number(row["Quantity"] || 0);
            if (quantity < 1) missingFields.push("Quantity (must be >= 1)");

            // If any required fields missing, throw error with details
            if (missingFields.length > 0) {
              throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
            }

            // Parse optional numeric fields (default to 0 if empty)
            const basicCost = Number(row["Basic Cost"]) || 0;
            const cgst = Number(row["CGST"]) || 0;
            const igst = Number(row["IGST"]) || 0;
            const sgst = Number(row["SGST"]) || 0;

            // Parse optional date fields
            const parseDate = (val: any) => {
              if (!val) return "";
              const d = new Date(val);
              return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
            };

            const equipmentId = row["Equipment ID"] || row["EquipmentID"] || generateEquipmentCode();
            const supplierName = row["Supplier"];
            const matchedSupplier = supplier.find(
              (s: any) =>
                s.name.toLowerCase() === supplierName?.toString().toLowerCase()
            );
            const categoryName = row['Category'];
            const matchedCategory = category.find((c: any) =>
              c.name.toLowerCase() === categoryName?.toString().toLoswerCase())

            const payload: Partial<Equipment> = {
              name: row["Name"],
              code: equipmentId,
              model: row["Model"] || "",
              category: matchedCategory,
              location: locationId,
              quantity: quantity,
              basicCost,
              cgst,
              igst,
              sgst,
              totalCost: basicCost + cgst + igst + sgst,
              invoiceNumber: row["Invoice Number"] || "",
              purchaseDate: parseDate(row["Purchase Date"]),
              supplier: matchedSupplier?._id || undefined,
              manufacturer: row["Manufacturer"] || "",
              warranty: row["Warranty"] || "",
              createdAt: new Date().toISOString(),
              frequency: "Monthly",
              depreciation: "Straight-line",
            };

            await dispatch(createEquipment(payload)).unwrap();
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

        dispatch(fetchEquipments({ page: 1, limit: 100, location: locationFilter === "All" ? "" : locationFilter }));
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
  // In EquipmentMaster.tsx

  async function handleFileAdd(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);

    const converted = await Promise.all(
      arr.map(async (f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        type: f.type,
        size: f.size,
        url: await fileToDataUrl(f),
        publicId: "",
        rawFile: f, // <--- IMPORTANT: Store the original file here!
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
        <h1 className="text-2xl font-bold">Equipment Master</h1>

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
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Template
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                <Upload className="mr-2 h-4 w-4" /> {importing ? "Importing..." : "Import"}
              </Button>
              <Button onClick={() => openAddDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Add Equipment
              </Button>
            </>
          )}
        </div>
      </div>

      {/* TABLE CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Equipment</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Name, Model..."
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
                  <TableHead>Model</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Total Qty</TableHead>
                  <TableHead className="text-center">In Use</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No equipment found.
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((equipment) => (
                    <React.Fragment key={equipment._id}>
                      <TableRow
                        className={equipment.hasChildren ? "cursor-pointer hover:bg-gray-50" : ""}
                        onClick={() => equipment.hasChildren && equipment._id && toggleRowExpansion(equipment._id)}
                      >
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-1">
                            {equipment.hasChildren && (
                              expandedRows.has(equipment._id || "")
                                ? <ChevronDown className="w-4 h-4 text-blue-500" />
                                : <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            {equipment.code}
                            {equipment.hasChildren && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {equipment.quantity || 1} units
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{equipment.name}</TableCell>
                        <TableCell>{equipment.model || "-"}</TableCell>
                        <TableCell>
                          {category.find((c: any) => c._id === equipment.category)?.name || "-"}
                        </TableCell>

                        <TableCell>{getLocationName(equipment.location)}</TableCell>
                        <TableCell className="text-center font-semibold">{equipment.quantity || 1}</TableCell>
                        <TableCell className="text-center text-orange-600 font-medium">{equipment.allocatedQuantity || 0}</TableCell>
                        <TableCell className="text-center text-green-600 font-bold">
                          {equipment.availableQuantity !== undefined ? equipment.availableQuantity : (equipment.quantity || 1)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{(equipment.totalCost || equipment.cost || 0).toLocaleString()}
                        </TableCell>

                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div
                            className="flex gap-2"
                            onClick={(e) => e.stopPropagation()} // 🔥 IMPORTANT
                          >
                            {/* 👁 VIEW DETAILS */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setViewEquipment(equipment);
                                setViewModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 text-indigo-600" />
                            </Button>

                            {/* 📎 VIEW DOCUMENTS */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEquipment(equipment);
                                setDocModalOpen(true);
                              }}
                            >
                              <File className="w-4 h-4 text-blue-600" />
                            </Button>

                            {/* ✏️ EDIT */}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canEdit}
                              onClick={() => canEdit && openEditDialog(equipment)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {/* 🗑 DELETE */}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canDelete}
                              onClick={() => {
                                if (!equipment._id) return;
                                if (window.confirm("Delete this equipment?")) {
                                  dispatch(deleteEquipment(equipment._id));
                                  toast.success("Deleted successfully");
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>

                        </TableCell>

                      </TableRow>

                      {/* Expanded Children Rows */}
                      {expandedRows.has(equipment._id || "") && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={10} className="p-0">
                            <div className="p-4 pl-10">
                              {loadingChildren.has(equipment._id || "") ? (
                                <div className="text-center py-4 text-gray-500">Loading children...</div>
                              ) : childrenData[equipment._id || ""]?.length > 0 ? (
                                <div className="border rounded-md overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-gray-100">
                                        <TableHead className="text-xs">Child ID</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                        <TableHead className="text-xs">Allocated To</TableHead>
                                        <TableHead className="text-xs">Duration</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {childrenData[equipment._id || ""]?.map((child) => {
                                        console.log("child ====>", child);
                                        return (
                                          <TableRow key={child._id} className="text-sm">
                                            <TableCell className="font-mono text-xs">{child.code}</TableCell>
                                            <TableCell>
                                              <Badge
                                                variant={child.allocationStatus === "allocated" ? "destructive" : "outline"}
                                                className={child.allocationStatus === "available" ? "bg-green-100 text-green-700" : ""}
                                              >
                                                {child.allocationStatus === "allocated" ? "In Use" : "Available"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>
                                              {child.allocatedTo?.projectName || "-"}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                              {child.allocatedTo?.startDate && child.allocatedTo?.endDate
                                                ? `${new Date(child.allocatedTo.startDate).toLocaleDateString()} to ${new Date(child.allocatedTo.endDate).toLocaleDateString()}`
                                                : "-"
                                              }
                                            </TableCell>
                                          </TableRow>
                                        )
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">No child units found.</div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} / {totalPages} (Total: {total || 0})
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(fetchEquipments({
                  page: Math.max(1, page - 1),
                  limit,
                  location: locationFilter === "All" ? "" : locationFilter
                }))}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(fetchEquipments({
                  page: Math.min(totalPages, page + 1),
                  limit,
                  location: locationFilter === "All" ? "" : locationFilter
                }))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
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
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-bold">{importSummary.success} Successful</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-bold">{importSummary.failed} Failed</span>
                </div>
              </div>

              {importSummary.failed > 0 && (
                <div className="space-y-2">
                  <Label>Failure Details</Label>
                  <ScrollArea className="h-[200px] w-full rounded-md border border-red-200 bg-red-50 p-4">
                    {importSummary.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-800 mb-2 last:mb-0">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Equipment" : "Add Equipment"}
            </DialogTitle>
          </DialogHeader>

          {/* FORM FIELDS */}
          <div
            className="space-y-6"
            style={{
              pointerEvents: editing ? (canEdit ? "auto" : "none") : (canCreate ? "auto" : "none"),
              opacity: editing ? (canEdit ? 1 : 0.6) : (canCreate ? 1 : 0.6),
            }}
          >
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Equipment ID</Label>
                <Input
                  value={form.code || ""}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
                <p className="text-xs text-muted-foreground">Unique ID (e.g., EQP-2026-X83)</p>
              </div>

              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Model</Label>
                <Input
                  value={form.model || ""}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>

                <Select
                  value={form.category ?? undefined}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>

                  <SelectContent>
                    {category?.map((cat: any) => (
                      <SelectItem
                        key={cat._id}
                        value={cat._id}   // ✅ NEVER empty string
                      >
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Total Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity || ""}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">Creates individual units if &gt; 1</p>
              </div>
            </div>

            {/* Purchase & Invoice */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-gray-700">Purchase Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Date of Purchase</Label>
                  <Input
                    type="date"
                    value={form.purchaseDate ? form.purchaseDate.toString().split('T')[0] : ""}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Invoice Number</Label>
                  <Input
                    value={form.invoiceNumber || ""}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    placeholder="INV-XXXX"
                  />
                </div>
                <div>
                  <Label>Supplier</Label>

                  <Select
                    value={form.supplier ?? undefined}
                    onValueChange={(v) => setForm({ ...form, supplier: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>

                    <SelectContent>
                      {supplier?.map((sup: any) => (
                        <SelectItem key={sup._id} value={sup._id}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
            </div>

            {/* Pricing & GST */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-gray-700">Pricing & GST</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label>Basic Cost (₹)</Label>
                  <Input
                    type="number"
                    value={form.basicCost || ""}
                    onChange={(e) => setForm({ ...form, basicCost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>CGST (₹)</Label>
                  <Input
                    type="number"
                    value={form.cgst || ""}
                    onChange={(e) => setForm({ ...form, cgst: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>IGST (₹)</Label>
                  <Input
                    type="number"
                    value={form.igst || ""}
                    onChange={(e) => setForm({ ...form, igst: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>SGST (₹)</Label>
                  <Input
                    type="number"
                    value={form.sgst || ""}
                    onChange={(e) => setForm({ ...form, sgst: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Total Cost (₹)</Label>
                  <Input
                    type="number"
                    value={form.totalCost || 0}
                    disabled
                    className="bg-green-50 font-bold text-green-700"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-gray-700">Additional Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Serial Number</Label>
                  <Input
                    value={form.serialNumber || ""}
                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Manufacturer</Label>
                  <Input
                    value={form.manufacturer || ""}
                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Warranty</Label>
                  <Input
                    value={form.warranty || ""}
                    onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                    placeholder="e.g. 2 Years"
                  />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    value={form.capacity || ""}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* DOCUMENTS */}
            {/* DOCUMENTS */}
            <div className="border-t pt-4">
              <Label>Upload Documents</Label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  setForm(prev => ({
                    ...prev,
                    documents: files // This stores the actual File objects
                  }));
                }}
                className="block mt-1 w-full text-sm"
              />

              {/* Only show the list if there are files selected */}
              {form.documents && form.documents.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {form.documents.map((f: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 border rounded px-2 py-1 text-xs bg-muted"
                    >
                      <span className="truncate max-w-[150px]">{f.name}</span>
                      <X
                        className="h-3 w-3 cursor-pointer text-destructive"
                        onClick={() => {
                          // Logic to remove a specific file if needed
                          setForm(prev => ({
                            ...prev,
                            documents: prev.documents.filter((_: any, index: number) => index !== i)
                          }));
                        }}
                      />
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

      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Equipment Documents</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {selectedEquipment?.documents
              ?.filter(Boolean)
              .map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  {/* FILE INFO */}
                  <div className="text-sm">
                    <p className="font-medium truncate max-w-[220px]">
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(doc.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-3">
                    {/* VIEW → ONLY FOR IMAGES */}
                    {isImage(doc) && (
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="text-blue-600 text-sm underline"
                      >
                        View
                      </button>
                    )}


                    {/* DOWNLOAD → ALWAYS */}
                    <button
                      onClick={() => downloadFile(doc.url, doc.name, doc.type)}
                      className="text-green-600 text-sm underline"
                    >
                      Download
                    </button>
                  </div>

                </div>
              ))}

            {!selectedEquipment?.documents?.length && (
              <p className="text-sm text-muted-foreground">
                No documents uploaded.
              </p>
            )}
          </div>



          <DialogFooter>
            <Button onClick={() => setDocModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Equipment Details</DialogTitle>
            <DialogDescription>
              Read-only view of equipment information
            </DialogDescription>
          </DialogHeader>

          {viewEquipment && (
            <div className="space-y-6 text-sm">

              {/* BASIC INFO */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><b>Code:</b> {viewEquipment.code}</div>
                  <div><b>Name:</b> {viewEquipment.name}</div>
                  <div><b>Model:</b> {viewEquipment.model || "-"}</div>
                  <div>
                    <b>Category:</b>{" "}
                    {category.find((c: any) => c._id === viewEquipment.category)?.name || "-"}
                  </div>
                  <div><b>Location:</b> {getLocationName(viewEquipment.location)}</div>
                  <div>
                    <b>Status:</b>{" "}
                    <Badge variant="outline">
                      {viewEquipment.allocationStatus || "Available"}
                    </Badge>
                  </div>
                </div>
              </section>

              {/* QUANTITY */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">Quantity</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><b>Total:</b> {viewEquipment.quantity || 0}</div>
                  <div><b>Allocated:</b> {viewEquipment.allocatedQuantity || 0}</div>
                  <div>
                    <b>Available:</b>{" "}
                    {viewEquipment.availableQuantity ??
                      (viewEquipment.quantity || 0) - (viewEquipment.allocatedQuantity || 0)}
                  </div>
                </div>
              </section>

              {/* PRICING */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Pricing
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>Basic Cost: ₹{viewEquipment.basicCost || 0}</div>
                  <div>CGST: ₹{viewEquipment.cgst || 0}</div>
                  <div>SGST: ₹{viewEquipment.sgst || 0}</div>
                  <div className="font-bold text-green-700">
                    Total: ₹{viewEquipment.totalCost || 0}
                  </div>
                </div>
              </section>

              {/* PURCHASE INFO */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Purchase Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <b>Invoice No:</b> {viewEquipment.invoiceNumber || "-"}
                  </div>
                  <div>
                    <b>Purchase Date:</b>{" "}
                    {viewEquipment.purchaseDate
                      ? new Date(viewEquipment.purchaseDate).toLocaleDateString()
                      : "-"}
                  </div>
                  <div>
                    <b>Supplier:</b> {viewEquipment.supplier || "-"}
                  </div>
                </div>
              </section>

              {/* DOCUMENTS */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">Documents</h4>
                {viewEquipment.documents?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {viewEquipment.documents.map((doc: any, index: number) => (
                      <Badge key={doc.publicId || index} variant="outline">
                        {doc.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No documents uploaded</p>
                )}
              </section>

            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog
        open={!!imagePreview}
        onOpenChange={() => setImagePreview(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imagePreview?.name}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center">
            <img
              src={imagePreview?.url}
              alt={imagePreview?.name}
              className="max-h-[70vh] rounded-md"
            />
          </div>

          <DialogFooter>
            <Button onClick={() => setImagePreview(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>





    </div>
  );
}