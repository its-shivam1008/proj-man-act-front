import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getFromStorage, STORAGE_KEYS } from "../../utils/localStorage";
import { Project, Budget, Milestone } from "../../types/production";
import { useEffect, useState } from "react";
import { FolderKanban, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";

export default function ProjectManagementDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    setProjects(getFromStorage<Project>(STORAGE_KEYS.PROJECTS));
    setBudgets(getFromStorage<Budget>(STORAGE_KEYS.BUDGETS));
    setMilestones(getFromStorage<Milestone>(STORAGE_KEYS.MILESTONES));
  }, []);

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalActualCost = projects.reduce((sum, p) => sum + p.actualCost, 0);
  const overBudgetCount = budgets.filter((b) => b.status === "over-budget").length;

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "bg-success";
      case "planning":
        return "bg-warning";
      case "completed":
        return "bg-muted";
      case "on-hold":
        return "bg-warning";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your project management activities</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">{activeProjects} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalBudget / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">Allocated budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalActualCost / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">
              {((totalActualCost / totalBudget) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overBudgetCount}</div>
            <p className="text-xs text-muted-foreground">Over budget items</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects
              .filter((p) => p.status === "active" || p.status === "planning")
              .slice(0, 5)
              .map((project) => (
                <div key={project.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{project.name}</p>
                      <Badge variant="outline" className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.client} • {project.location}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-sm font-medium">Progress: {project.progress}%</p>
                    <Progress value={project.progress} className="w-32" />
                  </div>
                </div>
              ))}
            {projects.filter((p) => p.status === "active" || p.status === "planning").length === 0 && (
              <p className="text-center text-muted-foreground py-4">No active projects</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones
              .filter((m) => m.status === "pending")
              .slice(0, 5)
              .map((milestone) => {
                const project = projects.find((p) => p.id === milestone.projectId);
                return (
                  <div key={milestone.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground">{milestone.name}</p>
                      <p className="text-sm text-muted-foreground">{project?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{(milestone.value / 100000).toFixed(2)}L</p>
                      <p className="text-xs text-muted-foreground">{new Date(milestone.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            {milestones.filter((m) => m.status === "pending").length === 0 && (
              <p className="text-center text-muted-foreground py-4">No upcoming milestones</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
