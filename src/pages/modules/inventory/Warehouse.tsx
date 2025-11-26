import { usePermission } from "@/hooks/userPermission";
import React, { useState, useEffect } from "react";
import {
  Warehouse,
  Plus,
  Package,
  MapPin,
  Edit,
  Trash2,
  XCircle,
  AlertTriangle,
  Truck,
  History,
  Box,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWarehouses,
  addWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "@/redux/slices/warehouseSlice";
import { fetchProducts } from "@/redux/slices/productSlice";
import { toast } from "sonner";

// Types matching your backend exactly
interface Product {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  unitCost: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

interface WarehouseData {
  _id: string;
  name: string;
  type: string;
  location: string;
  capacity: number;
  unit: string;
  productId: string;
  productName?: string;
  lastGRN: { date: string; qty: number; po: string } | null;
  lastIssue: { date: string; qty: number; dept: string } | null;
  ageing: {
    "0-30": number;
    "30-60": number;
    "60-90": number;
    "90+": number;
  };
  inTransit?: number;
  reorderAlerts: string[];
  bins: string[];
}

interface EnrichedWarehouse extends WarehouseData {
  product: Product | null;
}

const WarehouseManagement: React.FC = () => {
  const dispatch = useDispatch();
  const canView = usePermission("warehouses", "view");
  const canCreate = usePermission("warehouses", "create");
  const canEdit = usePermission("warehouses", "edit");
  const canDelete = usePermission("warehouses", "delete");
  const { products = [] } = useSelector((state: any) => state.products);
  const { warehouses = [], loading } = useSelector(
    (state: any) => state.warehouse
  );

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 200 }));
    dispatch(fetchWarehouses({ page: 1, limit: 50 }));
  }, [dispatch]);

  // Enrich warehouse with real product data
  const enrichedWarehouses: EnrichedWarehouse[] = warehouses.map(
    (w: WarehouseData) => ({
      ...w,
      product: products.find((p: Product) => p._id === w.productId) || null,
    })
  );

  const getStockStatus = (qty: number, minStock: number) => {
    if (qty === 0)
      return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (qty <= minStock)
      return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this warehouse?")) {
      dispatch(deleteWarehouse(id))
        .unwrap()
        .then(() => toast.success("Warehouse deleted"))
        .catch(() => toast.error("Failed to delete"));
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const currentWarehouse = editingId
    ? enrichedWarehouses.find((w) => w._id === editingId)
    : null;
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold flex items-center gap-3 text-gray-800">
            <Warehouse className="w-10 h-10 text-blue-600" />
            Warehouse Management
          </h1>
          <Button
            disabled={!canCreate}
            onClick={() => setShowForm(true)}
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Warehouse
          </Button>
        </div>

        {/* Empty State */}
        {enrichedWarehouses.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-2xl shadow">
            <Warehouse className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">No warehouses created yet</p>
            <Button onClick={() => setShowForm(true)} className="mt-6">
              Create Your First Warehouse
            </Button>
          </div>
        )}

        {/* Warehouse Cards */}
        <Accordion type="single" collapsible className="space-y-6">
          {enrichedWarehouses.map((w) => {
            const stock = w.product?.quantity || 0;
            const minStock = w.product?.minStock || 0;
            const status = getStockStatus(stock, minStock);
            const totalValue = stock * (w.product?.unitCost || 0);

            return (
              <AccordionItem
                key={w._id}
                value={w._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border hover:shadow-2xl transition-all"
              >
                <AccordionTrigger className="px-8 py-6 hover:no-underline">
                  <div className="grid grid-cols-12 w-full items-center gap-6">
                    {/* Name & Product */}
                    <div className="col-span-5">
                      <div className="flex items-center gap-4">
                        <Package className="w-9 h-9 text-blue-600" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {w.name}
                          </h3>
                          {w.product ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Box className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                {w.product.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                • {w.product.sku}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-red-600">
                              No product linked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <Badge variant="secondary" className="text-sm">
                        {w.type}
                      </Badge>
                    </div>

                    {/* Location */}
                    <div className="col-span-2 text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {w.location}
                    </div>

                    {/* Live Stock */}
                    <div className="col-span-3 text-right">
                      <div className="text-3xl font-bold text-gray-800">
                        {stock.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">{w.unit}</div>
                      <Badge className={`mt-2 ${status.color}`}>
                        {status.label}
                        {status.label === "Low Stock" && ` (Min: ${minStock})`}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="bg-gradient-to-r from-gray-50 to-white px-8 py-8 border-t">
                  <div className="flex justify-end gap-3 mb-6">
                    <Button
                      disabled={!canEdit}
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(w._id)}
                    >
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button
                      disabled={!canDelete}
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(w._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Product Stock Details */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg flex items-center gap-2">
                        <Box className="w-5 h-5 text-blue-600" />
                        Current Stock Details
                      </h4>
                      {w.product ? (
                        <div className="bg-blue-50 p-6 rounded-xl space-y-4">
                          <div className="flex justify-between text-lg">
                            <span className="text-gray-600">Available</span>
                            <strong className="font-bold">
                              {stock.toLocaleString()} {w.unit}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Min Required</span>
                            <strong>
                              {minStock} {w.unit}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Unit Cost</span>
                            <strong>${w.product.unitCost}</strong>
                          </div>
                          <div className="border-t pt-3 flex justify-between">
                            <span className="font-medium">Total Value</span>
                            <strong className="text-green-600 text-xl">
                              ${totalValue.toLocaleString()}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <p className="text-red-600 italic">
                          Link a product to see stock
                        </p>
                      )}
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-600" />
                        Recent Transactions
                      </h4>
                      <div className="space-y-3">
                        {w.lastGRN && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="font-medium text-green-800">
                              Last GRN
                            </p>
                            <p className="text-sm">
                              {w.lastGRN.date} • +{w.lastGRN.qty} units • PO:{" "}
                              {w.lastGRN.po}
                            </p>
                          </div>
                        )}
                        {w.lastIssue && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="font-medium text-blue-800">
                              Last Issue
                            </p>
                            <p className="text-sm">
                              {w.lastIssue.date} • -{w.lastIssue.qty} units →{" "}
                              {w.lastIssue.dept}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock Health */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-bold text-lg">Stock Ageing</h4>
                        <div className="mt-4 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">0-30 days</span>
                            <strong className="text-green-600">
                              {w.ageing["0-30"]}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">30-60 days</span>
                            <strong className="text-yellow-600">
                              {w.ageing["30-60"]}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">60-90 days</span>
                            <strong className="text-orange-600">
                              {w.ageing["60-90"]}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">90+ days</span>
                            <strong className="text-red-600">
                              {w.ageing["90+"]}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {w.inTransit ? (
                        <div className="flex items-center gap-3 text-blue-600 bg-blue-50 p-4 rounded-lg">
                          <Truck className="w-6 h-6" />
                          <div>
                            <p className="font-medium">{w.inTransit} units</p>
                            <p className="text-sm">In Transit</p>
                          </div>
                        </div>
                      ) : null}

                      {w.reorderAlerts.length > 0 && (
                        <div>
                          <h4 className="font-bold text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Reorder Alerts
                          </h4>
                          <ul className="mt-2 space-y-1 text-sm">
                            {w.reorderAlerts.map((alert, i) => (
                              <li key={i} className="text-red-700">
                                • {alert}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {w.bins.length > 0 && (
                    <div className="mt-8 pt-6 border-t text-center">
                      <p className="text-sm text-gray-600">
                        <strong>Storage Locations:</strong> {w.bins.join(" • ")}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Form Modal */}
      {showForm && (
        <WarehouseForm
          warehouse={currentWarehouse}
          products={products}
          onClose={handleClose}
          isEdit={!!editingId}
        />
      )}
    </div>
  );
};

// Full Form Component
const WarehouseForm: React.FC<{
  warehouse: EnrichedWarehouse | null;
  products: Product[];
  onClose: () => void;
  isEdit: boolean;
}> = ({ warehouse, products, onClose, isEdit }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: warehouse?.name || "",
    type: warehouse?.type || "General",
    location: warehouse?.location || "",
    capacity: warehouse?.capacity?.toString() || "0",
    unit: warehouse?.unit || "PCS",
    productId: warehouse?.productId || "",
    lastGRN: {
      date: warehouse?.lastGRN?.date || "",
      qty: warehouse?.lastGRN?.qty?.toString() || "",
      po: warehouse?.lastGRN?.po || "",
    },
    lastIssue: {
      date: warehouse?.lastIssue?.date || "",
      qty: warehouse?.lastIssue?.qty?.toString() || "",
      dept: warehouse?.lastIssue?.dept || "",
    },
    ageing: {
      "0-30": warehouse?.ageing?.["0-30"]?.toString() || "0",
      "30-60": warehouse?.ageing?.["30-60"]?.toString() || "0",
      "60-90": warehouse?.ageing?.["60-90"]?.toString() || "0",
      "90+": warehouse?.ageing?.["90+"]?.toString() || "0",
    },
    inTransit: warehouse?.inTransit?.toString() || "0",
    reorderAlerts: warehouse?.reorderAlerts?.join(", ") || "",
    bins: warehouse?.bins?.join(", ") || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      type: formData.type,
      location: formData.location,
      capacity: Number(formData.capacity),
      unit: formData.unit,
      productId: formData.productId,
      lastGRN: formData.lastGRN.date
        ? {
            date: formData.lastGRN.date,
            qty: Number(formData.lastGRN.qty || 0),
            po: formData.lastGRN.po,
          }
        : null,
      lastIssue: formData.lastIssue.date
        ? {
            date: formData.lastIssue.date,
            qty: Number(formData.lastIssue.qty || 0),
            dept: formData.lastIssue.dept,
          }
        : null,
      ageing: {
        "0-30": Number(formData.ageing["0-30"]),
        "30-60": Number(formData.ageing["30-60"]),
        "60-90": Number(formData.ageing["60-90"]),
        "90+": Number(formData.ageing["90+"]),
      },
      inTransit: Number(formData.inTransit || 0),
      reorderAlerts: formData.reorderAlerts
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      bins: formData.bins
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (isEdit && warehouse) {
        await dispatch(
          updateWarehouse({ id: warehouse._id, data: payload })
        ).unwrap();
        toast.success("Warehouse updated successfully!");
      } else {
        await dispatch(addWarehouse(payload)).unwrap();
        toast.success("Warehouse created successfully!");
      }
      onClose();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">
            {isEdit ? "Edit" : "Create"} Warehouse
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="w-9 h-9" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Warehouse Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Main Warehouse"
              />
            </div>

            <div>
              <Label>Linked Product *</Label>
              <Select
                value={formData.productId}
                onValueChange={(val) =>
                  setFormData({ ...formData, productId: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} ({p.sku}) - Stock: {p.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                  <SelectItem value="Bonded">Bonded</SelectItem>
                  <SelectItem value="Quarantine">Quarantine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location *</Label>
              <Input
                required
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => setFormData({ ...formData, unit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PCS">PCS</SelectItem>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="Litre">Litre</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Capacity %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
              />
            </div>
          </div>

          {/* Last Transactions */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
              <h3 className="font-bold">Last GRN</h3>
              <Input
                placeholder="Date"
                value={formData.lastGRN.date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastGRN: { ...formData.lastGRN, date: e.target.value },
                  })
                }
              />
              <Input
                type="number"
                placeholder="Qty"
                value={formData.lastGRN.qty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastGRN: { ...formData.lastGRN, qty: e.target.value },
                  })
                }
              />
              <Input
                placeholder="PO"
                value={formData.lastGRN.po}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastGRN: { ...formData.lastGRN, po: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
              <h3 className="font-bold">Last Issue</h3>
              <Input
                placeholder="Date"
                value={formData.lastIssue.date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastIssue: { ...formData.lastIssue, date: e.target.value },
                  })
                }
              />
              <Input
                type="number"
                placeholder="Qty"
                value={formData.lastIssue.qty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastIssue: { ...formData.lastIssue, qty: e.target.value },
                  })
                }
              />
              <Input
                placeholder="Dept"
                value={formData.lastIssue.dept}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastIssue: { ...formData.lastIssue, dept: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Ageing & Others */}
          <div className="space-y-6">
            <div className="p-6 bg-amber-50 rounded-xl">
              <h3 className="font-bold mb-4">Stock Ageing</h3>
              <div className="grid grid-cols-4 gap-4">
                {Object.keys(formData.ageing).map((key) => (
                  <Input
                    key={key}
                    placeholder={key + " days"}
                    value={formData.ageing[key as keyof typeof formData.ageing]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ageing: { ...formData.ageing, [key]: e.target.value },
                      })
                    }
                  />
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>In Transit</Label>
                <Input
                  type="number"
                  value={formData.inTransit}
                  onChange={(e) =>
                    setFormData({ ...formData, inTransit: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Reorder Alerts (comma separated)</Label>
                <Input
                  value={formData.reorderAlerts}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderAlerts: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Bins/Racks (comma separated)</Label>
              <Input
                value={formData.bins}
                onChange={(e) =>
                  setFormData({ ...formData, bins: e.target.value })
                }
                placeholder="A1, B2, Cold-01"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="lg">
              {isEdit ? "Update Warehouse" : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseManagement;
