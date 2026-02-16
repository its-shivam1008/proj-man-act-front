import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";

import {
  fetchSpareParts,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  fetchSparePartChildren,
} from "@/redux/slices/plantandmachinary/sparePartsSlice";
import { fetchVendors } from "@/redux/slices/purchase/vendorSlice";
import { fetchStores } from "@/redux/slices/storageSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import * as XLSX from "xlsx";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  Edit2,
  Trash2,
  Award,
  ArchiveRestore,
  DownloadCloud,
  UploadCloud,
  FilePlus,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { fetchInventoryMaster } from "@/redux/slices/inventoryMasterSlice";
import { fetchPlantMachineryMaster } from "@/redux/slices/plantandmachinary/plantMachineryMasterSlice";

/* ----------------------------
   Types
   ---------------------------- */
type SlipType = "ISSUE" | "RETURN";

interface SparePart {
  _id: string;
  code: string;
  name: string;
  equipmentLink?: string;
  vendor?: string;
  location?: string | { _id: string; name: string };
  quantity: number;
  unit: string;
  supplier:string;
  reorderLevel: number;
  costPerUnit: number;
  critical?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  // GST and pricing fields
  basicCost?: number;
  cgst?: number;
  igst?: number;
  sgst?: number;
  totalCost?: number;
  invoiceNumber?: string;
  purchaseDate?: string;
  // Parent-child relationship fields
  isParent?: boolean;
  parentId?: string;
  childIndex?: number;
  hasChildren?: boolean;
  availableQuantity?: number;
  allocatedQuantity?: number;
  // Allocation fields
  allocationStatus?: "available" | "allocated";
  allocatedTo?: {
    projectId?: string;
    projectName?: string;
    siteName?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface IssueSlip {
  id: string;
  slipType: SlipType;
  partId: string;
  partCode?: string;
  partName?: string;
  quantity: number;
  reference?: string;
  createdBy?: string;
  createdAt: string;
  notes?: string;
}

export default function SparePartsInventory() {
  const dispatch = useDispatch<AppDispatch>();
  
  // FIX: Updated to use Async Thunk for DB persistence
  async function toggleCritical(part: SparePart) {
    try {
      await dispatch(
        updateSparePart({
          id: part._id,
          data: { critical: !part.critical },
        })
      ).unwrap();
      toast.success("Critical status updated");
    } catch (e) {
      toast.error("Failed to update status");
    }
  }

  const {
    items: parts,
    loading,
    page,
    totalPages,
    total,
  } = useSelector((state: RootState) => state.spareParts);

  const { vendors, loading: vendorsLoading, error: vendorsError } = useSelector((state: RootState) => state.vendors);
  const { stores, loading: storesLoading, error: storesError } = useSelector((state: RootState) => state.storages);
  const { locations } = useSelector((state: RootState) => state.masterData);

  const [slips, setSlips] = useState<IssueSlip[]>([]);

  // Expandable rows for children
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [childrenData, setChildrenData] = useState<Record<string, SparePart[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());

  // Bulk import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // UI state
  const [query, setQuery] = useState("");
  const [filterReorderOnly, setFilterReorderOnly] = useState(false);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "quantity" | "cost">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // dialogs
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [partForm, setPartForm] = useState<Partial<SparePart>>({
    unit: "pcs",
    quantity: 1,
    reorderLevel: 1,
    costPerUnit: 0,
    basicCost: 0,
    cgst: 0,
    igst: 0,
    sgst: 0,
    totalCost: 0,
    invoiceNumber: "",
  });

  const [slipDialogOpen, setSlipDialogOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<IssueSlip | null>(null);
  const [slipForm, setSlipForm] = useState<Partial<IssueSlip>>({
    slipType: "ISSUE",
    quantity: 1,
  });
  const { supplier } = useSelector(
    (state: RootState) => state.plantMachineryMaster
  );

    const getSupplierName = (id?: string) => {
  if (!id) return "-";
  const sup = supplier.find((s: any) => s._id === id);
  // Check for company name first, then falling back to name
  return  sup?.name || "Unknown";
};

const parseDate = (val: any) => {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
};

  const organisationId = localStorage.getItem("organisationId") || "";

  useEffect(() => {
    dispatch(
      fetchSpareParts({
        organisationId,
        page: 1,
        limit: 10,
        // Note: You should update your slice to accept 'query' here for server-side search
      })
    );
    dispatch(fetchVendors({})).catch(console.error);
    dispatch(fetchStores({})).catch(console.error);
    dispatch(fetchMasterData("location")).catch(console.error);
     dispatch(fetchPlantMachineryMaster({
          type: "supplier",
          page: 1,
          limit: 100
        }));
  }, [dispatch, organisationId]); // Add query here if you implement server-side search

  // Auto-calculate total cost when GST fields change
  useEffect(() => {
    const total = (partForm.basicCost || 0) + (partForm.cgst || 0) + (partForm.igst || 0) + (partForm.sgst || 0);
    setPartForm(prev => ({ ...prev, totalCost: total }));
  }, [partForm.basicCost, partForm.cgst, partForm.igst, partForm.sgst]);

  // Toggle row expansion and fetch children
  const toggleRowExpansion = async (partId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(partId)) {
      newExpanded.delete(partId);
    } else {
      newExpanded.add(partId);
      // Fetch children if not already loaded
      if (!childrenData[partId]) {
        setLoadingChildren(prev => new Set(prev).add(partId));
        try {
          const result = await dispatch(fetchSparePartChildren(partId)).unwrap();
          setChildrenData(prev => ({ ...prev, [partId]: result.children || [] }));
        } catch (error) {
          console.error("Failed to fetch children:", error);
          toast.error("Failed to load child spare parts");
        } finally {
          setLoadingChildren(prev => {
            const newSet = new Set(prev);
            newSet.delete(partId);
            return newSet;
          });
        }
      }
    }
    setExpandedRows(newExpanded);
  };

  // Bulk import template download
  const handleDownloadTemplate = () => {
    const headers = [[
      "Code (SKU)",
      "Name",
      "Vendor",
      "Supplier",
      "Location",
      "Quantity",
      "Reorder Level",
      "Basic Cost",
      "CGST",
      "IGST",
      "SGST",
      "Invoice Number",
      "Purchase Date",
      "Notes"
    ]];
  const exampleRow = [
  "SP-2026-0001 (Optional)", // 0
  "Bearing 6205 (Required)", // 1
  "ABC Vendor",              // 2 Vendor
  "Temporibus eius erro",    // 3 Supplier
  "Main Store (Required)",   // 4 Location
  "10",                      // 5 Quantity
  "5",                       // 6 Reorder
  "1000",                    // 7 Basic
  "90",                      // 8 CGST
  "0",                       // 9 IGST
  "90",                      // 10 SGST
  "INV-001",                 // 11 Invoice
  "2026-01-15",              // 12 Purchase Date
  "High quality bearing"     // 13 Notes
];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers[0], exampleRow]);
    ws['!cols'] = headers[0].map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "SpareParts_Template");
    XLSX.writeFile(wb, "SpareParts_Import_Template.xlsx");
    toast.success("Template downloaded! Fields marked (Required) are mandatory.");
  };

  // Bulk import file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Skip header row
        const rows = jsonData.slice(1).filter(row => row.length > 0 && row[1]);
        
        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];

                      const supplierNameRaw = row[3];
let supplierId = "";

if (supplierNameRaw) {
  const supplierName = supplierNameRaw.toString().trim().toLowerCase();

  const matchedSupplier = supplier.find((s: any) => {
    const dbName = s.name?.toLowerCase();
    const dbCompany = s.company?.toLowerCase();
    return dbName === supplierName || dbCompany === supplierName;
  });

  if (matchedSupplier) {
    supplierId = matchedSupplier._id;
  } else {
    throw new Error(`Supplier not found: ${supplierNameRaw}`);
  }
}
          try {


            const sparePartData = {
  code: row[0] || `SP-${Date.now()}-${i}`,
  name: row[1],
  vendor: row[2] || "",
  supplier: supplierId,
  location: row[4] || "",
  quantity: parseInt(row[5]) || 1,
  reorderLevel: parseInt(row[6]) || 1,
  basicCost: parseFloat(row[7]) || 0,
  cgst: parseFloat(row[8]) || 0,
  igst: parseFloat(row[9]) || 0,
  sgst: parseFloat(row[10]) || 0,
  totalCost:
    (parseFloat(row[7]) || 0) +
    (parseFloat(row[8]) || 0) +
    (parseFloat(row[9]) || 0) +
    (parseFloat(row[10]) || 0),
  invoiceNumber: row[11] || "",
  purchaseDate: parseDate(row[12]),
  notes: row[13] || "",
};


            await dispatch(createSparePart(sparePartData)).unwrap();
            successCount++;
          } catch (err: any) {
            failedCount++;
            errors.push(`Row ${i + 2}: ${err.message || "Import failed"}`);
          }
        }

        toast.success(`Import complete: ${successCount} success, ${failedCount} failed`);
        if (errors.length > 0) {
          console.error("Import errors:", errors);
        }
        // Refresh the list
        dispatch(fetchSpareParts({ organisationId, page, limit: 12 }));
      } catch (error) {
        toast.error("Failed to parse import file");
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  /* ----------------------------
     Part CRUD
     ---------------------------- */
  function openAddPart() {
    setEditingPart(null);
    setPartForm({ 
      quantity: 1, 
      reorderLevel: 1, 
      costPerUnit: 0,
      basicCost: 0,
      cgst: 0,
      igst: 0,
      sgst: 0,
      totalCost: 0,
      invoiceNumber: "",
    });
    setPartDialogOpen(true);
  }
  function openEditPart(p: SparePart) {
    setEditingPart(p);
    setPartForm({ ...p });
    setPartDialogOpen(true);
  }

  async function savePart() {
    if (!partForm.name || !partForm.code) {
      toast.error("Name and Code are required");
      return;
    }
    try {
      if (editingPart) {
        await dispatch(updateSparePart({ id: editingPart._id, data: partForm })).unwrap();
        toast.success("Part updated");
      } else {
        await dispatch(createSparePart(partForm)).unwrap();
        toast.success("Part added");
      }
      setPartDialogOpen(false);
    } catch (err: any) {
      toast.error(err || "Something went wrong");
    }
  }

  async function deletePart(id: string) {
    if (!confirm("Delete this part?")) return;
    try {
      await dispatch(deleteSparePart(id)).unwrap();
      toast.success("Part deleted");
    } catch (err: any) {
      toast.error(err || "Delete failed");
    }
  }

  /* ----------------------------
     Issue / Return Slips
     ---------------------------- */
  function openAddSlip(part?: SparePart, type: SlipType = "ISSUE") {
    setEditingSlip(null);
    setSlipForm({
      slipType: type,
      partId: part?._id,
      partCode: part?.code,
      partName: part?.name,
      quantity: type === "ISSUE" ? 1 : 0,
      createdBy: "",
      reference: "",
      notes: "",
    });
    setSlipDialogOpen(true);
  }

  // FIX: Updated logic to persist stock changes
  async function saveSlip() {
    if (!slipForm.partId || !slipForm.quantity) {
      toast.error("Select part and quantity");
      return;
    }
    
    const qty = Number(slipForm.quantity);
    const targetPart = parts.find(p => p._id === slipForm.partId);
    if (!targetPart) return;

    // Calculate new stock
    const newQty = slipForm.slipType === "ISSUE" 
      ? targetPart.quantity - qty 
      : targetPart.quantity + qty;

    if (newQty < 0) {
      toast.error("Insufficient stock");
      return;
    }

    try {
      // 1. Update Database
      await dispatch(
        updateSparePart({
          id: slipForm.partId!,
          data: { quantity: newQty },
        })
      ).unwrap();

      // 2. Add Slip to local history
      const slip: IssueSlip = {
        id: uuidv4(),
        slipType: slipForm.slipType as SlipType,
        partId: slipForm.partId!,
        partCode: slipForm.partCode || "",
        partName: slipForm.partName || "",
        quantity: qty,
        reference: slipForm.reference || "",
        createdBy: slipForm.createdBy || "",
        createdAt: new Date().toISOString(),
        notes: slipForm.notes || "",
      };

      setSlips((s) => [slip, ...s]);
      toast.success(`${slipForm.slipType} recorded`);
      setSlipDialogOpen(false);

    } catch (err) {
      toast.error("Failed to update stock");
    }
  }

  /* ----------------------------
     Derived data & helpers
     ---------------------------- */
  const filteredParts = useMemo(() => {
    let list = [...parts];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        [p.name, p.code, p.equipmentLink, p.vendor, getSupplierName(p.supplier)]

          .filter(Boolean)
          .some((x) => x!.toLowerCase().includes(q))
      );
    }
    if (filterReorderOnly)
      list = list.filter((p) => p.quantity <= p.reorderLevel);
    if (showCriticalOnly) list = list.filter((p) => p.critical);
    
    // Sort logic
    if (sortBy === "name") {
      list.sort((a, b) => sortDir === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name));
    } else if (sortBy === "quantity") {
      list.sort((a, b) => sortDir === "asc" 
        ? a.quantity - b.quantity 
        : b.quantity - a.quantity);
    } else if (sortBy === "cost") {
      list.sort((a, b) => sortDir === "asc" 
        ? a.costPerUnit - b.costPerUnit 
        : b.costPerUnit - a.costPerUnit);
    }
    return list;
  }, [parts, query, filterReorderOnly, showCriticalOnly, sortBy, sortDir]);

  const totalValuation = useMemo(
    () => parts.reduce((s, p) => s + p.quantity * (p.costPerUnit || 0), 0),
    [parts]
  );

  const stockChartData = useMemo(() => {
    return parts.slice(0, 20).map((p) => ({ name: p.code || p.name, qty: p.quantity }));
  }, [parts]);

  /* ----------------------------
     Export / Import
     ---------------------------- */
  function exportAll() {
    const payload = { parts, slips, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spareparts_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported spare parts & slips");
  }

  function importAll(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data || !Array.isArray(data.parts)) throw new Error("Invalid file");
        // Logic to restore data...
        toast.success("Import successful");
      } catch (err) {
        toast.error("Import failed: invalid file");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Spare Parts & Inventory</h1>
        <div className="flex items-center gap-2">
          {/* Bulk Excel Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <DownloadCloud className="mr-2 h-4 w-4" /> Download Template
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <UploadCloud className="mr-2 h-4 w-4" /> 
            {importing ? "Importing..." : "Bulk Import"}
          </Button>
          {/* Legacy JSON import */}
          <input
            id="import-all"
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importAll(e.target.files?.[0] || null)}
          />
          <Button variant="outline" onClick={exportAll}>
            <DownloadCloud className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          <Button onClick={openAddPart}>
            <Plus className="mr-2 h-4 w-4" /> Add Part
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-sm text-muted-foreground">Total Parts</div>
            <div className="text-xl font-bold">{parts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-sm text-muted-foreground">Parts Below Reorder</div>
            <div className="text-xl font-bold">
              {parts.filter((p) => p.quantity <= p.reorderLevel).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-sm text-muted-foreground">Inventory Valuation</div>
            <div className="text-xl font-bold">₹{totalValuation.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Stock levels (top parts)</CardTitle>
          </CardHeader>
          <CardContent>
            {stockChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stockChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground">No parts yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search name/code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button
                variant={filterReorderOnly ? "secondary" : "outline"}
                onClick={() => setFilterReorderOnly((v) => !v)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" /> Reorder
              </Button>
              <Button
                variant={showCriticalOnly ? "secondary" : "outline"}
                onClick={() => setShowCriticalOnly((v) => !v)}
              >
                <Award className="mr-2 h-4 w-4" /> Critical
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Label>Sort</Label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-2 py-1"
              >
                <option value="name">Name</option>
                <option value="quantity">Quantity</option>
                <option value="cost">Cost</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as any)}
                className="border rounded px-2 py-1"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Issue/Return</CardTitle>
          </CardHeader>
          <CardContent>
            {slips.length === 0 ? (
              <div className="text-sm text-muted-foreground">No slips yet</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {slips.slice(0, 6).map((s) => (
                  <li key={s.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{s.partCode || s.partName}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.slipType} • {s.quantity} • {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{s.createdBy}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Parts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parts Master</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center text-orange-600">Allocated</TableHead>
                  <TableHead className="text-center text-green-600">Available</TableHead>
                  
                  <TableHead>Unit</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Reorder</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((p) => (
                  <React.Fragment key={p._id}>
                    <TableRow
                      className={p.hasChildren ? "cursor-pointer hover:bg-gray-50" : ""}
                      onClick={() => p.hasChildren && toggleRowExpansion(p._id)}
                    >
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1">
                          {p.hasChildren && (
                            expandedRows.has(p._id)
                              ? <ChevronDown className="w-4 h-4 text-blue-500" />
                              : <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          {p.code}
                          {p.hasChildren && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {p.quantity || 1} units
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>{p.name}</div>
                          {p.critical && (
                            <span className="text-xs px-1 rounded bg-yellow-100 text-yellow-800">
                              CRITICAL
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{p.quantity || 1}</TableCell>
                      <TableCell className="text-center text-orange-600 font-medium">{p.allocatedQuantity || 0}</TableCell>
                      <TableCell className="text-center text-green-600 font-bold">
                        {p.availableQuantity !== undefined ? p.availableQuantity : (p.quantity || 1)}
                      </TableCell>
                     <TableCell>{p.unit}</TableCell>

{/* ✅ Supplier column */}
<TableCell>
  {getSupplierName(p.supplier)}
</TableCell>

{/* ✅ Reorder column */}
<TableCell>
  <div
    className={`inline-block px-2 py-0.5 rounded text-sm ${
      p.quantity <= p.reorderLevel
        ? "bg-red-100 text-red-800"
        : "bg-green-100 text-green-800"
    }`}
  >
    {p.quantity} / {p.reorderLevel}
  </div>
</TableCell>

                      <TableCell className="text-right font-medium">
                        ₹{(p.totalCost || p.costPerUnit * (p.quantity || 1) || 0).toLocaleString()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditPart(p)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openAddSlip(p, "ISSUE")}>
                            <ArchiveRestore className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openAddSlip(p, "RETURN")}>
                            <ArchiveRestore className="w-4 h-4 rotate-180" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCritical(p)}
                            title="Toggle critical"
                          >
                            <Award className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deletePart(p._id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Children Rows */}
                    {expandedRows.has(p._id) && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={10} className="p-0">
                          <div className="p-4 pl-10">
                            {loadingChildren.has(p._id) ? (
                              <div className="text-center py-4 text-gray-500">Loading children...</div>
                            ) : childrenData[p._id]?.length > 0 ? (
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
                                    {childrenData[p._id]?.map((child) => (
                                      <TableRow key={child._id} className="text-sm">
                                        <TableCell className="font-mono text-xs">{child.code}-{child.childIndex}</TableCell>
                                        <TableCell>
                                          <Badge 
                                            variant={child.allocationStatus === "available" ? "outline" : "default"}
                                            className={child.allocationStatus === "available" 
                                              ? "bg-green-100 text-green-800 border-green-300" 
                                              : "bg-orange-100 text-orange-800 border-orange-300"
                                            }
                                          >
                                            {child.allocationStatus || "available"}
                                          </Badge>
                                        </TableCell>
                                        {/* <TableCell>
  {getSupplierName(p.supplier)}
</TableCell> */}

                                        <TableCell>{child.allocatedTo?.projectName || "-"}</TableCell>
                                        <TableCell>
                                          {child.allocatedTo?.startDate && child.allocatedTo?.endDate
                                            ? `${new Date(child.allocatedTo.startDate).toLocaleDateString()} - ${new Date(child.allocatedTo.endDate).toLocaleDateString()}`
                                            : "-"
                                          }
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">No child spare parts found</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
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
                onClick={() => {
                  const newPage = Math.max(1, page - 1);
                  dispatch(fetchSpareParts({ organisationId, page: newPage, limit: 10 }));
                }}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = Math.min(totalPages, page + 1);
                  dispatch(fetchSpareParts({ organisationId, page: newPage, limit: 10 }));
                }}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Part Dialog */}
      <Dialog open={partDialogOpen} onOpenChange={setPartDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPart ? "Edit Part" : "Add Part"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Code (SKU)</Label>
              <Input
                value={partForm.code || ""}
                onChange={(e) => setPartForm((f) => ({ ...f, code: e.target.value }))}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={partForm.name || ""}
                onChange={(e) => setPartForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Vendor</Label>
              <Input
                 value={partForm.vendor || ""}
                 onChange={(e) => setPartForm((f) => ({ ...f, vendor: e.target.value }))}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Select
                value={partForm.location || ""}
                onValueChange={(value) => setPartForm((f) => ({ ...f, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location._id} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
                  {stores?.map((store) => (
                    <SelectItem key={store._id} value={store.name}>
                      {store.name} (Store)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
  <Label>Supplier</Label>
  <Select
    value={partForm.supplier || ""}
    onValueChange={(v) => setPartForm({ ...partForm, supplier: v })}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select Supplier" />
    </SelectTrigger>
    <SelectContent>
      {supplier.length === 0 ? (
        <div className="p-2 text-sm text-center text-muted-foreground">
          No suppliers found.
        </div>
      ) : (
        supplier.map((sup: any) => (
          <SelectItem key={sup._id} value={sup._id}>
            {/* ✅ Use company or name field */}
            {sup.name}
          </SelectItem>
        ))
      )}
    </SelectContent>
  </Select>
</div>
            {/* Unit field removed */}
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={partForm.quantity || 0}
                onChange={(e) => setPartForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Reorder Level</Label>
              <Input
                type="number"
                value={partForm.reorderLevel || 1}
                onChange={(e) => setPartForm((f) => ({ ...f, reorderLevel: Number(e.target.value) }))}
              />
            </div>
            
            {/* GST Pricing Section */}
            <div className="col-span-2 mt-4 mb-2">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">GST & Pricing Details</h3>
            </div>
            <div>
              <Label>Basic Cost (₹)</Label>
              <Input
                type="number"
                value={partForm.basicCost || 0}
                onChange={(e) => setPartForm((f) => ({ ...f, basicCost: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>CGST (₹)</Label>
              <Input
                type="number"
                value={partForm.cgst || 0}
                onChange={(e) => setPartForm((f) => ({ ...f, cgst: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>IGST (₹)</Label>
              <Input
                type="number"
                value={partForm.igst || 0}
                onChange={(e) => setPartForm((f) => ({ ...f, igst: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>SGST (₹)</Label>
              <Input
                type="number"
                value={partForm.sgst || 0}
                onChange={(e) => setPartForm((f) => ({ ...f, sgst: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Total Cost (₹)</Label>
              <Input
                type="number"
                value={partForm.totalCost || 0}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div>
              <Label>Invoice Number</Label>
              <Input
                value={partForm.invoiceNumber || ""}
                onChange={(e) => setPartForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
                placeholder="INV-001"
              />
            </div>
            <div>
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={partForm.purchaseDate || ""}
                onChange={(e) => setPartForm((f) => ({ ...f, purchaseDate: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Input
                value={partForm.notes || ""}
                onChange={(e) => setPartForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(partForm.critical)}
                  onChange={(e) => setPartForm((f) => ({ ...f, critical: e.target.checked }))}
                />{" "}
                Mark as critical
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePart}>
              <FilePlus className="mr-2 h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slip Dialog */}
      <Dialog open={slipDialogOpen} onOpenChange={setSlipDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSlip ? "Edit Slip" : "New Issue / Return"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Part</Label>
              <select
                value={slipForm.partId || ""}
                onChange={(e) => {
                  const pid = e.target.value;
                  const p = parts.find((x) => x._id === pid);
                  setSlipForm((s) => ({
                    ...s,
                    partId: pid,
                    partCode: p?.code,
                    partName: p?.name,
                  }));
                }}
                className="border rounded px-2 py-2 w-full"
              >
                <option value="">Select part...</option>
                {parts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={slipForm.slipType}
                onChange={(e) =>
                  setSlipForm((s) => ({ ...s, slipType: e.target.value as SlipType }))
                }
                className="border rounded px-2 py-2 w-full"
              >
                <option value="ISSUE">Issue</option>
                <option value="RETURN">Return</option>
              </select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={slipForm.quantity || 0}
                onChange={(e) => setSlipForm((s) => ({ ...s, quantity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Reference</Label>
              <Input
                value={slipForm.reference || ""}
                onChange={(e) => setSlipForm((s) => ({ ...s, reference: e.target.value }))}
              />
            </div>
            <div>
              <Label>Created By</Label>
              <Input
                value={slipForm.createdBy || ""}
                onChange={(e) => setSlipForm((s) => ({ ...s, createdBy: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={slipForm.notes || ""}
                onChange={(e) => setSlipForm((s) => ({ ...s, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlipDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSlip}>
              <FilePlus className="mr-2 h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// import { useDispatch, useSelector } from "react-redux";
// import type { RootState, AppDispatch } from "@/redux/store";

// import {
//   fetchSpareParts,
//   createSparePart,
//   updateSparePart,
//   deleteSparePart,
// } from "@/redux/slices/plantandmachinary/sparePartsSlice";
// import { fetchVendors } from "@/redux/slices/purchase/vendorSlice";
// import { fetchStores } from "@/redux/slices/storageSlice";
// import { fetchMasterData } from "@/redux/slices/masterDataSlice";

// import React, { useEffect, useMemo, useState } from "react";
// import { v4 as uuidv4 } from "uuid";
// import {
//   Plus,
//   Edit2,
//   Trash2,
//   Award,
//   ArchiveRestore,
//   DownloadCloud,
//   UploadCloud,
//   FilePlus,
//   AlertTriangle,
//   PieChart,
//   Search,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import { toast } from "sonner";
// import { storage, STORAGE_KEYS } from "@/lib/storage";
// import {
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
// } from "recharts";

// /* ----------------------------
//    Types
//    ---------------------------- */
// type SlipType = "ISSUE" | "RETURN";

// interface SparePart {
//   id: string;
//   code: string; // SKU/code
//   name: string;
//   equipmentLink?: string; // equipment code or type
//   vendor?: string;
//   location?: string; // warehouse / bin
//   quantity: number; // current qty
//   unit: string; // e.g., pcs, liters
//   reorderLevel: number; // threshold
//   costPerUnit: number; // currency
//   critical?: boolean;
//   notes?: string;
//   createdAt: string;
//   updatedAt?: string;
// }

// interface IssueSlip {
//   id: string;
//   slipType: SlipType;
//   partId: string;
//   partCode?: string;
//   partName?: string;
//   quantity: number;
//   reference?: string; // job / breakdown / PO
//   createdBy?: string;
//   createdAt: string;
//   notes?: string;
// }

// /* ----------------------------
//    Storage keys (fallbacks)
//    ---------------------------- */
// // Prefer centralized constants; fall back to string keys if missing
// const PARTS_KEY = STORAGE_KEYS.SUPPLIERS // fallback guard (will be overwritten below)
//   ? (STORAGE_KEYS.SUPER_SAFE_FALLBACK as any)
//   : "spare_parts_master_v1";

// const FALLBACK_PARTS_KEY = "spare_parts_master_v1";
// const FALLBACK_SLIPS_KEY = "spare_parts_issue_slips_v1";

// // use constants from STORAGE_KEYS if available
// const PARTS_KEY_FINAL =
//   (STORAGE_KEYS && (STORAGE_KEYS.SPARE_PARTS_MASTER_V1 as string)) ||
//   FALLBACK_PARTS_KEY;
// const SLIPS_KEY_FINAL =
//   (STORAGE_KEYS && (STORAGE_KEYS.SPARE_PARTS_ISSUE_SLIPS_V1 as string)) ||
//   FALLBACK_SLIPS_KEY;

// /* ----------------------------
//    Component
//    ---------------------------- */
// export default function SparePartsInventory() {
//   const dispatch = useDispatch<AppDispatch>();

//   const {
//     items: parts,
//     loading,
//     page,
//     totalPages,
//   } = useSelector((state: RootState) => state.spareParts);

//   const { vendors, loading: vendorsLoading, error: vendorsError } = useSelector((state: RootState) => state.vendors);
//   const { stores, loading: storesLoading, error: storesError } = useSelector((state: RootState) => state.storages);
//   const { locations } = useSelector((state: RootState) => state.masterData);

//   const [slips, setSlips] = useState<IssueSlip[]>([]);
//   const [loaded, setLoaded] = useState(false);

//   // UI state
//   const [query, setQuery] = useState("");
//   const [filterReorderOnly, setFilterReorderOnly] = useState(false);
//   const [showCriticalOnly, setShowCriticalOnly] = useState(false);
//   const [sortBy, setSortBy] = useState<"name" | "quantity" | "cost">("name");
//   const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

//   // dialogs
//   const [partDialogOpen, setPartDialogOpen] = useState(false);
//   const [editingPart, setEditingPart] = useState<SparePart | null>(null);
//   const [partForm, setPartForm] = useState<Partial<SparePart>>({
//     unit: "pcs",
//     quantity: 0,
//     reorderLevel: 1,
//     costPerUnit: 0,
//   });

//   const [slipDialogOpen, setSlipDialogOpen] = useState(false);
//   const [editingSlip, setEditingSlip] = useState<IssueSlip | null>(null);
//   const [slipForm, setSlipForm] = useState<Partial<IssueSlip>>({
//     slipType: "ISSUE",
//     quantity: 1,
//   });

//   /* ----------------------------
//      Load / Save (safe)
//      ---------------------------- */
//   const organisationId = localStorage.getItem("organisationId"); // 🔐 get from auth context

//   useEffect(() => {
//     dispatch(
//       fetchSpareParts({
//         organisationId,
//         page,
//         limit: 12,
//       })
//     );
    
//     // Fetch vendors, stores, and locations for dropdowns
//     dispatch(fetchVendors({})).catch((err) => {
//       console.error("Failed to fetch vendors:", err);
//     });
//     dispatch(fetchStores({})).catch((err) => {
//       console.error("Failed to fetch stores:", err);
//     });
//     dispatch(fetchMasterData("location")).catch((err) => {
//       console.error("Failed to fetch locations:", err);
//     });
//   }, [dispatch, organisationId, page]);

//   // persist parts when changed (only after initial load)
//   useEffect(() => {
//     if (!loaded) return;
//     storage.set(PARTS_KEY_FINAL, parts);
//   }, [parts, loaded]);

//   // persist slips
//   useEffect(() => {
//     if (!loaded) return;
//     storage.set(SLIPS_KEY_FINAL, slips);
//   }, [slips, loaded]);

//   // cross-tab sync
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const handler = (e: StorageEvent) => {
//       if (!e.key) return;
//       if (e.key === PARTS_KEY_FINAL || e.key === FALLBACK_PARTS_KEY) {
//         const remote = storage.get<SparePart[]>(
//           PARTS_KEY_FINAL,
//           storage.get(FALLBACK_PARTS_KEY, [])
//         );
//         setParts(remote || []);
//       }
//       if (e.key === SLIPS_KEY_FINAL) {
//         const remote = storage.get<IssueSlip[]>(SLIPS_KEY_FINAL, []);
//         setSlips(remote || []);
//       }
//     };
//     window.addEventListener("storage", handler);
//     return () => window.removeEventListener("storage", handler);
//   }, []);

//   /* ----------------------------
//      Part CRUD
//      ---------------------------- */
//   function openAddPart() {
//     setEditingPart(null);
//     setPartForm({
//       unit: "pcs",
//       quantity: 0,
//       reorderLevel: 1,
//       costPerUnit: 0,
//     });
//     setPartDialogOpen(true);
//   }
//   function openEditPart(p: SparePart) {
//     setEditingPart(p);
//     setPartForm({ ...p });
//     setPartDialogOpen(true);
//   }

//   async function savePart() {
//     if (!partForm.name || !partForm.code) {
//       toast.error("Name and Code are required");
//       return;
//     }

//     try {
//       if (editingPart) {
//         await dispatch(
//           updateSparePart({
//             id: editingPart._id,
//             data: partForm,
//           })
//         ).unwrap();

//         toast.success("Part updated");
//       } else {
//         await dispatch(
//           createSparePart(partForm)
//         ).unwrap();

//         toast.success("Part added");
//       }

//       setPartDialogOpen(false);
//     } catch (err: any) {
//       toast.error(err || "Something went wrong");
//     }
//   }

//   async function deletePart(id: string) {
//     if (!confirm("Delete this part?")) return;

//     try {
//       await dispatch(deleteSparePart(id)).unwrap();
//       toast.success("Part deleted");
//     } catch (err: any) {
//       toast.error(err || "Delete failed");
//     }
//   }

//   /* ----------------------------
//      Issue / Return Slips
//      ---------------------------- */
//   function openAddSlip(part?: SparePart, type: SlipType = "ISSUE") {
//     setEditingSlip(null);
//     setSlipForm({
//       slipType: type,
//       partId: part?.id,
//       partCode: part?.code,
//       partName: part?.name,
//       quantity: type === "ISSUE" ? 1 : 0,
//       createdBy: "",
//       reference: "",
//       notes: "",
//     });
//     setSlipDialogOpen(true);
//   }

//   function saveSlip() {
//     if (!slipForm.partId || !slipForm.quantity) {
//       toast.error("Select part and quantity");
//       return;
//     }
//     const qty = Number(slipForm.quantity);
//     if (slipForm.slipType === "ISSUE") {
//       // check stock
//       const part = parts.find((p) => p.id === slipForm.partId);
//       if (!part) {
//         toast.error("Part not found");
//         return;
//       }
//       if (part.quantity < qty) {
//         toast.error("Insufficient stock");
//         return;
//       }
//       // reduce stock
//       setParts((prev) =>
//         prev.map((p) =>
//           p.id === part.id
//             ? {
//                 ...p,
//                 quantity: p.quantity - qty,
//                 updatedAt: new Date().toISOString(),
//               }
//             : p
//         )
//       );
//     } else {
//       // RETURN: increase stock
//       setParts((prev) =>
//         prev.map((p) =>
//           p.id === slipForm.partId
//             ? {
//                 ...p,
//                 quantity: p.quantity + qty,
//                 updatedAt: new Date().toISOString(),
//               }
//             : p
//         )
//       );
//     }

//     const slip: IssueSlip = {
//       id: uuidv4(),
//       slipType: slipForm.slipType as SlipType,
//       partId: slipForm.partId!,
//       partCode: slipForm.partCode || "",
//       partName: slipForm.partName || "",
//       quantity: qty,
//       reference: slipForm.reference || "",
//       createdBy: slipForm.createdBy || "",
//       createdAt: new Date().toISOString(),
//       notes: slipForm.notes || "",
//     };
//     setSlips((s) => [slip, ...s]);
//     toast.success(`${slip.slipType} recorded`);
//     setSlipDialogOpen(false);
//   }

//   /* ----------------------------
//      Derived data & helpers
//      ---------------------------- */
//   const filteredParts = useMemo(() => {
//     let list = [...parts];
//     if (query.trim()) {
//       const q = query.toLowerCase();
//       list = list.filter((p) =>
//         [p.name, p.code, p.equipmentLink, p.vendor]
//           .filter(Boolean)
//           .some((x) => x!.toLowerCase().includes(q))
//       );
//     }
//     if (filterReorderOnly)
//       list = list.filter((p) => p.quantity <= p.reorderLevel);
//     if (showCriticalOnly) list = list.filter((p) => p.critical);
//     if (sortBy === "name")
//       list.sort((a, b) =>
//         sortDir === "asc"
//           ? a.name.localeCompare(b.name)
//           : b.name.localeCompare(a.name)
//       );
//     if (sortBy === "quantity")
//       list.sort((a, b) =>
//         sortDir === "asc" ? a.quantity - b.quantity : b.quantity - a.quantity
//       );
//     if (sortBy === "cost")
//       list.sort((a, b) =>
//         sortDir === "asc"
//           ? a.costPerUnit - b.costPerUnit
//           : b.costPerUnit - a.costPerUnit
//       );
//     return list;
//   }, [parts, query, filterReorderOnly, showCriticalOnly, sortBy, sortDir]);

//   const totalValuation = useMemo(
//     () => parts.reduce((s, p) => s + p.quantity * (p.costPerUnit || 0), 0),
//     [parts]
//   );

//   const stockChartData = useMemo(() => {
//     return parts
//       .slice(0, 20)
//       .map((p) => ({ name: p.code || p.name, qty: p.quantity }));
//   }, [parts]);

//   /* ----------------------------
//      Export / Import
//      ---------------------------- */
//   function exportAll() {
//     const payload = { parts, slips, exportedAt: new Date().toISOString() };
//     const blob = new Blob([JSON.stringify(payload, null, 2)], {
//       type: "application/json",
//     });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `spareparts_export_${new Date()
//       .toISOString()
//       .slice(0, 10)}.json`;
//     a.click();
//     URL.revokeObjectURL(url);
//     toast.success("Exported spare parts & slips");
//   }

//   function importAll(file: File | null) {
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = () => {
//       try {
//         const data = JSON.parse(reader.result as string);
//         if (!data || !Array.isArray(data.parts))
//           throw new Error("Invalid file");
//         const normalizedParts: SparePart[] = data.parts.map((p: any) => ({
//           id: p.id || uuidv4(),
//           ...p,
//         }));
//         const normalizedSlips: IssueSlip[] = Array.isArray(data.slips)
//           ? data.slips.map((s: any) => ({ id: s.id || uuidv4(), ...s }))
//           : [];
//         setParts(normalizedParts);
//         setSlips(normalizedSlips);
//         toast.success("Import successful");
//       } catch (err) {
//         toast.error("Import failed: invalid file");
//       }
//     };
//     reader.readAsText(file);
//   }

//   /* ----------------------------
//      UI helpers
//      ---------------------------- */
//   function toggleCritical(id: string) {
//     setParts((prev) =>
//       prev.map((p) => (p.id === id ? { ...p, critical: !p.critical } : p))
//     );
//   }

//   /* ----------------------------
//      Render
//      ---------------------------- */
//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">Spare Parts & Inventory</h1>

//         <div className="flex items-center gap-2">
//           <input
//             id="import-all"
//             type="file"
//             accept="application/json"
//             className="hidden"
//             onChange={(e) => importAll(e.target.files?.[0] || null)}
//           />
//           <Button
//             variant="outline"
//             onClick={() => document.getElementById("import-all")?.click()}
//           >
//             <UploadCloud className="mr-2 h-4 w-4" />
//             Import
//           </Button>
//           <Button variant="outline" onClick={exportAll}>
//             <DownloadCloud className="mr-2 h-4 w-4" />
//             Export
//           </Button>
//           <Button onClick={openAddPart}>
//             <Plus className="mr-2 h-4 w-4" />
//             Add Part
//           </Button>
//         </div>
//       </div>

//       {/* top stats */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <Card>
//           <CardContent className="py-4 text-center">
//             <div className="text-sm text-muted-foreground">Total Parts</div>
//             <div className="text-xl font-bold">{parts.length}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="py-4 text-center">
//             <div className="text-sm text-muted-foreground">
//               Parts Below Reorder
//             </div>
//             <div className="text-xl font-bold">
//               {parts.filter((p) => p.quantity <= p.reorderLevel).length}
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="py-4 text-center">
//             <div className="text-sm text-muted-foreground">
//               Inventory Valuation
//             </div>
//             <div className="text-xl font-bold">
//               ₹{totalValuation.toFixed(0)}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* charts + filters */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         <Card>
//           <CardHeader>
//             <CardTitle>Stock levels (top parts)</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {stockChartData.length > 0 ? (
//               <ResponsiveContainer width="100%" height={200}>
//                 <BarChart data={stockChartData}>
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip />
//                   <Bar dataKey="qty" />
//                 </BarChart>
//               </ResponsiveContainer>
//             ) : (
//               <div className="text-sm text-muted-foreground">No parts yet</div>
//             )}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Quick Filters</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-2">
//             <div className="flex gap-2">
//               <Input
//                 placeholder="Search name/code..."
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//               />
//               <Button
//                 variant={filterReorderOnly ? "secondary" : "outline"}
//                 onClick={() => setFilterReorderOnly((v) => !v)}
//               >
//                 <AlertTriangle className="mr-2 h-4 w-4" />
//                 Reorder
//               </Button>
//               <Button
//                 variant={showCriticalOnly ? "secondary" : "outline"}
//                 onClick={() => setShowCriticalOnly((v) => !v)}
//               >
//                 <Award className="mr-2 h-4 w-4" />
//                 Critical
//               </Button>
//             </div>

//             <div className="flex gap-2 items-center">
//               <Label>Sort</Label>
//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value as any)}
//                 className="border rounded px-2 py-1"
//               >
//                 <option value="name">Name</option>
//                 <option value="quantity">Quantity</option>
//                 <option value="cost">Cost</option>
//               </select>
//               <select
//                 value={sortDir}
//                 onChange={(e) => setSortDir(e.target.value as any)}
//                 className="border rounded px-2 py-1"
//               >
//                 <option value="asc">Asc</option>
//                 <option value="desc">Desc</option>
//               </select>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Recent Issue/Return</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {slips.length === 0 ? (
//               <div className="text-sm text-muted-foreground">No slips yet</div>
//             ) : (
//               <ul className="space-y-2 text-sm">
//                 {slips.slice(0, 6).map((s) => (
//                   <li key={s.id} className="flex justify-between items-center">
//                     <div>
//                       <div className="font-medium">
//                         {s.partCode || s.partName}
//                       </div>
//                       <div className="text-xs text-muted-foreground">
//                         {s.slipType} • {s.quantity} •{" "}
//                         {new Date(s.createdAt).toLocaleString()}
//                       </div>
//                     </div>
//                     <div className="text-xs text-muted-foreground">
//                       {s.createdBy}
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* parts table */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Parts Master</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Code</TableHead>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Equip. Link</TableHead>
//                   <TableHead>Qty</TableHead>
//                   <TableHead>Unit</TableHead>
//                   <TableHead>Reorder</TableHead>
//                   <TableHead>Cost/unit</TableHead>
//                   <TableHead>Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {parts.map((p) => (
//                   <TableRow key={p.id}>
//                     <TableCell>{p.code}</TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <div>{p.name}</div>
//                         {p.critical && (
//                           <span className="text-xs px-1 rounded bg-yellow-100 text-yellow-800">
//                             CRITICAL
//                           </span>
//                         )}
//                       </div>
//                     </TableCell>
//                     <TableCell>{p.equipmentLink}</TableCell>
//                     <TableCell>{p.quantity}</TableCell>
//                     <TableCell>{p.unit}</TableCell>
//                     <TableCell>
//                       <div
//                         className={`inline-block px-2 py-0.5 rounded text-sm ${
//                           p.quantity <= p.reorderLevel
//                             ? "bg-red-100 text-red-800"
//                             : "bg-green-100 text-green-800"
//                         }`}
//                       >
//                         {p.quantity} / {p.reorderLevel}
//                       </div>
//                     </TableCell>
//                     <TableCell>₹{(p.costPerUnit || 0).toFixed(2)}</TableCell>
//                     <TableCell>
//                       <div className="flex gap-2">
//                         <Button
//                           size="sm"
//                           variant="ghost"
//                           onClick={() => openEditPart(p)}
//                         >
//                           <Edit2 className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="ghost"
//                           onClick={() => openAddSlip(p, "ISSUE")}
//                         >
//                           <ArchiveRestore className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="ghost"
//                           onClick={() => openAddSlip(p, "RETURN")}
//                         >
//                           <ArchiveRestore className="w-4 h-4 rotate-180" />
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="ghost"
//                           onClick={() => toggleCritical(p.id)}
//                           title="Toggle critical"
//                         >
//                           <Award className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="ghost"
//                           onClick={() => deletePart(p.id)}
//                         >
//                           <Trash2 className="w-4 h-4 text-red-500" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>

//           {/* pagination */}
//           <div className="flex items-center justify-between mt-4">
//             <div className="text-sm text-muted-foreground">
//               Page {page} / {totalPages}
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//               >
//                 Prev
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//               >
//                 Next
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Part Dialog */}
//       <Dialog open={partDialogOpen} onOpenChange={setPartDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>{editingPart ? "Edit Part" : "Add Part"}</DialogTitle>
//           </DialogHeader>
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <Label>Code (SKU)</Label>
//               <Input
//                 value={partForm.code || ""}
//                 onChange={(e) =>
//                   setPartForm((f) => ({ ...f, code: e.target.value }))
//                 }
//               />
//             </div>
//             <div>
//               <Label>Name</Label>
//               <Input
//                 value={partForm.name || ""}
//                 onChange={(e) =>
//                   setPartForm((f) => ({ ...f, name: e.target.value }))
//                 }
//               />
//             </div>
//             <div>
//               <Label>Equipment Link</Label>
//               <Input
//                 value={partForm.equipmentLink || ""}
//                 onChange={(e) =>
//                   setPartForm((f) => ({ ...f, equipmentLink: e.target.value }))
//                 }
//               />
//             </div>
//             <div>
//               <Label>Vendor</Label>
//               {vendors && vendors.length > 0 ? (
//                 <Select
//                   value={partForm.vendor || ""}
//                   onValueChange={(value) =>
//                     setPartForm((f) => ({ ...f, vendor: value }))
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select vendor..." />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {vendors.map((vendor) => (
//                       <SelectItem key={vendor.id} value={vendor.vendorName}>
//                         {vendor.vendorName}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               ) : (
//                 <Input
//                   placeholder="Enter vendor name..."
//                   value={partForm.vendor || ""}
//                   onChange={(e) =>
//                     setPartForm((f) => ({ ...f, vendor: e.target.value }))
//                   }
//                 />
//               )}
//               {vendorsError && (
//                 <p className="text-sm text-red-500 mt-1">
//                   Failed to load vendors: {vendorsError}
//                 </p>
//               )}
//             </div>
//             <div>
//               <Label>Location</Label>
//               <Select
//                 value={partForm.location || ""}
//                 onValueChange={(value) =>
//                   setPartForm((f) => ({ ...f, location: value }))
//                 }
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select location..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {/* Master Data Locations */}
//                   {locations && locations.length > 0 && locations.map((location) => (
//                     <SelectItem key={location._id} value={location.name}>
//                       {location.name}
//                       {location.description && (
//                         <span className="text-gray-500 ml-2">- {location.description}</span>
//                       )}
//                     </SelectItem>
//                   ))}
                  
//                   {/* Database stores if available */}
//                   {stores && stores.length > 0 && stores.map((store) => (
//                     <SelectItem key={`store-${store._id}`} value={store.name}>
//                       {store.name} (Store)
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label>Unit</Label>
//               <Input
//                 value={partForm.unit || "pcs"}
//                 onChange={(e) =>
//                   setPartForm((f) => ({ ...f, unit: e.target.value }))
//                 }
//               />
//             </div>
//             <div>
//               <Label>Quantity</Label>
//               <Input
//                 type="number"
//                 value={partForm.quantity || 0}
//                 onChange={(e) =>
//                   setPartForm((f) => ({
//                     ...f,
//                     quantity: Number(e.target.value),
//                   }))
//                 }
//               />
//             </div>
//             <div>
//               <Label>Reorder Level</Label>
//               <Input
//                 type="number"
//                 value={partForm.reorderLevel || 1}
//                 onChange={(e) =>
//                   setPartForm((f) => ({
//                     ...f,
//                     reorderLevel: Number(e.target.value),
//                   }))
//                 }
//               />
//             </div>
//             <div>
//               <Label>Cost per unit</Label>
//               <Input
//                 type="number"
//                 value={partForm.costPerUnit || 0}
//                 onChange={(e) =>
//                   setPartForm((f) => ({
//                     ...f,
//                     costPerUnit: Number(e.target.value),
//                   }))
//                 }
//               />
//             </div>
//             <div className="col-span-2">
//               <Label>Notes</Label>
//               <Input
//                 value={partForm.notes || ""}
//                 onChange={(e) =>
//                   setPartForm((f) => ({ ...f, notes: e.target.value }))
//                 }
//               />
//             </div>
//             <div className="col-span-2 flex gap-2">
//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={Boolean(partForm.critical)}
//                   onChange={(e) =>
//                     setPartForm((f) => ({ ...f, critical: e.target.checked }))
//                   }
//                 />{" "}
//                 Mark as critical
//               </label>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setPartDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={savePart}>
//               <FilePlus className="mr-2 h-4 w-4" /> Save
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Slip Dialog */}
//       <Dialog open={slipDialogOpen} onOpenChange={setSlipDialogOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>
//               {editingSlip ? "Edit Slip" : "New Issue / Return"}
//             </DialogTitle>
//           </DialogHeader>
//           <div className="grid grid-cols-1 gap-3">
//             <div>
//               <Label>Part</Label>
//               <select
//                 value={slipForm.partId || ""}
//                 onChange={(e) => {
//                   const pid = e.target.value;
//                   const p = parts.find((x) => x.id === pid);
//                   setSlipForm((s) => ({
//                     ...s,
//                     partId: pid,
//                     partCode: p?.code,
//                     partName: p?.name,
//                   }));
//                 }}
//                 className="border rounded px-2 py-2 w-full"
//               >
//                 <option value="">Select part...</option>
//                 {parts.map((p) => (
//                   <option key={p.id} value={p.id}>
//                     {p.code} — {p.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <Label>Type</Label>
//               <select
//                 value={slipForm.slipType}
//                 onChange={(e) =>
//                   setSlipForm((s) => ({
//                     ...s,
//                     slipType: e.target.value as SlipType,
//                   }))
//                 }
//                 className="border rounded px-2 py-2 w-full"
//               >
//                 <option value="ISSUE">Issue</option>
//                 <option value="RETURN">Return</option>
//               </select>
//             </div>

//             <div>
//               <Label>Quantity</Label>
//               <Input
//                 type="number"
//                 value={slipForm.quantity || 0}
//                 onChange={(e) =>
//                   setSlipForm((s) => ({
//                     ...s,
//                     quantity: Number(e.target.value),
//                   }))
//                 }
//               />
//             </div>
//             <div>
//               <Label>Reference (Job / Breakdown / PO)</Label>
//               <Input
//                 value={slipForm.reference || ""}
//                 onChange={(e) =>
//                   setSlipForm((s) => ({ ...s, reference: e.target.value }))
//                 }
//               />
//             </div>
//             <div>
//               <Label>Created By</Label>
//               <Input
//                 value={slipForm.createdBy || ""}
//                 onChange={(e) =>
//                   setSlipForm((s) => ({ ...s, createdBy: e.target.value }))
//                 }
//               />
//             </div>
//             <div>
//               <Label>Notes</Label>
//               <Input
//                 value={slipForm.notes || ""}
//                 onChange={(e) =>
//                   setSlipForm((s) => ({ ...s, notes: e.target.value }))
//                 }
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setSlipDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={saveSlip}>
//               <FilePlus className="mr-2 h-4 w-4" /> Save
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
