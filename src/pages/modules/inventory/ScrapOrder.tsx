import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Edit2,
  Eye,
  ShieldAlert,
  Search,
} from "lucide-react";
import { usePermission } from "@/hooks/userPermission";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import {
  getScrapOrders,
  createScrapOrder,
  approveScrapOrder,
  deleteScrapOrder,
  updateScrapOrder,
} from "@/redux/slices/scrapOrderSlice";
import { fetchProducts } from "@/redux/slices/productSlice";

const EMPTY_FORM = {
  productId: "",
  quantity: "",
  reason: "",
  scrapLocation: "",
  remark: "",
};

const ScrapManagement: React.FC = () => {
  const canView = usePermission("scrap", "view");
  const canCreate = usePermission("scrap", "create");
  const canEdit = usePermission("scrap", "edit");
  const canDelete = usePermission("scrap", "delete");
  const dispatch = useDispatch<any>();

  const { scrapOrders = [], loading: scrapLoading } = useSelector(
    (s: any) => s.scrap || {}
  );
  const { products = [], loading: productLoading } = useSelector(
    (s: any) => s.products || {}
  );

  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);

  const isLocationRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;
  const [locationFilter, setLocationFilter] = useState(isLocationRestricted ? userProfile.location : "all");

  const getLocationName = (loc: string | { name: string } | undefined) => {
    if (!loc) return "N/A";
    if (typeof loc === 'object') return loc.name || "N/A";
    const found = locations.find((l: any) => l._id === loc);
    return found ? found.name : loc;
  };



  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false); // View dialog
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // For view modal

  const [createForm, setCreateForm] = useState({
    productId: "",
    quantity: "",
    reason: "",
    remark: "",
    scrapLocation: isLocationRestricted ? userProfile.location : "",
  });
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [localScrapOrders, setLocalScrapOrders] = useState<any[]>([]);
  const orgId = localStorage.getItem('organisationId')

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const itemsPerPage = 10;

  // const getTotalStock = (product: any) => {
  //   if (!product?.stocks?.length) return 0;
  //   return product.stocks.reduce(
  //     (sum: number, s: any) => sum + (s.quantity || 0),
  //     0
  //   );
  // };


  useEffect(() => {
    dispatch(fetchMasterData("location"));
    dispatch(fetchProducts({ page: 1, limit: 10 }));
    dispatch(getScrapOrders({ location: locationFilter }));
    // Load scrap orders from localStorage
    const stored = localStorage.getItem('SCRAP_ORDERS');
    if (stored) {
      setLocalScrapOrders(JSON.parse(stored));
    }
  }, [dispatch, locationFilter]);

  // Merge Redux scrap orders with localStorage scrap orders
  const allScrapOrders = useMemo(() => {
    return [...localScrapOrders, ...scrapOrders];
  }, [localScrapOrders, scrapOrders]);

  // Filter scrap orders based on search and status
  const filteredScrapOrders = useMemo(() => {
    return allScrapOrders.filter((order: any) => {
      let product: any = null;

      // CASE 1: productId is populated object
      if (order.productId && typeof order.productId === "object") {
        product = order.productId;
      }

      // CASE 2: productId is ObjectId string
      if (!product) {
        product = products.find(
          (p: any) => String(p._id) === String(order.productId)
        );
      }

      const productName = product?.name ?? "Unknown";
      const productSku = product?.sku ?? "N/A";

      const matchesSearch =
        productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.reason?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allScrapOrders, searchTerm, statusFilter, products]);

  // Paginate filtered orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredScrapOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredScrapOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredScrapOrders.length / itemsPerPage);

  const getTotalStock = (product: any) => {
    if (!product?.stocks?.length) return 0;
    return product.stocks.reduce(
      (sum: number, s: any) => sum + (s.quantity || 0),
      0
    );
  };


  const selectedCreateProduct = useMemo(
    () => products.find((p: any) => p._id === createForm.productId) || null,
    [products, createForm.productId]
  );

  const selectedEditProduct = useMemo(
    () => products.find((p: any) => p._id === editForm.productId) || null,
    [products, editForm.productId]
  );

  // CREATE
  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!createForm.productId || !createForm.quantity || !createForm.reason) {
      toast.error("Product, quantity and reason are required");
      return;
    }
    const qty = Number(createForm.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Quantity must be a positive number");
      return;
    }
    const availableStock = getTotalStock(selectedCreateProduct);

    if (selectedCreateProduct && qty > availableStock) {
      toast.error(`Only ${availableStock} available`);
      return;
    }

    try {
      setCreating(true);
      await dispatch(
        createScrapOrder({ ...createForm, quantity: qty })
      ).unwrap();
      toast.success("Scrap order created");
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      dispatch(getScrapOrders());
      dispatch(fetchProducts());
    } catch (err: any) {
      toast.error(err?.message || "Failed to create scrap order");
    } finally {
      setCreating(false);
    }
  };

  // OPEN EDIT
  const openEdit = (order: any) => {
    setEditingId(order._id);
    setEditForm({
      productId: order.productId || "",
      quantity: String(order.quantity || ""),
      reason: order.reason || "",
      scrapLocation: order.scrapLocation || "",
      remark: order.remark || "",
    });
    setEditOpen(true);
  };

  // OPEN VIEW
  const openView = (order: any) => {
    setSelectedOrder(order);
    setViewOpen(true);
  };

  // UPDATE
  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingId) return toast.error("No scrap order selected");
    if (!editForm.productId || !editForm.quantity || !editForm.reason) {
      toast.error("Product, quantity and reason are required");
      return;
    }
    const qty = Number(editForm.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Quantity must be a positive number");
      return;
    }

    try {
      setUpdating(true);
      await dispatch(
        updateScrapOrder({
          id: editingId,
          data: { ...editForm, quantity: qty },
        })
      ).unwrap();
      toast.success("Scrap order updated");
      setEditOpen(false);
      setEditingId(null);
      setEditForm(EMPTY_FORM);
      dispatch(getScrapOrders());
      dispatch(fetchProducts());
    } catch (err: any) {
      toast.error(err?.message || "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const resolveProduct = (order: any) => {
    if (!order?.productId) return null;

    // If populated object
    if (typeof order.productId === "object" && order.productId.sku) {
      return order.productId;
    }

    // If ObjectId string
    return products.find(
      (p: any) => String(p._id) === String(order.productId)
    ) || null;
  };


  const handleApprove = async (id: string) => {
    if (!confirm("Approve and deduct stock?")) return;
    try {
      await dispatch(approveScrapOrder(id)).unwrap();
      toast.success("Approved & Stock Deducted");
      dispatch(fetchProducts());
      dispatch(getScrapOrders());
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scrap order?")) return;
    try {
      await dispatch(deleteScrapOrder(id)).unwrap();
      toast.success("Deleted");
      dispatch(getScrapOrders());
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  };
  const availableCreateStock = useMemo(() => {
    return selectedCreateProduct
      ? getTotalStock(selectedCreateProduct)
      : 0;
  }, [selectedCreateProduct]);
  const remainingCreateStock = useMemo(() => {
    const qty = Number(createForm.quantity || 0);
    if (!selectedCreateProduct) return 0;
    return Math.max(availableCreateStock - qty, 0);
  }, [availableCreateStock, createForm.quantity, selectedCreateProduct]);

  // DELETE LOCAL (from localStorage)
  const handleDeleteLocal = (index: number) => {
    if (!confirm("Delete this scrap order?")) return;
    const updated = localScrapOrders.filter((_, i) => i !== index);
    setLocalScrapOrders(updated);
    localStorage.setItem('SCRAP_ORDERS', JSON.stringify(updated));
    toast.success("Scrap order deleted");
  };
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
  return (
    <div className="min-h-screen bg-slate-50 ">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Scrap Management</h1>

          {/* CREATE DIALOG */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canCreate} className="px-4">
                <Plus className="w-4 h-4 mr-2" /> Create Scrap Order
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Create Scrap Order</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="grid gap-4 py-2">
                <div>
                  <Label>Product *</Label>
                  <Select
                    value={createForm.productId}
                    onValueChange={(v) =>
                      setCreateForm({ ...createForm, productId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name} — Stock: {getTotalStock(p)}

                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCreateProduct && (
                    <p className="text-xs mt-1">
                      <span className="text-muted-foreground">
                        Available: {availableCreateStock}
                      </span>
                      <br />
                      <span className="font-semibold text-rose-600">
                        After Scrap: {remainingCreateStock}
                      </span>
                    </p>
                  )}

                </div>

                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={createForm.quantity}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, quantity: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Reason *</Label>
                  <Select
                    value={createForm.reason}
                    onValueChange={(v) =>
                      setCreateForm({ ...createForm, reason: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="obsolete">Obsolete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Location</Label>
                  {/* [!code ++] Replace Input with Select */}
                  <Select
                    value={createForm.scrapLocation}
                    onValueChange={(v) =>
                      setCreateForm({ ...createForm, scrapLocation: v })
                    }
                    disabled={isLocationRestricted}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(l => (
                        <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Remark</Label>
                  <Textarea
                    value={createForm.remark}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, remark: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setCreateForm(EMPTY_FORM)}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        {/* SEARCH AND FILTERS */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search by product name, SKU, or reason..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={locationFilter}
                onValueChange={setLocationFilter}
                disabled={isLocationRestricted}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(l => (
                    <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1); // Reset to first page on filter
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[850px]">
              {/* HEADER */}
              <TableHeader className="bg-gray-100/70 backdrop-blur-sm">
                <TableRow className="border-b">
                  {[
                    "Product",
                    "SKU",
                    "Qty",
                    "Stock",
                    "Reason",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((head, i) => (
                    <TableHead
                      key={i}
                      className={`text-gray-700 font-semibold whitespace-nowrap ${head === "Actions" ? "text-right" : ""
                        }`}
                    >
                      {head}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              {/* BODY */}
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      {searchTerm || statusFilter !== "all"
                        ? "No scrap orders found matching your filters"
                        : "No scrap orders found"}
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.map((order: any, index: number) => {
                  const product = resolveProduct(order);

                  // For localStorage items, use productName directly
                  const productName = order.productName || product.name;
                  const productSku = product.sku || order.sku;
                  const fullProduct = products.find(
                    (p: any) => p._id === (product._id || order.productId)
                  );

                  const productStock = fullProduct
                    ? getTotalStock(fullProduct)
                    : 0;



                  return (
                    <TableRow
                      key={order._id || order.id || index}
                      className={`
                transition-all hover:bg-gray-50/80 
                ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              `}
                    >
                      {/* PRODUCT */}
                      <TableCell className="font-medium text-gray-900">
                        {productName}
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="text-gray-600">
                        {productSku}
                      </TableCell>

                      {/* QTY */}
                      <TableCell className="font-semibold text-rose-600">
                        {order.quantity}
                      </TableCell>

                      {/* STOCK */}
                      <TableCell className="text-gray-800">
                        {productStock}
                      </TableCell>

                      {/* REASON */}
                      <TableCell className="capitalize text-gray-700">
                        {order.reason}
                      </TableCell>

                      {/* STATUS */}
                      <TableCell>
                        {order.status === "pending" ? (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit text-amber-700 border-amber-300 bg-amber-50 px-2 py-0.5 text-xs"
                          >
                            <Clock className="w-3 h-3" /> Pending
                          </Badge>
                        ) : (
                          <Badge className="flex items-center gap-1 w-fit bg-green-600 text-white px-2 py-0.5 text-xs">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </Badge>
                        )}
                      </TableCell>

                      {/* DATE */}
                      <TableCell className="text-gray-600 text-sm">
                        {order.createdAt
                          ? format(new Date(order.createdAt), "PP")
                          : order.date
                            ? format(new Date(`${order.date}T00:00:00`), "PP")
                            : "N/A"}
                      </TableCell>




                      {/* ACTIONS */}
                      <TableCell className="text-right space-x-1">
                        {/* VIEW */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-blue-50 text-blue-600"
                          onClick={() => openView(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* APPROVE */}
                        {order.status === "pending" && order._id && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white px-3"
                            onClick={() => handleApprove(order._id)}
                          >
                            Approve
                          </Button>
                        )}

                        {/* EDIT */}
                        {order._id && (
                          <Button
                            disabled={!canEdit}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                            onClick={() => openEdit(order)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}

                        {/* DELETE */}
                        <Button
                          disabled={!canDelete}
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => order._id ? handleDelete(order._id) : handleDeleteLocal(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredScrapOrders.length)} of {filteredScrapOrders.length} orders
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ==================== VIEW DIALOG ==================== */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-[650px] rounded-xl border border-gray-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                Scrap Order Details
              </DialogTitle>
              <p className="text-sm text-gray-500">
                View request details and history
              </p>
            </DialogHeader>

            {selectedOrder && (() => {
              const product = resolveProduct(selectedOrder);

              return (
                <div className="mt-4 space-y-5">
                  {/* PRODUCT INFO */}
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <h3 className="text-sm font-semibold mb-3">Product Information</h3>

                    <div className="grid grid-cols-4 gap-y-3 text-sm">
                      <span className="font-medium text-gray-600">Product:</span>
                      <span className="col-span-3 font-medium">
                        {product?.name || "N/A"}
                      </span>

                      <span className="font-medium text-gray-600">SKU:</span>
                      <span className="col-span-3">
                        {product?.sku || "N/A"}
                      </span>

                      <span className="font-medium text-gray-600">Quantity:</span>
                      <span className="col-span-3 font-bold text-rose-600 text-base">
                        {selectedOrder.quantity}
                      </span>
                    </div>
                  </div>

                  {/* TIMELINE */}
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <h3 className="text-sm font-semibold mb-3">Timeline</h3>
                    <span className="text-sm text-gray-700">
                      Created on: {format(new Date(selectedOrder.createdAt), "PPpp")}
                    </span>
                  </div>
                </div>
              );
            })()}


            <div className="flex justify-end mt-6">
              <DialogClose asChild>
                <Button variant="outline" className="px-5">
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

        {/* ==================== EDIT DIALOG ==================== */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Edit Scrap Order</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="grid gap-4 py-2">
              <div>
                <Label>Product *</Label>
                <Select
                  value={editForm.productId}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, productId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} — Stock: {getTotalStock(p)}

                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEditProduct && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {getTotalStock(selectedEditProduct)}

                  </p>
                )}
              </div>

              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.quantity}
                  onChange={(e) =>
                    setEditForm({ ...editForm, quantity: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Reason *</Label>
                <Select
                  value={editForm.reason}
                  onValueChange={(v) => setEditForm({ ...editForm, reason: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="obsolete">Obsolete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Location</Label>
                {/* [!code ++] Replace Input with Select */}
                <Select
                  value={createForm.scrapLocation}
                  onValueChange={(v) =>
                    setCreateForm({ ...createForm, scrapLocation: v })
                  }
                  disabled={isLocationRestricted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(l => (
                      <SelectItem key={l._id} value={l.name}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Remark</Label>
                <Textarea
                  value={editForm.remark}
                  onChange={(e) =>
                    setEditForm({ ...editForm, remark: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setEditOpen(false);
                      setEditForm(EMPTY_FORM);
                      setEditingId(null);
                    }}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={updating}>
                  {updating ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ScrapManagement;
