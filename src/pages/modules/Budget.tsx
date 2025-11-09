import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Budget, Project } from "../../types/production";
import {
  getFromStorage,
  saveToStorage,
  generateId,
  STORAGE_KEYS,
} from "../../utils/localStorage";
import { useToast } from "../../hooks/use-toast";
import { Textarea } from "../../components/ui/textarea";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<Partial<Budget>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const budgetsData = getFromStorage<Budget>(STORAGE_KEYS.BUDGETS);
    const projectsData = getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    setBudgets(budgetsData);
    setProjects(projectsData);
  };

  const handleSave = () => {
    if (!formData.projectId || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const variance = (formData.actualAmount || 0) - (formData.plannedAmount || 0);
    const variancePercent = formData.plannedAmount
      ? (variance / formData.plannedAmount) * 100
      : 0;
    const status: Budget["status"] =
      variancePercent > 15 ? "critical" : variancePercent > 0 ? "over-budget" : "within-budget";

    let updatedBudgets: Budget[];
    const now = new Date().toISOString();

    if (editingBudget) {
      updatedBudgets = budgets.map((b) =>
        b.id === editingBudget.id
          ? {
              ...formData,
              id: b.id,
              variance,
              variancePercent,
              status,
              updatedAt: now,
              createdAt: b.createdAt,
            } as Budget
          : b
      );
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
    } else {
      const newBudget: Budget = {
        ...formData,
        id: generateId(),
        variance,
        variancePercent,
        status,
        createdAt: now,
        updatedAt: now,
      } as Budget;
      updatedBudgets = [...budgets, newBudget];
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
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
    toast({
      title: "Success",
      description: "Budget deleted successfully",
    });
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData(budget);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBudget(null);
    setFormData({
      category: "material",
      plannedAmount: 0,
      actualAmount: 0,
    });
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Budget & Cost Control</h2>
          <p className="text-muted-foreground">Track and manage project budgets and expenses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Budget Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBudget ? "Edit Budget" : "Create New Budget"}</DialogTitle>
              <DialogDescription>
                {editingBudget ? "Update budget details" : "Add a new budget category"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Cement and steel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plannedAmount">Planned Amount (₹)</Label>
                  <Input
                    id="plannedAmount"
                    type="number"
                    value={formData.plannedAmount || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, plannedAmount: parseFloat(e.target.value) })
                    }
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualAmount">Actual Amount (₹)</Label>
                  <Input
                    id="actualAmount"
                    type="number"
                    value={formData.actualAmount || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, actualAmount: parseFloat(e.target.value) })
                    }
                    placeholder="950000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Variance</Label>
                <Input
                  value={`₹${((formData.actualAmount || 0) - (formData.plannedAmount || 0)).toLocaleString()}`}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Items ({budgets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">{getProjectName(budget.projectId)}</TableCell>
                  <TableCell className="capitalize">{budget.category}</TableCell>
                  <TableCell className="text-muted-foreground">{budget.description}</TableCell>
                  <TableCell>₹{(budget.plannedAmount / 100000).toFixed(2)}L</TableCell>
                  <TableCell>₹{(budget.actualAmount / 100000).toFixed(2)}L</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {budget.variance > 0 ? (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-success" />
                      )}
                      <span
                        className={budget.variance > 0 ? "text-destructive" : "text-success"}
                      >
                        ₹{Math.abs(budget.variance / 100000).toFixed(2)}L ({budget.variancePercent.toFixed(1)}
                        %)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(budget.status)} variant="outline">
                      {budget.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(budget)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {budgets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No budget items yet. Create your first budget!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
