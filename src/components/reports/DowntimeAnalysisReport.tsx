"use client";

import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
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
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { 
  ShieldAlert, AlertTriangle, Clock, 
  Activity, DollarSign,
  Filter, Edit, Trash2, Search
} from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  fetchDowntimeAnalytics,
  fetchDowntimeReports,
  createDowntimeReport,
  updateDowntimeReport,
  deleteDowntimeReport,
  generateSampleData,
  type DowntimeReport
} from "@/redux/slices/production/downtimeAnalysisSlice";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

const DOWNTIME_TYPES = [
  { value: "planned_maintenance", label: "Planned Maintenance" },
  { value: "unplanned_maintenance", label: "Unplanned Maintenance" },
  { value: "equipment_failure", label: "Equipment Failure" },
  { value: "material_shortage", label: "Material Shortage" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "setup_changeover", label: "Setup/Changeover" },
  { value: "power_outage", label: "Power Outage" },
  { value: "operator_absence", label: "Operator Absence" },
  { value: "other", label: "Other" }
];

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700", 
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700"
};

const STATUS_COLORS = {
  reported: "bg-blue-100 text-blue-700",
  investigating: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700"
};

export default function DowntimeAnalysisReport() {
  const dispatch = useDispatch<AppDispatch>();
  const canView = usePermission("downtimeAnalysis", "view");
  const canCreate = usePermission("downtimeAnalysis", "create");
  const canEdit = usePermission("downtimeAnalysis", "edit");
  const canDelete = usePermission("downtimeAnalysis", "delete");

  const { reports, reportsPagination, analytics, loading, error } = useSelector(
    (state: RootState) => state.downtimeAnalysis
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DowntimeReport | null>(null);
  const [reportsSearch, setReportsSearch] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });

  const [form, setForm] = useState({
    workCenterId: "",
    workCenterName: "",
    date: new Date().toISOString().slice(0, 10),
    shift: "morning" as "morning" | "afternoon" | "night",
    startTime: "",
    endTime: "",
    downtimeType: "",
    category: "unplanned" as "planned" | "unplanned",
    reason: "",
    description: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    costImpact: 0,
    productionLoss: 0,
  });

  // Debounced search function
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Debounced search handler
  const debouncedReportsSearch = useCallback(
    debounce((searchTerm: string) => {
      dispatch(fetchDowntimeReports({
        page: 1,
        limit: reportsPagination?.itemsPerPage || 10,
        search: searchTerm,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }));
    }, 300),
    [dispatch, reportsPagination?.itemsPerPage, dateRange]
  );

  // Search handler
  const handleReportsSearch = (value: string) => {
    setReportsSearch(value);
    debouncedReportsSearch(value);
  };

  // Pagination handlers
  const handleReportsPageChange = (page: number) => {
    dispatch(fetchDowntimeReports({
      page,
      limit: reportsPagination?.itemsPerPage || 10,
      search: reportsSearch,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }));
  };

  const handleReportsItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchDowntimeReports({
      page: 1,
      limit: itemsPerPage,
      search: reportsSearch,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }));
  };

  useEffect(() => {
    if (canView) {
      dispatch(fetchDowntimeReports({}));
      dispatch(fetchDowntimeAnalytics(dateRange));
    }
  }, [dispatch, canView, dateRange]);

  if (!canView) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="w-14 h-14 text-red-500 mx-auto mb-3" />
        <h3 className="text-xl font-semibold">Access Denied</h3>
        <p className="text-muted-foreground">
          You do not have permission to view this report.
        </p>
      </div>
    );
  }

  /* ================= HANDLERS ================= */
  const handleCreate = () => {
    setEditingReport(null);
    setForm({
      workCenterId: "",
      workCenterName: "",
      date: new Date().toISOString().slice(0, 10),
      shift: "morning",
      startTime: "",
      endTime: "",
      downtimeType: "",
      category: "unplanned",
      reason: "",
      description: "",
      rootCause: "",
      correctiveAction: "",
      preventiveAction: "",
      priority: "medium",
      costImpact: 0,
      productionLoss: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (report: DowntimeReport) => {
    setEditingReport(report);
    setForm({
      workCenterId: report.workCenterId,
      workCenterName: report.workCenterName,
      date: report.date,
      shift: report.shift,
      startTime: report.startTime,
      endTime: report.endTime,
      downtimeType: report.downtimeType,
      category: report.category,
      reason: report.reason,
      description: report.description || "",
      rootCause: report.rootCause || "",
      correctiveAction: report.correctiveAction || "",
      preventiveAction: report.preventiveAction || "",
      priority: report.priority,
      costImpact: report.costImpact,
      productionLoss: report.productionLoss,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Calculate duration
      const start = new Date(`${form.date}T${form.startTime}`);
      const end = new Date(`${form.date}T${form.endTime}`);
      const durationMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));

      const data = {
        ...form,
        durationMinutes,
      };

      if (editingReport) {
        await dispatch(updateDowntimeReport({ id: editingReport._id, data })).unwrap();
      } else {
        await dispatch(createDowntimeReport(data)).unwrap();
      }
      
      setDialogOpen(false);
      dispatch(fetchDowntimeAnalytics(dateRange)); // Refresh analytics
    } catch (error) {
      console.error("Failed to save downtime report:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this downtime report?")) {
      try {
        await dispatch(deleteDowntimeReport(id)).unwrap();
        dispatch(fetchDowntimeAnalytics(dateRange)); // Refresh analytics
      } catch (error) {
        console.error("Failed to delete downtime report:", error);
      }
    }
  };

  const handleGenerateSampleData = async () => {
    try {
      await dispatch(generateSampleData()).unwrap();
      dispatch(fetchDowntimeReports({}));
      dispatch(fetchDowntimeAnalytics(dateRange));
    } catch (error) {
      console.error("Failed to generate sample data:", error);
    }
  };

  /* ================= COMPUTED DATA ================= */
  const chartData = useMemo(() => {
    if (!analytics) return { byType: [], byWorkCenter: [], dailyTrend: [] };

    return {
      byType: analytics.downtimeByType.map((item, index) => ({
        ...item,
        fill: COLORS[index % COLORS.length]
      })),
      byWorkCenter: analytics.downtimeByWorkCenter,
      dailyTrend: analytics.dailyTrend.map(item => ({
        ...item,
        date: new Date(item._id).toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short' 
        })
      }))
    };
  }, [analytics]);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Downtime Analysis Report</h1>
          <p className="text-muted-foreground">
            Equipment downtime tracking, root cause analysis & cost impact assessment
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-1">Error: {error}</p>
          )}
        </div>

        <div className="flex gap-2">
          {/* Commented out for production use */}
          {/* {canCreate && (
            <>
              <Button variant="outline" onClick={handleGenerateSampleData} disabled={loading}>
                <Package className="w-4 h-4 mr-2" />
                Generate Sample Data
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Report Downtime
              </Button>
            </>
          )} */}
        </div>
      </div>

      {/* DATE RANGE FILTER */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <Button 
              onClick={() => dispatch(fetchDowntimeAnalytics(dateRange))}
              disabled={loading}
            >
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading downtime data...</p>
        </div>
      )}

      {/* KPI CARDS */}
      {analytics && (
        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downtime</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {Math.round(analytics.summary.totalDowntime / 60)} hrs
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.summary.totalDowntime} minutes total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.summary.totalIncidents}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {analytics.summary.avgDowntimePerIncident.toFixed(1)} min/incident
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{analytics.summary.totalCostImpact.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Production loss: {analytics.summary.totalProductionLoss} units
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <Activity className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.summary.criticalIncidents}
              </div>
              <p className="text-xs text-muted-foreground">
                High priority: {analytics.summary.highPriorityIncidents}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CHARTS */}
      {analytics && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Downtime by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Downtime by Type</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.byType}
                    dataKey="totalMinutes"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry._id}: ${Math.round(entry.totalMinutes/60)}h`}
                  >
                    {chartData.byType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${Math.round(value/60)} hours`, 'Downtime']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Downtime by Work Center */}
          <Card>
            <CardHeader>
              <CardTitle>Downtime by Work Center</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.byWorkCenter}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="workCenterName" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${Math.round(value/60)} hours`, 'Downtime']} />
                  <Bar dataKey="totalMinutes" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Daily Downtime Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: string) => [
                    `${Math.round(value/60)} hours`, 
                    name === 'plannedMinutes' ? 'Planned' : name === 'unplannedMinutes' ? 'Unplanned' : 'Total'
                  ]} />
                  <Legend />
                  <Line type="monotone" dataKey="plannedMinutes" stroke="#22c55e" strokeWidth={2} name="Planned" />
                  <Line type="monotone" dataKey="unplannedMinutes" stroke="#ef4444" strokeWidth={2} name="Unplanned" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* REPORTS TABLE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Downtime Reports ({reportsPagination?.totalItems || 0})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={reportsSearch}
                  onChange={(e) => handleReportsSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No downtime reports found</p>
              <p className="text-sm text-gray-400">Create your first downtime report or generate sample data</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Work Center</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell>
                        {new Date(report.date).toLocaleDateString('en-GB')}
                        <div className="text-xs text-muted-foreground">
                          {report.shift} shift
                        </div>
                      </TableCell>
                      <TableCell>{report.workCenterName}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {Math.round(report.durationMinutes / 60 * 10) / 10}h
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {report.startTime} - {report.endTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {DOWNTIME_TYPES.find(t => t.value === report.downtimeType)?.label || report.downtimeType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={report.category === 'planned' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}>
                          {report.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_COLORS[report.priority]}>
                          {report.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[report.status]}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{report.costImpact.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {report.productionLoss} units lost
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(report)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(report._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination for Reports */}
              {reportsPagination && (
                <Pagination
                  currentPage={reportsPagination.currentPage}
                  totalPages={reportsPagination.totalPages}
                  totalItems={reportsPagination.totalItems}
                  itemsPerPage={reportsPagination.itemsPerPage}
                  onPageChange={handleReportsPageChange}
                  onItemsPerPageChange={handleReportsItemsPerPageChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? "Edit Downtime Report" : "Create Downtime Report"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Work Center Name</Label>
                <Input
                  value={form.workCenterName}
                  onChange={(e) => setForm(prev => ({ ...prev, workCenterName: e.target.value }))}
                  placeholder="Enter work center name"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Shift</Label>
                <Select value={form.shift} onValueChange={(value: any) => setForm(prev => ({ ...prev, shift: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Downtime Type</Label>
                <Select value={form.downtimeType} onValueChange={(value) => setForm(prev => ({ ...prev, downtimeType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOWNTIME_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(value: any) => setForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="unplanned">Unplanned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Reason</Label>
              <Input
                value={form.reason}
                onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Brief reason for downtime"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the incident"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Root Cause</Label>
                <Textarea
                  value={form.rootCause}
                  onChange={(e) => setForm(prev => ({ ...prev, rootCause: e.target.value }))}
                  placeholder="Root cause analysis"
                  rows={2}
                />
              </div>
              <div>
                <Label>Corrective Action</Label>
                <Textarea
                  value={form.correctiveAction}
                  onChange={(e) => setForm(prev => ({ ...prev, correctiveAction: e.target.value }))}
                  placeholder="Actions taken to resolve"
                  rows={2}
                />
              </div>
            </div>

            <div>
              <Label>Preventive Action</Label>
              <Textarea
                value={form.preventiveAction}
                onChange={(e) => setForm(prev => ({ ...prev, preventiveAction: e.target.value }))}
                placeholder="Actions to prevent recurrence"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(value: any) => setForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cost Impact (₹)</Label>
                <Input
                  type="number"
                  value={form.costImpact}
                  onChange={(e) => setForm(prev => ({ ...prev, costImpact: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Production Loss (units)</Label>
                <Input
                  type="number"
                  value={form.productionLoss}
                  onChange={(e) => setForm(prev => ({ ...prev, productionLoss: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : editingReport ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 