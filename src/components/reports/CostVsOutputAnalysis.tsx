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
import { Pagination } from "@/components/ui/pagination";

export default function CostVsOutputAnalysis() {
    const dispatch = useDispatch<AppDispatch>();
    const canView = usePermission("costVsOutputReport", "view");
    const canCreate = usePermission("costVsOutputReport", "create");
    const canEdit = usePermission("costVsOutputReport", "edit");
    const canDelete = usePermission("costVsOutputReport", "delete");

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any>(null);
    const [costSearch, setCostSearch] = React.useState("");
    const [form, setForm] = React.useState({
        productId: "",
        producedQty: 0,
        totalCost: 0,
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
    const debouncedCostSearch = useCallback(
        debounce((searchTerm: string) => {
            dispatch(fetchCostOutputs({
                page: 1,
                limit: costsPagination?.itemsPerPage || 10,
                search: searchTerm
            }));
        }, 300),
        [dispatch]
    );

    // Search handler
    const handleCostSearch = (value: string) => {
        setCostSearch(value);
        debouncedCostSearch(value);
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
    const { costs, costsPagination } = useSelector(
        (state: RootState) => state.productionReporting
    );
    const orgId = localStorage.getItem('organisationId')
    useEffect(() => {
        if (orgId) {
            dispatch(fetchProducts(page, limit));
        }

    }, [dispatch, orgId, page, limit]);

    // Pagination handlers
    const handleCostPageChange = (page: number) => {
        dispatch(fetchCostOutputs({
            page,
            limit: costsPagination?.itemsPerPage || 10,
            search: costSearch
        }));
    };

    const handleCostItemsPerPageChange = (itemsPerPage: number) => {
        dispatch(fetchCostOutputs({
            page: 1,
            limit: itemsPerPage,
            search: costSearch
        }));
    };

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
        dispatch(fetchCostOutputs());
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
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                    >
                        + Add Cost Record
                    </button>
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
                    <div className="flex items-center justify-between">
                        <CardTitle>Cost Efficiency Details ({costsPagination?.totalItems || 0})</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search cost records..."
                                    value={costSearch}
                                    onChange={(e) => handleCostSearch(e.target.value)}
                                    className="pl-8 w-64"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
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
                            {analysis.map((r) => {
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
                                                <button
                                                    onClick={() => openEdit(r)}
                                                    className="text-blue-600"
                                                >
                                                    Edit
                                                </button>
                                            )}

                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(r._id)}
                                                    className="text-red-600"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>

                    </Table>

                    {/* Pagination for Cost Records */}
                    {costsPagination && (
                        <Pagination
                            currentPage={costsPagination.currentPage}
                            totalPages={costsPagination.totalPages}
                            totalItems={costsPagination.totalItems}
                            itemsPerPage={costsPagination.itemsPerPage}
                            onPageChange={handleCostPageChange}
                            onItemsPerPageChange={handleCostItemsPerPageChange}
                        />
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
