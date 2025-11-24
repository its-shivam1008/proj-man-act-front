import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, CheckCircle, Clock, Edit2, Eye } from "lucide-react";

// shadcn/ui imports
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

// redux actions
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
  const dispatch = useDispatch<any>();

  const { scrapOrders = [], loading: scrapLoading } = useSelector(
    (s: any) => s.scrap || {}
  );
  const { products = [], loading: productLoading } = useSelector(
    (s: any) => s.products || {}
  );

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false); // View dialog
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // For view modal

  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    dispatch(getScrapOrders());
    dispatch(fetchProducts());
  }, [dispatch]);

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
    if (selectedCreateProduct && qty > selectedCreateProduct.quantity) {
      toast.error(`Only ${selectedCreateProduct.quantity} available`);
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

  return (
    <div className="min-h-screen bg-slate-50 ">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Scrap Management</h1>

          {/* CREATE DIALOG */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
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
                          {p.name} — Stock: {p.quantity ?? 0}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCreateProduct && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {selectedCreateProduct.quantity}
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
                  <Label>Location (optional)</Label>
                  <Input
                    value={createForm.scrapLocation}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        scrapLocation: e.target.value,
                      })
                    }
                  />
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
                      className={`text-gray-700 font-semibold whitespace-nowrap ${
                        head === "Actions" ? "text-right" : ""
                      }`}
                    >
                      {head}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              {/* BODY */}
              <TableBody>
                {scrapOrders.map((order: any, index: number) => {
                  const product =
                    products.find((p: any) => p._id === order.productId) || {};

                  return (
                    <TableRow
                      key={order._id}
                      className={`
                transition-all hover:bg-gray-50/80 
                ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              `}
                    >
                      {/* PRODUCT */}
                      <TableCell className="font-medium text-gray-900">
                        {product.name || "Unknown"}
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="text-gray-600">
                        {product.sku || "N/A"}
                      </TableCell>

                      {/* QTY */}
                      <TableCell className="font-semibold text-rose-600">
                        {order.quantity}
                      </TableCell>

                      {/* STOCK */}
                      <TableCell className="text-gray-800">
                        {product.quantity ?? 0}
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
                        {format(new Date(order.date), "PP")}
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
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white px-3"
                            onClick={() => handleApprove(order._id)}
                          >
                            Approve
                          </Button>
                        )}

                        {/* EDIT */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-indigo-50 text-indigo-600"
                          onClick={() => openEdit(order)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        {/* DELETE */}
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => handleDelete(order._id)}
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

            {selectedOrder && (
              <div className="mt-4 space-y-5">
                {/* TOP CARD */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold mb-3">
                    Product Information
                  </h3>

                  <div className="grid grid-cols-4 gap-y-3 text-sm">
                    <span className="font-medium text-gray-600">Product:</span>
                    <span className="col-span-3 font-medium">
                      {products.find(
                        (p: any) => p._id === selectedOrder.productId
                      )?.name || "N/A"}
                    </span>

                    <span className="font-medium text-gray-600">SKU:</span>
                    <span className="col-span-3">
                      {products.find(
                        (p: any) => p._id === selectedOrder.productId
                      )?.sku || "N/A"}
                    </span>

                    <span className="font-medium text-gray-600">Quantity:</span>
                    <span className="col-span-3 font-bold text-rose-600 text-base">
                      {selectedOrder.quantity}
                    </span>
                  </div>
                </div>

                {/* MIDDLE CARD */}
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold mb-3">Order Details</h3>

                  <div className="grid grid-cols-4 gap-y-3 text-sm">
                    <span className="font-medium text-gray-600">Reason:</span>
                    <span className="col-span-3 capitalize">
                      {selectedOrder.reason}
                    </span>

                    <span className="font-medium text-gray-600">Status:</span>
                    <span className="col-span-3">
                      <Badge
                        variant={
                          selectedOrder.status === "pending"
                            ? "outline"
                            : "default"
                        }
                        className={
                          selectedOrder.status === "approved"
                            ? "bg-green-600 text-white"
                            : selectedOrder.status === "rejected"
                            ? "bg-red-600 text-white"
                            : ""
                        }
                      >
                        {selectedOrder.status}
                      </Badge>
                    </span>

                    {selectedOrder.scrapLocation && (
                      <>
                        <span className="font-medium text-gray-600">
                          Location:
                        </span>
                        <span className="col-span-3">
                          {selectedOrder.scrapLocation}
                        </span>
                      </>
                    )}

                    {selectedOrder.remark && (
                      <>
                        <span className="font-medium text-gray-600">
                          Remark:
                        </span>
                        <span className="col-span-3 text-gray-700">
                          {selectedOrder.remark}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* BOTTOM TIMELINE STYLE */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold mb-3">Timeline</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                    <span className="text-sm text-gray-700">
                      Created on: {format(new Date(selectedOrder.date), "PPpp")}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                        {p.name} — Stock: {p.quantity ?? 0}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEditProduct && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedEditProduct.quantity}
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
                <Label>Location (optional)</Label>
                <Input
                  value={editForm.scrapLocation}
                  onChange={(e) =>
                    setEditForm({ ...editForm, scrapLocation: e.target.value })
                  }
                />
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
