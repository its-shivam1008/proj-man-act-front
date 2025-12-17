import { usePermission } from "@/hooks/userPermission";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Search, Package, RefreshCcw, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { createBOM, deleteBOM, fetchBOMs, updateBOM } from "@/redux/slices/production/bomSlice";

// --- Types ---
interface Material {
  _id: string;
  name: string;
  unitOfMeasure: string;
  stocks?: { unitCost: number, quantity: number, }[];


}


interface Product {
  id: string;
  name: string;
  category?: string;
}

interface BOMItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  cost?: number;
}

interface BOM {
  _id: string;
  productId: string;
  productName: string;
  version: string;
  status: "active" | "inactive" | "draft";
  items: BOMItem[];
  createdAt: string;
  updatedAt: string;
}

// --- Main Component ---
export default function AdvancedBOMPage() {
  const { products } = useSelector((state: RootState) => state.products);
  const canView = usePermission("bomManagement", "view");
  const canCreate = usePermission("bomManagement", "create");
  const canEdit = usePermission("bomManagement", "edit");
  const canDelete = usePermission("bomManagement", "delete");
  const { list: boms, loading, pagination } = useSelector(
    (state: RootState) => state.bom
  );

  const { materials, loading: materialLoading } = useSelector(
    (state: RootState) => state.rawMaterials
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const [formData, setFormData] = useState<Omit<BOM, "id" | "createdAt" | "updatedAt" | "productName">>({
    productId: "",
    version: "1.0",
    status: "draft",
    items: [],
  });
  const [page, setPage] = useState(1);
  const limit = 10; // you can change later

  const organisationId = localStorage.getItem("organisationId");
  const dispatch = useDispatch<AppDispatch>();
  // const { list: boms, loading } = useSelector(
  //   (state: RootState) => state.bom
  // );
  const getPrice = (mat: Material) => {
    // Pull the unitCost from the first stock entry if it exists
    return mat.stocks?.[0]?.unitCost || 0;
  };
  useEffect(() => {
    const orgId = localStorage.getItem("organisationId");
    if (orgId) {
      dispatch(fetchMaterials(orgId));
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts(localStorage.getItem("organisationId")!));
  }, []);

  useEffect(() => {
    if (organisationId) {
      dispatch(
        fetchBOMs({
          page,
          limit,
          search: searchTerm,
        })
      );
    }
  }, [page, searchTerm, organisationId, dispatch]);

  const handleReset = () => {
    setSearchTerm("");
    setPage(1); // ✅ reset page
    setEditingBOM(null);
    resetForm();

    dispatch(
      fetchBOMs({
        page: 1,
        limit,
        search: "",
      })
    );

    toast.success("Filters reset");
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
  // useEffect(() => {
  //   const savedBOMs = storage.get<BOM[]>(STORAGE_KEYS.BOMS, []);
  //   const savedProducts = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  //   const savedMaterials = storage.get<Material[]>(STORAGE_KEYS.MATERIALS, []);

  //   // ✅ Add fallback demo data if none exist
  //   const demoProducts = savedProducts.length
  //     ? savedProducts
  //     : [
  //       { id: "PRD-001", name: "Smartphone X" },
  //       { id: "PRD-002", name: "Laptop Pro" },
  //       { id: "PRD-003", name: "Bluetooth Speaker" },
  //     ];

  //   const demoMaterials = savedMaterials.length
  //     ? savedMaterials
  //     : [
  //       { id: "MAT-001", name: "Aluminium Body", unit: "pcs", costPerUnit: 120 },
  //       { id: "MAT-002", name: "Battery Pack", unit: "pcs", costPerUnit: 500 },
  //       { id: "MAT-003", name: "Display Panel", unit: "pcs", costPerUnit: 800 },
  //     ];

  //   setBoms(savedBOMs);
  //   setProducts(demoProducts);
  //   setMaterials(demoMaterials);

  //   // persist demo data if missing
  //   if (!savedProducts.length) storage.set(STORAGE_KEYS.PRODUCTS, demoProducts);
  //   if (!savedMaterials.length) storage.set(STORAGE_KEYS.MATERIALS, demoMaterials);
  // }, []);
  // Load from LocalStorage
  // useEffect(() => {
  //   const savedBOMs = storage.get<BOM[]>(STORAGE_KEYS.BOMS, []);
  //   const savedProducts = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  //   const savedMaterials = storage.get<Material[]>(STORAGE_KEYS.MATERIALS, []);
  //   setBoms(savedBOMs);
  //   setProducts(savedProducts);
  //   setMaterials(savedMaterials);
  // }, []);

  // Auto-save detection
  // useEffect(() => {
  //   if (autoSaved) return;
  //   const handler = setInterval(() => {
  //     storage.set(STORAGE_KEYS.BOMS, boms);
  //     setAutoSaved(true);
  //   }, 2000);
  //   return () => clearInterval(handler);
  // }, [boms]);

  // --- Derived Analytics ---
  const totalBOMs = boms.length;
  const activeCount = boms.filter(b => b.status === "active").length;
  const draftCount = boms.filter(b => b.status === "draft").length;

  // --- CRUD ---
  const handleSave = async () => {
    const organisationId = localStorage.getItem("organisationId");

    if (!organisationId) {
      toast.error("Organisation not found. Please login again.");
      return;
    }

    if (!formData.productId || formData.items.length === 0) {
      toast.error("Product & materials required");
      return;
    }

    try {
      if (editingBOM) {
        // ✅ If editingBOM exists, call updateBOM
        await dispatch(
          updateBOM({
            id: editingBOM._id, // Ensure you use _id from MongoDB
            data: {
              ...formData,
              organisationId
            },
          })
        ).unwrap();
        toast.success("BOM updated successfully");
      } else {
        // ✅ If no editingBOM, call createBOM
        await dispatch(
          createBOM({
            organisationId,
            ...formData,
          })
        ).unwrap();
        toast.success("BOM created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error || "Operation failed");
    }
  };

  const handleEdit = (bom: BOM) => {
    setEditingBOM(bom);
    setFormData({
      productId: bom.productId,
      version: bom.version,
      status: bom.status,
      items: bom.items,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteBOM(id)).unwrap();
      toast.success("BOM deleted");
    } catch {
      toast.error("Delete failed");
    }
  };


  const addItem = () => {
    if (!materials || materials.length === 0) return;
    const mat = materials[0];
    const price = getPrice(mat);

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          materialId: mat._id,
          materialName: mat.name,
          quantity: 1,
          unit: mat.stocks[0]?.unitOfMeasure || "",
          cost: price, // Now uses correct data
        },
      ],
    });
  };


  const updateItem = (index: number, field: keyof BOMItem, value: any) => {
    const items = [...formData.items];
    const mat = materials.find(m => m._id === (field === "materialId" ? value : items[index].materialId));
    const price = mat ? getPrice(mat) : 0;

    if (field === "materialId") {
      items[index] = {
        ...items[index],
        materialId: mat!._id,
        materialName: mat!.name,
        unit: mat!.unitOfMeasure,
        cost: price * items[index].quantity,
      };
    } else if (field === "quantity") {
      const qty = Number(value) || 0;
      items[index] = { ...items[index], quantity: qty, cost: price * qty };
    }
    setFormData({ ...formData, items });
  };
  const removeItem = (i: number) =>
    setFormData({ ...formData, items: formData.items.filter((_, idx) => idx !== i) });

  const resetForm = () => {
    setEditingBOM(null);
    setFormData({ productId: "", version: "1.0", status: "draft", items: [] });
  };

  const filtered = boms.filter(b =>
    b.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Totals ---
  const totalCost = (items: BOMItem[]) =>
    items.reduce((sum, i) => sum + (i.cost || 0), 0).toFixed(2);

  // --- UI ---
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bill of Materials (BOM)</h1>
          <p className="text-muted-foreground">Define product structure, materials, and version control</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => canCreate && setIsDialogOpen(true)}
              disabled={!canCreate}
              className={`bg-gradient-to-r text-white ${canCreate
                ? "from-indigo-500 to-purple-600 hover:opacity-90"
                : "from-gray-400 to-gray-500 cursor-not-allowed"
                }`}
            >
              <Plus className="w-4 h-4 mr-2" /> {editingBOM ? "Edit BOM" : "Create BOM"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingBOM ? "Edit BOM" : "New Bill of Materials"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Product</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, productId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>

                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
                <div>
                  <Label>Version</Label>
                  <Input value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Materials</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => (editingBOM ? canEdit : canCreate) && addItem()}
                    disabled={editingBOM ? !canEdit : !canCreate}
                    variant="outline"
                    className={editingBOM ? (canEdit ? "" : "opacity-50 cursor-not-allowed") : (canCreate ? "" : "opacity-50 cursor-not-allowed")}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>

                </div>
                <div className="space-y-2">
                  {formData.items.map((it, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 items-center p-2 bg-muted rounded"
                    >
                      <Select value={it.materialId} onValueChange={(v) => updateItem(i, "materialId", v)}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {materials.map(m => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={it.quantity}
                        onChange={(e) => updateItem(i, "quantity", e.target.value)}
                        className="w-24"
                        placeholder="Qty"
                      />
                      <Input value={it.unit} className="w-20" disabled />
                      <span className="text-sm text-muted-foreground">₹{(it.cost || 0).toFixed(2)}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        disabled={editingBOM ? !canEdit : !canCreate}
                        onClick={() => (editingBOM ? canEdit : canCreate) && removeItem(i)}
                        className={editingBOM ? (canEdit ? "" : "opacity-50 cursor-not-allowed") : (canCreate ? "" : "opacity-50 cursor-not-allowed")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                    </motion.div>
                  ))}
                </div>
                {formData.items.length > 0 && (
                  <div className="text-right mt-2 text-sm font-semibold">
                    Total Material Cost: ₹{totalCost(formData.items)}
                  </div>
                )}
              </div>

              <Button
                onClick={() => canCreate || canEdit ? handleSave() : null}
                disabled={editingBOM ? !canEdit : !canCreate}
                className={`w-full text-white ${editingBOM
                  ? canEdit
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                    : "bg-gray-400 cursor-not-allowed"
                  : canCreate
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                    : "bg-gray-400 cursor-not-allowed"
                  }`}
              >
                {editingBOM ? "Update BOM" : "Save BOM"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search BOMs..." className="pl-10" value={searchTerm} onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>

      </div>

      {/* Analytics */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Total BOMs</CardTitle></CardHeader><CardContent className="text-2xl">{totalBOMs}</CardContent></Card>
        <Card><CardHeader><CardTitle>Active</CardTitle></CardHeader><CardContent className="text-2xl text-green-500">{activeCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Drafts</CardTitle></CardHeader><CardContent className="text-2xl text-yellow-500">{draftCount}</CardContent></Card>
      </div>

      {/* BOM Cards */}
      <AnimatePresence>
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No BOMs found. Create one to begin.</CardContent></Card>
        ) : (
          boms.map((b) => (
            <motion.div key={b._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="shadow-md hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{b.productName}</CardTitle>
                      <p className="text-sm text-muted-foreground">Version {b.version} • {b._id}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${b.status === "active" ? "bg-green-100 text-green-700" :
                        b.status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                        }`}>{b.status}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => canEdit && handleEdit(b)}
                        className={canEdit ? "" : "opacity-50 cursor-not-allowed"}
                      >
                        <Edit className="w-4 h-4" /></Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        disabled={!canDelete}
                        onClick={() => canDelete && handleDelete(b._id)}
                        className={canDelete ? "" : "opacity-50 cursor-not-allowed"}
                      >
                        <Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {b.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{it.materialName}</span>
                        <span className="text-sm text-muted-foreground">{it.quantity} {it.unit} • ₹{(it.cost || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="text-right font-semibold pt-2 border-t mt-2">
                      Total Cost: ₹{totalCost(b.items)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

      </AnimatePresence>

      {autoSaved && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow">
          Autosaved ✓
        </div>
      )}
    </div>
  );
}
