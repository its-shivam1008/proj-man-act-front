import React, { useState, useEffect, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  CheckCircle2, 
  FileCheck, 
  DollarSign, 
  Clock, 
  Users, 
  BarChart3,
  Printer,
  Archive,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, parseISO, differenceInDays } from "date-fns";

// --- REDUX IMPORTS ---
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchProjects, updateProject } from "@/redux/slices/projectSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";

// --- TYPES (Re-defined here for safety, or import from your types file) ---
type ProjectStatus = "planning" | "active" | "on-hold" | "completed" | "cancelled";
type WBSItemType = "phase" | "activity" | "task" | "subtask";

interface Project {
  _id: string;
  code: string;
  name: string;
  description: string;
  clientOrDepartment: string;
  status: ProjectStatus;
  budget?: number;
  expectedRevenue?: number;
  actualCost: number;
  startDate?: string;
  endDate?: string;
}

interface WBSItem {
  id: string;
  projectId: string;
  type: WBSItemType;
  name: string;
  status: string;
  manpowerRequirement?: string;
}

interface ChecklistState {
  materialsReconciled: boolean;
  invoicesPaid: boolean;
  documentsUploaded: boolean;
}

export default function ProjectClosure() {
  const { toast } = useToast();
  
  // --- REDUX HOOKS ---
  const dispatch = useDispatch<AppDispatch>();
  
  // Selectors
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { wbs, loading: wbsLoading } = useSelector((state: RootState) => state.wbs);

  // Local Component State
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [checklist, setChecklist] = useState<ChecklistState>({
    materialsReconciled: false,
    invoicesPaid: false,
    documentsUploaded: false,
  });
  const [showReport, setShowReport] = useState(false);

  // --- 1. FETCH PROJECTS ON MOUNT ---
  useEffect(() => {
    // Fetching with a large limit to ensure we get all projects for the dropdown
    dispatch(fetchProjects({ page: 1, limit: 100, search: "", status: "all" }));
  }, [dispatch]);

  // --- 2. FETCH WBS WHEN PROJECT SELECTED ---
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWbsByProject(selectedProjectId));
      
      // Reset local state when project changes
      setChecklist({
        materialsReconciled: false,
        invoicesPaid: false,
        documentsUploaded: false,
      });
      setShowReport(false);
    }
  }, [selectedProjectId, dispatch]);

  // Derived Data: Selected Project
  const project = useMemo(() => 
    projects.find((p: Project) => p._id === selectedProjectId), 
  [projects, selectedProjectId]);

  // Derived Data: WBS Statistics
  const wbsStats = useMemo(() => {
    if (!selectedProjectId || wbs.length === 0) return null;

    // Since wbs in store is already filtered by the fetchWbsByProject call, 
    // we can usually use it directly, but filtering ensures safety if store isn't cleared
    const projectWbs = wbs.filter((item: WBSItem) => item.projectId === selectedProjectId);
    
    const getStats = (type: string) => {
      const items = projectWbs.filter((i: WBSItem) => i.type === type);
      const completed = items.filter((i: WBSItem) => i.status === 'completed');
      return {
        total: items.length,
        completed: completed.length,
        percentage: items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0
      };
    };

    // Calculate overall progress roughly based on item counts
    const totalItems = projectWbs.length;
    const completedItems = projectWbs.filter((i: WBSItem) => i.status === 'completed').length;
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      phases: getStats('phase'),
      activities: getStats('activity'),
      tasks: getStats('task'),
      subtasks: getStats('subtask'),
      totalItems,
      overallProgress
    };
  }, [wbs, selectedProjectId]);

  // Derived Data: Financials & Time
  const reportData = useMemo(() => {
    if (!project) return null;

    const budget = project.budget || 0;
    const actualCost = project.actualCost || 0;
    const revenue = project.expectedRevenue || 0;
    
    // Profit/Loss Logic
    const profitLoss = revenue > 0 ? revenue - actualCost : budget - actualCost;
    const isProfit = profitLoss >= 0;

    // Time Logic
    const start = project.startDate ? parseISO(project.startDate) : new Date();
    const endPlanned = project.endDate ? parseISO(project.endDate) : new Date();
    const endActual = new Date(); // Assuming closure happens "now"
    
    const plannedDuration = differenceInDays(endPlanned, start);
    const actualDuration = differenceInDays(endActual, start);
    const timeVariance = actualDuration - plannedDuration; // Positive means delay

    // Resource Logic
    const projectWbs = wbs.filter((item: WBSItem) => item.projectId === selectedProjectId);
    const tasksWithResources = projectWbs.filter((i: WBSItem) => i.manpowerRequirement && i.manpowerRequirement.trim() !== "").length;

    return {
      budget,
      actualCost,
      revenue,
      profitLoss,
      isProfit,
      start,
      endPlanned,
      endActual,
      plannedDuration,
      actualDuration,
      timeVariance,
      resourceUtilizationCount: tasksWithResources
    };
  }, [project, wbs, selectedProjectId]);

  // --- HANDLERS ---

  const handleGenerateReport = () => {
    if (!checklist.documentsUploaded || !checklist.invoicesPaid || !checklist.materialsReconciled) {
      toast({
        title: "Checklist Incomplete",
        description: "Please complete all reconciliation items before generating the report.",
        variant: "destructive"
      });
      return;
    }
    setShowReport(true);
    toast({
      title: "Report Generated",
      description: "Project closure metrics have been calculated.",
    });
  };

  const handleCloseProject = async () => {
    if (!selectedProjectId) return;

    try {
      // Dispatch Redux Action to update backend
      await dispatch(updateProject({ 
        id: selectedProjectId, 
        data: { status: 'completed' } 
      })).unwrap();

      toast({
        title: "Project Closed",
        description: "The project status has been updated to 'Completed'.",
        variant: "default"
      });
      
      // Optionally refresh projects list
      dispatch(fetchProjects({ page: 1, limit: 100, search: "", status: "all" }));

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close the project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Closure</h1>
          <p className="text-muted-foreground">Reconcile, review, and formally close projects.</p>
        </div>
        <div className="w-full md:w-[300px]">
          <Select onValueChange={setSelectedProjectId} value={selectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder={projectsLoading ? "Loading..." : "Select a project to close"} />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p: Project) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.code} - {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedProjectId ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Project Selected</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Select a project from the dropdown above to begin the closure process, view WBS statistics, and generate final reports.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* --- PROJECT HEADER CARD --- */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{project?.name}</CardTitle>
                    <CardDescription>{project?.code} | {project?.clientOrDepartment}</CardDescription>
                  </div>
                </div>
                <Badge variant={project?.status === 'completed' ? "default" : "secondary"} className="capitalize text-sm px-3 py-1">
                  {project?.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* --- LEFT COLUMN: WBS STATS --- */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  WBS Completion Status
                </CardTitle>
                <CardDescription>Breakdown of completed items by type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {wbsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading WBS data...</div>
                ) : wbsStats ? (
                  <>
                   <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Phases</span>
                        <span>{wbsStats.phases.completed}/{wbsStats.phases.total} ({wbsStats.phases.percentage}%)</span>
                      </div>
                      <Progress value={wbsStats.phases.percentage} className="h-2" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Activities</span>
                        <span>{wbsStats.activities.completed}/{wbsStats.activities.total} ({wbsStats.activities.percentage}%)</span>
                      </div>
                      <Progress value={wbsStats.activities.percentage} className="h-2" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Tasks</span>
                        <span>{wbsStats.tasks.completed}/{wbsStats.tasks.total} ({wbsStats.tasks.percentage}%)</span>
                      </div>
                      <Progress value={wbsStats.tasks.percentage} className="h-2" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Subtasks</span>
                        <span>{wbsStats.subtasks.completed}/{wbsStats.subtasks.total} ({wbsStats.subtasks.percentage}%)</span>
                      </div>
                      <Progress value={wbsStats.subtasks.percentage} className="h-2" />
                    </div>

                    <Separator className="my-4" />
                    
                    <div className="pt-2">
                       <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">Overall Completion</span>
                          <span className="font-bold text-lg">{wbsStats.overallProgress}%</span>
                       </div>
                       <Progress value={wbsStats.overallProgress} className="h-3 bg-secondary" />
                    </div>
                  </>
                ) : (
                   <div className="text-center py-4 text-muted-foreground">No WBS items found for this project.</div>
                )}
              </CardContent>
            </Card>

            {/* --- RIGHT COLUMN: CHECKLIST --- */}
            <Card className="no-print">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Closure Checklist
                </CardTitle>
                <CardDescription>Mandatory checks before generating final report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`items-top flex space-x-2 border p-4 rounded-md transition-colors ${checklist.materialsReconciled ? "bg-green-50 border-green-200" : "hover:bg-accent/50"}`}>
                  <Checkbox 
                    id="materials" 
                    checked={checklist.materialsReconciled}
                    onCheckedChange={(c) => setChecklist(prev => ({...prev, materialsReconciled: c === true}))}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="materials"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Material Reconciliation
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Verify all utilized materials match inventory logs and site consumption.
                    </p>
                  </div>
                </div>

                <div className={`items-top flex space-x-2 border p-4 rounded-md transition-colors ${checklist.invoicesPaid ? "bg-green-50 border-green-200" : "hover:bg-accent/50"}`}>
                  <Checkbox 
                    id="invoices" 
                    checked={checklist.invoicesPaid}
                    onCheckedChange={(c) => setChecklist(prev => ({...prev, invoicesPaid: c === true}))}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="invoices"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Invoices Paid
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Ensure all vendor and contractor invoices have been processed and cleared.
                    </p>
                  </div>
                </div>

                <div className={`items-top flex space-x-2 border p-4 rounded-md transition-colors ${checklist.documentsUploaded ? "bg-green-50 border-green-200" : "hover:bg-accent/50"}`}>
                  <Checkbox 
                    id="docs" 
                    checked={checklist.documentsUploaded}
                    onCheckedChange={(c) => setChecklist(prev => ({...prev, documentsUploaded: c === true}))}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="docs"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Documents Uploaded
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Confirm all Handover documents, warranties, and as-built drawings are uploaded.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleGenerateReport}
                  disabled={showReport}
                  variant={showReport ? "secondary" : "default"}
                >
                  {showReport ? <CheckCircle2 className="mr-2 h-4 w-4"/> : null}
                  {showReport ? "Report Generated" : "Generate Closure Report"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* --- CLOSURE REPORT SECTION --- */}
          {showReport && reportData && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Separator className="my-8" />
              
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Project Closure Report</h2>
                <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Report
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Financial Card */}
                <Card className={reportData.isProfit ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <DollarSign className="h-5 w-5" />
                      Financial Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Planned Budget:</span>
                        <span className="font-medium">₹{reportData.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Actual Cost:</span>
                        <span className="font-medium">₹{reportData.actualCost.toLocaleString()}</span>
                      </div>
                      <Separator className="bg-black/10" />
                      <div className="flex justify-between text-base font-bold">
                        <span>{reportData.revenue > 0 ? "Net Profit/Loss:" : "Budget Variance:"}</span>
                        <span className={reportData.isProfit ? "text-green-700" : "text-red-700"}>
                          {reportData.isProfit ? "+" : "-"}₹{Math.abs(reportData.profitLoss).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Time Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Planned End:</span>
                        <span className="font-medium">{format(reportData.endPlanned, 'dd MMM yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Actual Closure:</span>
                        <span className="font-medium">{format(reportData.endActual, 'dd MMM yyyy')}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Duration Variance:</span>
                        <span className={reportData.timeVariance <= 0 ? "text-green-700" : "text-red-700"}>
                          {reportData.timeVariance <= 0 
                            ? `${Math.abs(reportData.timeVariance)} Days Early` 
                            : `${reportData.timeVariance} Days Delayed`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                 {/* Resource Card */}
                 <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Resource Utilization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-4 text-sm">
                       <div>
                         <span className="text-muted-foreground">Tasks with Resource Plans:</span>
                         <div className="text-3xl font-bold mt-1">{reportData.resourceUtilizationCount}</div>
                       </div>
                       <p className="text-xs text-muted-foreground italic">
                         *Counts tasks that had specific manpower requirements defined in the WBS.
                       </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendation Alert */}
              <Alert variant={reportData.isProfit ? "default" : "destructive"} className="bg-background border">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Closure Recommendation</AlertTitle>
                <AlertDescription>
                  {reportData.isProfit 
                    ? "Project is financially healthy. Proceed with formal closure and archive documentation." 
                    : "Project has exceeded budget estimates. A root cause analysis document is recommended before archiving."}
                </AlertDescription>
              </Alert>

              {/* Final Action */}
              <div className="flex justify-end gap-4 no-print pt-4">
                 <Button variant="outline">Export PDF</Button>
                 <Button 
                  variant={project?.status === 'completed' ? "secondary" : "destructive"}
                  onClick={handleCloseProject}
                  disabled={project?.status === 'completed'}
                >
                  {project?.status === 'completed' ? "Project Already Closed" : "Confirm Project Closure"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}