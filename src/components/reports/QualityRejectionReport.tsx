import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
    Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    ResponsiveContainer,
    BarChart, Bar,
    LineChart, Line,
    CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { ShieldAlert, XCircle, MapPin, Search } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchInspections } from "@/redux/slices/production/qualitySlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import {
    Table, TableHeader, TableRow,
    TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

// Debounce utility function
const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

interface QualityRejectionReportProps {
    locationFilter?: string;
}

export default function QualityRejectionReport({ locationFilter = "all" }: QualityRejectionReportProps) {

    const dispatch = useDispatch<AppDispatch>();
    const canView = usePermission("productionReportingAnalytics", "view");

    const { inspections, inspectionsPagination } = useSelector(
        (state: RootState) => state.quality
    );

    const { locations } = useSelector((state: RootState) => state.masterData);

    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Debounced search handler
    const debouncedSearch = useCallback(
        debounce((searchValue: string) => {
            dispatch(fetchInspections({
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
        setSearchTerm(value);
        debouncedSearch(value);
    };

    // Pagination handlers
    const handlePageChange = (newPage: number) => {
        dispatch(fetchInspections({
            location: locationFilter !== "all" ? locationFilter : undefined,
            page: newPage,
            limit: itemsPerPage,
            search: searchTerm
        }));
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        dispatch(fetchInspections({
            location: locationFilter !== "all" ? locationFilter : undefined,
            page: 1,
            limit: newItemsPerPage,
            search: searchTerm
        }));
    };

    // ✅ FETCH INSPECTIONS WITH LOCATION FILTER AND MASTER DATA
    useEffect(() => {
        dispatch(fetchInspections({ 
            location: locationFilter !== "all" ? locationFilter : undefined,
            page: 1, 
            limit: itemsPerPage,
            search: searchTerm
        }));
        dispatch(fetchMasterData("location"));
    }, [dispatch, locationFilter]);

    // ✅ HELPER TO GET LOCATION NAME
    const getLocationName = (locationId: string) => {
        if (!locationId) return "No Location";
        const location = locations.find((loc: any) => loc._id === locationId);
        return location ? location.name : locationId;
    };

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
    const rejected = inspections.filter((i: any) => i.result === "Fail");
    const rejectionRate =
        totalInspections > 0
            ? ((rejected.length / totalInspections) * 100).toFixed(2)
            : "0";

    const byProduct = useMemo(() => {
        const map: any = {};
        rejected.forEach((r: any) => {
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
        rejected.forEach((r: any) => {
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
        rejected.forEach((r: any) => {
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
                    {locationFilter !== "all" && " (Filtered by location)"}
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
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Inspection Details</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Showing {Math.min((inspectionsPagination.currentPage - 1) * inspectionsPagination.itemsPerPage + 1, inspectionsPagination.totalItems)} to {Math.min(inspectionsPagination.currentPage * inspectionsPagination.itemsPerPage, inspectionsPagination.totalItems)} of {inspectionsPagination.totalItems} inspections
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search inspections..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10 w-64"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {inspections.length === 0 ? (
                        <div className="text-center py-8">
                            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            {searchTerm ? (
                                <>
                                    <p className="text-gray-500">No inspections found matching "{searchTerm}"</p>
                                    <p className="text-sm text-gray-400">Try adjusting your search terms</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-500">No inspections found</p>
                                    <p className="text-sm text-gray-400">No quality inspection data available</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Location</TableHead>
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
                                            <TableCell>
                                                <Badge variant="outline" className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {getLocationName(i.location)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{i.inspector || "-"}</TableCell>
                                            <TableCell>
                                                {i.result === "Fail" ? (
                                                    <Badge variant="destructive">Fail</Badge>
                                                ) : i.result === "Pass" ? (
                                                    <Badge variant="outline">Pass</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Unknown</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{i.remarks || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            
                            {/* Pagination */}
                            <Pagination
                                currentPage={inspectionsPagination.currentPage}
                                totalPages={inspectionsPagination.totalPages}
                                totalItems={inspectionsPagination.totalItems}
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

        </div>
    );
}
