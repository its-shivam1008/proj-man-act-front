import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  createMachinery,
  updateMachinery,
  deleteMachinery,
  fetchMachineries,
  fetchMachineryChildren,
} from "@/redux/slices/plantandmachinary/machinerySlice";
// fetchInventoryMaster
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { Save, Eye, Plus, Edit2, Trash2, Search, X, ShieldAlert, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
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
import { fetchPlantMachineryMaster } from "@/redux/slices/plantandmachinary/plantMachineryMasterSlice";
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
// import { fetchInventoryMaster } from "@/redux/slices/inventoryMasterSlice";
import {
  fetchPendingMachineryRequests,
  approveResourceAllocation,
  rejectResourceAllocation,
} from "@/redux/slices/resourceSlice";

// ---------- TYPES ----------
export interface StoredFile {
  id?: string;
  name: string;
  type: string;
  size: number;
  url: string;
  publicId?: string;
  rawFile?: File; // frontend only
}
interface MachineAllocation {
  _id: string;
  machineryId: string;
  machineryName: string;
  projectName: string;
  wbsName: string;
  quantity: number;
  startDate: string;
  endDate: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";

  assetType: "equipment" | "machinery";
  assetId: string;
  assetCode: string;

}

interface Machinery {
  _id?: string;
  code: string;
  name: string;
  supplier?: string;
  warranty?: string;
  category?: string;
  location?: string | { _id: string, name: string };
  capacity?: string;
  powerRating?: string;
  operatingHours?: number;
  quantity?: number;

  // Pricing & GST
  basicCost?: number;
  cgst?: number;
  igst?: number;
  sgst?: number;
  totalCost?: number;
  unitCost?: number; // Legacy
  totalAmount?: number; // Legacy

  // Dates
  purchaseDate?: string;
  invoiceNumber?: string;
  insuranceDate?: string;
  insuranceExpiry?: string;
  insurance?: string; // Legacy
  puDate?: string;
  puDateExpiry?: string;
  vTaxPayment?: number;

  // Maintenance
  frequency?: string;
  depreciation?: string;
  status?: string;
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
  pendingMachineryRequeststatus?: string;
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

  // View Documents Modal
  const [viewDocsOpen, setViewDocsOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<StoredFile[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  // View Details Modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Machinery | null>(null);

  const { pendingMachinery } = useSelector(
    (state: RootState) => state.resources
  );
  useEffect(() => {
    console.log("🔄 [Component] Redux State - pendingMachinery:", pendingMachinery);
    if (pendingMachinery?.length === 0) {
      console.warn("⚠️ [Component] pendingMachinery is empty. Check if API returned data or if status is PENDING.");
    }
  }, [pendingMachinery]);
  function openViewDetails(item: Machinery) {
    setViewItem(item);
    setViewOpen(true);
  }

  const dispatch = useDispatch<AppDispatch>();
  const { machineries, page, total, limit } = useSelector(
    (state: RootState) => state.machinery
  );
  const totalPages = Math.ceil(total / limit) || 1;
  const { category, supplier } = useSelector(
    (state: RootState) => state.plantMachineryMaster
  );

  // Access the machinery-specific category list and the supplier list
  const categoryList = category.machinery ?? [];
  const supplierList = supplier ?? [];

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
      limit: 10,
      location: locationFilter === "All" ? "" : locationFilter
    }));
  }, [dispatch, locationFilter]);
  const formatDate = (date?: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  };

  // UI states
  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Machinery | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [childrenData, setChildrenData] = useState<Record<string, Machinery[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<MachineAllocation | null>(null);
  const [rejectReason, setRejectReason] = useState("");


  const handleApprove = async (allocationId: string) => {
    try {
      await dispatch(approveResourceAllocation(allocationId)).unwrap();
      toast.success("Machine request approved");
      dispatch(fetchMachineries({ page, limit, location: locationFilter === "All" ? "" : locationFilter }));
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleReject = async () => {
    if (!selectedAllocation) return;

    try {
      await dispatch(
        rejectResourceAllocation({
          allocationId: selectedAllocation._id,
          reason: rejectReason,
        })
      ).unwrap();

      toast.success("Machine request rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedAllocation(null);
    } catch {
      toast.error("Rejection failed");
    }
  };


  const [form, setForm] = useState<Partial<Machinery>>({
    assetType: "machinery",   // 👈 REQUIRED
    assetId: undefined,       // 👈 set when user selects asset
    assetCode: "",            // 👈 set when asset is chosen

    frequency: "Monthly",
    depreciation: "Straight-line",
    quantity: 1,
    basicCost: 0,
    cgst: 0,
    igst: 0,
    sgst: 0,
    totalCost: 0,
    vTaxPayment: 0,
    status: "Active",
  });

  // Toggle row expansion and fetch children
  const toggleRowExpansion = async (machineryId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(machineryId)) {
      newExpanded.delete(machineryId);
    } else {
      newExpanded.add(machineryId);
      // Fetch children if not already loaded
      if (!childrenData[machineryId]) {
        setLoadingChildren(prev => new Set(prev).add(machineryId));
        try {
          const result = await dispatch(fetchMachineryChildren(machineryId)).unwrap();
          setChildrenData(prev => ({ ...prev, [machineryId]: result.children || [] }));
        } catch (error) {
          console.error("Failed to fetch children:", error);
          toast.error("Failed to load child machines");
        } finally {
          setLoadingChildren(prev => {
            const newSet = new Set(prev);
            newSet.delete(machineryId);
            return newSet;
          });
        }
      }
    }
    setExpandedRows(newExpanded);
  };
  useEffect(() => {
    dispatch(fetchPendingMachineryRequests());
    dispatch(fetchMachineries());
  }, [dispatch]);
  // useEffect(() => {
  //   dispatch(
  //     fetchInventoryMaster({
  //       type: "category",
  //       page: 1,
  //       limit: 100,
  //     })
  //   );
  //   dispatch(
  //     fetchInventoryMaster({
  //       type: "supplier",
  //       page: 1,
  //       limit: 100,
  //     })
  //   );
  // }, [dispatch]);

  // Auto-calculate total cost
  useEffect(() => {
    const total = (form.basicCost || 0) + (form.cgst || 0) + (form.igst || 0) + (form.sgst || 0);
    setForm(prev => ({ ...prev, totalCost: total }));
  }, [form.basicCost, form.cgst, form.igst, form.sgst]);

  // FILTER + SEARCH
  const visible = useMemo(() => {
    let items = [...machineries];

    if (query.trim()) {
      const q = query.toLowerCase();

      items = items.filter((it) =>
        it.name?.toLowerCase().includes(q) ||
        it.code?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [machineries, query]);

  useEffect(() => {
    dispatch(fetchMachineries({ page: 1, limit: 10 }));

    // Fetch Category for 'machinery'
    dispatch(fetchPlantMachineryMaster({
      type: "category",
      categoryFor: "machinery",
      page: 1,
      limit: 100
    }));

    // Fetch Suppliers
    dispatch(fetchPlantMachineryMaster({
      type: "supplier",
      page: 1,
      limit: 100
    }));
  }, [dispatch]);
  // ---------- OPEN ADD ----------
  function openAddDialog() {
    setEditing(null);
    setForm({
      code: generateUniqueMachineryCode(),
      frequency: "Monthly",
      depreciation: "Straight-line",
      quantity: 1,
      basicCost: 0,
      cgst: 0,
      igst: 0,
      sgst: 0,
      totalCost: 0,
      vTaxPayment: 0,
      location: isLocationRestricted ? userProfile.location : ""
    });
    setIsDialogOpen(true);
  }

  // ---------- OPEN EDIT ----------
  function openEditDialog(machinery: Machinery) {
    const matchedCategory = categoryList.find(
      (c: any) => c.name === machinery.category
    );

    const matchedSupplier = supplier.find(
      (s: any) => s.name === machinery.supplier
    );

    setEditing(machinery);
    setForm({
      ...machinery,
      category: matchedCategory?._id,   // category → id
      supplier: matchedSupplier?._id,   // ✅ supplier → id
      location:
        typeof machinery.location === "object"
          ? machinery.location._id
          : machinery.location,
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
    const headers = [
      [
        "Machinery ID",
        "Name",
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
        "Insurance Date",
        "Insurance Expiry",
        "PU Date",
        "PU Date Expiry",
        "V Tax Payment",
        "Capacity",
        "Warranty"
      ]
    ];
    // Add example row
    const exampleRow = [
      "MCH-2026-0001 (Optional)",
      "Excavator (Required)",
      "Heavy Equipment",
      "Main Site (Required)",
      "1 (Required)",
      "500000",
      "45000",
      "0",
      "45000",
      "INV-001",
      "2026-01-15",
      "ABC Suppliers",
      "2026-01-20",
      "2027-01-20",
      "2026-02-01",
      "2027-02-01",
      "5000",
      "5 Ton",
      "2 Years"
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers[0], exampleRow]);

    // Set column widths
    ws['!cols'] = headers[0].map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(wb, ws, "Machinery_Template");
    XLSX.writeFile(wb, "Machinery_Import_Template.xlsx");
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
            const vTaxPayment = Number(row["V Tax Payment"]) || 0;

            // Parse optional date fields
            const parseDate = (val: any) => {
              if (!val) return "";
              const d = new Date(val);
              return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
            };

            const machineryId = row["Machinery ID"] || row["MachineryID"] || generateUniqueMachineryCode();
            const categoryName = row["Category"];
            const matchedCategory = categoryList.find(
              (c: any) =>
                c.name.toLowerCase() === categoryName?.toString().toLowerCase()
            );


            const payload: Partial<Machinery> = {
              name: row["Name"],
              code: machineryId,
              category: matchedCategory?._id || undefined,
              location: locationId,
              quantity: quantity,
              basicCost,
              assetType: "machinery",       // or "equipment"
              assetId: selectedAssetId,     // ObjectId
              assetCode: selectedAssetCode,
              cgst,
              igst,
              sgst,
              totalCost: basicCost + cgst + igst + sgst,
              invoiceNumber: row["Invoice Number"] || "",
              purchaseDate: parseDate(row["Purchase Date"]),
              supplier: row["Supplier"] || "",
              insuranceDate: parseDate(row["Insurance Date"]),
              insuranceExpiry: parseDate(row["Insurance Expiry"]),
              puDate: parseDate(row["PU Date"]),
              puDateExpiry: parseDate(row["PU Date Expiry"]),
              vTaxPayment,
              capacity: row["Capacity"] || "",
              warranty: row["Warranty"] || "",
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
  function isImage(doc: StoredFile) {
    return doc.type?.startsWith("image/");
  }

  function openViewDocuments(docs?: StoredFile[]) {
    if (!docs || docs.length === 0) {
      toast.info("No documents uploaded");
      return;
    }
    setSelectedDocs(docs);
    setViewDocsOpen(true);
  }

  function downloadFile(url: string, name: string) {
    const link = document.createElement("a");
    link.href = url + "?dl=" + encodeURIComponent(name);
    link.setAttribute("download", name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  // ---------- FILES ----------
  async function handleFileAdd(files: FileList | null) {
    if (!files) return;

    const mapped = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file), // preview only
      rawFile: file,                  // 🔥 REQUIRED
    }));

    setForm((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), ...mapped],
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

  const getSupplierName = (id?: string) => {
    if (!id) return "-";
    const sup = supplier.find((s: any) => s._id === id);
    return sup?.name || "-";
  };


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
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Template
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                <Upload className="mr-2 h-4 w-4" /> {importing ? "Importing..." : "Import"}
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
                placeholder="Search by Name or Machinery ID..."
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
            {pendingMachinery?.length > 0 && (
              <Card className="border-orange-300 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="w-5 h-5" />
                    Pending Machine Requests
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machinery</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {pendingMachinery.map((req) => (
                        <TableRow key={req._id}>
                          <TableCell className="font-medium">
                            {req.machineryName}
                          </TableCell>
                          <TableCell>{req.projectName}</TableCell>
                          <TableCell>{req.quantity}</TableCell>
                          <TableCell className="text-xs">
                            {formatDate(req.startDate)} → {formatDate(req.endDate)}
                          </TableCell>

                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(req._id)}
                            >
                              Accept
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedAllocation(req);
                                setRejectDialogOpen(true);
                              }}
                            >
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
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
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No machineries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((machinery) => (
                    <React.Fragment key={machinery._id}>
                      <TableRow
                        className={machinery.hasChildren ? "cursor-pointer hover:bg-gray-50" : ""}
                        onClick={() => machinery.hasChildren && machinery._id && toggleRowExpansion(machinery._id)}
                      >
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-1">
                            {machinery.hasChildren && (
                              expandedRows.has(machinery._id || "")
                                ? <ChevronDown className="w-4 h-4 text-blue-500" />
                                : <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            {machinery.code}
                            {machinery.hasChildren && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {machinery.quantity || 1} units
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{machinery.name}</TableCell>
                        <TableCell>
                          {categoryList.find((c: any) => c._id === machinery.category)?.name || "-"}
                        </TableCell>
                        <TableCell>{getSupplierName(machinery.supplier)}</TableCell>

                        <TableCell>{getLocationName(machinery.location)}</TableCell>
                        <TableCell className="text-center font-semibold">{machinery.quantity || 1}</TableCell>
                        <TableCell className="text-center text-orange-600 font-medium">{machinery.allocatedQuantity || 0}</TableCell>
                        <TableCell className="text-center text-green-600 font-bold">
                          {machinery.availableQuantity !== undefined ? machinery.availableQuantity : (machinery.quantity || 1)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{(machinery.totalCost || 0).toLocaleString()}
                        </TableCell>

                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            {/* View Details */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewDetails(machinery)}
                            >
                              <Eye className="w-4 h-4 text-indigo-600" />
                            </Button>

                            {/* View Documents */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewDocuments(machinery.documents)}
                            >
                              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canEdit}
                              onClick={() => canEdit && openEditDialog(machinery)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {/* Delete */}
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
                                if (window.confirm("Are you sure? This will delete all child machines too.")) {
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

                      {/* Expanded Children Rows */}
                      {expandedRows.has(machinery._id || "") && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={9} className="p-0">
                            <div className="p-4 pl-10">
                              {loadingChildren.has(machinery._id || "") ? (
                                <div className="text-center py-4 text-gray-500">Loading children...</div>
                              ) : childrenData[machinery._id || ""]?.length > 0 ? (
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
                                      {childrenData[machinery._id || ""]?.map((child) => {
                                        console.log("child ====>", child);
                                        return (
                                          <TableRow key={child._id} className="text-sm">
                                            <TableCell className="font-mono text-xs">{child.code}</TableCell>
                                            <TableCell>
                                              <Badge
                                                variant={child.pendingMachineryRequeststatus === "allocated" ? "destructive" : "outline"}
                                                className={child.pendingMachineryRequeststatus === "available" ? "bg-green-100 text-green-700" : ""}
                                              >
                                                {child.pendingMachineryRequeststatus === "allocated" ? "In Use" : "Available"}
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
                onClick={() => dispatch(fetchMachineries({
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
                onClick={() => dispatch(fetchMachineries({
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
              {editing ? "Edit Machinery" : "Add Machinery"}
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

                <Select
                  value={form.category || ""}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryList.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No category found. Create one first.
                      </div>
                    ) : (
                      categoryList.map((cat: any) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <Label>Capacity / Specs</Label>
                <Input
                  value={form.capacity || ""}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="e.g. 5 Ton"
                />
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
                    value={form.supplier || ""}
                    onValueChange={(v) => setForm({ ...form, supplier: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierList.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No supplier found. Create one first.
                        </div>
                      ) : (
                        supplierList.map((sup: any) => (
                          <SelectItem key={sup._id} value={sup._id}>
                            {sup.company || sup.name}
                          </SelectItem>
                        ))
                      )}
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

            {/* Insurance & Compliance */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-gray-700">Insurance & Compliance</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Insurance Date</Label>
                  <Input
                    type="date"
                    value={form.insuranceDate ? form.insuranceDate.toString().split('T')[0] : ""}
                    onChange={(e) => setForm({ ...form, insuranceDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Insurance Expiry</Label>
                  <Input
                    type="date"
                    value={form.insuranceExpiry ? form.insuranceExpiry.toString().split('T')[0] : ""}
                    onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })}
                  />
                </div>
                <div>
                  <Label>PU Date</Label>
                  <Input
                    type="date"
                    value={form.puDate ? form.puDate.toString().split('T')[0] : ""}
                    onChange={(e) => setForm({ ...form, puDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>PU Date Expiry</Label>
                  <Input
                    type="date"
                    value={form.puDateExpiry ? form.puDateExpiry.toString().split('T')[0] : ""}
                    onChange={(e) => setForm({ ...form, puDateExpiry: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <Label>V Tax Payment (₹)</Label>
                  <Input
                    type="number"
                    value={form.vTaxPayment || ""}
                    onChange={(e) => setForm({ ...form, vTaxPayment: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
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
              </div>
            </div>

            {/* DOCUMENTS */}
            <div className="border-t pt-4">
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

      {/* VIEW DOCUMENTS MODAL */}
      <Dialog open={viewDocsOpen} onOpenChange={setViewDocsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Uploaded Documents</DialogTitle>
            <DialogDescription>
              View or download machinery documents
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDocs.map((doc, index) => (
              <div
                key={doc.publicId || index}
                className="border rounded-md p-3 flex flex-col gap-2 bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium truncate">{doc.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {isImage(doc) ? "Image" : "File"}
                  </Badge>
                </div>

                {/* IMAGE PREVIEW */}
                {isImage(doc) ? (
                  <>
                    <img
                      src={doc.url}
                      alt={doc.name}
                      className="h-40 w-full object-cover rounded cursor-pointer border"
                      onClick={() =>
                        setPreviewImage({ url: doc.url, name: doc.name })
                      }
                    />

                    {/* DOWNLOAD IMAGE */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(doc.url, doc.name)}
                    >
                      Download
                    </Button>
                  </>
                ) : (
                  /* NON-IMAGE FILE */
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(doc.url, doc.name)}
                  >
                    Download
                  </Button>
                )}
              </div>
            ))}
          </div>

        </DialogContent>
      </Dialog>
      {/* VIEW MACHINERY DETAILS */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Machinery Details</DialogTitle>
            <DialogDescription>
              Read-only view of machinery information
            </DialogDescription>
          </DialogHeader>

          {viewItem && (
            <div className="space-y-6 text-sm">
              {/* BASIC INFO */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><b>ID:</b> {viewItem.code}</div>
                  <div><b>Name:</b> {viewItem.name}</div>
                  <div><b>Category:</b> {categoryList.find(c => c._id === viewItem.category)?.name || "-"}</div>
                  <div><b>Supplier:</b> {getSupplierName(viewItem.supplier)}</div>
                  <div><b>Location:</b> {getLocationName(viewItem.location)}</div>
                  <div><b>Status:</b> <Badge>{viewItem.status}</Badge></div>
                </div>
              </section>

              {/* QUANTITY */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">Quantity</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><b>Total:</b> {viewItem.quantity || 0}</div>
                  <div><b>Allocated:</b> {viewItem.allocatedQuantity || 0}</div>
                  <div><b>Available:</b> {viewItem.availableQuantity ?? viewItem.quantity}</div>
                </div>
              </section>

              {/* PURCHASE */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">Purchase Info</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><b>Invoice:</b> {viewItem.invoiceNumber || "-"}</div>
                  <div><b>Purchase Date:</b> {viewItem.purchaseDate ? new Date(viewItem.purchaseDate).toLocaleDateString() : "-"}</div>
                  <div><b>Capacity:</b> {viewItem.capacity || "-"}</div>
                </div>
              </section>

              {/* PRICING */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">Pricing & GST</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>Basic: ₹{viewItem.basicCost || 0}</div>
                  <div>CGST: ₹{viewItem.cgst || 0}</div>
                  <div>IGST: ₹{viewItem.igst || 0}</div>
                  <div>SGST: ₹{viewItem.sgst || 0}</div>
                  <div className="font-bold text-green-700">
                    Total: ₹{viewItem.totalCost || 0}
                  </div>
                </div>
              </section>

              {/* COMPLIANCE */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">Compliance</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>Insurance: {viewItem.insuranceDate || "-"}</div>
                  <div>Expiry: {viewItem.insuranceExpiry || "-"}</div>
                  <div>PU Date: {viewItem.puDate || "-"}</div>
                  <div>PU Expiry: {viewItem.puDateExpiry || "-"}</div>
                </div>
              </section>

              {/* DOCUMENTS */}
              <section>
                <h4 className="font-semibold text-gray-700 mb-2">Documents</h4>
                {viewItem.documents?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {viewItem.documents.map(doc => (
                      <Badge key={doc.id} variant="outline">{doc.name}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No documents uploaded</p>
                )}
              </section>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMAGE PREVIEW MODAL */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-5xl p-2">
          {previewImage && (
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="w-full h-auto rounded"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Machine Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Reason (e.g. Under maintenance)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



    </div>
  );
}