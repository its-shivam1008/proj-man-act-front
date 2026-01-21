import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  StandardCost,
  createActual,
  createMetric,
  createStandard,
  deleteActual,
  deleteMetric,
  deleteStandard,
  fetchActuals,
  fetchMetrics,
  fetchStandards,
  updateActual,
  updateMetric,
  updateStandard
} from '@/redux/slices/production/costingPerformanceSlice'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  MapPin,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { fetchWorkOrders } from "@/redux/slices/production/workOrderSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
/* ----------------------------- Types ----------------------------- */
// interface StandardCost {
//   _id: string;
//   productId: string;
//   productName?: string;
//   location: string;
//   unitQty: number;
//   material: number;
//   labour: number;
//   machine: number;
//   overheads: number;
//   updatedAt: string;
// }

// interface ActualCost {
//   _id: string;
//   workOrderId?: string;
//   batchNo?: string;
//   productId: string;
//   location: string;
//   producedQty: number;
//   material: number;
//   labour: number;
//   machine: number;
//   overheads: number;
//   startTime?: string;
//   endTime?: string;
//   remarks?: string;
//   recordedAt: string;
// }

// interface PerfMetric {
//   _id: string;
//   productId?: string;
//   location: string;
//   date: string;
//   yieldPct?: number;
//   scrapPct?: number;
//   machineUtilPct?: number;
//   labourEffPct?: number;
//   notes?: string;
// }

// interface Location {
//   _id: string;
//   name: string;
// }

/* ----------------------------- Helpers ----------------------------- */
const sum = (arr: number[]) => arr.reduce((s, v) => s + Number(v || 0), 0);
const nowISO = () => new Date().toISOString();
const generateId = () => Math.random().toString(36).substr(2, 9);
const Pagination = ({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-end items-center gap-2 py-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </Button>

      <span className="text-sm">
        Page <b>{page}</b> of <b>{totalPages}</b>
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
};


/* --------------------------- Component -------------------------- */
export default function CostingPerformance() {

  const dispatch = useDispatch<AppDispatch>();
  const {
    standards,
    actuals,
    metrics,
    loading,
    error,
  } = useSelector((state: RootState) => state.costingPerformance);
  const { products } = useSelector((state: RootState) => state.products);
  const { list: orders, pagination } = useSelector(
    (state: RootState) => state.workOrders
  );
  const PAGE_SIZE = 10;

  const [standardsPage, setStandardsPage] = useState(1);
  const [actualsPage, setActualsPage] = useState(1);
  const [metricsPage, setMetricsPage] = useState(1);

  const {
    standardsPagination,
    actualsPagination,
    metricsPagination,
  } = useSelector((state: RootState) => state.costingPerformance);


  const { locations = [] } = useSelector((state: RootState) => state.masterData);

  // Filter state
  const [locationFilter, setLocationFilter] = useState("all");

  // Search state
  const [standardsSearch, setStandardsSearch] = useState("");
  const [actualsSearch, setActualsSearch] = useState("");
  const [metricsSearch, setMetricsSearch] = useState("");
  const orgID = localStorage.getItem('organisationId') || undefined;
  // Tab state
  const [tab, setTab] = useState<"overview" | "standards" | "actuals" | "metrics">("overview");

  // Dialog states
  const [stdDialogOpen, setStdDialogOpen] = useState(false);
  const [stdForm, setStdForm] = useState<Partial<StandardCost>>({});

  const [actDialogOpen, setActDialogOpen] = useState(false);
  const [actForm, setActForm] = useState<Partial<ActualCost>>({ producedQty: 0 });

  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [metricForm, setMetricForm] = useState<Partial<PerfMetric>>({
    date: new Date().toISOString().slice(0, 10),
  });

  // Helper to get location name
  const getLocationName = (locId: string | undefined) => {
    if (!locId) return "No Location";
    const found = locations.find((l) => l._id === locId);
    return found ? found.name : "Unknown Location";
  };

  // const orgID = localStorage.getItem('organisationId') || undefined;


  // Filter data by location
  const filteredStandards = standards;
  const filteredActuals = actuals;
  const filteredMetrics = metrics;


  /* --------------------- Derived analytics --------------------- */
  const actualsWithVariance = useMemo(() => {
    return filteredActuals.map((a) => {
      // const std = standards.find((s) => s.productId === a.productId);
      const std = standards.find(
        (s) =>
          s.productId === a.productId &&
          s.location === a.location
      );

      const standardTotal = std
        ? (std.material + std.labour + std.machine + std.overheads) *
        (a.producedQty / (std.unitQty || 1))
        : 0;
      const actualTotal = sum([a.material, a.labour, a.machine, a.overheads]);
      const variance = actualTotal - standardTotal;
      const variancePct = standardTotal !== 0 ? (variance / standardTotal) * 100 : 0;

      let durationHours: number | null = null;
      if (a.startTime && a.endTime) {
        const dur =
          (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) /
          (1000 * 60 * 60);
        durationHours = Math.round(dur * 100) / 100;
      }
      return { ...a, standardTotal, actualTotal, variance, variancePct, durationHours };
    });
  }, [filteredActuals, standards]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalProduced = sum(filteredActuals.map((a) => a.producedQty));
    const totalMaterial = sum(filteredActuals.map((a) => a.material));
    const totalLabour = sum(filteredActuals.map((a) => a.labour));
    const totalMachine = sum(filteredActuals.map((a) => a.machine));
    const totalOverheads = sum(filteredActuals.map((a) => a.overheads));
    const totalActualCost = totalMaterial + totalLabour + totalMachine + totalOverheads;

    const avgVariancePct = actualsWithVariance.length
      ? Math.round(
        (sum(actualsWithVariance.map((a) => a.variancePct || 0)) /
          actualsWithVariance.length) *
        100
      ) / 100
      : 0;

    return {
      totalProduced,
      totalActualCost,
      avgVariancePct,
    };
  }, [filteredActuals, actualsWithVariance]);

  /* ---------------------- CRUD Handlers ----------------------- */
  // Standards
  const saveStandard = () => {
    if (!orgID) {
      toast.error("Organisation not found");
      return;
    }

    if (!stdForm.productId) {
      toast.error("Product is required");
      return;
    }

    if (!stdForm.location) {
      toast.error("Location is required");
      return;
    }

    if (stdForm._id) {
      // ✅ UPDATE
      dispatch(updateStandard({
        id: stdForm._id as string, // ✅ STRING ONLY
        data: stdForm,
        organisationId: orgID,
      }));

      toast.success("Standard updated successfully");
    } else {
      // ✅ CREATE
      dispatch(
        createStandard({
          data: stdForm,
          organisationId: orgID,
        })
      );
      toast.success("Standard created successfully");
    }

    setStdDialogOpen(false);
    setStdForm({});
  };

  const editStandard = (id: string) => {
    const standard = standards.find((s) => s._id === id);
    if (!standard) return;

    setStdForm(standard);
    setStdDialogOpen(true);
  };


  const deleteStandardHandler = (id: string) => {
    if (!orgID) {
      toast.error("Organisation not found");
      return;
    }

    if (!confirm("Delete standard?")) return;

    dispatch(
      deleteStandard({
        id: id,
        organisationId: orgID,
      })
    );

    toast.success("Standard deleted successfully");
  };

  useEffect(() => {
    if (!orgID) return;

    dispatch(fetchStandards({
      page: standardsPage,
      limit: PAGE_SIZE,
      search: standardsSearch,
      location: locationFilter !== "all" ? locationFilter : undefined,
    }));
  }, [dispatch, orgID, standardsPage, standardsSearch, locationFilter]);


  useEffect(() => {
    if (!orgID) return;

    dispatch(fetchActuals({
      page: actualsPage,
      limit: PAGE_SIZE,
      search: actualsSearch,
      location: locationFilter !== "all" ? locationFilter : undefined,
    }));
  }, [dispatch, orgID, actualsPage, actualsSearch, locationFilter]);


  useEffect(() => {
    if (!orgID) return;

    dispatch(fetchMetrics({
      page: metricsPage,
      limit: PAGE_SIZE,
      search: metricsSearch,
      location: locationFilter !== "all" ? locationFilter : undefined,
    }));
  }, [dispatch, orgID, metricsPage, metricsSearch, locationFilter]);
  useEffect(() => {
    setStandardsPage(1);
  }, [standardsSearch, locationFilter]);

  useEffect(() => {
    setActualsPage(1);
  }, [actualsSearch, locationFilter]);

  useEffect(() => {
    setMetricsPage(1);
  }, [metricsSearch, locationFilter]);


  useEffect(() => {
    if (!orgID) return;

    // 1️⃣ Production data
    dispatch(fetchWorkOrders({ page: 1, limit: 100 }));

    // 2️⃣ Costing module data
    // dispatch(fetchStandards({
    //   organisationId: orgID,
    //   page: 1,
    //   limit: 100,
    // }));

    // dispatch(fetchActuals());
    // dispatch(fetchMetrics());

    // 3️⃣ Master data
    dispatch(fetchMasterData("location"));

  }, [dispatch, orgID]);


  // Actuals
  const saveActual = () => {
    if (!orgID) {
      toast.error("Organisation not found");
      return;
    }

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

    if (actForm._id) {
      // UPDATE
      dispatch(
        updateActual({
          id: actForm._id as string,
          data: actForm,
        })
      );
      toast.success("Actual cost updated successfully");
    } else {
      // CREATE
      dispatch(createActual(actForm));

      toast.success("Actual cost created successfully");
    }

    setActDialogOpen(false);
    setActForm({ producedQty: 0 });
  };


  const editActual = (id: string) => {
    const actual = actuals.find((a) => a._id === id);
    if (!actual) return;

    setActForm(actual);
    setActDialogOpen(true);
  };


  const deleteActualHandler = (id: string) => {
    if (!orgID) {
      toast.error("Organisation not found");
      return;
    }

    if (!confirm("Delete actual record?")) return;

    dispatch(deleteActual(id));


    toast.success("Actual cost deleted successfully");
  };


  // Metrics
  const saveMetric = () => {
    if (!metricForm.date) {
      toast.error("Date required");
      return;
    }

    if (!metricForm.location) {
      toast.error("Location required");
      return;
    }

    if (metricForm._id) {
      // UPDATE
      dispatch(
        updateMetric({
          id: metricForm._id as string,
          data: metricForm,
        })
      );
      toast.success("Metric updated successfully");
    } else {
      // CREATE
      dispatch(createMetric(metricForm));
      toast.success("Metric created successfully");
    }

    setMetricDialogOpen(false);
    setMetricForm({ date: new Date().toISOString().slice(0, 10) });
  };


  const editMetric = (id: string) => {
    const metric = metrics.find((m) => m._id === id);
    if (!metric) return;

    setMetricForm(metric);
    setMetricDialogOpen(true);
  };



  const deleteMetricHandler = (id: string) => {
    if (!confirm("Delete metric?")) return;

    dispatch(deleteMetric(id)); // ✅ ONLY STRING ID
    toast.success("Metric deleted successfully");
  };



  /* ----------------------- Export / Import ---------------------- */
  const exportModule = () => {
    const dump = {
      standards,
      actuals,
      metrics,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CostingBackup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const importModule = async () => {
    const input = document.querySelector<HTMLInputElement>("#costing-import");
    const file = input?.files?.[0];
    if (!file) {
      toast.error("Choose a JSON file to import");
      return;
    }
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);

      if (parsed.standards && Array.isArray(parsed.standards)) {
        setStandards((prev) => [...prev, ...parsed.standards]);
      }
      if (parsed.actuals && Array.isArray(parsed.actuals)) {
        setActuals((prev) => [...prev, ...parsed.actuals]);
      }
      if (parsed.metrics && Array.isArray(parsed.metrics)) {
        setMetrics((prev) => [...prev, ...parsed.metrics]);
      }

      toast.success("Import completed successfully");
    } catch (err) {
      console.error(err);
      toast.error("Import failed");
    }
  };

  /* ------------------------- Charts Data ----------------------- */
  const costVarianceBar = useMemo(() => {
    const grouped: Record<string, { variance: number; productName?: string }> = {};
    actualsWithVariance.forEach((a) => {
      const key = a.productId || "unknown";
      grouped[key] = grouped[key] || { variance: 0, productName: a.productId };
      grouped[key].variance += a.actualTotal || 0;
    });
    return Object.entries(grouped).map(([productId, v]) => ({
      productId,
      variance: Math.round(v.variance * 100) / 100,
      name: v.productName,
    }));
  }, [actualsWithVariance]);

  const timeVarianceLine = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    actualsWithVariance.forEach((a) => {
      if (!a.durationHours) return;
      const day = (a.startTime || a.recordedAt || nowISO()).slice(0, 10);
      map[day] = map[day] || { total: 0, count: 0 };
      map[day].total += a.durationHours || 0;
      map[day].count += 1;
    });
    return Object.entries(map).map(([date, v]) => ({
      date,
      avgHours: Math.round((v.total / v.count) * 100) / 100,
    }));
  }, [actualsWithVariance]);

  const budgetUtilDonut = useMemo(() => {
    const planned = sum(actualsWithVariance.map((a) => a.standardTotal || 0));
    const actual = sum(actualsWithVariance.map((a) => a.actualTotal || 0));
    const remaining = Math.max(0, planned - actual);
    return [
      { name: "Actual", value: actual },
      { name: "Remaining (Planned - Actual)", value: remaining },
    ];
  }, [actualsWithVariance]);

  /* --------------- UI helpers --------------- */
  const openNewStandard = () => {
    setStdForm({ location: locationFilter !== "all" ? locationFilter : "" });
    setStdDialogOpen(true);
  };
  const openNewActual = () => {
    setActForm({
      producedQty: 0,
      location: locationFilter !== "all" ? locationFilter : "",
    });
    setActDialogOpen(true);
  };
  const openNewMetric = () => {
    setMetricForm({
      date: new Date().toISOString().slice(0, 10),
      location: locationFilter !== "all" ? locationFilter : "",
    });
    setMetricDialogOpen(true);
  };
  useEffect(() => {
    if (orgID) {
      (dispatch as any)(fetchProducts({ page: 1, limit: 100 }));

    }

  }, [dispatch, orgID]);

  const getProductNameById = (productId?: string) => {
    if (!productId) return "—";
    return products.find((p) => p._id === productId)?.name || productId;
  };

  const getWorkOrderNameById = (workOrderId?: string) => {
    if (!workOrderId) return "—";
    const wo = orders.find((o) => o._id === workOrderId);
    return wo?.orderNo || wo?._id || workOrderId;
  };

  /* ----------------------- Render --------------------------- */
  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Costing & Performance Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Standard vs Actual costing, variance analysis, and production KPIs.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Location Filter */}
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48 bg-card">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc._id} value={loc._id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="secondary" onClick={exportModule}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <label>
            <input
              id="costing-import"
              type="file"
              accept="application/json"
              className="hidden"
              onChange={importModule}
            />
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(value) =>
          setTab(value as "overview" | "standards" | "actuals" | "metrics")
        }
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="actuals">Actuals</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Produced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpis.totalProduced}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Actual Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₹{kpis.totalActualCost.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Variance %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpis.avgVariancePct}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Cost Variance (by product)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costVarianceBar}>
                    <XAxis dataKey="productId" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="variance" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Time Variance (avg hrs)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeVarianceLine}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      dataKey="avgHours"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ fill: "#2563EB" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Budget Utilisation
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetUtilDonut}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {budgetUtilDonut.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#10B981" : "#F59E0B"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Standards Tab */}
        <TabsContent value="standards" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold">
              Standard Costs ({filteredStandards.length})
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={standardsSearch}
                  onChange={(e) => setStandardsSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button onClick={openNewStandard}>
                <Plus className="w-4 h-4 mr-2" />
                New Standard
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
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
                  {filteredStandards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No standards found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStandards.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell className="font-medium">
                          PRO-{s.productId.trim().slice(0, 10)}
                          {s.productName && (
                            <span className="text-muted-foreground"> — {s.productName}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="w-3 h-3" />
                            {getLocationName(s.location)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ₹{(s.material + s.labour + s.machine + s.overheads).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            M:{s.material} L:{s.labour} Mc:{s.machine} O:{s.overheads}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => editStandard(s._id)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => deleteStandardHandler(s._id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Pagination
            page={standardsPagination.currentPage}
            totalPages={standardsPagination.totalPages}
            onChange={setStandardsPage}
          />
        </TabsContent>

        {/* Actuals Tab */}
        <TabsContent value="actuals" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold">
              Actual Costs (Production Runs) ({actualsWithVariance.length})
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, work orders..."
                  value={actualsSearch}
                  onChange={(e) => setActualsSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button onClick={openNewActual}>
                <Plus className="w-4 h-4 mr-2" />
                New Actual
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No actual costs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    actualsWithVariance.map((a) => (
                      <TableRow key={a._id}>
                        <TableCell className="font-medium">
                          {getWorkOrderNameById(a.workOrderId)}
                        </TableCell>

                        <TableCell>
                          {getProductNameById(a.productId)}
                        </TableCell>

                        {/* <TableCell className="font-medium">
                          {a.workOrderId || a.batchNo || a._id}
                        </TableCell>
                        <TableCell>{a.productId}</TableCell> */}
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="w-3 h-3" />
                            {getLocationName(a.location)}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.producedQty}</TableCell>
                        <TableCell>
                          {a.standardTotal > 0 ? (
                            <>
                              <div className="font-medium">
                                ₹{a.actualTotal.toFixed(2)} vs ₹{a.standardTotal.toFixed(2)}
                              </div>
                              <div
                                className={`text-sm ${a.variancePct > 0 ? "text-red-500" : "text-green-600"
                                  }`}
                              >
                                {a.variancePct.toFixed(2)}%
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">
                              No standard defined
                            </span>
                          )}
                        </TableCell>

                        <TableCell>{a.durationHours ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => editActual(a._id)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => deleteActualHandler(a._id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Pagination
            page={actualsPagination.currentPage}
            totalPages={actualsPagination.totalPages}
            onChange={setActualsPage}
          />

        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold">
              Performance Metrics ({filteredMetrics.length})
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, notes..."
                  value={metricsSearch}
                  onChange={(e) => setMetricsSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button onClick={openNewMetric}>
                <Plus className="w-4 h-4 mr-2" />
                New Metric
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
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
                  {filteredMetrics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No metrics found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMetrics.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell className="font-medium">{m.date}</TableCell>
                        <TableCell>
                          {getProductNameById(m.productId)}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="w-3 h-3" />
                            {getLocationName(m.location)}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.yieldPct ?? "—"}</TableCell>
                        <TableCell>{m.scrapPct ?? "—"}</TableCell>
                        <TableCell>{m.machineUtilPct ?? "—"}</TableCell>
                        <TableCell>{m.labourEffPct ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => editMetric(m._id)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => deleteMetricHandler(m._id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Pagination
            page={metricsPagination.currentPage}
            totalPages={metricsPagination.totalPages}
            onChange={setMetricsPage}
          />

        </TabsContent>
      </Tabs>

      {/* Standard Dialog */}
      <Dialog open={stdDialogOpen} onOpenChange={setStdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stdForm._id ? "Edit Standard" : "New Standard"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Select
                value={stdForm.productName || ""}
                onValueChange={(value) => {
                  const selectedProduct = products.find(
                    (p) => p.name === value
                  );

                  setStdForm((prev) => ({
                    ...prev,
                    productName: value,
                    productId: selectedProduct?._id, // correct product ID
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product._id} value={product.name}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
            <div className="grid gap-2">
              <Label>Location *</Label>
              <Select
                value={stdForm.location || ""}
                onValueChange={(val) => setStdForm({ ...stdForm, location: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Unit Qty</Label>
                <Input
                  type="number"
                  value={stdForm.unitQty ?? 1}
                  onChange={(e) => setStdForm({ ...stdForm, unitQty: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Material</Label>
                <Input
                  type="number"
                  value={stdForm.material ?? 0}
                  onChange={(e) => setStdForm({ ...stdForm, material: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Labour</Label>
                <Input
                  type="number"
                  value={stdForm.labour ?? 0}
                  onChange={(e) => setStdForm({ ...stdForm, labour: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Machine</Label>
                <Input
                  type="number"
                  value={stdForm.machine ?? 0}
                  onChange={(e) => setStdForm({ ...stdForm, machine: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Overheads</Label>
                <Input
                  type="number"
                  value={stdForm.overheads ?? 0}
                  onChange={(e) => setStdForm({ ...stdForm, overheads: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveStandard} className="w-full">
              Save Standard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actual Dialog */}
      <Dialog open={actDialogOpen} onOpenChange={setActDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{actForm._id ? "Edit Actual" : "New Actual"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Work Order *</Label>

              <Select
                value={actForm.workOrderId || ""}
                onValueChange={(value) => {
                  const selectedWO = orders.find((o) => o._id === value);

                  setActForm((prev) => ({
                    ...prev,
                    workOrderId: value,
                    productId: selectedWO?.productId,   // 🔥 auto-fill product
                    location: selectedWO?.locationId,   // 🔥 auto-fill location
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Work Order" />
                </SelectTrigger>

                <SelectContent>
                  {orders.map((wo) => (
                    <SelectItem key={wo._id} value={wo._id}>
                      {wo.orderNo || wo._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Product *</Label>

              <Select
                value={actForm.productId || ""}
                onValueChange={(value) => {
                  setActForm((prev) => ({
                    ...prev,
                    productId: value,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>

                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Location *</Label>
              <Select
                value={actForm.location || ""}
                onValueChange={(val) => setActForm({ ...actForm, location: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Produced Qty *</Label>
                <Input
                  type="number"
                  value={actForm.producedQty || 0}
                  onChange={(e) => setActForm({ ...actForm, producedQty: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Material Cost</Label>
                <Input
                  type="number"
                  value={actForm.material || 0}
                  onChange={(e) => setActForm({ ...actForm, material: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Labour Cost</Label>
                <Input
                  type="number"
                  value={actForm.labour || 0}
                  onChange={(e) => setActForm({ ...actForm, labour: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Machine Cost</Label>
                <Input
                  type="number"
                  value={actForm.machine || 0}
                  onChange={(e) => setActForm({ ...actForm, machine: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Overheads</Label>
                <Input
                  type="number"
                  value={actForm.overheads || 0}
                  onChange={(e) => setActForm({ ...actForm, overheads: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Input
                  type="datetime-local"
                  value={actForm.startTime?.slice(0, 16) || ""}
                  onChange={(e) => setActForm({ ...actForm, startTime: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={actForm.endTime?.slice(0, 16) || ""}
                  onChange={(e) => setActForm({ ...actForm, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Remarks</Label>
              <Input
                value={actForm.remarks || ""}
                onChange={(e) => setActForm({ ...actForm, remarks: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveActual} className="w-full">
              Save Actual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Dialog */}
      <Dialog open={metricDialogOpen} onOpenChange={setMetricDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{metricForm._id ? "Edit Metric" : "New Metric"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={metricForm.date || ""}
                onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Product *</Label>

              <Select
                value={metricForm.productId || ""}
                onValueChange={(value) => {
                  setMetricForm((prev) => ({
                    ...prev,
                    productId: value,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>

                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Location *</Label>
              <Select
                value={metricForm.location || ""}
                onValueChange={(val) => setMetricForm({ ...metricForm, location: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Yield %</Label>
                <Input
                  type="number"
                  value={metricForm.yieldPct ?? ""}
                  onChange={(e) =>
                    setMetricForm({ ...metricForm, yieldPct: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Scrap %</Label>
                <Input
                  type="number"
                  value={metricForm.scrapPct ?? ""}
                  onChange={(e) =>
                    setMetricForm({ ...metricForm, scrapPct: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Machine Util %</Label>
                <Input
                  type="number"
                  value={metricForm.machineUtilPct ?? ""}
                  onChange={(e) =>
                    setMetricForm({ ...metricForm, machineUtilPct: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Labour Eff %</Label>
                <Input
                  type="number"
                  value={metricForm.labourEffPct ?? ""}
                  onChange={(e) =>
                    setMetricForm({ ...metricForm, labourEffPct: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input
                value={metricForm.notes || ""}
                onChange={(e) => setMetricForm({ ...metricForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveMetric} className="w-full">
              Save Metric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
