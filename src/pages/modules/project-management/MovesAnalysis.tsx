import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Plus, 
  Filter, 
  Download,
  Check,
  ChevronsUpDown,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { fetchMovements, fetchMovementSummary, createMovement, deleteMovement } from "@/redux/slices/materialMovementSlice";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import { fetchMRS } from "@/redux/slices/mrsSlice";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { usePermission } from "@/hooks/userPermission";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function MovesAnalysis() {
  const dispatch = useDispatch<AppDispatch>();
  const organisationId = localStorage.getItem("organisationId") || "";

  const canView = usePermission("movesAnalysis", "view");
  const canCreate = usePermission("movesAnalysis", "create");
  const canDelete = usePermission("movesAnalysis", "delete");

  // Redux State
  const { movements, loading, summary } = useSelector((state: RootState) => state.materialMovement);
  const { projects } = useSelector((state: RootState) => state.projects);
  const { materials: rawMaterials } = useSelector((state: RootState) => state.rawMaterials);
  const { wbs } = useSelector((state: RootState) => state.wbs);
  const { list: mrsList } = useSelector((state: RootState) => state.mrs);

  // Local State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMovementType, setSelectedMovementType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    materialId: "",
    movementType: "inbound" as "inbound" | "outbound" | "return" | "transfer",
    quantity: 0,
    source: "",
    destination: "",
    wbsTaskId: "",
    referenceNumber: "",
    remarks: "",
    movementDate: new Date().toISOString().split("T")[0],
  });

  // Fetch initial data
  useEffect(() => {
    if (organisationId) {
      dispatch(fetchProjects({ page: 1, limit: 100 }));
      dispatch(fetchMaterials());
      dispatch(fetchMRS());
    } else {
      console.error("No organisationId found in localStorage");
      toast.error("Organisation ID not found. Please login again.");
    }
  }, [organisationId, dispatch]);

  // Fetch movements when filters change
  useEffect(() => {
    if (!organisationId) {
      console.error("No organisationId found");
      return;
    }

    const params: any = { organisationId };
    if (selectedProjectId) params.projectId = selectedProjectId;
    if (selectedMovementType !== "all") params.movementType = selectedMovementType;
    if (dateRange.start) params.startDate = dateRange.start;
    if (dateRange.end) params.endDate = dateRange.end;

    console.log("Fetching movements with params:", params);
    dispatch(fetchMovements(params));
    dispatch(fetchMovementSummary(params));
  }, [organisationId, selectedProjectId, selectedMovementType, dateRange, dispatch]);

  // Fetch WBS when project selected
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWbsByProject(selectedProjectId));
    }
  }, [selectedProjectId, dispatch]);

  // Filter movements by search term
  const filteredMovements = useMemo(() => {
    if (!searchTerm.trim()) return movements;
    const query = searchTerm.toLowerCase();
    return movements.filter(
      (m) =>
        m.materialName.toLowerCase().includes(query) ||
        m.source?.toLowerCase().includes(query) ||
        m.destination?.toLowerCase().includes(query) ||
        m.wbsTaskName?.toLowerCase().includes(query) ||
        m.referenceNumber?.toLowerCase().includes(query)
    );
  }, [movements, searchTerm]);

  // Get selected project
  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  // Get WBS tasks for selected project
  const projectWbsTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return wbs.filter((item) => item.projectId === selectedProjectId);
  }, [wbs, selectedProjectId]);

  // Handle form submission
  const handleSave = async () => {
    if (!form.materialId || !form.quantity || form.quantity <= 0) {
      toast.error("Please select material and enter valid quantity");
      return;
    }

    const material = rawMaterials.find((m) => m._id === form.materialId);
    if (!material) {
      toast.error("Material not found");
      return;
    }

    const wbsTask = form.wbsTaskId ? projectWbsTasks.find((w) => w.id === form.wbsTaskId) : null;

    const data = {
      organisationId,
      projectId: selectedProjectId || undefined,
      materialId: form.materialId,
      materialName: material.name,
      movementType: form.movementType,
      quantity: form.quantity,
      unit: material.unitOfMeasure,
      source: form.source,
      destination: form.destination,
      wbsTaskId: form.wbsTaskId || undefined,
      wbsTaskName: wbsTask?.name || "",
      referenceNumber: form.referenceNumber,
      remarks: form.remarks,
      movementDate: form.movementDate,
      unitCost: material.unitCost || 0,
      totalCost: (material.unitCost || 0) * form.quantity,
    };

    try {
      await dispatch(createMovement(data)).unwrap();
      toast.success("Material movement recorded successfully");
      setIsDialogOpen(false);
      resetForm();
      
      // Refetch movements
      const params: any = { organisationId };
      if (selectedProjectId) params.projectId = selectedProjectId;
      dispatch(fetchMovements(params));
      dispatch(fetchMovementSummary(params));
    } catch (error: any) {
      toast.error(error.message || "Failed to record movement");
    }
  };

  const resetForm = () => {
    setForm({
      materialId: "",
      movementType: "inbound",
      quantity: 0,
      source: "",
      destination: "",
      wbsTaskId: "",
      referenceNumber: "",
      remarks: "",
      movementDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this movement?")) return;
    
    try {
      await dispatch(deleteMovement(id)).unwrap();
      toast.success("Movement deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete movement");
    }
  };

  // Get movement type badge color
  const getMovementTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      inbound: "bg-green-100 text-green-800 border-green-200",
      outbound: "bg-red-100 text-red-800 border-red-200",
      return: "bg-blue-100 text-blue-800 border-blue-200",
      transfer: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Get movement type icon
  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case "inbound":
        return <ArrowDownCircle className="h-4 w-4" />;
      case "outbound":
        return <ArrowUpCircle className="h-4 w-4" />;
      case "return":
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Calculate summary metrics
  const metrics = useMemo(() => {
    // Calculate from movements array directly for accurate counts
    const inboundMovements = movements.filter((m) => m.movementType === "inbound");
    const outboundMovements = movements.filter((m) => m.movementType === "outbound");
    const returnMovements = movements.filter((m) => m.movementType === "return");

    const inboundQty = inboundMovements.reduce((sum, m) => sum + (m.quantity || 0), 0);
    const outboundQty = outboundMovements.reduce((sum, m) => sum + (m.quantity || 0), 0);
    const returnQty = returnMovements.reduce((sum, m) => sum + (m.quantity || 0), 0);

    const totalValue = movements.reduce((sum, m) => sum + (m.totalCost || 0), 0);

    // Get unique materials count
    const uniqueMaterialIds = new Set(movements.map((m) => m.materialId));

    console.log("Metrics calculated:", {
      totalMovements: movements.length,
      inboundCount: inboundMovements.length,
      outboundCount: outboundMovements.length,
      returnCount: returnMovements.length,
      inboundQty,
      outboundQty,
      returnQty,
      totalValue,
      uniqueMaterials: uniqueMaterialIds.size,
    });

    return {
      totalMovements: movements.length,
      uniqueMaterials: uniqueMaterialIds.size,
      inboundCount: inboundMovements.length,
      outboundCount: outboundMovements.length,
      returnCount: returnMovements.length,
      inboundQty,
      outboundQty,
      returnQty,
      totalValue,
    };
  }, [movements]);

  // Calculate chart data - group by date
  const chartData = useMemo(() => {
    // Group movements by date
    const dateMap = new Map<string, { inbound: number; outbound: number; return: number }>();

    movements.forEach((m) => {
      const date = m.movementDate ? format(parseISO(m.movementDate), "dd MMM") : "Unknown";
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { inbound: 0, outbound: 0, return: 0 });
      }

      const data = dateMap.get(date)!;
      if (m.movementType === "inbound") {
        data.inbound += m.quantity || 0;
      } else if (m.movementType === "outbound") {
        data.outbound += m.quantity || 0;
      } else if (m.movementType === "return") {
        data.return += m.quantity || 0;
      }
    });

    // Convert to array and sort by date
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        Inbound: Math.round(data.inbound * 100) / 100,
        Outbound: Math.round(data.outbound * 100) / 100,
        Return: Math.round(data.return * 100) / 100,
      }))
      .slice(-7); // Show last 7 days
  }, [movements]);

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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Moves Analysis</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of stock movements, trends, and turnover rates
          </p>
          {selectedProject && (
            <p className="text-sm text-blue-600 mt-1">
              Viewing: {selectedProject.code} - {selectedProject.name}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Movement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record Material Movement</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2">
                    <Label>Material *</Label>
                    <Select value={form.materialId} onValueChange={(value) => setForm({ ...form, materialId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {rawMaterials.map((mat) => (
                          <SelectItem key={mat._id} value={mat._id!}>
                            {mat.name} ({mat.unitOfMeasure})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Movement Type *</Label>
                    <Select value={form.movementType} onValueChange={(value: any) => setForm({ ...form, movementType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">Inbound (Receive)</SelectItem>
                        <SelectItem value="outbound">Outbound (Issue)</SelectItem>
                        <SelectItem value="return">Return</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={form.quantity || ""}
                      onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label>Source</Label>
                    <Input
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      placeholder="e.g., Vendor, Warehouse"
                    />
                  </div>

                  <div>
                    <Label>Destination</Label>
                    <Input
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      placeholder="e.g., Site, Project"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>WBS Task (Optional)</Label>
                    <Select value={form.wbsTaskId} onValueChange={(value) => setForm({ ...form, wbsTaskId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select WBS task" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectWbsTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name} ({task.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Reference Number</Label>
                    <Input
                      value={form.referenceNumber}
                      onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                      placeholder="PO/GRN/Invoice No."
                    />
                  </div>

                  <div>
                    <Label>Movement Date</Label>
                    <Input
                      type="date"
                      value={form.movementDate}
                      onChange={(e) => setForm({ ...form, movementDate: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Remarks</Label>
                    <Input
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Movement</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMovements}</div>
            <p className="text-xs text-muted-foreground mt-1">All transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              Inbound
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.inboundCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.inboundQty.toFixed(2)} units received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              Outbound
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.outboundCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.outboundQty.toFixed(2)} units issued
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{metrics.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.uniqueMaterials} unique materials</p>
          </CardContent>
        </Card>
      </div>

      {/* Movement Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Inbound/Outbound Trends</CardTitle>
          <p className="text-sm text-muted-foreground">Material movement trends over time</p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="Inbound" fill="#22c55e" name="Inbound (Received)" />
                <Bar dataKey="Outbound" fill="#ef4444" name="Outbound (Issued)" />
                <Bar dataKey="Return" fill="#3b82f6" name="Return" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No movement data available for chart
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Project</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : "All Projects"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandList>
                      <CommandEmpty>No projects found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setSelectedProjectId(null); setPopoverOpen(false); }}>
                          <Check className={`mr-2 h-4 w-4 ${!selectedProjectId ? "opacity-100" : "opacity-0"}`} />
                          All Projects
                        </CommandItem>
                        {projects.map((project) => (
                          <CommandItem
                            key={project._id}
                            value={`${project.code} ${project.name}`}
                            onSelect={() => { setSelectedProjectId(project._id); setPopoverOpen(false); }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${selectedProjectId === project._id ? "opacity-100" : "opacity-0"}`} />
                            {project.code} - {project.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Movement Type</Label>
              <Select value={selectedMovementType} onValueChange={setSelectedMovementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Search</Label>
            <Input
              placeholder="Search by material, source, destination, WBS task, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>WBS</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Cost</TableHead>
                {canDelete && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Loading movements...
                  </TableCell>
                </TableRow>
              )}

              {!loading && filteredMovements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    No movements found
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                filteredMovements.map((movement) => (
                  <TableRow key={movement._id}>
                    <TableCell>
                      {movement.movementDate ? format(new Date(movement.movementDate), "dd MMM yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getMovementTypeBadge(movement.movementType)} variant="outline">
                        <span className="flex items-center gap-1">
                          {getMovementTypeIcon(movement.movementType)}
                          {movement.movementType}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{movement.materialName}</TableCell>
                    <TableCell>
                      {movement.quantity} {movement.unit}
                    </TableCell>
                    <TableCell>{movement.source || "-"}</TableCell>
                    <TableCell>{movement.destination || "-"}</TableCell>
                    <TableCell>{movement.wbsTaskName || "-"}</TableCell>
                    <TableCell>
                      {(() => {
                        // Check if projectId is populated object (from backend populate)
                        if (movement.projectId && typeof movement.projectId === 'object') {
                          return (movement.projectId as any).name || "-";
                        }
                        
                        // Check if projectId is string and find in projects list
                        if (movement.projectId && typeof movement.projectId === 'string') {
                          const project = projects.find((p) => p._id === movement.projectId);
                          if (project) {
                            return project.name;
                          }
                        }
                        
                        // Fallback to reference number or dash
                        return movement.referenceNumber || "-";
                      })()}
                    </TableCell>
                    <TableCell>₹{(movement.totalCost || 0).toLocaleString()}</TableCell>
                    {canDelete && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(movement._id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
