import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchRFQs } from "@/redux/slices/purchase/rfqSlice";
import ReportShell from "./ReportShell";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { FileText, Send, CheckCircle, XCircle, Eye } from "lucide-react";

/* ---------------- DATE FORMATTER ---------------- */
const formatDate = (date?: string | Date) => {
  if (!date) return "-";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};

/* ---------------- STATUS BADGE ---------------- */
const StatusBadge = ({ status }: { status: string }) => {
  const map: any = {
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    received: "bg-yellow-100 text-yellow-700",
    done: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        map[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};

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

export default function RFQReport() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    rfqs,
    loading: rfqLoading,
    meta,
    error,
  } = useSelector((state: RootState) => state.rfqs);

  /* ---------------- LOCAL FILTER STATE ---------------- */
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string | undefined>();

  /* ---------------- FETCH RFQS ---------------- */
  useEffect(() => {
    dispatch(fetchRFQs({ page, limit, q: search, location: locationFilter }));
  }, [dispatch, page, limit, search, locationFilter]);

  /* ---------------- KPIs ---------------- */
  const totalRFQs = meta?.total ?? rfqs.length;
  const sentRFQs = rfqs.filter(r => r.status === "sent").length;
  const completedRFQs = rfqs.filter(r => r.status === "done").length;
  const cancelledRFQs = rfqs.filter(r => r.status === "cancelled").length;

  /* ---------------- PIE DATA ---------------- */
  const statusData = Object.values(
    rfqs.reduce((acc: any, r: any) => {
      acc[r.status] = acc[r.status] || { name: r.status, value: 0 };
      acc[r.status].value += 1;
      return acc;
    }, {})
  );

  /* ---------------- MONTHLY DATA ---------------- */
  const monthlyData = Object.values(
    rfqs.reduce((acc: any, r: any) => {
      const month = formatDate(r.createdAt).slice(3);
      acc[month] = acc[month] || { month, count: 0 };
      acc[month].count += 1;
      return acc;
    }, {})
  );

  return (
    <ReportShell
      title="RFQ Report"
      subtitle="Accurate RFQ lifecycle & analytics (Redux powered)"
    >
      {/* ---------------- KPIs ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI title="Total RFQs" value={totalRFQs} icon={<FileText />} />
        <KPI title="Sent" value={sentRFQs} icon={<Send />} />
        <KPI title="Completed" value={completedRFQs} icon={<CheckCircle />} />
        <KPI title="Cancelled" value={cancelledRFQs} icon={<XCircle />} />
      </div>

      {/* ---------------- CHARTS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STATUS PIE */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <h3 className="font-semibold mb-4">RFQ Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={110} label>
                {statusData.map((_: any, i: number) => (
                  <Cell
                    key={i}
                    fill={["#94a3b8", "#2563eb", "#facc15", "#22c55e", "#ef4444"][i % 5]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* MONTHLY BAR */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <h3 className="font-semibold mb-4">RFQs per Month</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---------------- TABLE ---------------- */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">RFQ List</h3>
          <span className="text-sm text-gray-500">
            Page {page} of {meta?.totalPages ?? 1}
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">RFQ No</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Delivery</th>
              <th className="p-3 text-left">Created</th>
              {/* <th className="p-3 text-center">Action</th> */}
            </tr>
          </thead>

          <tbody>
            {rfqLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  Loading RFQs...
                </td>
              </tr>
            )}

            {!rfqLoading && rfqs.map((rfq: any) => (
              <tr key={rfq.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{rfq.rfqNumber}</td>
                <td className="p-3">
                  <StatusBadge status={rfq.status} />
                </td>
                <td className="p-3">{formatDate(rfq.deliveryDate)}</td>
                <td className="p-3">{formatDate(rfq.createdAt || rfq.orderDate)}</td>
                {/* <td className="p-3 text-center">
                  <button
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportShell>
  );
}
