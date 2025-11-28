"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { fetchActivityCost } from "@/redux/slices/activityCostSlice";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";
// import { saveAs } from "file-saver";
// import * as XLSX from "xlsx";

type Props = {
    selectedProjectId: string | null | undefined;
};

export default function ActivityCostSheet({ selectedProjectId }: Props) {
    const dispatch = useDispatch<AppDispatch>();
    const { activities, totals, loading, error } = useSelector((s: RootState) => s.activityCost);

    useEffect(() => {
        if (selectedProjectId) dispatch(fetchActivityCost(selectedProjectId));
    }, [selectedProjectId, dispatch]);

    const barData = useMemo(() => activities.map((a) => ({ name: a.activity, planned: a.planned, actual: a.actual })), [activities]);
    const pieData = useMemo(() => activities.filter(a => Math.abs(a.variance) > 0).map((a) => ({ name: a.activity, value: Math.abs(a.variance) })), [activities]);

    const exportExcel = () => {
        // Implementation for XLSX export would go here
        console.log("Exporting to Excel...");
    };

    const exportCSV = () => {
        const rows = activities.map((a) => ({
            Activity: a.activity,
            Planned: a.planned,
            Actual: a.actual,
            Variance: a.variance,
            "Variance %": a.variancePct.toFixed(2),
        }));
        if (!rows.length) return;
        const header = Object.keys(rows[0]).join(",") + "\n";
        const body = rows.map((r) => Object.values(r).join(",")).join("\n");
        const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `activity-cost-${selectedProjectId || "all"}.csv`;
        link.click();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Activity-wise Cost Sheet</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Compare planned budget vs. actual resource consumption per WBS activity.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportCSV} disabled={!activities.length}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV
                    </Button>
                    <Button onClick={exportExcel} disabled={!activities.length}>
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                    </Button>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin mb-2" />
                    <p>Analyzing cost data...</p>
                </div>
            )}

            {!loading && error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-2 p-6 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </CardContent>
                </Card>
            )}

            {!loading && !error && !activities.length && (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center text-muted-foreground">
                        No activity or budget data found for this project.
                    </CardContent>
                </Card>
            )}

            {!loading && !!activities.length && (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="shadow-sm border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Planned</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹ {Math.round(totals.planned).toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Based on Budget entries</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-l-4 border-l-purple-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Actual</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹ {Math.round(totals.actual).toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Based on Resource usage</p>
                            </CardContent>
                        </Card>

                        <Card className={`shadow-sm border-l-4 ${totals.variance > 0 ? "border-l-red-500" : "border-l-green-500"}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Net Variance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`flex items-center gap-2 text-2xl font-bold ${totals.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                                    ₹ {Math.abs(Math.round(totals.variance)).toLocaleString()}
                                    {totals.variance > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {totals.variance > 0 ? "Over Budget" : "Under Budget"} ({Math.abs(totals.variancePct).toFixed(1)}%)
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="h-[400px]">
                            <CardHeader>
                                <CardTitle>Planned vs Actual by Activity</CardTitle>
                                <CardDescription>Direct cost comparison per WBS item</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            formatter={(v: any) => [`₹ ${Math.round(v).toLocaleString()}`, ""]}
                                            contentStyle={{ borderRadius: '8px' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="planned" name="Planned" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                        <Bar dataKey="actual" name="Actual" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="h-[400px]">
                            <CardHeader>
                                <CardTitle>Variance Contributors</CardTitle>
                                <CardDescription>Activities with highest deviation</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                                return percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '';
                                            }}
                                        >
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={["#ef4444", "#f97316", "#eab308", "#10b981", "#06b6d4", "#6366f1", "#8b5cf6"][i % 7]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => `₹${Math.round(v).toLocaleString()}`} />
                                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Heatmap */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Variance Heatmap</CardTitle>
                            <CardDescription>
                                Green indicates savings, Red indicates overruns. Intensity indicates magnitude.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {activities.map((a) => {
                                    // Calculate intensity based on percentage, capped at 100%
                                    const percentage = Math.abs(a.variancePct);
                                    // Scale opacity: minimum 0.5, max 1.0 based on deviation size
                                    const opacity = Math.min(0.5 + (percentage / 100), 1);
                                    
                                    const isOverBudget = a.variance > 0;
                                    const bgColor = isOverBudget 
                                        ? `rgba(220, 38, 38, ${opacity})` // Red
                                        : `rgba(22, 163, 74, ${opacity})`; // Green

                                    return (
                                        <div
                                            key={a.key}
                                            className="rounded-lg p-3 text-white shadow transition-transform hover:scale-105"
                                            style={{ backgroundColor: bgColor }}
                                        >
                                            <div className="truncate font-medium text-sm" title={a.activity}>{a.activity}</div>
                                            <div className="mt-1 text-lg font-bold">₹ {Math.abs(Math.round(a.variance)).toLocaleString()}</div>
                                            <div className="text-xs opacity-90 flex justify-between">
                                                <span>{a.variancePct.toFixed(1)}%</span>
                                                <span>{isOverBudget ? "Over" : "Under"}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Cost Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[300px]">Activity Name</TableHead>
                                            <TableHead className="text-right">Planned Budget</TableHead>
                                            <TableHead className="text-right">Actual Cost</TableHead>
                                            <TableHead className="text-right">Variance</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activities.map((a) => (
                                            <TableRow key={a.key}>
                                                <TableCell className="font-medium">{a.activity}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    ₹ {Math.round(a.planned).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ₹ {Math.round(a.actual).toLocaleString()}
                                                </TableCell>
                                                <TableCell className={`text-right font-bold ${a.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                                                    {a.variance > 0 ? "+" : ""}₹ {Math.round(a.variance).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={a.variance > 0 ? "destructive" : "default"} className={a.variance <= 0 ? "bg-green-600 hover:bg-green-700" : ""}>
                                                        {a.variance > 0 ? "Over Budget" : "On Track"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}