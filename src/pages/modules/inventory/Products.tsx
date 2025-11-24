// src/pages/inventory/Products.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "@/redux/slices/productSlice";
import { fetchWarehouses } from "@/redux/slices/warehouseSlice";
import { fetchStores } from "@/redux/slices/storageSlice";
import { toast } from "sonner";

import {
  Package,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Tag,
  DollarSign,
  MapPin,
  Barcode,
  FileText,
  Building2,
  Store,
} from "lucide-react";

interface Product {
  _id?: string;
  id?: string;
  name: string;
  type: "goods" | "services" | "combo";
  sku: string;
  referenceCode?: string;
  category: string;
  description?: string;
  trackInventory: boolean;
  quantity: number;
  minStock: number;
  unitCost: number;
  salesPrice?: number;
  salesTax?: number;
  purchaseTax?: number;
  location: string;
  barcode?: string;
  upsellSuggestion?: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
  warehouseId?: string;
  storeId?: string;
}

const Products: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products } = useSelector((state: RootState) => state.products);
  const { warehouses } = useSelector((state: RootState) => state.warehouse);
  const { stores } = useSelector((state: RootState) => state.storages);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const orgId = localStorage.getItem("organisationId");

  useEffect(() => {
    if (orgId) {
      dispatch(fetchProducts());
      dispatch(fetchWarehouses(orgId));
      dispatch(fetchStores({ page: 1, limit: 200 }));
    }
  }, [dispatch, orgId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-100 text-green-800";
      case "low-stock":
        return "bg-yellow-100 text-yellow-800";
      case "out-of-stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-stock":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "low-stock":
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      case "out-of-stock":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const calculateStatus = (
    qty: number,
    min: number,
    track: boolean
  ): Product["status"] => {
    if (!track) return "in-stock";
    if (qty === 0) return "out-of-stock";
    if (qty <= min) return "low-stock";
    return "in-stock";
  };

  const handleSubmit = useCallback(
    (formData: any) => {
      const qty = Number(formData.inventoryAvailable) || 0;
      const min = Number(formData.minimumStockLevel) || 0;

      const payload: any = {
        organisationId: orgId,

        // Core
        name: formData.name.trim(),
        type: formData.type || "goods",
        category: formData.category.trim(),
        sku: (formData.referenceCode || `SKU-${Date.now()}`).trim(),
        referenceCode: formData.referenceCode?.trim(),

        description: formData.description?.trim() || undefined,
        trackInventory: formData.trackInventory === true,

        // THIS IS THE FIX – Use exact backend field names!
        quantity: qty,
        minStock: min,
        unitCost: Number(formData.costPrice) || 0,

        salesPrice: Number(formData.salesPrice) || 0,
        salesTax: Number(formData.salesTax) || 0,
        purchaseTax: Number(formData.purchaseTax) || 0,

        location: formData.location?.trim() || "Main Warehouse",
        barcode: formData.barcode?.trim() || undefined,
        upsellSuggestion: formData.upsellSuggestion?.trim() || undefined,

        warehouseId: formData.warehouseId || null,
        storeId: formData.storeId || null,

        // Auto-calculate status (backend will also do this, but safe to send)
        status: calculateStatus(qty, min, formData.trackInventory === true),
      };

      // Remove undefined fields to avoid Zod "unexpected key" issues
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      console.log("Sending payload:", payload); // Debug

      const action = editingProduct
        ? updateProduct({ id: editingProduct._id!, data: payload })
        : addProduct(payload);

      dispatch(action).then((res: any) => {
        if (!res.error) {
          toast.success(
            editingProduct ? "Product updated!" : "Product created!"
          );
          dispatch(fetchProducts());
          setShowAddProductForm(false);
          setEditingProduct(null);
        } else {
          console.error("Backend error:", res.payload);
          toast.error(res.payload?.message || "Validation failed");
        }
      });
    },
    [dispatch, editingProduct, orgId]
  );

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(deleteProduct(id)).then((res: any) => {
        if (!res.error) {
          toast.success("Product deleted");
          dispatch(fetchProducts());
        }
      });
    }
  };

  // FULL ADD / EDIT FORM
  const ProductForm = ({ initialData }: { initialData?: Partial<Product> }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || "",
      type: initialData?.type || "goods",
      category: initialData?.category || "",
      referenceCode: initialData?.referenceCode || initialData?.sku || "",
      description: initialData?.description || "",
      trackInventory: initialData?.trackInventory ?? true,
      inventoryAvailable: (initialData?.quantity ?? 0).toString(),
      minimumStockLevel: (initialData?.minStock ?? 0).toString(),
      costPrice: (initialData?.unitCost ?? 0).toString(),
      salesPrice: (initialData?.salesPrice ?? 0).toString(),
      salesTax: (initialData?.salesTax ?? 0).toString(),
      purchaseTax: (initialData?.purchaseTax ?? 0).toString(),
      location: initialData?.location || "Main Warehouse",
      barcode: initialData?.barcode || "",
      upsellSuggestion: initialData?.upsellSuggestion || "",
      warehouseId: initialData?.warehouseId || "",
      storeId: initialData?.storeId || "",
    });

    const handleChange =
      (field: string) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      };

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        {/* Backdrop click to close */}
        <div
          className="absolute inset-0"
          onClick={() => {
            setShowAddProductForm(false);
            setEditingProduct(null);
          }}
        />

        {/* Modal Card - Responsive & Scrollable */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-screen my-8 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b bg-white sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <button
              onClick={() => {
                setShowAddProductForm(false);
                setEditingProduct(null);
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <form onSubmit={onSubmit} className="space-y-8">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={handleChange("name")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g. Stainless Steel Rod 12mm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={handleChange("type")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="goods">Goods</option>
                    <option value="services">Services</option>
                    <option value="combo">Combo / Bundle</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.category}
                    onChange={handleChange("category")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Raw Materials"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    SKU / Reference Code
                  </label>
                  <input
                    type="text"
                    value={formData.referenceCode}
                    onChange={handleChange("referenceCode")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. SSR-12MM-2025"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={handleChange("description")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Detailed product description..."
                />
              </div>

              {/* Track Inventory */}
              <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-xl">
                <input
                  type="checkbox"
                  checked={formData.trackInventory}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      trackInventory: e.target.checked,
                    }))
                  }
                  className="h-6 w-6 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-lg font-medium text-gray-800">
                  Track Inventory for this product
                </label>
              </div>

              {/* Inventory Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available Stock
                  </label>
                  <input
                    type="number"
                    value={formData.inventoryAvailable}
                    onChange={handleChange("inventoryAvailable")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    value={formData.minimumStockLevel}
                    onChange={handleChange("minimumStockLevel")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location / Warehouse
                  </label>
                  <select
                    value={formData.location}
                    onChange={handleChange("location")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Warehouse</option>

                    {warehouses.map((w) => (
                      <option key={w._id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Barcode
                  </label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={handleChange("barcode")}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="8901234567890"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-xl font-bold text-blue-900 mb-5 flex items-center gap-3">
                  <DollarSign className="h-7 w-7" /> Pricing & Tax
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cost Price *
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={handleChange("costPrice")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sales Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salesPrice}
                      onChange={handleChange("salesPrice")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sales Tax (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salesTax}
                      onChange={handleChange("salesTax")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Purchase Tax (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchaseTax}
                      onChange={handleChange("purchaseTax")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Upsell + Locations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upsell Suggestion
                  </label>
                  <input
                    type="text"
                    value={formData.upsellSuggestion}
                    onChange={handleChange("upsellSuggestion")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Buy with Lubricant Oil"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> Default Warehouse
                  </label>
                  <select
                    value={formData.warehouseId}
                    onChange={handleChange("warehouseId")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Store className="h-5 w-5" /> Default Store
                  </label>
                  <select
                    value={formData.storeId}
                    onChange={handleChange("storeId")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {stores.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sticky Footer Buttons */}
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t pt-6 -mx-6 px-6 pb-6 mt-10">
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProductForm(false);
                      setEditingProduct(null);
                    }}
                    className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg transition-all transform hover:scale-105"
                  >
                    {editingProduct ? "Update Product" : "Create Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // VIEW MODAL
  const ViewProductModal = ({ item }: { item: Product }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">{item.name}</h2>
          <button onClick={() => setViewingProduct(null)}>
            <X className="h-7 w-7 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <strong>SKU:</strong> {item.sku}
            </div>
            <div>
              <strong>Type:</strong> {item.type}
            </div>
            <div>
              <strong>Category:</strong> {item.category}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <span
                className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                  item.status
                )}`}
              >
                {item.status.replace(/-/g, " ")}
              </span>
            </div>
            <div>
              <strong>Stock:</strong> {item.quantity} (Min: {item.minStock})
            </div>
            <div>
              <strong>Location:</strong> {item.location}
            </div>
            {item.barcode && (
              <div>
                <strong>Barcode:</strong> {item.barcode}
              </div>
            )}
            {item.salesPrice > 0 && (
              <div>
                <strong>Sales Price:</strong> $
                {Number(item.salesPrice).toFixed(2)}
              </div>
            )}
          </div>
          {item.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <strong>Description:</strong>
              <p className="mt-2 text-gray-700">{item.description}</p>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setViewingProduct(null)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Complete product catalog management
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowAddProductForm(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-3 text-sm font-medium shadow-lg"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option>Raw Materials</option>
            <option>Components</option>
            <option>Finished Goods</option>
            <option>Consumables</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {getStatusIcon(item.status)}
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-xs text-gray-500 truncate max-w-md">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {item.sku}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {item.category}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="font-bold">{item.quantity}</span>
                  <span className="text-gray-500"> / {item.minStock} min</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  ${Number(item.unitCost).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  ${(item.quantity * Number(item.unitCost)).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status.replace(/-/g, " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-4">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => setViewingProduct(item)}
                    >
                      <Eye className="h-5 w-5" />
                    </button>

                    <button
                      className="text-green-600 hover:text-green-800"
                      onClick={() => {
                        setEditingProduct(item);
                        setShowAddProductForm(true);
                      }}
                    >
                      <Edit className="h-5 w-5" />
                    </button>

                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(item._id!)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddProductForm && (
        <ProductForm initialData={editingProduct || undefined} />
      )}
      {viewingProduct && <ViewProductModal item={viewingProduct} />}
    </div>
  );
};

export default Products;
