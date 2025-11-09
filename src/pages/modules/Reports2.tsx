import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FileText, Download, BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import {
  getFromStorage,
  STORAGE_KEYS,
} from "../../utils/localStorage";
import { Project, Budget, Resource, WBSItem, ProgressUpdate } from "../../types/production";
import { KPICard } from "../../components/KPI-Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Reports() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const projectsData = getFromStorage<Project>(STORAGE_KEYS.ITEMS);
    const budgetsData = getFromStorage<Budget>("pm_budgets");
    const resourcesData = getFromStorage<Resource>("pm_resources");
    const wbsData = getFromStorage<WBSItem>("pm_wbs");
    const progressData = getFromStorage<ProgressUpdate>("pm_progress");
    
    setProjects(projectsData);
    setBudgets(budgetsData);
    setResources(resourcesData);
    setWbsItems(wbsData);
    setProgressUpdates(progressData);
    
    if (projectsData.length > 0 && !selectedProject) {
      setSelectedProject(projectsData[0].id);
    }
  };

  const project = projects.find((p) => p.id === selectedProject);
  const projectBudgets = budgets.filter((b) => b.projectId === selectedProject);
  const projectResources = resources.filter((r) => r.projectId === selectedProject);
  const projectTasks = wbsItems.filter((w) => w.projectId === selectedProject);
  const projectProgress = progressUpdates.filter((p) => p.projectId === selectedProject);

  // Cost Analysis
  const totalPlannedCost = projectBudgets.reduce((sum, b) => sum + b.plannedAmount, 0);
  const totalActualCost = projectBudgets.reduce((sum, b) => sum + b.actualAmount, 0);
  const costVariance = totalActualCost - totalPlannedCost;
  const costVariancePercent = totalPlannedCost > 0 ? (costVariance / totalPlannedCost) * 100 : 0;

  // Resource Utilization
  const labourCost = projectResources.filter((r) => r.type === "labour").reduce((sum, r) => sum + r.totalCost, 0);
  const equipmentCost = projectResources.filter((r) => r.type === "equipment").reduce((sum, r) => sum + r.totalCost, 0);
  const materialCost = projectResources.filter((r) => r.type === "material").reduce((sum, r) => sum + r.totalCost, 0);

  // Progress Metrics
  const avgProgress = projectTasks.length > 0
    ? projectTasks.reduce((sum, task) => sum + task.progress, 0) / projectTasks.length
    : 0;
  
  const completedTasks = projectTasks.filter((t) => t.status === "completed").length;
  const totalTasks = projectTasks.length;

  // Charts Data
  const budgetByCategory = projectBudgets.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + b.actualAmount;
    return acc;
  }, {} as Record<string, number>);

  const budgetCategoryData = Object.entries(budgetByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const resourceDistribution = [
    { name: "Labour", value: labourCost },
    { name: "Equipment", value: equipmentCost },
    { name: "Material", value: materialCost },
  ];

  const taskStatusData = [
    { name: "Not Started", value: projectTasks.filter((t) => t.status === "not-started").length },
    { name: "In Progress", value: projectTasks.filter((t) => t.status === "in-progress").length },
    { name: "Completed", value: projectTasks.filter((t) => t.status === "completed").length },
    { name: "Delayed", value: projectTasks.filter((t) => t.status === "delayed").length },
  ];

  const progressTrend = projectProgress
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => ({
      date: new Date(p.date).toLocaleDateString(),
      progress: p.percentComplete,
    }));

  const handleDownloadReport = () => {
    const reportData = {
      project: project?.name,
      generatedDate: new Date().toISOString(),
      summary: {
        totalBudget: project?.budget,
        actualCost: totalActualCost,
        variance: costVariance,
        progress: avgProgress,
        completedTasks,
        totalTasks,
      },
      budgets: projectBudgets,
      resources: projectResources,
      tasks: projectTasks,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-report-${project?.code}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive project performance analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      {!selectedProject ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Please select a project to view reports
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Budget Variance"
              value={`$${(costVariance / 1000).toFixed(1)}K`}
              change={Math.abs(costVariancePercent)}
              trend={costVariance > 0 ? "up" : "down"}
              type={costVariance > 0 ? "danger" : "success"}
              icon={TrendingUp}
            />
            <KPICard
              title="Avg Progress"
              value={`${avgProgress.toFixed(1)}%`}
              type="info"
              icon={BarChart3}
            />
            <KPICard
              title="Completed Tasks"
              value={`${completedTasks}/${totalTasks}`}
              type="success"
              icon={FileText}
            />
            <KPICard
              title="Total Resource Cost"
              value={`$${((labourCost + equipmentCost + materialCost) / 1000).toFixed(1)}K`}
              type="info"
              icon={PieChartIcon}
            />
          </div>

          <Tabs defaultValue="financial" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={budgetCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: $${(value / 1000).toFixed(1)}K`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {budgetCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Budget vs Actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={projectBudgets.map((b) => ({
                          category: b.category,
                          planned: b.plannedAmount,
                          actual: b.actualAmount,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="planned" fill="hsl(var(--chart-1))" name="Planned" />
                        <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Actual" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="resources">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Cost Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={resourceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${(value / 1000).toFixed(1)}K`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {resourceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={taskStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress">
              <Card>
                <CardHeader>
                  <CardTitle>Progress Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={progressTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        name="Progress %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
