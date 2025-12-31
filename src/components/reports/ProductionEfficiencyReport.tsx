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
  Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
  AreaChart, Area, RadialBarChart, RadialBar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { 
  ShieldAlert, TrendingUp, TrendingDown, Activity, 
  Target, Gauge, Clock, Zap, Award, AlertCircle,
  Calendar, Filter, Download, RefreshCw, Search
} from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  fetchProductionEfficiencyData,
  fetchOEEMetrics,
  fetchProductivityTrends,
  clearError
} from "@/redux/slices/production/productionEfficiencySlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

// Debounce utility function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const EFFICIENCY_COLORS = {
  excellent: "#22c55e", // Green
  good: "#3b82f6",      // Blue  
  average: "#f59e0b",   // Orange
  poor: "#ef4444"       // Red
};

const getEfficiencyLevel = (value: number) => {
  if (value >= 90) return { level: "excellent", label: "Excellent" };
  if (value >= 75) return { level: "good", label: "Good" };
  if (value >= 60) return { level: "average", label: "Average" };
  return { level: "poor", label: "Poor" };
};

const getEfficiencyColor = (value: number) => {
  const level = getEfficiencyLevel(value);
  return EFFICIENCY_COLORS[level.level as keyof typeof EFFICIENCY_COLORS];
};

export default function ProductionEfficiencyReport({ locationFilter }: { locationFilter?: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const canView = usePermission("productionReportingAnalytics", "view");

  const { 
    efficiencyData, 
    oeeMetrics, 
    productivityTrends, 
    loading, 
    error,
    pagination
  } = useSelector((state: RootState) => state.productionEfficiency);

  const { masterData } = useSelector((state: RootState) => state.masterData);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });

  const [selectedMetric, setSelectedMetric] = useState<"oee" | "availability" | "performance" | "quality">("oee");
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      const params = { 
        ...dateRange, 
        page: 1,
        limit: pagination.itemsPerPage,
        search: searchValue,
        ...(locationFilter && locationFilter !== 'all' && { location: locationFilter })
      };
      dispatch(fetchProductionEfficiencyData(params));
    }, 300),
    [dispatch, dateRange, locationFilter, pagination.itemsPerPage]
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    const params = { 
      ...dateRange, 
      page,
      limit: pagination.itemsPerPage,
      search: searchTerm,
      ...(locationFilter && locationFilter !== 'all' && { location: locationFilter })
    };
    dispatch(fetchProductionEfficiencyData(params));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    const params = { 
      ...dateRange, 
      page: 1,
      limit: itemsPerPage,
      search: searchTerm,
      ...(locationFilter && locationFilter !== 'all' && { location: locationFilter })
    };
    dispatch(fetchProductionEfficiencyData(params));
  };

  // Helper function to get location name
  const getLocationName = (locationId: string) => {
    if (!locationId || !masterData?.locations) return 'N/A';
    const location = masterData.locations.find(loc => loc._id === locationId);
    return location?.name || 'Unknown Location';
  };

  useEffect(() => {
    if (canView) {
      const params = { 
        ...dateRange, 
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: searchTerm,
        ...(locationFilter && locationFilter !== 'all' && { location: locationFilter })
      };
      dispatch(fetchProductionEfficiencyData(params));
      dispatch(fetchOEEMetrics(dateRange));
      dispatch(fetchProductivityTrends(dateRange));
      // Fetch master data for locations
      dispatch(fetchMasterData("location"));
    }
  }, [dispatch, canView, locationFilter]);

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

  /* ================= COMPUTED DATA ================= */
  const summaryMetrics = useMemo(() => {
    if (!efficiencyData) return null;

    const totalWorkCenters = efficiencyData.workCenters?.length || 0;
    const avgOEE = efficiencyData.workCenters?.reduce((sum, wc) => sum + (wc.oee || 0), 0) / totalWorkCenters || 0;
    const avgAvailability = efficiencyData.workCenters?.reduce((sum, wc) => sum + (wc.availability || 0), 0) / totalWorkCenters || 0;
    const avgPerformance = efficiencyData.workCenters?.reduce((sum, wc) => sum + (wc.performance || 0), 0) / totalWorkCenters || 0;
    const avgQuality = efficiencyData.workCenters?.reduce((sum, wc) => sum + (wc.quality || 0), 0) / totalWorkCenters || 0;

    const excellentWCs = efficiencyData.workCenters?.filter(wc => (wc.oee || 0) >= 90).length || 0;
    const poorWCs = efficiencyData.workCenters?.filter(wc => (wc.oee || 0) < 60).length || 0;

    return {
      totalWorkCenters,
      avgOEE: Math.round(avgOEE * 100) / 100,
      avgAvailability: Math.round(avgAvailability * 100) / 100,
      avgPerformance: Math.round(avgPerformance * 100) / 100,
      avgQuality: Math.round(avgQuality * 100) / 100,
      excellentWCs,
      poorWCs,
      totalProduced: efficiencyData.summary?.totalProduced || 0,
      totalPlanned: efficiencyData.summary?.totalPlanned || 0,
      overallEfficiency: efficiencyData.summary?.overallEfficiency || 0
    };
  }, [efficiencyData]);

  const chartData = useMemo(() => {
    if (!efficiencyData?.workCenters) return [];
    
    return efficiencyData.workCenters.map(wc => ({
      ...wc,
      efficiencyLevel: getEfficiencyLevel(wc.oee || 0).label,
      color: getEfficiencyColor(wc.oee || 0)
    }));
  }, [efficiencyData]);

  const trendData = useMemo(() => {
    if (!productivityTrends?.daily) return [];
    
    return productivityTrends.daily.map(day => ({
      ...day,
      date: new Date(day.date).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short' 
      }),
      efficiency: day.produced > 0 ? Math.round((day.produced / day.planned) * 100) : 0
    }));
  }, [productivityTrends]);

  const handleRefresh = () => {
    const params = { 
      ...dateRange, 
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      search: searchTerm,
      ...(locationFilter && locationFilter !== 'all' && { location: locationFilter })
    };
    dispatch(fetchProductionEfficiencyData(params));
    dispatch(fetchOEEMetrics(dateRange));
    dispatch(fetchProductivityTrends(dateRange));
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production Efficiency Report</h1>
          <p className="text-muted-foreground">
            Overall Equipment Effectiveness (OEE), productivity metrics & performance benchmarks
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-1">Error: {error}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* DATE RANGE & METRIC SELECTOR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <Label>Primary Metric</Label>
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oee">Overall OEE</SelectItem>
                  <SelectItem value="availability">Availability</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleRefresh}
                disabled={loading}
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading efficiency data...</p>
        </div>
      )}

      {/* SUMMARY KPI CARDS */}
      {summaryMetrics && (
        <div className="grid xl:grid-cols-5 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-indigo-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall OEE</CardTitle>
              <Gauge className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {summaryMetrics.avgOEE}%
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${getEfficiencyLevel(summaryMetrics.avgOEE).level === 'excellent' ? 'bg-green-100 text-green-700' : 
                  getEfficiencyLevel(summaryMetrics.avgOEE).level === 'good' ? 'bg-blue-100 text-blue-700' :
                  getEfficiencyLevel(summaryMetrics.avgOEE).level === 'average' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'}`}>
                  {getEfficiencyLevel(summaryMetrics.avgOEE).label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Availability</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summaryMetrics.avgAvailability}%
              </div>
              <Progress value={summaryMetrics.avgAvailability} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summaryMetrics.avgPerformance}%
              </div>
              <Progress value={summaryMetrics.avgPerformance} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {summaryMetrics.avgQuality}%
              </div>
              <Progress value={summaryMetrics.avgQuality} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Work Centers</CardTitle>
              <Target className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryMetrics.totalWorkCenters}
              </div>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-green-100 text-green-700">
                  {summaryMetrics.excellentWCs} Excellent
                </Badge>
                {summaryMetrics.poorWCs > 0 && (
                  <Badge className="bg-red-100 text-red-700">
                    {summaryMetrics.poorWCs} Poor
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CHARTS SECTION */}
      {chartData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* OEE by Work Center */}
          <Card>
            <CardHeader>
              <CardTitle>OEE by Work Center</CardTitle>
              <p className="text-sm text-muted-foreground">
                Overall Equipment Effectiveness comparison
              </p>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="workCenterName" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'OEE']}
                    labelFormatter={(label) => `Work Center: ${label}`}
                  />
                  <Bar 
                    dataKey="oee" 
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Efficiency Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Components</CardTitle>
              <p className="text-sm text-muted-foreground">
                Availability, Performance & Quality breakdown
              </p>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="workCenterName" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="availability" fill="#22c55e" name="Availability" />
                  <Bar dataKey="performance" fill="#3b82f6" name="Performance" />
                  <Bar dataKey="quality" fill="#8b5cf6" name="Quality" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Productivity Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Productivity Trend</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily production efficiency over time
              </p>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'efficiency' ? `${value}%` : value,
                      name === 'efficiency' ? 'Efficiency' : 
                      name === 'produced' ? 'Produced' : 'Planned'
                    ]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="planned" 
                    stackId="1"
                    stroke="#94a3b8" 
                    fill="#e2e8f0" 
                    name="Planned"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="produced" 
                    stackId="1"
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    name="Produced"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    name="Efficiency %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DETAILED TABLE */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Detailed Efficiency Metrics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete breakdown of all efficiency parameters
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search work centers..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Center</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>OEE %</TableHead>
                  <TableHead>Availability %</TableHead>
                  <TableHead>Performance %</TableHead>
                  <TableHead>Quality %</TableHead>
                  <TableHead>Produced</TableHead>
                  <TableHead>Planned</TableHead>
                  <TableHead>Efficiency Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((wc) => (
                  <TableRow key={wc.workCenterId}>
                    <TableCell className="font-medium">
                      {wc.workCenterName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <MapPin className="w-3 h-3" />
                        {wc.location && wc.location.name ? wc.location.name : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-600">
                          {wc.oee}%
                        </span>
                        {(wc.oee || 0) >= 85 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (wc.oee || 0) < 60 ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{wc.availability}%</TableCell>
                    <TableCell>{wc.performance}%</TableCell>
                    <TableCell>{wc.quality}%</TableCell>
                    <TableCell>{wc.produced || 0}</TableCell>
                    <TableCell>{wc.planned || 0}</TableCell>
                    <TableCell>
                      <Badge className={`${getEfficiencyLevel(wc.oee || 0).level === 'excellent' ? 'bg-green-100 text-green-700' : 
                        getEfficiencyLevel(wc.oee || 0).level === 'good' ? 'bg-blue-100 text-blue-700' :
                        getEfficiencyLevel(wc.oee || 0).level === 'average' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'}`}>
                        {wc.efficiencyLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(wc.oee || 0) < 60 ? (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Needs Attention
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          Performing Well
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              showItemsPerPage={true}
              itemsPerPageOptions={[5, 10, 20, 50]}
            />
          </CardContent>
        </Card>
      )}

      {/* NO DATA STATE */}
      {!loading && (!chartData || chartData.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <Gauge className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            {searchTerm ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Work Centers Found
                </h3>
                <p className="text-gray-600 mb-4">
                  No work centers found matching "{searchTerm}". Try adjusting your search terms.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Efficiency Data Available
                </h3>
                <p className="text-gray-600 mb-4">
                  No production efficiency data found for the selected date range.
                </p>
              </>
            )}
            <Button onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}