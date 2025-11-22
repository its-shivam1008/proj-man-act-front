"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchWbsByProject, updateWbsItem } from "@/redux/slices/wbsSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
  GitMerge,
  CheckSquare,
  Loader2,
  Bell,
  BellRing
} from "lucide-react";
import { calculateCPM, CPMResult } from "@/components/CPM";
import { addDays, format, isAfter, isBefore, parseISO, differenceInDays } from "date-fns";
import { toast } from "sonner";

// Gantt Imports
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
} from '@/components/ui/shadcn-io/gantt';

interface ReminderForm {
  itemId: string;
  itemName: string;
  date: string;
  note: string;
}

export default function SchedulingPlanning() {
  const dispatch = useDispatch<AppDispatch>();
  
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { wbs, loading: wbsLoading } = useSelector((state: RootState) => state.wbs);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // CPM State
  const [cpmData, setCpmData] = useState<{
    taskResults: Record<string, CPMResult>;
    projectDuration: number;
    criticalPathIds: string[];
  } | null>(null);

  // View States
  const [viewMode, setViewMode] = useState<"standard" | "cpm">("standard");
  const [ganttView, setGanttView] = useState<"daily" | "weekly" | "monthly">("monthly");

  // Reminder Dialog State
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState<ReminderForm>({ itemId: "", itemName: "", date: "", note: "" });

  // --- Scrolling Refs for Split View ---
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Projects
  useEffect(() => {
    dispatch(fetchProjects({ page: 1, limit: 100 }));
  }, [dispatch]);

  // 2. Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  // 3. Fetch WBS
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWbsByProject(selectedProjectId));
    }
  }, [selectedProjectId, dispatch]);

  const selectedProject = useMemo(() => 
    projects.find(p => p._id === selectedProjectId), 
  [projects, selectedProjectId]);

  // --- CPM Calculation ---
  useEffect(() => {
    if (wbs.length > 0 && selectedProject) {
      const tasksForCPM = wbs.map(item => ({
        id: item.id,
        name: item.name,
        duration: item.duration || 1,
        dependencies: item.dependencies || [],
        startDate: item.startDate,
        endDate: item.endDate,
        type: item.type
      }));

      const projectStart = selectedProject.startDate 
        ? parseISO(selectedProject.startDate) 
        : new Date();

      const result = calculateCPM(tasksForCPM, projectStart);
      setCpmData(result);
    }
  }, [wbs, selectedProject]);


  // --- Prepare Gantt Data ---
  const ganttData = useMemo(() => {
    if (!cpmData || !selectedProject) return null;

    // Helper to get Group Name safely
    const getGroupName = (itemId: string, parentId: string | null): string => {
        if (!parentId) return "Project Root";
        const parent = wbs.find(x => x.id === parentId);
        return parent ? parent.name : "General";
    };

    // Sort WBS: Phases first, then others
    const sortedWbs = [...wbs].sort((a, b) => {
       if (a.type === 'phase' && b.type !== 'phase') return -1;
       if (a.type !== 'phase' && b.type === 'phase') return 1;
       return 0;
    });

    const groupedFeatures: Record<string, any[]> = {};

    sortedWbs.forEach(item => {
      let groupName = "General";
      
      if (item.type === 'phase') {
          groupName = "Phases & Milestones";
      } else {
          groupName = getGroupName(item.id, item.parentId);
      }

      if (!groupedFeatures[groupName]) groupedFeatures[groupName] = [];

      const cpmInfo = cpmData.taskResults[item.id];
      const fallbackStart = item.startDate ? parseISO(item.startDate) : new Date();
      const fallbackEnd = item.endDate ? parseISO(item.endDate) : addDays(new Date(), item.duration || 1);

      const startAt = (viewMode === 'cpm' && cpmInfo) ? cpmInfo.calculatedStartDate : fallbackStart;
      const endAt = (viewMode === 'cpm' && cpmInfo) ? cpmInfo.calculatedEndDate : fallbackEnd;

      const isCritical = cpmInfo ? cpmInfo.isCritical : false;

      let colorClass = "bg-blue-200 text-blue-900 border-blue-300";
      if (viewMode === 'cpm' && isCritical) colorClass = "bg-red-200 text-red-900 border-red-400";
      else if (item.status === 'completed') colorClass = "bg-green-200 text-green-900 border-green-300";
      else if (item.type === 'phase') colorClass = "bg-slate-800 text-white border-slate-600";

      groupedFeatures[groupName].push({
        id: item.id,
        name: item.name,
        startAt: startAt,
        endAt: endAt,
        status: item.status,
        isCritical: isCritical,
        type: item.type,
        className: colorClass
      });
    });

    return groupedFeatures;
  }, [wbs, cpmData, viewMode, selectedProject]);


  // --- Reminders Logic ---
  const reminders = useMemo(() => {
    if (!wbs) return [];
    const today = new Date();
    const warningWindow = addDays(today, 7); 

    return wbs.filter(item => {
        if (item.status === 'completed' || !item.endDate) return false;
        const end = parseISO(item.endDate);
        const isUrgent = isBefore(end, warningWindow) && isAfter(end, today);
        const hasUserReminder = item.description?.includes("[REMINDER]");
        return isUrgent || hasUserReminder;
    }).map(item => ({
        ...item,
        daysLeft: differenceInDays(parseISO(item.endDate!), today)
    }));
  }, [wbs]);

  // --- Scroll Sync Handler ---
  const handleSyncScroll = () => {
    if (sidebarRef.current && timelineRef.current) {
        // Sync Sidebar scroll position to match Timeline scroll position
        sidebarRef.current.scrollTop = timelineRef.current.scrollTop;
    }
  };

  // --- Other Handlers ---
  const openReminderDialog = (item: any) => {
      setReminderForm({
          itemId: item.id,
          itemName: item.name,
          date: item.endDate || format(new Date(), 'yyyy-MM-dd'),
          note: ""
      });
      setReminderDialogOpen(true);
  };

  const handleSaveReminder = async () => {
      if(!reminderForm.itemId) return;
      const item = wbs.find(i => i.id === reminderForm.itemId);
      if(item) {
         const newDesc = (item.description || "") + `\n[REMINDER]: ${reminderForm.note} due ${reminderForm.date}`;
         await dispatch(updateWbsItem({ 
             id: reminderForm.itemId, 
             data: { description: newDesc, endDate: reminderForm.date } 
         }));
         toast.success("Reminder set successfully!");
         setReminderDialogOpen(false);
      }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Scheduling & Planning</h2>
          <p className="text-muted-foreground">Critical path analysis and timeline visualization.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select 
            onValueChange={setSelectedProjectId} 
            value={selectedProjectId || ""}
            disabled={projectsLoading}
          >
            <SelectTrigger className="w-[250px]">
              {projectsLoading ? (
                 <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                 </div>
              ) : (
                <SelectValue placeholder="Select Project" />
              )}
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      {wbsLoading && selectedProjectId ? (
         <div className="h-96 flex items-center justify-center">
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading Project Schedule...</p>
             </div>
         </div>
      ) : !selectedProjectId ? (
        <Card className="h-96 flex items-center justify-center bg-slate-50 border-dashed">
          <div className="text-center text-muted-foreground">
             <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
             <p>Please select a project to view the schedule.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Metrics Bar */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="bg-slate-50">
              <CardContent className="p-4 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Est. Duration</span>
                  <div className="text-2xl font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-400" />
                      {cpmData?.projectDuration || 0} <span className="text-sm font-normal text-muted-foreground">Days</span>
                  </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50">
              <CardContent className="p-4 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Critical Tasks</span>
                  <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                      <GitMerge className="w-5 h-5" />
                      {cpmData?.criticalPathIds.length || 0}
                  </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardContent className="p-4 flex flex-col justify-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Active Reminders</span>
                  <div className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {reminders.length}
                  </div>
              </CardContent>
            </Card>

             {/* View Toggle */}
             <Card className="bg-white border">
              <CardContent className="p-2 h-full flex flex-col justify-center gap-2">
                   <span className="text-xs text-center text-slate-400 uppercase font-bold">Calculation Mode</span>
                   <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant={viewMode === 'standard' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('standard')}
                        className="flex-1 text-xs h-8"
                      >
                        Actual
                      </Button>
                      <Button 
                        size="sm"
                         variant={viewMode === 'cpm' ? 'destructive' : 'ghost'}
                         className={`flex-1 text-xs h-8 ${viewMode === 'cpm' ? "bg-red-600 hover:bg-red-700 text-white" : "text-slate-500"}`}
                        onClick={() => setViewMode('cpm')}
                      >
                        CPM View
                      </Button>
                   </div>
              </CardContent>
            </Card>

            {/* Zoom Toggle */}
            <Card className="bg-white border">
              <CardContent className="p-2 h-full flex flex-col justify-center gap-2">
                   <span className="text-xs text-center text-slate-400 uppercase font-bold">Timeline Zoom</span>
                   <Select value={ganttView} onValueChange={(v: any) => setGanttView(v)}>
                      <SelectTrigger className="h-8 text-xs">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                   </Select>
              </CardContent>
            </Card>
          </div>

          {/* Gantt Chart & Reminders Area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-[600px]">
            <Card className="lg:col-span-3 flex flex-col overflow-hidden shadow-md border-slate-200">
                <CardHeader className="pb-2 border-b bg-slate-50/50">
                   <div className="flex justify-between items-center">
                       <CardTitle className="text-lg">Project Timeline</CardTitle>
                       <div className="flex gap-4 text-xs">
                          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-800 rounded-sm"></div> Phase</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-200 border border-red-400 rounded-sm"></div> Critical</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded-sm"></div> Task</span>
                       </div>
                   </div>
                </CardHeader>
                
                <div className="flex-1 relative min-h-[500px] flex flex-col bg-white">
                 {ganttData && Object.keys(ganttData).length > 0 ? (
                    <GanttProvider zoom={ganttView === 'daily' ? 150 : ganttView === 'weekly' ? 100 : 70} range={ganttView}>
                    
                    {/* --- SPLIT VIEW LAYOUT with SYNCED SCROLL --- */}
                    <div className="grid grid-cols-[220px_1fr] h-full  border-t">
                        
                        {/* Sidebar Pane (Hidden Scroll) */}
                        <div ref={sidebarRef} className="sticky top-0 bottom-0 left-0 border-r bg-background z-50">
                            <GanttSidebar>
                                {Object.entries(ganttData).map(([group, items]) => (
                                    <GanttSidebarGroup key={group} name={group}>
                                        {items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between group pr-2 hover:bg-slate-100 transition-colors h-10 border-b border-slate-50"> 
                                              <GanttSidebarItem feature={item} />
                                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => openReminderDialog(item)}>
                                                  <BellRing className="w-3 h-3 text-orange-500" />
                                              </Button>
                                            </div>
                                        ))}
                                    </GanttSidebarGroup>
                                ))}
                            </GanttSidebar>
                        </div>
                        
                        {/* Timeline Pane (Master Scroll) */}
                        <div ref={timelineRef} onScroll={handleSyncScroll} className=" bg-background">
                            <GanttTimeline className="min-w-screen">
                                <GanttHeader />
                                <GanttFeatureList>
                                    {Object.entries(ganttData).map(([group, items]) => (
                                        <GanttFeatureListGroup key={group}>
                                            {items.map((item) => (
                                                <GanttFeatureItem key={item.id} {...item}>
                                                    <div className={`flex items-center gap-2 px-2 w-full h-full rounded shadow-sm text-[10px] leading-none ${item.className}`}>
                                                         <span className="truncate font-medium">{item.name}</span>
                                                         {item.isCritical && viewMode === 'cpm' && <Zap className="w-3 h-3 text-red-600 ml-auto shrink-0" />}
                                                    </div>
                                                </GanttFeatureItem>
                                            ))}
                                        </GanttFeatureListGroup>
                                    ))}
                                </GanttFeatureList>
                                <GanttToday />
                            </GanttTimeline>
                        </div>

                    </div>
                    {/* --- END LAYOUT --- */}

                </GanttProvider>
                 ) : (
                     <div className="h-full flex items-center justify-center text-muted-foreground bg-slate-50">
                         No schedule data available. Add items in WBS to generate Gantt chart.
                     </div>
                 )}
                </div>
            </Card>

            {/* Reminders Sidebar */}
            <Card className="lg:col-span-1 flex flex-col h-full max-h-[650px]">
                <CardHeader className="border-b bg-orange-50/30">
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                        <Bell className="w-5 h-5" /> Reminders
                    </CardTitle>
                    <CardDescription>Upcoming Deadlines</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4">
                    {reminders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>No pending reminders.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reminders.map(item => (
                                <div key={item.id} className="p-3 rounded-lg border bg-white shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm line-clamp-1" title={item.name}>{item.name}</span>
                                        <Badge variant={item.daysLeft < 3 ? "destructive" : "outline"} className="text-[10px]">
                                          {item.daysLeft < 0 ? "Overdue" : `${item.daysLeft} days`}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex justify-between items-center">
                                        <span className="capitalize text-slate-500 bg-slate-100 px-1 rounded">{item.type}</span>
                                        <span className="flex items-center gap-1">
                                          {format(parseISO(item.endDate!), "MMM dd")}
                                          <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Create Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Create Reminder</DialogTitle>
               <DialogDescription>Set a reminder or update deadline for <strong>{reminderForm.itemName}</strong></DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="r-date" className="text-right">Deadline</Label>
                  <Input 
                    id="r-date" 
                    type="date" 
                    className="col-span-3" 
                    value={reminderForm.date}
                    onChange={(e) => setReminderForm({...reminderForm, date: e.target.value})}
                  />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="r-note" className="text-right">Note</Label>
                  <Textarea 
                    id="r-note" 
                    className="col-span-3" 
                    placeholder="Urgent check required..."
                    value={reminderForm.note}
                    onChange={(e) => setReminderForm({...reminderForm, note: e.target.value})}
                  />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>Cancel</Button>
               <Button onClick={handleSaveReminder}>Save Reminder</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
}