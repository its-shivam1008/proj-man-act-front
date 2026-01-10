import { TrendingUp, Calendar, FileText } from "lucide-react";
import { useState } from "react";

const ReportsTab = ({
  ecosByStage = {},
  ecosByType = {},
  ecosByPriority = {},
}: any) => {
  const [dateRange, setDateRange] = useState("last30days");
  const [reportType, setReportType] = useState("eco-summary");

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Reports & Analytics
        </h2>

        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="eco-summary">ECO Summary</option>
            <option value="cost-impact">Cost Impact</option>
            <option value="approval-time">Approval Time</option>
          </select>
        </div>
      </div>

      {/* STAGE + TYPE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ECOs by Stage */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold mb-4">ECOs by Stage</h3>
          <StatList
            items={[
              { label: "New", value: ecosByStage.new },
              { label: "Under Review", value: ecosByStage["under-review"] },
              { label: "Approved", value: ecosByStage.approved },
              { label: "Applied", value: ecosByStage.applied },
              { label: "Cancelled", value: ecosByStage.cancelled },
            ]}
          />
        </div>

        {/* ECOs by Type */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold mb-4">ECOs by Type</h3>
          <StatList
            items={[
              { label: "BoM", value: ecosByType.bom },
              { label: "Document", value: ecosByType.document },
              { label: "Product Variant", value: ecosByType["product-variant"] },
              { label: "Routing", value: ecosByType.routing },
            ]}
          />
        </div>
      </div>

      {/* PRIORITY */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-sm font-semibold mb-6">ECOs by Priority</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <PriorityCard label="Low" value={ecosByPriority.low} color="green" />
          <PriorityCard label="Medium" value={ecosByPriority.medium} color="yellow" />
          <PriorityCard label="High" value={ecosByPriority.high} color="orange" />
          <PriorityCard label="Critical" value={ecosByPriority.critical} color="red" />
        </div>
      </div>

      {/* PLACEHOLDER FOR ADVANCED REPORT */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-dashed">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Advanced Reports</h3>
        </div>
        <p className="text-sm text-gray-600">
          Charts, export (PDF / Excel), approval timelines, and cost analytics
          will appear here.
        </p>
      </div>

    </div>
  );
};

/* ---------------- SUB COMPONENTS ---------------- */

const StatList = ({ items }: any) => (
  <div className="space-y-3">
    {items.map((item: any) => (
      <div
        key={item.label}
        className="flex justify-between text-sm text-gray-700"
      >
        <span>{item.label}</span>
        <span className="font-medium">{item.value || 0}</span>
      </div>
    ))}
  </div>
);

const PriorityCard = ({ label, value, color }: any) => {
  const colors: any = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col items-center">
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[color]}`}
      >
        {label}
      </span>
      <span className="mt-2 text-xl font-semibold">{value || 0}</span>
    </div>
  );
};

export default ReportsTab;
