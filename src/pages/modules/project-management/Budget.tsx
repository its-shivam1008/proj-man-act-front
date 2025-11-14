"use client";

import { useEffect, useMemo, useState } from "react";

/* shadcn/ui */
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";

/* Icons */
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  BadgeAlert,
  ShieldCheck,
} from "lucide-react";

/* Charts (Recharts) */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

/* Types + localStorage utils */
import { Budget, Project } from "../../../types/production";
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "../../../utils/localStorage";
import { useToast } from "../../../hooks/use-toast";

/** Extend your existing Budget type locally with optional approval status (non-breaking). */
type BudgetWithApproval = Budget & {
  approvalStatus?: "pending" | "approved" | "rejected";
};

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetWithApproval[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithApproval | null>(null);
  const [formData, setFormData] = useState<Partial<BudgetWithApproval>>({});

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load budgets & projects
    const budgetsData = getFromStorage<BudgetWithApproval>(STORAGE_KEYS.BUDGETS).map((b: any) => ({
      approvalStatus: "approvalStatus" in b ? b.approvalStatus : "pending",
      ...b,
    }));
    const projectsData = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);

    setBudgets(budgetsData);
    setProjects(projectsData);

    // Auto-select the first project if none selected
    if (!selectedProjectId && projectsData.length > 0) {
      setSelectedProjectId(projectsData[0].id);
    }
  };

  /** ---- CRUD ---- */
  const handleSave = () => {
    if (!formData.projectId || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Project & Category).",
        variant: "destructive",
      });
      return;
    }

    const planned = Number(formData.plannedAmount || 0);
    const actual = Number(formData.actualAmount || 0);
    const variance = actual - planned;
    const variancePercent = planned ? (variance / planned) * 100 : 0;
    const status: Budget["status"] =
      variancePercent > 15 ? "critical" : variancePercent > 0 ? "over-budget" : "within-budget";

    let updatedBudgets: BudgetWithApproval[];
    const now = new Date().toISOString();

    if (editingBudget) {
      updatedBudgets = budgets.map((b) =>
        b.id === editingBudget.id
          ? {
              ...editingBudget,
              ...formData,
              variance,
              variancePercent,
              status,
              updatedAt: now,
            } as BudgetWithApproval
          : b
      );
      toast({ title: "Success", description: "Budget updated successfully." });
    } else {
      const newBudget: BudgetWithApproval = {
        ...(formData as BudgetWithApproval),
        id: generateId(),
        variance,
        variancePercent,
        status,
        approvalStatus: "pending",
        createdAt: now,
        updatedAt: now,
      };
      updatedBudgets = [...budgets, newBudget];
      toast({ title: "Success", description: "Budget created successfully." });
    }

    saveToStorage(STORAGE_KEYS.BUDGETS, updatedBudgets);
    setBudgets(updatedBudgets);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updatedBudgets = budgets.filter((b) => b.id !== id);
    saveToStorage(STORAGE_KEYS.BUDGETS, updatedBudgets);
    setBudgets(updatedBudgets);
    toast({ title: "Deleted", description: "Budget deleted successfully." });
  };

  const openEditDialog = (budget: BudgetWithApproval) => {
    setEditingBudget(budget);
    setFormData(budget);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData({
      projectId: selectedProjectId || projects[0]?.id,
      category: "material",
      plannedAmount: 0,
      actualAmount: 0,
      approvalStatus: "pending",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBudget(null);
    setFormData({});
  };

  const approveBudget = (id: string) => {
    const updated = budgets.map((b) =>
      b.id === id ? { ...b, approvalStatus: "approved" as const } : b
    );
    saveToStorage(STORAGE_KEYS.BUDGETS, updated);
    setBudgets(updated);
    toast({
      title: "Approved",
      description: "Budget marked as approved.",
    });
  };

  const approveAllPendingForProject = () => {
    if (!selectedProjectId) return;
    const updated = budgets.map((b) =>
      b.projectId === selectedProjectId && b.approvalStatus !== "approved"
        ? { ...b, approvalStatus: "approved" as const }
        : b
    );
    saveToStorage(STORAGE_KEYS.BUDGETS, updated);
    setBudgets(updated);
    toast({
      title: "Approved",
      description: "All pending budgets for this project have been approved.",
    });
  };

  /** ---- Helpers ---- */
  const getStatusColor = (status: Budget["status"]) => {
    const colors: Record<Budget["status"], string> = {
      "within-budget": "bg-success/10 text-success border-success/20",
      "over-budget": "bg-warning/10 text-warning border-warning/20",
      critical: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return colors[status];
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown";
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const projectBudgets = useMemo(
    () => budgets.filter((b) => b.projectId === selectedProjectId),
    [budgets, selectedProjectId]
  );

  /** ---- Summary Totals ---- */
  const totalsByCategory = useMemo(() => {
    const seed = {
      material: { planned: 0, actual: 0 },
      labour: { planned: 0, actual: 0 },
      overhead: { planned: 0, actual: 0 },
      equipment: { planned: 0, actual: 0 },
      other: { planned: 0, actual: 0 },
    } as Record<Budget["category"], { planned: number; actual: number }>;

    for (const b of projectBudgets) {
      const c = b.category as Budget["category"];
      // ensure known category key
      if (!seed[c]) continue;
      seed[c].planned += Number(b.plannedAmount || 0);
      seed[c].actual += Number(b.actualAmount || 0);
    }
    return seed;
  }, [projectBudgets]);

  const grandPlanned = useMemo(
    () => projectBudgets.reduce((s, b) => s + Number(b.plannedAmount || 0), 0),
    [projectBudgets]
  );
  const grandActual = useMemo(
    () => projectBudgets.reduce((s, b) => s + Number(b.actualAmount || 0), 0),
    [projectBudgets]
  );

  /** ---- Alerts ---- */
  const has10pctOverrun = useMemo(() => {
    return projectBudgets.some((b) => (b.variancePercent || 0) > 10);
  }, [projectBudgets]);

  const hasPendingApproval = useMemo(() => {
    return projectBudgets.some((b) => (b.approvalStatus || "pending") === "pending");
  }, [projectBudgets]);

  /** ---- Charts Data ---- */

  // 1) Cost Variance BAR: per category (₹)
  const varianceBarData = useMemo(() => {
    return Object.entries(totalsByCategory)
      .map(([k, v]) => ({
        category: k[0].toUpperCase() + k.slice(1),
        Planned: v.planned,
        Actual: v.actual,
        Variance: v.actual - v.planned,
      }))
      // show only categories that have any value
      .filter((d) => d.Planned > 0 || d.Actual > 0);
  }, [totalsByCategory]);

  // 2) Time Variance LINE: cumulative planned vs actual by update date (proxy for time variance)
  // If you later add schedule fields, just replace the x-axis date with your task date.
  const timeSeries = useMemo(() => {
    const list = [...projectBudgets].sort((a, b) =>
      String(a.updatedAt || a.createdAt).localeCompare(String(b.updatedAt || b.createdAt))
    );
    let cumPlanned = 0;
    let cumActual = 0;
    return list.map((b) => {
      cumPlanned += Number(b.plannedAmount || 0);
      cumActual += Number(b.actualAmount || 0);
      const label = (b.updatedAt || b.createdAt || "").slice(0, 10);
      return { date: label || "—", "Planned (Cum)": cumPlanned, "Actual (Cum)": cumActual };
    });
  }, [projectBudgets]);

  // 3) Budget Utilisation DONUT: Actual vs Remaining (vs Project Budget, if available)
  const utilisationMax = selectedProject ? selectedProject.budget : grandPlanned || grandActual;
  const utilised = Math.min(grandActual, utilisationMax || 0);
  const remaining = Math.max((utilisationMax || 0) - utilised, 0);
  const donutData = useMemo(
    () => [
      { name: "Utilised", value: utilised },
      { name: "Remaining", value: remaining },
    ],
    [utilised, remaining]
  );

  // Donut cell colors (let Recharts pick default colors if you want; leaving fixed for clarity)
  const donutColors = ["#0ea5e9", "#e5e7eb"]; // sky-500, gray-200

  return (
    <div className="space-y-6">
      {/* Header + project selector + actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Budget & Cost Control</h2>
          <p className="text-muted-foreground">Monitor the financial side of your project.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {/* Add Budget */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingBudget ? "Edit Budget" : "Create New Budget"}</DialogTitle>
                  <DialogDescription>
                    {editingBudget ? "Update budget details" : "Add a new budget entry"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Project */}
                  <div className="space-y-2">
                    <Label htmlFor="projectId">Project *</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category + Task/Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: Budget["category"]) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="labour">Labour</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="overhead">Overhead</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Task / Remarks</Label>
                      <Input
                        id="description"
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="e.g. Foundation concrete pour"
                      />
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plannedAmount">Planned Cost (₹)</Label>
                      <Input
                        id="plannedAmount"
                        type="number"
                        value={formData.plannedAmount ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            plannedAmount: parseFloat(e.target.value || "0"),
                          })
                        }
                        placeholder="1000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actualAmount">Actual Cost (₹)</Label>
                      <Input
                        id="actualAmount"
                        type="number"
                        value={formData.actualAmount ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            actualAmount: parseFloat(e.target.value || "0"),
                          })
                        }
                        placeholder="950000"
                      />
                    </div>
                  </div>

                  {/* Variance (read-only) */}
                  <div className="space-y-2">
                    <Label>Variance</Label>
                    <Input
                      value={`₹${(
                        (formData.actualAmount || 0) - (formData.plannedAmount || 0)
                      ).toLocaleString()}`}
                      disabled
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Budget</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Approve all pending for selected project */}
            <Button variant="secondary" onClick={approveAllPendingForProject}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Approve Budget
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {has10pctOverrun && (
        <Alert variant="destructive" className="border-destructive/30">
          <BadgeAlert className="h-4 w-4" />
          <AlertTitle>Cost exceeded by 10%</AlertTitle>
          <AlertDescription>
            One or more budget lines in this project have crossed a 10% overrun. Review and take
            action.
          </AlertDescription>
        </Alert>
      )}

      {hasPendingApproval && (
        <Alert className="border-yellow-300">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Pending approval</AlertTitle>
          <AlertDescription>
            There are budget items awaiting approval. Approve them individually or use “Approve
            Budget”.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary (Planned vs Actual key categories) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Material */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Material — Planned vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Planned</div>
            <div className="text-2xl font-bold">₹{totalsByCategory.material.planned.toLocaleString()}</div>
            <div className="mt-2 text-sm text-muted-foreground">Actual</div>
            <div className="text-2xl font-bold">₹{totalsByCategory.material.actual.toLocaleString()}</div>
          </CardContent>
        </Card>

        {/* Labour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Labour — Planned vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Planned</div>
            <div className="text-2xl font-bold">₹{totalsByCategory.labour.planned.toLocaleString()}</div>
            <div className="mt-2 text-sm text-muted-foreground">Actual</div>
            <div className="text-2xl font-bold">₹{totalsByCategory.labour.actual.toLocaleString()}</div>
          </CardContent>
        </Card>

        {/* Overheads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overheads — Planned vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Planned</div>
            <div className="text-2xl font-bold">₹{totalsByCategory.overhead.planned.toLocaleString()}</div>
            <div className="mt-2 text-sm text-muted-foreground">Actual</div>
            <div className="text-2xl font-bold">₹{totalsByCategory.overhead.actual.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Cost Variance (Bar) */}
        <Card className="col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Cost Variance by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {varianceBarData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data to display.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={varianceBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Planned" stackId="a" />
                  <Bar dataKey="Actual" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Time Variance (Line) */}
        <Card className="col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Time Variance (Cumulative)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data to display.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="Planned (Cum)" dot={false} />
                  <Line type="monotone" dataKey="Actual (Cum)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Budget Utilisation % (Donut) */}
        <Card className="col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Budget Utilisation</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {!utilisationMax ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Set a project budget to see utilisation.
              </div>
            ) : (
              <div className="h-full flex items-center justify-between gap-4">
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                      <Legend />
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Project Budget</div>
                  <div className="text-2xl font-bold">
                    ₹{(utilisationMax || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-3">Utilised</div>
                  <div className="text-xl font-semibold">₹{utilised.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mt-3">Remaining</div>
                  <div className="text-xl font-semibold">₹{remaining.toLocaleString()}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget Items ({projectBudgets.length})</CardTitle>
          <div className="text-sm text-muted-foreground">
            Total Planned:{" "}
            <span className="font-semibold">₹{grandPlanned.toLocaleString()}</span> • Total Actual:{" "}
            <span className="font-semibold">₹{grandActual.toLocaleString()}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Planned Cost</TableHead>
                <TableHead>Actual Cost</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectBudgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No budget items yet. Click “Add Budget” to create one.
                  </TableCell>
                </TableRow>
              ) : (
                projectBudgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      {budget.description || "—"}
                    </TableCell>
                    <TableCell className="capitalize">{budget.category}</TableCell>
                    <TableCell>₹{Number(budget.plannedAmount || 0).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(budget.actualAmount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Number(budget.variance) > 0 ? (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-success" />
                        )}
                        <span
                          className={Number(budget.variance) > 0 ? "text-destructive" : "text-success"}
                        >
                          ₹{Math.abs(Number(budget.variance || 0)).toLocaleString()} (
                          {Number(budget.variancePercent || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{budget.notes || "—"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(budget.status)} variant="outline">
                        {budget.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          budget.approvalStatus === "approved"
                            ? "border-green-300 text-green-700 bg-green-50"
                            : "border-yellow-300 text-yellow-700 bg-yellow-50"
                        }
                      >
                        {budget.approvalStatus || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {budget.approvalStatus !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveBudget(budget.id)}
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(budget)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
