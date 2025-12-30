import { usePermission } from "@/hooks/userPermission";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import {
  Download, Plus, Trash2,
  ShieldAlert,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  fetchWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
} from "@/redux/slices/production/workOrderSlice";
import { fetchProducts } from "@/redux/slices/productSlice";
/* -----------------------------------
   Type Definitions
----------------------------------- */
type WorkOrder = {
  _id?: string;
  id?: string;
  orderNo: string;
  productCode?: string;
  productName?: string;
  productId?: string;
  quantity: number;
  batchNo?: string;
  bomId?: string;
  routingId?: string;
  workCenterId?: string;
  operators?: string[];
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  status?: "planned" | "released" | "in-progress" | "paused" | "completed" | "cancelled";
  location?: string;
  reservedMaterials?: { itemId: string; qty: number }[];
  attachments?: { id: string; name: string; dataUrl: string }[];
  plannedHours?: number;
  plannedCost?: number;
  actualHours?: number;
  // New fields
  notes?: string;
  imageFile?: File | null;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/* -----------------------------------
   Main Component
----------------------------------- */
export default function WorkOrdersAdvanced() {
  const dispatch = useDispatch<AppDispatch>();

  const { list: orders, pagination } = useSelector(
    (state: RootState) => state.workOrders
  );

  const { products } = useSelector((state: RootState) => state.products);
  const { locations } = useSelector((state: RootState) => state.masterData);
  const { userProfile } = useSelector((state: RootState) => state.auth);

  const canView = usePermission("productOrders", "view");
  const canCreate = usePermission("productOrders", "create");
  const canEdit = usePermission("productOrders", "edit");
  const canDelete = usePermission("productOrders", "delete");

  // Location filter states
  const [locationFilter, setLocationFilter] = useState("all");
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Location restriction logic
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

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



  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState<Partial<WorkOrder>>({
    productCode: "",
    productName: "",
    quantity: 0,
    batchNo: "",
    bomId: "",
    routingId: "",
    workCenterId: "",
    startDate: todayISO(),
    endDate: todayISO(),
    dueDate: todayISO(),
    status: "planned",
    location: undefined,
    operators: [],
    attachments: [],
    notes: "",
    imageFile: null,
    imageUrl: "",
  });

  /* -----------------------------------
     Persist to localStorage
  ----------------------------------- */
  const orgID = localStorage.getItem('organisationId') || undefined;
  useEffect(() => {
    if (orgID) {
      (dispatch as any)(fetchProducts({ page: 1, limit: 100 }));
    }
    // Fetch master data for locations
    (dispatch as any)(fetchMasterData("location"));
  }, [dispatch, orgID]);

  // Auto-set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Load work orders when location filter or pagination changes
  useEffect(() => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    (dispatch as any)(fetchWorkOrders({
      location: locationParam,
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
    }));
  }, [dispatch, locationFilter, currentPage, itemsPerPage, searchTerm]);

  // Location filter change handler
  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    setCurrentPage(1); // Reset to first page when changing location
  };

  // Helper to get location name
  const getLocationName = (locData: string | { _id: string; name: string } | undefined) => {
    if (!locData) return "No Location";
    if (typeof locData === 'object' && locData.name) return locData.name;
    const found = locations.find((l: any) => l._id === locData);
    return found ? found.name : "Unknown Location";
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };


  /* -----------------------------------
     Derived Data
  ----------------------------------- */
  // Remove unused ordersByStatus for now since we're not displaying charts

  /* -----------------------------------
     CRUD Operations
  ----------------------------------- */
  const openNew = () => {
    setEditing(null);
    setForm({
      productName: "",
      quantity: 0,
      batchNo: "",
      bomId: "",
      routingId: "",
      workCenterId: "",
      startDate: todayISO(),
      endDate: todayISO(),
      dueDate: todayISO(),
      status: "planned",
      location: isLocationRestricted ? userProfile.location : undefined,
      operators: [],
      attachments: [],
      notes: "",
      imageFile: null,
      imageUrl: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (wo: any) => {
    setEditing(wo);
    setForm({ 
      ...wo,
      location: wo.location || (isLocationRestricted ? userProfile.location : undefined)
    });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.productName || !form.quantity || form.quantity <= 0) {
      alert("Product and quantity are required");
      return;
    }

    const payload: any = {
      productId: form.productId,
      productName: form.productName,
      quantity: Number(form.quantity),
      batchNo: form.batchNo,
      startDate: form.startDate,
      endDate: form.endDate,
      dueDate: form.dueDate,
      status: form.status || "planned",
      location: form.location,
      notes: form.notes,
      imageUrl: form.imageUrl,
      plannedHours: Number(form.plannedHours) || 0,
    };

    if (editing?._id || editing?.id) {
      dispatch(updateWorkOrder({ id: editing._id || editing.id || '', data: payload }));
    } else {
      dispatch(createWorkOrder(payload));
    }

    setDialogOpen(false);
  };


  const remove = (id: string) => {
    if (!confirm("Delete this work order?")) return;
    dispatch(deleteWorkOrder(id));
  };
  ;
  useEffect(() => {
    if (!form.productCode) return;

    const selected = products.find(p => p.code === form.productCode);

    if (selected) {
      setForm((prev) => ({
        ...prev,
        productName: selected.name,
      }));
    }
  }, [form.productCode, products]);

  /* --------
  --------------------------
     Inventory Safe Renderer
  ----------------------------------- */
  // const renderInventory = () => {
  //   const entries = Object.entries(inventory || {});
  //   if (entries.length === 0) return <div>No inventory data</div>;

  //   return entries.map(([key, val]) => {
  //     const item = items.find((i: any) => i.id === key);
  //     const name = item?.name || key;
  //     const qty = typeof val === "object" ? val.qty : val;
  //     const wh = typeof val === "object" ? val.warehouse : "—";
  //     return (
  //       <div key={key} className="text-sm border-b border-dashed py-1">
  //         {name}: <strong>{qty}</strong> (Warehouse: {wh})
  //       </div>
  //     );
  //   });
  // };

  /* -----------------------------------
     Export CSV
  ----------------------------------- */
  const exportOrdersCSV = () => {
    if (!orders.length) return alert("No orders to export");
    const keys = [
      "orderNo", "productName", "quantity", "workCenterId",
      "status", "plannedHours", "actualHours",
    ];
    const csv = [
      keys.join(","),
      ...orders.map((o) => keys.map((k) => `"${(o as any)[k] ?? ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workorders_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -----------------------------------
     UI Rendering
  ----------------------------------- */
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Work Orders </h2>
          <p className="text-muted-foreground">
            Create, edit, and track work orders with inventory integration.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={!canCreate}
            onClick={() => canCreate && openNew()}
            className={!canCreate ? "opacity-50 cursor-not-allowed" : ""}
          >
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Button>

          <Button
            variant="outline"
            disabled={!canView}
            onClick={() => canView && exportOrdersCSV()}
            className={!canView ? "opacity-50 cursor-not-allowed" : ""}
          >

            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Location Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search work orders..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select 
          disabled={isLocationRestricted} 
          value={locationFilter} 
          onValueChange={handleLocationFilterChange}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {(locations || []).map((loc: any) => (
              <SelectItem key={loc._id} value={loc._id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Snapshot */}
      <Card>
        <CardHeader><CardTitle>Inventory Snapshot</CardTitle></CardHeader>
        <CardContent>
          {/* <div className="max-h-48 overflow-y-auto">{renderInventory()}</div> */}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader><CardTitle>Work Orders ({pagination.total})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Qty</TableHead>
                {/* <TableHead>Work Center</TableHead> */}
                <TableHead>Status</TableHead>
                <TableHead>Planned Hrs</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6">
                    {searchTerm || locationFilter !== "all" 
                      ? "No work orders match your filters" 
                      : "No work orders found"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((wo) => (
                  <TableRow key={wo._id || wo.id}>
                    <TableCell>{wo.orderNo}</TableCell>
                    <TableCell>{wo.productName}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        <MapPin className="h-3 w-3" />
                        {getLocationName(wo.location)}
                      </span>
                    </TableCell>
                    <TableCell>{wo.quantity}</TableCell>
                    {/* <TableCell>{wo.workCenterId || "—"}</TableCell> */}
                    <TableCell><Badge>{wo.status}</Badge></TableCell>
                    <TableCell>{wo.plannedHours ?? "—"}</TableCell>

                    {/* Image Column */}
                    <TableCell>
                      {wo.imageUrl ? (
                        <img
                          src={wo.imageUrl}
                          alt="Work Order"
                          className="w-12 h-12 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => {
                            // Open image in modal or new tab
                            window.open(wo.imageUrl, '_blank');
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">No image</span>
                      )}
                    </TableCell>

                    {/* Notes Column */}
                    <TableCell>
                      {wo.notes ? (
                        <div
                          className="max-w-32 truncate cursor-pointer hover:text-blue-600"
                          title={wo.notes}
                        >
                          {wo.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No notes</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!canEdit}
                          onClick={() => canEdit && openEdit(wo)}
                          className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          ✏️
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!canDelete}
                          onClick={() => canDelete && remove(wo._id || wo.id || '')}
                          className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Work Order" : "New Work Order"}</DialogTitle>
          </DialogHeader>
          <div
            className="grid grid-cols-2 gap-3"
            style={{
              pointerEvents: editing ? (canEdit ? "auto" : "none") : (canCreate ? "auto" : "none"),
              opacity: editing ? (canEdit ? 1 : 0.6) : (canCreate ? 1 : 0.6),
            }}
          >

            {/* <div>
              <Label>Product Code</Label>
              <Input
                placeholder="Enter Product Code"
                value={form.productCode || ""}
                onChange={(e) =>
                  setForm({ ...form, productCode: e.target.value })
                }
              />
            </div> */}

            <div>
              <Label>Product</Label>
              <Select
                value={form.productName || ""}
                onValueChange={(value) => {
                  // 1. Find the full product object using the name
                  const selectedProduct = products.find(p => p.name === value);

                  // 2. Set both the Name (for display) and the ID (for the database)
                  setForm((prev) => ({
                    ...prev,
                    productName: value,
                    productId: selectedProduct?._id, // <--- CRITICAL FIX
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    // Use product.name as the value instead of product.code
                    <SelectItem key={product._id} value={product.name}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div>
              <Label>Quantity</Label>
              <Input type="number" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            {/* <div>
              <Label>Work Center</Label>
              <Input value={form.workCenterId || ""} onChange={(e) => setForm({ ...form, workCenterId: e.target.value })} />
            </div> */}
            <div>
              <Label>Status</Label>
              <Select
                value={form.status || "planned"}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Field */}
            <div>
              <Label>Location</Label>
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                    disabled={isLocationRestricted}
                  >
                    {form.location
                      ? (locations || []).find((l: any) => l._id === form.location)?.name
                      : "Select Location"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                
                {!isLocationRestricted && (
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search location..." />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          {(locations || []).map((l: any) => (
                            <CommandItem
                              key={l._id}
                              value={l.name}
                              onSelect={() => {
                                setForm({ ...form, location: l._id });
                                setLocationOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.location === l._id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {l.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
              {isLocationRestricted && (
                <p className="text-[10px] text-muted-foreground">
                  *Location is fixed based on your permissions.
                </p>
              )}
            </div>

            <div>
              <Label>Planned Hours</Label>
              <Input
                type="number"
                placeholder="e.g. 8"
                value={form.plannedHours || ""}
                onChange={(e) => setForm({ ...form, plannedHours: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate || todayISO()} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>

            {/* New Fields */}
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Enter any additional notes..."
              />
            </div>

            <div className="col-span-2">
              <Label>Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Create a preview URL
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setForm({
                        ...form,
                        imageFile: file,
                        imageUrl: reader.result as string
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {form.imageUrl && (
                <div className="mt-2">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="max-w-xs max-h-40 rounded border"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={editing ? !canEdit : !canCreate}
              onClick={() => (editing ? canEdit : canCreate) && save()}
            >
              Save
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
