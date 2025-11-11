"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Search, Package, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { storage, STORAGE_KEYS } from "../../lib/storage";
import { toast } from "sonner";

// --- Types ---
interface Material {
  id: string;
  name: string;
  unit: string;
  costPerUnit?: number;
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
  id: string;
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
  const [boms, setBoms] = useState<BOM[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
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

 useEffect(() => {
  const savedBOMs = storage.get<BOM[]>(STORAGE_KEYS.BOMS, []);
  const savedProducts = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const savedMaterials = storage.get<Material[]>(STORAGE_KEYS.MATERIALS, []);

  // ✅ Add fallback demo data if none exist
  const demoProducts = savedProducts.length
    ? savedProducts
    : [
        { id: "PRD-001", name: "Smartphone X" },
        { id: "PRD-002", name: "Laptop Pro" },
        { id: "PRD-003", name: "Bluetooth Speaker" },
      ];

  const demoMaterials = savedMaterials.length
    ? savedMaterials
    : [
        { id: "MAT-001", name: "Aluminium Body", unit: "pcs", costPerUnit: 120 },
        { id: "MAT-002", name: "Battery Pack", unit: "pcs", costPerUnit: 500 },
        { id: "MAT-003", name: "Display Panel", unit: "pcs", costPerUnit: 800 },
      ];

  setBoms(savedBOMs);
  setProducts(demoProducts);
  setMaterials(demoMaterials);

  // persist demo data if missing
  if (!savedProducts.length) storage.set(STORAGE_KEYS.PRODUCTS, demoProducts);
  if (!savedMaterials.length) storage.set(STORAGE_KEYS.MATERIALS, demoMaterials);
}, []);
 // Load from LocalStorage
  useEffect(() => {
    const savedBOMs = storage.get<BOM[]>(STORAGE_KEYS.BOMS, []);
    const savedProducts = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const savedMaterials = storage.get<Material[]>(STORAGE_KEYS.MATERIALS, []);
    setBoms(savedBOMs);
    setProducts(savedProducts);
    setMaterials(savedMaterials);
  }, []);

  // Auto-save detection
  useEffect(() => {
    if (autoSaved) return;
    const handler = setInterval(() => {
      storage.set(STORAGE_KEYS.BOMS, boms);
      setAutoSaved(true);
    }, 2000);
    return () => clearInterval(handler);
  }, [boms]);

  // --- Derived Analytics ---
  const totalBOMs = boms.length;
  const activeCount = boms.filter(b => b.status === "active").length;
  const draftCount = boms.filter(b => b.status === "draft").length;

  // --- CRUD ---
  const handleSave = () => {
    if (!formData.productId || formData.items.length === 0) {
      toast.error("Please select a product and add at least one material");
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    const bomData: BOM = {
      id: editingBOM?.id || `BOM-${Date.now()}`,
      productId: formData.productId,
      productName: product.name,
      version: formData.version,
      status: formData.status,
      items: formData.items.map(it => ({
        ...it,
        cost: (materials.find(m => m.id === it.materialId)?.costPerUnit || 0) * it.quantity,
      })),
      createdAt: editingBOM?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = editingBOM
      ? boms.map(b => (b.id === editingBOM.id ? bomData : b))
      : [...boms, bomData];

    storage.set(STORAGE_KEYS.BOMS, updated);
    setBoms(updated);
    resetForm();
    setIsDialogOpen(false);
    toast.success(editingBOM ? "BOM updated successfully" : "BOM created successfully");
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

  const handleDelete = (id: string) => {
    const updated = boms.filter(b => b.id !== id);
    storage.set(STORAGE_KEYS.BOMS, updated);
    setBoms(updated);
    toast.success("BOM deleted successfully");
  };

  const addItem = () => {
    if (materials.length === 0) {
      toast.error("Please add materials first");
      return;
    }
    const first = materials[0];
    const newItem: BOMItem = {
      materialId: first.id,
      materialName: first.name,
      quantity: 1,
      unit: first.unit,
      cost: first.costPerUnit || 0,
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const updateItem = (index: number, field: keyof BOMItem, value: any) => {
    const items = [...formData.items];
    if (field === "materialId") {
      const mat = materials.find(m => m.id === value);
      if (mat) {
        items[index] = {
          ...items[index],
          materialId: mat.id,
          materialName: mat.name,
          unit: mat.unit,
          cost: (mat.costPerUnit || 0) * items[index].quantity,
        };
      }
    } else if (field === "quantity") {
      const qty = parseFloat(value) || 0;
      const mat = materials.find(m => m.id === items[index].materialId);
      items[index].quantity = qty;
      items[index].cost = (mat?.costPerUnit || 0) * qty;
    } else {
      items[index] = { ...items[index], [field]: value };
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
    b.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> {editingBOM ? "Edit BOM" : "Create BOM"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingBOM ? "Edit BOM" : "New Bill of Materials"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Product</Label>
                  <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
                  <Button type="button" size="sm" onClick={addItem} variant="outline">
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
                          {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
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
                      <Button type="button" size="icon" variant="destructive" onClick={() => removeItem(i)}>
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

              <Button onClick={handleSave} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
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
          <Input placeholder="Search BOMs..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={() => { storage.set(STORAGE_KEYS.BOMS, []); setBoms([]); toast("All BOMs cleared!"); }}>
          <RefreshCcw className="w-4 h-4 mr-2" /> Reset
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
          filtered.map((b) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="shadow-md hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{b.productName}</CardTitle>
                      <p className="text-sm text-muted-foreground">Version {b.version} • {b.id}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        b.status === "active" ? "bg-green-100 text-green-700" :
                        b.status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                      }`}>{b.status}</span>
                      <Button size="icon" variant="outline" onClick={() => handleEdit(b)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4" /></Button>
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
      </AnimatePresence>

      {autoSaved && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow">
          Autosaved ✓
        </div>
      )}
    </div>
  );
}
