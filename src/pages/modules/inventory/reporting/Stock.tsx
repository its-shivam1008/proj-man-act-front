import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
// import {
//   fetchStockReports,
//   addStockReport,
//   updateStockReport,
//   deleteStockReport,
//   StockReport,
// } from "../../../../redux/slices/stockReportSlice";
import { fetchProducts } from "../../../../redux/slices/productSlice";
import { fetchWarehouses } from "../../../../redux/slices/warehouseSlice";
import { fetchMaterials } from "../../../../redux/slices/rawmaterialSlice";
import {
  Package,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Stock: React.FC = () => {
  const canView = usePermission("stocks", "view");
  const canCreate = usePermission("stocks", "create");
  const canEdit = usePermission("stocks", "edit");
  const canDelete = usePermission("stocks", "delete");

  const dispatch = useDispatch<AppDispatch>();
  const { stockReports, loading } = useSelector(
    (state: RootState) => state.stockReports
  );
  const { products, loading: productsLoading } = useSelector(
    (state: RootState) => state.products
  );
  const { warehouses, loading: warehousesLoading } = useSelector(
    (state: RootState) => state.warehouse
  );
  const rawMaterialsState = useSelector((state: RootState) => state.rawMaterials);
  const rawMaterials: any[] = rawMaterialsState?.materials || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // dispatch(fetchStockReports());
    dispatch(fetchProducts({ page: 1, limit: 1000 }));
    dispatch(fetchWarehouses({ page: 1, limit: 100 }));
    dispatch(fetchMaterials({ page: 1, limit: 1000 }));
  }, [dispatch]);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center py-12 px-4">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600">
                You do not have the necessary permissions to view this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const safeStockReports = Array.isArray(stockReports) ? stockReports : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];
  const safeRawMaterials = Array.isArray(rawMaterials) ? rawMaterials : [];
  const handleExport = () => {
    const headers = [
      "Type",
      "Item Name",
      "Warehouse",
      "Quantity",
      "Unit Price",
      "Total Value",
      "Status",
    ];

    const rows = filteredStock.map((item) => [
      item.itemType,
      item.itemName,
      item.warehouseName,
      item.quantity,
      item.unitPrice,
      item.totalAmount,
      item.inStock ? "In Stock" : "Out of Stock",
    ]);

    const csvContent =
      [headers, ...rows]
        .map((e) => e.map(v => `"${v}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "stock-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Combine products and raw materials for display
  const combinedStock = useMemo(() => {
    const productItems: any[] = [];

    safeProducts.forEach((p: any) => {
      if (p.type === "services") return;

      if (p.trackInventory && Array.isArray(p.stocks) && p.stocks.length > 0) {
        p.stocks.forEach((stock: any) => {
          const unitPrice = p.salesPrice || stock.unitCost || p.unitCost || p.price || 0;
          const warehouse = safeWarehouses.find(
            (w: any) => String(w._id) === String(stock.warehouseId)
          );

          productItems.push({
            _id: `${p._id}-${stock.warehouseId}`,
            itemType: "Product",
            itemName: p.name,
            quantity: stock.quantity,
            unitPrice,
            totalAmount: stock.quantity * unitPrice,
            inStock: stock.quantity > 0,
            lowStock: stock.quantity <= (p.reorderLevel || 0),
            date: p.createdAt || new Date().toISOString(),
            category: p.category || "Product",
            warehouseId: stock.warehouseId,
            warehouseName: warehouse?.name || "Unknown Warehouse",
            reorderLevel: p.reorderLevel || 0,
          });
        });
      } else {
        const unitPrice = p.salesPrice || p.unitCost || p.price || 0;
        productItems.push({
          _id: p._id,
          itemType: "Product",
          itemName: p.name,
          quantity: 0,
          unitPrice,
          totalAmount: 0,
          inStock: false,
          lowStock: true,
          date: p.createdAt || new Date().toISOString(),
          category: p.category || "Product",
          warehouseId: "",
          warehouseName: "No Warehouse",
          reorderLevel: p.reorderLevel || 0,
        });
      }
    });

    const materialItems: any[] = [];

    safeRawMaterials.forEach((m: any) => {
      if (!Array.isArray(m.stocks) || m.stocks.length === 0) return;

      m.stocks.forEach((stock: any) => {
        const warehouse = safeWarehouses.find(
          (w: any) => String(w._id) === String(stock.warehouseId)
        );

        materialItems.push({
          _id: `${m._id}-${stock.warehouseId}`,
          itemType: "Raw Material",
          itemName: m.name,
          quantity: stock.remainingQuantity ?? stock.quantity ?? 0,
          unitPrice: stock.unitCost || 0,
          totalAmount:
            (stock.remainingQuantity ?? stock.quantity ?? 0) *
            (stock.unitCost || 0),
          inStock: (stock.remainingQuantity ?? stock.quantity ?? 0) > 0,
          lowStock:
            (stock.remainingQuantity ?? stock.quantity ?? 0) <=
            (m.reorderLevel || 0),
          date: stock.purchaseDate || m.createdAt,
          category: "Raw Material",
          warehouseId: stock.warehouseId,
          warehouseName: warehouse?.name || "Unknown Warehouse",
          reorderLevel: m.reorderLevel || 0,
          batchId: stock.batchId,
        });
      });
    });


    return [...productItems, ...materialItems];
  }, [safeProducts, safeRawMaterials, safeWarehouses]);

  const filteredStock = useMemo(() => {
    return combinedStock.filter((item) => {
      const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.itemType === categoryFilter;

      let matchesWarehouse = true;
      if (warehouseFilter !== "all") {
        if (item.itemType === "Product") {
          matchesWarehouse = item.warehouseName === warehouseFilter;
        }
      }

      let matchesDate = true;
      if (monthFilter !== "all") {
        const itemDate = new Date(item.date);
        const now = new Date();

        if (monthFilter === "this-month") {
          matchesDate = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        } else if (monthFilter === "last-month") {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          matchesDate = itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
        } else if (monthFilter === "this-quarter") {
          const quarter = Math.floor(now.getMonth() / 3);
          const itemQuarter = Math.floor(itemDate.getMonth() / 3);
          matchesDate = itemQuarter === quarter && itemDate.getFullYear() === now.getFullYear();
        } else if (monthFilter === "this-year") {
          matchesDate = itemDate.getFullYear() === now.getFullYear();
        }
      }

      const matchesStatus =
        stockStatusFilter === "all" ||
        (stockStatusFilter === "in-stock" && item.inStock) ||
        (stockStatusFilter === "out-of-stock" && !item.inStock) ||
        (stockStatusFilter === "low-stock" && item.lowStock);

      return matchesSearch && matchesCategory && matchesWarehouse && matchesDate && matchesStatus;
    });
  }, [combinedStock, searchTerm, categoryFilter, warehouseFilter, monthFilter, stockStatusFilter]);

  const paginatedStock = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStock.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStock, currentPage]);

  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);

  const stats = useMemo(() => {
    return {
      totalItems: filteredStock.length,
      totalValue: filteredStock.reduce((sum, item) => sum + item.totalAmount, 0),
      lowStockItems: filteredStock.filter((item) => item.lowStock).length,
      outOfStockItems: filteredStock.filter((item) => !item.inStock).length,
    };
  }, [filteredStock]);

  // const handleCloseForms = useCallback(() => {
  //   setShowCreateForm(false);
  //   setShowUpdateForm(false);
  //   setShowViewForm(false);
  //   setEditingId(null);
  //   setViewingId(null);
  // }, []);

  // const handleSubmit = useCallback(
  //   async (formData: any) => {
  //     const orgId = localStorage.getItem("organisationId");
  //     if (!orgId) {
  //       alert("No organisationId found");
  //       return;
  //     }

  //     const commonData: Partial<StockReport> = {
  //       organisationId: orgId,
  //       itemId: formData.itemId,
  //       unitCost: Number(formData.unitCost) || 0,
  //       incomingQuantity: Number(formData.incomingQuantity) || 0,
  //       outgoingQuantity: Number(formData.outgoingQuantity) || 0,
  //       category: formData.category,
  //       warehouse: formData.warehouse,
  //       productType: formData.productType,
  //     };

  //     if (editingId) {
  //       await dispatch(updateStockReport({ id: editingId, data: commonData }));
  //     } else {
  //       await dispatch(addStockReport(commonData as StockReport));
  //     }

  //     handleCloseForms();
  //     dispatch(fetchStockReports());
  //   },
  //   [editingId, handleCloseForms, dispatch]
  // );

  // const handleEdit = useCallback((id: string) => {
  //   setEditingId(id);
  //   setShowUpdateForm(true);
  // }, []);

  // const handleView = useCallback((id: string) => {
  //   setViewingId(id);
  //   setShowViewForm(true);
  // }, []);

  // const handleDelete = useCallback(
  //   async (id: string) => {
  //     if (confirm("Are you sure you want to delete this stock report?")) {
  //       await dispatch(deleteStockReport(id));
  //       dispatch(fetchStockReports());
  //     }
  //   },
  //   [dispatch]
  // );

  // const StockReportForm = ({
  //   initialData,
  // }: {
  //   initialData?: Partial<StockReport>;
  // }) => {
  //   const itemIdValue =
  //     typeof initialData?.itemId === "string"
  //       ? initialData.itemId
  //       : initialData?.itemId?._id || initialData?.itemId?.id || "";

  //   // const [formData, setFormData] = useState({
  //   //   itemId: itemIdValue || "",
  //   //   unitCost: initialData?.unitCost ? initialData.unitCost.toString() : "",
  //   //   incomingQuantity: initialData?.incomingQuantity
  //   //     ? initialData.incomingQuantity.toString()
  //   //     : "",
  //   //   outgoingQuantity: initialData?.outgoingQuantity
  //   //     ? initialData.outgoingQuantity.toString()
  //   //     : "",
  //   //   category: initialData?.category || "Raw Materials",
  //   //   warehouse: initialData?.warehouse || "",
  //   //   productType: initialData?.productType || "goods",
  //   // });

  //   // const handleChange = (field: string, value: string) => {
  //   //   setFormData((prev) => ({ ...prev, [field]: value }));
  //   // };

  //   // const handleFormSubmit = (e: React.FormEvent) => {
  //   //   e.preventDefault();
  //   //   handleSubmit(formData);
  //   // };

  //   // const isEditing = !!initialData;

  //   return (
  //     // <Dialog open={true} onOpenChange={handleCloseForms}>
  //     //   <DialogContent className="max-w-2xl">
  //     //     <DialogHeader>
  //     //       <DialogTitle>
  //     //         {isEditing ? "Update Stock Report" : "Add New Stock Report"}
  //     //       </DialogTitle>
  //     //       <DialogDescription>
  //     //         {isEditing ? "Update the stock report details below" : "Create a new stock entry for products or raw materials"}
  //     //       </DialogDescription>
  //     //     </DialogHeader>
  //     //     <form onSubmit={handleFormSubmit} className="space-y-4">
  //     //       <div className="grid grid-cols-2 gap-4">
  //     //         <div className="space-y-2">
  //     //           <Label htmlFor="itemId">Item Name *</Label>
  //     //           <Select
  //     //             value={formData.itemId}
  //     //             onValueChange={(value) => handleChange("itemId", value)}
  //     //           >
  //     //             <SelectTrigger id="itemId">
  //     //               <SelectValue placeholder="Select Item" />
  //     //             </SelectTrigger>
  //     //             <SelectContent>
  //     //               {productsLoading ? (
  //     //                 <SelectItem value="" disabled>Loading products...</SelectItem>
  //     //               ) : safeProducts.length === 0 ? (
  //     //                 <SelectItem value="" disabled>No products available</SelectItem>
  //     //               ) : (
  //     //                 safeProducts.map((product) => (
  //     //                   <SelectItem
  //     //                     key={product._id || product.id}
  //     //                     value={product._id || product.id}
  //     //                   >
  //     //                     {product.name}
  //     //                   </SelectItem>
  //     //                 ))
  //     //               )}
  //     //             </SelectContent>
  //     //           </Select>
  //     //         </div>
  //     //         <div className="space-y-2">
  //     //           <Label htmlFor="unitCost">Unit Cost *</Label>
  //     //           <Input
  //     //             id="unitCost"
  //     //             type="number"
  //     //             step="0.01"
  //     //             value={formData.unitCost}
  //     //             onChange={(e) => handleChange("unitCost", e.target.value)}
  //     //             placeholder="Enter unit cost"
  //     //             min="0"
  //     //             required
  //     //           />
  //     //         </div>
  //     //       </div>

  //     //       <div className="grid grid-cols-2 gap-4">
  //     //         <div className="space-y-2">
  //     //           <Label htmlFor="incomingQuantity">Incoming Quantity *</Label>
  //     //           <Input
  //     //             id="incomingQuantity"
  //     //             type="number"
  //     //             value={formData.incomingQuantity}
  //     //             onChange={(e) => handleChange("incomingQuantity", e.target.value)}
  //     //             placeholder="Enter incoming quantity"
  //     //             min="0"
  //     //             required
  //     //           />
  //     //         </div>
  //     //         <div className="space-y-2">
  //     //           <Label htmlFor="outgoingQuantity">Outgoing Quantity *</Label>
  //     //           <Input
  //     //             id="outgoingQuantity"
  //     //             type="number"
  //     //             value={formData.outgoingQuantity}
  //     //             onChange={(e) => handleChange("outgoingQuantity", e.target.value)}
  //     //             placeholder="Enter outgoing quantity"
  //     //             min="0"
  //     //             required
  //     //           />
  //     //         </div>
  //     //       </div>

  //     //       <div className="grid grid-cols-3 gap-4">
  //     //         <div className="space-y-2">
  //     //           <Label htmlFor="category">Category *</Label>
  //     //           <Select
  //     //             value={formData.category}
  //     //             onValueChange={(value) => handleChange("category", value)}
  //     //           >
  //     //             <SelectTrigger id="category">
  //     //               <SelectValue />
  //     //             </SelectTrigger>
  //     //             <SelectContent>
  //     //               <SelectItem value="Raw Materials">Raw Materials</SelectItem>
  //     //               <SelectItem value="Components">Components</SelectItem>
  //     //               <SelectItem value="Finished Goods">Finished Goods</SelectItem>
  //     //             </SelectContent>
  //     //           </Select>
  //     //         </div>
  //     //         <div className="space-y-2">
  //     //           <Label htmlFor="warehouse">Warehouse *</Label>
  //     //           <Select
  //     //             value={formData.warehouse}
  //     //             onValueChange={(value) => handleChange("warehouse", value)}
  //     //           >
  //     //             <SelectTrigger id="warehouse">
  //     //               <SelectValue placeholder="Select Warehouse" />
  //     //             </SelectTrigger>
  //     //             <SelectContent>
  //     //               {warehousesLoading ? (
  //     //                 <SelectItem value="" disabled>Loading warehouses...</SelectItem>
  //     //               ) : safeWarehouses.length === 0 ? (
  //     //                 <SelectItem value="" disabled>No warehouses available</SelectItem>
  //     //               ) : (
  //     //                 safeWarehouses.map((warehouse: any) => (
  //     //                   <SelectItem
  //     //                     key={warehouse._id || warehouse.id}
  //     //                     value={warehouse._id || warehouse.id}
  //     //                   >
  //     //                     {warehouse.name}{" "}
  //     //                     {warehouse.location ? `- ${warehouse.location}` : ""}
  //     //                   </SelectItem>
  //     //                 ))
  //     //               )}
  //     //             </SelectContent>
  //     //           </Select>
  //     //         </div>
  //     //         <div className="space-y-2">
  //     //           <Label htmlFor="productType">Product Type *</Label>
  //     //           <Select
  //     //             value={formData.productType}
  //     //             onValueChange={(value) => handleChange("productType", value)}
  //     //           >
  //     //             <SelectTrigger id="productType">
  //     //               <SelectValue />
  //     //             </SelectTrigger>
  //     //             <SelectContent>
  //     //               <SelectItem value="goods">Goods</SelectItem>
  //     //               <SelectItem value="services">Services</SelectItem>
  //     //               <SelectItem value="combo">Combo</SelectItem>
  //     //             </SelectContent>
  //     //           </Select>
  //     //         </div>
  //     //       </div>

  //     //       <DialogFooter>
  //     //         <Button type="button" variant="outline" onClick={handleCloseForms}>
  //     //           Cancel
  //     //         </Button>
  //     //         <Button
  //     //           type="submit"
  //     //           disabled={initialData ? !canEdit : !canCreate}
  //     //         >
  //     //           {initialData ? "Update Stock Report" : "Add Stock Report"}
  //     //         </Button>
  //     //       </DialogFooter>
  //     //     </form>
  //     //   </DialogContent>
  //     // </Dialog>
  //   );
  // };

  const ViewStockReportForm = ({ item }: { item: StockReport | undefined }) => {
    if (!item) return null;
    const itemId =
      typeof item.itemId === "string"
        ? item.itemId
        : item.itemId?._id || item.itemId?.id || "";
    const productItem = safeProducts.find(
      (i) => i._id === itemId || i.id === itemId
    );

    return (
      <Dialog open={true} onOpenChange={handleCloseForms}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Stock Report</DialogTitle>
            <DialogDescription>
              Stock report details for {productItem?.name || "Unknown Item"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <p className="text-sm text-gray-900 p-2 bg-slate-50 rounded">
                  {productItem?.name ||
                    (typeof item.itemId === "object" && item.itemId?.name) ||
                    "Unknown Item"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Unit Cost</Label>
                <p className="text-sm text-gray-900 p-2 bg-slate-50 rounded">
                  ${item.unitCost.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Incoming Quantity</Label>
                <p className="text-sm text-gray-900 p-2 bg-slate-50 rounded">
                  {item.incomingQuantity}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Outgoing Quantity</Label>
                <p className="text-sm text-gray-900 p-2 bg-slate-50 rounded">
                  {item.outgoingQuantity}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <p className="text-sm text-gray-900 p-2 bg-slate-50 rounded">{item.category}</p>
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <p className="text-sm text-gray-900 p-2 bg-slate-50 rounded">{item.warehouse}</p>
              </div>
              <div className="space-y-2">
                <Label>Product Type</Label>
                <p className="text-sm text-gray-900 p-2 bg-slate-50 rounded">{item.productType}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForms}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Stock Reports
            </h1>
            <p className="mt-2 text-slate-600">
              Comprehensive inventory management and reporting
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button> */}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* <Button
              size="sm"
              disabled={!canCreate}
              onClick={() => canCreate && setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button> */}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats.totalItems}</p>
                  <p className="text-xs opacity-80 mt-1">Active inventory</p>
                </div>
                <Package className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    ${stats.totalValue.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-80 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Inventory value
                  </p>
                </div>
                <DollarSign className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats.lowStockItems}</p>
                  <p className="text-xs opacity-80 mt-1">Needs attention</p>
                </div>
                <AlertTriangle className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats.outOfStockItems}</p>
                  <p className="text-xs opacity-80 mt-1">Urgent reorder</p>
                </div>
                <TrendingDown className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
                if (value !== "Product") {
                  setWarehouseFilter("all");
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Product">Products</SelectItem>
                  <SelectItem value="Raw Material">Raw Materials</SelectItem>
                </SelectContent>
              </Select>

              <Select value={warehouseFilter} onValueChange={(value) => {
                setWarehouseFilter(value);
                setCurrentPage(1);
              }} disabled={categoryFilter !== "Product"}>
                <SelectTrigger>
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  <SelectItem value="No Warehouse">No Warehouse</SelectItem>
                  {safeWarehouses.map((w: any) => (
                    <SelectItem key={w._id} value={w.name}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockStatusFilter} onValueChange={(value) => {
                setStockStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <Select value={monthFilter} onValueChange={(value) => {
                setMonthFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stock Table */}
        <Card className="shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="font-semibold text-right">Quantity</TableHead>
                  <TableHead className="font-semibold text-right">Unit Price</TableHead>
                  <TableHead className="font-semibold text-right">Total Value</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Warehouse</TableHead>
                  {/* <TableHead className="text-right">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-slate-600">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No stock items found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStock.map((item) => (
                    <TableRow
                      key={item._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell>
                        <Badge
                          variant={
                            item.itemType === "Product" ? "default" : "secondary"
                          }
                          className="font-medium"
                        >
                          {item.itemType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.itemName}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ₹{item.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {!item.inStock ? (
                          <Badge variant="destructive" className="gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Out of Stock
                          </Badge>
                        ) : item.lowStock ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-orange-500 text-orange-700"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-green-500 text-green-700"
                          >
                            <TrendingUp className="h-3 w-3" />
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.warehouseName !== "N/A" && (
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">{item.warehouseName}</span>
                          </div>
                        )}
                      </TableCell>
                      {/* <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleView(item._id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem onClick={() => handleEdit(item._id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Item
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {canDelete && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(item._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell> */}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-slate-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredStock.length)} of{" "}
                  {filteredStock.length} items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forms Modals */}
        {showCreateForm && <StockReportForm initialData={undefined} />}
        {showUpdateForm && editingId && (
          <StockReportForm
            initialData={safeStockReports.find((r) => r._id === editingId)}
          />
        )}
        {showViewForm && viewingId && (
          <ViewStockReportForm
            item={safeStockReports.find((r) => r._id === viewingId)}
          />
        )}
      </div>
    </div>
  );
};

export default Stock;