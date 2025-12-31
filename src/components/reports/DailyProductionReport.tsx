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
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { Plus, ShieldAlert, Calendar, TrendingUp, TrendingDown, Activity, Search } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  fetchDPRs,
  createDPR,
} from "@/redux/slices/production/productionReportingSlice";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

/* ============================================================
   COMPONENT
============================================================ */
export default function DailyProductionReport() {
  const dispatch = useDispatch<AppDispatch>();
  const canView = usePermission("productionReportingAnalytics", "view");
  const canCreate = usePermission("productionReportingAnalytics", "create");

  const { dprs, dprsPagination, loading, error } = useSelector(
    (state: RootState) => state.productionReporting
  );

  const [open, setOpen] = useState(false);
  const [dprSearch, setDprSearch] = useState("");
  const [form, setForm] = useState<any>({
    date: new Date().toISOString().slice(0, 10),
    totalProduced: 0,
    totalRejected: 0,
    totalDowntimeMin: 0,
    remarks: "",
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
  const debouncedDprSearch = useCallback(
    debounce((searchTerm: string) => {
      dispatch(fetchDPRs({
        page: 1,
        limit: dprsPagination?.itemsPerPage || 10,
        search: searchTerm
      }));
    }, 300),
    [dispatch, dprsPagination?.itemsPerPage]
  );

  // Search handler
  const handleDprSearch = (value: string) => {
    setDprSearch(value);
    debouncedDprSearch(value);
  };

  // Pagination handlers
  const handleDprPageChange = (page: number) => {
    dispatch(fetchDPRs({
      page,
      limit: dprsPagination?.itemsPerPage || 10,
      search: dprSearch
    }));
  };

  const handleDprItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchDPRs({
      page: 1,
      limit: itemsPerPage,
      search: dprSearch
    }));
  };

  useEffect(() => {
    dispatch(fetchDPRs());
  }, [dispatch]);

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

  /* ============================================================
     KPI + CHART DATA
  ============================================================ */
  const kpis = useMemo(() => {
    const produced = dprs.reduce((s: number, d: any) => s + (d.totalProduced || 0), 0);
    const rejected = dprs.reduce((s: number, d: any) => s + (d.totalRejected || 0), 0);
    const downtime = dprs.reduce((s: number, d: any) => s + (d.totalDowntimeMin || 0), 0);
    
    const efficiency = produced > 0 ? ((produced - rejected) / produced * 100) : 0;
    const avgDowntime = dprs.length > 0 ? downtime / dprs.length : 0;

    return { 
      produced, 
      rejected, 
      downtime, 
      efficiency: Math.round(efficiency),
      avgDowntime: Math.round(avgDowntime)
    };
  }, [dprs]);

  const trend = useMemo(() => {
    return [...dprs]
      .reverse()
      .slice(-7) // Last 7 days
      .map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short' 
        }),
        produced: d.totalProduced || 0,
        rejected: d.totalRejected || 0,
        efficiency: d.totalProduced > 0 ? 
          Math.round(((d.totalProduced - d.totalRejected) / d.totalProduced) * 100) : 0
      }));
  }, [dprs]);

  const todayDPR = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return dprs.find((d: any) => d.date === today);
  }, [dprs]);

  /* ============================================================
     HANDLERS
  ============================================================ */
  const onChange = (k: string, v: any) =>
    setForm((p: any) => ({ ...p, [k]: v }));

  const onSave = async () => {
    try {
      await dispatch(createDPR(form)).unwrap();
      setOpen(false);
      setForm({
        date: new Date().toISOString().slice(0, 10),
        totalProduced: 0,
        totalRejected: 0,
        totalDowntimeMin: 0,
        remarks: "",
      });
    } catch (error) {
      console.error('Failed to create DPR:', error);
    }
  };

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      totalProduced: 0,
      totalRejected: 0,
      totalDowntimeMin: 0,
      remarks: "",
    });
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daily Production Report</h1>
          <p className="text-muted-foreground">
            Shift-wise production output, rejection & downtime tracking
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-1">
              Error: {error}
            </p>
          )}
        </div>

        {canCreate && (
          <Button 
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            New DPR
          </Button>
        )}
      </div>

      {/* TODAY'S STATUS */}
      {todayDPR && (
        <Card className="border-l-4 border-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Production Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Produced</p>
                <p className="text-xl font-bold text-green-600">{todayDPR.totalProduced}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rejected</p>
                <p className="text-xl font-bold text-red-600">{todayDPR.totalRejected}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Downtime</p>
                <p className="text-xl font-bold text-yellow-600">{todayDPR.totalDowntimeMin} min</p>
              </div>
              <div>
                <p className="text-muted-foreground">Efficiency</p>
                <p className="text-xl font-bold text-blue-600">
                  {todayDPR.totalProduced > 0 ? 
                    Math.round(((todayDPR.totalProduced - todayDPR.totalRejected) / todayDPR.totalProduced) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI CARDS */}
      <div className="grid xl:grid-cols-5 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produced</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpis.produced}
            </div>
            <p className="text-xs text-muted-foreground">
              All time production
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rejected</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {kpis.rejected}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.produced > 0 ? 
                `${((kpis.rejected / kpis.produced) * 100).toFixed(1)}% rejection rate` 
                : 'No production data'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downtime</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {kpis.downtime} min
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {kpis.avgDowntime} min/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {kpis.efficiency}%
            </div>
            <p className="text-xs text-muted-foreground">
              Production efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {dprs.length}
            </div>
            <p className="text-xs text-muted-foreground">
              DPR entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TREND CHART */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Production Trend</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recent production performance and efficiency trends
          </p>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'efficiency') return [`${value}%`, 'Efficiency'];
                  return [value, name === 'produced' ? 'Produced' : 'Rejected'];
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="produced" 
                stroke="#16a34a" 
                strokeWidth={3}
                dot={{ r: 4 }}
                name="produced"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="rejected" 
                stroke="#dc2626" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="rejected"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="efficiency" 
                stroke="#2563eb" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                name="efficiency"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* DPR TABLE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>DPR History ({dprsPagination?.totalItems || 0})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search DPR records..."
                  value={dprSearch}
                  onChange={(e) => handleDprSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete daily production report records
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading DPR data...</p>
            </div>
          ) : dprs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No DPR records found</p>
              <p className="text-sm text-gray-400">Create your first daily production report</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produced</TableHead>
                    <TableHead>Rejected</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Downtime (min)</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {dprs.map((d: any) => {
                    const efficiency = d.totalProduced > 0 ? 
                      Math.round(((d.totalProduced - d.totalRejected) / d.totalProduced) * 100) : 0;
                    
                    const isToday = d.date === new Date().toISOString().slice(0, 10);
                    
                    return (
                      <TableRow key={d._id} className={isToday ? 'bg-blue-50' : ''}>
                        <TableCell className="font-medium">
                          {new Date(d.date).toLocaleDateString('en-GB')}
                          {isToday && <Badge variant="secondary" className="ml-2">Today</Badge>}
                        </TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {d.totalProduced}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {d.totalRejected}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={efficiency >= 90 ? "success" : efficiency >= 70 ? "secondary" : "destructive"}
                          >
                            {efficiency}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-yellow-600">
                          {d.totalDowntimeMin}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {d.remarks || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {d.status || "Completed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination for DPR */}
              {dprsPagination && (
                <Pagination
                  currentPage={dprsPagination.currentPage}
                  totalPages={dprsPagination.totalPages}
                  totalItems={dprsPagination.totalItems}
                  itemsPerPage={dprsPagination.itemsPerPage}
                  onPageChange={handleDprPageChange}
                  onItemsPerPageChange={handleDprItemsPerPageChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* CREATE DPR DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Daily Production Report</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Record today's production metrics and performance
            </p>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => onChange("date", e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="produced" className="text-right">
                Produced
              </Label>
              <Input
                id="produced"
                type="number"
                min="0"
                value={form.totalProduced}
                onChange={(e) =>
                  onChange("totalProduced", Number(e.target.value))
                }
                className="col-span-3"
                placeholder="Total units produced"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rejected" className="text-right">
                Rejected
              </Label>
              <Input
                id="rejected"
                type="number"
                min="0"
                value={form.totalRejected}
                onChange={(e) =>
                  onChange("totalRejected", Number(e.target.value))
                }
                className="col-span-3"
                placeholder="Total units rejected"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="downtime" className="text-right">
                Downtime
              </Label>
              <Input
                id="downtime"
                type="number"
                min="0"
                value={form.totalDowntimeMin}
                onChange={(e) =>
                  onChange("totalDowntimeMin", Number(e.target.value))
                }
                className="col-span-3"
                placeholder="Minutes of downtime"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="remarks" className="text-right">
                Remarks
              </Label>
              <Input
                id="remarks"
                value={form.remarks}
                onChange={(e) => onChange("remarks", e.target.value)}
                className="col-span-3"
                placeholder="Additional notes or observations"
              />
            </div>

            {/* Efficiency Preview */}
            {form.totalProduced > 0 && (
              <div className="grid grid-cols-4 items-center gap-4 bg-gray-50 p-3 rounded">
                <Label className="text-right text-sm text-muted-foreground">
                  Efficiency
                </Label>
                <div className="col-span-3">
                  <Badge 
                    variant={
                      Math.round(((form.totalProduced - form.totalRejected) / form.totalProduced) * 100) >= 90 
                        ? "success" 
                        : "secondary"
                    }
                  >
                    {Math.round(((form.totalProduced - form.totalRejected) / form.totalProduced) * 100)}%
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={onSave}
              disabled={loading || !form.date}
            >
              {loading ? "Saving..." : "Save DPR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
