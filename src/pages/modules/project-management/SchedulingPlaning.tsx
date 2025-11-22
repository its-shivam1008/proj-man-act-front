"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchWbsByProject, updateWbsItem } from "@/redux/slices/wbsSlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  BellRing,
  Pencil,
  Save,
} from "lucide-react";
import { calculateCPM, CPMResult } from "@/components/CPM";
import {
  addDays,
  format,
  isAfter,
  isBefore,
  parseISO,
  differenceInDays,
} from "date-fns";
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
} from "@/components/ui/shadcn-io/gantt";

interface ReminderForm {
  itemId: string;
  itemName: string;
  date: string;
  note: string;
}

export default function SchedulingPlanning() {
  const dispatch = useDispatch<AppDispatch>();

  const { projects, loading: projectsLoading } = useSelector(
    (state: RootState) => state.projects
  );
  const { wbs, loading: wbsLoading } = useSelector(
    (state: RootState) => state.wbs
  );
  const [customSequences, setCustomSequences] = useState<
    Record<string, number>
  >({});
  const [customHierarchicalNumbers, setCustomHierarchicalNumbers] = useState<
    Record<string, string>
  >({});
  const [editingNumberId, setEditingNumberId] = useState<string | null>(null);
  const [editingNumberValue, setEditingNumberValue] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // CPM State
  const [cpmData, setCpmData] = useState<{
    taskResults: Record<string, CPMResult>;
    projectDuration: number;
    criticalPathIds: string[];
  } | null>(null);

  // View States
  const [viewMode, setViewMode] = useState<"standard" | "cpm">("standard");
  const [ganttView, setGanttView] = useState<"daily" | "weekly" | "monthly">(
    "monthly"
  );

  // Reminder Dialog State
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState<ReminderForm>({
    itemId: "",
    itemName: "",
    date: "",
    note: "",
  });

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    startDate: string;
    endDate: string;
  }>({
    name: "",
    startDate: "",
    endDate: "",
  });

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
      setCustomSequences({});
      setCustomHierarchicalNumbers({});
    }
  }, [selectedProjectId, dispatch]);

  // 4. Load custom numbers from WBS items (if they exist in backend)
  useEffect(() => {
    if (wbs && wbs.length > 0) {
      const customNumbers: Record<string, string> = {};
      wbs.forEach((item) => {
        // Check if item has customNumber field (from backend)
        if ((item as any).customNumber) {
          customNumbers[item.id] = (item as any).customNumber;
        }
      });
      if (Object.keys(customNumbers).length > 0) {
        setCustomHierarchicalNumbers(customNumbers);
      }
    }
  }, [wbs]);

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  // --- CPM Calculation ---
  useEffect(() => {
    if (wbs.length > 0 && selectedProject) {
      const tasksForCPM = wbs.map((item) => ({
        id: item.id,
        name: item.name,
        duration: item.duration || 1,
        dependencies: item.dependencies || [],
        startDate: item.startDate,
        endDate: item.endDate,
        type: item.type,
      }));

      const projectStart = selectedProject.startDate
        ? parseISO(selectedProject.startDate)
        : new Date();

      const result = calculateCPM(tasksForCPM, projectStart);
      setCpmData(result);
    }
  }, [wbs, selectedProject]);
  const handleSequenceChange = (id: string, newVal: string) => {
    if (newVal === "") {
      // If empty, remove override (revert to auto-date)
      setCustomSequences((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    const num = parseInt(newVal);
    if (!isNaN(num)) {
      setCustomSequences((prev) => ({ ...prev, [id]: num }));
    }
  };
  // --- Generate Hierarchical Numbering (1, 1.1, 1.2, 2, 2.1, etc.) ---
  const generateHierarchicalNumbering = useMemo(() => {
    if (!wbs || wbs.length === 0) return {};

    // Build parent-child map
    const childrenMap: Record<string, string[]> = {};
    const itemMap: Record<string, any> = {};
    
    wbs.forEach((item) => {
      itemMap[item.id] = item;
      if (item.parentId) {
        if (!childrenMap[item.parentId]) {
          childrenMap[item.parentId] = [];
        }
        childrenMap[item.parentId].push(item.id);
      }
    });

    // Sort children by start date for consistent numbering
    Object.keys(childrenMap).forEach((parentId) => {
      childrenMap[parentId].sort((a, b) => {
        const dateA = itemMap[a]?.startDate ? new Date(itemMap[a].startDate).getTime() : 0;
        const dateB = itemMap[b]?.startDate ? new Date(itemMap[b].startDate).getTime() : 0;
        return dateA - dateB;
      });
    });

    // Find root items (phases - no parent)
    const rootItems = wbs
      .filter((item) => !item.parentId && item.type === "phase")
      .sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
      });

    const numbering: Record<string, string> = {};
    let phaseCounter = 0;

    // Recursive function to assign hierarchical numbers
    const assignNumber = (itemId: string, parentNumber: string = "") => {
      const item = itemMap[itemId];
      if (!item) return;

      // Check if custom number exists - use it directly
      if (customHierarchicalNumbers[itemId]) {
        numbering[itemId] = customHierarchicalNumbers[itemId];
        // Still need to process children with the custom number as parent
        const children = childrenMap[itemId] || [];
        children.forEach((childId) => {
          assignNumber(childId, customHierarchicalNumbers[itemId]);
        });
        return;
      }

      let currentNumber: string;
      
      if (item.type === "phase") {
        phaseCounter++;
        currentNumber = phaseCounter.toString();
      } else {
        // For activities and tasks, use parent's number + sub-number
        const parent = itemMap[item.parentId!];
        if (parent) {
          const siblings = childrenMap[item.parentId!] || [];
          // Filter out siblings that have custom numbers (they should be sorted separately)
          const siblingsWithoutCustom = siblings.filter(sibId => !customHierarchicalNumbers[sibId]);
          const index = siblingsWithoutCustom.indexOf(itemId);
          const subNumber = index + 1;
          
          if (parent.type === "phase") {
            currentNumber = `${parentNumber}.${subNumber}`;
          } else {
            // Task under activity
            currentNumber = `${parentNumber}.${subNumber}`;
          }
        } else {
          currentNumber = parentNumber;
        }
      }

      numbering[itemId] = currentNumber;

      // Recursively assign numbers to children
      const children = childrenMap[itemId] || [];
      children.forEach((childId) => {
        assignNumber(childId, currentNumber);
      });
    };

    // Start with root phases
    rootItems.forEach((phase) => {
      assignNumber(phase.id);
    });

    // Handle orphaned items (items without phase parent)
    wbs
      .filter((item) => !numbering[item.id])
      .sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
      })
      .forEach((item, index) => {
        if (!numbering[item.id]) {
          numbering[item.id] = (rootItems.length + index + 1).toString();
        }
      });

    return numbering;
  }, [wbs, customHierarchicalNumbers]);

  // --- Prepare Gantt Data ---
  const ganttData = useMemo(() => {
    if (!cpmData || !selectedProject) return null;

    const groupedFeatures: Record<string, any[]> = {};
    
    const getGroupName = (itemId: string, parentId: string | null) => {
      if (!parentId) return "General";
      const parent = wbs.find((i) => i.id === parentId);
      if (!parent) return "General";
      return parent.name || "General";
    };

    wbs.forEach((item) => {
      // 1. DEFINE GROUP NAME
      let groupName = "General";
      if (item.type === "phase") {
        groupName = "Phases & Milestones";
      } else {
        groupName = getGroupName(item.id, item.parentId);
      }

      // 2. Initialize group array if it doesn't exist
      if (!groupedFeatures[groupName]) groupedFeatures[groupName] = [];

      // 3. Calculate Dates & CPM Info
      const cpmInfo = cpmData.taskResults[item.id];
      const fallbackStart = item.startDate
        ? parseISO(item.startDate)
        : new Date();
      const fallbackEnd = item.endDate
        ? parseISO(item.endDate)
        : addDays(new Date(), item.duration || 1);

      const startAt =
        viewMode === "cpm" && cpmInfo
          ? cpmInfo.calculatedStartDate
          : fallbackStart;
      const endAt =
        viewMode === "cpm" && cpmInfo ? cpmInfo.calculatedEndDate : fallbackEnd;
      const isCritical = cpmInfo ? cpmInfo.isCritical : false;

      // Enhanced color classes with better contrast
      let colorClass = "bg-blue-200 text-blue-900 border-blue-300";
      if (viewMode === "cpm" && isCritical)
        colorClass = "bg-red-200 text-red-900 border-red-400 font-semibold";
      else if (item.status === "completed")
        colorClass = "bg-green-200 text-green-900 border-green-300";
      else if (item.type === "phase")
        colorClass = "bg-slate-800 text-white border-slate-600 font-semibold";
      else if (item.type === "activity")
        colorClass = "bg-indigo-200 text-indigo-900 border-indigo-300";
      else if (item.status === "in-progress")
        colorClass = "bg-blue-300 text-blue-950 border-blue-400";

      // 4. Get hierarchical number
      const hierarchicalNumber = generateHierarchicalNumbering[item.id] || "";
      const displayNumber = customSequences[item.id] 
        ? customSequences[item.id].toString() 
        : hierarchicalNumber;

      // 5. Find parent dates for constraints (if item has a parent)
      let minDate: Date | null = null;
      let maxDate: Date | null = null;
      let originalStartDate: Date = startAt;
      let originalEndDate: Date = endAt;
      
      // Store original dates from WBS
      if (item.startDate) {
        originalStartDate = parseISO(item.startDate);
      }
      if (item.endDate) {
        originalEndDate = parseISO(item.endDate);
      }
      
      // If item has a parent, constrain by parent's dates
      if (item.parentId) {
        const parent = wbs.find((p) => p.id === item.parentId);
        if (parent) {
          const parentStart = parent.startDate ? parseISO(parent.startDate) : null;
          const parentEnd = parent.endDate ? parseISO(parent.endDate) : null;
          
          // Use parent dates as constraints
          if (parentStart) minDate = parentStart;
          if (parentEnd) maxDate = parentEnd;
        }
      } else {
        // For phases (no parent), use original dates as constraints
        minDate = originalStartDate;
        maxDate = originalEndDate;
      }

      // 6. Push to the group
      groupedFeatures[groupName].push({
        id: item.id,
        name: item.name,
        startAt: startAt,
        endAt: endAt,
        status: item.status,
        isCritical: isCritical,
        type: item.type,
        className: colorClass,
        sequence: displayNumber,
        hierarchicalNumber: hierarchicalNumber,
        parentId: item.parentId,
        minDate: minDate, // Constraint: can't move before this
        maxDate: maxDate, // Constraint: can't move after this
        originalStartDate: originalStartDate, // Original start date from WBS
        originalEndDate: originalEndDate, // Original end date from WBS
      });
    });

    // Sort items within groups by hierarchical number
    Object.keys(groupedFeatures).forEach((group) => {
      groupedFeatures[group].sort((a, b) => {
        // Compare hierarchical numbers (e.g., "1" < "1.1" < "2")
        const numA = a.hierarchicalNumber || "";
        const numB = b.hierarchicalNumber || "";
        return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
      });
    });

    return groupedFeatures;
  }, [wbs, cpmData, viewMode, selectedProject, customSequences, generateHierarchicalNumbering]);

  // --- Reminders Logic ---
  const reminders = useMemo(() => {
    if (!wbs) return [];
    const today = new Date();
    const warningWindow = addDays(today, 7);

    return wbs
      .filter((item) => {
        if (item.status === "completed" || !item.endDate) return false;
        const end = parseISO(item.endDate);
        const isUrgent = isBefore(end, warningWindow) && isAfter(end, today);
        const hasUserReminder = item.description?.includes("[REMINDER]");
        return isUrgent || hasUserReminder;
      })
      .map((item) => ({
        ...item,
        daysLeft: differenceInDays(parseISO(item.endDate!), today),
      }));
  }, [wbs]);

  // --- Scroll Sync Handler ---
  const handleSyncScroll = () => {
    if (sidebarRef.current && timelineRef.current) {
      // Sync Sidebar scroll position to match Timeline scroll position
      sidebarRef.current.scrollTop = timelineRef.current.scrollTop;
    }
  };

  // --- Prevent sidebar from hiding: Keep scrollLeft >= 0 ---
  useEffect(() => {
    if (!ganttData || Object.keys(ganttData).length === 0) return;

    let ganttContainer: HTMLElement | null = null;
    let rafId: number | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const fixScroll = () => {
      if (!ganttContainer) return;
      if (ganttContainer.scrollLeft < 0) {
        ganttContainer.scrollLeft = 0;
      }
    };

    const handleScroll = () => {
      fixScroll();
      // Double-check in next frame
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(fixScroll);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!ganttContainer) return;
      if (e.deltaX < 0 && ganttContainer.scrollLeft <= 5) {
        e.preventDefault();
        e.stopPropagation();
        ganttContainer.scrollLeft = 0;
      }
    };

    const setupListeners = () => {
      ganttContainer = document.querySelector('.gantt.overflow-auto') as HTMLElement;
      if (!ganttContainer) {
        setTimeout(setupListeners, 100);
        return;
      }

      ganttContainer.addEventListener('scroll', handleScroll, { passive: false });
      ganttContainer.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      
      // Also check periodically as backup
      intervalId = setInterval(fixScroll, 50);
      
      // Initial check
      fixScroll();
    };

    const timer = setTimeout(setupListeners, 200);

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
      if (rafId) cancelAnimationFrame(rafId);
      if (ganttContainer) {
        ganttContainer.removeEventListener('scroll', handleScroll);
        ganttContainer.removeEventListener('wheel', handleWheel, { capture: true });
      }
    };
  }, [ganttData]);

  // --- Other Handlers ---
  const openReminderDialog = (item: any) => {
    setReminderForm({
      itemId: item.id,
      itemName: item.name,
      date: item.endDate || format(new Date(), "yyyy-MM-dd"),
      note: "",
    });
    setReminderDialogOpen(true);
  };

  const handleSaveReminder = async () => {
    if (!reminderForm.itemId) return;
    const item = wbs.find((i) => i.id === reminderForm.itemId);
    if (item) {
      const newDesc =
        (item.description || "") +
        `\n[REMINDER]: ${reminderForm.note} due ${reminderForm.date}`;
      await dispatch(
        updateWbsItem({
          id: reminderForm.itemId,
          data: { description: newDesc, endDate: reminderForm.date },
        })
      );
      toast.success("Reminder set successfully!");
      setReminderDialogOpen(false);
    }
  };

  // --- Edit Item Handlers ---
  const openEditDialog = (item: any) => {
    const wbsItem = wbs.find((i) => i.id === item.id);
    if (wbsItem) {
      setEditingItem(wbsItem);
      setEditForm({
        name: wbsItem.name || "",
        startDate: wbsItem.startDate ? format(parseISO(wbsItem.startDate), "yyyy-MM-dd") : "",
        endDate: wbsItem.endDate ? format(parseISO(wbsItem.endDate), "yyyy-MM-dd") : "",
      });
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (editForm.startDate && editForm.endDate) {
      const start = parseISO(editForm.startDate);
      const end = parseISO(editForm.endDate);
      if (isAfter(start, end)) {
        toast.error("Start date must be before end date");
        return;
      }
    }

    try {
      const updateData: any = {
        name: editForm.name.trim(),
      };

      if (editForm.startDate) {
        updateData.startDate = editForm.startDate;
      }
      if (editForm.endDate) {
        updateData.endDate = editForm.endDate;
      }

      const result = await dispatch(
        updateWbsItem({
          id: editingItem.id,
          data: updateData,
        })
      );

      if (updateWbsItem.fulfilled.match(result)) {
        toast.success("Item updated successfully!");
        setEditDialogOpen(false);
        setEditingItem(null);
        // Refresh WBS data
        if (selectedProjectId) {
          dispatch(fetchWbsByProject(selectedProjectId));
        }
      } else {
        toast.error("Failed to update item");
      }
    } catch (error) {
      toast.error("An error occurred while updating");
    }
  };

  // --- Handle Hierarchical Number Edit ---
  const handleNumberEditStart = (itemId: string, currentNumber: string) => {
    setEditingNumberId(itemId);
    setEditingNumberValue(currentNumber);
  };

  const handleNumberEditSave = async (itemId: string) => {
    const trimmedValue = editingNumberValue.trim();
    
    if (trimmedValue === "") {
      // Remove custom number (revert to auto-generated)
      setCustomHierarchicalNumbers((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      toast.success("Number reset to auto-generated");
    } else {
      // Validate format (should be like "1", "1.1", "1.1.1", etc.)
      const isValidFormat = /^(\d+(\.\d+)*)$/.test(trimmedValue);
      if (!isValidFormat) {
        toast.error("Invalid format. Use numbers like 1, 1.1, 1.1.1, etc.");
        return;
      }

      // Save custom number
      setCustomHierarchicalNumbers((prev) => ({
        ...prev,
        [itemId]: trimmedValue,
      }));
      
      // Optionally save to backend
      try {
        await dispatch(
          updateWbsItem({
            id: itemId,
            data: { customNumber: trimmedValue },
          })
        );
        toast.success("Number updated successfully!");
      } catch (error) {
        // Even if backend save fails, keep the local change
        toast.success("Number updated (local only)");
      }
    }
    
    setEditingNumberId(null);
    setEditingNumberValue("");
  };

  const handleNumberEditCancel = () => {
    setEditingNumberId(null);
    setEditingNumberValue("");
  };

  return (
    <div className="space-y-6 p-4 md:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Scheduling & Planning
          </h2>
          <p className="text-muted-foreground">
            Critical path analysis and timeline visualization.
          </p>
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
              {projects.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
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
            <p className="text-sm text-muted-foreground">
              Loading Project Schedule...
            </p>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Est. Duration
                </span>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  {cpmData?.projectDuration || 0}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    Days
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardContent className="p-4 flex flex-col justify-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Critical Tasks
                </span>
                <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                  <GitMerge className="w-5 h-5" />
                  {cpmData?.criticalPathIds.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardContent className="p-4 flex flex-col justify-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Active Reminders
                </span>
                <div className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {reminders.length}
                </div>
              </CardContent>
            </Card>

            {/* View Toggle */}
            <Card className="bg-white border">
              <CardContent className="p-2 h-full flex flex-col justify-center gap-2">
                <span className="text-xs text-center text-slate-400 uppercase font-bold">
                  Calculation Mode
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={viewMode === "standard" ? "default" : "ghost"}
                    onClick={() => setViewMode("standard")}
                    className="flex-1 text-xs h-8"
                  >
                    Actual
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "cpm" ? "destructive" : "ghost"}
                    className={`flex-1 text-xs h-8 ${
                      viewMode === "cpm"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "text-slate-500"
                    }`}
                    onClick={() => setViewMode("cpm")}
                  >
                    CPM View
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Zoom Toggle */}
            <Card className="bg-white border">
              <CardContent className="p-2 h-full flex flex-col justify-center gap-2">
                <span className="text-xs text-center text-slate-400 uppercase font-bold">
                  Timeline Zoom
                </span>
                <Select
                  value={ganttView}
                  onValueChange={(v: any) => setGanttView(v)}
                >
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
            <Card className="lg:col-span-3 flex flex-col overflow-hidden shadow-lg border-slate-300 bg-gradient-to-br from-white to-slate-50/30">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-slate-50 to-white">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-800">Project Timeline</CardTitle>
                    <CardDescription className="text-xs mt-1">Visualize phases, activities, and tasks with hierarchical numbering</CardDescription>
                  </div>
                  <div className="flex gap-3 text-xs bg-white/80 px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <span className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-slate-800 rounded-sm shadow-sm"></div>
                      <span className="font-medium">Phase</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-red-200 border border-red-400 rounded-sm shadow-sm"></div>
                      <span className="font-medium">Critical</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-indigo-200 border border-indigo-300 rounded-sm shadow-sm"></div>
                      <span className="font-medium">Activity</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded-sm shadow-sm"></div>
                      <span className="font-medium">Task</span>
                    </span>
                  </div>
                </div>
              </CardHeader>

              <div className="flex-1 relative min-h-[500px] flex flex-col bg-white">
                {ganttData && Object.keys(ganttData).length > 0 ? (
                  <>
                    <style>{`
                      /* Prevent Gantt container from scrolling left beyond 0 */
                      .gantt.overflow-auto {
                        scroll-behavior: smooth;
                      }
                      .gantt.overflow-auto [data-roadmap-ui="gantt-sidebar"] {
                        position: sticky !important;
                        left: 0 !important;
                        z-index: 50 !important;
                      }
                    `}</style>
                  <GanttProvider
                    zoom={
                      ganttView === "daily"
                        ? 150
                        : ganttView === "weekly"
                        ? 100
                        : 70
                    }
                    range={ganttView}
                  >
                    {/* --- SPLIT VIEW LAYOUT with SYNCED SCROLL --- */}
                    <div className="grid grid-cols-[280px_1fr] h-full border-t">
                      {/* Sidebar Pane */}
                      <div
                        ref={sidebarRef}
                        className="sticky top-0 left-0 h-full overflow-y-auto overflow-x-hidden border-r bg-gradient-to-b from-slate-50/50 to-white z-50 shadow-sm"
                      >
                        <GanttSidebar>
                          {Object.entries(ganttData).map(([group, items]) => (
                            <GanttSidebarGroup key={group} name={group}>
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between group pr-2 hover:bg-slate-100 transition-colors h-12 border-b border-slate-100"
                                >
                                  <div className="w-16 shrink-0 flex items-center justify-center pl-2">
                                    {editingNumberId === item.id ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          value={editingNumberValue}
                                          onChange={(e) => setEditingNumberValue(e.target.value)}
                                          onBlur={() => handleNumberEditSave(item.id)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              handleNumberEditSave(item.id);
                                            } else if (e.key === "Escape") {
                                              handleNumberEditCancel();
                                            }
                                          }}
                                          className="h-7 w-16 text-xs px-1.5 py-0.5 text-center font-bold"
                                          autoFocus
                                        />
                                      </div>
                                    ) : (
                                      <span
                                        className="text-xs font-bold text-slate-700 bg-gradient-to-br from-slate-100 to-slate-200 px-2 py-1 rounded-md border border-slate-300 shadow-sm cursor-pointer hover:bg-slate-200 transition-colors"
                                        onClick={() => handleNumberEditStart(item.id, item.hierarchicalNumber || item.sequence || "")}
                                        title="Click to edit number"
                                      >
                                        {item.hierarchicalNumber || item.sequence}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <GanttSidebarItem feature={item} />
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-blue-50"
                                      onClick={() => openEditDialog(item)}
                                      title="Edit Item"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-orange-50"
                                      onClick={() => openReminderDialog(item)}
                                      title="Set Reminder"
                                    >
                                      <BellRing className="w-3.5 h-3.5 text-orange-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </GanttSidebarGroup>
                          ))}
                        </GanttSidebar>
                      </div>

                      {/* Timeline Pane (Master Scroll) */}
                      <div
                        ref={timelineRef}
                        onScroll={handleSyncScroll}
                        className="bg-background"
                      >
                        <GanttTimeline className="min-w-screen">
                          <GanttHeader />
                          <GanttFeatureList>
                            {Object.entries(ganttData).map(([group, items]) => (
                              <GanttFeatureListGroup key={group}>
                                {items.map((item) => (
                                  <GanttFeatureItem key={item.id} {...item}>
                                    <div
                                      className={`group/item flex items-center gap-2 px-3 py-1.5 w-full h-full rounded-md shadow-md border-2 transition-all hover:shadow-lg min-w-[200px] ${item.className}`}
                                      title={`${item.hierarchicalNumber || item.sequence}: ${item.name} (${item.type})`}
                                    >
                                      {/* Hierarchical Number Badge */}
                                      <span className="font-bold text-xs bg-white/40 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/60 shrink-0 shadow-sm">
                                        {item.hierarchicalNumber || item.sequence}
                                      </span>

                                      {/* Task Name - More Prominent */}
                                      <span className="truncate font-semibold text-sm flex-1 min-w-[120px]">
                                        {item.name}
                                      </span>

                                      {/* Type Badge */}
                                      <span className="text-[9px] uppercase font-medium bg-black/15 px-2 py-0.5 rounded-md shrink-0 border border-black/10">
                                        {item.type}
                                      </span>

                                      {/* Edit Button - Shows on Hover */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover/item:opacity-100 shrink-0 hover:bg-white/30 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditDialog(item);
                                        }}
                                        title="Edit Item"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>

                                      {/* Critical Path Indicator */}
                                      {item.isCritical && viewMode === "cpm" && (
                                        <Zap className="w-4 h-4 text-red-600 shrink-0 animate-pulse" title="Critical Path" />
                                      )}
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
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground bg-slate-50">
                    No schedule data available. Add items in WBS to generate
                    Gantt chart.
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
                    {reminders.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border bg-white shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className="font-medium text-sm line-clamp-1"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <Badge
                            variant={
                              item.daysLeft < 3 ? "destructive" : "outline"
                            }
                            className="text-[10px]"
                          >
                            {item.daysLeft < 0
                              ? "Overdue"
                              : `${item.daysLeft} days`}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between items-center">
                          <span className="capitalize text-slate-500 bg-slate-100 px-1 rounded">
                            {item.type}
                          </span>
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

      {/* Edit WBS Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-600" />
              Edit WBS Item
            </DialogTitle>
            <DialogDescription>
              Update the name and dates for this item
              {editingItem && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Type: <span className="capitalize font-medium">{editingItem.type}</span>
                  {editingItem.hierarchicalNumber && (
                    <> • Number: <span className="font-medium">{editingItem.hierarchicalNumber}</span></>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input
                id="edit-name"
                placeholder="Enter item name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            {editForm.startDate && editForm.endDate && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration:{" "}
                {differenceInDays(
                  parseISO(editForm.endDate),
                  parseISO(editForm.startDate)
                ) + 1}{" "}
                days
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingItem(null);
                setEditForm({ name: "", startDate: "", endDate: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reminder</DialogTitle>
            <DialogDescription>
              Set a reminder or update deadline for{" "}
              <strong>{reminderForm.itemName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="r-date" className="text-right">
                Deadline
              </Label>
              <Input
                id="r-date"
                type="date"
                className="col-span-3"
                value={reminderForm.date}
                onChange={(e) =>
                  setReminderForm({ ...reminderForm, date: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="r-note" className="text-right">
                Note
              </Label>
              <Textarea
                id="r-note"
                className="col-span-3"
                placeholder="Urgent check required..."
                value={reminderForm.note}
                onChange={(e) =>
                  setReminderForm({ ...reminderForm, note: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReminderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveReminder}>Save Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
