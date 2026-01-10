"use client";

import { usePermission } from "@/hooks/userPermission";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  FilterType,
  fetchPurchaseDashboard,
} from "@/redux/slices/purchase/purchaseDashboardSlice";

import {
  ShoppingCart,
  DollarSign,
  Users,
  FileText,
  ShieldAlert,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ---------------------------------- */
/* STATUS BADGE */
/* ---------------------------------- */
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    draft: "bg-gray-100 text-gray-600",
    delivered: "bg-green-100 text-green-700",
    closed: "bg-green-100 text-green-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700",
    expired: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
    sent: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};

/* ---------------------------------- */
/* KPI CARD */
/* ---------------------------------- */
const DashboardCard = ({
  title,
  value,
  icon,
  highlight,
}: any) => (
  <div
    className={`bg-white rounded-2xl p-5 shadow-sm border ${
      highlight ? "ring-1 ring-blue-500" : ""
    }`}
  >
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="text-blue-600">{icon}</div>
    </div>
    <p className="text-2xl font-bold mt-2">{value}</p>
  </div>
);

/* ---------------------------------- */
/* MAIN COMPONENT */
/* ---------------------------------- */
export default function PurchaseOverview() {
  const canView = usePermission("purchaseOverview", "view");
  const dispatch = useDispatch<AppDispatch>();

  const { loading, data, summary } = useSelector(
    (state: RootState) => state.purchaseDashboard
  );

  const [filterType, setFilterType] = useState<FilterType>("po");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ---------------------------------- */
  /* FETCH DATA */
  /* ---------------------------------- */
  useEffect(() => {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) return;

    dispatch(
      fetchPurchaseDashboard({
        type: filterType,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      })
    );
  }, [filterType, fromDate, toDate, dispatch]);

  if (!canView) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="w-14 h-14 text-red-500 mx-auto" />
        <h3 className="mt-3 font-semibold">Access Denied</h3>
      </div>
    );
  }

  const recentData = data.slice(0, 6);

  return (
    <div className="space-y-8">

      {/* ---------------------------------- */}
      {/* HERO HEADER */}
      {/* ---------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Purchase Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time procurement performance overview
          </p>
        </div>

        <div className="flex gap-3">
          <input
            type="date"
            className="border px-3 py-2 rounded-lg"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="date"
            className="border px-3 py-2 rounded-lg"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <select
            className="border px-3 py-2 rounded-lg"
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as FilterType)
            }
          >
            <option value="po">Purchase Orders</option>
            <option value="rfq">RFQs</option>
            <option value="vendor">Vendors</option>
            <option value="agreement">Agreements</option>
          </select>
        </div>
      </div>

      {/* ---------------------------------- */}
      {/* KPI CARDS */}
      {/* ---------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DashboardCard
          title="Total Records"
          value={summary.totalCount ?? 0}
          icon={<ShoppingCart />}
        />

        {summary.totalValue !== undefined && (
          <DashboardCard
            title="Total Value"
            value={`₹${summary.totalValue.toLocaleString()}`}
            icon={<DollarSign />}
            highlight
          />
        )}

        {summary.activeVendors !== undefined && (
          <DashboardCard
            title="Active Vendors"
            value={summary.activeVendors}
            icon={<Users />}
          />
        )}

        <DashboardCard
          title="System Status"
          value="Healthy"
          icon={<FileText />}
        />
      </div>

      {/* ---------------------------------- */}
      {/* TREND CHART */}
      {/* ---------------------------------- */}
      {filterType === "po" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="font-semibold mb-4">
            Purchase Value Trend
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data}>
              <XAxis
                dataKey="createdAt"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString()
                }
              />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="totalAmount"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ---------------------------------- */}
      {/* RECENT ACTIVITY TABLE */}
      {/* ---------------------------------- */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold">
            Recent {filterType.toUpperCase()}
          </h3>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Reference</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {!loading && recentData.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-gray-400"
                >
                  No recent records
                </td>
              </tr>
            )}

            {!loading &&
              recentData.map((row: any) => (
                <tr
                  key={row._id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3 font-medium">
                    {row.poNo ||
                      row.rfqNumber ||
                      row.vendorName ||
                      row.agreementNumber}
                  </td>
                  <td className="p-3">
                    <StatusBadge
                      status={
                        row.status ||
                        (row.isActive ? "active" : "inactive")
                      }
                    />
                  </td>
                  <td className="p-3 text-right">
                    {row.totalAmount
                      ? `₹${row.totalAmount.toLocaleString()}`
                      : row.totalValue
                      ? `₹${row.totalValue.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="p-3">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// import { usePermission } from "@/hooks/userPermission";
// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { RootState, AppDispatch } from "@/redux/store";
// import {
//   FilterType, fetchPurchaseDashboard
// } from "@/redux/slices/purchase/purchaseDashboardSlice";
// import {
//   ShoppingCart,
//   DollarSign,
//   FileText,
//   Users,
//   ShieldAlert,
// } from "lucide-react";

// interface PurchaseOrder {
//   _id: string;
//   poNo: string;
//   vendorId: string;
//   totalAmount: number;
//   createdAt: string;
// }

// interface RFQ {
//   _id: string;
//   rfqNumber: string;
//   createdAt: string;
// }

// interface Vendor {
//   _id: string;
//   vendorName: string;
//   isActive: boolean;
//   createdAt: string;
// }

// type FilterType = "po" | "rfq" | "vendor" | "agreement";
// export default function PurchaseOverview() {
//   const canView = usePermission("purchaseOverview", "view");
//   const dispatch = useDispatch<AppDispatch>();

//   const { loading, data, summary } = useSelector(
//     (state: RootState) => state.purchaseDashboard
//   );

//   const [filterType, setFilterType] = useState<FilterType>("po");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [vendorId, setVendorId] = useState("");

//   const StatusBadge = ({ status }: { status: string }) => {
//     const colors: Record<string, string> = {
//       open: "bg-blue-100 text-blue-700",
//       draft: "bg-gray-100 text-gray-600",
//       delivered: "bg-green-100 text-green-700",
//       closed: "bg-green-100 text-green-700",
//       active: "bg-green-100 text-green-700",
//       expired: "bg-red-100 text-red-700",
//       pending: "bg-yellow-100 text-yellow-700",
//       sent: "bg-purple-100 text-purple-700",
//     };

//     return (
//       <span
//         className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"
//           }`}
//       >
//         {status}
//       </span>
//     );
//   };

//   // 🔥 Fetch on filter change
//   useEffect(() => {
//     const organisationId = localStorage.getItem("organisationId");

//     if (!organisationId) {
//       console.warn("⛔ Organisation ID missing, skipping dashboard fetch");
//       return;
//     }

//     dispatch(
//       fetchPurchaseDashboard({
//         type: filterType,
//         fromDate: fromDate || undefined,
//         toDate: toDate || undefined,
//         vendorId: vendorId || undefined,
//       })
//     );
//   }, [filterType, fromDate, toDate, vendorId, dispatch]);


//   if (!canView) {
//     return (
//       <div className="text-center py-12">
//         <ShieldAlert className="w-14 h-14 text-red-500 mx-auto" />
//         <h3 className="mt-3 font-semibold">Access Denied</h3>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">

//       {/* HEADER */}
//       <div>
//         <h1 className="text-2xl font-bold">Purchase Overview</h1>
//         <p className="text-sm text-gray-500">
//           Date & type based procurement analytics
//         </p>
//       </div>

//       {/* FILTERS */}
//       <div className="bg-white p-4 rounded-lg shadow flex gap-4">
//         <select
//           className="border px-3 py-2 rounded"
//           value={filterType}
//           onChange={e => setFilterType(e.target.value as FilterType)}
//         >
//           <option value="po">Purchase Orders</option>
//           <option value="rfq">RFQs</option>
//           <option value="vendor">Vendors</option>
//           <option value="agreement">Agreements</option>
//         </select>

//         <input
//           type="date"
//           className="border px-3 py-2 rounded"
//           value={fromDate}
//           onChange={e => setFromDate(e.target.value)}
//         />

//         <input
//           type="date"
//           className="border px-3 py-2 rounded"
//           value={toDate}
//           onChange={e => setToDate(e.target.value)}
//         />
//       </div>

//       {/* STATS */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <StatCard
//           icon={<ShoppingCart />}
//           title="Total Count"
//           value={summary.totalCount ?? 0}
//         />
//         {summary.totalValue !== undefined && (
//           <StatCard
//             icon={<DollarSign />}
//             title="Total Value"
//             value={`₹${summary.totalValue.toLocaleString()}`}
//           />
//         )}
//         {summary.activeVendors !== undefined && (
//           <StatCard
//             icon={<Users />}
//             title="Active Vendors"
//             value={summary.activeVendors}
//           />
//         )}
//       </div>

//       {/* TABLE */}
//       <div className="bg-white rounded-lg shadow overflow-auto">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50">
//             <tr>
//               {filterType === "po" && (
//                 <>
//                   <th className="p-3 text-left">PO No</th>
//                   <th className="p-3 text-left">Vendor</th>
//                   <th className="p-3 text-left">Status</th>
//                   <th className="p-3 text-right">Amount</th>
//                   <th className="p-3 text-left">Date</th>
//                 </>
//               )}

//               {filterType === "rfq" && (
//                 <>
//                   <th className="p-3 text-left">RFQ No</th>
//                   <th className="p-3 text-left">Status</th>
//                   <th className="p-3 text-left">Date</th>
//                 </>
//               )}

//               {filterType === "vendor" && (
//                 <>
//                   <th className="p-3 text-left">Vendor Name</th>
//                   <th className="p-3 text-left">Status</th>
//                   <th className="p-3 text-left">Created</th>
//                 </>
//               )}

//               {filterType === "agreement" && (
//                 <>
//                   <th className="p-3 text-left">Agreement No</th>
//                   <th className="p-3 text-left">Vendor</th>
//                   <th className="p-3 text-left">Status</th>
//                   <th className="p-3 text-right">Total Value</th>
//                   <th className="p-3 text-left">Period</th>
//                 </>
//               )}
//             </tr>
//           </thead>

//           <tbody>
//             {!loading && data.length === 0 && (
//               <tr>
//                 <td colSpan={10} className="p-6 text-center text-gray-400">
//                   No records found
//                 </td>
//               </tr>
//             )}

//             {!loading &&
//               data.map((row: any) => (
//                 <tr key={row._id} className="border-t hover:bg-gray-50">

//                   {/* PURCHASE ORDERS */}
//                   {filterType === "po" && (
//                     <>
//                       <td className="p-3 font-medium">{row.poNo}</td>
//                       <td className="p-3">{row.vendor}</td>
//                       <td className="p-3">
//                         <StatusBadge status={row.status} />
//                       </td>
//                       <td className="p-3 text-right font-semibold">
//                         ₹{row.totalAmount?.toLocaleString()}
//                       </td>
//                       <td className="p-3">
//                         {new Date(row.createdAt).toLocaleDateString()}
//                       </td>
//                     </>
//                   )}

//                   {/* RFQs */}
//                   {filterType === "rfq" && (
//                     <>
//                       <td className="p-3 font-medium">{row.rfqNumber}</td>
//                       <td className="p-3">
//                         <StatusBadge status={row.status} />
//                       </td>
//                       <td className="p-3">
//                         {new Date(row.createdAt).toLocaleDateString()}
//                       </td>
//                     </>
//                   )}

//                   {/* VENDORS */}
//                   {filterType === "vendor" && (
//                     <>
//                       <td className="p-3 font-medium">{row.vendorName}</td>
//                       <td className="p-3">
//                         <StatusBadge status={row.isActive ? "active" : "inactive"} />
//                       </td>
//                       <td className="p-3">
//                         {new Date(row.createdAt).toLocaleDateString()}
//                       </td>
//                     </>
//                   )}

//                   {/* AGREEMENTS */}
//                   {filterType === "agreement" && (
//                     <>
//                       <td className="p-3 font-medium">{row.agreementNumber}</td>
//                       <td className="p-3">{row.vendor}</td>
//                       <td className="p-3">
//                         <StatusBadge status={row.status} />
//                       </td>
//                       <td className="p-3 text-right font-semibold">
//                         ₹{row.totalValue?.toLocaleString()}
//                       </td>
//                       <td className="p-3 text-sm text-gray-600">
//                         {new Date(row.startDate).toLocaleDateString()} →{" "}
//                         {new Date(row.endDate).toLocaleDateString()}
//                       </td>
//                     </>
//                   )}

//                 </tr>
//               ))}
//           </tbody>

//         </table>
//       </div>
//     </div>
//   );
// }

// /* SMALL CARD */
// const StatCard = ({
//   icon,
//   title,
//   value,
// }: {
//   icon: React.ReactNode;
//   title: string;
//   value: any;
// }) => (
//   <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
//     <div className="text-blue-500">{icon}</div>
//     <div>
//       <p className="text-xs text-gray-500">{title}</p>
//       <p className="text-xl font-semibold">{value}</p>
//     </div>
//   </div>
// );

// // export default PurchaseOverview;