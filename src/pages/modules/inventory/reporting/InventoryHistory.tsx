import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import { fetchProducts } from "../../../../redux/slices/productSlice";
import { fetchMaterials } from "../../../../redux/slices/rawmaterialSlice";
import { Search, Download, ShieldAlert, RefreshCw, Filter } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

// Color palettes
const PIE_COLORS = ["#7C3AED", "#06B6D4", "#F59E0B", "#EF4444", "#10B981"];
const BAR_COLOR = "#2563EB";

export default function InventoryHistoryAdvancedUI() {
  const canView = usePermission("inventoryHistory", "view");
  // (Other permissions kept for future use if needed)
  // const canCreate = usePermission("inventoryHistory", "create");
  // const canEdit = usePermission("inventoryHistory", "edit");
  // const canDelete = usePermission("inventoryHistory", "delete");

  // --- 1. New State for Filters ---
  // const [selectedProject, setSelectedProject] = useState("All Projects");
  const [movementType, setMovementType] = useState("All Types");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "product" | "material">("all");

  const dispatch = useDispatch<AppDispatch>();
  const orgId = typeof window !== "undefined" ? localStorage.getItem("organisationId") : null;

  const { products = [], loading: productsLoading } = useSelector((state: RootState) => state.products || {});
  const { materials = [], loading: materialsLoading } = useSelector((state: RootState) => state.rawMaterials || {});

  useEffect(() => {
    if (!orgId) return;
    dispatch(fetchProducts(orgId as any));
    dispatch(fetchMaterials(orgId as any));
  }, [dispatch, orgId]);

  const handleRefresh = () => {
    // setSelectedProject("All Projects");
    setMovementType("All Types");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setFilter("all");
    // Optionally re-fetch data:
    if (orgId) {
      dispatch(fetchProducts(orgId as any));
      dispatch(fetchMaterials(orgId as any));
    }
  };

  // --- 2. Data Transformation (Updated to include date/project fields) ---
  const combined = useMemo(() => {
    const p = products.map((it: any) => {
      const totalQty = (it.stocks || []).reduce(
        (sum: number, s: any) => sum + (s.quantity || 0),
        0
      );

      const avgRate =
        (it.stocks || []).length > 0
          ? (it.stocks.reduce((sum: number, s: any) => sum + (s.unitCost || 0), 0) /
             it.stocks.length)
          : 0;

      return {
        id: it._id,
        type: "Product",
        name: it.name,
        qty: totalQty,
        unit: it.unitOfMeasure || "PCS",
        value: totalQty * avgRate,
        // Fallback to createdAt or current date for filtering if field is missing
        date: it.createdAt || new Date().toISOString(), 
        // projectId: it.projectId || "Unassigned" 
      };
    });

    const m = materials.map((it: any) => {
      const totalQty = (it.stocks || []).reduce(
        (sum: number, s: any) => sum + (s.remainingQuantity ?? s.quantity ?? 0),
        0
      );

      const avgRate =
        (it.stocks || []).length > 0
          ? (it.stocks.reduce((sum: number, s: any) => sum + (s.unitCost || 0), 0) /
             it.stocks.length)
          : 0;

      return {
        id: it._id,
        type: "Raw Material",
        name: it.name,
        qty: totalQty,
        unit: it.unitOfMeasure,
        value: totalQty * avgRate,
        date: it.createdAt || new Date().toISOString(),
        // projectId: it.projectId || "Unassigned"
      };
    });

    return [...p, ...m];
  }, [products, materials]);

  // --- 3. Filtering Logic ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    return combined.filter((item) => {
      // Type Filter
      if (filter === "product" && item.type !== "Product") return false;
      if (filter === "material" && item.type !== "Raw Material") return false;
      
      // Project Filter
      // if (selectedProject !== "All Projects" && item.projectId !== selectedProject) return false;

      // Search Filter
      if (q && !item.name.toLowerCase().includes(q)) return false;

      // Date Range Filter
      if (startDate) {
        const itemDate = new Date(item.date).setHours(0,0,0,0);
        const start = new Date(startDate).setHours(0,0,0,0);
        if (itemDate < start) return false;
      }
      if (endDate) {
        const itemDate = new Date(item.date).setHours(0,0,0,0);
        const end = new Date(endDate).setHours(0,0,0,0);
        if (itemDate > end) return false;
      }

      return true;
    });
  }, [combined, search, filter, startDate, endDate]);

  // Chart data: pie breakdown of total stock value by type
  const pieData = useMemo(() => {
    const totals: Record<string, number> = {};
    combined.forEach((it) => {
      totals[it.type] = (totals[it.type] || 0) + (it.value || 0);
    });
    return Object.keys(totals).map((k) => ({ name: k, value: totals[k] }));
  }, [combined]);

  // Bar chart: top N items by value
  const topBarData = useMemo(() => {
    return [...combined]
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 8)
      .map((it) => ({ name: it.name.length > 22 ? it.name.slice(0, 19) + "..." : it.name, value: it.value }));
  }, [combined]);

  // CSV export
  const downloadCSV = () => {
    const rows = filtered.map((r) => ({ Type: r.type, Name: r.name, Quantity: r.qty, Unit: r.unit, Value: r.value }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-8xl mx-auto">
      {/* Title Section */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">Inventory History</h1>
          <p className="text-sm text-gray-500">Overview, charts and export for products & raw materials</p>
        </div>
      </div>

      {/* --- Filter Section (Matches Screenshot) --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-700" />
            <h3 className="font-bold text-gray-800 text-lg">Filters</h3>
          </div>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Project</label>
            <select 
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>All Projects</option>
            </select> </div> */}

          {/* <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Movement Type</label>
            <select 
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>All Types</option>
              <option>Inbound</option>
              <option>Outbound</option>
            </select>
          </div> */}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Search</label>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by material, source, destination, WBS task, or reference..."
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      {/* --- Controls: Tabs & Export --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >All</button>
          <button
            onClick={() => setFilter("product")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === "product" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >Products</button>
          <button
            onClick={() => setFilter("material")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === "material" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >Raw Materials</button>
        </div>

        <button
          onClick={downloadCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors text-sm font-medium"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* --- Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Top items by stock value</h3>
            <div className="text-sm text-gray-500">Top 8</div>
          </div>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={topBarData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip formatter={(val: any) => `₹${Number(val).toLocaleString("en-IN")}`} />
                <Bar dataKey="value" fill={BAR_COLOR} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Stock value breakdown</h3>
            <div className="text-sm text-gray-500">By Type</div>
          </div>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={30} paddingAngle={4}>
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`c-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip formatter={(val: any) => `₹${Number(val).toLocaleString("en-IN")}`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- Table --- */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Inventory Table ({filtered.length})</h3>
          <div className="text-sm text-gray-500">Showing: {filter === "all" ? "All" : filter === "product" ? "Products" : "Raw Materials"}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Unit</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Value (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filtered.map((r, i) => (
                <tr key={r.id || i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.type === "Product" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-sm">{r.qty}</td>
                  <td className="px-4 py-3 text-sm">{r.unit}</td>
                  <td className="px-4 py-3 text-sm font-semibold">₹{Number(r.value).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}