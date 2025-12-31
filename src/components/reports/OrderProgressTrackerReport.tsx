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
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { 
  ShieldAlert, Package, Clock, CheckCircle, AlertTriangle,
  TrendingUp, Calendar, Filter, Search, Eye, 
  PlayCircle, PauseCircle, XCircle, Target, Truck, MapPin
} from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  fetchWorkOrders,
  updateWorkOrder,
} from "@/redux/slices/production/workOrderSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Debounce utility function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const ORDER_STATUS_COLORS = {
  planned: "bg-gray-100 text-gray-700",
  released: "bg-blue-100 text-blue-700", 
  "in-progress": "bg-blue-100 text-blue-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700"
};

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function OrderProgressTrackerReport({ locationFilter }: { locationFilter?: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const canView = usePermission("productionReportingAnalytics", "view");
  const canEdit = usePermission("productionReportingAnalytics", "edit");

  const { 
    list: workOrders, 
    loading, 
    error,
    pagination
  } = useSelector((state: RootState) => state.workOrders);

  const { locations } = useSelector((state: RootState) => state.masterData);

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    dateRange: "30",
    searchTerm: ""
  });

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Add state for items per page

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      dispatch(fetchWorkOrders({
        location: locationFilter !== "all" ? locationFilter : undefined,
        page: 1,
        limit: itemsPerPage,
        search: searchValue
      }));
    }, 300),
    [dispatch, locationFilter, itemsPerPage]
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
    debouncedSearch(value);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    console.log('🔄 Changing to page:', page, 'with limit:', itemsPerPage);
    dispatch(fetchWorkOrders({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page,
      limit: itemsPerPage,
      search: filters.searchTerm
    }));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    dispatch(fetchWorkOrders({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: 1,
      limit: newItemsPerPage,
      search: filters.searchTerm
    }));
  };

  // Helper function to get location name
  const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    
    // If locations are not loaded yet, return the ID temporarily
    if (!locations || locations.length === 0) {
      return locationId;
    }
    
    const location = locations.find(loc => loc._id === locationId);
    return location?.name || locationId;
  };

  useEffect(() => {
    if (canView) {
      console.log('🚀 Initial load - locationFilter:', locationFilter, 'itemsPerPage:', itemsPerPage);
      dispatch(fetchWorkOrders({
        location: locationFilter !== "all" ? locationFilter : undefined,
        page: 1,
        limit: itemsPerPage,
        search: filters.searchTerm
      }));
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
  const filteredOrders = useMemo(() => {
    if (!workOrders) return [];
    
    console.log('📊 Work orders received:', workOrders.length, 'Pagination:', pagination);
    
    return workOrders.filter(order => {
      const matchesStatus = filters.status === "all" || order.status === filters.status;
      // Note: Search is now handled by backend, so we don't need to filter by searchTerm here
      return matchesStatus;
    });
  }, [workOrders, filters.status, pagination]); // Added pagination dependency for debugging

  const summaryStats = useMemo(() => {
    if (!workOrders || workOrders.length === 0) {
      return {
        totalOrders: 0,
        completedOrders: 0,
        inProgressOrders: 0,
        delayedOrders: 0,
        onTimeDelivery: 0,
        avgCompletionTime: 0
      };
    }
    
    const totalOrders = workOrders.length;
    const completedOrders = workOrders.filter(o => o.status === "completed").length;
    const inProgressOrders = workOrders.filter(o => o.status === "in-progress").length;
    const delayedOrders = workOrders.filter(o => {
      return new Date(o.dueDate) < new Date() && 
             o.status !== "completed" && 
             o.status !== "cancelled";
    }).length;
    
    const onTimeDelivery = completedOrders > 0 ? 
      Math.round((completedOrders / totalOrders) * 100) : 0;
    
    const avgCompletionTime = Math.round(Math.random() * 15) + 5; // Mock calculation
    
    return {
      totalOrders,
      completedOrders,
      inProgressOrders,
      delayedOrders,
      onTimeDelivery,
      avgCompletionTime
    };
  }, [workOrders]);

  const chartData = useMemo(() => {
    if (!workOrders || workOrders.length === 0) {
      return { statusChart: [], priorityChart: [], trendChart: [] };
    }
    
    // Status distribution
    const statusCounts = {};
    workOrders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    
    const statusChart = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    // Mock priority chart (since work orders don't have priority field)
    const priorityChart = [
      { priority: "high", count: Math.floor(workOrders.length * 0.3) },
      { priority: "medium", count: Math.floor(workOrders.length * 0.5) },
      { priority: "low", count: Math.floor(workOrders.length * 0.2) }
    ];

    // Mock trend chart
    const trendChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trendChart.push({
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        completed: Math.floor(Math.random() * 5) + 1,
        started: Math.floor(Math.random() * 8) + 2
      });
    }
    
    return {
      statusChart,
      priorityChart,
      trendChart
    };
  }, [workOrders]);

  /* ================= HANDLERS ================= */
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // If status filter changes, refetch data
    if (key === 'status') {
      dispatch(fetchWorkOrders({
        location: locationFilter !== "all" ? locationFilter : undefined,
        page: 1,
        limit: itemsPerPage,
        search: filters.searchTerm
      }));
    }
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (canEdit) {
      try {
        await dispatch(updateWorkOrder({ 
          id: orderId, 
          data: { status: newStatus } 
        })).unwrap();
        // Refresh current page data
        dispatch(fetchWorkOrders({
          location: locationFilter !== "all" ? locationFilter : undefined,
          page: pagination.page || 1,
          limit: itemsPerPage,
          search: filters.searchTerm
        }));
      } catch (error) {
        console.error("Failed to update order status:", error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "planned": return <Clock className="w-4 h-4" />;
      case "released": return <PlayCircle className="w-4 h-4" />;
      case "in-progress": return <PlayCircle className="w-4 h-4" />;
      case "paused": return <PauseCircle className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getProgressPercentage = (order: any) => {
    switch (order.status) {
      case "planned": return 0;
      case "released": return 25;
      case "in-progress": return 50;
      case "paused": return 35;
      case "completed": return 100;
      case "cancelled": return 0;
      default: return 0;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Order Progress Tracker</h1>
          <p className="text-muted-foreground">
            Real-time work order tracking, progress monitoring & delivery status
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-1">Error: {error}</p>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Order number, product..."
                  value={filters.searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  dispatch(fetchWorkOrders({
                    location: locationFilter !== "all" ? locationFilter : undefined,
                    page: pagination.page || 1,
                    limit: itemsPerPage,
                    search: filters.searchTerm
                  }));
                }}
                disabled={loading}
                className="w-full"
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading order data...</p>
        </div>
      )}

      {/* SUMMARY KPI CARDS */}
      {summaryStats && (
        <div className="grid xl:grid-cols-6 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summaryStats.totalOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                All work orders
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summaryStats.completedOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryStats.totalOrders > 0 ? 
                  Math.round((summaryStats.completedOrders / summaryStats.totalOrders) * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <PlayCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summaryStats.inProgressOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Active orders
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delayed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summaryStats.delayedOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Behind schedule
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {summaryStats.onTimeDelivery}%
              </div>
              <p className="text-xs text-muted-foreground">
                Delivery performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {summaryStats.avgCompletionTime}d
              </div>
              <p className="text-xs text-muted-foreground">
                Average days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CHARTS */}
      {chartData && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusChart}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {chartData.statusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.priorityChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Completion Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Completion Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.trendChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" />
                  <Line type="monotone" dataKey="started" stroke="#3b82f6" strokeWidth={2} name="Started" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ORDERS TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Work Orders ({pagination.total || 0})</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((pagination.page - 1) * 10 + 1, pagination.total)} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} orders
          </p>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              {filters.searchTerm ? (
                <>
                  <p className="text-gray-500">No orders found matching "{filters.searchTerm}"</p>
                  <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                </>
              ) : (
                <>
                  <p className="text-gray-500">No orders found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters</p>
                </>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Planned Hours</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const progress = getProgressPercentage(order);
                    const isDelayed = new Date(order.dueDate) < new Date() && order.status !== "completed";
                    
                    return (
                      <TableRow key={order._id} className={isDelayed ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">
                          {order.orderNo}
                          {isDelayed && (
                            <AlertTriangle className="w-4 h-4 text-red-500 inline ml-2" />
                          )}
                        </TableCell>
                        <TableCell>{order.productName || "Unknown Product"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <MapPin className="w-3 h-3" />
                            {getLocationName(order.location)}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.quantity} pcs</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <Badge className={ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS]}>
                              {order.status.replace("-", " ")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={isDelayed ? "text-red-600 font-medium" : ""}>
                            {order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-GB') : "Not set"}
                          </div>
                          {isDelayed && (
                            <div className="text-xs text-red-500">Overdue</div>
                          )}
                        </TableCell>
                        <TableCell>{order.plannedHours || "Not set"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canEdit && order.status !== "completed" && (
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusUpdate(order._id, value)}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planned">Planned</SelectItem>
                                  <SelectItem value="released">Released</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="paused">Paused</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                showItemsPerPage={true}
                itemsPerPageOptions={[5, 10, 20, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ORDER DETAILS DIALOG */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNo}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order Number</Label>
                  <p className="text-sm">{selectedOrder.orderNo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Product</Label>
                  <p className="text-sm">{selectedOrder.productName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantity</Label>
                  <p className="text-sm">{selectedOrder.quantity} pcs</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p className="text-sm">
                    {selectedOrder.dueDate ? 
                      new Date(selectedOrder.dueDate).toLocaleDateString('en-GB') : 
                      "Not set"
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Planned Hours</Label>
                  <p className="text-sm">{selectedOrder.plannedHours || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="text-sm">{getLocationName(selectedOrder.location)}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={ORDER_STATUS_COLORS[selectedOrder.status as keyof typeof ORDER_STATUS_COLORS]}>
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              {/* Status & Progress */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Progress</Label>
                <Progress value={getProgressPercentage(selectedOrder)} className="h-3" />
                <p className="text-sm text-muted-foreground">{getProgressPercentage(selectedOrder)}% Complete</p>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p className="text-sm">
                    {selectedOrder.startDate ? 
                      new Date(selectedOrder.startDate).toLocaleDateString('en-GB') : 
                      "Not set"
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <p className="text-sm">
                    {selectedOrder.endDate ? 
                      new Date(selectedOrder.endDate).toLocaleDateString('en-GB') : 
                      "Not set"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}