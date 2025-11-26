import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import {
  fetchStockReports,
  addStockReport,
  updateStockReport,
  deleteStockReport,
  StockReport,
} from "../../../../redux/slices/stockReportSlice";
import { fetchProducts } from "../../../../redux/slices/productSlice";
import { fetchWarehouses } from "../../../../redux/slices/warehouseSlice";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  Download,
  Upload,
  Calendar,
  DollarSign,
  XCircle,
  ShieldAlert,
} from "lucide-react";

const Stock: React.FC = () => {
  const canView = usePermission("inventoryOverview", "view");
  const canCreate = usePermission("inventoryOverview", "create");
  const canEdit = usePermission("inventoryOverview", "edit");
  const canDelete = usePermission("inventoryOverview", "delete");
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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("this-month");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
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
  useEffect(() => {
    dispatch(fetchStockReports());
    dispatch(fetchProducts());
    dispatch(fetchWarehouses({ page: 1, limit: 100 }));
  }, [dispatch]);

  const safeStockReports = Array.isArray(stockReports) ? stockReports : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];

  const filteredStockReports = safeStockReports.filter((report) => {
    const itemId =
      typeof report.itemId === "string"
        ? report.itemId
        : report.itemId?._id || report.itemId?.id || "";
    const item = safeProducts.find((i) => i._id === itemId || i.id === itemId);
    const itemName =
      item?.name ||
      (typeof report.itemId === "object" && report.itemId?.name) ||
      "";
    const matchesSearch = itemName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || report.category === categoryFilter;
    const matchesWarehouse =
      warehouseFilter === "all" || report.warehouse === warehouseFilter;
    const matchesProductType =
      productTypeFilter === "all" || report.productType === productTypeFilter;
    return (
      matchesSearch && matchesCategory && matchesWarehouse && matchesProductType
    );
  });

  const handleCloseForms = useCallback(() => {
    setShowCreateForm(false);
    setShowUpdateForm(false);
    setShowViewForm(false);
    setEditingId(null);
    setViewingId(null);
  }, []);

  const handleSubmit = useCallback(
    async (formData: any) => {
      const orgId = localStorage.getItem("organisationId");
      if (!orgId) {
        alert("No organisationId found");
        return;
      }

      const commonData: Partial<StockReport> = {
        organisationId: orgId,
        itemId: formData.itemId,
        unitCost: Number(formData.unitCost) || 0,
        incomingQuantity: Number(formData.incomingQuantity) || 0,
        outgoingQuantity: Number(formData.outgoingQuantity) || 0,
        category: formData.category,
        warehouse: formData.warehouse,
        productType: formData.productType,
      };

      if (editingId) {
        await dispatch(updateStockReport({ id: editingId, data: commonData }));
      } else {
        await dispatch(addStockReport(commonData as StockReport));
      }

      handleCloseForms();
      dispatch(fetchStockReports());
    },
    [editingId, handleCloseForms, dispatch]
  );

  // if (initialData && !canEdit) {
  //   return (
  //     <p className="text-center text-red-600 py-6">
  //       You do not have permission to edit stock reports.
  //     </p>
  //   );
  // }

  // Create mode → need CREATE permission
  // if (!initialData && !canCreate) {
  //   return (
  //     <p className="text-center text-red-600 py-6">
  //       You do not have permission to create stock reports.
  //     </p>
  //   );
  // }

  const handleEdit = useCallback((id: string) => {
    setEditingId(id);
    setShowUpdateForm(true);
  }, []);

  const handleView = useCallback((id: string) => {
    setViewingId(id);
    setShowViewForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm("Are you sure you want to delete this stock report?")) {
        await dispatch(deleteStockReport(id));
        dispatch(fetchStockReports());
      }
    },
    [dispatch]
  );

  const handleAddClick = useCallback(() => {
    setEditingId(null);
    setShowCreateForm(true);
  }, []);

  const StockReportForm = ({
    initialData,
  }: {
    initialData?: Partial<StockReport>;
  }) => {
    const itemIdValue =
      typeof initialData?.itemId === "string"
        ? initialData.itemId
        : initialData?.itemId?._id || initialData?.itemId?.id || "";

    const [formData, setFormData] = useState({
      itemId: itemIdValue || "",
      unitCost: initialData?.unitCost ? initialData.unitCost.toString() : "",
      incomingQuantity: initialData?.incomingQuantity
        ? initialData.incomingQuantity.toString()
        : "",
      outgoingQuantity: initialData?.outgoingQuantity
        ? initialData.outgoingQuantity.toString()
        : "",
      category: initialData?.category || "Raw Materials",
      warehouse: initialData?.warehouse || "",
      productType: initialData?.productType || "goods",
    });

    const handleChange = useCallback(
      (field: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
          setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        },
      []
    );

    // Stable handlers for each field
    const handleItemIdChange = useMemo(
      () => handleChange("itemId"),
      [handleChange]
    );
    const handleUnitCostChange = useMemo(
      () => handleChange("unitCost"),
      [handleChange]
    );
    const handleIncomingQuantityChange = useMemo(
      () => handleChange("incomingQuantity"),
      [handleChange]
    );
    const handleOutgoingQuantityChange = useMemo(
      () => handleChange("outgoingQuantity"),
      [handleChange]
    );
    const handleCategoryChange = useMemo(
      () => handleChange("category"),
      [handleChange]
    );
    const handleWarehouseChange = useMemo(
      () => handleChange("warehouse"),
      [handleChange]
    );
    const handleProductTypeChange = useMemo(
      () => handleChange("productType"),
      [handleChange]
    );

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit(formData);
    };

    const isEditing = !!initialData;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? "Update Stock Report" : "Add New Stock Report"}
              </h3>
              <button
                onClick={handleCloseForms}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <select
                    value={formData.itemId}
                    onChange={handleItemIdChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Item</option>
                    {productsLoading ? (
                      <option value="" disabled>
                        Loading products...
                      </option>
                    ) : safeProducts.length === 0 ? (
                      <option value="" disabled>
                        No products available
                      </option>
                    ) : (
                      safeProducts.map((product) => (
                        <option
                          key={product._id || product.id}
                          value={product._id || product.id}
                        >
                          {product.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Cost *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={handleUnitCostChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter unit cost"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incoming Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.incomingQuantity}
                    onChange={handleIncomingQuantityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter incoming quantity"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outgoing Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.outgoingQuantity}
                    onChange={handleOutgoingQuantityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter outgoing quantity"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option>Raw Materials</option>
                    <option>Components</option>
                    <option>Finished Goods</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse *
                  </label>
                  <select
                    value={formData.warehouse}
                    onChange={handleWarehouseChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Warehouse</option>
                    {warehousesLoading ? (
                      <option value="" disabled>
                        Loading warehouses...
                      </option>
                    ) : safeWarehouses.length === 0 ? (
                      <option value="" disabled>
                        No warehouses available
                      </option>
                    ) : (
                      safeWarehouses.map((warehouse: any) => (
                        <option
                          key={warehouse._id || warehouse.id}
                          value={warehouse._id || warehouse.id}
                        >
                          {warehouse.name}{" "}
                          {warehouse.location ? `- ${warehouse.location}` : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type *
                  </label>
                  <select
                    value={formData.productType}
                    onChange={handleProductTypeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="goods">Goods</option>
                    <option value="services">Services</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForms}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={initialData ? !canEdit : !canCreate}
                  className={`px-4 py-2 rounded-lg text-white
    ${
      initialData
        ? canEdit
          ? "bg-blue-600 hover:bg-blue-700"
          : "bg-gray-400 cursor-not-allowed"
        : canCreate
        ? "bg-blue-600 hover:bg-blue-700"
        : "bg-gray-400 cursor-not-allowed"
    }`}
                >
                  {initialData ? "Update Stock Report" : "Add Stock Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                View Stock Report: {item._id || item.itemId}
              </h3>
              <button
                onClick={handleCloseForms}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <p className="text-sm text-gray-900">
                    {productItem?.name ||
                      (typeof item.itemId === "object" && item.itemId?.name) ||
                      "Unknown Item"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Cost
                  </label>
                  <p className="text-sm text-gray-900">
                    ${item.unitCost.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incoming Quantity
                  </label>
                  <p className="text-sm text-gray-900">
                    {item.incomingQuantity}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outgoing Quantity
                  </label>
                  <p className="text-sm text-gray-900">
                    {item.outgoingQuantity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <p className="text-sm text-gray-900">{item.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse
                  </label>
                  <p className="text-sm text-gray-900">{item.warehouse}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type
                  </label>
                  <p className="text-sm text-gray-900">{item.productType}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseForms}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    // <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Reports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive stock reporting with real-time inventory data
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            disabled={!canCreate}
            onClick={() => canCreate && setShowForm(true)}
            className={`px-4 py-2 rounded-lg ${
              canCreate
                ? "bg-blue-600 text-white"
                : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            <Plus className="h-5 w-5" /> Add Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {safeProducts.length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  $
                  {safeProducts
                    .reduce(
                      (sum, product) =>
                        sum + (product.quantity || 0) * (product.unitCost || 0),
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Low Stock Items
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    safeProducts.filter(
                      (product) => product.status === "low-stock"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">15</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Raw Materials">Raw Materials</option>
            <option value="Components">Components</option>
            <option value="Finished Goods">Finished Goods</option>
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-quarter">This Quarter</option>
            <option value="custom">Custom Range</option>
          </select>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Warehouses</option>
            {safeWarehouses.map((warehouse: any) => (
              <option
                key={warehouse._id || warehouse.id}
                value={warehouse._id || warehouse.id}
              >
                {warehouse.name}
              </option>
            ))}
          </select>
          <select
            value={productTypeFilter}
            onChange={(e) => setProductTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="goods">Goods</option>
            <option value="services">Services</option>
            <option value="combo">Combo</option>
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Incoming Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outgoing Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : filteredStockReports.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No stock reports found
                </td>
              </tr>
            ) : (
              filteredStockReports.map((report) => {
                const itemId =
                  typeof report.itemId === "string"
                    ? report.itemId
                    : report.itemId?._id || report.itemId?.id || "";
                const product = safeProducts.find(
                  (i) => i._id === itemId || i.id === itemId
                );
                const currentStock =
                  (product?.quantity || 0) +
                  report.incomingQuantity -
                  report.outgoingQuantity;
                const totalValue = currentStock * report.unitCost;
                return (
                  <tr
                    key={report._id || report.itemId}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product?.name ||
                        (typeof report.itemId === "object" &&
                          report.itemId?.name) ||
                        "Unknown Item"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${report.unitCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${totalValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      +{report.incomingQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{report.outgoingQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {currentStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => handleView(report._id || "")}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        disabled={!canEdit}
                        onClick={() => canEdit && handleEdit(report._id || "")}
                        className={`${
                          canEdit
                            ? "text-blue-600"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <Edit className="h-5 w-5" />
                      </button>

                      <button
                        disabled={!canDelete}
                        onClick={() =>
                          canDelete && handleDelete(report._id || "")
                        }
                        className={`${
                          canDelete
                            ? "text-red-600"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
    // </Layout>
  );
};

export default Stock;
