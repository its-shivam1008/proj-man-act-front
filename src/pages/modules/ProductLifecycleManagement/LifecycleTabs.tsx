import { BarChart3, FileText, Users, TrendingUp, FileImage } from "lucide-react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "ecos", label: "ECOs", icon: FileText },
  { id: "documents", label: "Documents", icon: FileImage },
  { id: "teams", label: "Teams", icon: Users },
  { id: "reports", label: "Reports", icon: TrendingUp },
];

const LifecycleTabs = ({ activeTab, setActiveTab }: Props) => {
  return (
    <div className="flex gap-2 border-b">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition
            ${activeTab === id
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"}
          `}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
};

export default LifecycleTabs;
