"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchVendors } from "@/redux/slices/purchase/vendorSlice";
import ReportShell from "./ReportShell";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Users,
  Star,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

/* ---------------- KPI CARD ---------------- */
const KPI = ({ title, value, icon }: any) => (
  <div className="bg-white rounded-xl p-4 shadow border flex items-center gap-4">
    <div className="text-blue-600">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

/* ---------------- STATUS BADGE ---------------- */
const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-medium ${
      active
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

export default function VendorReport() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    vendors,
    loading,
    error,
    meta,
  } = useSelector((state: RootState) => state.vendors);

  const [page, setPage] = useState(1);
  const limit = 10;

  /* ---------------- FETCH VENDORS ---------------- */
  useEffect(() => {
    dispatch(fetchVendors({ page, limit }));
  }, [dispatch, page, limit]);

  /* ---------------- KPIs ---------------- */
  const totalVendors = meta?.total ?? vendors.length;
  const activeVendors = vendors.filter(v => v.isActive).length;
  const inactiveVendors = vendors.length - activeVendors;

  /* ---------------- PIE DATA ---------------- */
  const statusData = [
    { name: "Active", value: activeVendors },
    { name: "Inactive", value: inactiveVendors },
  ];

  /* ---------------- BAR DATA (RATING) ---------------- */
  const ratingData = vendors
    .filter(v => typeof v.vendorRating === "number")
    .map(v => ({
      vendorName: v.vendorName,
      rating: v.vendorRating,
    }));

  return (
    <ReportShell
      title="Vendor Report"
      subtitle="Vendor master data, activity & performance"
    >
      {/* ---------------- ERROR ---------------- */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* ---------------- KPI STRIP ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI title="Total Vendors" value={totalVendors} icon={<Users />} />
        <KPI title="Active Vendors" value={activeVendors} icon={<CheckCircle />} />
        <KPI title="Inactive Vendors" value={inactiveVendors} icon={<XCircle />} />
      </div>

      {/* ---------------- CHARTS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIVE VS INACTIVE */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <h3 className="font-semibold mb-4">Vendor Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* RATING BAR */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <h3 className="font-semibold mb-4">Vendor Rating</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ratingData}>
              <XAxis dataKey="vendorName" hide />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="rating" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---------------- TABLE ---------------- */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Vendor List</h3>
          <span className="text-sm text-gray-500">
            Page {page} of {meta?.totalPages ?? 1}
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Vendor</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Rating</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  Loading vendors...
                </td>
              </tr>
            )}

            {!loading &&
              vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3 font-medium">{vendor.vendorName}</td>
                  <td className="p-3 text-center">
                    <StatusBadge active={vendor.isActive} />
                  </td>
                  <td className="p-3 text-center flex justify-center items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {vendor.vendorRating ?? "-"}
                  </td>
                  <td className="p-3">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">
                    <button className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm">
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* PAGINATION (BASIC) */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page === meta?.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </ReportShell>
  );
}
