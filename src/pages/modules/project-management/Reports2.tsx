"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
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
import { Calendar, BarChart3, Filter, Plus, Trash2, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../../components/ui/dialog";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays } from "date-fns";
import { usePermission } from "@/hooks/userPermission";

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

  // Fetch projects on mount
  useEffect(() => {
    if (organisationId) {
      dispatch(fetchProjects({ page: 1, limit: 100 }));
      dispatch(fetchMaterials());
      dispatch(fetchMRS());
      dispatch(fetchDailyProgress());
      dispatch(fetchMilestones());
      dispatch(fetchInvoices());
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
      dispatch(fetchWbsByProject(selectedProjectId));
    }
  }, [selectedProjectId, dispatch]);

  const canView = usePermission('projectReports', 'view');

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

  // Calculate costs similar to Budget page
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
      } else if (res.resourceType === "equipment") {
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

    return {
      material: materialCost,
      labour: labourCost,
      equipment: equipmentCost,
      other: otherCost,
      total: materialCost + labourCost + equipmentCost + otherCost,
    };
  }, [resources, wbs, rawMaterials, selectedProjectId]);

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
      </div>

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
