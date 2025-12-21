import ActivityCostSheet from "@/components/reports/ActivityCostSheet";
import MRSSheetCreation from "@/pages/modules/inventory/reporting/MRSSheetCreation";
import MRSPurchaseOrder from "@/pages/modules/inventory/reporting/MRSPurchaseOrder";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchResources } from "@/redux/slices/resourceSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import { fetchMRS } from "@/redux/slices/mrsSlice";
import { fetchDailyProgress } from "@/redux/slices/dailyProgressSlice";
import { fetchMilestones, fetchInvoices } from "@/redux/slices/billingSlice";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
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
import { Calendar, BarChart3, Filter, Plus, Trash2, ShieldAlert, Activity, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, DollarSign, GitCompare, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays } from "date-fns";
import { usePermission } from "@/hooks/userPermission";
import api from "../../../utils/axiosApi";
import { BASE_URL } from "../../../utils/constants";
import { Progress } from "@radix-ui/react-progress";
import { fetchEquipments } from "@/redux/slices/equipmentSlice";
import { fetchBudgetsByProject } from "@/redux/slices/budgetSlice";
import { fetchActivityCost } from "@/redux/slices/activityCostSlice";

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
  const dispatch = useDispatch<AppDispatch>();
  const organisationId = localStorage.getItem("organisationId") || "";

  // Redux Selectors
 const { budgets, loading } = useSelector((state: RootState) => state.budget);


  const { projects } = useSelector((state: RootState) => state.projects);
  const { resources } = useSelector((state: RootState) => state.resources);
  const { wbs } = useSelector((state: RootState) => state.wbs);
  const { materials: rawMaterials } = useSelector((state: RootState) => state.rawMaterials);
  const { list: mrsList } = useSelector((state: RootState) => state.mrs);
  const { items: dailyProgressItems } = useSelector((state: RootState) => state.dailyProgress);
  const { milestones, invoices } = useSelector((state: RootState) => state.billing);

  const [reports, setReports] = useState<Report[]>([]);
  const [form, setForm] = useState<Partial<Report>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [loadingHealthReport, setLoadingHealthReport] = useState(false);
  const [profitabilityReport, setProfitabilityReport] = useState<any>(null);
  const [loadingProfitabilityReport, setLoadingProfitabilityReport] = useState(false);
  const [comparisonReport, setComparisonReport] = useState<any>(null);
  const [loadingComparisonReport, setLoadingComparisonReport] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("analytics");
  const [allProjectsHealth, setAllProjectsHealth] = useState<any>(null);
  const [loadingAllProjectsHealth, setLoadingAllProjectsHealth] = useState(false);
  const [allProjectsProfitability, setAllProjectsProfitability] = useState<any>(null);
  const [loadingAllProjectsProfitability, setLoadingAllProjectsProfitability] = useState(false);
  const { activities, totals} = useSelector((s: RootState) => s.activityCost);
  
  // Force refresh function
  const forceRefreshReports = () => {
    setHealthReport(null);
    setProfitabilityReport(null);
    setComparisonReport(null);
    setAllProjectsHealth(null);
    setAllProjectsProfitability(null);
    
    if (organisationId) {
      setTimeout(() => {
        fetchHealthReport();
        fetchProfitabilityReport();
        fetchComparisonReport();
        fetchAllProjectsHealth();
        fetchAllProjectsProfitability();
      }, 100);
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    if (organisationId) {
      dispatch(fetchProjects({ page: 1, limit: 100 }));
      dispatch(fetchMaterials());
      dispatch(fetchMRS());
      dispatch(fetchDailyProgress());
      dispatch(fetchMilestones());
      dispatch(fetchInvoices());
      dispatch(fetchActivityCost(selectedProjectId));
    }
  }, [organisationId, dispatch]);

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  // Fetch resources and WBS when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchResources(selectedProjectId));
      dispatch(fetchEquipments());
      dispatch(fetchBudgetsByProject(selectedProjectId));
      dispatch(fetchWbsByProject(selectedProjectId));
    }
  }, [selectedProjectId, dispatch]);

  const canView = usePermission('projectsReports', 'view');

  // Fetch reports when organisationId and projects are loaded
  useEffect(() => {
    if (organisationId && projects.length > 0) {
      console.log("Projects available:", projects.length);
      console.log("Selected project ID:", selectedProjectId);
      // Add small delay to ensure all data is loaded
      setTimeout(() => {
        fetchHealthReport();
        fetchProfitabilityReport();
        fetchComparisonReport();
        fetchAllProjectsHealth();
        fetchAllProjectsProfitability();
      }, 500);
    }
  }, [organisationId, selectedProjectId, projects.length]);

  // Fetch all projects health and profitability reports
  const fetchAllProjectsHealth = async () => {
    if (!organisationId) return;
    
    setLoadingAllProjectsHealth(true);
    try {
      const url = `${BASE_URL}/project-health-report?organisationId=${organisationId}`;
      const response = await api.get(url);
      if (response.data.success) {
        setAllProjectsHealth(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching all projects health report:", error);
      setAllProjectsHealth(null);
    } finally {
      setLoadingAllProjectsHealth(false);
    }
  };

  const fetchAllProjectsProfitability = async () => {
    if (!organisationId) return;
    
    setLoadingAllProjectsProfitability(true);
    try {
      const url = `${BASE_URL}/project-profitability-report?organisationId=${organisationId}`;
      const response = await api.get(url);
      if (response.data.success) {
        setAllProjectsProfitability(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching all projects profitability report:", error);
      setAllProjectsProfitability(null);
    } finally {
      setLoadingAllProjectsProfitability(false);
    }
  };

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

  // Get selected project
  const selectedProject = useMemo(
    () => projects.find((p) => p._id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  // Calculate costs similar to Budget page - EXACT SAME LOGIC
  const costs = useMemo(() => {
    let materialCost = 0;
    let labourCost = 0;
    let equipmentCost = 0;
    let otherCost = 0;

    // Filter resources for selected project
    const filteredResources = selectedProjectId
      ? resources.filter((res) => res.projectId === selectedProjectId)
      : resources;

    // Filter WBS for selected project
    const filteredWBS = selectedProjectId
      ? wbs.filter((item) => item.projectId === selectedProjectId)
      : wbs;

    // A. Calculate from Resources
    filteredResources.forEach((res) => {
      const cost = Number(res.totalCost) || 0;
      if (res.resourceType === "material") {
        materialCost += cost;
      } else if (res.resourceType === "manpower") {
        labourCost += cost;
      } else if (res.resourceType === "equipment" || res.resourceType === "machinery") {
        equipmentCost += cost;
      } else {
        otherCost += cost;
      }
    });

    // B. Calculate from WBS (Assigned Persons & Linked Materials)
    const processedPersonIds = new Set<string>();

    filteredWBS.forEach((item: any) => {
      // 1. Assigned Persons (Unique Calculation)
      if (item.assignedPersons && Array.isArray(item.assignedPersons)) {
        item.assignedPersons.forEach((person: any) => {
          const rId = person.resourceId;

          if (rId && !processedPersonIds.has(rId)) {
            processedPersonIds.add(rId);

            const financial = person.financial || {};
            let personCost = 0;
            const type = person.type;

            if (type === "labour") {
              personCost = Number(financial.monthlyRate) || 0;
            } else if (type === "employee") {
              personCost = Number(financial.basicPay) || 0;
            } else {
              personCost = Number(financial.cost) || Number(financial.salary) || 0;
            }

            labourCost += personCost;
          }
        });
      }

      // 2. Linked Materials
      if (item.linkedMaterials && Array.isArray(item.linkedMaterials)) {
        item.linkedMaterials.forEach((mat: any) => {
          const qty = Number(mat.quantity) || 0;
          const matId = typeof mat.materialId === 'object' ? mat.materialId?._id : mat.materialId;

          const rawMat = rawMaterials.find((rm) => rm._id === matId);

          let unitPrice = 0;
          if (rawMat) {
            unitPrice = Number(rawMat.unitCost) || 0;
          } else {
            unitPrice = Number((mat.materialId as any)?.unitCost) || 0;
          }

          materialCost += qty * unitPrice;
        });
      }
    });

    // C. Calculate from ALL MRS Items for selected project (price * quantity) - SAME AS BUDGET PAGE
    if (selectedProjectId && mrsList && Array.isArray(mrsList) && mrsList.length > 0) {
      mrsList.forEach((mrs: any) => {
        if (!mrs) return;
        
        // Match project ID - include ALL MRS items for this project
        const mrsProjectId = String(mrs.projectId || '');
        const selectedId = String(selectedProjectId || '');
        
        if (mrsProjectId === selectedId) {
          const quantity = Number(mrs.quantity) || 0;
          const price = Number(mrs.price) || 0;
          
          // Calculate cost: price * quantity
          const mrsMaterialCost = quantity * price;
          
          // Add to material cost if we have valid values
          if (mrsMaterialCost > 0) {
            materialCost += mrsMaterialCost;
          }
        }
      });
    }

    return {
      material: materialCost,
      labour: labourCost,
      equipment: equipmentCost,
      other: otherCost,
      total: materialCost + labourCost + equipmentCost + otherCost,
    };
  }, [resources, wbs, rawMaterials, mrsList, selectedProjectId]);

  // Calculate monthly cost data
  const costData = useMemo(() => {
    if (!selectedProject) {
      return [
        { name: "Jan", Budget: 0, Actual: 0 },
        { name: "Feb", Budget: 0, Actual: 0 },
        { name: "Mar", Budget: 0, Actual: 0 },
      ];
    }

    const totalBudget = selectedProject.budget || 0;
    const totalActual = costs.total;

    // Get project start and end dates
    const startDate = selectedProject.startDate ? parseISO(selectedProject.startDate) : new Date();
    const endDate = selectedProject.endDate ? parseISO(selectedProject.endDate) : new Date();

    // Generate months from start to end (or last 3 months if dates not available)
    let months: Date[] = [];
    try {
      if (startDate && endDate && startDate <= endDate) {
        months = eachMonthOfInterval({
          start: startDate,
          end: endDate,
        });
      }
    } catch (error) {
      console.error("Error calculating months:", error);
    }

    // If no months available or less than 3, use last 3 months from today
    if (months.length === 0) {
      const today = new Date();
      months = [
        startOfMonth(new Date(today.getFullYear(), today.getMonth() - 2, 1)),
        startOfMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        startOfMonth(new Date(today.getFullYear(), today.getMonth(), 1)),
      ];
    }

    // Take first 3 months
    const displayMonths = months.slice(0, 3);

    // Distribute budget and actual costs across months (equal distribution)
    const monthlyBudget = displayMonths.length > 0 ? totalBudget / displayMonths.length : 0;
    const monthlyActual = displayMonths.length > 0 ? totalActual / displayMonths.length : 0;

    return displayMonths.map((month) => ({
      name: format(month, "MMM"),
      Budget: Math.round(monthlyBudget),
      Actual: Math.round(monthlyActual),
    }));
  }, [selectedProject, costs.total]);

  // Calculate Time vs Schedule data from project timeline and daily progress
  const scheduleData = useMemo(() => {
    if (!selectedProject || !selectedProject.startDate) {
      return [
        { week: "W1", Planned: 0, Actual: 0 },
        { week: "W2", Planned: 0, Actual: 0 },
        { week: "W3", Planned: 0, Actual: 0 },
        { week: "W4", Planned: 0, Actual: 0 },
      ];
    }

    const startDate = parseISO(selectedProject.startDate);
    const endDate = selectedProject.endDate ? parseISO(selectedProject.endDate) : new Date();
    
    // Calculate total project duration in days
    const totalDays = Math.max(1, differenceInDays(endDate, startDate));
    const totalWeeks = Math.ceil(totalDays / 7);
    
    // Filter daily progress for selected project
    const filteredProgress = dailyProgressItems.filter((item: any) => {
      // Check if progress item belongs to this project
      // Daily progress might have projectId or task field
      return item.projectId === selectedProjectId || 
             (item.task && wbs.some((w: any) => w.id === item.task && w.projectId === selectedProjectId));
    });

    // Group progress by week
    const weeklyData: { [key: string]: { planned: number; actual: number } } = {};
    
    // Calculate planned progress (linear progression over time)
    for (let week = 1; week <= Math.min(4, totalWeeks); week++) {
      const weekKey = `W${week}`;
      // Planned progress: (week / totalWeeks) * 100
      const plannedProgress = totalWeeks > 0 ? Math.round((week / totalWeeks) * 100) : 0;
      weeklyData[weekKey] = { planned: plannedProgress, actual: 0 };
    }

    // Calculate actual progress from daily progress entries
    filteredProgress.forEach((item: any) => {
      if (!item.date) return;
      
      const progressDate = parseISO(item.date);
      const daysFromStart = differenceInDays(progressDate, startDate);
      const weekNumber = Math.floor(daysFromStart / 7) + 1;
      
      if (weekNumber >= 1 && weekNumber <= 4) {
        const weekKey = `W${weekNumber}`;
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { planned: 0, actual: 0 };
        }
        // Use the maximum progress for that week (or average if multiple entries)
        weeklyData[weekKey].actual = Math.max(
          weeklyData[weekKey].actual,
          Math.round(item.percentComplete || 0)
        );
      }
    });

    // Also calculate from WBS items progress
    const filteredWBS = selectedProjectId
      ? wbs.filter((item) => item.projectId === selectedProjectId)
      : [];

    if (filteredWBS.length > 0) {
      // Calculate average progress from WBS items
      const avgProgress = filteredWBS.reduce((sum: number, item: any) => {
        return sum + (Number(item.progress) || 0);
      }, 0) / filteredWBS.length;

      // Distribute across weeks based on project timeline
      for (let week = 1; week <= Math.min(4, totalWeeks); week++) {
        const weekKey = `W${week}`;
        if (weeklyData[weekKey]) {
          // If no daily progress data, use WBS average progress scaled by week
          if (weeklyData[weekKey].actual === 0) {
            weeklyData[weekKey].actual = Math.round((week / totalWeeks) * avgProgress);
          }
        }
      }
    }

    // Convert to array format
    const result = [];
    for (let week = 1; week <= 4; week++) {
      const weekKey = `W${week}`;
      result.push({
        week: weekKey,
        Planned: weeklyData[weekKey]?.planned || 0,
        Actual: weeklyData[weekKey]?.actual || 0,
      });
    }

    return result;
  }, [selectedProject, dailyProgressItems, wbs, selectedProjectId]);

  // Calculate Material Consumption data from MRS and WBS
  const materialData = useMemo(() => {
    // Filter MRS items for selected project
    const filteredMRS = selectedProjectId
      ? mrsList.filter((mrs: any) => {
          const mrsProjectId = String(mrs.projectId || '');
          const selectedId = String(selectedProjectId || '');
          return mrsProjectId === selectedId;
        })
      : mrsList;

    // Filter WBS for selected project
    const filteredWBS = selectedProjectId
      ? wbs.filter((item) => item.projectId === selectedProjectId)
      : wbs;

    // Group materials by name
    const materialMap = new Map<string, { planned: number; used: number }>();

    // 1. Calculate Planned quantities from WBS linkedMaterials
    filteredWBS.forEach((wbsItem: any) => {
      if (wbsItem.linkedMaterials && Array.isArray(wbsItem.linkedMaterials)) {
        wbsItem.linkedMaterials.forEach((link: any) => {
          const rawMat = rawMaterials.find((rm) => rm._id === link.materialId);
          const materialName = rawMat?.name || link.materialName || 'Unknown';
          const quantity = Number(link.quantity) || 0;

          if (!materialMap.has(materialName)) {
            materialMap.set(materialName, { planned: 0, used: 0 });
          }
          const current = materialMap.get(materialName)!;
          current.planned += quantity;
        });
      }
    });

    // 2. Calculate Planned and Used quantities from MRS items
    filteredMRS.forEach((mrs: any) => {
      const materialName = mrs.item || 'Unknown';
      const quantity = Number(mrs.quantity) || 0;
      const status = mrs.status || 'open';

      if (!materialMap.has(materialName)) {
        materialMap.set(materialName, { planned: 0, used: 0 });
      }
      const current = materialMap.get(materialName)!;

      // Planned: all MRS items represent planned quantities (regardless of status)
      // This includes items that are planned, open, sent, or even ordered
      // Only exclude received items from planned (they're already used)
      if (status !== 'received' && status !== 'cancelled') {
        current.planned += quantity;
      }

      // Used: items with status received (actually consumed)
      if (status === 'received') {
        current.used += quantity;
      }
    });

    // Convert map to array and sort by planned quantity (descending)
    const materialArray = Array.from(materialMap.entries())
      .map(([name, data]) => ({
        name,
        Planned: Math.round(data.planned),
        Used: Math.round(data.used),
      }))
      .filter((item) => item.Planned > 0 || item.Used > 0) // Only show materials with some data
      .sort((a, b) => b.Planned - a.Planned) // Sort by planned quantity
      .slice(0, 10); // Take top 10 materials

    // If no data, return default empty data
    if (materialArray.length === 0) {
      return [
        { name: "Cement", Used: 0, Planned: 0 },
        { name: "Steel", Used: 0, Planned: 0 },
        { name: "Sand", Used: 0, Planned: 0 },
      ];
    }

    return materialArray;
  }, [mrsList, wbs, rawMaterials, selectedProjectId]);

  // Calculate Resource Utilization data from Budget page costs (Material, Labour, Equipment)
  const resourceData = useMemo(() => {
    // Use the same costs calculation as Budget page
    // costs object already has: material, labour, equipment, other, total
    
    const totalCost = costs.material + costs.labour + costs.equipment;
    
    // Calculate percentages for Material, Labour, Equipment
    let materialPercent = 0;
    let labourPercent = 0;
    let equipmentPercent = 0;
    
    if (totalCost > 0) {
      materialPercent = Math.round((costs.material / totalCost) * 100);
      labourPercent = Math.round((costs.labour / totalCost) * 100);
      equipmentPercent = Math.round((costs.equipment / totalCost) * 100);
      
      // Ensure percentages sum to 100 (handle rounding errors)
      const sum = materialPercent + labourPercent + equipmentPercent;
      if (sum !== 100) {
        // Adjust the largest value to make sum = 100
        const maxIndex = [materialPercent, labourPercent, equipmentPercent].indexOf(Math.max(materialPercent, labourPercent, equipmentPercent));
        if (maxIndex === 0) materialPercent += (100 - sum);
        else if (maxIndex === 1) labourPercent += (100 - sum);
        else equipmentPercent += (100 - sum);
      }
    }

    // Create array with all three categories - Material, Labour, Equipment
    // Always include all three, even if some are 0
    // IMPORTANT: Keep Material first to ensure it gets proper color
    const result = [
      { name: "Material", value: materialPercent, actualCost: costs.material },
      { name: "Labour", value: labourPercent, actualCost: costs.labour },
      { name: "Equipment", value: equipmentPercent, actualCost: costs.equipment },
    ];

    // Debug: Log Material data
    console.log('Resource Utilization Data:', {
      materialCost: costs.material,
      materialPercent,
      totalCost,
      result
    });

    // Sort by value descending (but keep all categories)
    return result.sort((a, b) => b.value - a.value);
  }, [costs]);

  // Calculate Project Profitability data from project cost, revenue, and profit
  const profitabilityData = useMemo(() => {
    if (!selectedProject) {
      return [
        { subject: "Cost", A: 0, fullMark: 100, actualValue: 0 },
        { subject: "Revenue", A: 0, fullMark: 100, actualValue: 0 },
        { subject: "Profit", A: 0, fullMark: 100, actualValue: 0 },
      ];
    }

    // Calculate actual values
    const actualCost = costs.total;
    const revenue = selectedProject.expectedRevenue || 0;
    const profit = revenue - actualCost;

    // Find the maximum value among cost, revenue, and absolute profit to set scale
    const maxValue = Math.max(
      actualCost,
      revenue,
      Math.abs(profit),
      1000 // Minimum scale to ensure chart is visible
    );

    // Set fullMark to maxValue (rounded up for cleaner display)
    // Round up to nearest appropriate increment based on value size
    let fullMark = 10000;
    if (maxValue >= 1000000) {
      fullMark = Math.ceil(maxValue / 100000) * 100000; // Round to nearest 100K
    } else if (maxValue >= 100000) {
      fullMark = Math.ceil(maxValue / 10000) * 10000; // Round to nearest 10K
    } else if (maxValue >= 10000) {
      fullMark = Math.ceil(maxValue / 1000) * 1000; // Round to nearest 1K
    } else {
      fullMark = Math.ceil(maxValue / 100) * 100 || 100; // Round to nearest 100
    }
    
    // For profit, if negative, show as 0 (loss) for visualization
    const profitValue = profit >= 0 ? profit : 0;

    // Use actual values for the chart - they will be scaled automatically by Recharts
    // Cost will be positioned according to its actual value relative to the scale
    return [
      { 
        subject: "Cost", 
        A: actualCost, // Use actual cost value
        fullMark: fullMark,
        actualValue: actualCost 
      },
      { 
        subject: "Revenue", 
        A: revenue, 
        fullMark: fullMark,
        actualValue: revenue 
      },
      { 
        subject: "Profit", 
        A: profitValue, 
        fullMark: fullMark,
        actualValue: profit 
      },
    ];
  }, [selectedProject, costs.total]);

  // Calculate Cash Flow Forecast data from invoices/milestones (inflow) and costs (outflow)
  const cashFlowData = useMemo(() => {
    if (!selectedProject) {
      return [
        { month: "Jan", inflow: 0, outflow: 0 },
        { month: "Feb", inflow: 0, outflow: 0 },
        { month: "Mar", inflow: 0, outflow: 0 },
      ];
    }

    const startDate = selectedProject.startDate ? parseISO(selectedProject.startDate) : new Date();
    const endDate = selectedProject.endDate ? parseISO(selectedProject.endDate) : new Date();

    // Generate months from start to end (or last 3 months if dates not available)
    let months: Date[] = [];
    try {
      if (startDate && endDate && startDate <= endDate) {
        months = eachMonthOfInterval({
          start: startDate,
          end: endDate,
        });
      }
    } catch (error) {
      console.error("Error calculating months:", error);
    }

    // If no months available or less than 3, use last 3 months from today
    if (months.length === 0) {
      const today = new Date();
      months = [
        startOfMonth(new Date(today.getFullYear(), today.getMonth() - 2, 1)),
        startOfMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        startOfMonth(new Date(today.getFullYear(), today.getMonth(), 1)),
      ];
    }

    // Take first 3 months
    const displayMonths = months.slice(0, 3);

    // Calculate monthly inflow from invoices and milestones
    const monthlyInflow: { [key: string]: number } = {};
    const monthlyOutflow: { [key: string]: number } = {};

    // Initialize months
    displayMonths.forEach((month) => {
      const monthKey = format(month, "MMM");
      monthlyInflow[monthKey] = 0;
      monthlyOutflow[monthKey] = 0;
    });

    // Filter invoices and milestones for selected project
    const projectInvoices = (invoices || []).filter((inv: any) => {
      // Check if invoice belongs to this project through milestone
      const milestone = (milestones || []).find((m: any) => m._id === inv.milestoneId);
      return milestone && milestone.projectId === selectedProjectId;
    });

    const projectMilestones = (milestones || []).filter(
      (m: any) => m.projectId === selectedProjectId
    );

    // Calculate inflow from invoices (paid amounts)
    projectInvoices.forEach((inv: any) => {
      if (inv.date && inv.status === "Paid" && inv.amount) {
        const invoiceDate = parseISO(inv.date);
        const monthKey = format(invoiceDate, "MMM");
        if (monthlyInflow.hasOwnProperty(monthKey)) {
          monthlyInflow[monthKey] += Number(inv.amount) || 0;
        }
      }
    });

    // Calculate inflow from milestones (billed amounts) - distribute over project timeline
    const totalBilled = projectMilestones.reduce((sum: number, m: any) => {
      return sum + (Number(m.billed) || 0);
    }, 0);

    // Distribute billed amount across months
    if (totalBilled > 0 && displayMonths.length > 0) {
      const monthlyBilled = totalBilled / displayMonths.length;
      displayMonths.forEach((month) => {
        const monthKey = format(month, "MMM");
        monthlyInflow[monthKey] += monthlyBilled;
      });
    }

    // If no invoices/milestones, use expected revenue distributed over months
    if (totalBilled === 0 && projectInvoices.length === 0) {
      const revenue = selectedProject.expectedRevenue || 0;
      const monthlyRevenue = revenue / displayMonths.length;
      displayMonths.forEach((month) => {
        const monthKey = format(month, "MMM");
        monthlyInflow[monthKey] = monthlyRevenue;
      });
    }

    // Calculate outflow from costs (distribute total cost across months)
    const totalCost = costs.total;
    const monthlyCost = displayMonths.length > 0 ? totalCost / displayMonths.length : 0;

    displayMonths.forEach((month) => {
      const monthKey = format(month, "MMM");
      monthlyOutflow[monthKey] = monthlyCost;
    });

    // Convert to array format
    return displayMonths.map((month) => ({
      month: format(month, "MMM"),
      inflow: Math.round(monthlyInflow[format(month, "MMM")] || 0),
      outflow: Math.round(monthlyOutflow[format(month, "MMM")] || 0),
    }));
  }, [selectedProject, invoices, milestones, costs.total, selectedProjectId]);

  // Fetch health report from API with retry mechanism
  const fetchHealthReport = async (retryCount = 0) => {
    if (!organisationId) {
      console.log("No organisationId found for health report");
      return;
    }
    
    setLoadingHealthReport(true);
    try {
      const url = selectedProjectId
        ? `${BASE_URL}/project-health-report/${selectedProjectId}?organisationId=${organisationId}`
        : `${BASE_URL}/project-health-report?organisationId=${organisationId}`;
      
      console.log("Fetching health report from:", url);
      const response = await api.get(url);
      console.log("Health report response:", response.data);
      
      if (response.data.success && response.data.data) {
        setHealthReport(response.data.data);
      } else {
        console.log("Health report API returned success: false or no data");
        // Retry once if no data and we have projects
        if (retryCount === 0 && projects.length > 0) {
          console.log("Retrying health report fetch...");
          setTimeout(() => fetchHealthReport(1), 1000);
          return;
        }
        setHealthReport(null);
      }
    } catch (error) {
      console.error("Error fetching health report:", error);
      // Retry once on error if we have projects
      if (retryCount === 0 && projects.length > 0) {
        console.log("Retrying health report fetch after error...");
        setTimeout(() => fetchHealthReport(1), 1000);
        return;
      }
      setHealthReport(null);
    } finally {
      setLoadingHealthReport(false);
    }
  };

  // Fetch profitability report from API
  const fetchProfitabilityReport = async () => {
    if (!organisationId) return;
    
    setLoadingProfitabilityReport(true);
    try {
      const url = selectedProjectId
        ? `${BASE_URL}/project-profitability-report/${selectedProjectId}?organisationId=${organisationId}`
        : `${BASE_URL}/project-profitability-report?organisationId=${organisationId}`;
      
      const response = await api.get(url);
      if (response.data.success) {
        setProfitabilityReport(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching profitability report:", error);
      setProfitabilityReport(null);
    } finally {
      setLoadingProfitabilityReport(false);
    }
  };

  // Fetch comparison report from API
  const fetchComparisonReport = async () => {
    if (!organisationId) return;
    
    setLoadingComparisonReport(true);
    try {
      const url = `${BASE_URL}/project-comparison-report?organisationId=${organisationId}`;
      const response = await api.get(url);
      if (response.data.success && response.data.data) {
        setComparisonReport(response.data.data);
      } else {
        setComparisonReport(null);
      }
    } catch (error: any) {
      console.error("Error fetching comparison report:", error);
      setComparisonReport(null);
    } finally {
      setLoadingComparisonReport(false);
    }
  };

  // Get health status color
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "at-risk":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Get health status badge color
  const getHealthStatusBadgeColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "at-risk":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Prepare health metrics data for chart
  const healthMetricsData = useMemo(() => {
    if (!healthReport) return [];

    // If showing all projects, use summary breakdown
    if (!selectedProjectId && healthReport.summary) {
      return [
        { name: "Healthy", value: healthReport.summary.healthyProjects || 0, color: "#22c55e" },
        { name: "At Risk", value: healthReport.summary.atRiskProjects || 0, color: "#f59e0b" },
        { name: "Critical", value: healthReport.summary.criticalProjects || 0, color: "#ef4444" },
      ];
    }

    // Single project health data - healthReport is the project health object
    if (selectedProjectId && healthReport.metrics) {
      return [
        { name: "Budget", score: healthReport.metrics?.budget?.score || 0, color: "#8884d8" },
        { name: "Schedule", score: healthReport.metrics?.schedule?.score || 0, color: "#82ca9d" },
        { name: "Progress", score: healthReport.metrics?.progress?.score || 0, color: "#ffc658" },
        { name: "Resource", score: healthReport.metrics?.resource?.score || 0, color: "#ff7f50" },
      ];
    }

    return [];
  }, [healthReport, selectedProjectId]);

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }
// ---------------------------------------------------------
// 🚀 FIX: Calculate Actual Costs per WBS from Resources
// ---------------------------------------------------------
const actualsByWbs = useMemo(() => {
  const map = new Map<string, number>();

  resources.forEach((res) => {
    if (res.projectId === selectedProjectId && res.wbsId) {
      const prev = map.get(res.wbsId) || 0;
      map.set(res.wbsId, prev + Number(res.totalCost || 0));
    }
  });

  return map;
}, [resources, selectedProjectId]);

// 2️⃣ Merge Budget + Actual + Variance
const budgetVsActualData = useMemo(() => {
  return budgets
    .filter((b) => b.projectId === selectedProjectId)
    .map((b) => {
      const actual = b.wbsId ? actualsByWbs.get(b.wbsId) || 0 : 0;

      return {
        activity: b.activity || "N/A",
        wbsId: b.wbsId,
        plannedAmount: b.plannedAmount || 0,
        actualAmount: actual,
        variance: actual - (b.plannedAmount || 0),
      };
    });
}, [budgets, actualsByWbs, selectedProjectId]);
// const activityData = useMemo(() => {
//   if (!wbs || !budgets) return [];

//   const map = {};

//   wbs.forEach((w) => {
//     const planned = budgets
//       .filter((b) => b.wbsId === w._id)
//       .reduce((a, b) => a + (b.plannedAmount || 0), 0);

//     const actual = budgets
//       .filter((b) => b.wbsId === w._id)
//       .reduce((a, b) => a + (b.actualAmount || 0), 0);

//     map[w._id] = {
//       activity: w.name,
//       planned,
//       actual,
//       variance: actual - planned,
//       variancePct: planned ? ((actual - planned) / planned) * 100 : 0,
//     };
//   });

//   return Object.values(map);
// }, [wbs, budgets]);

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
          <Select
            value={selectedProjectId || ""}
            onValueChange={(value) => setSelectedProjectId(value)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.code} - {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={forceRefreshReports} className="mr-2">
            <Activity className="h-4 w-4 mr-2" /> Refresh Reports
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full overflow-x-auto">
        <TabsList className="flex items-center w-full gap-1 overflow-x-auto scrollbar-hide px-2" style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}>
          <TabsTrigger value="analytics">Analytics Reports</TabsTrigger>
          <TabsTrigger value="comparison">Project Comparison</TabsTrigger>
          <TabsTrigger value="all-health">All Projects Health</TabsTrigger>
          <TabsTrigger value="all-profitability">All Projects Profitability</TabsTrigger>
          <TabsTrigger value="resource-utilisation">Resource Utilisation</TabsTrigger>
          {/* <TabsTrigger value="budget-vs-actual">Budget vs Actual Cost</TabsTrigger> */}
          <TabsTrigger value="activity-cost">Activity-wise Cost Sheet</TabsTrigger>
          <TabsTrigger value="project-create-close">Project Creation and Completion</TabsTrigger>
          <TabsTrigger value="wbs-create-close">
WBS Creation & Completion
</TabsTrigger>          <TabsTrigger value="mrs-sheet-creation">MRS Sheet Creation</TabsTrigger>
          <TabsTrigger value="mrs-purchase-order">MRS Purchase Order</TabsTrigger>
        </TabsList>
        </div>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
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
                <YAxis 
                  width={80}
                  tickFormatter={(value) => {
                    if (value >= 10000000) {
                      return `${(value / 10000000).toFixed(1)}Cr`;
                    } else if (value >= 100000) {
                      return `${(value / 100000).toFixed(1)}L`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`;
                    }
                    return value.toString();
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                />
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
          <CardHeader>
            <CardTitle>Resource Utilisation</CardTitle>
            {selectedProject && (
              <p className="text-xs text-muted-foreground mt-1">
                Material: ₹{costs.material.toLocaleString()} | Labour: ₹{costs.labour.toLocaleString()} | Equipment: ₹{costs.equipment.toLocaleString()}
              </p>
            )}
          </CardHeader>
          <CardContent className="h-[280px]">
            {resourceData.filter(item => item.value > 0).length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No resource data available. Add resources in the Resources page.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={resourceData.filter(item => item.value > 0)} 
                    dataKey="value" 
                    nameKey="name" 
                    outerRadius={80} 
                    label={(entry: any) => `${entry.name}: ${entry.value}%`}
                  >
                    {resourceData
                      .filter(item => item.value > 0)
                      .map((entry, index) => {
                        // Ensure Material gets a distinct color
                        let colorIndex = index;
                        if (entry.name === "Material") colorIndex = 0;
                        else if (entry.name === "Labour") colorIndex = 1;
                        else if (entry.name === "Equipment") colorIndex = 2;
                        return (
                          <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[colorIndex % COLORS.length]} />
                        );
                      })}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                      // Show actual cost values in tooltip
                      const actualCost = props.payload.actualCost || 0;
                      return [`${value}% (₹${actualCost.toLocaleString()})`, name];
                    }}
                  />
                  {/* <Legend 
                    formatter={(value: string) => {
                      // Show all categories in legend, even if value is 0
                      const dataItem = resourceData.find(r => r.name === value);
                      if (dataItem) {
                        const actualCost = dataItem.actualCost || 0;
                        return `${dataItem.name}: ${dataItem.value}% (₹${actualCost.toLocaleString()})`;
                      }
                      return value;
                    }}
                    payload={resourceData.map((item, index) => ({
                      value: item.name,
                      type: 'line' as const,
                      color: item.value > 0 ? COLORS[index % COLORS.length] : '#ccc',
                    }))}
                  /> */}
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Profitability */}
        <Card className="h-[350px]">
          <CardHeader>
            <CardTitle>Project Profitability</CardTitle>
            {selectedProject && (
              <p className="text-sm text-muted-foreground mt-1">
                Cost: ₹{costs.total.toLocaleString()} | Revenue: ₹{(selectedProject.expectedRevenue || 0).toLocaleString()} | Profit: ₹{((selectedProject.expectedRevenue || 0) - costs.total).toLocaleString()}
              </p>
            )}
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart 
                outerRadius={90} 
                data={profitabilityData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis 
                  angle={90}
                  domain={[0, profitabilityData.length > 0 ? profitabilityData[0].fullMark : 10000]}
                  tickFormatter={(value) => {
                    // Format large numbers (e.g., 10000 -> 10K, 1000000 -> 1M)
                    if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
                    return `₹${value}`;
                  }}
                  tickCount={6}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    const actualValue = props.payload.actualValue;
                    if (props.payload.subject === 'Profit' && actualValue < 0) {
                      return [`₹${Math.abs(actualValue).toLocaleString()} (Loss)`, name];
                    }
                    return [`₹${actualValue.toLocaleString()}`, name];
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
                <Radar 
                  name="Profitability" 
                  dataKey="A" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow Forecast */}
        <Card className="h-[350px]">
          <CardHeader><CardTitle>Cash Flow Forecast</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  width={80}
                  tickFormatter={(value) => {
                    if (value >= 10000000) {
                      return `${(value / 10000000).toFixed(1)}Cr`;
                    } else if (value >= 100000) {
                      return `${(value / 100000).toFixed(1)}L`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(1)}K`;
                    }
                    return value.toString();
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Legend />
                <Area type="monotone" dataKey="inflow" fill="#82ca9d" stroke="#82ca9d" />
                <Line type="monotone" dataKey="outflow" stroke="#8884d8" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Health Report */}
        <Card className="h-[350px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Project Health Report
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => fetchHealthReport()} 
                  disabled={loadingHealthReport}
                  className="ml-2"
                >
                  {loadingHealthReport ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "↻"
                  )}
                </Button>
              </CardTitle>
              {healthReport && selectedProjectId && (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getHealthStatusBadgeColor(healthReport.healthStatus)}`}>
                  {healthReport.healthStatus?.toUpperCase() || "UNKNOWN"}
                </span>
              )}
            </div>
            {healthReport && selectedProjectId && (
              <p className="text-sm text-muted-foreground mt-1">
                Overall Score: <span className={`font-semibold ${getHealthStatusColor(healthReport.healthStatus)}`}>
                  {healthReport.overallHealthScore?.toFixed(1) || 0}/100
                </span>
              </p>
            )}
            {healthReport && !selectedProjectId && healthReport.summary && (
              <p className="text-sm text-muted-foreground mt-1">
                Total Projects: {healthReport.summary.totalProjects} | 
                Healthy: {healthReport.summary.healthyProjects} | 
                At Risk: {healthReport.summary.atRiskProjects} | 
                Critical: {healthReport.summary.criticalProjects}
              </p>
            )}
          </CardHeader>
          <CardContent className="h-[280px]">
            {loadingHealthReport ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading health report...</p>
                </div>
              </div>
            ) : healthReport ? (
              selectedProjectId ? (
                // Single project health view
                <div className="space-y-4">
                  {/* Overall Health Score Gauge */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${(healthReport.overallHealthScore || 0) * 3.51} 351`}
                          className={getHealthStatusColor(healthReport.healthStatus).replace("text-", "stroke-")}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getHealthStatusColor(healthReport.healthStatus)}`}>
                            {healthReport.overallHealthScore?.toFixed(0) || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Health Metrics Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {healthMetricsData.map((metric: any) => (
                      <div key={metric.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{metric.name}</span>
                          <span className="font-semibold">{metric.score ? metric.score.toFixed(0) : metric.value || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${metric.score ? metric.score : 0}%`,
                              backgroundColor: metric.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // All projects summary view
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${(healthReport.summary.overallHealthScore || 0) * 3.51} 351`}
                          className="stroke-blue-600"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {healthReport.summary.overallHealthScore?.toFixed(0) || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Score</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Status Distribution */}
                  {healthMetricsData.length > 0 && (
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={healthMetricsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={60} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                          {healthMetricsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No health data available</p>
                  <p className="text-xs mt-1">Select a project to view health metrics</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Profitability Report */}
        <Card className="h-[350px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Project Profitability Report
              </CardTitle>
              {profitabilityReport && selectedProjectId && (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  profitabilityReport.isProfitable 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {profitabilityReport.isProfitable ? "PROFITABLE" : "LOSS"}
                </span>
              )}
            </div>
            {profitabilityReport && selectedProjectId && (
              <p className="text-sm text-muted-foreground mt-1">
                Profit: <span className={`font-semibold ${profitabilityReport.isProfitable ? "text-green-600" : "text-red-600"}`}>
                  ₹{profitabilityReport.profit?.toLocaleString() || 0}
                </span> | 
                Margin: <span className={`font-semibold ${profitabilityReport.isProfitable ? "text-green-600" : "text-red-600"}`}>
                  {profitabilityReport.profitMargin?.toFixed(1) || 0}%
                </span>
              </p>
            )}
            {profitabilityReport && !selectedProjectId && profitabilityReport.summary && (
              <p className="text-sm text-muted-foreground mt-1">
                Total Profit: ₹{profitabilityReport.summary.totalProfit?.toLocaleString() || 0} | 
                Avg Margin: {profitabilityReport.summary.averageProfitMargin?.toFixed(1) || 0}% | 
                Profitable: {profitabilityReport.summary.profitableProjects || 0}/{profitabilityReport.summary.totalProjects || 0}
              </p>
            )}
          </CardHeader>
          <CardContent className="h-[280px]">
            {loadingProfitabilityReport ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading profitability report...</p>
                </div>
              </div>
            ) : profitabilityReport ? (
              selectedProjectId ? (
                // Single project profitability view
                <div className="space-y-4">
                  {/* Profit/Loss Display */}
                  <div className="flex items-center justify-center">
                    <div className={`text-center ${profitabilityReport.isProfitable ? "text-green-600" : "text-red-600"}`}>
                      {profitabilityReport.isProfitable ? (
                        <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                      ) : (
                        <TrendingDown className="h-12 w-12 mx-auto mb-2" />
                      )}
                      <div className="text-3xl font-bold">
                        ₹{Math.abs(profitabilityReport.profit || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {profitabilityReport.isProfitable ? "Profit" : "Loss"}
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Revenue</div>
                      <div className="font-semibold text-green-600">
                        ₹{profitabilityReport.totalRevenue?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Cost</div>
                      <div className="font-semibold text-red-600">
                        ₹{profitabilityReport.totalCost?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Profit Margin</div>
                      <div className={`font-semibold ${profitabilityReport.isProfitable ? "text-green-600" : "text-red-600"}`}>
                        {profitabilityReport.profitMargin?.toFixed(1) || 0}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">ROI</div>
                      <div className={`font-semibold ${profitabilityReport.isProfitable ? "text-green-600" : "text-red-600"}`}>
                        {profitabilityReport.roi?.toFixed(1) || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // All projects summary view
                <div className="space-y-4">
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-muted-foreground">Total Revenue</div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{profitabilityReport.summary.totalRevenue?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-xs text-muted-foreground">Total Cost</div>
                      <div className="text-lg font-bold text-red-600">
                        ₹{profitabilityReport.summary.totalCost?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>

                  {/* Profit/Loss Summary */}
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Net Profit</div>
                    <div className={`text-2xl font-bold ${profitabilityReport.summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ₹{Math.abs(profitabilityReport.summary.totalProfit || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Avg Margin: {profitabilityReport.summary.averageProfitMargin?.toFixed(1) || 0}%
                    </div>
                  </div>

                  {/* Project Status */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                    <div className="text-center">
                      <div className="text-green-600 font-bold text-lg">
                        {profitabilityReport.summary.profitableProjects || 0}
                      </div>
                      <div className="text-muted-foreground">Profitable</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-bold text-lg">
                        {profitabilityReport.summary.lossProjects || 0}
                      </div>
                      <div className="text-muted-foreground">Loss</div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No profitability data available</p>
                  <p className="text-xs mt-1">Select a project to view profitability metrics</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6 mt-6">
          <div className="space-y-6">
            {/* Project Comparison Report */}
            <Card className="h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GitCompare className="h-5 w-5" />
                    Project Comparison Report
                  </CardTitle>
                  {comparisonReport && comparisonReport.summary && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {comparisonReport.summary.totalProjects} Projects
                    </span>
                  )}
                </div>
                {comparisonReport && comparisonReport.summary && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Avg Progress: {comparisonReport.summary.averageProgress?.toFixed(1) || 0}% | 
                    Profitable: {comparisonReport.summary.profitableProjects || 0}/{comparisonReport.summary.totalProjects || 0} | 
                    On Track: {comparisonReport.summary.onTrackProjects || 0}/{comparisonReport.summary.totalProjects || 0}
                  </p>
                )}
              </CardHeader>
              <CardContent className="h-[530px]">
                {loadingComparisonReport ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading comparison report...</p>
                    </div>
                  </div>
                ) : comparisonReport && comparisonReport.projects && comparisonReport.projects.length > 0 ? (
                  <div className="space-y-4 h-full flex flex-col">
                    {/* Comparison Chart - Budget vs Cost - Show ALL projects */}
                    {comparisonReport.comparison?.budgetVsCost && comparisonReport.comparison.budgetVsCost.length > 0 && (
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={comparisonReport.comparison.budgetVsCost}
                            margin={{ top: 5, right: 10, left: 0, bottom: comparisonReport.projects.length > 5 ? 80 : 50 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={comparisonReport.projects.length > 5 ? -60 : -45}
                              textAnchor="end"
                              height={comparisonReport.projects.length > 5 ? 90 : 70}
                              fontSize={comparisonReport.projects.length > 8 ? 8 : 9}
                              interval={0}
                            />
                            <YAxis 
                              width={60}
                              tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                return value.toString();
                              }}
                              fontSize={9}
                            />
                            <Tooltip 
                              formatter={(value: number) => `₹${value.toLocaleString()}`}
                              contentStyle={{ fontSize: '11px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="Budget" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Cost" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* All Projects Comparison Table - Show ALL projects */}
                    {comparisonReport.projects && comparisonReport.projects.length > 0 ? (
                      <div className="pt-2 border-t max-h-[200px] overflow-y-auto">
                        <div className="space-y-1 text-xs">
                          <div className="grid grid-cols-5 gap-1 font-semibold text-muted-foreground pb-1 border-b sticky top-0 bg-white">
                            <div className="truncate">Project</div>
                            <div className="text-right">Budget</div>
                            <div className="text-right">Cost</div>
                            <div className="text-right">Profit</div>
                            <div className="text-right">Progress</div>
                          </div>
                          {comparisonReport.projects.map((project: any, index: number) => (
                            <div key={project.projectId || index} className="grid grid-cols-5 gap-1 p-1 hover:bg-gray-50 rounded text-xs">
                              <div className="truncate font-medium" title={project.projectName}>
                                {project.projectCode || project.projectName || `Project ${index + 1}`}
                              </div>
                              <div className="text-right text-blue-600">
                                ₹{project.budget ? (project.budget / 1000).toFixed(0) : 0}K
                              </div>
                              <div className="text-right text-green-600">
                                ₹{project.totalCost ? (project.totalCost / 1000).toFixed(0) : 0}K
                              </div>
                              <div className={`text-right ${project.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                ₹{project.profit ? (Math.abs(project.profit) / 1000).toFixed(0) : 0}K
                              </div>
                              <div className="text-right text-purple-600">
                                {project.progress?.toFixed(0) || 0}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t text-center text-xs text-muted-foreground">
                        No projects found for comparison
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <GitCompare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comparison data available</p>
                      <p className="text-xs mt-1">Multiple projects needed for comparison</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Projects Health Tab */}
        <TabsContent value="all-health" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                All Projects Health Report
              </CardTitle>
              <CardDescription>
                Health metrics for all projects in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAllProjectsHealth ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : allProjectsHealth && allProjectsHealth.projects && allProjectsHealth.projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Overall Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Budget Health</TableHead>
                        <TableHead>Schedule Health</TableHead>
                        <TableHead>Progress Health</TableHead>
                        <TableHead>Resource Health</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allProjectsHealth.projects.map((project: any) => (
                        <TableRow key={project.projectId || project._id}>
                          <TableCell className="font-medium">
                            {project.projectName || project.name || "N/A"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {project.projectCode || project.code || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">
                                {project.overallHealthScore?.toFixed(1) || 0}
                              </span>
                              <span className="text-sm text-muted-foreground">/100</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getHealthStatusBadgeColor(project.healthStatus)}
                            >
                              {project.healthStatus?.toUpperCase() || "UNKNOWN"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{
                                    width: `${project.metrics?.budget?.score || 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8">
                                {project.metrics?.budget?.score || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{
                                    width: `${project.metrics?.schedule?.score || 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8">
                                {project.metrics?.schedule?.score || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-orange-600 h-2 rounded-full"
                                  style={{
                                    width: `${project.metrics?.progress?.score || 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8">
                                {project.metrics?.progress?.score || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-red-600 h-2 rounded-full"
                                  style={{
                                    width: `${project.metrics?.resource?.score || 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8">
                                {project.metrics?.resource?.score || 0}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No health data available for projects.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="project-create-close">
   <Card className="shadow-lg border border-muted">
  <CardHeader className="flex flex-row items-center justify-between">
    <div>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Calendar className="h-5 w-5 text-primary" />
        Project Lifecycle Report
      </CardTitle>
      <CardDescription className="mt-1">
        Creation, completion & duration with exact timestamps
      </CardDescription>
    </div>

    <Badge variant="outline" className="text-xs px-3 py-1">
      {projects.length} Projects
    </Badge>
  </CardHeader>

  <CardContent className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Completed</TableHead>
          <TableHead className="text-right">Duration</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {projects.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center py-10 text-muted-foreground"
            >
              No project lifecycle data available
            </TableCell>
          </TableRow>
        ) : (
          projects.map((project) => {
            const durationDays =
              project.projectDurationInDays ??
              (project.projectClosedAt && project.projectCreatedAt
                ? Math.ceil(
                    (new Date(project.projectClosedAt).getTime() -
                      new Date(project.projectCreatedAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null);

            return (
              <TableRow
                key={project._id}
                className="hover:bg-muted/40 transition"
              >
                {/* Project */}
                <TableCell>
                  <div className="font-semibold">{project.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {project.code}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge
                    className={
                      project.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : project.status === "active"
                        ? "bg-blue-100 text-blue-800"
                        : project.status === "on-hold"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {project.status.toUpperCase()}
                  </Badge>
                </TableCell>

                {/* Created */}
                <TableCell>
                  {project.projectCreatedAt ? (
                    <div>
                      <div className="font-medium">
                        {new Date(
                          project.projectCreatedAt
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(
                          project.projectCreatedAt
                        ).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>

                {/* Completed */}
                <TableCell>
                  {project.projectClosedAt ? (
                    <div>
                      <div className="font-medium text-green-700">
                        {new Date(
                          project.projectClosedAt
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(
                          project.projectClosedAt
                        ).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs text-muted-foreground"
                    >
                      In Progress
                    </Badge>
                  )}
                </TableCell>

                {/* Duration */}
                <TableCell className="text-right">
                  {durationDays ? (
                    <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                      ⏱ {durationDays} days
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </CardContent>
</Card>
        </TabsContent>
        {/* All Projects Profitability Tab */}
        <TabsContent value="all-profitability" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                All Projects Profitability Report
              </CardTitle>
              <CardDescription>
                Profitability metrics for all projects in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAllProjectsProfitability ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : allProjectsProfitability && allProjectsProfitability.projects && allProjectsProfitability.projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Profit/Loss</TableHead>
                        <TableHead>Profit Margin</TableHead>
                        <TableHead>ROI</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allProjectsProfitability.projects.map((project: any) => (
                        <TableRow key={project.projectId || project._id}>
                          <TableCell className="font-medium">
                            {project.projectName || project.name || "N/A"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {project.projectCode || project.code || "N/A"}
                          </TableCell>
                          <TableCell className="font-semibold text-green-700">
                            ₹{project.totalRevenue?.toLocaleString("en-IN") || 0}
                          </TableCell>
                          <TableCell className="font-semibold text-red-700">
                            ₹{project.totalCost?.toLocaleString("en-IN") || 0}
                          </TableCell>
                          <TableCell
                            className={`font-bold text-lg ${
                              (project.profit || 0) >= 0
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            ₹{project.profit?.toLocaleString("en-IN") || 0}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                (project.profitMargin || 0) >= 0
                                  ? "default"
                                  : "destructive"
                              }
                              className={
                                (project.profitMargin || 0) >= 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {project.profitMargin?.toFixed(2) || 0}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                (project.roi || 0) >= 0
                                  ? "default"
                                  : "destructive"
                              }
                              className={
                                (project.roi || 0) >= 0
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {project.roi?.toFixed(2) || 0}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                project.isProfitable
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {project.isProfitable ? "PROFITABLE" : "LOSS"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No profitability data available for projects.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="wbs-create-close">
  <Card className="shadow-xl border border-muted">
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          WBS Lifecycle Report
        </CardTitle>
        <CardDescription>
          Creation, completion & duration of WBS tasks
        </CardDescription>
      </div>

      <Badge variant="outline" className="text-xs px-3 py-1">
        {wbs.length} WBS Items
      </Badge>
    </CardHeader>

    <CardContent className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>WBS Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead className="text-right">Duration</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {wbs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                No WBS lifecycle data available
              </TableCell>
            </TableRow>
          ) : (
            wbs.map((item) => {
              const duration =
                item.wbsDurationInDays ??
                (item.wbsCompletedAt && item.wbsCreatedAt
                  ? Math.ceil(
                      (new Date(item.wbsCompletedAt).getTime() -
                        new Date(item.wbsCreatedAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null);

              return (
                <TableRow key={item._id} className="hover:bg-muted/40">
                  <TableCell className="font-semibold">
                    {item.name}
                  </TableCell>

                  <TableCell className="capitalize text-muted-foreground">
                    {item.type}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={
                        item.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : item.status === "active"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {item.wbsCreatedAt ? (
                      <>
                        <div className="font-medium">
                          {new Date(item.wbsCreatedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.wbsCreatedAt).toLocaleTimeString()}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    {item.wbsCompletedAt ? (
                      <>
                        <div className="font-medium text-green-700">
                          {new Date(item.wbsCompletedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.wbsCompletedAt).toLocaleTimeString()}
                        </div>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        In Progress
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    {duration ? (
                      <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                        ⏱ {duration} days
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</TabsContent>

        <TabsContent value="resource-utilisation" className="space-y-8 mt-6">

  {/* HEADER */}
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Resource Utilisation Report</h2>
      <p className="text-muted-foreground">
        Live analytics based on Material, Labour & Equipment consumption.
      </p>
    </div>

    <Badge className="px-4 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
      Project: {selectedProject?.name || "N/A"}
    </Badge>
  </div>

  {/* KPI CARDS */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[
      { label: "Material Cost", value: costs.material, color: "bg-emerald-500" },
      { label: "Labour Cost", value: costs.labour, color: "bg-amber-500" },
      { label: "Equipment Cost", value: costs.equipment, color: "bg-blue-500" },
    ].map((item, i) => (
      <Card key={i} className="border shadow-sm hover:shadow-md transition">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold">₹ {item.value.toLocaleString()}</p>

            <span className="text-xs text-muted-foreground">
              {Math.round((item.value / costs.total) * 100) || 0}% of total
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full mt-3 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 ${item.color} rounded-full transition-all`}
              style={{
                width: `${Math.round((item.value / costs.total) * 100)}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* PIE + BAR CHART COMBO */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

    {/* PIE CHART */}
    <Card className="h-[380px]">
      <CardHeader>
        <CardTitle className="text-lg">Overall Utilisation Ratio</CardTitle>
        <CardDescription>Percentage share of resources used</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id="materialGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <linearGradient id="labourGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              <linearGradient id="equipmentGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            <Pie
              data={resourceData}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              innerRadius={60}
              paddingAngle={3}
              stroke="none"
              label
            >
              <Cell fill="url(#materialGrad)" />
              <Cell fill="url(#labourGrad)" />
              <Cell fill="url(#equipmentGrad)" />
            </Pie>

            <Tooltip formatter={(value, name, props) => [
              `${value}% (₹${props.payload.actualCost.toLocaleString()})`,
              name,
            ]} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* BAR CHART */}
    <Card className="h-[380px]">
      <CardHeader>
        <CardTitle className="text-lg">Cost Breakdown (₹)</CardTitle>
        <CardDescription>Actual spend by resource type</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              { name: "Material", cost: costs.material },
              { name: "Labour", cost: costs.labour },
              { name: "Equipment", cost: costs.equipment },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `₹${v.toLocaleString()}`} />

            <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />

            <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
              <Cell fill="url(#materialGrad)" />
              <Cell fill="url(#labourGrad)" />
              <Cell fill="url(#equipmentGrad)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

  </div>

  {/* DETAILED TABLE */}
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle className="text-lg">Detailed Resource Report</CardTitle>
      <CardDescription>Cost, category & utilisation %</CardDescription>
    </CardHeader>

    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Resource</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Actual Cost</TableHead>
            <TableHead>Utilisation %</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {resourceData.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.name}</TableCell>
              <TableCell>₹ {r.actualCost.toLocaleString()}</TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{r.value}%</span>
                  {r.value > 40 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>
    </CardContent>
  </Card>

</TabsContent>

<TabsContent value="budget-vs-actual" className="space-y-10">

  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Budget vs Actual Report</h2>
      <p className="text-muted-foreground text-sm">
        Deep financial analysis with planned vs actual cost, variance trend, category breakdown & more.
      </p>
    </div>
  </div>

  {/* Loading */}
  {loading && (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )}

  {!loading && budgets.length === 0 && (
    <Card>
      <CardContent className="py-16 text-center text-muted-foreground">
        No budget entries found for this project.
      </CardContent>
    </Card>
  )}

  {budgets.length > 0 && (
    <>
      {/* TOP KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Planned */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-blue-100 to-blue-50">
          <CardHeader><CardTitle>Planned Budget</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ₹ {budgetVsActualData.reduce((a,b)=>a + (b.plannedAmount||0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Total Actual */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-green-100 to-green-50">
          <CardHeader><CardTitle>Actual Cost</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ₹ {budgets.reduce((a,b)=>a + (b.actualAmount||0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Variance */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-red-100 to-red-50">
          <CardHeader><CardTitle>Total Variance</CardTitle></CardHeader>
          <CardContent>
            {(() => {
              const planned = budgets.reduce((a,b)=>a + b.plannedAmount,0);
              const actual = budgets.reduce((a,b)=>a + b.actualAmount,0);
              const variance = actual - planned;
              return (
                <p className={`text-3xl font-bold ${variance>0?"text-red-700":"text-green-700"}`}>
                  ₹ {variance.toLocaleString()}
                </p>
              );
            })()}
          </CardContent>
        </Card>

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Bar Chart – Planned vs Actual */}
        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Planned vs Actual by Item</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgets.map(b => ({
                  name: b.description || "Item",
                  planned: b.plannedAmount,
                  actual: b.actualAmount
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Bar dataKey="planned" fill="#60a5fa" radius={[6,6,0,0]}/>
                <Bar dataKey="actual" fill="#34d399" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart – Variance Contribution */}
        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Variance Contribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  innerRadius={60}
                  outerRadius={110}
                  data={budgets.map(b=>({
                    name: b.description,
                    value: Math.abs(b.variance)
                  }))}
                  label
                  dataKey="value"
                  nameKey="name"
                >
                  {budgets.map((_,i)=>
                    <Cell key={i} fill={`hsl(${i*40},70%,55%)`} />
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* DETAILED TABLE */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Detailed Budget Breakdown</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {budgets.map((b)=>(
                <TableRow key={b._id}>
                  <TableCell>{b.description}</TableCell>
                  <TableCell>{b.category}</TableCell>
                  <TableCell>₹ {b.plannedAmount.toLocaleString()}</TableCell>
                  <TableCell>₹ {b.actualAmount.toLocaleString()}</TableCell>

                  <TableCell className={b.variance>0?"text-red-600":"text-green-600"}>
                    ₹ {b.variance.toLocaleString()}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={
                        b.status==="critical"
                          ?"bg-red-200 text-red-800"
                          :b.status==="over-budget"
                          ?"bg-yellow-200 text-yellow-800"
                          :"bg-green-200 text-green-800"
                      }
                    >
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </CardContent>
      </Card>
    </>
  )}

</TabsContent>
<TabsContent value="activity-cost">
  <ActivityCostSheet selectedProjectId={selectedProjectId} />
</TabsContent>

{/* MRS Sheet Creation Tab */}
<TabsContent value="mrs-sheet-creation" className="space-y-6 mt-6">
  <MRSSheetCreation />
</TabsContent>

{/* MRS Purchase Order Tab */}
<TabsContent value="mrs-purchase-order" className="space-y-6 mt-6">
  <MRSPurchaseOrder />
</TabsContent>

      </Tabs>

      {/* Saved Reports CRUD Table */}
      {/* <Card>
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
      </Card> */}

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
