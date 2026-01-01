"use client";

import { useEffect, useMemo, useState } from "react";
import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Save,
  Search,
  MapPin,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import {
  fetchCalibrationSafetyRecords,
  fetchCalibrationSafetyStats,
  createCalibrationSafetyRecord,
  updateCalibrationSafetyRecord,
  renewCertificate,
  deleteCalibrationSafetyRecord,
  setPage,
  setLimit,
  clearError,
  CalibrationSafetyRecord,
} from "@/redux/slices/plantandmachinary/calibrationSafetySlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { fetchEquipments } from "@/redux/slices/equipmentSlice";
import api from "@/utils/axiosApi";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function CalibrationSafetyDashboard() {
  const canView = usePermission("calibrationSafety", "view");
  const canCreate = usePermission("calibrationSafety", "create");
  const canEdit = usePermission("calibrationSafety", "edit");
  const canDelete = usePermission("calibrationSafety", "delete");
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    records,
    stats,
    loading,
    error,
    total,
    page,
    limit,
  } = useSelector((state: RootState) => state.calibrationSafety);
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalibrationSafetyRecord | null>(null);
  const [renewingRecord, setRenewingRecord] = useState<CalibrationSafetyRecord | null>(null);
  const [form, setForm] = useState<Partial<CalibrationSafetyRecord>>({
    certificationType: "calibration",
    result: "pass",
    status: "valid",
    cost: 0,
    operatorTraining: [],
    documents: [],
  });
  const [renewForm, setRenewForm] = useState({
    expiryDate: "",
    nextDueDate: "",
    certificateNumber: "",
    cost: 0,
    remarks: "",
  });

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchMasterData("location"));
    dispatch(fetchEquipments({ page: 1, limit: 100 }));
    dispatch(fetchCalibrationSafetyStats());
    loadRecords();
  }, [dispatch]);

  // Load records when filters change
  useEffect(() => {
    loadRecords();
  }, [page, limit, query, statusFilter, locationFilter, typeFilter, resultFilter]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  const loadRecords = () => {
    dispatch(fetchCalibrationSafetyRecords({
      page,
      limit,
      search: query,
      status: statusFilter !== "all" ? statusFilter : undefined,
      location: locationFilter !== "all" ? locationFilter : undefined,
      certificationType: typeFilter !== "all" ? typeFilter : undefined,
      result: resultFilter !== "all" ? resultFilter : undefined,
    }));
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ 
      certificationType: "calibration",
      result: "pass",
      status: "valid",
      cost: 0,
      operatorTraining: [],
      documents: [],
      location: isLocationRestricted ? userProfile?.location : "",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (record: CalibrationSafetyRecord) => {
    setEditing(record);
    setForm({
      ...record,
      location: typeof record.location === 'object' && record.location ? record.location._id : record.location || "",
      issuedDate: record.issuedDate?.split('T')[0],
      expiryDate: record.expiryDate?.split('T')[0],
      nextDueDate: record.nextDueDate?.split('T')[0],
    } as any);
    setIsDialogOpen(true);
  };

  const openRenew = (record: CalibrationSafetyRecord) => {
    setRenewingRecord(record);
    setRenewForm({
      expiryDate: "",
      nextDueDate: "",
      certificateNumber: record.certificateNumber,
      cost: 0,
      remarks: "",
    });
    setIsRenewDialogOpen(true);
  };

  const saveForm = async () => {
    if (!form.equipmentName || !form.certificateNumber || !form.issuedBy || !form.inspectionAgency) {
      toast.error("Equipment, certificate number, issued by, and inspection agency are required.");
      return;
    }

    try {
      if (editing) {
        await dispatch(updateCalibrationSafetyRecord({ 
          id: editing._id!, 
          data: form 
        })).unwrap();
        toast.success("Record updated successfully");
      } else {
        await dispatch(createCalibrationSafetyRecord(form)).unwrap();
        toast.success("Record created successfully");
      }
      
      setIsDialogOpen(false);
      dispatch(fetchCalibrationSafetyStats());
    } catch (error: any) {
      toast.error(error || "Operation failed");
    }
  };

  const handleRenew = async () => {
    if (!renewForm.expiryDate || !renewForm.nextDueDate || !renewForm.certificateNumber) {
      toast.error("Expiry date, next due date, and certificate number are required.");
      return;
    }

    try {
      await dispatch(renewCertificate({
        id: renewingRecord!._id!,
        ...renewForm
      })).unwrap();
      toast.success("Certificate renewed successfully");
      setIsRenewDialogOpen(false);
      dispatch(fetchCalibrationSafetyStats());
    } catch (error: any) {
      toast.error(error || "Renewal failed");
    }
  };

  const deleteRecord = async (id: string) => {
    if (confirm("Delete this calibration & safety record?")) {
      try {
        await dispatch(deleteCalibrationSafetyRecord(id)).unwrap();
        toast.success("Record deleted successfully");
        dispatch(fetchCalibrationSafetyStats());
      } catch (error: any) {
        toast.error(error || "Delete failed");
      }
    }
  };

  // Calculate KPI values from table data instead of stats
  const kpiData = useMemo(() => {
    const validCount = records.filter(r => r.status === 'valid').length;
    const expiringSoonCount = records.filter(r => r.status === 'expiring-soon').length;
    const expiredCount = records.filter(r => r.status === 'expired').length;
    const pendingCount = records.filter(r => r.status === 'pending').length;
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

    return {
      valid: validCount,
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
      pending: pendingCount,
      totalCost: totalCost
    };
  }, [records]);

  // Chart data - use calculated values from table data
  const statusChartData = useMemo(() => [
    { name: 'Valid', value: kpiData.valid, color: '#00C49F' },
    { name: 'Expiring Soon', value: kpiData.expiringSoon, color: '#FFBB28' },
    { name: 'Expired', value: kpiData.expired, color: '#FF8042' },
    { name: 'Pending', value: kpiData.pending, color: '#0088FE' },
  ], [kpiData]);

  const resultChartData = useMemo(() => {
    const passCount = records.filter(r => r.result === 'pass').length;
    const failCount = records.filter(r => r.result === 'fail').length;
    const conditionalCount = records.filter(r => r.result === 'conditional').length;

    return [
      { name: 'Pass', value: passCount },
      { name: 'Fail', value: failCount },
      { name: 'Conditional', value: conditionalCount },
    ];
  }, [records]);

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" /> Calibration & Safety Dashboard
        </h1>
        <div className="flex gap-2">
          {canCreate && <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Record
          </Button>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <h2 className="text-xl font-bold">{loading ? "..." : kpiData.valid}</h2>
            <p className="text-sm text-green-600">Valid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <h2 className="text-xl font-bold">{loading ? "..." : kpiData.expiringSoon}</h2>
            <p className="text-sm text-yellow-600">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <h2 className="text-xl font-bold">{loading ? "..." : kpiData.expired}</h2>
            <p className="text-sm text-red-600">Expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <h2 className="text-xl font-bold">{loading ? "..." : `₹${kpiData.totalCost.toFixed(0)}`}</h2>
            <p className="text-sm text-gray-500">Total Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Certificate Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspection Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resultChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Calibration & Safety Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search equipment, certificate..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="calibration">Calibration</SelectItem>
                <SelectItem value="safety-inspection">Safety Inspection</SelectItem>
                <SelectItem value="load-test">Load Test</SelectItem>
                <SelectItem value="pressure-test">Pressure Test</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={locationFilter} 
              onValueChange={setLocationFilter}
              disabled={isLocationRestricted}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location._id} value={location._id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Certificate Type</TableHead>
                  <TableHead>Certificate No.</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">{record.equipmentName}</TableCell>
                      <TableCell className="capitalize">{record.certificationType.replace('-', ' ')}</TableCell>
                      <TableCell>{record.certificateNumber}</TableCell>
                      <TableCell>{new Date(record.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {record.location?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">₹{record.cost?.toFixed(0) || 0}</span>
                      </TableCell>
                      <TableCell>
                        {record.result === "pass" ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Pass
                          </span>
                        ) : record.result === "fail" ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Fail
                          </span>
                        ) : (
                          <span className="text-yellow-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Conditional
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.status === "expired" ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Expired
                          </span>
                        ) : record.status === "expiring-soon" ? (
                          <span className="text-yellow-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Expiring Soon
                          </span>
                        ) : record.status === "valid" ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Valid
                          </span>
                        ) : (
                          <span className="text-blue-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {(record.status === "expired" || record.status === "expiring-soon") && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => openRenew(record)}
                              title="Renew certificate"
                            >
                              <RefreshCw className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {canEdit && <Button size="sm" variant="ghost" onClick={() => openEdit(record)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>}
                          {canDelete && <Button size="sm" variant="ghost" onClick={() => deleteRecord(record._id!)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Record" : "Add Record"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Equipment Name *</Label>
              <Select 
                value={form.equipmentName || ""} 
                onValueChange={(value) => {
                  const selectedEquipment = equipments.find(eq => eq.name === value);
                  setForm({ 
                    ...form, 
                    equipmentName: value,
                    equipmentId: selectedEquipment?.code || form.equipmentId || ""
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map((equipment) => (
                    <SelectItem key={equipment._id || equipment.id} value={equipment.name}>
                      {equipment.name} ({equipment.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Certificate Type *</Label>
              <Select 
                value={form.certificationType} 
                onValueChange={(value: any) => setForm({ ...form, certificationType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calibration">Calibration</SelectItem>
                  <SelectItem value="safety-inspection">Safety Inspection</SelectItem>
                  <SelectItem value="load-test">Load Test</SelectItem>
                  <SelectItem value="pressure-test">Pressure Test</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Certificate Number *</Label>
              <Input 
                value={form.certificateNumber || ""} 
                onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} 
              />
            </div>
            <div>
              <Label>Issued By *</Label>
              <Input 
                value={form.issuedBy || ""} 
                onChange={(e) => setForm({ ...form, issuedBy: e.target.value })} 
              />
            </div>
            <div>
              <Label>Inspection Agency *</Label>
              <Input 
                value={form.inspectionAgency || ""} 
                onChange={(e) => setForm({ ...form, inspectionAgency: e.target.value })} 
              />
            </div>
            <div>
              <Label>Location</Label>
              <Select 
                value={typeof form.location === 'string' ? form.location : form.location?._id || ""} 
                onValueChange={(value) => setForm({ ...form, location: value as any })}
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
            <div>
              <Label>Issued Date *</Label>
              <Input 
                type="date" 
                value={form.issuedDate || ""} 
                onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} 
              />
            </div>
            <div>
              <Label>Expiry Date *</Label>
              <Input 
                type="date" 
                value={form.expiryDate || ""} 
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} 
              />
            </div>
            <div>
              <Label>Next Due Date *</Label>
              <Input 
                type="date" 
                value={form.nextDueDate || ""} 
                onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} 
              />
            </div>
            <div>
              <Label>Result *</Label>
              <Select 
                value={form.result} 
                onValueChange={(value: any) => setForm({ ...form, result: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="conditional">Conditional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cost</Label>
              <Input 
                type="number" 
                value={form.cost || ""} 
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} 
              />
            </div>
            <div className="col-span-2">
              <Label>Findings</Label>
              <Textarea 
                value={form.findings || ""} 
                onChange={(e) => setForm({ ...form, findings: e.target.value })} 
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label>Recommendations</Label>
              <Textarea 
                value={form.recommendations || ""} 
                onChange={(e) => setForm({ ...form, recommendations: e.target.value })} 
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveForm} disabled={loading}>
              <Save className="mr-2 h-4 w-4" /> 
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Certificate Dialog */}
      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Renew Certificate</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>New Certificate Number *</Label>
              <Input 
                value={renewForm.certificateNumber} 
                onChange={(e) => setRenewForm({ ...renewForm, certificateNumber: e.target.value })} 
              />
            </div>
            <div>
              <Label>Cost</Label>
              <Input 
                type="number" 
                value={renewForm.cost} 
                onChange={(e) => setRenewForm({ ...renewForm, cost: Number(e.target.value) })} 
              />
            </div>
            <div>
              <Label>New Expiry Date *</Label>
              <Input 
                type="date" 
                value={renewForm.expiryDate} 
                onChange={(e) => setRenewForm({ ...renewForm, expiryDate: e.target.value })} 
              />
            </div>
            <div>
              <Label>Next Due Date *</Label>
              <Input 
                type="date" 
                value={renewForm.nextDueDate} 
                onChange={(e) => setRenewForm({ ...renewForm, nextDueDate: e.target.value })} 
              />
            </div>
            <div className="col-span-2">
              <Label>Remarks</Label>
              <Textarea 
                value={renewForm.remarks} 
                onChange={(e) => setRenewForm({ ...renewForm, remarks: e.target.value })} 
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenew} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" /> 
              Renew Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}