"use client";

import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useMemo } from "react";
import {
    Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import {
    ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell,
    CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { ShieldAlert, Wrench } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchEquipments } from "@/redux/slices/equipmentSlice";
import {
    Table, TableHeader, TableRow,
    TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

export default function EquipmentUtilisationDashboard() {
    const dispatch = useDispatch<AppDispatch>();
    const canView = usePermission("equipmentUtilisation", "view");

    const { equipments, loading } = useSelector(
        (state: RootState) => state.equipment
    );

    useEffect(() => {
        dispatch(fetchEquipments({ page: 1, limit: 1000 }));
    }, [dispatch]);

    if (!canView) {
        return (
            <div className="text-center py-12">
                <ShieldAlert className="w-14 h-14 text-red-500 mx-auto mb-3" />
                <h3 className="text-xl font-semibold">Access Denied</h3>
                <p className="text-muted-foreground">
                    You do not have permission to view this dashboard.
                </p>
            </div>
        );
    }

    /* ================= DERIVED DATA ================= */

    const utilisedEquipments = equipments.filter(
        (e: any) => e.department || e.location
    );
    const { list: workCenters } = useSelector(
        (state: RootState) => state.workCenters
    );

    const usedEquipmentIds = useMemo(() => {
        const set = new Set<string>();

        workCenters.forEach((wc: any) => {
            wc.resources?.forEach((r: any) => {
                if (r.resourceType === "equipment" && r.equipmentId) {
                    set.add(r.equipmentId.toString());
                }
            });
        });

        return set;
    }, [workCenters]);

    const idleEquipments = equipments.length - utilisedEquipments.length;

    const utilisationPct =
        equipments.length > 0
            ? ((utilisedEquipments.length / equipments.length) * 100).toFixed(2)
            : "0";

    const byCategory = useMemo(() => {
        const map: any = {};
        equipments.forEach((e: any) => {
            const key = e.category || "Uncategorized";
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [equipments]);

    const byDepartment = useMemo(() => {
        const map: any = {};
        equipments.forEach((e: any) => {
            const key = e.department || "Unassigned";
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [equipments]);

    /* ================= UI ================= */

    return (
        <div className="space-y-6">

            <div>
                <h2 className="text-2xl font-bold">Equipment Utilisation Dashboard</h2>
                <p className="text-muted-foreground">
                    Asset usage, idle analysis & capacity planning
                </p>
            </div>

            {/* KPI CARDS */}
            <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>Total Equipment</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {equipments.length}
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-green-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-green-600" />
                            Utilised
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {utilisedEquipments.length}
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-orange-500">
                    <CardHeader><CardTitle>Idle Equipment</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {idleEquipments}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Utilisation %</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {utilisationPct} %
                    </CardContent>
                </Card>
            </div>

            {/* CHARTS */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>Equipment by Category</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={byCategory} dataKey="value" nameKey="name" label>
                                    {byCategory.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Equipment by Department</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byDepartment}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* TABLE */}
            <Card>
                <CardHeader>
                    <CardTitle>Equipment Utilisation Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Age (yrs)</TableHead>
                                {/* <TableHead>Status</TableHead> */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {equipments.map((e: any) => {
                                const age =
                                    e.purchaseDate
                                        ? (
                                            (Date.now() - new Date(e.purchaseDate).getTime()) /
                                            (1000 * 60 * 60 * 24 * 365)
                                        ).toFixed(1)
                                        : "-";

                                return (
                                    <TableRow key={e._id}>
                                        <TableCell>{e.code}</TableCell>
                                        <TableCell>{e.name}</TableCell>
                                        <TableCell>{e.category || "-"}</TableCell>
                                        <TableCell>
                                            {usedEquipmentIds.has(e._id) ? (
                                                <Badge variant="success">Assigned</Badge>
                                            ) : (
                                                <Badge variant="secondary">Unassigned</Badge>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {usedEquipmentIds.has(e._id) ? (
                                                <Badge className="bg-blue-600">Active</Badge>
                                            ) : (
                                                <Badge variant="outline">Idle</Badge>
                                            )}
                                        </TableCell>

                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
