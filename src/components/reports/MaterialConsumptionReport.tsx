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
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { ShieldAlert, AlertTriangle, Search } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
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

interface MaterialConsumptionReportProps {
  locationFilter?: string;
}

export default function MaterialConsumptionReport({ locationFilter }: MaterialConsumptionReportProps) {
  const dispatch = useDispatch<AppDispatch>();
  const canView = usePermission("productionReportingAnalytics", "view");  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { materials, loading } = useSelector(
    (state: RootState) => state.rawMaterials
  );

  useEffect(() => {
    dispatch(fetchMaterials({ page: 1, limit: 1000 })); // Fetch all materials for frontend pagination
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

  /* ================= DERIVED DATA ================= */

  const consumptionData = useMemo(() => {
    return materials.map((m) => {
      const opening = m.stocks.reduce((s, b) => s + b.quantity, 0);
      const closing = m.stocks.reduce((s, b) => s + b.remainingQuantity, 0);
      const consumed = opening - closing;

      const avgCost =
        m.stocks.reduce((s, b) => s + (b.unitCost || 0), 0) /
        (m.stocks.length || 1);

      return {
        name: m.name,
        unit: m.unitOfMeasure,
        opening,
        consumed,
        closing,
        value: consumed * avgCost,
        lowStock: closing <= (m.reorderLevel || 0),
      };
    });
  }, [materials]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return consumptionData;
    
    return consumptionData.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [consumptionData, searchTerm]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const totalItems = filteredData.length;

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: string) => {
    setItemsPerPage(parseInt(newItemsPerPage));
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const totalConsumed = consumptionData.reduce((s, m) => s + m.consumed, 0);
  const totalValue = consumptionData.reduce((s, m) => s + m.value, 0);

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Material Consumption Report</h1>
        <p className="text-muted-foreground">
          Raw material usage, cost & FIFO-based consumption analysis
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Materials</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {materials.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Total Consumed Qty</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {totalConsumed}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Consumption Value</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            ₹ {totalValue.toFixed(2)}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {consumptionData.filter(m => m.lowStock).length}
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Material Consumption</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="consumed" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consumption Value (₹)</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Detailed Material Consumption ({totalItems})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
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
              <p className="mt-2 text-sm text-gray-500">Loading material data...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? `No materials found matching "${searchTerm}"` : "No material consumption data available"}
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm ? "Try adjusting your search terms" : "Material consumption will appear here once materials are used"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Opening</TableHead>
                    <TableHead>Consumed</TableHead>
                    <TableHead>Closing</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((m, index) => (
                    <TableRow key={`${m.name}-${index}`}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.opening}</TableCell>
                      <TableCell>{m.consumed}</TableCell>
                      <TableCell>{m.closing}</TableCell>
                      <TableCell>{m.unit}</TableCell>
                      <TableCell>₹ {m.value.toFixed(2)}</TableCell>
                      <TableCell>
                        {m.lowStock ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
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
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
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
