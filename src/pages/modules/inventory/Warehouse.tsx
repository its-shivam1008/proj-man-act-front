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
  Layers, // Added for a cleaner Rack & Shelf icon
  Clock, // Added for Ageing
  Activity, // Added for Recent Activity
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
}
  from "@/redux/slices/warehouseSlice";
import { fetchProducts } from "@/redux/slices/productSlice";
import { toast } from "sonner";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import {
  fetchRacks,
  createRack,
} from "@/redux/slices/rackSlice";
import {
  fetchShelves,
  createShelf,
} from "@/redux/slices/shelfSlice";
import {
  fetchMaterials
} from "@/redux/slices/rawmaterialSlice"
interface Product {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  unitCost: number;
}

interface ProductLocation {
  rackId?: string | null;
  rackName?: string | null;
  shelfId?: string | null;
  shelfName?: string | null;
  quantity?: number | string;   // optional quantity
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
  locations: ProductLocation[];
}
interface RawMaterialEntry {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  // Assuming raw material also has these fields for full UI support
  meta?: { minStock: number, unitCost: number, globalQuantity: number } | null; // For display purposes
  lastGRN: { date?: string; qty?: number; po?: string } | null;
  lastIssue: { date?: string; qty?: number; dept?: string } | null;
  ageing: { "0-30": number; "30-60": number; "60-90": number; "90+": number };
  inTransit: number;
  reorderAlerts: string[];
  bins: string[];
  locations: ProductLocation[]; // Use ProductLocation for type consistency
}
interface WarehouseData {
  _id: string;
  name: string;
  type: string;
  location: string | { _id: string; name: string };
  capacity: number;
  products: WarehouseProduct[];
  rawMaterials?: RawMaterialEntry[]; // Add rawMaterials here
  createdAt: string;
  updatedAt: string;
}

interface EnrichedWarehouse extends WarehouseData {
  products: (WarehouseProduct & { meta: Product | null })[];
  rawMaterials: (RawMaterialEntry & { meta: any | null })[]; // Enrich raw materials similarly
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

  const racks = useSelector((state: any) => state.rack?.racks || []);
  const shelves = useSelector((state: any) => state.shelf?.shelves || []);
  const { materials = [] } = useSelector((state: any) => state.rawMaterials);
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
    dispatch(fetchMaterials({ page: 1, limit: 200 })); // Load more raw materials
    dispatch(fetchWarehouses({ page, limit, location: locationFilter }));
  }, [dispatch, page, locationFilter]);

  const hasPrev = page > 1;
  const hasNext = page * limit < total;

  const enrichedWarehouses: EnrichedWarehouse[] = warehouses.map((w: WarehouseData) => ({
    ...w,
    products: w.products.map((p) => ({
      ...p,
      meta: products.find((prod) => prod._id === p.productId) || null,
    })),
    // Enrich raw materials with metadata for display (if available)
    rawMaterials: (w.rawMaterials || []).map((m) => ({
      ...m,
      meta: materials.find((mat: any) => mat._id === m.materialId) || null,
    })),
  }));

  const getStockStatus = (qty: number, minStock: number) => {
    if (qty === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800 border-red-300" };
    if (qty <= minStock) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    return { label: "In Stock", color: "bg-green-100 text-green-800 border-green-300" };
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!id) return toast.error("Invalid warehouse id");
    if (!window.confirm("Are you sure you want to delete this warehouse?")) return;

    dispatch(deleteWarehouse(id))
      .unwrap()
      .then(() => {
        toast.success("Warehouse deleted");
        if (enrichedWarehouses.length === 1 && page > 1) setPage(p => p - 1);
        dispatch(fetchWarehouses({ page, limit }));
      })
      .catch(() => toast.error("Failed to delete"));
  }

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
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h1 className="text-4xl font-extrabold flex items-center gap-3 text-gray-900">
            <Warehouse className="w-10 h-10 text-blue-600" />
            Warehouse Management
          </h1>
          <div className="flex gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter} disabled={isLocationRestricted}>
              <SelectTrigger className="w-[200px] bg-white shadow-sm border-gray-300">
                <SelectValue placeholder="Filter Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(l => <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button disabled={!canCreate} onClick={() => setShowForm(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" /> Add Warehouse
            </Button>
          </div>
        </div>

        {enrichedWarehouses.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-xl border-2 border-dashed border-gray-200">
            <Warehouse className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">No warehouses created yet</p>
            {canCreate && (
              <Button onClick={() => setShowForm(true)} className="mt-6 bg-blue-600 hover:bg-blue-700">
                Create Your First Warehouse
              </Button>
            )}
          </div>
        )}

        <Accordion type="single" collapsible className="space-y-6">
          {enrichedWarehouses.map((w) => {
            const totalStock = w.products.reduce((sum, p) => sum + p.quantity, 0) + (w.rawMaterials?.reduce((sum, m) => sum + m.quantity, 0) || 0);

            return (
              <AccordionItem
                key={w._id}
                value={w._id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all"
              >
                <AccordionTrigger className="px-8 py-6 hover:no-underline">
                  <div className="grid grid-cols-12 w-full items-center gap-6">
                    <div className="col-span-4">
                      <div className="flex items-center gap-4">
                        <Package className="w-9 h-9 text-blue-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 leading-tight">{w.name}</h3>
                          <Badge variant="secondary" className="mt-1 bg-blue-50 text-blue-800 border border-blue-200">
                            {w.type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 text-sm text-gray-700 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Location:</span>
                        <span>{getLocationName(w.location)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Capacity:</span>
                        <span>{w.capacity}%</span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span>{w.products.length} Product SKUs</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Box className="w-4 h-4 text-gray-500" />
                        <span>{w.rawMaterials?.length || 0} Raw Materials</span>
                      </div>
                    </div>

                    <div className="col-span-3 text-right">
                      <div className="text-4xl font-extrabold text-blue-700">
                        {totalStock.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Total Units/Weight</div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="bg-gradient-to-r from-gray-50 to-white px-8 py-8 border-t border-gray-200 space-y-10">
                  <div className="flex justify-end gap-3 mb-6">
                    <Button disabled={!canEdit} size="sm" variant="outline" onClick={() => handleEdit(w._id)} className="border-blue-500 text-blue-600 hover:bg-blue-50">
                      <Edit className="w-4 h-4 mr-2" /> Edit Warehouse
                    </Button>
                    <Button disabled={!canDelete} size="sm" variant="destructive" onClick={() => handleDelete(w._id)} className="bg-red-500 hover:bg-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>

                  {/* ==================== PRODUCT DETAILS SECTION ==================== */}
                  <h3 className="text-2xl font-extrabold text-blue-700 border-b-2 border-blue-300 pb-2 mb-6 flex items-center gap-3">
                    <Package className="w-7 h-7" /> Product Inventory Details
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stock Details Card (Col 1) */}
                    <div className="lg:col-span-1 space-y-4 p-4 rounded-xl bg-white shadow-xl border border-blue-100">
                      <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2 mb-3">
                        <Box className="w-6 h-6 text-blue-600" />
                        Product Stock Details
                      </h4>
                      {w.products.map((p) => {
                        const meta = p.meta;
                        const minStock = meta?.minStock || 0;
                        const status = getStockStatus(p.quantity, minStock);
                        const value = meta ? p.quantity * (meta.unitCost || 0) : 0;

                        return (
                          <div key={p.productId} className="bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm">
                            <div className="font-semibold text-lg text-gray-900">{p.productName}</div>
                            <div className="text-3xl font-extrabold text-blue-700 mt-1">{p.quantity} {p.unit}</div>
                            <Badge className={`mt-2 ${status.color} border font-medium`}>{status.label}</Badge>
                            {meta && (
                              <div className="mt-3 text-sm space-y-1">
                                <div className="text-gray-600">Global Stock: <span className="font-semibold">{meta.quantity || 0}</span></div>
                                <div>Value: <strong className="text-green-600 font-extrabold">₹{value.toLocaleString()}</strong></div>
                                <div className="text-red-500">Min Stock: {minStock}</div>
                              </div>
                            )}
                            <div className="mt-2 text-sm text-gray-600">In Transit: <span className="font-semibold text-blue-600">{p.inTransit}</span></div>
                            
                            {/* ⭐ INDIVIDUAL PRODUCT LOCATIONS ⭐ */}
                            <div className="mt-4 pt-3 border-t border-blue-300">
                              <div className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Locations ({(p.locations || []).length})
                              </div>
                              {(p.locations || []).length > 0 ? (
                                <div className="space-y-2">
                                  {(p.locations || []).map((loc: any, locIndex: number) => (
                                    <div key={locIndex} className="bg-white p-2 rounded-lg border border-blue-200 text-xs">
                                      <div className="font-bold text-blue-900">{loc.rackName} → {loc.shelfName}</div>
                                      <div className="text-blue-700">Qty: {loc.quantity}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-blue-600 italic bg-white p-2 rounded border border-dashed border-blue-300">
                                  No locations assigned
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {w.products.length === 0 && <p className="text-gray-500 italic p-4 text-center">No products assigned to this warehouse.</p>}
                    </div>

                    {/* Activity & Ageing (Col 2-3 span) */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Recent Activity */}
                      <div className="p-4 rounded-xl bg-white shadow-xl border border-gray-100">
                        <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2 mb-4">
                          <Activity className="w-6 h-6 text-purple-600" />
                          Recent Product Activity
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {w.products.flatMap((p) => [
                            p.lastGRN?.date && (
                              <div key={p.productId + "-grn"} className="bg-green-50 p-3 rounded-lg text-sm border border-green-200">
                                <strong className="text-green-800">GRN ({p.productName})</strong>: +{p.lastGRN.qty} {p.unit} • <span className="text-gray-600">{p.lastGRN.date}</span>
                                <div className="text-xs text-gray-500">PO: {p.lastGRN.po || 'N/A'}</div>
                              </div>
                            ),
                            p.lastIssue?.date && (
                              <div key={p.productId + "-issue"} className="bg-red-50 p-3 rounded-lg text-sm border border-red-200">
                                <strong className="text-red-800">Issue ({p.productName})</strong>: -{p.lastIssue.qty} → <span className="font-medium text-gray-700">{p.lastIssue.dept}</span>
                              </div>
                            ),
                          ].filter(Boolean)).length > 0 ? (
                            w.products.flatMap((p) => [
                              p.lastGRN?.date && (
                                <div key={p.productId + "-grn"} className="bg-green-50 p-3 rounded-lg text-sm border border-green-200">
                                  <strong className="text-green-800">GRN ({p.productName})</strong>: +{p.lastGRN.qty} {p.unit} • <span className="text-gray-600">{p.lastGRN.date}</span>
                                  <div className="text-xs text-gray-500">PO: {p.lastGRN.po || 'N/A'}</div>
                                </div>
                              ),
                              p.lastIssue?.date && (
                                <div key={p.productId + "-issue"} className="bg-red-50 p-3 rounded-lg text-sm border border-red-200">
                                  <strong className="text-red-800">Issue ({p.productName})</strong>: -{p.lastIssue.qty} → <span className="font-medium text-gray-700">{p.lastIssue.dept}</span>
                                </div>
                              ),
                            ].filter(Boolean))
                          ) : (
                            <p className="text-gray-500 col-span-2 p-4 text-center">No recent product activity.</p>
                          )}
                        </div>
                      </div>

                      {/* Stock Ageing */}
                      <div className="p-4 rounded-xl bg-white shadow-xl border border-gray-100">
                        <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2 mb-4">
                          <Clock className="w-6 h-6 text-orange-600" />
                          Product Stock Ageing
                        </h4>
                        {w.products.map((p) => (
                          <div key={p.productId} className="bg-gray-50 p-4 rounded-lg shadow mb-4 border border-gray-200">
                            <p className="font-bold text-lg mb-3 text-gray-800">{p.productName}</p>
                            <div className="grid grid-cols-4 gap-4 text-center text-sm">
                              <div className="p-2 border-r">
                                <p className="text-gray-500">0–30d</p>
                                <p className="font-extrabold text-xl text-green-600">{p.ageing["0-30"]}</p>
                              </div>
                              <div className="p-2 border-r">
                                <p className="text-gray-500">30–60d</p>
                                <p className="font-extrabold text-xl text-yellow-600">{p.ageing["30-60"]}</p>
                              </div>
                              <div className="p-2 border-r">
                                <p className="text-gray-500">60–90d</p>
                                <p className="font-extrabold text-xl text-orange-600">{p.ageing["60-90"]}</p>
                              </div>
                              <div className="p-2">
                                <p className="text-gray-500">90+d</p>
                                <p className="font-extrabold text-xl text-red-600">{p.ageing["90+"]}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {w.products.length === 0 && <p className="text-gray-500 italic p-4 text-center">No ageing data for products.</p>}
                      </div>
                    </div>

                    {/* Product Racks & Shelves (Col 1-3 span) */}
                    <div className="col-span-1 lg:col-span-3 p-4 rounded-xl bg-white shadow-xl border border-gray-100">
                      <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2 mb-4">
                        <Layers className="w-6 h-6 text-blue-600" />
                        Product Locations (Racks & Shelves)
                      </h4>

                      {(() => {
                        const allLocations = w.products.flatMap((p) => p.locations || []);

                        if (allLocations.length === 0) {
                          return <p className="text-sm text-gray-500 italic p-4 text-center">No rack & shelf assigned to products.</p>;
                        }

                        const racksMap: Record<string, { rackName: string; shelves: any[] }> = {};

                        allLocations.forEach((loc) => {
                          const rackId = String(loc.rackId);
                          if (!rackId || rackId === "undefined") return;

                          if (!racksMap[rackId]) {
                            racksMap[rackId] = {
                              rackName: loc.rackName || "Unnamed Rack",
                              shelves: [],
                            };
                          }

                          // Ensure we only add unique shelf entries per rack based on shelfId
                          const existingShelf = racksMap[rackId].shelves.find(s => s.shelfId === loc.shelfId);
                          if (!existingShelf) {
                            racksMap[rackId].shelves.push({
                              shelfId: loc.shelfId,
                              shelfName: loc.shelfName || "Unnamed Shelf",
                              quantity: loc.quantity,
                              // Optionally list products here, but keeping it simple for now
                            });
                          }
                        });

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(racksMap).map(([rackId, rackData]) => (
                              <div key={rackId} className="bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="font-extrabold text-lg text-gray-800 mb-2">{rackData.rackName}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {rackData.shelves.map((shelf) => (
                                    <span
                                      key={shelf.shelfId}
                                      className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium flex items-center gap-1 border border-blue-200"
                                    >
                                      {shelf.shelfName}
                                      <span className="font-bold text-blue-900 ml-1">({shelf.quantity || 0})</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ==================== RAW MATERIALS DETAILS SECTION ==================== */}
                  <h3 className="text-2xl font-extrabold text-orange-700 border-b-2 border-orange-300 pb-2 mb-6 flex items-center gap-3 mt-10">
                    <Box className="w-7 h-7" /> Raw Material Inventory Details
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Raw Material Stock Details Card (Col 1) */}
                    <div className="lg:col-span-1 space-y-4 p-4 rounded-xl bg-white shadow-xl border border-orange-100">
                      <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2 mb-3">
                        <Box className="w-6 h-6 text-orange-600" />
                        Raw Material Stock Details
                      </h4>
                      {w.rawMaterials?.map((m) => {
                        const meta = m.meta;
                        // Assuming raw material meta has minStock and unitCost for display
                        const minStock = meta?.minStock || 0;
                        const status = getStockStatus(m.quantity, minStock);
                        const value = m.quantity * (meta?.unitCost || 0); // Calculate value if cost is available

                        return (
                          <div key={m.materialId} className="bg-orange-50 p-5 rounded-xl border border-orange-200 shadow-sm">
                            <div className="font-semibold text-lg text-gray-900">{m.materialName}</div>
                            <div className="text-3xl font-extrabold text-orange-700 mt-1">{m.quantity} {m.unit}</div>
                            <Badge className={`mt-2 ${status.color} border font-medium`}>{status.label}</Badge>
                            {meta && (
                              <div className="mt-3 text-sm space-y-1">
                                <div className="text-gray-600">Global Stock: <span className="font-semibold">{meta.globalQuantity || 0} {m.unit}</span></div>
                                <div>Value: <strong className="text-green-600 font-extrabold">₹{value.toLocaleString()}</strong></div>
                                <div className="text-red-500">Min Stock: {minStock} {m.unit}</div>
                              </div>
                            )}
                            <div className="mt-2 text-sm text-gray-600">In Transit: <span className="font-semibold text-orange-600">{m.inTransit}</span></div>
                            
                            {/* ⭐ INDIVIDUAL MATERIAL LOCATIONS ⭐ */}
                            <div className="mt-4 pt-3 border-t border-orange-300">
                              <div className="font-semibold text-sm text-orange-800 mb-2 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Locations ({(m.locations || []).length})
                              </div>
                              {(m.locations || []).length > 0 ? (
                                <div className="space-y-2">
                                  {(m.locations || []).map((loc: any, locIndex: number) => (
                                    <div key={locIndex} className="bg-white p-2 rounded-lg border border-orange-200 text-xs">
                                      <div className="font-bold text-orange-900">{loc.rackName} → {loc.shelfName}</div>
                                      <div className="text-orange-700">Qty: {loc.quantity}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-orange-600 italic bg-white p-2 rounded border border-dashed border-orange-300">
                                  No locations assigned
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {w.rawMaterials?.length === 0 && <p className="text-gray-500 italic p-4 text-center">No raw materials assigned to this warehouse.</p>}
                    </div>

                    {/* Activity & Ageing (Col 2-3 span) */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Recent Activity (Raw Material) */}
                      <div className="p-4 rounded-xl bg-white shadow-xl border border-gray-100">
                        <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2 mb-4">
                          <Activity className="w-6 h-6 text-purple-600" />
                          Recent Raw Material Activity
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(w.rawMaterials || []).flatMap((m) => [
                            m.lastGRN?.date && (
                              <div key={m.materialId + "-grn"} className="bg-green-50 p-3 rounded-lg text-sm border border-green-200">
                                <strong className="text-green-800">GRN ({m.materialName})</strong>: +{m.lastGRN.qty} {m.unit} • <span className="text-gray-600">{m.lastGRN.date}</span>
                                <div className="text-xs text-gray-500">PO: {m.lastGRN.po || 'N/A'}</div>
                              </div>
                            ),
                            m.lastIssue?.date && (
                              <div key={m.materialId + "-issue"} className="bg-red-50 p-3 rounded-lg text-sm border border-red-200">
                                <strong className="text-red-800">Issue ({m.materialName})</strong>: -{m.lastIssue.qty} → <span className="font-medium text-gray-700">{m.lastIssue.dept}</span>
                              </div>
                            ),
                          ].filter(Boolean)).length > 0 ? (
                            (w.rawMaterials || []).flatMap((m) => [
                              m.lastGRN?.date && (
                                <div key={m.materialId + "-grn"} className="bg-green-50 p-3 rounded-lg text-sm border border-green-200">
                                  <strong className="text-green-800">GRN ({m.materialName})</strong>: +{m.lastGRN.qty} {m.unit} • <span className="text-gray-600">{m.lastGRN.date}</span>
                                  <div className="text-xs text-gray-500">PO: {m.lastGRN.po || 'N/A'}</div>
                                </div>
                              ),
                              m.lastIssue?.date && (
                                <div key={m.materialId + "-issue"} className="bg-red-50 p-3 rounded-lg text-sm border border-red-200">
                                  <strong className="text-red-800">Issue ({m.materialName})</strong>: -{m.lastIssue.qty} → <span className="font-medium text-gray-700">{m.lastIssue.dept}</span>
                                </div>
                              ),
                            ].filter(Boolean))
                          ) : (
                            <p className="text-gray-500 col-span-2 p-4 text-center">No recent raw material activity.</p>
                          )}
                        </div>
                      </div>

                      {/* Stock Ageing (Raw Material) */}
                      <div className="p-4 rounded-xl bg-white shadow-xl border border-gray-100">
                        <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2 mb-4">
                          <Clock className="w-6 h-6 text-orange-600" />
                          Raw Material Stock Ageing
                        </h4>
                        {(w.rawMaterials || []).map((m) => (
                          <div key={m.materialId} className="bg-gray-50 p-4 rounded-lg shadow mb-4 border border-gray-200">
                            <p className="font-bold text-lg mb-3 text-gray-800">{m.materialName}</p>
                            <div className="grid grid-cols-4 gap-4 text-center text-sm">
                              <div className="p-2 border-r">
                                <p className="text-gray-500">0–30d</p>
                                <p className="font-extrabold text-xl text-green-600">{m.ageing["0-30"]}</p>
                              </div>
                              <div className="p-2 border-r">
                                <p className="text-gray-500">30–60d</p>
                                <p className="font-extrabold text-xl text-yellow-600">{m.ageing["30-60"]}</p>
                              </div>
                              <div className="p-2 border-r">
                                <p className="text-gray-500">60–90d</p>
                                <p className="font-extrabold text-xl text-orange-600">{m.ageing["60-90"]}</p>
                              </div>
                              <div className="p-2">
                                <p className="text-gray-500">90+d</p>
                                <p className="font-extrabold text-xl text-red-600">{m.ageing["90+"]}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(w.rawMaterials || []).length === 0 && <p className="text-gray-500 italic p-4 text-center">No ageing data for raw materials.</p>}
                      </div>
                    </div>

                    {/* Raw Material Racks & Shelves (Col 1-3 span) */}
                    <div className="col-span-1 lg:col-span-3 p-4 rounded-xl bg-white shadow-xl border border-gray-100">
                      <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2 mb-4">
                        <Layers className="w-6 h-6 text-orange-600" />
                        Raw Material Locations (Racks & Shelves)
                      </h4>

                      {(() => {
                        // Logic to group and display raw material locations
                        const allMaterialLocations = w.rawMaterials?.flatMap((m) => m.locations || []) || [];

                        if (allMaterialLocations.length === 0) {
                          return <p className="text-sm text-gray-500 italic p-4 text-center">No rack & shelf assigned to raw materials.</p>;
                        }

                        const racksMap: Record<string, { rackName: string; shelves: any[] }> = {};

                        allMaterialLocations.forEach((loc) => {
                          const rackId = String(loc.rackId);
                          if (!rackId || rackId === "undefined") return;

                          if (!racksMap[rackId]) {
                            racksMap[rackId] = {
                              rackName: loc.rackName || "Unnamed Rack",
                              shelves: [],
                            };
                          }

                          // Ensure unique shelf entries per rack based on shelfId
                          const existingShelf = racksMap[rackId].shelves.find(s => s.shelfId === loc.shelfId);
                          if (!existingShelf) {
                            racksMap[rackId].shelves.push({
                              shelfId: loc.shelfId,
                              shelfName: loc.shelfName || "Unnamed Shelf",
                              quantity: loc.quantity,
                            });
                          }
                        });

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(racksMap).map(([rackId, rackData]) => (
                              <div key={rackId} className="bg-orange-100 p-4 rounded-lg border border-orange-200 shadow-sm">
                                <div className="font-extrabold text-lg text-gray-800 mb-2">{rackData.rackName}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {rackData.shelves.map((shelf) => (
                                    <span
                                      key={shelf.shelfId}
                                      className="px-3 py-1 rounded-full bg-orange-200 text-orange-800 text-xs font-medium flex items-center gap-1 border border-orange-300"
                                    >
                                      {shelf.shelfName}
                                      <span className="font-bold text-orange-900 ml-1">({shelf.quantity || 0})</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-8 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <button disabled={!hasPrev} onClick={() => setPage(p => p - 1)} className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition">
            &larr; Previous
          </button>
          <span className="text-lg font-semibold text-gray-700">Page {page} of {Math.ceil(total / limit)}</span>
          <button disabled={!hasNext} onClick={() => setPage(p => p + 1)} className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition">
            Next &rarr;
          </button>
        </div>
      </div>

      {showForm && (
        <WarehouseForm
          warehouse={currentWarehouse}
          products={products}
          materials={materials}
          onClose={handleClose}
          isEdit={!!editingId}
        />
      )}
    </div>
  );
};

// ====================================================================================
// WAREHOUSE FORM COMPONENT (Kept mostly same, but cleaned up structure)
// NOTE: This form code ensures rack/shelf names are passed, which is crucial for display
// ====================================================================================

const WarehouseForm: React.FC<{
  warehouse: EnrichedWarehouse | null;
  products: Product[];
  materials: any[];
  onClose: () => void;
  isEdit: boolean;
}> = ({ warehouse, products, materials, onClose, isEdit }) => {
  const dispatch = useDispatch();
  const racks = useSelector((state: any) => state.rack?.racks || []);
  const shelves = useSelector((state: any) => state.shelf?.shelves || []);
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);

  const isLocationRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;

  const initialLocation = warehouse?.location
    ? (typeof warehouse.location === 'object' ? warehouse.location._id : warehouse.location)
    : (isLocationRestricted ? userProfile.location : "");

  const [formData, setFormData] = useState<any>({ // Using 'any' for simplicity due to dynamic props
    name: warehouse?.name || "",
    type: warehouse?.type || "General",
    location: initialLocation,
    capacity: warehouse?.capacity?.toString() || "0",
    products: warehouse?.products?.length
      ? warehouse.products.map((p) => ({
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
        locations: p.locations?.length
          ? p.locations.map((loc: any) => ({
            rackId: loc.rackId?._id ? String(loc.rackId._id) : loc.rackId ? String(loc.rackId) : "",
            rackName: loc.rackName || "",
            shelfId: loc.shelfId?._id ? String(loc.shelfId._id) : loc.shelfId ? String(loc.shelfId) : "",
            shelfName: loc.shelfName || "",
            quantity: loc.quantity?.toString() || "0",
          }))
          : [
            {
              rackId: "",
              rackName: "",
              shelfId: "",
              shelfName: "",
              quantity: "0",
            },
          ],
      }))
      : [{ // This is the default object for when products array is empty
        productId: "", productName: "", quantity: "0", unit: "PCS",
        lastGRN: { date: "", qty: "", po: "" },
        lastIssue: { date: "", qty: "", dept: "" },
        ageing: { "0-30": "0", "30-60": "0", "60-90": "0", "90+": "0" },
        inTransit: "0", reorderAlerts: "", bins: "",
        locations: [
          {
            rackId: "",
            rackName: "",
            shelfId: "",
            shelfName: "",
            quantity: "0"
          }
        ]
      }],
    materials: warehouse?.rawMaterials?.length
      ? warehouse.rawMaterials.map((m: any) => ({
        materialId: m.materialId,
        materialName: m.materialName,
        quantity: m.quantity?.toString() || "0",
        unit: m.unit || "KG",
        lastGRN: { date: m.lastGRN?.date || "", qty: m.lastGRN?.qty?.toString() || "", po: m.lastGRN?.po || "" },
        lastIssue: { date: m.lastIssue?.date || "", qty: m.lastIssue?.qty?.toString() || "", dept: m.lastIssue?.dept || "" },

        ageing: {
          "0-30": m.ageing["0-30"].toString(),
          "30-60": m.ageing["30-60"].toString(),
          "60-90": m.ageing["60-90"].toString(),
          "90+": m.ageing["90+"].toString(),
        },

        inTransit: m.inTransit?.toString() || "0",
        reorderAlerts: m.reorderAlerts.join(", "),
        bins: m.bins.join(", "),

        // ⭐ LOCATION INITIALIZATION FIX ⭐
        locations: m.locations?.length
          ? m.locations.map((loc: any) => ({
            rackId: loc.rackId?._id ? String(loc.rackId._id) : loc.rackId ? String(loc.rackId) : "",
            rackName: loc.rackName || "",
            shelfId: loc.shelfId?._id ? String(loc.shelfId._id) : loc.shelfId ? String(loc.shelfId) : "",
            shelfName: loc.shelfName || "",
            quantity: loc.quantity?.toString() || "0",
          }))
          : [
            {
              rackId: "",
              rackName: "",
              shelfId: "",
              shelfName: "",
              quantity: "0",
            },
          ],
        // Temp state for multi-select
        selectedRackId: "",
        selectedShelves: [],
        showRackSelector: false,
      }))
      : [
        {
          materialId: "",
          materialName: "",
          quantity: "0",
          unit: "KG",
          ageing: {
            "0-30": "0",
            "30-60": "0",
            "60-90": "0",
            "90+": "0",
          },
          inTransit: "0",
          reorderAlerts: "",
          bins: "",
          locations: [
            {
              rackId: "",
              rackName: "",
              shelfId: "",
              shelfName: "",
              quantity: "0",
            },
          ],
          selectedRackId: "",
          selectedShelves: [],
          showRackSelector: false,
        },
      ],
  });

  useEffect(() => {
    if (warehouse?._id) {
      dispatch(fetchRacks(warehouse._id));
    }
  }, [warehouse?._id, dispatch]);




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 🚀 Build payload properly
    const payload = {
      name: formData.name,
      type: formData.type,
      location: formData.location,
      capacity: Number(formData.capacity || 0),

      products: (formData.products || [])
        .filter((p: any) => p.productId)
        .map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          quantity: Number(p.quantity || 0),
          unit: p.unit,

          lastGRN: p.lastGRN.date
            ? {
              date: p.lastGRN.date,
              qty: Number(p.lastGRN.qty || 0),
              po: p.lastGRN.po,
            }
            : null,

          lastIssue: p.lastIssue.date
            ? {
              date: p.lastIssue.date,
              qty: Number(p.lastIssue.qty || 0),
              dept: p.lastIssue.dept,
            }
            : null,

          ageing: {
            "0-30": Number(p.ageing["0-30"] || 0),
            "30-60": Number(p.ageing["30-60"] || 0),
            "60-90": Number(p.ageing["60-90"] || 0),
            "90+": Number(p.ageing["90+"] || 0),
          },

          inTransit: Number(p.inTransit || 0),

          reorderAlerts: p.reorderAlerts
            ?.split(",")
            .map((s: string) => s.trim())
            .filter(Boolean) || [],

          bins: p.bins
            ?.split(",")
            .map((s: string) => s.trim())
            .filter(Boolean) || [],

          locations: (p.locations || []).map((loc: any) => ({
            rackId: String(loc.rackId),
            rackName: loc.rackName || "",
            shelfId: String(loc.shelfId),
            shelfName: loc.shelfName || "",
            quantity: Number(loc.quantity || 0),
          })),

        })),
      rawMaterials: (formData.materials || [])
        .filter((m: any) => m.materialId)
        .map((m: any) => ({
          materialId: m.materialId,
          materialName: m.materialName,
          quantity: Number(m.quantity || 0),
          unit: m.unit,
          lastGRN: m.lastGRN?.date ? { date: m.lastGRN.date, qty: Number(m.lastGRN.qty), po: m.lastGRN.po } : null,
          lastIssue: m.lastIssue?.date ? { date: m.lastIssue.date, qty: Number(m.lastIssue.qty), dept: m.lastIssue.dept } : null,
          ageing: {
            "0-30": Number(m.ageing["0-30"] || 0),
            "30-60": Number(m.ageing["30-60"] || 0),
            "60-90": Number(m.ageing["60-90"] || 0),
            "90+": Number(m.ageing["90+"] || 0),
          },
          inTransit: Number(m.inTransit || 0),
          reorderAlerts: (m.reorderAlerts || "").split(",").map((s: string) => s.trim()).filter(Boolean),
          bins: (m.bins || "").split(",").map((s: string) => s.trim()).filter(Boolean),
          locations: (m.locations || [])
            .filter((loc: any) => loc.rackId)
            .map((loc: any) => ({
              rackId: String(loc.rackId),
              rackName: loc.rackName,
              shelfId: String(loc.shelfId),
              shelfName: loc.shelfName,
              quantity: Number(loc.quantity || 0),
            })),
        })),
    };

    console.log("📦 FINAL PAYLOAD SENT TO BACKEND:", payload);

    try {
      if (isEdit && warehouse) {
        await dispatch(
          updateWarehouse({ id: warehouse._id, data: payload })
        ).unwrap();

        toast.success("Warehouse updated!");
      } else {
        await dispatch(addWarehouse(payload)).unwrap();
        toast.success("Warehouse created!");
      }

      // Refresh list
      dispatch(fetchWarehouses({ page: 1, limit: 5 }));

      // Close modal
      onClose();
    } catch (err) {
      console.error("❌ Warehouse save failed:", err);
      toast.error("Operation failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto p-8 border-4 border-blue-100">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-extrabold text-gray-900">{isEdit ? "Edit" : "Create"} Warehouse</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><XCircle className="w-8 h-8" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Details Section */}
          <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-inner space-y-4">
            <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2 border-b pb-2 mb-4">
              <Warehouse className="w-5 h-5" />
              General Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div><Label className="font-medium text-gray-700">Warehouse Name *</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border-blue-300" /></div>
              <div><Label className="font-medium text-gray-700">Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="border-blue-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                    <SelectItem value="Bonded">Bonded</SelectItem>
                    <SelectItem value="Quarantine">Quarantine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="font-medium text-gray-700">Location *</Label>
                <Select
                  value={formData.location}
                  onValueChange={v => setFormData({ ...formData, location: v })}
                  disabled={isEdit ? false : isLocationRestricted}
                >
                  <SelectTrigger className="border-blue-300"><SelectValue placeholder="Select Location" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((l: any) => <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="font-medium text-gray-700">Capacity (%)</Label><Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} className="border-blue-300" min="0" max="100" /></div>
            </div>
          </div>

          {/* Product Form Section */}
          {isEdit && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  Product Inventory
                </h3>
                <Button
                  type="button"
                  onClick={() => {
                    if (!isEdit && !warehouse?._id) {
                      return toast.error("Please create the warehouse first before adding products.");
                    }
                    setFormData({
                      ...formData,
                      products: [
                        ...formData.products,
                        {
                          productId: "",
                          productName: "",
                          quantity: "0",
                          unit: "PCS",
                          lastGRN: { date: "", qty: "", po: "" },
                          lastIssue: { date: "", qty: "", dept: "" },
                          ageing: { "0-30": "0", "30-60": "0", "60-90": "0", "90+": "0" },
                          inTransit: "0",
                          reorderAlerts: "",
                          bins: "",
                          locations: [{ rackId: "", rackName: "", shelfId: "", shelfName: "", quantity: "0" }],
                        },
                      ],
                    });
                  }}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
              </div>

              {/* Map products */}
              {formData.products?.map((prod: any, index: number) => (
                <div key={index} className="p-6 bg-white rounded-xl border-2 border-blue-100 shadow-md space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <h4 className="font-extrabold text-lg text-gray-700">Product #{index + 1}: {prod.productName || 'New Product'}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const updated = [...formData.products];
                        updated.splice(index, 1);
                        setFormData({ ...formData, products: updated });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Top row: Product select / qty / unit */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Product *</Label>
                      <Select
                        value={prod.productId}
                        onValueChange={(productId: string) => {
                          const sel = products.find((p: any) => p._id === productId);
                          const updated = [...formData.products];
                          updated[index] = {
                            ...updated[index],
                            productId,
                            productName: sel?.name || "",
                          };
                          setFormData({ ...formData, products: updated });
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p: any) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name} ({p.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={prod.quantity}
                        onChange={(e) => {
                          const updated = [...formData.products];
                          updated[index].quantity = e.target.value;
                          setFormData({ ...formData, products: updated });
                        }}
                        min="0"
                      />
                    </div>

                    <div>
                      <Label>Unit</Label>
                      <Select
                        value={prod.unit}
                        onValueChange={(v: string) => {
                          const updated = [...formData.products];
                          updated[index].unit = v;
                          setFormData({ ...formData, products: updated });
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PCS">PCS</SelectItem>
                          <SelectItem value="KG">KG</SelectItem>
                          <SelectItem value="Litre">Litre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* GRN / Issue */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Last GRN */}
                    <div className="p-4 bg-green-50 rounded-lg space-y-3 border border-green-200">
                      <h4 className="font-bold text-green-800">Last Goods Receipt Note (GRN)</h4>
                      <Input
                        type="date"
                        placeholder="GRN Date"
                        value={prod.lastGRN?.date || ""}
                        onChange={(e) => {
                          const updated = [...formData.products];
                          updated[index].lastGRN = { ...updated[index].lastGRN, date: e.target.value };
                          setFormData({ ...formData, products: updated });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="GRN Qty"
                        value={prod.lastGRN?.qty || ""}
                        onChange={(e) => {
                          const updated = [...formData.products];
                          updated[index].lastGRN = { ...updated[index].lastGRN, qty: e.target.value };
                          setFormData({ ...formData, products: updated });
                        }}
                        min="0"
                      />
                      <Input
                        placeholder="PO Number"
                        value={prod.lastGRN?.po || ""}
                        onChange={(e) => {
                          const updated = [...formData.products];
                          updated[index].lastGRN = { ...updated[index].lastGRN, po: e.target.value };
                          setFormData({ ...formData, products: updated });
                        }}
                      />
                    </div>

                    {/* Last Issue */}
                    <div className="p-4 bg-red-50 rounded-lg space-y-3 border border-red-200">
                      <h4 className="font-bold text-red-800">Last Issue</h4>
                      <Input
                        type="date"
                        placeholder="Issue Date"
                        value={prod.lastIssue?.date || ""}
                        onChange={(e) => {
                          const updated = [...formData.products];
                          updated[index].lastIssue = { ...updated[index].lastIssue, date: e.target.value };
                          setFormData({ ...formData, products: updated });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Issue Qty"
                        value={prod.lastIssue?.qty || ""}
                        onChange={(e) => {
                          const updated = [...formData.products];
                          updated[index].lastIssue = { ...updated[index].lastIssue, qty: e.target.value };
                          setFormData({ ...formData, products: updated });
                        }}
                        min="0"
                      />
                      <Input
                        placeholder="Dept Issued To"
                        value={prod.lastIssue?.dept || ""}
                        onChange={(e) => {
                          const updated = [...formData.products];
                          updated[index].lastIssue = { ...updated[index].lastIssue, dept: e.target.value };
                          setFormData({ ...formData, products: updated });
                        }}
                      />
                    </div>
                  </div>

                  {/* Rack & Shelf Management */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2">
                      <Layers className="w-5 h-5 text-blue-600" />
                      Rack & Shelf Locations
                    </h4>

                    {/* Create Rack & Shelf Section (Product) */}
                    <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 space-y-3">
                      <h5 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Quick Create New Rack & Shelves
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* New Rack Name */}
                        <div>
                          <Label>New Rack Name</Label>
                          <Input
                            placeholder="Enter rack name"
                            value={prod.tempRackName || ""}
                            onChange={(e) => {
                              const updated = [...formData.products];
                              updated[index].tempRackName = e.target.value;
                              setFormData({ ...formData, products: updated });
                            }}
                          />
                        </div>
                        {/* New Shelf Name */}
                        <div>
                          <Label>New Shelf Name</Label>
                          <Input
                            placeholder="Enter shelf name"
                            value={prod.tempShelfName || ""}
                            onChange={(e) => {
                              const updated = [...formData.products];
                              updated[index].tempShelfName = e.target.value;
                              setFormData({ ...formData, products: updated });
                            }}
                          />
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={async () => {
                              if (!prod.tempRackName?.trim()) return toast.error("Enter rack name");
                              try {
                                const res = await dispatch(createRack({ rackName: prod.tempRackName, warehouseId: warehouse?._id })).unwrap();
                                toast.success(`Rack '${res.rackName}' created`);
                                dispatch(fetchRacks(warehouse?._id));
                                const updated = [...formData.products];
                                updated[index].tempRackName = "";
                                setFormData({ ...formData, products: updated });
                              } catch {
                                toast.error("Failed to create rack");
                              }
                            }}
                          >
                            Create Rack
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!prod.selectedRackForShelf}
                            onClick={async () => {
                              if (!prod.tempShelfName?.trim()) return toast.error("Enter shelf name");
                              if (!prod.selectedRackForShelf) return toast.error("Select a rack first");
                              try {
                                const res = await dispatch(createShelf({
                                  shelfName: prod.tempShelfName,
                                  rackId: prod.selectedRackForShelf,
                                  warehouseId: warehouse?._id,
                                })).unwrap();
                                toast.success(`Shelf '${res.shelfName}' created`);
                                dispatch(fetchShelves(prod.selectedRackForShelf));
                                const updated = [...formData.products];
                                updated[index].tempShelfName = "";
                                setFormData({ ...formData, products: updated });
                              } catch {
                                toast.error("Failed to create shelf");
                              }
                            }}
                          >
                            Create Shelf
                          </Button>
                        </div>
                      </div>
                      {/* Select Rack for New Shelf */}
                      <div className="col-span-full">
                        <Label>Select Rack to Add New Shelf</Label>
                        <Select
                          value={prod.selectedRackForShelf || ""}
                          onValueChange={(rackId: string) => {
                            const updated = [...formData.products];
                            updated[index].selectedRackForShelf = rackId;
                            setFormData({ ...formData, products: updated });
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select existing rack" /></SelectTrigger>
                          <SelectContent>
                            {racks
                              .filter((r: any) => String(r.warehouseId) === String(warehouse?._id))
                              .map((r: any) => (
                                <SelectItem key={r._id} value={r._id}>
                                  {r.rackName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Add Shelves to Locations Section (Multi-Select) - Product */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                      <h5 className="font-semibold text-blue-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Assign Multiple Shelves to Product
                      </h5>

                      {/* Step 1: Select Rack */}
                      <div>
                        <Label>Select Rack</Label>
                        <Select
                          value={prod.selectedRackId || ""}
                          onValueChange={(rackId: string) => {
                            dispatch(fetchShelves(rackId));
                            const rackObj = racks.find((r: any) => String(r._id) === String(rackId));
                            const updated = [...formData.products];
                            updated[index].selectedRackId = rackId;
                            updated[index].selectedRackName = rackObj?.rackName || "";
                            updated[index].selectedShelves = [];
                            setFormData({ ...formData, products: updated });
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Choose a rack" /></SelectTrigger>
                          <SelectContent>
                            {racks
                              .filter((r: any) => String(r.warehouseId) === String(warehouse?._id))
                              .map((r: any) => (
                                <SelectItem key={r._id} value={r._id}>
                                  {r.rackName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Step 2: Select Shelves with Quantities */}
                      {prod.selectedRackId && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">Select Shelves and Set Quantities</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated = [...formData.products];
                                  const availableShelves = (shelves || [])
                                    .filter((s: any) => String(s.rackId) === String(prod.selectedRackId));

                                  updated[index].selectedShelves = availableShelves.map((shelf: any) => ({
                                    shelfId: shelf._id,
                                    shelfName: shelf.shelfName,
                                    quantity: "0",
                                    selected: true
                                  }));
                                  setFormData({ ...formData, products: updated });
                                }}
                              >
                                Select All
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated = [...formData.products];
                                  updated[index].selectedShelves = [];
                                  setFormData({ ...formData, products: updated });
                                }}
                              >
                                Clear All
                              </Button>
                            </div>
                          </div>

                          {/* Shelves Selection Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border rounded-lg bg-white">
                            {(shelves || [])
                              .filter((s: any) => String(s.rackId) === String(prod.selectedRackId))
                              .map((shelf: any) => {
                                const selectedShelf = (prod.selectedShelves || []).find((ss: any) => ss.shelfId === shelf._id);
                                const isSelected = selectedShelf?.selected || false;

                                return (
                                  <div key={shelf._id} className={`p-3 border rounded-lg transition-all duration-200 cursor-pointer ${isSelected ? 'bg-green-50 border-green-400 shadow-sm' : 'bg-gray-50 border-gray-300 hover:border-blue-300'}`}>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const updated = [...formData.products];
                                          let selectedShelves = updated[index].selectedShelves || [];

                                          if (e.target.checked) {
                                            const existingIndex = selectedShelves.findIndex((ss: any) => ss.shelfId === shelf._id);
                                            if (existingIndex >= 0) {
                                              selectedShelves[existingIndex].selected = true;
                                            } else {
                                              selectedShelves.push({
                                                shelfId: shelf._id,
                                                shelfName: shelf.shelfName,
                                                quantity: "0",
                                                selected: true
                                              });
                                            }
                                          } else {
                                            selectedShelves = selectedShelves.filter((ss: any) => ss.shelfId !== shelf._id);
                                          }

                                          updated[index].selectedShelves = selectedShelves;
                                          setFormData({ ...formData, products: updated });
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                      />
                                      <label className="font-medium text-sm cursor-pointer flex-1">{shelf.shelfName}</label>
                                    </div>

                                    {isSelected && (
                                      <Input
                                        type="number"
                                        placeholder="Quantity"
                                        value={selectedShelf?.quantity || "0"}
                                        onChange={(e) => {
                                          const updated = [...formData.products];
                                          const selectedShelves = updated[index].selectedShelves || [];
                                          const shelfIndex = selectedShelves.findIndex((ss: any) => ss.shelfId === shelf._id);
                                          if (shelfIndex >= 0) {
                                            selectedShelves[shelfIndex].quantity = e.target.value;
                                            setFormData({ ...formData, products: updated });
                                          }
                                        }}
                                        className="mt-2 text-sm"
                                        min="0"
                                      />
                                    )}
                                  </div>
                                );
                              })}

                            {(shelves || []).filter((s: any) => String(s.rackId) === String(prod.selectedRackId)).length === 0 && (
                              <div className="col-span-full text-center py-8 text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No shelves available in this rack</p>
                                <p className="text-sm">Create shelves using the quick create section above</p>
                              </div>
                            )}
                          </div>

                          {/* Add to Locations Button */}
                          <Button
                            type="button"
                            onClick={() => {
                              const updated = [...formData.products];
                              const selectedShelves = (updated[index].selectedShelves || []).filter((ss: any) => ss.selected);

                              const newLocations = selectedShelves.map((shelf: any) => ({
                                rackId: prod.selectedRackId,
                                rackName: prod.selectedRackName,
                                shelfId: shelf.shelfId,
                                shelfName: shelf.shelfName,
                                quantity: shelf.quantity
                              }));

                              // Add to existing locations (remove old entries from this rack)
                              updated[index].locations = [
                                ...(updated[index].locations || []).filter((loc: any) =>
                                  loc.rackId !== prod.selectedRackId
                                ),
                                ...newLocations
                              ];

                              // Clear selection
                              updated[index].selectedRackId = "";
                              updated[index].selectedShelves = [];

                              setFormData({ ...formData, products: updated });
                              toast.success(`✅ Successfully added ${newLocations.length} shelf location(s) to ${prod.productName}! Check "Current Product Locations" section below.`);
                            }}
                            disabled={!(prod.selectedShelves || []).some((ss: any) => ss.selected)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Add Selected Shelves to Locations ({(prod.selectedShelves || []).filter((ss: any) => ss.selected).length})
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Current Locations Display - ALWAYS VISIBLE */}
                    <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-inner">
                      <h5 className="font-bold text-blue-800 border-b-2 border-blue-300 pb-2 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Current Product Locations ({(prod.locations || []).length})
                      </h5>
                      
                      {(prod.locations || []).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(prod.locations || []).map((loc: any, locIndex: number) => (
                            <div key={locIndex} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-blue-300 shadow-md hover:shadow-lg transition-all">
                              <div className="flex flex-col">
                                <span className="font-bold text-lg text-blue-900">{loc.rackName} &rarr; {loc.shelfName}</span>
                                <span className="text-sm bg-blue-200 text-blue-900 px-3 py-1 rounded-full mt-2 inline-block w-fit font-semibold">
                                  Quantity: {loc.quantity}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="text-red-600 hover:bg-red-100 border-red-400 hover:border-red-600"
                                onClick={() => {
                                  const updated = [...formData.products];
                                  updated[index].locations.splice(locIndex, 1);
                                  setFormData({ ...formData, products: updated });
                                  toast.success("Location removed successfully");
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-blue-600 bg-white rounded-lg border-2 border-dashed border-blue-300">
                          <MapPin className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                          <p className="font-semibold text-lg">No locations assigned yet</p>
                          <p className="text-sm text-blue-500 mt-1">Use the "Assign Multiple Shelves" tool above to add locations</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Raw Material Form Section */}
          {isEdit && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Box className="w-6 h-6 text-orange-600" />
                  Raw Material Inventory
                </h3>
                <Button
                  type="button"
                  onClick={() => {
                    if (!isEdit && !warehouse?._id) {
                      return toast.error("Please create the warehouse first before adding raw materials.");
                    }
                    setFormData({
                      ...formData,
                      materials: [
                        ...(formData.materials || []),
                        {
                          materialId: "",
                          materialName: "",
                          quantity: "0",
                          unit: "KG",
                          ageing: { "0-30": "0", "30-60": "0", "60-90": "0", "90+": "0" },
                          inTransit: "0",
                          reorderAlerts: "",
                          bins: "",
                          locations: [
                            { rackId: "", rackName: "", shelfId: "", shelfName: "", quantity: "0" },
                          ],
                          lastGRN: { date: "", qty: "", po: "" },
                          lastIssue: { date: "", qty: "", dept: "" },
                          selectedRackId: "",
                          selectedShelves: [],
                          showRackSelector: false,
                        },
                      ],
                    })
                  }
                  }
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Raw Material
                </Button>
              </div>

              {formData.materials?.map((mat: any, index: number) => (
                <div key={index} className="p-6 bg-white rounded-xl border-2 border-orange-100 shadow-md space-y-6">

                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <h4 className="font-extrabold text-lg text-gray-700">Raw Material #{index + 1}: {mat.materialName || 'New Material'}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const updated = [...formData.materials];
                        updated.splice(index, 1);
                        setFormData({ ...formData, materials: updated });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Select Raw Material & Quantity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Raw Material *</Label>
                      <Select
                        value={mat.materialId}
                        onValueChange={(materialId) => {
                          const sel = materials.find((r: any) => r._id === materialId);
                          const updated = [...formData.materials];
                          updated[index] = {
                            ...updated[index],
                            materialId,
                            materialName: sel?.name || "",
                          };
                          setFormData({ ...formData, materials: updated });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Raw Material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((r: any) => (
                            <SelectItem key={r._id} value={r._id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Total Quantity</Label>
                      <Input
                        type="number"
                        value={mat.quantity}
                        onChange={(e) => {
                          const updated = [...formData.materials];
                          updated[index].quantity = e.target.value;
                          setFormData({ ...formData, materials: updated });
                        }}
                        min="0"
                      />
                    </div>
                  </div>
                  
                  {/* GRN / Issue - Raw Material */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Last GRN */}
                    <div className="p-4 bg-green-50 rounded-lg space-y-3 border border-green-200">
                      <h4 className="font-bold text-green-800">Last Goods Receipt Note (GRN)</h4>
                      <Input
                        type="date"
                        placeholder="GRN Date"
                        value={mat.lastGRN?.date || ""}
                        onChange={(e) => {
                          const updated = [...formData.materials];
                          updated[index].lastGRN = { ...updated[index].lastGRN, date: e.target.value };
                          setFormData({ ...formData, materials: updated });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="GRN Qty"
                        value={mat.lastGRN?.qty || ""}
                        onChange={(e) => {
                          const updated = [...formData.materials];
                          updated[index].lastGRN = { ...updated[index].lastGRN, qty: e.target.value };
                          setFormData({ ...formData, materials: updated });
                        }}
                        min="0"
                      />
                      <Input
                        placeholder="PO Number"
                        value={mat.lastGRN?.po || ""}
                        onChange={(e) => {
                          const updated = [...formData.materials];
                          updated[index].lastGRN = { ...updated[index].lastGRN, po: e.target.value };
                          setFormData({ ...formData, materials: updated });
                        }}
                      />
                    </div>

                    {/* Last Issue */}
                    <div className="p-4 bg-red-50 rounded-lg space-y-3 border border-red-200">
                      <h4 className="font-bold text-red-800">Last Issue</h4>
                      <Input
                        type="date"
                        placeholder="Issue Date"
                        value={mat.lastIssue?.date || ""}
                        onChange={(e) => {
                          const updated = [...formData.materials];
                          updated[index].lastIssue = { ...updated[index].lastIssue, date: e.target.value };
                          setFormData({ ...formData, materials: updated });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Issue Qty"
                        value={mat.lastIssue?.qty || ""}
                        onChange={(e) => {
                          const updated = [...formData.materials];
                          updated[index].lastIssue = { ...updated[index].lastIssue, qty: e.target.value };
                          setFormData({ ...formData, materials: updated });
                        }}
                        min="0"
                      />
                      <Input
                        placeholder="Dept Issued To"
                        value={mat.lastIssue?.dept || ""}
                        onChange={(e) => {
                          const updated = [...formData.materials];
                          updated[index].lastIssue = { ...updated[index].lastIssue, dept: e.target.value };
                          setFormData({ ...formData, materials: updated });
                        }}
                      />
                    </div>
                  </div>

                  {/* Rack & Shelf Management for Raw Materials */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xl flex items-center gap-2 text-gray-800 border-b pb-2">
                      <Layers className="w-5 h-5 text-orange-600" />
                      Locations (Racks & Shelves)
                    </h4>

                    {/* Multi-Select Toggle */}
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="font-medium text-gray-700">Multi-Shelf Assignment Tool:</span>
                      <Button
                        type="button"
                        variant={mat.showRackSelector ? "destructive" : "default"}
                        onClick={() => {
                          const updated = [...formData.materials];
                          updated[index].showRackSelector = !mat.showRackSelector;
                          // Reset selection when showing/hiding
                          updated[index].selectedRackId = "";
                          updated[index].selectedShelves = [];
                          setFormData({ ...formData, materials: updated });
                        }}
                        className={mat.showRackSelector ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"}
                      >
                        {mat.showRackSelector ? "Hide Selector" : "Select Rack & Multiple Shelves"}
                      </Button>
                    </div>

                    {/* Enhanced Rack & Shelf Selector for Raw Materials */}
                    {mat.showRackSelector && (
                      <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200 shadow-inner space-y-4">
                        <h5 className="font-semibold text-orange-800 flex items-center gap-2 border-b border-orange-200 pb-2">
                          <MapPin className="w-4 h-4" />
                          Assign Shelves to Raw Material
                        </h5>

                        {/* Step 1: Select Rack */}
                        <div>
                          <Label>Select Rack</Label>
                          <Select
                            value={mat.selectedRackId || ""}
                            onValueChange={(rackId: string) => {
                              dispatch(fetchShelves(rackId));
                              const rackObj = racks.find((r: any) => String(r._id) === String(rackId));
                              const updated = [...formData.materials];
                              updated[index].selectedRackId = rackId;
                              updated[index].selectedRackName = rackObj?.rackName || "";
                              updated[index].selectedShelves = [];
                              setFormData({ ...formData, materials: updated });
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Choose a rack first" /></SelectTrigger>
                            <SelectContent>
                              {racks
                                .filter((r: any) => String(r.warehouseId) === String(warehouse?._id))
                                .map((r: any) => (
                                  <SelectItem key={r._id} value={r._id}>
                                    {r.rackName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Step 2: Select Multiple Shelves with Quantities */}
                        {mat.selectedRackId && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">Select Shelves and Set Quantities</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...formData.materials];
                                    const availableShelves = (shelves || [])
                                      .filter((s: any) => String(s.rackId) === String(mat.selectedRackId));

                                    updated[index].selectedShelves = availableShelves.map((shelf: any) => ({
                                      shelfId: shelf._id,
                                      shelfName: shelf.shelfName,
                                      quantity: "0",
                                      selected: true
                                    }));
                                    setFormData({ ...formData, materials: updated });
                                  }}
                                >
                                  Select All
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...formData.materials];
                                    updated[index].selectedShelves = [];
                                    setFormData({ ...formData, materials: updated });
                                  }}
                                >
                                  Clear All
                                </Button>
                              </div>
                            </div>

                            {/* Shelves Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border rounded-lg bg-white">
                              {(shelves || [])
                                .filter((s: any) => String(s.rackId) === String(mat.selectedRackId))
                                .map((shelf: any) => {
                                  const selectedShelf = (mat.selectedShelves || []).find((ss: any) => ss.shelfId === shelf._id);
                                  const isSelected = selectedShelf?.selected || false;

                                  return (
                                    <div key={shelf._id} className={`p-3 border rounded-lg transition-all duration-200 cursor-pointer ${isSelected ? 'bg-green-50 border-green-400 shadow-sm' : 'bg-gray-50 border-gray-300 hover:border-orange-300'}`}>
                                      <div className="flex items-center space-x-2 mb-2">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const updated = [...formData.materials];
                                            let selectedShelves = updated[index].selectedShelves || [];

                                            if (e.target.checked) {
                                              // Add shelf to selection
                                              const existingIndex = selectedShelves.findIndex((ss: any) => ss.shelfId === shelf._id);
                                              if (existingIndex >= 0) {
                                                selectedShelves[existingIndex].selected = true;
                                              } else {
                                                selectedShelves.push({
                                                  shelfId: shelf._id,
                                                  shelfName: shelf.shelfName,
                                                  quantity: "0",
                                                  selected: true
                                                });
                                              }
                                            } else {
                                              // Remove shelf from selection
                                              selectedShelves = selectedShelves.filter((ss: any) => ss.shelfId !== shelf._id);
                                            }

                                            updated[index].selectedShelves = selectedShelves;
                                            setFormData({ ...formData, materials: updated });
                                          }}
                                          className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                                        />
                                        <label className="font-medium text-sm cursor-pointer flex-1">{shelf.shelfName}</label>
                                      </div>

                                      {isSelected && (
                                        <Input
                                          type="number"
                                          placeholder="Enter quantity"
                                          value={selectedShelf?.quantity || "0"}
                                          onChange={(e) => {
                                            const updated = [...formData.materials];
                                            const selectedShelves = updated[index].selectedShelves || [];
                                            const shelfIndex = selectedShelves.findIndex((ss: any) => ss.shelfId === shelf._id);
                                            if (shelfIndex >= 0) {
                                              selectedShelves[shelfIndex].quantity = e.target.value;
                                              setFormData({ ...formData, materials: updated });
                                            }
                                          }}
                                          className="mt-2 text-sm"
                                          min="0"
                                        />
                                      )}
                                    </div>
                                  );
                                })}

                              {(shelves || []).filter((s: any) => String(s.rackId) === String(mat.selectedRackId)).length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-500">
                                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                  <p>No shelves available in this rack</p>
                                  <p className="text-sm">Create shelves using the Quick Create tool for products.</p>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-3">
                              <Button
                                type="button"
                                onClick={() => {
                                  // Add selected shelves to locations
                                  const updated = [...formData.materials];
                                  const selectedShelves = (updated[index].selectedShelves || []).filter((ss: any) => ss.selected);

                                  const newLocations = selectedShelves.map((shelf: any) => ({
                                    rackId: mat.selectedRackId,
                                    rackName: mat.selectedRackName,
                                    shelfId: shelf.shelfId,
                                    shelfName: shelf.shelfName,
                                    quantity: shelf.quantity
                                  }));

                                  // Add to existing locations (remove old entries from this rack)
                                  updated[index].locations = [
                                    ...(updated[index].locations || []).filter((loc: any) =>
                                      loc.rackId !== mat.selectedRackId
                                    ),
                                    ...newLocations
                                  ];

                                  // Clear selection interface
                                  updated[index].showRackSelector = false;
                                  updated[index].selectedRackId = "";
                                  updated[index].selectedShelves = [];

                                  setFormData({ ...formData, materials: updated });
                                  toast.success(`✅ Successfully added ${newLocations.length} shelf location(s) to ${mat.materialName}! Check "Current Raw Material Locations" section below.`);
                                }}
                                disabled={!(mat.selectedShelves || []).some((ss: any) => ss.selected)}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                Add Selected Shelves ({(mat.selectedShelves || []).filter((ss: any) => ss.selected).length})
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const updated = [...formData.materials];
                                  updated[index].showRackSelector = false;
                                  updated[index].selectedRackId = "";
                                  updated[index].selectedShelves = [];
                                  setFormData({ ...formData, materials: updated });
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Display Current Locations for Raw Materials - ALWAYS VISIBLE */}
                    <div className="space-y-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200 shadow-inner">
                      <h5 className="font-bold text-orange-800 border-b-2 border-orange-300 pb-2 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Current Raw Material Locations ({(mat.locations || []).length})
                      </h5>
                      
                      {(mat.locations || []).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(mat.locations || []).map((loc: any, locIndex: number) => (
                            <div key={locIndex} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-orange-300 shadow-md hover:shadow-lg transition-all">
                              <div className="flex flex-col">
                                <span className="font-bold text-lg text-orange-900">{loc.rackName} &rarr; {loc.shelfName}</span>
                                <span className="text-sm bg-orange-200 text-orange-900 px-3 py-1 rounded-full mt-2 inline-block w-fit font-semibold">
                                  Quantity: {loc.quantity}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="text-red-600 hover:bg-red-100 border-red-400 hover:border-red-600"
                                onClick={() => {
                                  const updated = [...formData.materials];
                                  updated[index].locations.splice(locIndex, 1);
                                  setFormData({ ...formData, materials: updated });
                                  toast.success("Location removed successfully");
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-orange-600 bg-white rounded-lg border-2 border-dashed border-orange-300">
                          <MapPin className="w-12 h-12 mx-auto mb-3 text-orange-400" />
                          <p className="font-semibold text-lg">No locations assigned yet</p>
                          <p className="text-sm text-orange-500 mt-1">Use the "Assign Multiple Shelves" tool above to add locations</p>
                        </div>
                      )}
                    </div>

                    {/* Legacy single location addition (for backward compatibility) - Kept for old logic */}
                    <div className="pt-2 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = [...formData.materials];
                          updated[index].locations = [
                            ...updated[index].locations,
                            { rackId: "", rackName: "", shelfId: "", shelfName: "", quantity: "0" },
                          ];
                          setFormData({ ...formData, materials: updated });
                          toast.info("Added a new legacy location field. Please use the 'Assign Shelves' tool for better control.");
                        }}
                      >
                        Add Single Location (Legacy Field)
                      </Button>
                    </div>

                  </div>
                  {/* Additional Fields (Ageing, Transit, Alerts, Bins) */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-gray-700">Stock Status Details</h4>

                    {/* Ageing */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h5 className="font-semibold text-sm mb-3">Ageing (Days)</h5>
                      <div className="grid grid-cols-4 gap-3">
                        <Input type="number" placeholder="0-30" value={mat.ageing["0-30"]} onChange={(e) => { const updated = [...formData.materials]; updated[index].ageing["0-30"] = e.target.value; setFormData({ ...formData, materials: updated }); }} min="0" />
                        <Input type="number" placeholder="30-60" value={mat.ageing["30-60"]} onChange={(e) => { const updated = [...formData.materials]; updated[index].ageing["30-60"] = e.target.value; setFormData({ ...formData, materials: updated }); }} min="0" />
                        <Input type="number" placeholder="60-90" value={mat.ageing["60-90"]} onChange={(e) => { const updated = [...formData.materials]; updated[index].ageing["60-90"] = e.target.value; setFormData({ ...formData, materials: updated }); }} min="0" />
                        <Input type="number" placeholder="90+" value={mat.ageing["90+"]} onChange={(e) => { const updated = [...formData.materials]; updated[index].ageing["90+"] = e.target.value; setFormData({ ...formData, materials: updated }); }} min="0" />
                      </div>
                    </div>

                    {/* In Transit, Alerts, Bins */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>In Transit Qty</Label>
                        <Input type="number" value={mat.inTransit} onChange={(e) => { const updated = [...formData.materials]; updated[index].inTransit = e.target.value; setFormData({ ...formData, materials: updated }); }} min="0" />
                      </div>
                      <div>
                        <Label>Reorder Alerts (Comma Separated)</Label>
                        <Input placeholder="e.g. low stock, quality check" value={mat.reorderAlerts} onChange={(e) => { const updated = [...formData.materials]; updated[index].reorderAlerts = e.target.value; setFormData({ ...formData, materials: updated }); }} />
                      </div>
                      <div>
                        <Label>Bins (Comma Separated)</Label>
                        <Input placeholder="e.g. A1, B2" value={mat.bins} onChange={(e) => { const updated = [...formData.materials]; updated[index].bins = e.target.value; setFormData({ ...formData, materials: updated }); }} />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" size="lg" onClick={onClose} className="border-gray-300 hover:bg-gray-100">Cancel</Button>
            <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700">
              {isEdit ? "Update Warehouse" : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseManagement;