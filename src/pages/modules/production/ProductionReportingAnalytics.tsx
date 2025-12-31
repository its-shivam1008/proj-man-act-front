import { usePermission } from "@/hooks/userPermission";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { ShieldAlert, MapPin, Search } from "lucide-react";
import { fetchWorkCenterPerformance } from "@/redux/slices/production/workCenterSlice";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../../components/ui/table";
import { Input } from "../../../components/ui/input";
import { Pagination } from "../../../components/ui/pagination";
import MaterialConsumptionReport from "@/components/reports/MaterialConsumptionReport";
import QualityRejectionReport from "@/components/reports/QualityRejectionReport";
import EquipmentUtilisationDashboard from "@/components/reports/EquipmentUtilisationDashboard";
import WipSummaryReport from "@/components/reports/WipSummaryReport";
import DailyProductionReport from "@/components/reports/DailyProductionReport";
import CostVsOutputAnalysis from "@/components/reports/CostVsOutputAnalysis";
import DowntimeAnalysisReport from "@/components/reports/DowntimeAnalysisReport";
import ProductionEfficiencyReport from "@/components/reports/ProductionEfficiencyReport";
import OrderProgressTrackerReport from "@/components/reports/OrderProgressTrackerReport";

// Debounce utility function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export default function ProductionReportingAnalytics() {
  const dispatch = useDispatch<AppDispatch>();
  const [tab, setTab] = useState("workcenter-performance");

  const canView = usePermission("productionReportingAnalytics", "view");

  // ✅ LOCATION FILTERING STATE - Initialize properly for restricted users
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);
  const [locationFilter, setLocationFilter] = useState(() => {
    const isRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;
    return isRestricted ? userProfile.location : "all";
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  const { performance, loading, performancePagination } = useSelector(
    (state: RootState) => state.workCenters
  );

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      dispatch(fetchWorkCenterPerformance({
        location: locationFilter !== "all" ? locationFilter : undefined,
        page: 1,
        limit: performancePagination.itemsPerPage,
        search: searchValue
      }));
    }, 300),
    [dispatch, locationFilter, performancePagination.itemsPerPage]
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    dispatch(fetchWorkCenterPerformance({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page,
      limit: performancePagination.itemsPerPage,
      search: searchTerm
    }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    dispatch(fetchWorkCenterPerformance({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: 1,
      limit: itemsPerPage,
      search: searchTerm
    }));
  };

  // Load data on mount and when location filter changes
  useEffect(() => {
    console.log("🚀 ProductionReportingAnalytics mounted, fetching performance...");
    console.log("Location filter:", locationFilter);
    console.log("User restrictions:", { isLocationRestricted, userLocation: userProfile?.location });
    
    dispatch(fetchWorkCenterPerformance({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: performancePagination.currentPage,
      limit: performancePagination.itemsPerPage,
      search: searchTerm
    }));
    // Fetch master data for locations
    (dispatch as any)(fetchMasterData("location"));
  }, [dispatch, locationFilter]);

  // Auto-set location filter for restricted users (backup in case initial state didn't work)
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location && locationFilter === "all") {
      console.log("ProductionReporting: Setting location filter for restricted user:", userProfile.location);
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile, locationFilter]);

  // Handle location filter change
  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    setSearchTerm(""); // Reset search when location changes
    // Fetch performance data with new location filter
    dispatch(fetchWorkCenterPerformance({
      location: val !== "all" ? val : undefined,
      page: 1,
      limit: performancePagination.itemsPerPage,
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

  // Debug performance data
  useEffect(() => {
    console.log("📊 Performance data updated:", performance?.length, "work centers");
    console.log("Performance data:", performance);
  }, [performance]);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header with Location Filter */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production Reporting & Analytics</h1>
          <p className="text-muted-foreground">
            Work Center performance and efficiency analysis
          </p>
        </div>
        
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
            {(locations || []).map((loc: any) => (
              <SelectItem key={loc._id} value={loc._id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="workcenter-performance">
            Work Center Performance
          </TabsTrigger>
          <TabsTrigger value="material-consumption">
            Material Consumption
          </TabsTrigger>
          <TabsTrigger value="quality-rejection">
            Quality Rejection
          </TabsTrigger>
          <TabsTrigger value="equipment-utilisation">
            Equipment Utilisation
          </TabsTrigger>
          <TabsTrigger value="wip">
            WIP Summary
          </TabsTrigger>
          <TabsTrigger value="dpr">
            Daily Production Report 
          </TabsTrigger>
          <TabsTrigger value="costvsoutput">
            Cost vs Output
          </TabsTrigger>
          <TabsTrigger value="downtime-analysis">
            Downtime Analysis
          </TabsTrigger>
          <TabsTrigger value="production-efficiency">
            Production Efficiency
          </TabsTrigger>
          <TabsTrigger value="order-progress">
            Order Progress Tracker
          </TabsTrigger>



        </TabsList>

        {/* ================= WORK CENTER PERFORMANCE ================= */}
        <TabsContent value="workcenter-performance">
          <div className="space-y-6">

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading performance data...</p>
              </div>
            )}

            {!loading && performance.length === 0 && (
              <div className="text-center py-8">
                {searchTerm ? (
                  <>
                    <p className="text-gray-500">No work centers found matching "{searchTerm}"</p>
                    <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500">No work center performance data available</p>
                    <p className="text-sm text-gray-400">Create work centers to see performance metrics</p>
                  </>
                )}
              </div>
            )}

            {/* KPI CARDS */}
            {!loading && performance.length > 0 && (
              <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
                {performance.map((wc) => (
                  <Card key={wc.id} className="border-l-4 border-indigo-600">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {wc.workCenterName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Availability</span>
                        <b>{wc.availability}%</b>
                      </div>
                      <div className="flex justify-between">
                        <span>Performance</span>
                        <b>{wc.performance}%</b>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality</span>
                        <b>{wc.quality}%</b>
                      </div>
                      <div className="flex justify-between text-indigo-600">
                        <span>OEE</span>
                        <b>{wc.oee}%</b>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* CHARTS */}
            {!loading && performance.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Downtime by Work Center (min)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="workCenterName" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="downtimeMin" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>OEE Comparison (%)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="workCenterName" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="oee" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TABLE */}
            {!loading && performance.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Detailed Performance</CardTitle>
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
                        <TableHead>Run Time</TableHead>
                        <TableHead>Downtime</TableHead>
                        <TableHead>Produced</TableHead>
                        <TableHead>Rejected</TableHead>
                        <TableHead>Availability %</TableHead>
                        <TableHead>Performance %</TableHead>
                        <TableHead>Quality %</TableHead>
                        <TableHead>OEE %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performance.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>{w.workCenterName}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              <MapPin className="h-3 w-3" />
                              {getLocationName(w.location)}
                            </span>
                          </TableCell>
                          <TableCell>{w.runTime}</TableCell>
                          <TableCell>{w.downtimeMin}</TableCell>
                          <TableCell>{w.produced}</TableCell>
                          <TableCell>{w.rejected}</TableCell>
                          <TableCell>{w.availability}</TableCell>
                          <TableCell>{w.performance}</TableCell>
                          <TableCell>{w.quality}</TableCell>
                          <TableCell className="font-bold text-indigo-600">
                            {w.oee}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <Pagination
                    currentPage={performancePagination.currentPage}
                    totalPages={performancePagination.totalPages}
                    totalItems={performancePagination.totalItems}
                    itemsPerPage={performancePagination.itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    showItemsPerPage={true}
                    itemsPerPageOptions={[5, 10, 20, 50]}
                  />
                </CardContent>
              </Card>
            )}

          </div>
        </TabsContent>
        <TabsContent value="material-consumption">
          <MaterialConsumptionReport locationFilter={locationFilter} />
        </TabsContent>
        <TabsContent value="quality-rejection">
          <QualityRejectionReport locationFilter={locationFilter} />
        </TabsContent>
        <TabsContent value="equipment-utilisation">
          <EquipmentUtilisationDashboard locationFilter={locationFilter} />
        </TabsContent>
        <TabsContent value="wip">
          <WipSummaryReport locationFilter={locationFilter} />
        </TabsContent>
        <TabsContent value="dpr">
          <DailyProductionReport locationFilter={locationFilter} />
        </TabsContent>
        <TabsContent value="costvsoutput">
          <CostVsOutputAnalysis locationFilter={locationFilter} />
        </TabsContent>
        <TabsContent value="downtime-analysis">
          <DowntimeAnalysisReport locationFilter={locationFilter} />
        </TabsContent>
        <TabsContent value="production-efficiency">
          <ProductionEfficiencyReport locationFilter={locationFilter} />
        </TabsContent>
        <TabsContent value="order-progress">
          <OrderProgressTrackerReport locationFilter={locationFilter} />
        </TabsContent>


      </Tabs>
    </div>
  );
}
