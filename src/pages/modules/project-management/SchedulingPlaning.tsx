"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchWbsByProject, updateWbsItem } from "@/redux/slices/wbsSlice";
import { fetchResources, ResourceAllocation } from "@/redux/slices/resourceSlice";
import { createReminder, fetchReminders } from "@/redux/slices/reminderSlice";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ShieldAlert,
  TrendingUp,
  FileText,
  Users,
  BarChart3,
} from "lucide-react";
import { calculateCPM, CPMResult } from "@/components/CPM";
import {
  addDays,
  format,
  isAfter,
  isBefore,
  parseISO,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import { toast } from "sonner";
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
} from "recharts";

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
import { usePermission } from "@/hooks/userPermission";

interface ReminderForm {
  itemId: string;
  itemName: string;
  date: string;
  note: string;
}

// Helper functions for localStorage management
const getCustomSequencesKey = (projectId: string | null) => {
  return projectId ? `customSequences_${projectId}` : 'customSequences_default';
};

// Load custom sequences from localStorage
const loadCustomSequences = (projectId: string | null): Record<string, number> => {
  try {
    const key = getCustomSequencesKey(projectId);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading custom sequences from localStorage:', error);
  }
  return {};
};

// Save custom sequences to localStorage
const saveCustomSequences = (projectId: string | null, sequences: Record<string, number>) => {
  try {
    const key = getCustomSequencesKey(projectId);
    localStorage.setItem(key, JSON.stringify(sequences));
  } catch (error) {
    console.error('Error saving custom sequences to localStorage:', error);
  }
};

export default function SchedulingPlanning() {
  const dispatch = useDispatch<AppDispatch>();

  const canView = usePermission('schedulingPlanning', 'view');

  const { projects, loading: projectsLoading } = useSelector(
    (state: RootState) => state.projects
  );
  const { wbs, loading: wbsLoading } = useSelector(
    (state: RootState) => state.wbs
  );
  const { resources, loading: resourcesLoading } = useSelector(
    (state: RootState) => state.resources
  );
  const { reminders: dbReminders, loading: remindersLoading } = useSelector(
    (state: RootState) => state.reminders
  );
  const [customSequences, setCustomSequences] = useState<
    Record<string, number>
  >(() => loadCustomSequences(null));
  const [customHierarchicalNumbers, setCustomHierarchicalNumbers] = useState<
    Record<string, string>
  >({});
  const [editingNumberId, setEditingNumberId] = useState<string | null>(null);
  const [editingNumberValue, setEditingNumberValue] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [searchText, setSearchText] = useState("");
  const [cprSearch, setCprSearch] = useState("");
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
  const [activeTab, setActiveTab] = useState<"schedule" | "critical-path" | "workload" | "calendar">("schedule");
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");

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

  // 3. Fetch WBS and load custom sequences for selected project
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWbsByProject(selectedProjectId));
      dispatch(fetchResources({ projectId: selectedProjectId, search: "" }));
      dispatch(fetchReminders({ projectId: selectedProjectId }));
      // Load custom sequences for this project from localStorage
      const loadedSequences = loadCustomSequences(selectedProjectId);
      setCustomSequences(loadedSequences);
      setCustomHierarchicalNumbers({});
    }
  }, [selectedProjectId, dispatch]);

  // 4. Auto-sync reminders to notifications when reminders change
  useEffect(() => {
    if (dbReminders.length > 0 && selectedProjectId) {
      // Sync reminders to notifications for the bell icon
      syncRemindersToNotifications();
    }
  }, [dbReminders, selectedProjectId]);

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

  // Workload Forecast Calculations
  const projectResources = useMemo(
    () => resources.filter((r) => r.projectId === selectedProjectId),
    [resources, selectedProjectId]
  );

  const workloadByType = useMemo(() => {
    const grouped: Record<string, { count: number; totalCost: number; totalDuration: number }> = {
      manpower: { count: 0, totalCost: 0, totalDuration: 0 },
      equipment: { count: 0, totalCost: 0, totalDuration: 0 },
      material: { count: 0, totalCost: 0, totalDuration: 0 },
    };

    projectResources.forEach((res) => {
      const type = res.resourceType;
      if (grouped[type]) {
        grouped[type].count += 1;
        grouped[type].totalCost += res.totalCost || 0;
        grouped[type].totalDuration += res.duration || 0;
      }
    });

    return Object.entries(grouped).map(([type, data]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      count: data.count,
      cost: data.totalCost,
      duration: data.totalDuration,
    }));
  }, [projectResources]);

  const weeklyWorkload = useMemo(() => {
    if (!selectedProject?.startDate || projectResources.length === 0) return [];

    const startDate = parseISO(selectedProject.startDate);
    const endDate = selectedProject.endDate
      ? parseISO(selectedProject.endDate)
      : addDays(startDate, 90);

    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 }
    ).slice(0, 12); // Show next 12 weeks

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekKey = format(weekStart, "MMM dd");

      let manpower = 0;
      let equipment = 0;
      let material = 0;

      projectResources.forEach((res) => {
        const resStart = res.startDate ? parseISO(res.startDate) : null;
        const resEnd = res.endDate ? parseISO(res.endDate) : null;

        if (resStart && resEnd) {
          // Check if resource allocation overlaps with this week
          if (resStart <= weekEnd && resEnd >= weekStart) {
            if (res.resourceType === "manpower") {
              manpower += res.quantity || 0;
            } else if (res.resourceType === "equipment") {
              equipment += res.quantity || 0;
            } else if (res.resourceType === "material") {
              material += res.quantity || 0;
            }
          }
        }
      });

      return {
        week: weekKey,
        Manpower: manpower,
        Equipment: equipment,
        Material: material,
      };
    });
  }, [projectResources, selectedProject]);

  // Calendar Events for Calendar Report


  const calendarEvents = useMemo(() => {
    const events: Array<{
      date: Date;
      title: string;
      type: string;
      status: string;
      id: string;
      isCritical?: boolean;
    }> = [];

    wbs.forEach((item) => {
      if (item.startDate) {
        events.push({
          date: parseISO(item.startDate),
          title: item.name,
          type: item.type || "task",
          status: item.status || "not-started",
          id: item.id,
          isCritical: cpmData?.criticalPathIds.includes(item.id) || false,
        });
      }
      if (item.endDate && item.endDate !== item.startDate) {
        events.push({
          date: parseISO(item.endDate),
          title: `${item.name} (End)`,
          type: item.type || "task",
          status: item.status || "not-started",
          id: `${item.id}-end`,
          isCritical: cpmData?.criticalPathIds.includes(item.id) || false,
        });
      }
    });

    // Add resource allocation dates
    projectResources.forEach((res) => {
      if (res.startDate) {
        events.push({
          date: parseISO(res.startDate),
          title: `Resource: ${res.resourceName}`,
          type: "resource",
          status: "active",
          id: `res-${res._id}`,
        });
      }
      if (res.endDate) {
        events.push({
          date: parseISO(res.endDate),
          title: `Resource End: ${res.resourceName}`,
          type: "resource",
          status: "completed",
          id: `res-${res._id}-end`,
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [wbs, projectResources, cpmData]);

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
        saveCustomSequences(selectedProjectId, next);
        return next;
      });
      return;
    }

    const num = parseInt(newVal);
    if (!isNaN(num)) {
      setCustomSequences((prev) => {
        const updated = { ...prev, [id]: num };
        saveCustomSequences(selectedProjectId, updated);
        return updated;
      });
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
      // Display number will be calculated after sorting
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

    // Sort items within groups: Priority numbers first, then by date
    Object.keys(groupedFeatures).forEach((group) => {
      groupedFeatures[group].sort((a, b) => {
        // Check if items have manual priority numbers
        const hasPriorityA = customSequences[a.id] !== undefined;
        const hasPriorityB = customSequences[b.id] !== undefined;

        // If both have priority numbers, sort by priority
        if (hasPriorityA && hasPriorityB) {
          return customSequences[a.id] - customSequences[b.id];
        }

        // If only A has priority, A comes first
        if (hasPriorityA && !hasPriorityB) {
          return -1;
        }

        // If only B has priority, B comes first
        if (!hasPriorityA && hasPriorityB) {
          return 1;
        }

        // If neither has priority, sort by start date
        if (!hasPriorityA && !hasPriorityB) {
          const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
          const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;
          return dateA - dateB;
        }

        // Fallback to hierarchical number comparison
        const numA = a.hierarchicalNumber || "";
        const numB = b.hierarchicalNumber || "";
        return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
      });

      // After sorting, assign sequential numbers to non-priority items
      // Find the maximum priority number in this group
      let maxPriority = 0;
      groupedFeatures[group].forEach((item) => {
        if (customSequences[item.id] !== undefined) {
          maxPriority = Math.max(maxPriority, customSequences[item.id]);
        }
      });

      // Assign sequential numbers to non-priority items starting from maxPriority + 1
      let sequentialCounter = maxPriority;
      groupedFeatures[group].forEach((item) => {
        if (customSequences[item.id] === undefined) {
          sequentialCounter++;
          item.sequence = sequentialCounter.toString();
        } else {
          // Keep priority number as is
          item.sequence = customSequences[item.id].toString();
        }
      });
    });

    return groupedFeatures;
  }, [wbs, cpmData, viewMode, selectedProject, customSequences, generateHierarchicalNumbering]);

  // --- Sorted List for Table View ---
  const sortedItemsList = useMemo(() => {
    if (!ganttData || Object.keys(ganttData).length === 0) return [];

    const allItems: any[] = [];
    Object.entries(ganttData).forEach(([group, items]) => {
      items.forEach((item) => {
        allItems.push({ ...item, group });
      });
    });

    allItems.sort((a, b) => {
      const hasPriorityA = customSequences[a.id] !== undefined;
      const hasPriorityB = customSequences[b.id] !== undefined;

      if (hasPriorityA && hasPriorityB) {
        return customSequences[a.id] - customSequences[b.id];
      }
      if (hasPriorityA && !hasPriorityB) return -1;
      if (!hasPriorityA && hasPriorityB) return 1;

      const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
      const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;

      return dateA - dateB;
    });

    return allItems;
  }, [ganttData, customSequences]);
  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return sortedItemsList;

    return sortedItemsList.filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [sortedItemsList, searchText]);


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

  // Combine WBS reminders with database reminders
  const allReminders = useMemo(() => {
    const today = new Date();
    
    // Add WBS-based reminders (existing logic)
    const wbsReminders = reminders.map((item) => ({
      id: `wbs_${item.id}`,
      name: item.name,
      type: item.type || 'task',
      endDate: item.endDate,
      daysLeft: item.daysLeft,
      projectName: selectedProject?.name || 'Current Project',
      wbsName: item.name,
      note: item.description?.includes("[REMINDER]") ? 
        item.description.split("[REMINDER]:")[1]?.split("due")[0]?.trim() : '',
      source: 'wbs'
    }));
    
    // Add database reminders
    const databaseReminders = dbReminders
      .filter((reminder) => {
        const deadlineDate = new Date(reminder.deadline);
        const daysDiff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= -1 && daysDiff <= 30; // Show overdue (1 day) and upcoming (30 days)
      })
      .map((reminder) => {
        const deadlineDate = new Date(reminder.deadline);
        const daysDiff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: `db_${reminder._id}`,
          name: reminder.title,
          type: reminder.reminderType || 'deadline',
          endDate: reminder.deadline,
          daysLeft: daysDiff,
          projectName: reminder.projectId?.name || 'Unknown Project',
          wbsName: reminder.wbsId?.name || 'Unknown Task',
          note: reminder.note,
          source: 'database'
        };
      });
    
    // Combine and sort by urgency
    return [...wbsReminders, ...databaseReminders]
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [reminders, dbReminders, selectedProject]);

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
  // const filteredIds = cpmData?.criticalPathIds?.filter((taskId) => {
  //   const task = wbs.find((t) => t.id === taskId);
  //   return task?.name?.toLowerCase().includes(cprSearch.toLowerCase());
  // }) ?? [];


  // Sync reminders to notifications
  const syncRemindersToNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const BASE_URL = 'http://localhost:4000'; // Backend URL
      const response = await fetch(`${BASE_URL}/test/sync-reminders-to-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cleanOld: true })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Reminders synced to notifications:', data);
      }
    } catch (error) {
      console.error('Error syncing reminders to notifications:', error);
    }
  };

  const handleSaveReminder = async () => {
    if (!reminderForm.itemId) return;
    const item = wbs.find((i) => i.id === reminderForm.itemId);
    if (item) {
      // 1. Update WBS item description and end date
      const newDesc =
        (item.description || "") +
        `\n[REMINDER]: ${reminderForm.note} due ${reminderForm.date}`;
      await dispatch(
        updateWbsItem({
          id: reminderForm.itemId,
          data: { description: newDesc, endDate: reminderForm.date },
        })
      );
      
      // 2. Create actual reminder in database
      const reminderData = {
        projectId: selectedProjectId,
        wbsId: reminderForm.itemId,
        title: `Reminder: ${reminderForm.itemName}`,
        note: reminderForm.note,
        deadline: new Date(reminderForm.date),
        reminderType: "deadline"
      };
      
      console.log('🔔 Creating reminder:', reminderData);
      await dispatch(createReminder(reminderData));
      
      toast.success("Reminder set successfully!");
      setReminderDialogOpen(false);
      
      // 3. Refresh reminders list
      dispatch(fetchReminders());
      
      // 4. Sync to notifications after creating reminder
      setTimeout(() => syncRemindersToNotifications(), 1000);
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
      // Remove custom priority number (revert to auto-generated)
      setCustomSequences((prev) => {
        const next = { ...prev };
        delete next[itemId];
        saveCustomSequences(selectedProjectId, next);
        return next;
      });
      toast.success("Priority reset - will sort by date");
    } else {
      // Accept simple priority number (1, 2, 3, etc.)
      const priorityNum = parseInt(trimmedValue);
      if (isNaN(priorityNum) || priorityNum < 1) {
        toast.error("Please enter a valid positive number (1, 2, 3, etc.)");
        return;
      }

      // Check for duplicate priority (same priority should not be assigned to multiple items)
      const existingItemWithSamePriority = Object.entries(customSequences).find(
        ([id, priority]) => id !== itemId && priority === priorityNum
      );

      if (existingItemWithSamePriority) {
        const [existingId] = existingItemWithSamePriority;
        const existingItem = wbs.find((item) => item.id === existingId);
        toast.error(`Priority ${priorityNum} is already assigned to "${existingItem?.name || 'another item'}". Please use a different priority number.`);
        return;
      }

      // Save priority number for sorting
      setCustomSequences((prev) => {
        const updated = { ...prev, [itemId]: priorityNum };
        saveCustomSequences(selectedProjectId, updated);
        return updated;
      });

      toast.success(`Priority ${priorityNum} set - item will appear in priority order`);
    }

    setEditingNumberId(null);
    setEditingNumberValue("");
  };

  const handleNumberEditCancel = () => {
    setEditingNumberId(null);
    setEditingNumberValue("");
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "schedule" | "critical-path" | "workload" | "calendar")} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="schedule">Schedule & Planning</TabsTrigger>
          <TabsTrigger value="critical-path">Critical Path Report</TabsTrigger>
          <TabsTrigger value="workload">Workload Forecast</TabsTrigger>
          <TabsTrigger value="calendar">Project Calendar</TabsTrigger>
        </TabsList>

        {/* Schedule & Planning Tab */}
        <TabsContent value="schedule" className="space-y-6 mt-6">
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
                        className={`flex-1 text-xs h-8 ${viewMode === "cpm"
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
                                        <div className="w-20 shrink-0 flex items-center justify-center pl-2">
                                          {editingNumberId === item.id ? (
                                            <div className="flex items-center gap-1">
                                              <Input
                                                type="number"
                                                min="1"
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
                                                placeholder="Priority"
                                                className="h-7 w-20 text-xs px-1.5 py-0.5 text-center font-bold"
                                                autoFocus
                                              />
                                            </div>
                                          ) : (
                                            <div className="flex flex-col items-center gap-0.5">
                                              {customSequences[item.id] ? (
                                                <span
                                                  className="text-xs font-bold text-white bg-blue-600 px-2 py-1 rounded-md border border-blue-700 shadow-sm cursor-pointer hover:bg-blue-700 transition-colors"
                                                  onClick={() => handleNumberEditStart(item.id, customSequences[item.id].toString())}
                                                  title="Click to edit priority number"
                                                >
                                                  P{customSequences[item.id]}
                                                </span>
                                              ) : (
                                                <span
                                                  className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-300 cursor-pointer hover:bg-slate-200 transition-colors"
                                                  onClick={() => handleNumberEditStart(item.id, "")}
                                                  title="Click to set priority number (or leave empty to sort by date)"
                                                >
                                                  {item.sequence ? `P${item.sequence}` : item.hierarchicalNumber}
                                                </span>
                                              )}
                                              {!customSequences[item.id] && (
                                                <span className="text-[9px] text-slate-400">Date</span>
                                              )}
                                            </div>
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
                                            title={`${customSequences[item.id] ? `Priority ${customSequences[item.id]}` : item.sequence ? `P${item.sequence}` : item.hierarchicalNumber}: ${item.name} (${item.type})`}
                                          >
                                            {/* Priority or Hierarchical Number Badge */}
                                            {customSequences[item.id] ? (
                                              <span className="font-bold text-xs bg-blue-600 text-white px-2 py-0.5 rounded-md border border-blue-700 shrink-0 shadow-sm">
                                                P{customSequences[item.id]}
                                              </span>
                                            ) : (
                                              <span className="font-bold text-xs bg-white/40 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/60 shrink-0 shadow-sm">
                                                {item.sequence ? `P${item.sequence}` : item.hierarchicalNumber}
                                              </span>
                                            )}

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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                          <Bell className="w-5 h-5" /> Reminders
                        </CardTitle>
                        <CardDescription>Upcoming Deadlines</CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={syncRemindersToNotifications}
                        className="text-xs"
                        title="Sync reminders to notification bell"
                      >
                        🔔 Sync to Bell
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4">
                    {remindersLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p>Loading reminders...</p>
                      </div>
                    ) : allReminders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No pending reminders.</p>
                        <p className="text-xs mt-1">Create reminders for your tasks to see them here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {allReminders.map((item) => (
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
                                  item.daysLeft < 0 ? "destructive" : 
                                  item.daysLeft === 0 ? "destructive" :
                                  item.daysLeft < 3 ? "secondary" : "outline"
                                }
                                className="text-[10px]"
                              >
                                {item.daysLeft < 0
                                  ? "Overdue"
                                  : item.daysLeft === 0
                                  ? "Today"
                                  : `${item.daysLeft} days`}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                <span className="capitalize text-slate-500 bg-slate-100 px-1 rounded">
                                  {item.type}
                                </span>
                                {item.source === 'database' && (
                                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-medium">
                                    DB
                                  </span>
                                )}
                              </div>
                              <span className="flex items-center gap-1">
                                {format(parseISO(item.endDate), "MMM dd")}
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                            {item.note && (
                              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                {item.note}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">{item.projectName}</span> • {item.wbsName}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sorted Items Table */}
              {ganttData && Object.keys(ganttData).length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Schedule Items (Sorted by Order)</CardTitle>
                        <CardDescription>
                          All items sorted by priority and date order
                        </CardDescription>
                      </div>

                      <div className="flex justify-end mb-4">
                        <Input
                          placeholder="Search tasks..."
                          className="w-64"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                        />
                      </div>

                    </div>

                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Order</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Group</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Badge
                                  variant={customSequences[item.id] ? "default" : "outline"}
                                  className={
                                    customSequences[item.id]
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-700"
                                  }
                                >
                                  {customSequences[item.id]
                                    ? `P${customSequences[item.id]}`
                                    : item.sequence
                                      ? `P${item.sequence}`
                                      : item.hierarchicalNumber || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {item.group}
                              </TableCell>
                              <TableCell>
                                {item.startAt
                                  ? format(new Date(item.startAt), "MMM dd, yyyy")
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {item.endAt
                                  ? format(new Date(item.endAt), "MMM dd, yyyy")
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.status === "completed"
                                      ? "default"
                                      : item.status === "in-progress"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className={
                                    item.status === "completed"
                                      ? "bg-green-600 text-white"
                                      : item.status === "in-progress"
                                        ? "bg-blue-600 text-white"
                                        : ""
                                  }
                                >
                                  {item.status || "not-started"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.startAt && item.endAt
                                  ? `${differenceInDays(new Date(item.endAt), new Date(item.startAt)) + 1} days`
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Critical Path Report Tab */}
        <TabsContent value="critical-path" className="space-y-6 mt-6">
          {!selectedProjectId ? (
            <Card className="h-96 flex items-center justify-center bg-slate-50 border-dashed">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Please select a project to view the critical path report.</p>
              </div>
            </Card>
          ) : cpmData && cpmData.criticalPathIds.length > 0 ? (
            <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50/30 to-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-red-900 flex items-center gap-2">
                        Critical Path Report
                        <Badge variant="destructive" className="ml-2">
                          {cpmData?.criticalPathIds?.length ?? 0} Tasks
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Tasks on the critical path determine the minimum project duration
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-700">
                      Project Duration
                    </div>
                    <div className="text-2xl font-bold text-red-900">
                      {cpmData.projectDuration} Days
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-5">

                {/* SEARCH BAR */}
                <div className="flex justify-end mb-3">
                  <Input
                    placeholder="Search Critical Path..."
                    className="w-64"
                    value={cprSearch}
                    onChange={(e) => setCprSearch(e.target.value)}
                  />
                </div>

                {/* FILTERED LIST */}
                {(() => {
                  const filteredIds = cpmData?.criticalPathIds?.filter((taskId) => {
                    const task = wbs.find((t) => t.id === taskId);
                    return task?.name?.toLowerCase().includes(cprSearch.toLowerCase());
                  }) ?? [];

                  return (
                    <>
                      {/* TABLE */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Group</TableHead>
                              <TableHead>Start</TableHead>
                              <TableHead>End</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Slack</TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {filteredIds.map((taskId, index) => {
                              const task = wbs.find((t) => t.id === taskId);
                              const cpmResult = cpmData.taskResults[taskId];
                              if (!task || !cpmResult) return null;

                              const parent = task.parentId
                                ? wbs.find((t) => t.id === task.parentId)
                                : null;

                              const groupName = parent
                                ? parent.name
                                : task.type === "phase"
                                  ? "Phases & Milestones"
                                  : "General";

                              return (
                                <TableRow key={taskId} className="hover:bg-red-50/50 border-l-4 border-l-red-500">
                                  <TableCell>
                                    <Badge variant="destructive" className="bg-red-600 text-white">
                                      {index + 1}
                                    </Badge>
                                  </TableCell>

                                  <TableCell className="font-medium flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-red-600" />
                                    {task.name}
                                  </TableCell>

                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {task.type || "task"}
                                    </Badge>
                                  </TableCell>

                                  <TableCell className="text-sm">{groupName}</TableCell>

                                  <TableCell>
                                    {task.startDate
                                      ? format(parseISO(task.startDate), "MMM dd, yyyy")
                                      : "-"}
                                  </TableCell>

                                  <TableCell>
                                    {task.endDate
                                      ? format(parseISO(task.endDate), "MMM dd, yyyy")
                                      : "-"}
                                  </TableCell>

                                  <TableCell>
                                    <Badge
                                      variant={
                                        task.status === "completed"
                                          ? "default"
                                          : task.status === "in-progress"
                                            ? "secondary"
                                            : "outline"
                                      }
                                      className={
                                        task.status === "completed"
                                          ? "bg-green-600 text-white"
                                          : task.status === "in-progress"
                                            ? "bg-blue-600 text-white"
                                            : ""
                                      }
                                    >
                                      {task.status || "not-started"}
                                    </Badge>
                                  </TableCell>

                                  <TableCell>{cpmResult.ef - cpmResult.es} days</TableCell>

                                  <TableCell>
                                    <Badge variant="destructive" className="bg-red-600 text-white">
                                      {cpmResult.slack <= 0.001
                                        ? "0"
                                        : `${cpmResult.slack.toFixed(1)} days`}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* CRITICAL PATH FLOW */}
                      <div className="mt-6 p-4 bg-white rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-red-600" />
                          <h3 className="font-semibold text-red-900">Critical Path Flow</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg overflow-x-auto">
                          {filteredIds.map((taskId, index) => {
                            const task = wbs.find((t) => t.id === taskId);
                            if (!task) return null;

                            return (
                              <React.Fragment key={taskId}>
                                <div className="px-3 py-2 bg-red-500 text-white rounded-lg shadow-md min-w-[120px] text-center border-2 border-red-600">
                                  <div className="font-bold">{index + 1}</div>
                                  <div className="text-xs truncate">{task.name}</div>
                                  <div className="text-xs mt-1 opacity-90">
                                    {cpmData.taskResults[taskId]?.ef -
                                      cpmData.taskResults[taskId]?.es}{" "}
                                    days
                                  </div>
                                </div>
                                {index < filteredIds.length - 1 && (
                                  <ArrowRight className="w-5 h-5 text-red-500" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>

                      {/* SUMMARY */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
                          <CardContent className="p-4">
                            <div className="text-xs uppercase mb-1">Total Critical Tasks</div>
                            <div className="text-2xl font-bold text-red-700">{filteredIds.length}</div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
                          <CardContent className="p-4">
                            <div className="text-xs uppercase mb-1">Project Duration</div>
                            <div className="text-2xl font-bold text-red-700">
                              {cpmData.projectDuration} Days
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
                          <CardContent className="p-4">
                            <div className="text-xs uppercase mb-1">Total Tasks</div>
                            <div className="text-2xl font-bold text-slate-700">{wbs.length}</div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
                          <CardContent className="p-4">
                            <div className="text-xs uppercase mb-1">Critical Path %</div>
                            <div className="text-2xl font-bold text-red-700">
                              {wbs.length > 0
                                ? Math.round((filteredIds.length / wbs.length) * 100)
                                : 0}
                              %
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-96 flex items-center justify-center bg-slate-50 border-dashed">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No critical path tasks found for this project.</p>
              </div>
            </Card>
          )}
        </TabsContent>



        {/* Workload Forecast Report Tab */}
        <TabsContent value="workload" className="space-y-6 mt-6">
          {!selectedProjectId ? (
            <Card className="h-96 flex items-center justify-center bg-slate-50 border-dashed">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Please select a project to view the workload forecast report.</p>
              </div>
            </Card>
          ) : (
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/30 to-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
                        Workload Forecast Report
                        <Badge variant="outline" className="ml-2 border-blue-300 text-blue-700">
                          {resources.length} Allocations
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Resource allocation and workload distribution over time
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {projectResources.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No resource allocations found. Add resources in the Resources page.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                        <CardContent className="p-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Total Allocations
                          </div>
                          <div className="text-2xl font-bold text-blue-700">
                            {projectResources.length}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                        <CardContent className="p-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Total Cost
                          </div>
                          <div className="text-2xl font-bold text-green-700">
                            ₹{projectResources.reduce((sum, r) => sum + (r.totalCost || 0), 0).toLocaleString('en-IN')}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                        <CardContent className="p-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Resource Types
                          </div>
                          <div className="text-2xl font-bold text-purple-700">
                            {workloadByType.filter((w) => w.count > 0).length}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
                        <CardContent className="p-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Avg Duration
                          </div>
                          <div className="text-2xl font-bold text-orange-700">
                            {projectResources.length > 0
                              ? Math.round(
                                projectResources.reduce((sum, r) => sum + (r.duration || 0), 0) /
                                projectResources.length
                              )
                              : 0}{" "}
                            {projectResources[0]?.durationUnit || "days"}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Workload by Type Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          Resource Distribution by Type
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={workloadByType.filter((w) => w.count > 0)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#3b82f6" name="Allocations" />
                            <Bar dataKey="cost" fill="#10b981" name="Total Cost (₹)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Resource Allocation Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Resource Allocations</CardTitle>
                        <CardDescription>
                          Detailed view of all resource allocations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Resource</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>WBS Task</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Total Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {projectResources.slice(0, 10).map((res) => (
                                <TableRow key={res._id}>
                                  <TableCell className="font-medium">
                                    {res.resourceName}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {res.resourceType}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {res.wbsName || "-"}
                                  </TableCell>
                                  <TableCell>
                                    {res.quantity} {res.unit}
                                  </TableCell>
                                  <TableCell>
                                    {res.duration} {res.durationUnit}
                                  </TableCell>
                                  <TableCell>
                                    {res.startDate
                                      ? format(parseISO(res.startDate), "MMM dd, yyyy")
                                      : "-"}
                                  </TableCell>
                                  <TableCell>
                                    {res.endDate
                                      ? format(parseISO(res.endDate), "MMM dd, yyyy")
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    ₹{res.totalCost.toLocaleString("en-IN")}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {projectResources.length > 10 && (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              Showing 10 of {projectResources.length} allocations
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Project Calendar Report Tab */}
        <TabsContent value="calendar" className="space-y-6 mt-6">
          {!selectedProjectId ? (
            <Card className="h-96 flex items-center justify-center bg-slate-50 border-dashed">
              <div className="text-center text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Please select a project to view the calendar.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Calendar View Controls */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      Project Calendar Report
                    </CardTitle>
                    <div className="flex gap-2">
                      <Select
                        value={calendarView}
                        onValueChange={(v: "month" | "week") => setCalendarView(v)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Month View</SelectItem>
                          <SelectItem value="week">Week View</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <CardDescription>
                    View all project events, tasks, milestones, and deadlines in calendar format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Get current month/week dates
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();

                    // Generate calendar days
                    const generateCalendarDays = () => {
                      const firstDay = new Date(currentYear, currentMonth, 1);
                      const lastDay = new Date(currentYear, currentMonth + 1, 0);
                      const startDate = startOfWeek(firstDay, { weekStartsOn: 1 });
                      const endDate = endOfWeek(lastDay, { weekStartsOn: 1 });

                      const days: Date[] = [];
                      let current = new Date(startDate);

                      while (current <= endDate) {
                        days.push(new Date(current));
                        current = addDays(current, 1);
                      }

                      return days;
                    };

                    const calendarDays = generateCalendarDays();
                    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

                    return (
                      <div className="space-y-4">
                        {/* Month Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold">
                            {format(new Date(currentYear, currentMonth, 1), "MMMM yyyy")}
                          </h3>
                          {selectedProject && (
                            <div className="text-sm text-muted-foreground">
                              Project: {selectedProject.name}
                            </div>
                          )}
                        </div>

                        {/* Calendar Grid */}
                        <div className="border rounded-lg overflow-hidden">
                          {/* Week Day Headers */}
                          <div className="grid grid-cols-7 bg-slate-100 border-b">
                            {weekDays.map((day) => (
                              <div
                                key={day}
                                className="p-2 text-center font-semibold text-sm text-slate-700"
                              >
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Calendar Days */}
                          <div className="grid grid-cols-7">
                            {calendarDays.map((day, index) => {
                              const dayEvents = calendarEvents.filter(
                                (e) =>
                                  format(e.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                              );
                              const isCurrentMonth = day.getMonth() === currentMonth;
                              const isToday =
                                format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

                              return (
                                <div
                                  key={index}
                                  className={`min-h-[100px] border-r border-b p-2 ${!isCurrentMonth ? "bg-slate-50 opacity-50" : "bg-white"
                                    } ${isToday ? "bg-blue-50 border-blue-300" : ""}`}
                                >
                                  <div
                                    className={`text-sm font-semibold mb-1 ${isToday
                                      ? "text-blue-600"
                                      : isCurrentMonth
                                        ? "text-slate-900"
                                        : "text-slate-400"
                                      }`}
                                  >
                                    {format(day, "d")}
                                  </div>
                                  <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map((event) => (
                                      <div
                                        key={event.id}
                                        className={`text-xs p-1 rounded truncate ${event.isCritical
                                          ? "bg-red-100 text-red-900 border border-red-300"
                                          : event.type === "phase"
                                            ? "bg-slate-800 text-white"
                                            : event.type === "activity"
                                              ? "bg-indigo-100 text-indigo-900"
                                              : event.type === "resource"
                                                ? "bg-green-100 text-green-900"
                                                : "bg-blue-100 text-blue-900"
                                          }`}
                                        title={event.title}
                                      >
                                        {event.title.length > 15
                                          ? `${event.title.substring(0, 15)}...`
                                          : event.title}
                                      </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                      <div className="text-xs text-muted-foreground">
                                        +{dayEvents.length - 3} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-800 rounded"></div>
                            <span className="text-sm">Phase</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-indigo-100 border border-indigo-300 rounded"></div>
                            <span className="text-sm">Activity</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                            <span className="text-sm">Task</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                            <span className="text-sm">Critical Path</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                            <span className="text-sm">Resource</span>
                          </div>
                        </div>

                        {/* Events Summary */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Upcoming Events</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {calendarEvents
                                .filter((e) => e.date >= today)
                                .slice(0, 10)
                                .map((event) => (
                                  <div
                                    key={event.id}
                                    className="flex items-center gap-3 p-2 border rounded-lg hover:bg-slate-50"
                                  >
                                    <div className="text-sm font-medium min-w-[100px]">
                                      {format(event.date, "MMM dd, yyyy")}
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`capitalize ${event.isCritical
                                        ? "border-red-300 text-red-700"
                                        : event.type === "phase"
                                          ? "bg-slate-800 text-white"
                                          : event.type === "activity"
                                            ? "bg-indigo-100 text-indigo-900"
                                            : event.type === "resource"
                                              ? "bg-green-100 text-green-900"
                                              : "bg-blue-100 text-blue-900"
                                        }`}
                                    >
                                      {event.type}
                                    </Badge>
                                    <div className="flex-1 text-sm">{event.title}</div>
                                    <Badge
                                      variant={
                                        event.status === "completed"
                                          ? "default"
                                          : event.status === "in-progress"
                                            ? "secondary"
                                            : "outline"
                                      }
                                    >
                                      {event.status}
                                    </Badge>
                                  </div>
                                ))}
                              {calendarEvents.filter((e) => e.date >= today).length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                  No upcoming events
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
