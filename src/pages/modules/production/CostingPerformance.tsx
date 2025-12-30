import { usePermission } from "@/hooks/userPermission";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import {
  fetchStandards,
  createStandard,
  updateStandard,
  deleteStandard,
  fetchActuals,
  createActual,
  updateActual,
  deleteActual,
  fetchMetrics,
  createMetric,
  updateMetric,
  deleteMetric,
  StandardCost,
  ActualCost,
  PerfMetric,
} from "../../../redux/slices/production/costingPerformanceSlice";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Plus, Edit2, Trash2, Download, Upload, ShieldAlert, Loader2, MapPin, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

/* ----------------------------- Helpers ----------------------------- */
const sum = (arr: number[]) => arr.reduce((s, v) => s + Number(v || 0), 0);
const nowISO = () => new Date().toISOString();

// Debounce utility function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/* --------------------------- Component -------------------------- */
export default function CostingPerformance() {
  const dispatch = useDispatch<AppDispatch>();
  const { standards, actuals, metrics, loading, error, standardsPagination, actualsPagination, metricsPagination } = useSelector(
    (state: RootState) => state.costingPerformance
  );

  const canView = usePermission("costingPerformance", "view");
  const canCreate = usePermission("costingPerformance", "create");
  const canEdit = usePermission("costingPerformance", "edit");
  const canDelete = usePermission("costingPerformance", "delete");

  // ✅ LOCATION FILTERING STATE
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);
  const [locationFilter, setLocationFilter] = useState("all");
  const [locationOpen, setLocationOpen] = useState(false);

  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  // Pagination states
  const [standardsSearch, setStandardsSearch] = useState("");
  const [actualsSearch, setActualsSearch] = useState("");
  const [metricsSearch, setMetricsSearch] = useState("");

  // Debounced search handlers
  const debouncedStandardsSearch = useCallback(
    debounce((searchTerm: string) => {
      dispatch(fetchStandards({
        location: locationFilter !== "all" ? locationFilter : undefined,
        page: 1,
        limit: standardsPagination.itemsPerPage,
        search: searchTerm
      }));
    }, 300),
    [dispatch, locationFilter, standardsPagination.itemsPerPage]
  );

  const debouncedActualsSearch = useCallback(
    debounce((searchTerm: string) => {
      dispatch(fetchActuals({
        location: locationFilter !== "all" ? locationFilter : undefined,
        page: 1,
        limit: actualsPagination.itemsPerPage,
        search: searchTerm
      }));
    }, 300),
    [dispatch, locationFilter, actualsPagination.itemsPerPage]
  );

  const debouncedMetricsSearch = useCallback(
    debounce((searchTerm: string) => {
      dispatch(fetchMetrics({
        location: locationFilter !== "all" ? locationFilter : undefined,
        page: 1,
        limit: metricsPagination.itemsPerPage,
        search: searchTerm
      }));
    }, 300),
    [dispatch, locationFilter, metricsPagination.itemsPerPage]
  );

  // Search handlers
  const handleStandardsSearch = (value: string) => {
    setStandardsSearch(value);
    debouncedStandardsSearch(value);
  };

  const handleActualsSearch = (value: string) => {
    setActualsSearch(value);
    debouncedActualsSearch(value);
  };

  const handleMetricsSearch = (value: string) => {
    setMetricsSearch(value);
    debouncedMetricsSearch(value);
  };

  // Pagination handlers
  const handleStandardsPageChange = (page: number) => {
    dispatch(fetchStandards({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page,
      limit: standardsPagination.itemsPerPage,
      search: standardsSearch
    }));
  };

  const handleStandardsItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchStandards({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: 1,
      limit: itemsPerPage,
      search: standardsSearch
    }));
  };

  const handleActualsPageChange = (page: number) => {
    dispatch(fetchActuals({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page,
      limit: actualsPagination.itemsPerPage,
      search: actualsSearch
    }));
  };

  const handleActualsItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchActuals({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: 1,
      limit: itemsPerPage,
      search: actualsSearch
    }));
  };

  const handleMetricsPageChange = (page: number) => {
    dispatch(fetchMetrics({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page,
      limit: metricsPagination.itemsPerPage,
      search: metricsSearch
    }));
  };

  const handleMetricsItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchMetrics({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: 1,
      limit: itemsPerPage,
      search: metricsSearch
    }));
  };

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

  // dialogs / forms
  const [tab, setTab] = useState<"overview" | "standards" | "actuals" | "metrics">("overview");

  const [stdDialogOpen, setStdDialogOpen] = useState(false);
  const [stdForm, setStdForm] = useState<Partial<StandardCost & { location?: string }>>({});

  const [actDialogOpen, setActDialogOpen] = useState(false);
  const [actForm, setActForm] = useState<Partial<ActualCost & { location?: string }>>({ producedQty: 0 });

  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [metricForm, setMetricForm] = useState<Partial<PerfMetric & { location?: string }>>({ date: new Date().toISOString().slice(0, 10) });

  // Fetch Master Data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location"));
  }, [dispatch]);

  // Auto-set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
      // Also set form locations
      setStdForm(prev => ({ ...prev, location: userProfile.location }));
      setActForm(prev => ({ ...prev, location: userProfile.location }));
      setMetricForm(prev => ({ ...prev, location: userProfile.location }));
    }
  }, [isLocationRestricted, userProfile, locations]);

  // Load data on component mount and when location filter changes
  useEffect(() => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    
    dispatch(fetchStandards({
      location: locationParam,
      page: standardsPagination.currentPage,
      limit: standardsPagination.itemsPerPage,
      search: standardsSearch
    }));
    dispatch(fetchActuals({
      location: locationParam,
      page: actualsPagination.currentPage,
      limit: actualsPagination.itemsPerPage,
      search: actualsSearch
    }));
    dispatch(fetchMetrics({
      location: locationParam,
      page: metricsPagination.currentPage,
      limit: metricsPagination.itemsPerPage,
      search: metricsSearch
    }));
  }, [dispatch, locationFilter]);

  // Handle location filter change
  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    // Reset searches and fetch fresh data
    setStandardsSearch("");
    setActualsSearch("");
    setMetricsSearch("");
    
    // Fetch data with new location filter
    dispatch(fetchStandards({
      location: val !== "all" ? val : undefined,
      page: 1,
      limit: standardsPagination.itemsPerPage,
      search: ""
    }));
    dispatch(fetchActuals({
      location: val !== "all" ? val : undefined,
      page: 1,
      limit: actualsPagination.itemsPerPage,
      search: ""
    }));
    dispatch(fetchMetrics({
      location: val !== "all" ? val : undefined,
      page: 1,
      limit: metricsPagination.itemsPerPage,
      search: ""
    }));
  };

  // Helper to get location name
  const getLocationName = (locData: string | { _id: string; name: string } | undefined) => {
    if (!locData) return "No Location";
    if (typeof locData === 'object' && locData.name) return locData.name;
    const found = locations.find((l: any) => l._id === locData);
    return found ? found.name : "Unknown Location";
  };

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  /* --------------------- Derived analytics --------------------- */

  // Combine standards + actuals to compute variances per actual record where standard exists
  const actualsWithVariance = useMemo(() => {
    return actuals.map((a) => {
      const std = standards.find((s) => s.productId === a.productId);
      const standardTotal = std ? (std.material + std.labour + std.machine + std.overheads) * (a.producedQty / (std.unitQty || 1)) : 0;
      const actualTotal = sum([a.material, a.labour, a.machine, a.overheads]);
      const variance = actualTotal - standardTotal;
      const variancePct = standardTotal !== 0 ? (variance / standardTotal) * 100 : 0;
      // time variance: if start/end present -> duration in hours vs standard expected time (not in standard type, so we show recorded duration)
      let durationHours: number | null = null;
      if (a.startTime && a.endTime) {
        const dur = (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / (1000 * 60 * 60);
        durationHours = Math.round(dur * 100) / 100;
      }
      return { ...a, standardTotal, actualTotal, variance, variancePct, durationHours };
    });
  }, [actuals, standards]);

  // KPI calculations (simple but useful)
  const kpis = useMemo(() => {
    const totalProduced = sum(actuals.map((a) => a.producedQty));
    const totalMaterial = sum(actuals.map((a) => a.material));
    const totalLabour = sum(actuals.map((a) => a.labour));
    const totalMachine = sum(actuals.map((a) => a.machine));
    const totalOverheads = sum(actuals.map((a) => a.overheads));
    const totalActualCost = totalMaterial + totalLabour + totalMachine + totalOverheads;

    // yield & scrap: use metrics entries (average)
    const avgYield = metrics.length ? Math.round((sum(metrics.map((m) => m.yieldPct || 0)) / metrics.length) * 100) / 100 : 0;
    const avgScrap = metrics.length ? Math.round((sum(metrics.map((m) => m.scrapPct || 0)) / metrics.length) * 100) / 100 : 0;
    const avgMachineUtil = metrics.length ? Math.round((sum(metrics.map((m) => m.machineUtilPct || 0)) / metrics.length) * 100) / 100 : 0;
    const avgLabourEff = metrics.length ? Math.round((sum(metrics.map((m) => m.labourEffPct || 0)) / metrics.length) * 100) / 100 : 0;

    // average variance %
    const avgVariancePct = actualsWithVariance.length
      ? Math.round((sum(actualsWithVariance.map((a) => a.variancePct || 0)) / actualsWithVariance.length) * 100) / 100
      : 0;

    return {
      totalProduced,
      totalActualCost,
      avgYield,
      avgScrap,
      avgMachineUtil,
      avgLabourEff,
      avgVariancePct,
    };
  }, [actuals, metrics, /* actualsWithVariance used inside */]);

  /* ---------------------- CRUD Handlers ----------------------- */

  // Standards
  const saveStandard = async () => {
    if (!stdForm.productId) {
      toast.error("Product ID required");
      return;
    }

    if (!stdForm.location) {
      toast.error("Location required");
      return;
    }
    
    try {
      // Clean and format the data before sending
      const cleanedData = {
        productId: stdForm.productId,
        productName: stdForm.productName || undefined,
        location: stdForm.location, // ✅ ADD LOCATION
        unitQty: Number(stdForm.unitQty) || 1,
        material: Number(stdForm.material) || 0,
        labour: Number(stdForm.labour) || 0,
        machine: Number(stdForm.machine) || 0,
        overheads: Number(stdForm.overheads) || 0,
      };
      
      if (stdForm._id) {
        await dispatch(updateStandard({ 
          id: stdForm._id, 
          data: cleanedData 
        })).unwrap();
        toast.success("Standard updated successfully");
      } else {
        await dispatch(createStandard(cleanedData)).unwrap();
        toast.success("Standard created successfully");
      }
      setStdDialogOpen(false);
      setStdForm({});
    } catch (error: any) {
      console.error('Save Standard Error:', error);
      const errorMessage = error?.message || error || "Failed to save standard";
      toast.error(errorMessage);
    }
  };

  const editStandard = (id: string) => {
    const s = standards.find((x) => x._id === id);
    if (s) {
      setStdForm(s);
      setStdDialogOpen(true);
    }
  };

  const deleteStandardHandler = async (id: string) => {
    if (!confirm("Delete standard?")) return;
    
    try {
      await dispatch(deleteStandard(id)).unwrap();
      toast.success("Standard deleted successfully");
    } catch (error: any) {
      console.error('Delete Standard Error:', error);
      const errorMessage = error?.message || error || "Failed to delete standard";
      toast.error(errorMessage);
    }
  };

  // Actuals
  const saveActual = async () => {
    if (!actForm.productId) {
      toast.error("Product ID required");
      return;
    }
    if (!actForm.producedQty || actForm.producedQty <= 0) {
      toast.error("Produced Qty required");
      return;
    }
    if (!actForm.location) {
      toast.error("Location required");
      return;
    }
    
    try {
      // Clean and format the data before sending
      const cleanedData = {
        productId: actForm.productId,
        workOrderId: actForm.workOrderId || undefined,
        batchNo: actForm.batchNo || undefined,
        location: actForm.location, // ✅ ADD LOCATION
        producedQty: Number(actForm.producedQty),
        material: Number(actForm.material) || 0,
        labour: Number(actForm.labour) || 0,
        machine: Number(actForm.machine) || 0,
        overheads: Number(actForm.overheads) || 0,
        startTime: actForm.startTime || undefined,
        endTime: actForm.endTime || undefined,
        remarks: actForm.remarks || undefined,
      };
      
      if (actForm._id) {
        await dispatch(updateActual({ 
          id: actForm._id, 
          data: cleanedData 
        })).unwrap();
        toast.success("Actual cost updated successfully");
      } else {
        await dispatch(createActual(cleanedData)).unwrap();
        toast.success("Actual cost created successfully");
      }
      setActDialogOpen(false);
      setActForm({ producedQty: 0 });
    } catch (error: any) {
      console.error('Save Actual Error:', error);
      const errorMessage = error?.message || error || "Failed to save actual cost";
      toast.error(errorMessage);
    }
  };

  const editActual = (id: string) => {
    const a = actuals.find((x) => x._id === id);
    if (a) {
      setActForm(a);
      setActDialogOpen(true);
    }
  };

  const deleteActualHandler = async (id: string) => {
    if (!confirm("Delete actual record?")) return;
    
    try {
      await dispatch(deleteActual(id)).unwrap();
      toast.success("Actual cost deleted successfully");
    } catch (error: any) {
      console.error('Delete Actual Error:', error);
      const errorMessage = error?.message || error || "Failed to delete actual cost";
      toast.error(errorMessage);
    }
  };

  // Metrics
  const saveMetric = async () => {
    if (!metricForm.date) {
      toast.error("Date required");
      return;
    }
    if (!metricForm.location) {
      toast.error("Location required");
      return;
    }
    
    try {
      // Clean and format the data before sending
      const cleanedData = {
        productId: metricForm.productId || undefined,
        location: metricForm.location, // ✅ ADD LOCATION
        date: metricForm.date,
        yieldPct: metricForm.yieldPct ? Number(metricForm.yieldPct) : undefined,
        scrapPct: metricForm.scrapPct ? Number(metricForm.scrapPct) : undefined,
        machineUtilPct: metricForm.machineUtilPct ? Number(metricForm.machineUtilPct) : undefined,
        labourEffPct: metricForm.labourEffPct ? Number(metricForm.labourEffPct) : undefined,
        notes: metricForm.notes || undefined,
      };
      
      if (metricForm._id) {
        // Update existing metric
        await dispatch(updateMetric({ 
          id: metricForm._id, 
          data: cleanedData 
        })).unwrap();
        toast.success("Metric updated successfully");
      } else {
        // Create new metric
        await dispatch(createMetric(cleanedData)).unwrap();
        toast.success("Metric created successfully");
      }
      setMetricDialogOpen(false);
      setMetricForm({ date: new Date().toISOString().slice(0, 10) });
    } catch (error: any) {
      console.error('Save Metric Error:', error);
      const errorMessage = error?.message || error || "Failed to save metric";
      toast.error(errorMessage);
    }
  };

  const editMetric = (id: string) => {
    const m = metrics.find((x) => x._id === id);
    if (m) {
      setMetricForm(m);
      setMetricDialogOpen(true);
    }
  };

  const deleteMetricHandler = async (id: string) => {
    if (!confirm("Delete metric?")) return;
    
    try {
      await dispatch(deleteMetric(id)).unwrap();
      toast.success("Metric deleted successfully");
    } catch (error: any) {
      console.error('Delete Metric Error:', error);
      const errorMessage = error?.message || error || "Failed to delete metric";
      toast.error(errorMessage);
    }
  };

  /* ----------------------- Export / Import ---------------------- */
  const exportModule = () => {
    const dump = {
      standards,
      actuals,
      metrics,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CostingBackup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const importModule = async (file?: File) => {
    try {
      const f = file || (document.querySelector<HTMLInputElement>("#costing-import")?.files?.[0] as File);
      if (!f) {
        toast.error("Choose a JSON file to import");
        return;
      }
      const txt = await f.text();
      const parsed = JSON.parse(txt);
      
      // Import standards
      if (parsed.standards && Array.isArray(parsed.standards)) {
        for (const standard of parsed.standards) {
          try {
            await dispatch(createStandard(standard)).unwrap();
          } catch (error) {
            console.error("Failed to import standard:", error);
          }
        }
      }
      
      // Import actuals
      if (parsed.actuals && Array.isArray(parsed.actuals)) {
        for (const actual of parsed.actuals) {
          try {
            await dispatch(createActual(actual)).unwrap();
          } catch (error) {
            console.error("Failed to import actual:", error);
          }
        }
      }
      
      // Import metrics
      if (parsed.metrics && Array.isArray(parsed.metrics)) {
        for (const metric of parsed.metrics) {
          try {
            await dispatch(createMetric(metric)).unwrap();
          } catch (error) {
            console.error("Failed to import metric:", error);
          }
        }
      }
      
      toast.success("Import completed successfully");
    } catch (err) {
      console.error(err);
      toast.error("Import failed");
    }
  };

  /* ------------------------- Charts Data ----------------------- */
  const costVarianceBar = useMemo(() => {
    // show top N variances by productId
    const grouped: Record<string, { variance: number; productName?: string }> = {};
    actualsWithVariance.forEach((a) => {
      const key = a.productId || "unknown";
      grouped[key] = grouped[key] || { variance: 0, productName: a.productId };
      grouped[key].variance += a.variance || 0;
    });
    return Object.entries(grouped).map(([productId, v]) => ({ productId, variance: Math.round(v.variance * 100) / 100, name: v.productName }));
  }, [actualsWithVariance]);

  const timeVarianceLine = useMemo(() => {
    // average durationHours per day
    const map: Record<string, { total: number; count: number }> = {};
    actualsWithVariance.forEach((a) => {
      if (!a.durationHours) return;
      const day = (a.startTime || a.recordedAt || nowISO()).slice(0, 10);
      map[day] = map[day] || { total: 0, count: 0 };
      map[day].total += a.durationHours || 0;
      map[day].count += 1;
    });
    return Object.entries(map).map(([date, v]) => ({ date, avgHours: Math.round((v.total / v.count) * 100) / 100 }));
  }, [actualsWithVariance]);

  const budgetUtilDonut = useMemo(() => {
    // compare planned (sum of standards for produced qty) vs actual cost
    const planned = sum(actualsWithVariance.map((a) => a.standardTotal || 0));
    const actual = sum(actualsWithVariance.map((a) => a.actualTotal || 0));
    const remaining = Math.max(0, planned - actual);
    return [
      { name: "Actual", value: actual },
      { name: "Remaining (Planned - Actual)", value: remaining },
    ];
  }, [actualsWithVariance]);

  /* --------------- small UI helpers --------------- */
  const openNewStandard = () => {
    setStdForm({ location: isLocationRestricted ? userProfile?.location : "" });
    setStdDialogOpen(true);
  };
  const openNewActual = () => {
    setActForm({ producedQty: 0, location: isLocationRestricted ? userProfile?.location : "" });
    setActDialogOpen(true);
  };
  const openNewMetric = () => {
    setMetricForm({ date: new Date().toISOString().slice(0, 10), location: isLocationRestricted ? userProfile?.location : "" });
    setMetricDialogOpen(true);
  };

  // Show loading spinner if data is loading
  if (loading && standards.length === 0 && actuals.length === 0 && metrics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading costing data...</span>
      </div>
    );
  }

  /* ----------------------- Render --------------------------- */
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Costing & Performance Analysis</h1>
          <p className="text-muted-foreground mt-1">Standard vs Actual costing, variance analysis, and production KPIs.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* ✅ LOCATION FILTER */}
          <Select 
            disabled={isLocationRestricted} 
            value={locationFilter} 
            onValueChange={handleLocationFilterChange}
          >
            <SelectTrigger className="w-48">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc: any) => (
                <SelectItem key={loc._id} value={loc._id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="w-full"
            disabled={!canCreate && !canEdit} // or choose canEdit only
            onClick={() => (canCreate || canEdit) && exportModule()}
          >
            <Download className="mr-2" />Export
          </Button>

          <label className="w-full">
            <input id="costing-import" type="file" accept="application/json" className="hidden" onChange={() => importModule()} />
            <Button className="w-full"><Upload className="mr-2" />Import</Button>
          </label>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as "overview" | "standards" | "actuals" | "metrics")}>
        <TabsList className="flex gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="actuals">Actuals</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle>Total Produced</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-semibold">{kpis.totalProduced}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Actual Cost</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-semibold">₹{kpis.totalActualCost.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Avg Variance %</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-semibold">{kpis.avgVariancePct}%</div></CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Cost Variance (by product)</CardTitle></CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costVarianceBar}>
                    <XAxis dataKey="productId" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="variance" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Time Variance (avg hrs)</CardTitle></CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeVarianceLine}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="avgHours" stroke="#2563EB" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Budget Utilisation</CardTitle></CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={budgetUtilDonut} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                      {budgetUtilDonut.map((_, i) => <Cell key={i} fill={i === 0 ? "#10B981" : "#F59E0B"} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="standards">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-xl font-semibold">Standard Costs ({standardsPagination.totalItems})</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={standardsSearch}
                  onChange={(e) => handleStandardsSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                disabled={!canCreate}
                onClick={() => canCreate && openNewStandard()}
                className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
              >
                <Plus className="mr-2" />New Standard
              </Button>
            </div>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Per Unit (material/labour/machine/overhead)</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {loading ? "Loading..." : "No standards found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    standards.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell>{s.productId} {s.productName ? `— ${s.productName}` : ""}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {getLocationName((s as any).location)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ₹{((s.material + s.labour + s.machine + s.overheads) || 0).toFixed(2)}<div className="text-sm text-muted-foreground">
                            M:{s.material} L:{s.labour} Mc:{s.machine} O:{s.overheads}
                          </div>
                        </TableCell>
                        <TableCell>{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "—"}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            className="w-full"
                            disabled={!canEdit}
                            onClick={() => canEdit && editStandard(s._id)}
                          >
                            <Edit2 className="mr-2" />Edit
                          </Button>

                          <Button
                            className="w-full"
                            disabled={!canDelete}
                            onClick={() => canDelete && deleteStandardHandler(s._id)}
                          >
                            <Trash2 className="mr-2" />Delete
                          </Button>

                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination for Standards */}
              <Pagination
                currentPage={standardsPagination.currentPage}
                totalPages={standardsPagination.totalPages}
                totalItems={standardsPagination.totalItems}
                itemsPerPage={standardsPagination.itemsPerPage}
                onPageChange={handleStandardsPageChange}
                onItemsPerPageChange={handleStandardsItemsPerPageChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actuals">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-xl font-semibold">Actual Costs (Production Runs) ({actualsPagination.totalItems})</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, work orders..."
                  value={actualsSearch}
                  onChange={(e) => handleActualsSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                className="w-full md:w-48"
                disabled={!canCreate}
                onClick={() => canCreate && openNewActual()}
              >
                <Plus className="mr-2" />New Actual
              </Button>
            </div>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WO / Batch</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Actual vs Std (₹ / %)</TableHead>
                    <TableHead>Time (hrs)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actualsWithVariance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {loading ? "Loading..." : "No actual costs found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    actualsWithVariance.map((a) => (
                      <TableRow key={a._id}>
                        <TableCell>{a.workOrderId || a.batchNo || a._id}</TableCell>
                        <TableCell>{a.productId}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {getLocationName((a as any).location)}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.producedQty}</TableCell>
                        <TableCell>
                          ₹{(a.actualTotal || 0).toFixed(2)} vs ₹{(a.standardTotal || 0).toFixed(2)} <div className="text-sm">{(a.variancePct || 0).toFixed(2)}%</div>
                        </TableCell>
                        <TableCell>{a.durationHours ?? "—"}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            className="w-full"
                            disabled={!canEdit}
                            onClick={() => canEdit && editActual(a._id)}
                          >
                            <Edit2 className="mr-2" />Edit
                          </Button>

                          <Button
                            className="w-full"
                            disabled={!canDelete}
                            onClick={() => canDelete && deleteActualHandler(a._id)}
                          >
                            <Trash2 className="mr-2" />Delete
                          </Button>

                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination for Actuals */}
              <Pagination
                currentPage={actualsPagination.currentPage}
                totalPages={actualsPagination.totalPages}
                totalItems={actualsPagination.totalItems}
                itemsPerPage={actualsPagination.itemsPerPage}
                onPageChange={handleActualsPageChange}
                onItemsPerPageChange={handleActualsItemsPerPageChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
                      

        <TabsContent value="metrics">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-xl font-semibold">Performance Metrics ({metricsPagination.totalItems})</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, notes..."
                  value={metricsSearch}
                  onChange={(e) => handleMetricsSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                disabled={!canCreate}
                onClick={() => canCreate && openNewMetric()}
                className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
              >
                <Plus className="mr-2" />New Metric
              </Button>
            </div>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Yield %</TableHead>
                    <TableHead>Scrap %</TableHead>
                    <TableHead>Machine Util %</TableHead>
                    <TableHead>Labour Eff %</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {loading ? "Loading..." : "No metrics found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    metrics.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell>{m.date}</TableCell>
                        <TableCell>{m.productId || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {getLocationName((m as any).location)}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.yieldPct ?? "—"}</TableCell>
                        <TableCell>{m.scrapPct ?? "—"}</TableCell>
                        <TableCell>{m.machineUtilPct ?? "—"}</TableCell>
                        <TableCell>{m.labourEffPct ?? "—"}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            disabled={!canEdit}
                            onClick={() => canEdit && editMetric(m._id)}
                            className={canEdit ? "" : "opacity-50 cursor-not-allowed"}
                          >
                            Edit
                          </Button>

                          <Button
                            disabled={!canDelete}
                            onClick={() => canDelete && deleteMetricHandler(m._id)}
                            className={canDelete ? "" : "opacity-50 cursor-not-allowed"}
                          >
                            Delete
                          </Button>

                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination for Metrics */}
              <Pagination
                currentPage={metricsPagination.currentPage}
                totalPages={metricsPagination.totalPages}
                totalItems={metricsPagination.totalItems}
                itemsPerPage={metricsPagination.itemsPerPage}
                onPageChange={handleMetricsPageChange}
                onItemsPerPageChange={handleMetricsItemsPerPageChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Standard Dialog */}
      <Dialog open={stdDialogOpen} onOpenChange={setStdDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{stdForm._id ? "Edit Standard" : "New Standard"}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Product ID</Label>
            <Input value={stdForm.productId || ""} onChange={(e) => setStdForm({ ...stdForm, productId: e.target.value })} />
            <Label>Product Name</Label>
            <Input value={stdForm.productName || ""} onChange={(e) => setStdForm({ ...stdForm, productName: e.target.value })} />
            
            {/* ✅ LOCATION FIELD */}
            <div className="flex flex-col gap-2">
              <Label>Location *</Label>
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                    disabled={isLocationRestricted}
                  >
                    {stdForm.location
                      ? locations.find((l: any) => l._id === stdForm.location)?.name
                      : "Select Location"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                
                {!isLocationRestricted && (
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search location..." />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          {locations.map((l: any) => (
                            <CommandItem
                              key={l._id}
                              value={l.name}
                              onSelect={() => {
                                setStdForm({ ...stdForm, location: l._id });
                                setLocationOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  stdForm.location === l._id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {l.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
              {isLocationRestricted && (
                <p className="text-[10px] text-muted-foreground">
                  *Location is fixed based on your permissions.
                </p>
              )}
            </div>

            <Label>Unit Qty (per standard)</Label>
            <Input type="number" value={stdForm.unitQty ?? 1} onChange={(e) => setStdForm({ ...stdForm, unitQty: Number(e.target.value) })} />
            <Label>Material</Label>
            <Input type="number" value={stdForm.material ?? 0} onChange={(e) => setStdForm({ ...stdForm, material: Number(e.target.value) })} />
            <Label>Labour</Label>
            <Input type="number" value={stdForm.labour ?? 0} onChange={(e) => setStdForm({ ...stdForm, labour: Number(e.target.value) })} />
            <Label>Machine</Label>
            <Input type="number" value={stdForm.machine ?? 0} onChange={(e) => setStdForm({ ...stdForm, machine: Number(e.target.value) })} />
            <Label>Overheads</Label>
            <Input type="number" value={stdForm.overheads ?? 0} onChange={(e) => setStdForm({ ...stdForm, overheads: Number(e.target.value) })} />
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!(stdForm._id ? canEdit : canCreate)}
              onClick={() => (stdForm._id ? canEdit : canCreate) && saveStandard()}
            >
              Save Standard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actual Dialog */}
      <Dialog open={actDialogOpen} onOpenChange={setActDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{actForm._id ? "Edit Actual" : "New Actual"}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Work Order / Batch</Label>
            <Input value={actForm.workOrderId || actForm.batchNo || ""} onChange={(e) => setActForm({ ...actForm, workOrderId: e.target.value })} />
            <Label>Product ID</Label>
            <Input value={actForm.productId || ""} onChange={(e) => setActForm({ ...actForm, productId: e.target.value })} />
            
            {/* ✅ LOCATION FIELD */}
            <div className="flex flex-col gap-2">
              <Label>Location *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                    disabled={isLocationRestricted}
                  >
                    {actForm.location
                      ? locations.find((l: any) => l._id === actForm.location)?.name
                      : "Select Location"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                
                {!isLocationRestricted && (
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search location..." />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          {locations.map((l: any) => (
                            <CommandItem
                              key={l._id}
                              value={l.name}
                              onSelect={() => {
                                setActForm({ ...actForm, location: l._id });
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  actForm.location === l._id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {l.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
              {isLocationRestricted && (
                <p className="text-[10px] text-muted-foreground">
                  *Location is fixed based on your permissions.
                </p>
              )}
            </div>

            <Label>Produced Qty</Label>
            <Input type="number" value={actForm.producedQty || 0} onChange={(e) => setActForm({ ...actForm, producedQty: Number(e.target.value) })} />
            <Label>Material Cost (total)</Label>
            <Input type="number" value={actForm.material || 0} onChange={(e) => setActForm({ ...actForm, material: Number(e.target.value) })} />
            <Label>Labour Cost (total)</Label>
            <Input type="number" value={actForm.labour || 0} onChange={(e) => setActForm({ ...actForm, labour: Number(e.target.value) })} />
            <Label>Machine Cost (total)</Label>
            <Input type="number" value={actForm.machine || 0} onChange={(e) => setActForm({ ...actForm, machine: Number(e.target.value) })} />
            <Label>Overheads (total)</Label>
            <Input type="number" value={actForm.overheads || 0} onChange={(e) => setActForm({ ...actForm, overheads: Number(e.target.value) })} />
            <Label>Start Time (ISO)</Label>
            <Input value={actForm.startTime || ""} onChange={(e) => setActForm({ ...actForm, startTime: e.target.value })} />
            <Label>End Time (ISO)</Label>
            <Input value={actForm.endTime || ""} onChange={(e) => setActForm({ ...actForm, endTime: e.target.value })} />
            <Label>Remarks</Label>
            <Input value={actForm.remarks || ""} onChange={(e) => setActForm({ ...actForm, remarks: e.target.value })} />
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!(actForm._id ? canEdit : canCreate)}
              onClick={() => (actForm._id ? canEdit : canCreate) && saveActual()}
            >
              Save Actual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Dialog */}
      <Dialog open={metricDialogOpen} onOpenChange={setMetricDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{metricForm._id ? "Edit Metric" : "New Metric"}</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input value={metricForm.date || ""} onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })} />
            <Label>Product ID (optional)</Label>
            <Input value={metricForm.productId || ""} onChange={(e) => setMetricForm({ ...metricForm, productId: e.target.value })} />
            
            {/* ✅ LOCATION FIELD */}
            <div className="flex flex-col gap-2">
              <Label>Location *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                    disabled={isLocationRestricted}
                  >
                    {metricForm.location
                      ? locations.find((l: any) => l._id === metricForm.location)?.name
                      : "Select Location"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                
                {!isLocationRestricted && (
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search location..." />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          {locations.map((l: any) => (
                            <CommandItem
                              key={l._id}
                              value={l.name}
                              onSelect={() => {
                                setMetricForm({ ...metricForm, location: l._id });
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  metricForm.location === l._id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {l.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
              {isLocationRestricted && (
                <p className="text-[10px] text-muted-foreground">
                  *Location is fixed based on your permissions.
                </p>
              )}
            </div>

            <Label>Yield %</Label>
            <Input type="number" value={metricForm.yieldPct || ""} onChange={(e) => setMetricForm({ ...metricForm, yieldPct: Number(e.target.value) })} />
            <Label>Scrap %</Label>
            <Input type="number" value={metricForm.scrapPct || ""} onChange={(e) => setMetricForm({ ...metricForm, scrapPct: Number(e.target.value) })} />
            <Label>Machine Util %</Label>
            <Input type="number" value={metricForm.machineUtilPct || ""} onChange={(e) => setMetricForm({ ...metricForm, machineUtilPct: Number(e.target.value) })} />
            <Label>Labour Eff %</Label>
            <Input type="number" value={metricForm.labourEffPct || ""} onChange={(e) => setMetricForm({ ...metricForm, labourEffPct: Number(e.target.value) })} />
            <Label>Notes</Label>
            <Input value={metricForm.notes || ""} onChange={(e) => setMetricForm({ ...metricForm, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!(metricForm._id ? canEdit : canCreate)}
              onClick={() => (metricForm._id ? canEdit : canCreate) && saveMetric()}
            >
              Save Metric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
