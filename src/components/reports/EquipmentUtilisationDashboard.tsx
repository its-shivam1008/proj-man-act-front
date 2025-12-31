"use client";

import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import {
    ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell,
    CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { ShieldAlert, Wrench, Search, MapPin } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchEquipments, setPage, setLimit, setSearch } from "@/redux/slices/equipmentSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
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

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

interface EquipmentUtilisationDashboardProps {
    locationFilter?: string;
}

export default function EquipmentUtilisationDashboard({ locationFilter = "all" }: EquipmentUtilisationDashboardProps) {
    const dispatch = useDispatch<AppDispatch>();
    const canView = usePermission("productionReportingAnalytics", "view");
    const [searchInput, setSearchInput] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { equipments, loading, total, page, limit, search } = useSelector(
        (state: RootState) => state.equipment
    );

    // ✅ LOCATION FILTERING STATE
    const { userProfile } = useSelector((state: RootState) => state.auth);
    const { locations } = useSelector((state: RootState) => state.masterData);

    const isLocationRestricted = 
        userProfile?.role !== 'admin' && 
        !!userProfile?.location;

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(setSearch(searchInput));
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput, dispatch]);

    // Fetch equipments when pagination or search changes
    useEffect(() => {
        dispatch(fetchEquipments({ 
            page, 
            limit: itemsPerPage, 
            search: search || undefined,
            location: locationFilter !== "all" ? locationFilter : undefined
        }));
    }, [dispatch, page, itemsPerPage, search, locationFilter]);

    // Fetch master data for locations
    useEffect(() => {
        dispatch(fetchMasterData("location"));
    }, [dispatch]);

    // Handle pagination
    const handlePageChange = useCallback((newPage: number) => {
        dispatch(setPage(newPage));
    }, [dispatch]);

    const handleItemsPerPageChange = useCallback((newLimit: string) => {
        const limitNum = parseInt(newLimit);
        setItemsPerPage(limitNum);
        dispatch(setLimit(limitNum));
        dispatch(setPage(1)); // Reset to first page
    }, [dispatch]);

    const totalPages = Math.ceil(total / itemsPerPage);

    // Helper to get location name
    const getLocationName = (locData: string | { _id: string; name: string } | undefined) => {
        if (!locData) return "No Location";
        if (typeof locData === 'object' && locData.name) return locData.name;
        const found = locations.find((l: any) => l._id === locData);
        return found ? found.name : "Unknown Location";
    };

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

    const byLocation = useMemo(() => {
        const map: any = {};
        equipments.forEach((e: any) => {
            const key = getLocationName(e.location) || "No Location";
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [equipments, locations]);

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
            <div className="grid md:grid-cols-3 gap-4">
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

                <Card>
                    <CardHeader><CardTitle>Equipment by Location</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byLocation}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#22c55e" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* TABLE */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Equipment Utilisation Details</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search equipment..."
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
                            <p className="mt-2 text-sm text-gray-500">Loading equipment...</p>
                        </div>
                    ) : equipments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                {search ? `No equipment found matching "${search}"` : "No equipment available"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Utilization</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {equipments.map((e: any) => {
                                        return (
                                            <TableRow key={e._id}>
                                                <TableCell className="font-medium">{e.code}</TableCell>
                                                <TableCell>{e.name}</TableCell>
                                                <TableCell>{e.category || "-"}</TableCell>
                                                <TableCell>{e.department || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                        <MapPin className="w-3 h-3" />
                                                        {getLocationName(e.location)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {usedEquipmentIds.has(e._id) ? (
                                                        <Badge variant="default" className="bg-green-600">Assigned</Badge>
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

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, total)} of {total} entries
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(page - 1)}
                                            disabled={page <= 1}
                                        >
                                            Previous
                                        </Button>
                                        
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (page >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = page - 2 + i;
                                                }
                                                
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={page === pageNum ? "default" : "outline"}
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
                                            onClick={() => handlePageChange(page + 1)}
                                            disabled={page >= totalPages}
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
