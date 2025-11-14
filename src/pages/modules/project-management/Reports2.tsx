"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "../../../utils/localStorage";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
} from "recharts";
import { Calendar, BarChart3, Filter, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../../components/ui/dialog";
import { Select } from "../../../components/ui/select";

// -------------------------------
// ⚙️ Types
// -------------------------------
type Report = {
  id: string;
  name: string;
  project: string;
  client: string;
  manager: string;
  fromDate: string;
  toDate: string;
  createdAt: string;
};

const getReports = () => getFromStorage<Report[]>(STORAGE_KEYS.REPORTS_ANALYTICS) || [];
const saveReports = (list: Report[]) => saveToStorage(STORAGE_KEYS.REPORTS_ANALYTICS, list);

// -------------------------------
// 🎯 Component
// -------------------------------
export default function ReportsAnalytics() {
  const [reports, setReports] = useState<Report[]>([]);
  const [form, setForm] = useState<Partial<Report>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setReports(getReports());
  }, []);

  const persist = (list: Report[]) => {
    setReports(list);
    saveReports(list);
  };

  const handleSave = () => {
    if (!form.name || !form.project) return;
    const now = new Date().toISOString();
    const newReport: Report = {
      id: generateId(),
      name: form.name!,
      project: form.project!,
      client: form.client || "N/A",
      manager: form.manager || "N/A",
      fromDate: form.fromDate || "",
      toDate: form.toDate || "",
      createdAt: now,
    };
    persist([...reports, newReport]);
    setForm({});
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = reports.filter((r) => r.id !== id);
    persist(updated);
  };

  // Dummy data for charts
  const costData = [
    { name: "Jan", Budget: 120000, Actual: 115000 },
    { name: "Feb", Budget: 140000, Actual: 130000 },
    { name: "Mar", Budget: 150000, Actual: 145000 },
  ];

  const scheduleData = [
    { week: "W1", Planned: 20, Actual: 18 },
    { week: "W2", Planned: 40, Actual: 35 },
    { week: "W3", Planned: 60, Actual: 55 },
    { week: "W4", Planned: 80, Actual: 70 },
  ];

  const materialData = [
    { name: "Cement", Used: 450, Planned: 500 },
    { name: "Steel", Used: 800, Planned: 900 },
    { name: "Sand", Used: 300, Planned: 350 },
  ];

  const resourceData = [
    { name: "Labour", value: 40 },
    { name: "Machine", value: 25 },
    { name: "Admin", value: 20 },
    { name: "Contract", value: 15 },
  ];

  const profitabilityData = [
    { subject: "Cost", A: 120, fullMark: 150 },
    { subject: "Revenue", A: 130, fullMark: 150 },
    { subject: "Profit", A: 100, fullMark: 150 },
  ];

  const cashFlowData = [
    { month: "Jan", inflow: 100000, outflow: 80000 },
    { month: "Feb", inflow: 120000, outflow: 100000 },
    { month: "Mar", inflow: 140000, outflow: 110000 },
  ];

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Advanced insights and KPIs for project performance, profitability, and efficiency.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Report
          </Button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost vs Budget */}
        <Card className="h-[350px]">
          <CardHeader><CardTitle>Cost vs Budget</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Budget" fill="#8884d8" />
                <Bar dataKey="Actual" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time vs Schedule */}
        <Card className="h-[350px]">
          <CardHeader><CardTitle>Time vs Schedule</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scheduleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="Planned" stroke="#8884d8" />
                <Line dataKey="Actual" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Material Consumption */}
        <Card className="h-[350px]">
          <CardHeader><CardTitle>Material Consumption</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Used" fill="#ff7f50" />
                <Bar dataKey="Planned" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resource Utilisation */}
        <Card className="h-[350px]">
          <CardHeader><CardTitle>Resource Utilisation</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resourceData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {resourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profitability */}
        <Card className="h-[350px]">
          <CardHeader><CardTitle>Project Profitability</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={profitabilityData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis />
                <Radar name="Profit" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow Forecast */}
        <Card className="h-[350px]">
          <CardHeader><CardTitle>Cash Flow Forecast</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="inflow" fill="#82ca9d" stroke="#82ca9d" />
                <Line type="monotone" dataKey="outflow" stroke="#8884d8" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Saved Reports CRUD Table */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.project}</TableCell>
                  <TableCell>{r.client}</TableCell>
                  <TableCell>{r.manager}</TableCell>
                  <TableCell>
                    {r.fromDate || "—"} → {r.toDate || "—"}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Add Report */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild><span /></DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Report Filter</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div>
              <Label>Report Name</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Project</Label>
              <Input value={form.project || ""} onChange={(e) => setForm({ ...form, project: e.target.value })} />
            </div>
            <div>
              <Label>Client</Label>
              <Input value={form.client || ""} onChange={(e) => setForm({ ...form, client: e.target.value })} />
            </div>
            <div>
              <Label>Manager</Label>
              <Input value={form.manager || ""} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>From Date</Label>
                <Input type="date" value={form.fromDate || ""} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
              </div>
              <div>
                <Label>To Date</Label>
                <Input type="date" value={form.toDate || ""} onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/*
Notes:
- STORAGE_KEYS must include: REPORTS_ANALYTICS
- All data simulated here — replace dummy chart datasets with live project data later.
- Supports saving report filters (CRUD via localStorage)
- Uses Recharts for 7 chart types: Bar, Line, Pie, Radar, Composed, Area.
- Advanced UI using ShadCN components.
*/


// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../../components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
// import { FileText, Download, BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
// import {
//   getFromStorage,
//   STORAGE_KEYS,
// } from "../../utils/localStorage";
// import { Project, Budget, Resource, WBSItem, ProgressUpdate } from "../../types/production";
// import { KPICard } from "../../components/KPI-Card";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
//   PieChart,
//   Pie,
//   Cell,
//   LineChart,
//   Line,
// } from "recharts";

// const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

// export default function Reports() {
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [budgets, setBudgets] = useState<Budget[]>([]);
//   const [resources, setResources] = useState<Resource[]>([]);
//   const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
//   const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
//   const [selectedProject, setSelectedProject] = useState<string>("");

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = () => {
//     const projectsData = getFromStorage<Project>(STORAGE_KEYS.ITEMS);
//     const budgetsData = getFromStorage<Budget>("pm_budgets");
//     const resourcesData = getFromStorage<Resource>("pm_resources");
//     const wbsData = getFromStorage<WBSItem>("pm_wbs");
//     const progressData = getFromStorage<ProgressUpdate>("pm_progress");
    
//     setProjects(projectsData);
//     setBudgets(budgetsData);
//     setResources(resourcesData);
//     setWbsItems(wbsData);
//     setProgressUpdates(progressData);
    
//     if (projectsData.length > 0 && !selectedProject) {
//       setSelectedProject(projectsData[0].id);
//     }
//   };

//   const project = projects.find((p) => p.id === selectedProject);
//   const projectBudgets = budgets.filter((b) => b.projectId === selectedProject);
//   const projectResources = resources.filter((r) => r.projectId === selectedProject);
//   const projectTasks = wbsItems.filter((w) => w.projectId === selectedProject);
//   const projectProgress = progressUpdates.filter((p) => p.projectId === selectedProject);

//   // Cost Analysis
//   const totalPlannedCost = projectBudgets.reduce((sum, b) => sum + b.plannedAmount, 0);
//   const totalActualCost = projectBudgets.reduce((sum, b) => sum + b.actualAmount, 0);
//   const costVariance = totalActualCost - totalPlannedCost;
//   const costVariancePercent = totalPlannedCost > 0 ? (costVariance / totalPlannedCost) * 100 : 0;

//   // Resource Utilization
//   const labourCost = projectResources.filter((r) => r.type === "labour").reduce((sum, r) => sum + r.totalCost, 0);
//   const equipmentCost = projectResources.filter((r) => r.type === "equipment").reduce((sum, r) => sum + r.totalCost, 0);
//   const materialCost = projectResources.filter((r) => r.type === "material").reduce((sum, r) => sum + r.totalCost, 0);

//   // Progress Metrics
//   const avgProgress = projectTasks.length > 0
//     ? projectTasks.reduce((sum, task) => sum + task.progress, 0) / projectTasks.length
//     : 0;
  
//   const completedTasks = projectTasks.filter((t) => t.status === "completed").length;
//   const totalTasks = projectTasks.length;

//   // Charts Data
//   const budgetByCategory = projectBudgets.reduce((acc, b) => {
//     acc[b.category] = (acc[b.category] || 0) + b.actualAmount;
//     return acc;
//   }, {} as Record<string, number>);

//   const budgetCategoryData = Object.entries(budgetByCategory).map(([name, value]) => ({
//     name,
//     value,
//   }));

//   const resourceDistribution = [
//     { name: "Labour", value: labourCost },
//     { name: "Equipment", value: equipmentCost },
//     { name: "Material", value: materialCost },
//   ];

//   const taskStatusData = [
//     { name: "Not Started", value: projectTasks.filter((t) => t.status === "not-started").length },
//     { name: "In Progress", value: projectTasks.filter((t) => t.status === "in-progress").length },
//     { name: "Completed", value: projectTasks.filter((t) => t.status === "completed").length },
//     { name: "Delayed", value: projectTasks.filter((t) => t.status === "delayed").length },
//   ];

//   const progressTrend = projectProgress
//     .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
//     .map((p) => ({
//       date: new Date(p.date).toLocaleDateString(),
//       progress: p.percentComplete,
//     }));

//   const handleDownloadReport = () => {
//     const reportData = {
//       project: project?.name,
//       generatedDate: new Date().toISOString(),
//       summary: {
//         totalBudget: project?.budget,
//         actualCost: totalActualCost,
//         variance: costVariance,
//         progress: avgProgress,
//         completedTasks,
//         totalTasks,
//       },
//       budgets: projectBudgets,
//       resources: projectResources,
//       tasks: projectTasks,
//     };

//     const blob = new Blob([JSON.stringify(reportData, null, 2)], {
//       type: "application/json",
//     });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `project-report-${project?.code}-${new Date().toISOString().split("T")[0]}.json`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
//           <p className="text-muted-foreground mt-1">Comprehensive project performance analysis</p>
//         </div>
//         <div className="flex gap-2">
//           <Select value={selectedProject} onValueChange={setSelectedProject}>
//             <SelectTrigger className="w-64">
//               <SelectValue placeholder="Select Project" />
//             </SelectTrigger>
//             <SelectContent>
//               {projects.map((project) => (
//                 <SelectItem key={project.id} value={project.id}>
//                   {project.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//           <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
//             <Download className="h-4 w-4" />
//             Download Report
//           </Button>
//         </div>
//       </div>

//       {!selectedProject ? (
//         <Card>
//           <CardContent className="py-16 text-center text-muted-foreground">
//             Please select a project to view reports
//           </CardContent>
//         </Card>
//       ) : (
//         <>
//           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//             <KPICard
//               title="Budget Variance"
//               value={`$${(costVariance / 1000).toFixed(1)}K`}
//               change={Math.abs(costVariancePercent)}
//               trend={costVariance > 0 ? "up" : "down"}
//               type={costVariance > 0 ? "danger" : "success"}
//               icon={TrendingUp}
//             />
//             <KPICard
//               title="Avg Progress"
//               value={`${avgProgress.toFixed(1)}%`}
//               type="info"
//               icon={BarChart3}
//             />
//             <KPICard
//               title="Completed Tasks"
//               value={`${completedTasks}/${totalTasks}`}
//               type="success"
//               icon={FileText}
//             />
//             <KPICard
//               title="Total Resource Cost"
//               value={`$${((labourCost + equipmentCost + materialCost) / 1000).toFixed(1)}K`}
//               type="info"
//               icon={PieChartIcon}
//             />
//           </div>

//           <Tabs defaultValue="financial" className="space-y-4">
//             <TabsList className="grid w-full grid-cols-4">
//               <TabsTrigger value="financial">Financial</TabsTrigger>
//               <TabsTrigger value="resources">Resources</TabsTrigger>
//               <TabsTrigger value="tasks">Tasks</TabsTrigger>
//               <TabsTrigger value="progress">Progress</TabsTrigger>
//             </TabsList>

//             <TabsContent value="financial" className="space-y-4">
//               <div className="grid gap-4 md:grid-cols-2">
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Cost by Category</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <ResponsiveContainer width="100%" height={300}>
//                       <PieChart>
//                         <Pie
//                           data={budgetCategoryData}
//                           cx="50%"
//                           cy="50%"
//                           labelLine={false}
//                           label={({ name, value }) => `${name}: $${(value / 1000).toFixed(1)}K`}
//                           outerRadius={80}
//                           fill="#8884d8"
//                           dataKey="value"
//                         >
//                           {budgetCategoryData.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                           ))}
//                         </Pie>
//                         <Tooltip />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Budget vs Actual</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <ResponsiveContainer width="100%" height={300}>
//                       <BarChart
//                         data={projectBudgets.map((b) => ({
//                           category: b.category,
//                           planned: b.plannedAmount,
//                           actual: b.actualAmount,
//                         }))}
//                       >
//                         <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
//                         <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
//                         <YAxis stroke="hsl(var(--muted-foreground))" />
//                         <Tooltip
//                           contentStyle={{
//                             backgroundColor: "hsl(var(--card))",
//                             border: "1px solid hsl(var(--border))",
//                             borderRadius: "var(--radius)",
//                           }}
//                         />
//                         <Legend />
//                         <Bar dataKey="planned" fill="hsl(var(--chart-1))" name="Planned" />
//                         <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Actual" />
//                       </BarChart>
//                     </ResponsiveContainer>
//                   </CardContent>
//                 </Card>
//               </div>
//             </TabsContent>

//             <TabsContent value="resources">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Resource Cost Distribution</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={400}>
//                     <PieChart>
//                       <Pie
//                         data={resourceDistribution}
//                         cx="50%"
//                         cy="50%"
//                         labelLine={false}
//                         label={({ name, value }) => `${name}: $${(value / 1000).toFixed(1)}K`}
//                         outerRadius={120}
//                         fill="#8884d8"
//                         dataKey="value"
//                       >
//                         {resourceDistribution.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                         ))}
//                       </Pie>
//                       <Tooltip />
//                       <Legend />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="tasks">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Task Status Distribution</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={400}>
//                     <BarChart data={taskStatusData}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
//                       <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
//                       <YAxis stroke="hsl(var(--muted-foreground))" />
//                       <Tooltip
//                         contentStyle={{
//                           backgroundColor: "hsl(var(--card))",
//                           border: "1px solid hsl(var(--border))",
//                           borderRadius: "var(--radius)",
//                         }}
//                       />
//                       <Bar dataKey="value" fill="hsl(var(--chart-1))" />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="progress">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Progress Over Time</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={400}>
//                     <LineChart data={progressTrend}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
//                       <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
//                       <YAxis stroke="hsl(var(--muted-foreground))" />
//                       <Tooltip
//                         contentStyle={{
//                           backgroundColor: "hsl(var(--card))",
//                           border: "1px solid hsl(var(--border))",
//                           borderRadius: "var(--radius)",
//                         }}
//                       />
//                       <Legend />
//                       <Line
//                         type="monotone"
//                         dataKey="progress"
//                         stroke="hsl(var(--chart-1))"
//                         strokeWidth={2}
//                         name="Progress %"
//                       />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>
//             </TabsContent>
//           </Tabs>
//         </>
//       )}
//     </div>
//   );
// }
