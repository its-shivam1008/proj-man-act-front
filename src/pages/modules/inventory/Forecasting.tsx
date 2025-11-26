// Forecasting.tsx - EXACT ORIGINAL UI + FULL REDUX INTEGRATION
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getForecasts,
  createForecast,
  updateForecast,
  deleteForecast,
} from "@/redux/slices/forecastSlice";
import { fetchProducts } from "@/redux/slices/productSlice";
import { usePermission } from "@/hooks/userPermission";
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Factory,
  BarChart3,
  Calendar,
  Target,
  Edit,
  Eye,
  Trash2,
  X,
  ShieldAlert,
} from "lucide-react";

interface ForecastItem {
  _id: string;
  productId: string;
  currentStock: number;
  demandForecast: number;
  suggestedReplenishment: number;
  leadTime: number;
  priority: "low" | "medium" | "high" | "critical";
  replenishmentRule: "automatic" | "manual";
}

const Forecasting: React.FC = () => {
  const canView = usePermission("forecasting", "view");
  const canCreate = usePermission("forecasting", "create");
  const canEdit = usePermission("forecasting", "edit");
  const canDelete = usePermission("forecasting", "delete");
  const dispatch = useDispatch();

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

  const { items: forecastItems, loading: forecastLoading } = useSelector(
    (state: any) => state.forecast
  );
  const { products, loading: productLoading } = useSelector(
    (state: any) => state.products
  );

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [ruleFilter, setRuleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(getForecasts());
    dispatch(fetchProducts());
  }, [dispatch]);

  const filteredForecastItems = forecastItems.filter(
    (forecast: ForecastItem) => {
      const product = products.find((p: any) => p._id === forecast.productId);
      const matchesSearch =
        product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        forecast._id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority =
        priorityFilter === "all" || forecast.priority === priorityFilter;
      const matchesRule =
        ruleFilter === "all" || forecast.replenishmentRule === ruleFilter;
      return matchesSearch && matchesPriority && matchesRule;
    }
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "medium":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getRuleColor = (rule: string) => {
    switch (rule) {
      case "automatic":
        return "bg-blue-100 text-blue-800";
      case "manual":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateStockStatus = (
    currentStock: number,
    demandForecast: number
  ) => {
    const ratio = currentStock / (demandForecast || 1);
    if (ratio >= 1.5) return { status: "overstocked", color: "text-blue-600" };
    if (ratio >= 1) return { status: "adequate", color: "text-green-600" };
    if (ratio >= 0.5) return { status: "low", color: "text-orange-600" };
    return { status: "critical", color: "text-red-600" };
  };

  const handleCloseForms = () => {
    setShowCreateForm(false);
    setShowUpdateForm(false);
    setShowViewForm(false);
    setEditingId(null);
    setViewingId(null);
  };

  const handleSubmit = (formData: any) => {
    const payload = {
      productId: formData.productId,
      currentStock: Number(formData.currentStock),
      demandForecast: Number(formData.demandForecast),
      suggestedReplenishment: Number(formData.suggestedReplenishment),
      leadTime: Number(formData.leadTime),
      priority: formData.priority,
      replenishmentRule: formData.replenishmentRule,
    };

    if (editingId) {
      dispatch(updateForecast({ id: editingId, data: payload }));
    } else {
      dispatch(createForecast(payload));
    }
    handleCloseForms();
  };

  const ForecastForm = ({
    initialData,
  }: {
    initialData?: Partial<ForecastItem>;
  }) => {
    const [formData, setFormData] = useState({
      productId: initialData?.productId || "",
      currentStock: (initialData?.currentStock || 0).toString(),
      demandForecast: (initialData?.demandForecast || 0).toString(),
      suggestedReplenishment: (
        initialData?.suggestedReplenishment || 0
      ).toString(),
      leadTime: (initialData?.leadTime || 0).toString(),
      priority: initialData?.priority || "low",
      replenishmentRule: initialData?.replenishmentRule || "automatic",
    });

    const handleChange =
      (field: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
          setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {initialData ? "Update Forecast Rule" : "Add Forecast Rule"}
              </h3>
              <button
                onClick={handleCloseForms}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={formData.productId}
                    onChange={handleChange("productId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((item: any) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={handleChange("currentStock")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Demand Forecast *
                  </label>
                  <input
                    type="number"
                    value={formData.demandForecast}
                    onChange={handleChange("demandForecast")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suggested Replenishment *
                  </label>
                  <input
                    type="number"
                    value={formData.suggestedReplenishment}
                    onChange={handleChange("suggestedReplenishment")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Time (days) *
                  </label>
                  <input
                    type="number"
                    value={formData.leadTime}
                    onChange={handleChange("leadTime")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={handleChange("priority")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Replenishment Rule *
                </label>
                <select
                  value={formData.replenishmentRule}
                  onChange={handleChange("replenishmentRule")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
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
  {initialData ? "Update Rule" : "Add Rule"}
</button>

              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const ViewForecastForm = ({ item }: { item: ForecastItem | undefined }) => {
    if (!item) return null;
    const product = products.find((p: any) => p._id === item.productId);
    const stockStatus = calculateStockStatus(
      item.currentStock,
      item.demandForecast
    );

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                View Forecast: {item._id}
              </h3>
              <button
                onClick={handleCloseForms}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <p className="text-sm text-gray-900">
                    {product?.name || "Unknown Product"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock
                  </label>
                  <p className="text-sm text-gray-900">
                    {item.currentStock} units
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Demand Forecast
                  </label>
                  <p className="text-sm text-gray-900">
                    {item.demandForecast} units
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suggested Replenishment
                  </label>
                  <p className="text-sm text-gray-900">
                    {item.suggestedReplenishment} units
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Time
                  </label>
                  <p className="text-sm text-gray-900">{item.leadTime} days</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                      item.priority
                    )}`}
                  >
                    {item.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Status
                  </label>
                  <span className={`font-medium ${stockStatus.color}`}>
                    {stockStatus.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Replenishment Rule
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRuleColor(
                      item.replenishmentRule
                    )}`}
                  >
                    {item.replenishmentRule}
                  </span>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Forecasting
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Smart inventory forecasting and automated replenishment suggestions
          </p>
        </div>
        <button
          disabled={!canCreate}
          onClick={() => canCreate && setShowCreateForm(true)}
          className={`px-4 py-2 rounded-lg flex items-center
    ${canCreate
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-400 text-white cursor-not-allowed"
            }`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Forecast Rule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Total Forecasts
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {forecastItems.length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Critical Priority
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    forecastItems.filter(
                      (item: any) => item.priority === "critical"
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
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Auto Rules</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {
                    forecastItems.filter(
                      (item: any) => item.replenishmentRule === "automatic"
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
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Avg Lead Time
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {forecastItems.length > 0
                    ? Math.round(
                      forecastItems.reduce(
                        (sum: number, item: any) => sum + item.leadTime,
                        0
                      ) / forecastItems.length
                    )
                    : 0}{" "}
                  days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Forecast Summary
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-800">
                Immediate Action Required
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {
                forecastItems.filter(
                  (item: any) => item.priority === "critical"
                ).length
              }
            </p>
            <p className="text-xs text-red-600">
              Items need urgent replenishment
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-yellow-800">
                Plan Ahead
              </span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-2">
              {
                forecastItems.filter(
                  (item: any) =>
                    item.priority === "high" || item.priority === "medium"
                ).length
              }
            </p>
            <p className="text-xs text-yellow-600">Items to monitor closely</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-800">
                Well Stocked
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {
                forecastItems.filter((item: any) => item.priority === "low")
                  .length
              }
            </p>
            <p className="text-xs text-green-600">Items with adequate stock</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search forecasts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Rules</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forecasting Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-x-scroll border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-100/80 backdrop-blur-sm">
            <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Current Stock</th>
              <th className="px-6 py-4">Demand Forecast</th>
              <th className="px-6 py-4">Stock Status</th>
              <th className="px-6 py-4">Suggested Replenishment</th>
              <th className="px-6 py-4">Lead Time</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Rule</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {forecastLoading || productLoading ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-16 text-center text-gray-500 text-sm"
                >
                  Loading forecasts...
                </td>
              </tr>
            ) : filteredForecastItems.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-16 text-center text-gray-500 text-sm"
                >
                  No forecast items found
                </td>
              </tr>
            ) : (
              filteredForecastItems.map((forecast: ForecastItem) => {
                const product = products.find(
                  (p: any) => p._id === forecast.productId
                );
                const stockStatus = calculateStockStatus(
                  forecast.currentStock,
                  forecast.demandForecast
                );

                return (
                  <tr
                    key={forecast._id}
                    className="transition hover:bg-gray-50/70 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {product?.name || "Unknown Product"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium">
                        {forecast.currentStock}
                      </span>{" "}
                      units
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium">
                        {forecast.demandForecast}
                      </span>{" "}
                      units
                    </td>

                    <td className="px-6 py-4">
                      <span className={`font-semibold ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-blue-600 font-semibold">
                      {forecast.suggestedReplenishment} units
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-800">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {forecast.leadTime} days
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getPriorityIcon(forecast.priority)}
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                            forecast.priority
                          )}`}
                        >
                          {forecast.priority}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getRuleColor(
                          forecast.replenishmentRule
                        )}`}
                      >
                        {forecast.replenishmentRule}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          className="text-blue-600 hover:text-blue-800 transition"
                          onClick={() => {
                            setViewingId(forecast._id);
                            setShowViewForm(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          disabled={!canEdit}
                          onClick={() =>
                            canEdit &&
                            (setEditingId(forecast._id),
                              setShowUpdateForm(true))
                          }
                          className={`${canEdit
                              ? "text-green-600"
                              : "text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          disabled={!canDelete}
                          onClick={() => {
                            if (canDelete && confirm("Delete this forecast?")) {
                              dispatch(deleteForecast(forecast._id));
                            }
                          }}
                          className={`${canDelete
                              ? "text-red-600"
                              : "text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Replenishment Recommendations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Replenishment Recommendations
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {forecastItems
              .filter(
                (item: any) =>
                  item.priority === "critical" || item.priority === "high"
              )
              .map((forecast: any) => {
                const product = products.find(
                  (p: any) => p._id === forecast.productId
                );
                return (
                  <div
                    key={forecast._id}
                    className={`border rounded-lg p-4 ${forecast.priority === "critical"
                        ? "border-red-200 bg-red-50"
                        : "border-orange-200 bg-orange-50"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getPriorityIcon(forecast.priority)}
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            {product?.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Current: {forecast.currentStock} units • Demand:{" "}
                            {forecast.demandForecast} units
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-medium ${forecast.priority === "critical"
                              ? "text-red-600"
                              : "text-orange-600"
                            }`}
                        >
                          Order {forecast.suggestedReplenishment} units
                        </span>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                          Quick Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Modals */}
    

      {showCreateForm && <ForecastForm />}
      {showUpdateForm && editingId && (
        <ForecastForm
          initialData={forecastItems.find((f: any) => f._id === editingId)}
        />
      )}
      {showViewForm && viewingId && (
        <ViewForecastForm
          item={forecastItems.find((f: any) => f._id === viewingId)}
        />
      )}
    </div>
  );
};

export default Forecasting;
