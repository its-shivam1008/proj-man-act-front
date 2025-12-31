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
    LineChart, Line,
    CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { ShieldAlert, TrendingDown, TrendingUp, Search } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import { updateCostOutput, fetchCostOutputs, deleteCostOutput, createCostOutput } from "@/redux/slices/production/productionReportingSlice";
import {
    Table, TableHeader, TableRow,
    TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchProducts } from "@/redux/slices/productSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function CostVsOutputAnalysis() {
    const dispatch = useDispatch<AppDispatch>();
    const canView = usePermission("productionReportingAnalytics", "view");
    const canCreate = usePermission("productionReportingAnalytics", "create");
    const canEdit = usePermission("productionReportingAnalytics", "edit");
    const canDelete = usePermission("productionReportingAnalytics", "delete");

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any>(null);
    const [costSearch, setCostSearch] = React.useState("");
    
    // Frontend pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [form, setForm] = React.useState({
        productId: "",
        producedQty: 0,
        totalCost: 0,
        remarks: "",
    });

    // Remove debounced search since we're doing frontend filtering
    const handleCostSearch = (value: string) => {
        setCostSearch(value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const openCreate = () => {
        setEditing(null);
        setForm({
            productId: "",
            producedQty: 0,
            totalCost: 0,
            remarks: "",
        });
        setDialogOpen(true);
    };
    const { products, page, limit } = useSelector((state: RootState) => state.products);
    const { costs, loading } = useSelector(
        (state: RootState) => state.productionReporting
    );
    const orgId = localStorage.getItem('organisationId')
    useEffect(() => {
        if (orgId) {
            dispatch(fetchProducts(page, limit));
        }
    }, [dispatch, orgId, page, limit]);

    // Frontend pagination handlers
    const handleCostPageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handleCostItemsPerPageChange = useCallback((newItemsPerPage: string) => {
        setItemsPerPage(parseInt(newItemsPerPage));
        setCurrentPage(1); // Reset to first page
    }, []);

    const openEdit = (row: any) => {
        if (!row?.productId?._id) {
            alert("Invalid product reference");
            return;
        }

        setEditing({ _id: row._id }); // only id needed for update
        setForm({
            productId: row.productId._id,   // ✅ always ObjectId
            producedQty: row.producedQty,
            totalCost: row.totalCost,
            remarks: row.remarks || "",
        });

        setDialogOpen(true);
    };


    const handleSave = () => {
        if (editing) {
            dispatch(updateCostOutput({ id: editing._id, data: form }));
        } else {
            dispatch(createCostOutput(form));
        }
        setDialogOpen(false);
    };

    const handleDelete = (_id: string) => {
        if (confirm("Delete this cost record?")) {
            dispatch(deleteCostOutput(_id));
        }
    };



    useEffect(() => {
        dispatch(fetchCostOutputs({ page: 1, limit: 1000 })); // Fetch all data for frontend pagination
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

    const analysis = useMemo(() => {
        return costs.map((c: any) => ({
            _id: c._id,
            productId: c.productId,
            productName: c.productId?.name || "Unknown",
            producedQty: c.producedQty || 0,
            totalCost: c.totalCost || 0,
            costPerUnit:
                c.producedQty > 0 ? c.totalCost / c.producedQty : 0,
        }));
    }, [costs]);

    // Filter data based on search term
    const filteredAnalysis = useMemo(() => {
        if (!costSearch) return analysis;
        
        return analysis.filter((item) =>
            item.productName.toLowerCase().includes(costSearch.toLowerCase())
        );
    }, [analysis, costSearch]);

    // Paginate filtered data
    const paginatedAnalysis = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAnalysis.slice(startIndex, endIndex);
    }, [filteredAnalysis, currentPage, itemsPerPage]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredAnalysis.length / itemsPerPage);
    const totalItems = filteredAnalysis.length;

    const totals = useMemo(() => {
        const totalCost = analysis.reduce((s, r) => s + r.totalCost, 0);
        const totalQty = analysis.reduce((s, r) => s + r.producedQty, 0);
        return {
            totalCost,
            totalQty,
            avgCostPerUnit: totalQty > 0 ? totalCost / totalQty : 0,
        };
    }, [analysis]);

    /* ================= UI ================= */

    return (
        <div className="p-6 space-y-6">

            {/* HEADER */}
            <div className="flex justify-between items-center w-ful">
                <div>
                    <h1 className="text-3xl font-bold">Cost vs Output Analysis</h1>
                    <p className="text-muted-foreground">
                        Production cost efficiency & unit economics
                    </p>
                </div>
                {canCreate && (
                    <Button
                        onClick={openCreate}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        + Add Cost Record
                    </Button>
                )}


            </div>


            {/* KPI CARDS */}
            <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>Total Output</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">
                        {totals.totalQty}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Total Cost</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">
                        ₹ {totals.totalCost.toFixed(2)}
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-indigo-600">
                    <CardHeader><CardTitle>Avg Cost / Unit</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">
                        ₹ {totals.avgCostPerUnit.toFixed(2)}
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-green-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Efficient Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold">
                        {analysis.filter(r => r.costPerUnit <= totals.avgCostPerUnit).length}
                    </CardContent>
                </Card>
            </div>

            {/* CHARTS */}
            {/* ================= ADVANCED CHARTS ================= */}
<div className="grid lg:grid-cols-2 gap-6">

  {/* 🔹 Cost vs Output (Dual Axis) */}
  <Card>
    <CardHeader>
      <CardTitle>Cost vs Output (Product-wise)</CardTitle>
    </CardHeader>

    <CardContent className="h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={analysis}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="productName"
            tick={{ fontSize: 12 }}
            interval={0}
          />

          <YAxis
            yAxisId="left"
            orientation="left"
            tickFormatter={(v) => `₹${v}`}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
          />

          <Tooltip
            formatter={(value: any, name: string) => {
              if (name === "totalCost") return [`₹ ${value}`, "Total Cost"];
              if (name === "producedQty") return [value, "Output Qty"];
              return value;
            }}
          />

          <Bar
            yAxisId="left"
            dataKey="totalCost"
            name="Total Cost"
            fill="#ef4444"
            radius={[6, 6, 0, 0]}
          />

          <Bar
            yAxisId="right"
            dataKey="producedQty"
            name="Output Qty"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>

  {/* 🔹 Cost per Unit Trend */}
  <Card>
    <CardHeader>
      <CardTitle>Cost per Unit (Efficiency Trend)</CardTitle>
    </CardHeader>

    <CardContent className="h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={analysis}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="productName"
            tick={{ fontSize: 12 }}
            interval={0}
          />

          <YAxis tickFormatter={(v) => `₹${v}`} />

          <Tooltip
            formatter={(value: any) => [`₹ ${value}`, "Cost / Unit"]}
          />

          <Line
            type="monotone"
            dataKey="costPerUnit"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>

</div>


            {/* TABLE */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Cost Efficiency Details ({totalItems})</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search cost records..."
                                    value={costSearch}
                                    onChange={(e) => handleCostSearch(e.target.value)}
                                    className="pl-10 w-full sm:w-64"
                                />
                            </div>
                            <Select value={itemsPerPage.toString()} onValueChange={handleCostItemsPerPageChange}>
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading cost data...</p>
                        </div>
                    ) : paginatedAnalysis.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                {costSearch ? `No cost records found matching "${costSearch}"` : "No cost records available"}
                            </p>
                            <p className="text-sm text-gray-400">
                                {costSearch ? "Try adjusting your search terms" : "Create your first cost record to see analysis"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Output</TableHead>
                                        <TableHead>Total Cost</TableHead>
                                        <TableHead>Cost / Unit</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {paginatedAnalysis.map((r) => {
                                        const efficient = r.costPerUnit <= totals.avgCostPerUnit;

                                        return (
                                            <TableRow key={r._id}>
                                                <TableCell className="font-medium">
                                                    {r.productName}
                                                </TableCell>

                                                <TableCell>{r.producedQty}</TableCell>
                                                <TableCell>₹ {r.totalCost.toFixed(2)}</TableCell>
                                                <TableCell>₹ {r.costPerUnit.toFixed(2)}</TableCell>

                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            efficient
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                        }
                                                    >
                                                        {efficient ? "Efficient" : "High Cost"}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="flex gap-2">
                                                    {canEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEdit(r)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            Edit
                                                        </Button>
                                                    )}

                                                    {canDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(r._id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {/* Frontend Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCostPageChange(currentPage - 1)}
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
                                                        onClick={() => handleCostPageChange(pageNum)}
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
                                            onClick={() => handleCostPageChange(currentPage + 1)}
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
            {dialogOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-[400px] space-y-4">
                        <h2 className="text-xl font-bold">
                            {editing ? "Edit Cost Output" : "Add Cost Output"}
                        </h2>

                        <select
                            value={form.productId}
                            onChange={(e) =>
                                setForm({ ...form, productId: e.target.value })
                            }
                            className="w-full border p-2 rounded"
                        >
                            <option value="">Select Product</option>
                            {products.map((p: any) => (
                                <option key={p._id} value={p._id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>


                        <input
                            type="number"
                            placeholder="Produced Qty"
                            value={form.producedQty}
                            onChange={(e) =>
                                setForm({ ...form, producedQty: Number(e.target.value) })
                            }
                            className="w-full border p-2 rounded"
                        />

                        <input
                            type="number"
                            placeholder="Total Cost"
                            value={form.totalCost}
                            onChange={(e) =>
                                setForm({ ...form, totalCost: Number(e.target.value) })
                            }
                            className="w-full border p-2 rounded"
                        />

                        <textarea
                            placeholder="Remarks"
                            value={form.remarks}
                            onChange={(e) =>
                                setForm({ ...form, remarks: e.target.value })
                            }
                            className="w-full border p-2 rounded"
                        />

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDialogOpen(false)}>Cancel</button>
                            <button
                                onClick={handleSave}
                                className="bg-indigo-600 text-white px-4 py-2 rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
