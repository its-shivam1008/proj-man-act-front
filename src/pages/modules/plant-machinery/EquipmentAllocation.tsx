"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  Search,
  BarChart3,
  LineChart,
  Fuel,
  Clock,
  Wrench,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Line,
  Legend,
  LineChart as ReLineChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePermission } from "@/hooks/userPermission";
import {
  fetchEquipmentAllocations,
  createEquipmentAllocation,
  updateEquipmentAllocation,
  deleteEquipmentAllocation,
  createSampleData,
  clearError,
  EquipmentAllocation,
} from "@/redux/slices/plantandmachinary/equipmentAllocationSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { fetchEquipments } from "@/redux/slices/equipmentSlice";

interface EquipmentAllocationForm {
  _id?: string;
  equipmentCode?: string;
  equipmentName?: string;
  projectOrDept?: string;
  operator?: string;
  workingHours?: number;
  idleHours?: number;
  fuelConsumption?: number;
  performanceRating?: number;
  date?: string;
  shift?: string;
  allocationType?: string;
  startDate?: string;
  endDate?: string;
  powerConsumption?: number;
  meterReading?: number;
  status?: 'Active' | 'Completed' | 'Cancelled';
  location?: string;
  remarks?: string;
}

export default function EquipmentAllocationDashboard() {
  const canView = usePermission("equipmentAllocation", "view");
  const canCreate = usePermission("equipmentAllocation", "create");
  const canEdit = usePermission("equipmentAllocation", "edit");
  const canDelete = usePermission("equipmentAllocation", "delete");
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    allocations,
    loading,
    error,
    pagination,
  } = useSelector((state: RootState) => state.equipmentAllocation);

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
  
  const { locations } = useSelector((state: RootState) => state.masterData);
  const { equipments } = useSelector((state: RootState) => state.equipment);
  const { userProfile } = useSelector((state: RootState) => state.auth);

  // Location-based access control
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentAllocation | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const [form, setForm] = useState<EquipmentAllocationForm>({
    date: new Date().toISOString().split("T")[0],
    workingHours: 0,
    idleHours: 0,
    fuelConsumption: 0,
    performanceRating: 3,
    status: "Active",
    shift: "Day",
    allocationType: "Project",
  });

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchMasterData("location"));
    dispatch(fetchEquipments({}));
    loadData();
  }, [dispatch]);

  // Load data when filters change
  useEffect(() => {
    loadData();
  }, [selectedLocation, selectedStatus, fromDate, toDate, query]);

  // Set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setSelectedLocation(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Load chart data - no longer needed since we calculate from table data
  // useEffect(() => {
  //   dispatch(fetchUtilizationData());
  //   dispatch(fetchFuelData());
  //   dispatch(fetchTrendData());
  // }, [dispatch]);

  const loadData = () => {
    const params: any = {};
    if (query) params.search = query;
    if (selectedLocation !== "All") params.location = selectedLocation;
    if (selectedStatus !== "all") params.status = selectedStatus;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    
    dispatch(fetchEquipmentAllocations(params));
  };

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Add / Edit
  const openAdd = () => {
    if (!canCreate) {
      toast.error("You don't have permission to create equipment allocations");
      return;
    }
    setEditing(null);
    setForm({
      date: new Date().toISOString().split("T")[0],
      workingHours: 0,
      idleHours: 0,
      fuelConsumption: 0,
      performanceRating: 3,
      status: "Active",
      shift: "Day",
      allocationType: "Project",
      location: isLocationRestricted ? userProfile?.location : "",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (alloc: EquipmentAllocation) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit equipment allocations");
      return;
    }
    setEditing(alloc);
    setForm({
      ...alloc,
      date: alloc.date.split("T")[0],
      location: typeof alloc.location === 'object' && alloc.location ? alloc.location._id : "",
    });
    setIsDialogOpen(true);
  };

  const saveForm = async () => {
    if (!form.equipmentCode || !form.operator || !form.projectOrDept) {
      toast.error("Equipment code, operator, and project/department are required.");
      return;
    }

    try {
      // Prepare data for submission
      const submitData: any = { ...form };
      
      if (editing) {
        await dispatch(updateEquipmentAllocation({ 
          id: editing._id, 
          data: submitData 
        })).unwrap();
        toast.success("Equipment allocation updated successfully");
      } else {
        await dispatch(createEquipmentAllocation(submitData)).unwrap();
        toast.success("Equipment allocation created successfully");
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save equipment allocation");
    }
  };

  const deleteAlloc = async (id: string) => {
    if (!canDelete) {
      toast.error("You don't have permission to delete equipment allocations");
      return;
    }
    
    if (confirm("Are you sure you want to delete this equipment allocation?")) {
      try {
        await dispatch(deleteEquipmentAllocation(id)).unwrap();
        toast.success("Equipment allocation deleted successfully");
        loadData();
      } catch (error: any) {
        toast.error(error.message || "Failed to delete equipment allocation");
      }
    }
  };

  const handleCreateSampleData = async () => {
    if (!canCreate) {
      toast.error("You don't have permission to create sample data");
      return;
    }

    if (locations.length === 0) {
      toast.error("Please create locations first");
      return;
    }

    try {
      await dispatch(createSampleData(locations[0]._id)).unwrap();
      toast.success("Sample data created successfully");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create sample data");
    }
  };

  // Analytics calculations from table data
  const totalEquipment = new Set(allocations.map(alloc => alloc.equipmentCode)).size;
  const totalWorkHours = allocations.reduce((sum, alloc) => sum + (alloc.workingHours || 0), 0);
  const totalIdleHours = allocations.reduce((sum, alloc) => sum + (alloc.idleHours || 0), 0);
  const totalFuel = allocations.reduce((sum, alloc) => sum + (alloc.fuelConsumption || 0), 0);
  const avgUtilization = totalWorkHours + totalIdleHours > 0 
    ? ((totalWorkHours / (totalWorkHours + totalIdleHours)) * 100).toFixed(1) 
    : "0";

  // Chart data calculations from table data
  const utilizationChartData = useMemo(() => {
    const equipmentMap: Record<string, { work: number; idle: number }> = {};
    
    allocations.forEach(alloc => {
      if (!equipmentMap[alloc.equipmentCode]) {
        equipmentMap[alloc.equipmentCode] = { work: 0, idle: 0 };
      }
      equipmentMap[alloc.equipmentCode].work += alloc.workingHours || 0;
      equipmentMap[alloc.equipmentCode].idle += alloc.idleHours || 0;
    });

    return Object.entries(equipmentMap).map(([equipment, data]) => ({
      equipment,
      utilization: data.work + data.idle > 0 
        ? Number(((data.work / (data.work + data.idle)) * 100).toFixed(1))
        : 0
    }));
  }, [allocations]);

  const fuelChartData = useMemo(() => {
    const fuelMap: Record<string, number> = {};
    
    allocations.forEach(alloc => {
      fuelMap[alloc.equipmentCode] = (fuelMap[alloc.equipmentCode] || 0) + (alloc.fuelConsumption || 0);
    });

    return Object.entries(fuelMap).map(([equipment, fuel]) => ({
      equipment,
      fuel
    }));
  }, [allocations]);

  const trendChartData = useMemo(() => {
    const dateMap: Record<string, { work: number; fuel: number }> = {};
    
    allocations.forEach(alloc => {
      const date = new Date(alloc.date).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { work: 0, fuel: 0 };
      }
      dateMap[date].work += alloc.workingHours || 0;
      dateMap[date].fuel += alloc.fuelConsumption || 0;
    });

    return Object.entries(dateMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allocations]);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> Equipment Allocation & Utilisation Dashboard
        </h1>
        <div className="flex gap-2">
          {canCreate && (
            <>
              <Button variant="outline" onClick={handleCreateSampleData}>
                Create Sample Data
              </Button>
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add Record
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 items-end p-4">
          <div className="space-y-1">
            <Label>Location</Label>
            <Select 
              value={selectedLocation} 
              onValueChange={setSelectedLocation}
              disabled={isLocationRestricted}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location._id} value={location._id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-1 flex-1">
            <Label>Search</Label>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment, operator, project..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Wrench className="h-8 w-8 text-blue-500 mb-2" />
            <h2 className="text-xl font-bold">{totalEquipment}</h2>
            <p className="text-sm text-muted-foreground">Total Equipment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Clock className="h-8 w-8 text-green-500 mb-2" />
            <h2 className="text-xl font-bold">{totalWorkHours + totalIdleHours}</h2>
            <p className="text-sm text-muted-foreground">Total Hours Logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <LineChart className="h-8 w-8 text-purple-500 mb-2" />
            <h2 className="text-xl font-bold">{avgUtilization}%</h2>
            <p className="text-sm text-muted-foreground">Avg. Utilization</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Fuel className="h-8 w-8 text-orange-500 mb-2" />
            <h2 className="text-xl font-bold">{totalFuel} L</h2>
            <p className="text-sm text-muted-foreground">Total Fuel Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Utilization % by Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={utilizationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="equipment" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="utilization" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Consumption (L) by Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fuelChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="equipment" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="fuel" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trend: Working Hours & Fuel Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ReLineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="work" stroke="#3b82f6" name="Work Hours" />
              <Line type="monotone" dataKey="fuel" stroke="#f59e0b" name="Fuel (L)" />
            </ReLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Allocation Records ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Work (hrs)</TableHead>
                  <TableHead>Idle (hrs)</TableHead>
                  <TableHead>Fuel (L)</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : allocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No equipment allocations found
                    </TableCell>
                  </TableRow>
                ) : (
                  allocations.map((alloc) => (
                    <TableRow key={alloc._id}>
                      <TableCell>{new Date(alloc.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{alloc.equipmentCode}</TableCell>
                      <TableCell>{alloc.projectOrDept}</TableCell>
                      <TableCell>{alloc.operator}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {alloc.location?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{alloc.workingHours}</TableCell>
                      <TableCell>{alloc.idleHours}</TableCell>
                      <TableCell>{alloc.fuelConsumption}</TableCell>
                      <TableCell>{alloc.performanceRating}/5</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            alloc.status === 'Active' ? 'default' : 
                            alloc.status === 'Completed' ? 'secondary' : 'destructive'
                          }
                        >
                          {alloc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => openEdit(alloc)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="sm" onClick={() => deleteAlloc(alloc._id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Allocation" : "Add Allocation"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date || ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Equipment Code *</Label>
              <Select
                value={form.equipmentCode || ""}
                onValueChange={(value) => {
                  const equipment = equipments.find(eq => eq.code === value);
                  setForm({ 
                    ...form, 
                    equipmentCode: value,
                    equipmentName: equipment?.name || ""
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map((equipment) => (
                    <SelectItem key={equipment._id} value={equipment.code}>
                      {equipment.code} - {equipment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project / Department *</Label>
              <Input
                value={form.projectOrDept || ""}
                onChange={(e) => setForm({ ...form, projectOrDept: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Operator *</Label>
              <Input
                value={form.operator || ""}
                onChange={(e) => setForm({ ...form, operator: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={form.location || ""}
                onValueChange={(value) => setForm({ ...form, location: value })}
                disabled={isLocationRestricted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location._id} value={location._id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shift</Label>
              <Select
                value={form.shift || "Day"}
                onValueChange={(value) => setForm({ ...form, shift: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                  <SelectItem value="Rotating">Rotating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Working Hours</Label>
              <Input
                type="number"
                value={form.workingHours || ""}
                onChange={(e) => setForm({ ...form, workingHours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Idle Hours</Label>
              <Input
                type="number"
                value={form.idleHours || ""}
                onChange={(e) => setForm({ ...form, idleHours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fuel Consumption (L)</Label>
              <Input
                type="number"
                value={form.fuelConsumption || ""}
                onChange={(e) => setForm({ ...form, fuelConsumption: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Performance Rating (1-5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.performanceRating || ""}
                onChange={(e) => setForm({ ...form, performanceRating: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status || "Active"}
                onValueChange={(value) => setForm({ ...form, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Remarks</Label>
              <Input
                value={form.remarks || ""}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional remarks"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveForm} disabled={loading}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}