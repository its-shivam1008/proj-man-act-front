import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import { fetchProducts } from "../../../../redux/slices/productSlice";
import { fetchMaterials } from "../../../../redux/slices/rawmaterialSlice";
import { Search, Download, BarChart2, PieChart as PieIcon } from "lucide-react";
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
  const dispatch = useDispatch<AppDispatch>();
  const orgId = typeof window !== "undefined" ? localStorage.getItem("organisationId") : null;

  const { products = [], loading: productsLoading } = useSelector((state: RootState) => state.products || {});
  const { materials = [], loading: materialsLoading } = useSelector((state: RootState) => state.rawMaterials || {});

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "product" | "material">("all");
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    dispatch(fetchProducts(orgId as any));
    dispatch(fetchMaterials(orgId as any));
  }, [dispatch, orgId]);

  const combined = useMemo(() => {
    const p = products.map((it: any) => ({
      id: it._id || it.id,
      type: "Product",
      name: it.name || it.productName || "Untitled product",
      qty: Number(it.quantity || 0),
      unit: it.unit || it.unitOfMeasure || "",
      value: Number((it.unitCost || 0) * (it.quantity || 0)),
    }));

    const m = materials.map((it: any) => ({
      id: it._id || it.id,
      type: "Raw Material",
      name: it.name || it.materialName || "Untitled material",
      qty: Number(it.quantity || 0),
      unit: it.unitOfMeasure || it.unit || "",
      value: Number((it.unitCost || 0) * (it.quantity || 0)),
    }));

    return [...p, ...m];
  }, [products, materials]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return combined.filter((item) => {
      if (filter === "product" && item.type !== "Product") return false;
      if (filter === "material" && item.type !== "Raw Material") return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q);
    });
  }, [combined, search, filter]);

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

  return (
    <div className="p-6 max-w-8xl mx-auto">
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Inventory History</h1>
          <p className="text-sm text-gray-500">Overview, charts and export for products & raw materials</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md text-sm ${filter === "all" ? "bg-indigo-600 text-white" : "text-gray-700"}`}
            >All</button>
            <button
              onClick={() => setFilter("product")}
              className={`px-3 py-1 rounded-md text-sm ${filter === "product" ? "bg-indigo-600 text-white" : "text-gray-700"}`}
            >Products</button>
            <button
              onClick={() => setFilter("material")}
              className={`px-3 py-1 rounded-md text-sm ${filter === "material" ? "bg-indigo-600 text-white" : "text-gray-700"}`}
            >Raw Materials</button>
          </div>

          <button
            onClick={downloadCSV}
            className="ml-2 inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

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
