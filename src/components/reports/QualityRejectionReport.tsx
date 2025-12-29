"use client";

import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useMemo } from "react";
import {
    Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import { fetchProducts } from "@/redux/slices/productSlice";

import {
    ResponsiveContainer,
    BarChart, Bar,
    LineChart, Line,
    CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { ShieldAlert, XCircle } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchInspections } from "@/redux/slices/production/qualitySlice";
import {
    Table, TableHeader, TableRow,
    TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function QualityRejectionReport() {

    const { products } = useSelector((state: RootState) => state.products);
    const dispatch = useDispatch<AppDispatch>();
    const canView = usePermission("qualityRejectionReport", "view");

    const { inspections, loading } = useSelector(
        (state: RootState) => state.quality
    );

    useEffect(() => {
        dispatch(fetchInspections());
        dispatch(fetchProducts({ page: 1, limit: 1000 }));
    }, [dispatch]);
    const productMap = useMemo(() => {
        const map: Record<string, string> = {};
        products.forEach((p: any) => {
            map[p._id] = p.name;
        });
        return map;
    }, [products]);

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

    const totalInspections = inspections.length;
    const rejected = inspections.filter(i => i.result === "Fail");
    const rejectionRate =
        totalInspections > 0
            ? ((rejected.length / totalInspections) * 100).toFixed(2)
            : "0";

    const byProduct = useMemo(() => {
        const map: any = {};
        rejected.forEach(r => {
            const key = r.productId || "Unknown";
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([product, count]) => ({
            product,
            count,
        }));
    }, [rejected]);

    const byInspector = useMemo(() => {
        const map: any = {};
        rejected.forEach(r => {
            const key = r.inspector || "Unknown";
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([inspector, count]) => ({
            inspector,
            count,
        }));
    }, [rejected]);

    const dailyTrend = useMemo(() => {
        const map: any = {};
        rejected.forEach(r => {
            const day = new Date(r.createdAt).toISOString().slice(0, 10);
            map[day] = (map[day] || 0) + 1;
        });
        return Object.entries(map).map(([date, count]) => ({
            date,
            count,
        }));
    }, [rejected]);

    /* ================= UI ================= */

    return (
        <div className="space-y-6">

            <div>
                <h2 className="text-2xl font-bold">Quality Rejection Report</h2>
                <p className="text-muted-foreground">
                    Defect analysis, inspector performance & rejection trends
                </p>
            </div>

            {/* KPI CARDS */}
            <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>Total Inspections</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {totalInspections}
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-red-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            Total Rejected
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {rejected.length}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Rejection Rate</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {rejectionRate} %
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Top Rejected Product</CardTitle></CardHeader>
                    <CardContent className="text-sm font-semibold">
                        {byProduct[0]?.product || "N/A"}
                    </CardContent>
                </Card>
            </div>

            {/* CHARTS */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Rejections by Product</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byProduct}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="product" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#dc2626" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Rejections by Inspector</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byInspector}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="inspector" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#f97316" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* TREND */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Rejection Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line dataKey="count" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* TABLE */}
            <Card>
                <CardHeader>
                    <CardTitle>Inspection Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                {/* <TableHead>Product</TableHead> */}
                                {/* <TableHead>Batch</TableHead> */}
                                <TableHead>Inspector</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inspections.map((i: any) => (
                                <TableRow key={i._id}>
                                    <TableCell>
                                        {new Date(i.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    {/* <TableCell> {productMap[i.productId] || "-"} </TableCell> */}
                                    {/* <TableCell>{i.batchNo || "-"}</TableCell> */}
                                    <TableCell>{i.inspector || "-"}</TableCell>
                                    <TableCell>
                                        {i.result === "Fail" ? (
                                            <Badge variant="destructive">Fail</Badge>
                                        ) : (
                                            <Badge variant="success">Pass</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{i.remarks || "-"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
