import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Pagination } from "../../../components/ui/pagination";
import { Plus, Play, Pause, WifiOff, AlertTriangle, Download, ShieldAlert } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchWorkOrders } from "@/redux/slices/production/workOrderSlice";
import { fetchWorkCenters } from "@/redux/slices/production/workCenterSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import { 
  fetchLogs, 
  createLog, 
  fetchDowntime, 
  createDowntime, 
  closeDowntime,
  fetchMaintenance,
  closeMaintenance,
  fetchQuality,
  completeQuality,
  clearError
} from "@/redux/slices/production/productionExecutionSlice";

/**
ProductionExecution.tsx — Advanced Shop Floor Control
Storage keys used (make sure these exist in your storage.ts):
- WORK_ORDERS
- WORK_LOGS
- DOWNTIME_EVENTS
- MAINTENANCE_REQUESTS
- QUALITY_CHECKS
- WORK_CENTERS
- EMPLOYEES
- ATTENDANCE
- (optional) INVENTORY, ISSUE_SLIPS (integration)
*/

type WorkOrder = any; // using any to keep integration flexible
type WorkLog = {
  id: string;
  workOrderId: string;
  operationId?: string; // if operation-level
  type: "start" | "stop" | "produce" | "reject" | "rework" | "downtime" | "attendance";
  operatorId?: string;
  workCenterId?: string;
  timestamp: string;
  durationMinutes?: number;
  producedQty?: number;
  rejectedQty?: number;
  reworkedQty?: number;
  notes?: string;
};

type DowntimeEvent = {
  id: string;
  workCenterId: string;
  machineId?: string; // Added machineId field
  start: string;
  end?: string;
  minutes?: number;
  reason: string;
  raisedBy?: string;
  maintenanceRequestId?: string;
};

type MaintenanceRequest = {
  id: string;
  workCenterId: string;
  machineId?: string; // Added machineId field
  reportedAt: string;
  status: "open" | "assigned" | "closed";
  description?: string;
  assignedTo?: string;
};

const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowISO = () => new Date().toISOString();

export default function ProductionExecution() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state for work orders, work centers, and WBS
  const { list: workOrders, loading: workOrdersLoading } = useSelector(
    (state: RootState) => state.workOrders
  );
  
  const { list: workCenters, loading: workCentersLoading } = useSelector(
    (state: RootState) => state.workCenters
  );
  
  const { wbs: wbsTasks, loading: wbsLoading } = useSelector(
    (state: RootState) => state.wbs
  );

  // Redux state for production execution with safety checks
  const productionExecutionState = useSelector((state: RootState) => state.productionExecution);
  const { 
    logs: workLogs = [], 
    downtime: downtimeEvents = [], 
    maintenance: maintenanceRequests = [], 
    quality: qualityChecks = [],
    loading: productionLoading = false,
    error: productionError = null,
    logsPagination = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    downtimePagination = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    maintenancePagination = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    qualityPagination = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
  } = productionExecutionState || {};

  // Additional safety checks for pagination data
  const safeLogsPagination = {
    currentPage: logsPagination?.currentPage || 1,
    totalPages: logsPagination?.totalPages || 1,
    totalItems: logsPagination?.totalItems || 0,
    itemsPerPage: logsPagination?.itemsPerPage || 10
  };
  
  const safeDowntimePagination = {
    currentPage: downtimePagination?.currentPage || 1,
    totalPages: downtimePagination?.totalPages || 1,
    totalItems: downtimePagination?.totalItems || 0,
    itemsPerPage: downtimePagination?.itemsPerPage || 10
  };
  
  const safeMaintenancePagination = {
    currentPage: maintenancePagination?.currentPage || 1,
    totalPages: maintenancePagination?.totalPages || 1,
    totalItems: maintenancePagination?.totalItems || 0,
    itemsPerPage: maintenancePagination?.itemsPerPage || 10
  };
  
  const safeQualityPagination = {
    currentPage: qualityPagination?.currentPage || 1,
    totalPages: qualityPagination?.totalPages || 1,
    totalItems: qualityPagination?.totalItems || 0,
    itemsPerPage: qualityPagination?.itemsPerPage || 10
  };

  // Debug logging
  console.log('Production Execution State:', {
    workLogs: workLogs.length,
    downtimeEvents: downtimeEvents.length,
    maintenanceRequests: maintenanceRequests.length,
    qualityChecks: qualityChecks.length,
    loading: productionLoading,
    error: productionError
  });

  // Filter state - must be declared before useEffect that uses them
  const [filterFrom, setFilterFrom] = useState<string>(() => {
    const d = new Date(); 
    d.setDate(d.getDate() - 30); // Expand to 30 days ago instead of 7
    return d.toISOString().slice(0, 10);
  });
  const [filterTo, setFilterTo] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Add 1 day to include today's data
    return d.toISOString().slice(0, 10);
  });

  // Keep only attendance in localStorage (HR functionality)
  const [attendance, setAttendance] = useState<any[]>(() => {
    const storedAttendance = storage.get(STORAGE_KEYS.ATTENDANCE, []);
    return Array.isArray(storedAttendance) ? storedAttendance : [];
  });

  // Pagination and search states for each table
  const [logsSearch, setLogsSearch] = useState("");
  const [downtimeSearch, setDowntimeSearch] = useState("");
  const [maintenanceSearch, setMaintenanceSearch] = useState("");
  const [qualitySearch, setQualitySearch] = useState("");

  // Get employees from storage (for operator selection)
  const employees = storage.get(STORAGE_KEYS.EMPLOYEES, []) || [];

  /* ---------- UI state ---------- */
  const [selectedWO, setSelectedWO] = useState<string | "">("");
  const [selectedWC, setSelectedWC] = useState<string | "">(() => {
    // Persist selected work center across refreshes
    return localStorage.getItem('selectedWorkCenter') || "";
  });
  const [selectedOp, setSelectedOp] = useState<string | "">(""); // operation id if work order has operations
  const [selectedOperator, setSelectedOperator] = useState<string | "">("");
  const [selectedMachine, setSelectedMachine] = useState<string | "">("");
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logForm, setLogForm] = useState<Partial<WorkLog>>({});
  const [downtimeDialogOpen, setDowntimeDialogOpen] = useState(false);
  const [downtimeForm, setDowntimeForm] = useState<Partial<DowntimeEvent>>({});
  // timers: map of workLog start timestamps for each running WO id (ms)
  const timersRef = useRef<Record<string, number>>({});

  const canView = usePermission("productionExecution", "view");
  const canCreate = usePermission("productionExecution", "create");
  const canEdit = usePermission("productionExecution", "edit");
  const canDelete = usePermission("productionExecution", "delete");

  // Fetch initial data on component mount
  useEffect(() => {
    console.log('🚀 Initial data fetch on component mount');
    dispatch(fetchWorkOrders());
    dispatch(fetchWorkCenters());
    dispatch(fetchMaintenance({ page: 1, limit: 10 }));
    dispatch(fetchQuality({ page: 1, limit: 10 }));
    
    // Also fetch logs and downtime with current filter
    dispatch(fetchLogs({ from: filterFrom, to: filterTo, page: 1, limit: 10 }));
    dispatch(fetchDowntime({ from: filterFrom, to: filterTo, page: 1, limit: 10 }));
  }, [dispatch]);

  // Persist selected work center to localStorage
  useEffect(() => {
    if (selectedWC) {
      localStorage.setItem('selectedWorkCenter', selectedWC);
    } else {
      localStorage.removeItem('selectedWorkCenter');
    }
  }, [selectedWC]);

  // Fetch WBS tasks when work centers are loaded and we have a persisted work center selection
  useEffect(() => {
    console.log('🔄 Work centers loaded, checking for persisted work center selection');
    
    if (workCenters.length > 0 && selectedWC && wbsTasks.length === 0) {
      const selectedWorkCenter = workCenters.find((wc: any) => wc._id === selectedWC);
      console.log('🏭 Found persisted work center, fetching WBS tasks:', {
        selectedWC,
        selectedWorkCenter,
        wbsTasksCount: selectedWorkCenter?.wbsTasks?.length || 0
      });

      if (selectedWorkCenter?.wbsTasks?.length > 0) {
        const projectIds = [...new Set(selectedWorkCenter.wbsTasks.map((task: any) => task.projectId).filter(Boolean))];
        console.log('📋 Fetching WBS for persisted work center projects:', projectIds);
        
        projectIds.forEach((projectId: string) => {
          if (projectId) {
            console.log('🚀 Fetching WBS for project:', projectId);
            dispatch(fetchWbsByProject(projectId));
          }
        });
      }
    }
  }, [workCenters, selectedWC, wbsTasks.length, dispatch]);

  // Refetch data when filters change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(fetchLogs({ from: filterFrom, to: filterTo, page: 1, limit: safeLogsPagination.itemsPerPage, search: logsSearch }));
      dispatch(fetchDowntime({ from: filterFrom, to: filterTo, page: 1, limit: safeDowntimePagination.itemsPerPage, search: downtimeSearch }));
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [dispatch, filterFrom, filterTo, logsSearch, downtimeSearch, safeLogsPagination.itemsPerPage, safeDowntimePagination.itemsPerPage]);

  // persist only attendance (HR functionality) - others are now in Redux
  useEffect(() => storage.set(STORAGE_KEYS.ATTENDANCE, attendance), [attendance]);

  // Fetch WBS tasks when work center is selected
  useEffect(() => {
    console.log('🔄 Work center selection changed:', selectedWC);
    
    if (selectedWC) {
      const selectedWorkCenter = workCenters.find((wc: any) => wc._id === selectedWC);
      console.log('🏭 Selected work center for WBS fetch:', {
        workCenter: selectedWorkCenter,
        wbsTasks: selectedWorkCenter?.wbsTasks,
        wbsTasksCount: selectedWorkCenter?.wbsTasks?.length || 0
      });

      if (selectedWorkCenter?.wbsTasks?.length && selectedWorkCenter.wbsTasks.length > 0) {
        // Get unique project IDs from WBS tasks
        const projectIds = [...new Set(selectedWorkCenter.wbsTasks.map((task: any) => task.projectId).filter(Boolean))];
        console.log('📋 Project IDs to fetch WBS for:', projectIds);
        
        if (projectIds.length > 0) {
          // Fetch WBS data for each project
          projectIds.forEach((projectId: string) => {
            if (projectId) {
              console.log('🚀 Fetching WBS for project:', projectId);
              dispatch(fetchWbsByProject(projectId));
            }
          });
        } else {
          console.log('⚠️ No project IDs found in WBS tasks, trying alternative approach');
          // Alternative: If no projectIds, try to get project info from work center or other sources
          // For now, let's log the WBS task structure to understand what's missing
          console.log('🔍 WBS Tasks structure analysis:', {
            wbsTasks: selectedWorkCenter.wbsTasks,
            firstTask: selectedWorkCenter.wbsTasks[0],
            taskKeys: selectedWorkCenter.wbsTasks[0] ? Object.keys(selectedWorkCenter.wbsTasks[0]) : []
          });
        }
      } else {
        console.log('❌ No WBS tasks found in selected work center');
      }
    } else {
      console.log('🔄 Work center deselected, clearing WBS context');
    }
  }, [selectedWC, workCenters, dispatch]);

  // Additional useEffect to ensure WBS tasks are fetched on component mount and refresh
  useEffect(() => {
    console.log('🔄 Component mounted/refreshed, checking if WBS tasks need to be fetched');
    
    // Wait for work centers to be loaded before trying to fetch WBS
    if (workCentersLoading) {
      console.log('⏳ Work centers still loading, waiting...');
      return;
    }
    
    // If we have a selected work center but no WBS tasks in Redux, try to fetch them
    if (selectedWC && wbsTasks.length === 0 && workCenters.length > 0) {
      const selectedWorkCenter = workCenters.find((wc: any) => wc._id === selectedWC);
      
      console.log('🔍 Checking WBS fetch conditions:', {
        selectedWC,
        selectedWorkCenter: !!selectedWorkCenter,
        wbsTasksInRedux: wbsTasks.length,
        workCentersLoaded: workCenters.length,
        workCenterWbsTasks: selectedWorkCenter?.wbsTasks?.length || 0
      });
      
      if (selectedWorkCenter?.wbsTasks?.length > 0) {
        console.log('🚀 Re-fetching WBS tasks after refresh');
        const projectIds = [...new Set(selectedWorkCenter.wbsTasks.map((task: any) => task.projectId).filter(Boolean))];
        
        console.log('📋 Project IDs found for re-fetch:', projectIds);
        
        if (projectIds.length > 0) {
          projectIds.forEach((projectId: string) => {
            if (projectId) {
              console.log('🚀 Re-fetching WBS for project:', projectId);
              dispatch(fetchWbsByProject(projectId));
            }
          });
        } else {
          console.log('⚠️ No project IDs found in WBS tasks after refresh');
        }
      } else {
        console.log('❌ No WBS tasks in selected work center after refresh');
      }
    }
  }, [selectedWC, workCenters, wbsTasks.length, workCentersLoading, dispatch]);

  // Force WBS fetch when work centers are loaded and we have a persisted work center selection
  useEffect(() => {
    console.log('🔄 Work centers loaded, checking persisted work center');
    
    if (!workCentersLoading && workCenters.length > 0 && selectedWC) {
      const selectedWorkCenter = workCenters.find((wc: any) => wc._id === selectedWC);
      
      console.log('🏭 Persisted work center check:', {
        selectedWC,
        foundWorkCenter: !!selectedWorkCenter,
        wbsTasksInRedux: wbsTasks.length,
        workCenterWbsTasks: selectedWorkCenter?.wbsTasks?.length || 0
      });
      
      // If work center exists but we don't have WBS tasks, fetch them
      if (selectedWorkCenter?.wbsTasks?.length > 0 && wbsTasks.length === 0) {
        console.log('🚀 Fetching WBS for persisted work center');
        const projectIds = [...new Set(selectedWorkCenter.wbsTasks.map((task: any) => task.projectId).filter(Boolean))];
        
        projectIds.forEach((projectId: string) => {
          if (projectId) {
            console.log('🚀 Fetching WBS for persisted project:', projectId);
            dispatch(fetchWbsByProject(projectId));
          }
        });
      }
    }
  }, [workCentersLoading, workCenters.length, selectedWC, wbsTasks.length, dispatch]);

  // Auto-select work center if work order has one assigned and clear operator selection when work center changes
  useEffect(() => {
    if (selectedWO) {
      const selectedWorkOrder = workOrders.find((wo: any) => wo._id === selectedWO);
      if (selectedWorkOrder?.workCenterId) {
        setSelectedWC(selectedWorkOrder.workCenterId);
        // Optional: Show a toast or notification that work center was auto-selected
      } else {
        setSelectedWC(""); // Clear selection if no assigned work center
      }
    } else {
      setSelectedWC(""); // Clear selection if no work order selected
    }
  }, [selectedWO, workOrders]);
  
  // Clear operator and machine selection when work center changes
  useEffect(() => {
    if (selectedWC) {
      // Clear operator and machine selection when work center changes to force re-selection
      setSelectedOperator("");
      setSelectedMachine("");
    } else {
      setSelectedOperator(""); // Clear selection if no work center selected
      setSelectedMachine(""); // Clear machine selection if no work center selected
    }
  }, [selectedWC]);

  // NOW all hooks are called, we can do conditional returns
  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
    );
  }

  // Show error if there's a production execution error
  if (productionError) {
    return (
      <div className="text-center py-12 px-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Production Data
        </h3>
        <p className="text-gray-600 mb-4">{productionError}</p>
        <Button onClick={() => {
          dispatch(clearError());
          dispatch(fetchLogs({ from: filterFrom, to: filterTo }));
          dispatch(fetchDowntime({ from: filterFrom, to: filterTo }));
          dispatch(fetchMaintenance());
          dispatch(fetchQuality());
        }}>
          Retry
        </Button>
      </div>
    );
  }
  
  // Filter work centers based on selected work order
  const availableWorkCenters = useMemo(() => {
    if (!selectedWO) {
      // If no work order selected, show all active work centers
      return workCenters.filter((wc: any) => wc.status === 'active');
    }
    
    const selectedWorkOrder = workOrders.find((wo: any) => wo._id === selectedWO);
    if (!selectedWorkOrder) {
      return workCenters.filter((wc: any) => wc.status === 'active');
    }
    
    // If work order has a specific work center assigned, show only that one
    if (selectedWorkOrder.workCenterId) {
      const assignedWorkCenter = workCenters.find((wc: any) => wc._id === selectedWorkOrder.workCenterId);
      return assignedWorkCenter ? [assignedWorkCenter] : [];
    }
    
    // If no specific work center assigned, show all active work centers
    return workCenters.filter((wc: any) => wc.status === 'active');
  }, [selectedWO, workOrders, workCenters]);

  // Get available operators based on selected work center's WBS tasks
  const availableOperators = useMemo(() => {
    console.log('🔍 Calculating available operators:', {
      selectedWC,
      workCentersCount: workCenters.length,
      wbsTasksCount: wbsTasks.length,
      employeesCount: employees?.length || 0
    });

    if (!selectedWC) {
      console.log('❌ No work center selected');
      return [];
    }
    
    const selectedWorkCenter = workCenters.find((wc: any) => wc._id === selectedWC);
    console.log('🏭 Selected work center DETAILED:', {
      workCenterId: selectedWC,
      workCenter: selectedWorkCenter,
      hasWbsTasks: !!selectedWorkCenter?.wbsTasks,
      wbsTasksCount: selectedWorkCenter?.wbsTasks?.length || 0,
      wbsTasks: selectedWorkCenter?.wbsTasks
    });

    if (!selectedWorkCenter) {
      console.log('❌ Work center not found in workCenters array');
      return [];
    }

    if (!selectedWorkCenter.wbsTasks || selectedWorkCenter.wbsTasks.length === 0) {
      console.log('❌ No WBS tasks in work center');
      return [];
    }
    
    // Get all assigned persons from WBS tasks in the selected work center
    const assignedPersons: any[] = [];
    
    selectedWorkCenter.wbsTasks.forEach((wcTask: any, index: number) => {
      console.log(`🔍 Processing WBS task ${index + 1}:`, {
        wcTask,
        wbsTaskId: wcTask.wbsTaskId,
        wbsTaskName: wcTask.wbsTaskName
      });
      
      // Find the actual WBS task from Redux store using the wbsTaskId
      const wbsTask = wbsTasks.find((task: any) => 
        task._id === wcTask.wbsTaskId || 
        task.id === wcTask.wbsTaskId ||
        task._id?.toString() === wcTask.wbsTaskId?.toString()
      );
      
      console.log(`📋 WBS Task ${index + 1} lookup result:`, {
        wcTaskId: wcTask.wbsTaskId,
        foundTask: !!wbsTask,
        wbsTaskName: wbsTask?.name,
        wbsTaskId: wbsTask?._id || wbsTask?.id,
        assignedPersonsCount: wbsTask?.assignedPersons?.length || 0,
        assignedPersons: wbsTask?.assignedPersons,
        fullWbsTask: wbsTask
      });

      if (wbsTask?.assignedPersons?.length > 0) {
        wbsTask.assignedPersons.forEach((person: any, personIndex: number) => {
          console.log(`👤 Processing assigned person ${personIndex + 1}:`, {
            person,
            resourceId: person.resourceId,
            name: person.personalInfo?.name,
            type: person.type,
            fullPerson: person
          });
          
          // Avoid duplicates based on resourceId
          if (!assignedPersons.find(p => p.resourceId === person.resourceId)) {
            const operatorData = {
              id: person.resourceId,
              resourceId: person.resourceId,
              name: person.personalInfo?.firstName + " " + person.personalInfo?.lastName || person.resourceId,
              type: person.type,
              personalInfo: person.personalInfo,
              employment: person.employment,
              progress: person.progress,
              wbsTaskName: wbsTask.name,
              wbsTaskId: wbsTask._id || wbsTask.id
            };
            assignedPersons.push(operatorData);
            console.log('✅ Added operator:', operatorData);
          } else {
            console.log('⚠️ Duplicate operator skipped:', person.resourceId);
          }
        });
      } else {
        console.log(`❌ No assigned persons in WBS task: ${wbsTask?.name || wcTask.wbsTaskId}`);
      }
    });
    
    console.log('📊 Final operators result:', {
      assignedPersonsCount: assignedPersons.length,
      assignedPersons: assignedPersons.map(op => ({
        id: op._id,
        name: op.name,
        type: op.type,
        wbsTaskName: op.wbsTaskName
      }))
    });
    
    return assignedPersons;
  }, [selectedWC, workCenters, wbsTasks, employees]);

  // Debug useEffect to track operator changes
  useEffect(() => {
    console.log('👥 Available operators changed:', {
      count: availableOperators.length,
      operators: availableOperators.map(op => ({
        id: op.id,
        name: op.name,
        type: op.type
      })),
      selectedWC,
      wbsTasksCount: wbsTasks.length,
      workCentersCount: workCenters.length
    });
  }, [availableOperators, selectedWC, wbsTasks.length, workCenters.length]);

  // Get available machines from selected work center
  const availableMachines = useMemo(() => {
    console.log('🔍 Calculating available machines:', {
      selectedWC,
      workCentersCount: workCenters.length
    });

    if (!selectedWC) {
      console.log('❌ No work center selected, no machines available');
      return [];
    }
    
    const selectedWorkCenter = workCenters.find((wc: any) => wc._id === selectedWC);
    console.log('🏭 Selected work center for machines:', {
      workCenter: selectedWorkCenter,
      resources: selectedWorkCenter?.resources,
      resourcesCount: selectedWorkCenter?.resources?.length || 0
    });

    if (!selectedWorkCenter?.resources?.length) {
      console.log('❌ No resources in work center');
      return [];
    }
    
    // Filter resources to get only machines
    const machines = selectedWorkCenter.resources.filter((resource: any) => 
      resource.resourceType === 'machine'
    ).map((machine: any) => ({
      id: machine.machineId || machine._id,
      machineId: machine.machineId,
      name: machine.machineName || machine.name || 'Unnamed Machine',
      code: machine.machineCode || machine.code,
      config: machine.machineConfig,
      status: machine.status,
      notes: machine.notes
    }));
    
    console.log('🔧 Available machines:', {
      machinesCount: machines.length,
      machines: machines.map(m => ({
        id: m.id,
        name: m.name,
        code: m.code,
        status: m.status
      }))
    });
    
    return machines;
  }, [selectedWC, workCenters]);

  /* ---------- derived / chart data ---------- */
  const downtimeSummary = useMemo(() => {
    // sum minutes per work center in filtered range
    const map: Record<string, number> = {};
    downtimeEvents.forEach(d => {
      const s = new Date(d.start).getTime();
      if (d.end) {
        const e = new Date(d.end).getTime();
        if (e < new Date(filterFrom + "T00:00:00").getTime() || s > new Date(filterTo + "T23:59:59").getTime()) return;
      }
      map[d.workCenterId] = (map[d.workCenterId] || 0) + (d.minutes || 0);
    });
    return Object.entries(map).map(([wc, min]) => ({ workCenterId: wc, minutes: min }));
  }, [downtimeEvents, filterFrom, filterTo]);

  const productionByDay = useMemo(() => {
    const map: Record<string, number> = {};
    workLogs.forEach(l => {
      if (l.type === "produce" && l.producedQty) {
        const date = l.timestamp.slice(0, 10);
        map[date] = (map[date] || 0) + l.producedQty;
      }
    });
    return Object.entries(map).sort().map(([date, qty]) => ({ date, qty }));
  }, [workLogs]);

  /* ---------- core actions: start / stop / produce / reject / rework ---------- */

  function startOperation(woId: string, operatorId?: string, operationId?: string) {
    // create start log and start timer
    const logData = {
      workOrderId: woId,
      operationId,
      type: "start",
      operatorId,
      workCenterId: selectedWC || undefined,
      timestamp: nowISO(),
    };
    
    dispatch(createLog(logData))
      .unwrap()
      .then(() => {
        timersRef.current[woId] = Date.now();
        // Refetch logs to get updated data
        dispatch(fetchLogs({ from: filterFrom, to: filterTo, page: safeLogsPagination.currentPage, limit: safeLogsPagination.itemsPerPage, search: logsSearch }));
      })
      .catch((error) => {
        console.error('Failed to start operation:', error);
        alert('Failed to start operation: ' + (error.message || 'Unknown error'));
      });
  }

  function stopOperation(woId: string, produced = 0, rejected = 0, reworked = 0, notes?: string) {
    const startTs = timersRef.current[woId];
    let durMin = undefined;
    if (startTs) {
      durMin = Math.round((Date.now() - startTs) / 60000); // minutes
      timersRef.current[woId] = undefined;
    }

    const logData = {
      workOrderId: woId,
      operationId: selectedOp || undefined,
      type: "stop",
      operatorId: selectedOperator || undefined,
      workCenterId: selectedWC || undefined,
      timestamp: nowISO(),
      durationMinutes: durMin,
      producedQty: produced,
      rejectedQty: rejected,
      reworkedQty: reworked,
      notes,
    };
    
    dispatch(createLog(logData))
      .unwrap()
      .then(() => {
        // Refetch logs and quality checks to get updated data
        dispatch(fetchLogs({ from: filterFrom, to: filterTo, page: safeLogsPagination.currentPage, limit: safeLogsPagination.itemsPerPage, search: logsSearch }));
        dispatch(fetchQuality({ page: safeQualityPagination.currentPage, limit: safeQualityPagination.itemsPerPage, search: qualitySearch }));
      })
      .catch((error) => {
        console.error('Failed to stop operation:', error);
        alert('Failed to stop operation: ' + (error.message || 'Unknown error'));
      });
  }

  function recordProduction(woId: string, produced: number, rejected: number = 0, reworked: number = 0, notes?: string) {
    const logData = {
      workOrderId: woId,
      type: "produce",
      operatorId: selectedOperator || undefined,
      workCenterId: selectedWC || undefined,
      timestamp: nowISO(),
      producedQty: produced,
      rejectedQty: rejected,
      reworkedQty: reworked,
      notes,
    };
    
    dispatch(createLog(logData))
      .unwrap()
      .then(() => {
        // Refetch logs and quality checks to get updated data
        dispatch(fetchLogs({ from: filterFrom, to: filterTo, page: safeLogsPagination.currentPage, limit: safeLogsPagination.itemsPerPage, search: logsSearch }));
        dispatch(fetchQuality({ page: safeQualityPagination.currentPage, limit: safeQualityPagination.itemsPerPage, search: qualitySearch }));
      })
      .catch((error) => {
        console.error('Failed to record production:', error);
        alert('Failed to record production: ' + (error.message || 'Unknown error'));
      });
  }

  /* ---------- downtime logging & maintenance ---------- */

  function createDowntimeEvent(workCenterId: string, reason: string, startISO?: string, machineId?: string) {
    const downtimeData = {
      workCenterId,
      machineId: machineId || selectedMachine || undefined,
      reason,
      start: startISO || nowISO(),
      raisedBy: selectedOperator || undefined
    };
    
    dispatch(createDowntime(downtimeData))
      .unwrap()
      .then(() => {
        // Refetch downtime and maintenance data
        dispatch(fetchDowntime({ from: filterFrom, to: filterTo, page: safeDowntimePagination.currentPage, limit: safeDowntimePagination.itemsPerPage, search: downtimeSearch }));
        dispatch(fetchMaintenance({ page: safeMaintenancePagination.currentPage, limit: safeMaintenancePagination.itemsPerPage, search: maintenanceSearch }));
      })
      .catch((error) => {
        console.error('Failed to create downtime:', error);
        alert('Failed to create downtime: ' + (error.message || 'Unknown error'));
      });
  }

  function closeDowntimeEvent(downtimeId: string) {
    dispatch(closeDowntime(downtimeId))
      .unwrap()
      .then(() => {
        // Refetch downtime data
        dispatch(fetchDowntime({ from: filterFrom, to: filterTo, page: safeDowntimePagination.currentPage, limit: safeDowntimePagination.itemsPerPage, search: downtimeSearch }));
      })
      .catch((error) => {
        console.error('Failed to close downtime:', error);
        alert('Failed to close downtime: ' + (error.message || 'Unknown error'));
      });
  }

  function closeMaintenanceRequest(mrId: string) {
    dispatch(closeMaintenance(mrId))
      .unwrap()
      .then(() => {
        // Refetch maintenance data
        dispatch(fetchMaintenance({ page: safeMaintenancePagination.currentPage, limit: safeMaintenancePagination.itemsPerPage, search: maintenanceSearch }));
      })
      .catch((error) => {
        console.error('Failed to close maintenance request:', error);
        alert('Failed to close maintenance request: ' + (error.message || 'Unknown error'));
      });
  }

  function createMaintenanceRequest(workCenterId: string, description: string, machineId?: string) {
    // For now, we'll create a downtime event which auto-creates maintenance request
    // This is a simplified approach since the backend auto-creates maintenance requests with downtime
    createDowntimeEvent(workCenterId, `Maintenance needed: ${description}`, undefined, machineId);
  }

  /* ---------- quality integration ---------- */

  function completeQualityCheck(qcId: string, passed: boolean, remarks?: string) {
    const status = passed ? "pass" : "fail";
    
    dispatch(completeQuality({ id: qcId, status, remarks }))
      .unwrap()
      .then(() => {
        // Refetch quality and logs data
        dispatch(fetchQuality({ page: safeQualityPagination.currentPage, limit: safeQualityPagination.itemsPerPage, search: qualitySearch }));
        dispatch(fetchLogs({ from: filterFrom, to: filterTo, page: safeLogsPagination.currentPage, limit: safeLogsPagination.itemsPerPage, search: logsSearch }));
        
        // if fail, create rework record
        if (!passed) {
          const qc = qualityChecks.find((q: any) => q._id === qcId || q.id === qcId);
          if (qc) {
            const reworkData = {
              workOrderId: qc.workOrderId,
              operationId: qc.operationId,
              type: "rework",
              timestamp: nowISO(),
              notes: "Auto rework triggered due to QC fail"
            };
            dispatch(createLog(reworkData))
              .unwrap()
              .then(() => {
                // Refetch logs after rework creation
                dispatch(fetchLogs({ from: filterFrom, to: filterTo, page: safeLogsPagination.currentPage, limit: safeLogsPagination.itemsPerPage, search: logsSearch }));
              });
          }
        }
      })
      .catch((error) => {
        console.error('Failed to complete quality check:', error);
        alert('Failed to complete quality check: ' + (error.message || 'Unknown error'));
      });
  }

  /* ---------- attendance / HR quick actions ---------- */

  function operatorCheckIn(operatorId: string) {
    const entry = { id: genId("att"), operatorId, ts: nowISO(), type: "in" };
    setAttendance(s => [entry, ...s]);
    // Note: Attendance logs are kept in localStorage (HR functionality)
    // Work logs are now handled via Redux/API
  }

  function operatorCheckOut(operatorId: string) {
    const entry = { id: genId("att"), operatorId, ts: nowISO(), type: "out" };
    setAttendance(s => [entry, ...s]);
    // Note: Attendance logs are kept in localStorage (HR functionality)
    // Work logs are now handled via Redux/API
  }

  /* ---------- simulated IoT events (machine up/down) ---------- */
  function simulateMachineDown(workCenterId: string, reason = "simulated-failure") {
    // create downtime + maintenance with selected machine
    createDowntimeEvent(workCenterId, reason, undefined, selectedMachine || undefined);
  }

  function simulateMachineUp(downtimeId: string) {
    closeDowntimeEvent(downtimeId);
  }

  /* ---------- editing & dialogs (basic) ---------- */
  function openLogDialog(type: WorkLog["type"]) {
    setLogForm({ type, timestamp: nowISO(), operatorId: selectedOperator, workOrderId: selectedWO, workCenterId: selectedWC });
    setLogDialogOpen(true);
  }

  function persistLogForm() {
    const logData = {
      workOrderId: logForm.workOrderId || selectedWO || "",
      operationId: logForm.operationId,
      type: logForm.type || "produce",
      operatorId: logForm.operatorId || selectedOperator || undefined,
      workCenterId: logForm.workCenterId || selectedWC || undefined,
      timestamp: logForm.timestamp || nowISO(),
      durationMinutes: logForm.durationMinutes,
      producedQty: logForm.producedQty,
      rejectedQty: logForm.rejectedQty,
      reworkedQty: logForm.reworkedQty,
      notes: logForm.notes,
    };
    
    dispatch(createLog(logData))
      .unwrap()
      .then(() => {
        // Refetch logs and quality data
        dispatch(fetchLogs({ from: filterFrom, to: filterTo, page: safeLogsPagination.currentPage, limit: safeLogsPagination.itemsPerPage, search: logsSearch }));
        dispatch(fetchQuality({ page: safeQualityPagination.currentPage, limit: safeQualityPagination.itemsPerPage, search: qualitySearch }));
        setLogDialogOpen(false);
      })
      .catch((error) => {
        console.error('Failed to create log:', error);
        alert('Failed to create log: ' + (error.message || 'Unknown error'));
      });
  }

  /* ---------- exports ---------- */
  function exportLogsCSV() {
    if (!workLogs.length) return alert("No logs");
    const keys = ["id", "workOrderId", "type", "operatorId", "workCenterId", "timestamp", "durationMinutes", "producedQty", "rejectedQty", "reworkedQty", "notes"];
    const csv = [keys.join(","), ...workLogs.map(w => keys.map(k => JSON.stringify((w as any)[k] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `worklogs_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  /* ---------- pagination handlers ---------- */
  const handleLogsPageChange = (page: number) => {
    dispatch(fetchLogs({ 
      from: filterFrom, 
      to: filterTo, 
      page, 
      limit: safeLogsPagination.itemsPerPage, 
      search: logsSearch 
    }));
  };

  const handleLogsItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchLogs({ 
      from: filterFrom, 
      to: filterTo, 
      page: 1, 
      limit: itemsPerPage, 
      search: logsSearch 
    }));
  };

  const handleDowntimePageChange = (page: number) => {
    dispatch(fetchDowntime({ 
      from: filterFrom, 
      to: filterTo, 
      page, 
      limit: safeDowntimePagination.itemsPerPage, 
      search: downtimeSearch 
    }));
  };

  const handleDowntimeItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchDowntime({ 
      from: filterFrom, 
      to: filterTo, 
      page: 1, 
      limit: itemsPerPage, 
      search: downtimeSearch 
    }));
  };

  const handleMaintenancePageChange = (page: number) => {
    dispatch(fetchMaintenance({ 
      page, 
      limit: safeMaintenancePagination.itemsPerPage, 
      search: maintenanceSearch 
    }));
  };

  const handleMaintenanceItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchMaintenance({ 
      page: 1, 
      limit: itemsPerPage, 
      search: maintenanceSearch 
    }));
  };

  const handleQualityPageChange = (page: number) => {
    dispatch(fetchQuality({ 
      page, 
      limit: safeQualityPagination.itemsPerPage, 
      search: qualitySearch 
    }));
  };

  const handleQualityItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchQuality({ 
      page: 1, 
      limit: itemsPerPage, 
      search: qualitySearch 
    }));
  };

  // Search handlers with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(fetchMaintenance({ 
        page: 1, 
        limit: safeMaintenancePagination.itemsPerPage, 
        search: maintenanceSearch 
      }));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [maintenanceSearch, safeMaintenancePagination.itemsPerPage, dispatch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(fetchQuality({ 
        page: 1, 
        limit: safeQualityPagination.itemsPerPage, 
        search: qualitySearch 
      }));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [qualitySearch, safeQualityPagination.itemsPerPage, dispatch]);

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Production Execution — Shop Floor Control</h1>
          <p className="text-muted-foreground">Start/stop operations, record quantities, log downtime, and trigger maintenance & quality workflows.</p>
        </div>
        <div className="flex gap-2">
          {/* <Button
            disabled={!canCreate}
            onClick={() => canCreate && openLogDialog("produce")}
          >
            <Plus className="mr-2 h-4 w-4" /> Quick Log</Button> */}
          <Button
            variant="outline"
            disabled={!canView}
            onClick={() => canView && exportLogsCSV()}
          >
            <Download className="mr-2 h-4 w-4" />Export Logs</Button>
        </div>
      </div>

      {/* selectors */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <Label>Work Order</Label>
          <select 
            value={selectedWO} 
            onChange={(e) => setSelectedWO(e.target.value)} 
            className="w-full input"
            disabled={workOrdersLoading}
          >
            <option value="">— choose work order —</option>
            {workOrders
              .filter((wo: any) => wo.status !== 'completed' && wo.status !== 'cancelled') // Only show active work orders
              .map((wo: any) => (
                <option key={wo._id} value={wo._id}>
                  {wo.productName} | Qty: {wo.quantity}
                </option>
              ))}
          </select>
          {workOrdersLoading && (
            <div className="text-xs text-muted-foreground mt-1">Loading work orders...</div>
          )}
          {!workOrdersLoading && workOrders.length === 0 && (
            <div className="text-xs text-red-500 mt-1">No work orders found. Please create work orders first.</div>
          )}
        </div>
        <div>
          <Label>Work Center</Label>
          <select 
            value={selectedWC} 
            onChange={(e) => setSelectedWC(e.target.value)} 
            className="w-full input"
            disabled={workCentersLoading}
          >
            <option value="">
              {workCentersLoading 
                ? "— loading work centers —"
                : workCenters.length === 0 
                  ? "— no work centers available —"
                  : "— choose work center —"
              }
            </option>
            {workCenters
              .filter((wc: any) => wc.status === 'active')
              .map((wc: any) => (
                <option key={wc._id} value={wc._id}>
                  {wc.name} Capacity: {wc.capacity}h/day
                </option>
              ))}
          </select>
          {workCentersLoading && (
            <div className="text-xs text-muted-foreground mt-1">Loading work centers...</div>
          )}
          {!workCentersLoading && workCenters.length === 0 && (
            <div className="text-xs text-red-500 mt-1">No work centers found.</div>
          )}
          {selectedWC && !selectedWO && (
            <div className="text-xs text-muted-foreground mt-1">Work center selected independently.</div>
          )}
        </div>
        <div>
          <Label>Operator</Label>
          <select 
            value={selectedOperator} 
            onChange={(e) => setSelectedOperator(e.target.value)} 
            className="w-full input"
            disabled={!selectedWC}
          >
            <option value="">
              {!selectedWC 
                ? "— select work center first —" 
                : availableOperators.length === 0 
                  ? "— no operators available —"
                  : "— choose operator —"
              }
            </option>
            {availableOperators.map((op: any) => (
              <option key={op._id || op.resourceId} value={op._id || op.resourceId}>
                {op.name || op.personalInfo?.name || op.resourceId} 
                {op.type && ` (${op.type})`}
              </option>
            ))}
          </select>
          {!selectedWC && (
            <div className="text-xs text-muted-foreground mt-1">Select a work center to see assigned operators.</div>
          )}
          {selectedWC && availableOperators.length === 0 && (
            <div className="text-xs text-red-500 mt-1">No operators assigned to WBS tasks in this work center.</div>
          )}
          {selectedWC && availableOperators.length > 0 && availableOperators[0]?.wbsTaskName && (
            <div className="text-xs text-muted-foreground mt-1">
              Showing operators from WBS tasks: {[...new Set(availableOperators.map(op => op.wbsTaskName))].join(', ')}
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <Button 
            disabled={!canEdit || !selectedWO || !selectedWC}
            onClick={() => {
              if (!canEdit) return;
              if (!selectedWO) {
                alert("Please select a work order first");
                return;
              }
              if (!selectedWC) {
                alert("Please select a work center first");
                return;
              }
              startOperation(selectedWO, selectedOperator || undefined, selectedOp || undefined);
            }}
          >
            <Play className="mr-2 h-4 w-4" />Start
          </Button>
          <Button
            variant="destructive"
            disabled={!canEdit || !selectedWO}
            onClick={() => {
              if (!canEdit) return;
              if (!selectedWO) {
                alert("Please select a work order first");
                return;
              }
              stopOperation(selectedWO);
            }}
          >
            <Pause className="mr-2 h-4 w-4" />Stop
          </Button>
        </div>
      </div>

      {/* Work Order Details Card */}
      
      {/* production quick controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader><CardTitle>Record Production</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <Input placeholder="Produced qty" type="number" id="produce_qty" />
              <Input placeholder="Rejected qty" type="number" id="reject_qty" />
              <Button
                disabled={!canCreate || !selectedWO}
                onClick={() => {
                  if (!canCreate) return;
                  if (!selectedWO) {
                    alert("Please select a work order first");
                    return;
                  }
                  const p = Number((document.getElementById("produce_qty") as HTMLInputElement).value || 0);
                  const r = Number((document.getElementById("reject_qty") as HTMLInputElement).value || 0);
                  if (p <= 0) {
                    alert("Please enter a valid produced quantity");
                    return;
                  }
                  recordProduction(selectedWO, p, r);
                  (document.getElementById("produce_qty") as HTMLInputElement).value = "";
                  (document.getElementById("reject_qty") as HTMLInputElement).value = "";
                }}>Record</Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Records produce logs and triggers QC automatically.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Log Downtime</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Machine Selection */}
              <div>
                <Label>Machine</Label>
                <select 
                  value={selectedMachine} 
                  onChange={(e) => setSelectedMachine(e.target.value)} 
                  className="w-full input"
                  disabled={!selectedWC}
                >
                  <option value="">
                    {!selectedWC 
                      ? "— select work center first —" 
                      : availableMachines.length === 0 
                        ? "— no machines available —"
                        : "— choose machine —"
                    }
                  </option>
                  {availableMachines.map((machine: any) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} {machine.code ? `(${machine.code})` : ''}
                    </option>
                  ))}
                </select>
                {!selectedWC && (
                  <div className="text-xs text-muted-foreground mt-1">Select a work center to see available machines.</div>
                )}
                {selectedWC && availableMachines.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">No machines found in this work center.</div>
                )}
              </div>
              
              {/* Reason Input */}
              <div>
                <Label>Reason</Label>
                <Input 
                  placeholder="Enter downtime reason" 
                  value={downtimeForm.reason || ""} 
                  onChange={(e) => setDowntimeForm({ ...downtimeForm, reason: e.target.value })} 
                />
              </div>
              
              {/* Log Button */}
              <Button
                disabled={!canCreate || !selectedWC || !selectedMachine}
                onClick={() => {
                  if (!canCreate) return;
                  if (!selectedWC) {
                    alert("Please select a work center first");
                    return;
                  }
                  if (!selectedMachine) {
                    alert("Please select a machine first");
                    return;
                  }
                  if (!downtimeForm.reason?.trim()) {
                    alert("Please enter a reason for downtime");
                    return;
                  }
                  
                  // Find machine name for better reason description
                  const machine = availableMachines.find(m => m.id === selectedMachine);
                  const machineInfo = machine ? `${machine.name}${machine.code ? ` (${machine.code})` : ''}` : selectedMachine;
                  const reasonWithMachine = `Machine: ${machineInfo} - ${downtimeForm.reason}`;
                  
                  createDowntimeEvent(selectedWC, reasonWithMachine, undefined, selectedMachine);
                  setDowntimeForm({ reason: "" });
                  setSelectedMachine(""); // Clear machine selection after logging
                }}
                className="w-full"
              >
                Log Downtime
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Auto creates maintenance request. Close downtime from list.</div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader><CardTitle>Operator Attendance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                disabled={!canCreate || !selectedOperator}
                onClick={() => {
                  if (!canCreate) return;
                  if (!selectedOperator) {
                    alert("Please select an operator first");
                    return;
                  }
                  operatorCheckIn(selectedOperator);
                }}
              >
                Check-in
              </Button>

              <Button
                disabled={!canCreate || !selectedOperator}
                onClick={() => {
                  if (!canCreate) return;
                  if (!selectedOperator) {
                    alert("Please select an operator first");
                    return;
                  }
                  operatorCheckOut(selectedOperator);
                }}
              >
                Check-out
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Quick attendance log for HR integration.</div>
          </CardContent>
        </Card> */}
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Throughput (produced / day)</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#82ca9d" name="Produced" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Downtime by Work Center (mins)</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={downtimeSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workCenterId" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="minutes" stroke="#ff7f50" name="Downtime (mins)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* logs table */}
      <Card>
        <CardHeader><CardTitle>Execution & Event Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Label>From</Label>
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            <Label>To</Label>
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            <div className="flex-1" />
            <Input
              placeholder="Search logs..."
              value={logsSearch}
              onChange={(e) => setLogsSearch(e.target.value)}
              className="w-48"
            />
            <Button
              disabled={!canDelete}
              onClick={() => {
                if (!canDelete) return;
                // Refresh all data
                console.log('Manual refresh triggered');
                dispatch(fetchLogs({ from: filterFrom, to: filterTo, page: safeLogsPagination.currentPage, limit: safeLogsPagination.itemsPerPage, search: logsSearch }));
                dispatch(fetchDowntime({ from: filterFrom, to: filterTo, page: safeDowntimePagination.currentPage, limit: safeDowntimePagination.itemsPerPage, search: downtimeSearch }));
                dispatch(fetchMaintenance({ page: safeMaintenancePagination.currentPage, limit: safeMaintenancePagination.itemsPerPage, search: maintenanceSearch }));
                dispatch(fetchQuality({ page: safeQualityPagination.currentPage, limit: safeQualityPagination.itemsPerPage, search: qualitySearch }));
              }}
            >
              Refresh Logs
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Debug button to check current state
                console.log('Current Redux State:', {
                  workLogs,
                  downtimeEvents,
                  maintenanceRequests,
                  qualityChecks,
                  filterFrom,
                  filterTo
                });
                console.log('Filtered Data:', {
                  filteredLogs: filteredLogs.length,
                  filteredDowntimeEvents: filteredDowntimeEvents.length
                });
                console.log('Sample Data:', {
                  sampleLog: filteredLogs[0],
                  sampleDowntime: filteredDowntimeEvents[0]
                });
              }}
            >
              Debug State
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Test downtime API directly
                console.log('🧪 Testing downtime API directly...');
                dispatch(fetchDowntime({ from: '2025-12-20', to: '2025-12-30' }))
                  .unwrap()
                  .then((data) => {
                    console.log('✅ Downtime API Success:', data);
                    alert(`Fetched ${data.length} downtime events`);
                  })
                  .catch((error) => {
                    console.error('❌ Downtime API Error:', error);
                    alert('Error fetching downtime: ' + error);
                  });
              }}
            >
              Test Downtime API
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Test downtime API without date filters
                console.log('🧪 Testing downtime API without filters...');
                dispatch(fetchDowntime({}))
                  .unwrap()
                  .then((data) => {
                    console.log('✅ All Downtime API Success:', data);
                    alert(`Fetched ${data.length} total downtime events`);
                  })
                  .catch((error) => {
                    console.error('❌ All Downtime API Error:', error);
                    alert('Error fetching all downtime: ' + error);
                  });
              }}
            >
              Fetch All Downtime
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Debug operator selection
                console.log('👥 Operator Selection Debug:', {
                  selectedWC,
                  selectedWorkCenter: workCenters.find((wc: any) => wc._id === selectedWC),
                  availableOperators: availableOperators.length,
                  operatorsList: availableOperators,
                  wbsTasksInStore: wbsTasks.length,
                  employeesInStorage: employees.length
                });
                alert(`Available operators: ${availableOperators.length}`);
              }}
            >
              Debug Operators
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Debug WBS tasks specifically
                const selectedWorkCenter = workCenters.find((wc: any) => wc._id === selectedWC);
                console.log('🔍 WBS Tasks Debug:', {
                  selectedWC,
                  selectedWorkCenter,
                  workCenterWbsTasks: selectedWorkCenter?.wbsTasks,
                  wbsTasksInReduxStore: wbsTasks,
                  wbsTasksCount: wbsTasks.length,
                  workCenterWbsTasksCount: selectedWorkCenter?.wbsTasks?.length || 0
                });
                
                if (selectedWorkCenter?.wbsTasks) {
                  selectedWorkCenter.wbsTasks.forEach((wcTask: any, index: number) => {
                    const wbsTask = wbsTasks.find((task: any) => 
                      task._id === wcTask.wbsTaskId || 
                      task.id === wcTask.wbsTaskId ||
                      task._id?.toString() === wcTask.wbsTaskId?.toString()
                    );
                    console.log(`WBS Task ${index + 1} Match:`, {
                      wcTaskId: wcTask.wbsTaskId,
                      wcTaskName: wcTask.wbsTaskName,
                      foundInRedux: !!wbsTask,
                      reduxTaskName: wbsTask?.name,
                      assignedPersons: wbsTask?.assignedPersons
                    });
                  });
                }
                
                alert(`WC WBS Tasks: ${selectedWorkCenter?.wbsTasks?.length || 0}, Redux WBS Tasks: ${wbsTasks.length}`);
              }}
            >
              Debug WBS Tasks
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Debug machine selection and maintenance requests
                console.log('🔧 Machine & Maintenance Debug:', {
                  selectedMachine,
                  availableMachines: availableMachines.length,
                  machinesList: availableMachines,
                  maintenanceRequests: maintenanceRequests.length,
                  sampleMaintenance: maintenanceRequests[0],
                  allWorkCenters: workCenters.map(wc => ({
                    id: wc._id,
                    name: wc.name,
                    machines: (wc.resources || []).filter(r => r.resourceType === 'machine').length
                  }))
                });
                alert(`Selected Machine: ${selectedMachine || 'None'}, Available: ${availableMachines.length}`);
              }}
            >
              Debug Machines
            </Button>

          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>WO / Op</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>WC</TableHead>
                <TableHead>Qty P/R</TableHead>
                {/* <TableHead>Duration</TableHead> */}
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    {productionLoading ? "Loading logs..." : "No logs found for the selected criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                workLogs.map(l => {
                  // Find work order name
                  const workOrder = workOrders.find((wo: any) => wo._id === l.workOrderId);
                  const workOrderName = workOrder?.productName || l.workOrderId;
                  
                  // Find operator name
                  const operator = availableOperators.find((op: any) => (op._id || op.resourceId) === l.operatorId) || 
                                 employees.find((e: any) => e.id === l.operatorId);
                  const operatorName = operator?.name || operator?.personalInfo?.name || l.operatorId;
                  
                  // Find work center name
                  const workCenter = workCenters.find((wc: any) => wc._id === l.workCenterId);
                  const workCenterName = workCenter?.name || l.workCenterId;
                  
                  return (
                    <TableRow key={l._id || l.id}>
                      <TableCell>{new Date(l.timestamp).toLocaleString()}</TableCell>
                      <TableCell><Badge>{l.type}</Badge></TableCell>
                      <TableCell>{workOrderName} {l.operationId ? ` / ${l.operationId}` : ""}</TableCell>
                      <TableCell>{operatorName}</TableCell>
                      <TableCell>{workCenterName}</TableCell>
                      <TableCell>{(l.producedQty || 0)}/{(l.rejectedQty || 0)}</TableCell>
                      {/* <TableCell>{l.durationMinutes ? `${l.durationMinutes}m` : "-"}</TableCell> */}
                      <TableCell>{l.notes || ""}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          
          <Pagination
            currentPage={safeLogsPagination.currentPage}
            totalPages={safeLogsPagination.totalPages}
            totalItems={safeLogsPagination.totalItems}
            itemsPerPage={safeLogsPagination.itemsPerPage}
            onPageChange={handleLogsPageChange}
            onItemsPerPageChange={handleLogsItemsPerPageChange}
          />
        </CardContent>
      </Card>

      {/* downtime list & maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Downtime Events</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search downtime..."
                value={downtimeSearch}
                onChange={(e) => setDowntimeSearch(e.target.value)}
                className="w-48"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>MR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downtimeEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {productionLoading ? "Loading downtime events..." : "No downtime recorded for the selected criteria."}
                    </TableCell>
                  </TableRow>
                ) : (
                  downtimeEvents.map(d => {
                    // Extract machine name from reason if it follows our format: "Machine: [Name] - [Reason]"
                    let machineName = "Unknown Machine";
                    let displayReason = d.reason;
                    
                    if (d.reason && d.reason.startsWith("Machine: ")) {
                      const machineMatch = d.reason.match(/^Machine: (.+?) - (.+)$/);
                      if (machineMatch) {
                        machineName = machineMatch[1];
                        displayReason = machineMatch[2];
                      } else {
                        // Fallback: try to extract just the machine part
                        const simpleMachineMatch = d.reason.match(/^Machine: (.+)$/);
                        if (simpleMachineMatch) {
                          machineName = simpleMachineMatch[1];
                          displayReason = "Downtime";
                        }
                      }
                    } else {
                      // If no machine info in reason, show work center name as fallback
                      const workCenter = workCenters.find((wc: any) => wc._id === d.workCenterId);
                      machineName = workCenter?.name || d.workCenterId;
                    }
                    
                    return (
                      <TableRow key={d._id || d.id}>
                        <TableCell>{machineName}</TableCell>
                        <TableCell>{new Date(d.start).toLocaleString()}</TableCell>
                        <TableCell>{d.end ? new Date(d.end).toLocaleString() : "—"}</TableCell>
                        <TableCell>{d.minutes || "-"}</TableCell>
                        <TableCell>{displayReason}</TableCell>
                        <TableCell>
                          {d.maintenanceRequestId ? (
                            <div>
                              <div>{d.maintenanceRequestId}</div>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={!canEdit}
                                onClick={() => canEdit && closeDowntimeEvent(d._id || d.id)}
                              >
                                Close
                              </Button>

                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={!canCreate}
                              onClick={() => canCreate && createMaintenanceRequest(d.workCenterId, d.reason, d.machineId)}
                            >
                              Create MR
                            </Button>

                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            
            <Pagination
              currentPage={safeDowntimePagination.currentPage}
              totalPages={safeDowntimePagination.totalPages}
              totalItems={safeDowntimePagination.totalItems}
              itemsPerPage={safeDowntimePagination.itemsPerPage}
              onPageChange={handleDowntimePageChange}
              onItemsPerPageChange={handleDowntimeItemsPerPageChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search maintenance..."
                value={maintenanceSearch}
                onChange={(e) => setMaintenanceSearch(e.target.value)}
                className="w-48"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {productionLoading ? "Loading maintenance requests..." : "No maintenance requests."}
                    </TableCell>
                  </TableRow>
                ) : (
                  maintenanceRequests.map(m => {
                    // First try to get machine name from machineId if available
                    let machineName = "Unknown Machine";
                    
                    if (m.machineId) {
                      // Find machine from all work centers
                      const allMachines = workCenters.flatMap((wc: any) => 
                        (wc.resources || [])
                          .filter((r: any) => r.resourceType === 'machine')
                          .map((machine: any) => ({
                            id: machine.machineId || machine._id,
                            name: machine.machineName || machine.name || 'Unnamed Machine',
                            code: machine.machineCode || machine.code,
                            workCenterId: wc._id
                          }))
                      );
                      
                      const machine = allMachines.find(machine => machine.id === m.machineId);
                      if (machine) {
                        machineName = `${machine.name}${machine.code ? ` (${machine.code})` : ''}`;
                      } else {
                        machineName = m.machineId;
                      }
                    } else if (m.description && m.description.startsWith("Machine: ")) {
                      // Fallback: Extract machine name from description
                      const machineMatch = m.description.match(/^Machine: (.+?) - (.+)$/);
                      if (machineMatch) {
                        machineName = machineMatch[1];
                      } else {
                        // Fallback: try to extract just the machine part
                        const simpleMachineMatch = m.description.match(/^Machine: (.+)$/);
                        if (simpleMachineMatch) {
                          machineName = simpleMachineMatch[1];
                        }
                      }
                    } else {
                      // Last fallback: show work center name
                      const workCenter = workCenters.find((wc: any) => wc._id === m.workCenterId);
                      machineName = workCenter?.name || m.workCenterId;
                    }
                    
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{m.id}</TableCell>
                        <TableCell>{machineName}</TableCell>
                        <TableCell>{new Date(m.reportedAt).toLocaleString()}</TableCell>
                        <TableCell><Badge>{m.status}</Badge></TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell>
                          {m.status !== "closed" ? <Button onClick={() => closeMaintenanceRequest(m._id || m.id)}>Close</Button> : <span>—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            
            <Pagination
              currentPage={safeMaintenancePagination.currentPage}
              totalPages={safeMaintenancePagination.totalPages}
              totalItems={safeMaintenancePagination.totalItems}
              itemsPerPage={safeMaintenancePagination.itemsPerPage}
              onPageChange={handleMaintenancePageChange}
              onItemsPerPageChange={handleMaintenanceItemsPerPageChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* QC list */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Checks</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search quality checks..."
              value={qualitySearch}
              onChange={(e) => setQualitySearch(e.target.value)}
              className="w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>WO</TableHead>
                <TableHead>Op</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualityChecks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    {productionLoading ? "Loading quality checks..." : "No quality checks."}
                  </TableCell>
                </TableRow>
              ) : (
                qualityChecks.map(q => {
                  // Find work order name
                  const workOrder = workOrders.find((wo: any) => wo._id === q.workOrderId);
                  const workOrderName = workOrder?.productName || q.workOrderId;
                  
                  // Find operator name (assuming operatorId is stored in quality check)
                  const operator = availableOperators.find((op: any) => (op.id || op.resourceId) === q.operatorId) || 
                                 employees.find((e: any) => e.id === q.operatorId);
                  const operatorName = operator?.name || operator?.personalInfo?.name || q.operatorId || "-";
                  
                  return (
                    <TableRow key={q.id}>
                      <TableCell>{q.id}</TableCell>
                      <TableCell>{workOrderName}</TableCell>
                      <TableCell>{operatorName}</TableCell>
                      <TableCell>{q.qty || 0}</TableCell>
                      <TableCell>{new Date(q.requestedAt).toLocaleString()}</TableCell>
                      <TableCell><Badge>{q.status}</Badge></TableCell>
                      <TableCell>
                        {q.status === "pending" ? (
                          <>
                            <Button
                              disabled={!canEdit}
                              onClick={() => canEdit && completeQualityCheck(q._id || q.id, true)}
                            >
                              Pass
                            </Button>

                            <Button
                              variant="destructive"
                              disabled={!canEdit}
                              onClick={() => canEdit && completeQualityCheck(q._id || q.id, false)}
                            >
                              Fail
                            </Button>

                          </>
                        ) : <span>—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          
          <Pagination
            currentPage={safeQualityPagination.currentPage}
            totalPages={safeQualityPagination.totalPages}
            totalItems={safeQualityPagination.totalItems}
            itemsPerPage={safeQualityPagination.itemsPerPage}
            onPageChange={handleQualityPageChange}
            onItemsPerPageChange={handleQualityItemsPerPageChange}
          />
        </CardContent>
      </Card>

      {/* simulated IoT panel */}
      <Card>
        <CardHeader><CardTitle>Simulated IoT / Barcode</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <Input placeholder="Scan barcode or enter token" id="barcode_input" onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value.trim();
                // simple: if token starts with "DT-" => create downtime on selectedWC
                if (v.startsWith("DT-")) {
                  if (!selectedWC) return alert("Select work center to map downtime");
                  createDowntimeEvent(selectedWC, `Barcode triggered: ${v}`, undefined, selectedMachine || undefined);
                } else if (v.startsWith("MR-")) {
                  if (!selectedWC) return alert("Select work center to map MR");
                  // Note: Direct maintenance request creation not available via API, 
                  // it's auto-created with downtime
                  createDowntimeEvent(selectedWC, `Barcode MR: ${v}`, undefined, selectedMachine || undefined);
                } else {
                  alert("Scanned: " + v);
                }
                (e.target as HTMLInputElement).value = "";
              }
            }} />
            <Button
              disabled={!canCreate}
              onClick={() => canCreate && simulateMachineDown(selectedWC, "iot-simulated-failure")}
            >
              Simulate Machine Down
            </Button>

            <Button
              disabled={!canEdit || !downtimeEvents.length}
              onClick={() => canEdit && downtimeEvents[0]?._id && simulateMachineUp(downtimeEvents[0]._id)}
            >
              Simulate Machine Up
            </Button>


          </div>
        </CardContent>
      </Card>
    </div>
  );
}
