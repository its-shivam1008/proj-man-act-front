import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Layers,
  TrendingUp,
} from "lucide-react";

/* ================= TYPES ================= */

interface Eco {
  id: string;
  ecoNumber: string;
  product: string;
  description: string;
  stage: string;
  priority: string;
}

/* ================= MAIN TAB ================= */

const OverviewTab = ({ ecos = [] }: { ecos: Eco[] }) => {
  const count = (stage: string) =>
    ecos.filter((e) => e.stage === stage).length;

  const recentEcos = [...ecos].slice(0, 5);

  const priorityCount = (p: string) =>
    ecos.filter((e) => e.priority === p).length;

  return (
    <div className="space-y-8">

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total ECOs"
          value={ecos.length}
          icon={FileText}
          trend="+8%"
        />
        <StatCard
          title="Under Review"
          value={count("under-review")}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Approved"
          value={count("approved")}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Applied"
          value={count("applied")}
          icon={Layers}
          color="purple"
        />
        <StatCard
          title="Cancelled"
          value={count("cancelled")}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold">Recent ECO Activity</h3>
          </div>

          <div className="divide-y">
            {recentEcos.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">
                No recent ECO activity
              </p>
            ) : (
              recentEcos.map((eco) => (
                <div
                  key={eco.id}
                  className="px-6 py-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {eco.ecoNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {eco.product} • {eco.description.slice(0, 40)}…
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <StageBadge stage={eco.stage} />
                    <PriorityBadge priority={eco.priority} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PRIORITY SUMMARY */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-4">ECOs by Priority</h3>

          <div className="space-y-4">
            <ProgressRow
              label="Low"
              value={priorityCount("low")}
              color="green"
            />
            <ProgressRow
              label="Medium"
              value={priorityCount("medium")}
              color="yellow"
            />
            <ProgressRow
              label="High"
              value={priorityCount("high")}
              color="orange"
            />
            <ProgressRow
              label="Critical"
              value={priorityCount("critical")}
              color="red"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= KPI CARD ================= */

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "blue",
  trend,
}: any) => {
  const colors: any = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    yellow: "text-yellow-600 bg-yellow-100",
    purple: "text-purple-600 bg-purple-100",
    red: "text-red-600 bg-red-100",
  };

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>

        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {trend} from last period
        </p>
      )}
    </div>
  );
};

/* ================= BADGES ================= */

const StageBadge = ({ stage }: { stage: string }) => {
  const map: any = {
    new: "bg-blue-100 text-blue-700",
    "under-review": "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    applied: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${map[stage]}`}>
      {stage.replace("-", " ")}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const map: any = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${map[priority]}`}>
      {priority}
    </span>
  );
};

/* ================= PROGRESS ROW ================= */

const ProgressRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => {
  const colors: any = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]}`}
          style={{ width: `${Math.min(value * 10, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default OverviewTab;
