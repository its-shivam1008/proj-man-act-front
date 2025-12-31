"use client";

import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { ShieldAlert, Layers, Search } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchWIP } from "@/redux/slices/production/materialIssueSlice";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

interface WipSummaryReportProps {
  locationFilter?: string;
}

export default function WipSummaryReport({ locationFilter }: WipSummaryReportProps) {
  const dispatch = useDispatch<AppDispatch>();
  const canView = usePermission("productionReportingAnalytics", "view");
  const [searchInput, setSearchInput] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { wip, loading, wipPagination } = useSelector(
    (state: RootState) => state.materialIssue
  );

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchWIP({ 
        location: locationFilter !== "all" ? locationFilter : undefined,
        page: 1, 
        limit: itemsPerPage, 
        search: searchInput || undefined 
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, dispatch, locationFilter, itemsPerPage]);

  // Fetch WIP data when pagination changes
  useEffect(() => {
    dispatch(fetchWIP({ 
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: wipPagination.currentPage, 
      limit: itemsPerPage, 
      search: searchInput || undefined 
    }));
  }, [dispatch, wipPagination.currentPage, itemsPerPage, locationFilter]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    dispatch(fetchWIP({ 
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: newPage, 
      limit: itemsPerPage, 
      search: searchInput || undefined 
    }));
  }, [dispatch, locationFilter, itemsPerPage, searchInput]);

  const handleItemsPerPageChange = useCallback((newLimit: string) => {
    const limitNum = parseInt(newLimit);
    setItemsPerPage(limitNum);
    dispatch(fetchWIP({ 
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: 1, 
      limit: limitNum, 
      search: searchInput || undefined 
    }));
  }, [dispatch, locationFilter, searchInput]);

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

  /* ================= DERIVED DATA ================= */

  const totalWipQty = useMemo(
    () => wip.reduce((s: number, r: any) => s + r.quantity, 0),
    [wip]
  );

  const highWipCount = wip.filter((r: any) => r.quantity > 50).length;
  const lowWipCount = wip.filter((r: any) => r.quantity <= 5).length;

  const pieData = wip.map((r: any) => ({
    name: r.itemId?.name || "Unknown",
    value: r.quantity,
  }));

  const topWip = [...wip]
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5);

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WIP Summary Report</h1>
        <p className="text-muted-foreground">
          Work-in-progress inventory created from material issues
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Total WIP Qty</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {totalWipQty}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>WIP Materials</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {wip.length}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              High WIP
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {highWipCount}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardHeader><CardTitle>Low / Near Zero</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {lowWipCount}
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* PIE */}
        <Card>
          <CardHeader>
            <CardTitle>WIP Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* BAR */}
        <Card>
          <CardHeader>
            <CardTitle>Top WIP Materials</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWip}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="itemId.name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Detailed WIP Inventory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search materials..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading WIP data...</p>
            </div>
          ) : wip.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchInput ? `No WIP inventory found matching "${searchInput}"` : "No WIP Inventory Found"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {wip.map((row: any) => {
                    const status =
                      row.quantity > 50
                        ? "High"
                        : row.quantity <= 5
                        ? "Low"
                        : "Normal";

                    return (
                      <TableRow key={row._id}>
                        <TableCell className="font-medium">
                          {row.itemId?.name || "-"}
                        </TableCell>

                        <TableCell>{row.quantity}</TableCell>

                        <TableCell>
                          {row.itemId?.unitOfMeasure || "-"}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={
                              status === "High"
                                ? "bg-red-100 text-red-700"
                                : status === "Low"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {wipPagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {((wipPagination.currentPage - 1) * itemsPerPage) + 1} to {Math.min(wipPagination.currentPage * itemsPerPage, wipPagination.totalItems)} of {wipPagination.totalItems} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(wipPagination.currentPage - 1)}
                      disabled={wipPagination.currentPage <= 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, wipPagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (wipPagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (wipPagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (wipPagination.currentPage >= wipPagination.totalPages - 2) {
                          pageNum = wipPagination.totalPages - 4 + i;
                        } else {
                          pageNum = wipPagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={wipPagination.currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(wipPagination.currentPage + 1)}
                      disabled={wipPagination.currentPage >= wipPagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
