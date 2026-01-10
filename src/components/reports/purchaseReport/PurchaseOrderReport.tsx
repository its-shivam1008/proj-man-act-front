"use client";
import { AppDispatch, RootState } from "@/redux/store";
import ReportShell from "./ReportShell";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchPurchaseOrders } from "@/redux/slices/purchase/purchaseOrderSlice";
/* =========================
   COMPONENT
========================= */
export default function PurchaseOrderReport() {
  const { purchaseOrders, loading } = useSelector(
    (state: RootState) => state.purchaseOrders
  );

  const data = purchaseOrders || [];
  console.log(data , "product order -->")

  /* =========================
     CALCULATIONS
  ========================= */
  const totalValue = data.reduce(
    (sum: number, d: any) => sum + (d.totalAmount || 0),
    0
  );
// const organisationId = localStorage.getItem('organisationId')
 const dispatch = useDispatch<AppDispatch>();
  const avgOrderValue = Math.round(
    totalValue / (data.length || 1)
  );
useEffect(() => {
  if (!purchaseOrders.length) {
    dispatch(
      fetchPurchaseOrders({
        page: 1,
        limit: 50,
      })
    );
  }
}, [dispatch, purchaseOrders.length]);

  /* =========================
     LOADING / EMPTY STATES
  ========================= */
  if (loading) {
    return (
      <ReportShell title="Purchase Order Report">
        <div className="text-gray-500 text-sm">
          Loading purchase orders...
        </div>
      </ReportShell>
    );
  }

  if (!data.length) {
    return (
      <ReportShell title="Purchase Order Report">
        <div className="text-gray-500 text-sm">
          No purchase orders found
        </div>
      </ReportShell>
    );
  }

  /* =========================
     UI COMPONENTS
  ========================= */
  const KPI = ({
    title,
    value,
    highlight,
  }: {
    title: string;
    value: string | number;
    highlight?: boolean;
  }) => (
    <div
      className={`rounded-2xl p-5 border transition-all
        ${
          highlight
            ? "bg-black text-white"
            : "bg-white text-black hover:shadow-md"
        }
      `}
    >
      <p className="text-xs uppercase tracking-wide opacity-70">
        {title}
      </p>
      <p className="text-2xl font-semibold mt-2">
        {value}
      </p>
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      approved: "bg-black text-white",
      pending: "bg-gray-100 text-gray-800",
      rejected: "bg-gray-200 text-gray-900",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          map[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const ReportTable = ({
    headers,
    rows,
  }: {
    headers: string[];
    rows: any[][];
  }) => (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b hover:bg-gray-50 transition"
            >
              <td className="px-4 py-3 font-medium">
                {row[0]}
              </td>
              <td className="px-4 py-3">{row[1]}</td>
              <td className="px-4 py-3">{row[2]}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row[3]} />
              </td>
              <td className="px-4 py-3 text-gray-500">
                {row[4]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* =========================
     RENDER
  ========================= */
  return (
    <ReportShell
      title="Purchase Order Report"
      subtitle="PO value, volume & trend overview"
    >
      {/* KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KPI title="Total Orders" value={data.length} />
        <KPI
          title="Total Value"
          value={`₹${totalValue.toLocaleString()}`}
          highlight
        />
        <KPI
          title="Avg Order Value"
          value={`₹${avgOrderValue.toLocaleString()}`}
        />
      </div>

      {/* CHART */}
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-4">
          Purchase Order Value Trend
        </h3>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <XAxis dataKey="poNo" hide />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}
            />
            <Bar
              dataKey="totalAmount"
              fill="#000000"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TABLE */}
      <ReportTable
        headers={[
          "PO No",
          "Vendor",
          "Amount",
          "Status",
          "Date",
        ]}
        rows={data.map((po: any) => [
          po.poNo,
          po.vendor,
          `₹${po.totalAmount?.toLocaleString()}`,
          po.status,
          new Date(po.createdAt).toLocaleDateString(),
        ])}
      />
    </ReportShell>
  );
}
