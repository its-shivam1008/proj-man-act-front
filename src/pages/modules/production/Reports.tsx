import { usePermission } from "@/hooks/userPermission";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import {
  WorkOrder,
  QualityCheck,
  WorkCenter,
  MaterialIssue,
} from "../../../types/production";
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertCircle,
  Gauge,
  Layers,
  ShieldAlert,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Separator } from "../../../components/ui/separator";
import { Progress } from "../../../components/ui/progress";

export default function ReportsPage() {
  const canView = usePermission("productionReports", "view");
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
  const [reportData, setReportData] = useState({
    totalOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    totalProduction: 0,
    totalRejected: 0,
    qcPassRate: 0,
    workCenterUtilization: 0,
    materialIssued: 0,
  });

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = () => {
    const workOrders: WorkOrder[] = storage.get(STORAGE_KEYS.WORK_ORDERS, []);
    const qualityChecks: QualityCheck[] = storage.get(
      STORAGE_KEYS.QUALITY_CHECKS,
      []
    );
    const workCenters: WorkCenter[] = storage.get(
      STORAGE_KEYS.WORK_CENTERS,
      []
    );
    const materialIssues: MaterialIssue[] = storage.get(
      STORAGE_KEYS.MATERIAL_ISSUES,
      []
    );

    const totalOrders = workOrders.length;
    const completedOrders = workOrders.filter(
      (wo) => wo.status === "completed"
    ).length;
    const inProgressOrders = workOrders.filter(
      (wo) => wo.status === "in-progress"
    ).length;
    const totalProduction = workOrders.reduce(
      (sum, wo) => sum + (wo.producedQuantity || 0),
      0
    );
    const totalRejected = workOrders.reduce(
      (sum, wo) => sum + (wo.rejectedQuantity || 0),
      0
    );

    const passedQC = qualityChecks.filter((qc) => qc.result === "pass").length;
    const totalQC = qualityChecks.length;
    const qcPassRate =
      totalQC > 0 ? Math.round((passedQC / totalQC) * 100) : 0;

    const activeWorkCenters = workCenters.filter(
      (wc) => wc.status === "active"
    ).length;
    const totalWorkCenters = workCenters.length;
    const workCenterUtilization =
      totalWorkCenters > 0
        ? Math.round((activeWorkCenters / totalWorkCenters) * 100)
        : 0;

    const materialIssued = materialIssues.length;

    setReportData({
      totalOrders,
      completedOrders,
      inProgressOrders,
      totalProduction,
      totalRejected,
      qcPassRate,
      workCenterUtilization,
      materialIssued,
    });
  };

  const COLORS = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Prepare chart data
  const productionStats = [
    {
      name: "Produced",
      value: reportData.totalProduction,
    },
    {
      name: "Rejected",
      value: reportData.totalRejected,
    },
  ];

  const orderStatusData = [
    { name: "Completed", value: reportData.completedOrders },
    { name: "In Progress", value: reportData.inProgressOrders },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Production Analytics</h1>
        <p className="text-muted-foreground">
          Visual insights into manufacturing efficiency and performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Orders"
          value={reportData.totalOrders}
          icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
          subtitle={`${reportData.completedOrders} completed, ${reportData.inProgressOrders} in progress`}
        />
        <KpiCard
          title="Total Production"
          value={reportData.totalProduction}
          icon={<Package className="w-5 h-5 text-green-600" />}
          subtitle="Units produced"
        />
        <KpiCard
          title="Quality Pass Rate"
          value={`${reportData.qcPassRate}%`}
          icon={<TrendingUp className="w-5 h-5 text-yellow-600" />}
          subtitle="Quality control performance"
        />
        <KpiCard
          title="Rejected Units"
          value={reportData.totalRejected}
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          subtitle={`${(
            (reportData.totalRejected / (reportData.totalProduction || 1)) *
            100
          ).toFixed(1)}% rejection rate`}
        />
      </div>

      <Separator />

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Production Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={productionStats} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="url(#gradient)"
                  radius={[10, 10, 0, 0]}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {orderStatusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Work Center & Material Reports */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Work Center Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Utilization Rate
              </span>
              <span className="text-sm font-semibold">
                {reportData.workCenterUtilization}%
              </span>
            </div>
            <Progress value={reportData.workCenterUtilization} />
            <p className="text-xs text-muted-foreground mt-2">
              Active vs Total work centers
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Material Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Material Issues</p>
                <p className="text-2xl font-bold">
                  {reportData.materialIssued}
                </p>
              </div>
              <Layers className="w-10 h-10 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Production Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <SummaryCard
              title="Completion Rate"
              value={
                reportData.totalOrders > 0
                  ? Math.round(
                    (reportData.completedOrders / reportData.totalOrders) * 100
                  )
                  : 0
              }
              suffix="%"
              color="text-indigo-600"
            />
            <SummaryCard
              title="Average Efficiency"
              value={
                reportData.totalProduction > 0
                  ? Math.round(
                    ((reportData.totalProduction -
                      reportData.totalRejected) /
                      reportData.totalProduction) *
                    100
                  )
                  : 0
              }
              suffix="%"
              color="text-green-600"
            />
            <SummaryCard
              title="Active Operations"
              value={reportData.inProgressOrders}
              color="text-yellow-600"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- KPI CARD ---
const KpiCard = ({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) => (
  <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-indigo-500">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </CardContent>
  </Card>
);

// --- Summary Card ---
const SummaryCard = ({
  title,
  value,
  suffix,
  color,
}: {
  title: string;
  value: number;
  suffix?: string;
  color?: string;
}) => (
  <div className="p-4 bg-gradient-card rounded-lg text-center">
    <p className="text-sm text-muted-foreground mb-2">{title}</p>
    <p className={`text-3xl font-bold ${color}`}>
      {value}
      {suffix || ""}
    </p>
  </div>
);
