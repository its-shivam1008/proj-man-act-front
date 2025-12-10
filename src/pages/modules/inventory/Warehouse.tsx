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
  ShieldAlert,
  History,
  Box,
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
import { fetchMasterData } from "@/redux/slices/masterDataSlice";

// Types
interface Product {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  unitCost: number;
}

interface WarehouseProduct {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  lastGRN: { date?: string; qty?: number; po?: string } | null;
  lastIssue: { date?: string; qty?: number; dept?: string } | null;
  ageing: { "0-30": number; "30-60": number; "60-90": number; "90+": number };
  inTransit: number;
  reorderAlerts: string[];
  bins: string[];
  meta?: Product | null;
}

interface WarehouseData {
  _id: string;
  name: string;
  type: string;
  location: string | { _id: string; name: string };
  capacity: number;
  products: WarehouseProduct[];
  createdAt: string;
  updatedAt: string;
}

interface EnrichedWarehouse extends WarehouseData {
  products: (WarehouseProduct & { meta: Product | null })[];
}

const WarehouseManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 5;

  const dispatch = useDispatch();
  const canView = usePermission("warehouses", "view");
  const canCreate = usePermission("warehouses", "create");
  const canEdit = usePermission("warehouses", "edit");
  const canDelete = usePermission("warehouses", "delete");

  const { products = [] } = useSelector((state: any) => state.products);
  const { warehouses, loading, total } = useSelector((state: any) => state.warehouse);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);

  const isLocationRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;
  const [locationFilter, setLocationFilter] = useState(isLocationRestricted ? userProfile.location : "all");

const getLocationName = (loc: string | { name: string } | undefined) => {
    if (!loc) return "N/A";
    if (typeof loc === 'object') return loc.name || "N/A";
    const found = locations.find((l: any) => l._id === loc);
    return found ? found.name : "N/A";
  };

  useEffect(() => {
    dispatch(fetchMasterData("location"));
    dispatch(fetchProducts({ page: 1, limit: 200 })); // Load more products
    dispatch(fetchWarehouses({ page, limit, location: locationFilter }));
  }, [dispatch, page, locationFilter]);

  const hasPrev = page > 1;
  const hasNext = page * limit < total;

  // Properly enrich warehouses
  const enrichedWarehouses: EnrichedWarehouse[] = warehouses.map((w: WarehouseData) => ({
    ...w,
    products: w.products.map((p) => ({
      ...p,
      meta: products.find((prod) => prod._id === p.productId) || null,
    })),
  }));

  const getStockStatus = (qty: number, minStock: number) => {
    if (qty === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (qty <= minStock) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
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
        .then(() => {
          toast.success("Warehouse deleted");
          if (enrichedWarehouses.length === 1 && page > 1) setPage(p => p - 1);
          dispatch(fetchWarehouses({ page, limit }));
        })
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold flex items-center gap-3 text-gray-800">
            <Warehouse className="w-10 h-10 text-blue-600" />
            Warehouse Management
          </h1>
          <div className="flex gap-2">
             <Select value={locationFilter} onValueChange={setLocationFilter} disabled={isLocationRestricted}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Filter Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(l => <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>)}
                </SelectContent>
             </Select>
             
             <Button disabled={!canCreate} onClick={() => setShowForm(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" /> Add Warehouse
             </Button>
          </div>
        </div>

        {enrichedWarehouses.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-2xl shadow">
            <Warehouse className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">No warehouses created yet</p>
            <Button onClick={() => setShowForm(true)} className="mt-6">
              Create Your First Warehouse
            </Button>
          </div>
        )}

        <Accordion type="single" collapsible className="space-y-6">
          {enrichedWarehouses.map((w) => {
            const totalStock = w.products.reduce((sum, p) => sum + p.quantity, 0);

            return (
              <AccordionItem
                key={w._id}
                value={w._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border hover:shadow-2xl transition-all"
              >
                <AccordionTrigger className="px-8 py-6 hover:no-underline">
                  <div className="grid grid-cols-12 w-full items-center gap-6">
                    <div className="col-span-5">
                      <div className="flex items-center gap-4">
                        <Package className="w-9 h-9 text-blue-600" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{w.name}</h3>
                          {w.products.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              {w.products.slice(0, 3).map((p, i) => (
                                <div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between text-sm">
                                  <div>
                                    <div className="font-medium">{p.productName}</div>
                                    <div className="text-xs text-gray-500">
                                      {p.quantity} {p.unit}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">
                                      Cost: ₹{p.meta?.unitCost ?? 0}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {w.products.length > 3 && (
                                <div className="text-xs text-gray-500">+{w.products.length - 3} more</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-red-600">No products</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Badge variant="secondary">{w.type}</Badge>
                    </div>

                    <div className="col-span-2 text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {/* [!code --] {w.location} */}
                      {getLocationName(w.location)} {/* [!code ++] */}
                    </div>

                    <div className="col-span-3 text-right">
                      <div className="text-3xl font-bold text-gray-800">
                        {totalStock.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Total Units</div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="bg-gradient-to-r from-gray-50 to-white px-8 py-8 border-t">
                  <div className="flex justify-end gap-3 mb-6">
                    <Button disabled={!canEdit} size="sm" variant="outline" onClick={() => handleEdit(w._id)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button disabled={!canDelete} size="sm" variant="destructive" onClick={() => handleDelete(w._id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stock Details */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg flex items-center gap-2">
                        <Box className="w-5 h-5 text-blue-600" />
                        Stock Details
                      </h4>
                      {w.products.map((p) => {
                        const meta = p.meta;
                        const status = meta ? getStockStatus(p.quantity, meta.minStock) : null;
                        const value = meta ? p.quantity * meta.unitCost : 0;

                        return (
                          <div key={p.productId} className="bg-blue-50 p-5 rounded-xl">
                            <div className="font-semibold text-lg">{p.productName}</div>
                            <div className="text-2xl font-bold">{p.quantity} {p.unit}</div>
                            {status && <Badge className={`mt-2 ${status.color}`}>{status.label}</Badge>}
                            {meta && (
                              <div className="mt-2 text-sm">
                                <div>Global Stock: {meta.quantity}</div>
                                <div>Value: <strong className="text-green-600">₹{value.toLocaleString()}</strong></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-600" />
                        Recent Activity
                      </h4>
                      <div className="space-y-3">
                        {w.products.flatMap((p) => [
                          p.lastGRN && (
                            <div key={p.productId + "-grn"} className="bg-green-50 p-3 rounded text-sm">
                              <strong>GRN</strong>: +{p.lastGRN.qty} {p.unit} • {p.lastGRN.date}
                            </div>
                          ),
                          p.lastIssue && (
                            <div key={p.productId + "-issue"} className="bg-blue-50 p-3 rounded text-sm">
                              <strong>Issue</strong>: -{p.lastIssue.qty} → {p.lastIssue.dept}
                            </div>
                          ),
                        ].filter(Boolean))}
                      </div>
                    </div>

                    {/* Stock Ageing */}
                    <div>
                      <h4 className="font-bold text-lg mb-4">Stock Ageing</h4>
                      {w.products.map((p) => (
                        <div key={p.productId} className="bg-white p-4 rounded-lg shadow mb-4">
                          <p className="font-medium mb-3">{p.productName}</p>
                          <div className="grid grid-cols-4 gap-3 text-center text-sm">
                            <div>
                              <p className="text-gray-500">0–30</p>
                              <p className="font-bold text-green-600">{p.ageing["0-30"]}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">30–60</p>
                              <p className="font-bold text-yellow-600">{p.ageing["30-60"]}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">60–90</p>
                              <p className="font-bold text-orange-600">{p.ageing["60-90"]}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">90+</p>
                              <p className="font-bold text-red-600">{p.ageing["90+"]}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-8 bg-white p-4 rounded-xl shadow">
          <button disabled={!hasPrev} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">
            Previous
          </button>
          <span>Page {page}</span>
          <button disabled={!hasNext} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">
            Next
          </button>
        </div>
      </div>

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

// Warehouse Form (unchanged from your working version — it's already good!)
const WarehouseForm: React.FC<{
  warehouse: EnrichedWarehouse | null;
  products: Product[];
  onClose: () => void;
  isEdit: boolean;
}> = ({ warehouse, products, onClose, isEdit }) => {
  const dispatch = useDispatch();

  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);

  const isLocationRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;
  const [locationFilter, setLocationFilter] = useState(isLocationRestricted ? userProfile.location : "all");

  const [formData, setFormData] = useState({
    name: warehouse?.name || "",
    type: warehouse?.type || "General",
    location: warehouse?.location 
      ? (typeof warehouse.location === 'object' ? warehouse.location._id : warehouse.location)
      : (isLocationRestricted ? userProfile.location : ""),
    capacity: warehouse?.capacity?.toString() || "0",
    products: warehouse?.products.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      quantity: p.quantity.toString(),
      unit: p.unit,
      lastGRN: { date: p.lastGRN?.date || "", qty: p.lastGRN?.qty?.toString() || "", po: p.lastGRN?.po || "" },
      lastIssue: { date: p.lastIssue?.date || "", qty: p.lastIssue?.qty?.toString() || "", dept: p.lastIssue?.dept || "" },
      ageing: {
        "0-30": p.ageing["0-30"].toString(),
        "30-60": p.ageing["30-60"].toString(),
        "60-90": p.ageing["60-90"].toString(),
        "90+": p.ageing["90+"].toString(),
      },
      inTransit: p.inTransit.toString(),
      reorderAlerts: p.reorderAlerts.join(", "),
      bins: p.bins.join(", "),
    })) || [{
      productId: "", productName: "", quantity: "0", unit: "PCS",
      lastGRN: { date: "", qty: "", po: "" },
      lastIssue: { date: "", qty: "", dept: "" },
      ageing: { "0-30": "0", "30-60": "0", "60-90": "0", "90+": "0" },
      inTransit: "0", reorderAlerts: "", bins: ""
    }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      type: formData.type,
      location: formData.location,
      capacity: Number(formData.capacity),
      products: formData.products
        .filter(p => p.productId)
        .map(p => ({
          productId: p.productId,
          productName: p.productName,
          quantity: Number(p.quantity),
          unit: p.unit,
          lastGRN: p.lastGRN.date ? { date: p.lastGRN.date, qty: Number(p.lastGRN.qty || 0), po: p.lastGRN.po } : null,
          lastIssue: p.lastIssue.date ? { date: p.lastIssue.date, qty: Number(p.lastIssue.qty || 0), dept: p.lastIssue.dept } : null,
          ageing: {
            "0-30": Number(p.ageing["0-30"]),
            "30-60": Number(p.ageing["30-60"]),
            "60-90": Number(p.ageing["60-90"]),
            "90+": Number(p.ageing["90+"]),
          },
          inTransit: Number(p.inTransit || 0),
          reorderAlerts: p.reorderAlerts.split(",").map(s => s.trim()).filter(Boolean),
          bins: p.bins.split(",").map(s => s.trim()).filter(Boolean),
        })),
    };

    try {
      if (isEdit && warehouse) {
        await dispatch(updateWarehouse({ id: warehouse._id, data: payload })).unwrap();
        toast.success("Warehouse updated!");
      } else {
        await dispatch(addWarehouse(payload)).unwrap();
        toast.success("Warehouse created!");
      }
      dispatch(fetchWarehouses({ page: 1, limit: 5 }));
      onClose();
    } catch {
      toast.error("Operation failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">{isEdit ? "Edit" : "Create"} Warehouse</h2>
          <button onClick={onClose}><XCircle className="w-9 h-9 text-gray-500 hover:text-gray-700" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Label>Warehouse Name *</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                  <SelectItem value="Bonded">Bonded</SelectItem>
                  <SelectItem value="Quarantine">Quarantine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Location *</Label>
              {/* [!code ++] */}
              <Select 
                value={formData.location}
                onValueChange={v => setFormData({ ...formData, location: v })}
                disabled={isEdit ? false : isLocationRestricted} // Disable only on create if restricted
              >
                <SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
                <SelectContent>
                   {locations.map(l => <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Capacity (%)</Label><Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} /></div>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Products</h3>
            <Button type="button" onClick={() => setFormData({
              ...formData,
              products: [...formData.products, {
                productId: "", productName: "", quantity: "0", unit: "PCS",
                lastGRN: { date: "", qty: "", po: "" },
                lastIssue: { date: "", qty: "", dept: "" },
                ageing: { "0-30": "0", "30-60": "0", "60-90": "0", "90+": "0" },
                inTransit: "0", reorderAlerts: "", bins: ""
              }]
            })}>Add Product</Button>
          </div>

          {formData.products.map((prod, index) => (
            <div key={index} className="p-6 bg-gray-100 rounded-xl border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Product *</Label>
                  <Select value={prod.productId} onValueChange={(val) => {
                    const selected = products.find(p => p._id === val);
                    const updated = [...formData.products];
                    updated[index] = { ...updated[index], productId: val, productName: selected?.name || "" };
                    setFormData({ ...formData, products: updated });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p._id} value={p._id}>{p.name} ({p.sku})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Quantity</Label><Input type="number" value={prod.quantity} onChange={e => {
                  const updated = [...formData.products]; updated[index].quantity = e.target.value; setFormData({ ...formData, products: updated });
                }} /></div>
                <div><Label>Unit</Label>
                  <Select value={prod.unit} onValueChange={v => {
                    const updated = [...formData.products]; updated[index].unit = v; setFormData({ ...formData, products: updated });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PCS">PCS</SelectItem>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="Litre">Litre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* GRN, Issue, Ageing, Others (per product) */}
              <div className="p-4 bg-white rounded-md space-y-3">
                <h4 className="font-bold">Last GRN</h4>
                <Input placeholder="GRN Date" value={prod.lastGRN.date} onChange={(e) => { const updated = [...formData.products]; updated[index].lastGRN.date = e.target.value; setFormData({ ...formData, products: updated }); }} />
                <Input type="number" placeholder="GRN Qty" value={prod.lastGRN.qty} onChange={(e) => { const updated = [...formData.products]; updated[index].lastGRN.qty = e.target.value; setFormData({ ...formData, products: updated }); }} />
                <Input placeholder="PO Number" value={prod.lastGRN.po} onChange={(e) => { const updated = [...formData.products]; updated[index].lastGRN.po = e.target.value; setFormData({ ...formData, products: updated }); }} />
              </div>

              <div className="p-4 bg-white rounded-md space-y-3">
                <h4 className="font-bold">Last Issue</h4>
                <Input placeholder="Issue Date" value={prod.lastIssue.date} onChange={(e) => { const updated = [...formData.products]; updated[index].lastIssue.date = e.target.value; setFormData({ ...formData, products: updated }); }} />
                <Input type="number" placeholder="Issued Qty" value={prod.lastIssue.qty} onChange={(e) => { const updated = [...formData.products]; updated[index].lastIssue.qty = e.target.value; setFormData({ ...formData, products: updated }); }} />
                <Input placeholder="Department" value={prod.lastIssue.dept} onChange={(e) => { const updated = [...formData.products]; updated[index].lastIssue.dept = e.target.value; setFormData({ ...formData, products: updated }); }} />
              </div>

              <div className="p-4 bg-white rounded-md">
                <h4 className="font-bold mb-3">Stock Ageing</h4>
                <div className="grid grid-cols-4 gap-2">{Object.keys(prod.ageing).map((k) => (<Input key={k} placeholder={k} value={prod.ageing[k]} onChange={(e) => { const updated = [...formData.products]; updated[index].ageing[k] = e.target.value; setFormData({ ...formData, products: updated }); }} />))}</div>
              </div>

              <div className="p-4 bg-white rounded-md space-y-3">
                <Label>In Transit</Label>
                <Input type="number" value={prod.inTransit} onChange={(e) => { const updated = [...formData.products]; updated[index].inTransit = e.target.value; setFormData({ ...formData, products: updated }); }} />
                <Label>Reorder Alerts (comma separated)</Label>
                <Input value={prod.reorderAlerts} onChange={(e) => { const updated = [...formData.products]; updated[index].reorderAlerts = e.target.value; setFormData({ ...formData, products: updated }); }} />
                <Label>Bins / Racks (comma separated)</Label>
                <Input value={prod.bins} onChange={(e) => { const updated = [...formData.products]; updated[index].bins = e.target.value; setFormData({ ...formData, products: updated }); }} />
              </div>

              <Button type="button" variant="destructive" onClick={() => { const updated = [...formData.products]; updated.splice(index, 1); setFormData({ ...formData, products: updated }); }}>Remove Product</Button>
            </div>
          ))}

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="lg">{isEdit ? "Update Warehouse" : "Create Warehouse"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default WarehouseManagement;
