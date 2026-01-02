"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermission } from "@/hooks/userPermission";
import { BASE_URL } from "@/utils/constants";

import {
    Trash2,
    Save,
    Edit2,
    DownloadCloud,
    Archive,
    MousePointerClick,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

/* -------------------------
   Types
--------------------------*/
type ActionType = "Transfer" | "Disposal";

interface AssetDisposalRecord {
    _id: string;
    organisationId: string;
    assetId: string;
    assetName?: string;
    action: ActionType;
    date: string;
    fromLocation: { _id: string; name: string } | string;
    toLocation?: { _id: string; name: string } | string;
    disposalMethod?: string;
    scrapValue: number;
    resaleValue: number;
    financialReference?: string;
    reason?: string;
    archiveImmediately: boolean;
    isDeleted: boolean;
    totalValue?: number;
    createdAt: string;
    updatedAt: string;
}

interface AssetDisposalForm {
    assetId: string;
    assetName?: string;
    action: ActionType;
    date: string;
    fromLocation: string;
    toLocation?: string;
    disposalMethod?: string;
    scrapValue: number;
    resaleValue: number;
    financialReference?: string;
    reason?: string;
    archiveImmediately: boolean;
}

/* -------------------------
   Component
--------------------------*/
export default function AssetDisposalTransferPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { userProfile } = useSelector((state: RootState) => state.auth);
    const { locations } = useSelector((state: RootState) => state.masterData);
    
    const canView = usePermission('assetsDisposalTransfer', 'view');
    const canCreate = usePermission('assetsDisposalTransfer', 'create');
    const canEdit = usePermission('assetsDisposalTransfer', 'edit');
    const canDelete = usePermission('assetsDisposalTransfer', 'delete');

    // State
    const [records, setRecords] = useState<AssetDisposalRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit] = useState(10);

    const debouncedSearch = useDebounce(query, 500);
    const organisationId = localStorage.getItem('organisationId');

    const isLocationRestricted = 
        userProfile?.role !== 'admin' && 
        !!userProfile?.location;

    // Dialog/form state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<AssetDisposalRecord | null>(null);
    const [form, setForm] = useState<AssetDisposalForm>({
        assetId: "",
        action: "Transfer",
        date: new Date().toISOString().slice(0, 10),
        fromLocation: isLocationRestricted ? userProfile?.location || "" : "",
        scrapValue: 0,
        resaleValue: 0,
        archiveImmediately: false,
    });

    /* -------------------------
       Load data and locations
    --------------------------*/
    useEffect(() => {
        dispatch(fetchMasterData("location"));
    }, [dispatch]);

    useEffect(() => {
        if (isLocationRestricted && userProfile?.location) {
            setLocationFilter(userProfile.location);
        }
    }, [isLocationRestricted, userProfile]);

    useEffect(() => {
        if (organisationId) {
            fetchRecords();
        }
    }, [organisationId, page, limit, actionFilter, debouncedSearch, locationFilter]);

    /* -------------------------
       API Functions
    --------------------------*/
    const fetchRecords = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                organisationId: organisationId!,
                page: page.toString(),
                limit: limit.toString(),
                search: debouncedSearch,
                location: locationFilter,
                action: actionFilter,
            });

            const response = await fetch(`${BASE_URL}/asset-disposal-transfer?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                setRecords(data.data);
                setTotalPages(data.pagination.pages);
                setTotalRecords(data.pagination.total);
            } else {
                toast.error(data.message || "Failed to fetch records");
            }
        } catch (error) {
            console.error("Error fetching records:", error);
            toast.error("Failed to fetch records");
        } finally {
            setLoading(false);
        }
    };

    const handleLocationFilterChange = (val: string) => {
        setLocationFilter(val);
        setPage(1);
    };

    const handleActionFilterChange = (val: string) => {
        setActionFilter(val);
        setPage(1);
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(page + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setPage(1);
    };

    /* -------------------------
       CRUD Functions
    --------------------------*/
    function openAdd() {
        setEditing(null);
        setForm({
            assetId: "",
            action: "Transfer",
            date: new Date().toISOString().slice(0, 10),
            fromLocation: isLocationRestricted ? userProfile?.location || "" : "",
            scrapValue: 0,
            resaleValue: 0,
            archiveImmediately: false,
        });
        setIsDialogOpen(true);
    }

    function openEdit(rec: AssetDisposalRecord) {
        setEditing(rec);
        setForm({
            assetId: rec.assetId,
            assetName: rec.assetName,
            action: rec.action,
            date: rec.date,
            fromLocation: typeof rec.fromLocation === 'string' ? rec.fromLocation : rec.fromLocation._id,
            toLocation: rec.toLocation ? (typeof rec.toLocation === 'string' ? rec.toLocation : rec.toLocation._id) : undefined,
            disposalMethod: rec.disposalMethod,
            scrapValue: rec.scrapValue,
            resaleValue: rec.resaleValue,
            financialReference: rec.financialReference,
            reason: rec.reason,
            archiveImmediately: rec.archiveImmediately,
        });
        setIsDialogOpen(true);
    }

    const saveForm = async () => {
        if (!form.assetId || !form.action || !form.date || !form.fromLocation) {
            toast.error("Asset ID, action, date and from location are required");
            return;
        }

        if (form.action === "Transfer" && !form.toLocation) {
            toast.error("To location is required for transfer");
            return;
        }

        if (form.action === "Disposal" && !form.disposalMethod) {
            toast.error("Disposal method is required for disposal");
            return;
        }

        try {
            const payload = {
                ...form,
                organisationId,
            };

            const url = editing 
                ? `${BASE_URL}/asset-disposal-transfer/${editing._id}` 
                : `${BASE_URL}/asset-disposal-transfer/create`;
            
            const method = editing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(editing ? "Record updated successfully" : "Record created successfully");
                setIsDialogOpen(false);
                fetchRecords();
            } else {
                toast.error(data.message || "Failed to save record");
            }
        } catch (error: any) {
            console.error("Error saving record:", error);
            toast.error("Failed to save record");
        }
    };

    const deleteRecord = async (id: string) => {
        if (!confirm("Delete this record?")) return;

        try {
            const response = await fetch(`${BASE_URL}/asset-disposal-transfer/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Record deleted successfully");
                fetchRecords();
            } else {
                toast.error(data.message || "Failed to delete record");
            }
        } catch (error: any) {
            console.error("Error deleting record:", error);
            toast.error("Failed to delete record");
        }
    };

    /* -------------------------
       Import / Export (simplified)
    --------------------------*/
    function exportAll() {
        const payload = { records, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `asset_disposal_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Exported");
    }

    /* -------------------------
       Derived data
    --------------------------*/
    const disposalCounts = useMemo(() => {
        const map: Record<string, number> = {};
        records.forEach((r) => {
            const key = r.action;
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([action, count]) => ({ action, count }));
    }, [records]);

    const pieData = disposalCounts.map((d) => ({ name: d.action, value: d.count }));
    const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"];

    /* -------------------------
       Render
    --------------------------*/
    if (!canView) {
        return <div className="p-6">You don't have permission to view this page.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Archive className="h-6 w-6" /> Asset Disposal & Transfer
                </h1>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportAll}>
                        <DownloadCloud className="mr-2 h-4 w-4" />Export
                    </Button>
                    {canCreate && (
                        <Button onClick={openAdd}>
                            <MousePointerClick className="mr-2 h-4 w-4" />New
                        </Button>
                    )}
                </div>
            </div>

            {/* KPIs and pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>Total Records</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{totalRecords}</div></CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Actions Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-56">
                        {pieData.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No data</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <Input 
                    placeholder="Search asset, location, reference..." 
                    value={query} 
                    onChange={handleSearchChange}
                    className="w-full md:w-64"
                />
                
                <Select 
                    disabled={isLocationRestricted} 
                    value={locationFilter} 
                    onValueChange={handleLocationFilterChange}
                >
                    <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter Location" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map((loc) => (
                            <SelectItem key={loc._id} value={loc._id}>
                                {loc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={actionFilter} onValueChange={handleActionFilterChange}>
                    <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                        <SelectItem value="Disposal">Disposal</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardHeader><CardTitle>Records ({totalRecords})</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>From Location</TableHead>
                                    <TableHead>To Location / Method</TableHead>
                                    <TableHead>Value (₹)</TableHead>
                                    <TableHead>Financial Ref</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-4">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : records.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-4">
                                            No records found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    records.map((r) => (
                                        <TableRow key={r._id}>
                                            <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{r.assetId}</div>
                                                    {r.assetName && (
                                                        <div className="text-sm text-muted-foreground">{r.assetName}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    r.action === "Transfer" 
                                                        ? "bg-blue-100 text-blue-800" 
                                                        : "bg-red-100 text-red-800"
                                                }`}>
                                                    {r.action}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {typeof r.fromLocation === 'string' 
                                                    ? r.fromLocation 
                                                    : r.fromLocation?.name}
                                            </TableCell>
                                            <TableCell>
                                                {r.action === "Transfer" 
                                                    ? (typeof r.toLocation === 'string' 
                                                        ? r.toLocation 
                                                        : r.toLocation?.name)
                                                    : r.disposalMethod}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {r.scrapValue > 0 && <div>Scrap: ₹{r.scrapValue}</div>}
                                                    {r.resaleValue > 0 && <div>Resale: ₹{r.resaleValue}</div>}
                                                    {r.scrapValue === 0 && r.resaleValue === 0 && <div>-</div>}
                                                </div>
                                            </TableCell>
                                            <TableCell>{r.financialReference || "-"}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {canEdit && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            onClick={() => openEdit(r)}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            onClick={() => deleteRecord(r._id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 p-4 border-t">
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages} (Total: {totalRecords})
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={page === 1}
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={page === totalPages}
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Edit Asset Action" : "New Asset Transfer / Disposal"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Asset ID / Code *</Label>
                            <Input 
                                value={form.assetId} 
                                onChange={(e) => setForm({...form, assetId: e.target.value})} 
                                placeholder="Enter asset ID"
                            />
                        </div>

                        <div>
                            <Label>Asset Name (optional)</Label>
                            <Input 
                                value={form.assetName || ""} 
                                onChange={(e) => setForm({...form, assetName: e.target.value})} 
                                placeholder="Enter asset name"
                            />
                        </div>

                        <div>
                            <Label>Action *</Label>
                            <Select 
                                value={form.action} 
                                onValueChange={(val: ActionType) => setForm({...form, action: val, toLocation: val === "Disposal" ? undefined : form.toLocation})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Transfer">Transfer</SelectItem>
                                    <SelectItem value="Disposal">Disposal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Date *</Label>
                            <Input 
                                type="date" 
                                value={form.date} 
                                onChange={(e) => setForm({...form, date: e.target.value})} 
                            />
                        </div>

                        <div>
                            <Label>From Location *</Label>
                            <Select 
                                value={form.fromLocation} 
                                onValueChange={(val) => setForm({...form, fromLocation: val})}
                                disabled={isLocationRestricted}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select from location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc._id} value={loc._id}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {form.action === "Transfer" && (
                            <div>
                                <Label>To Location *</Label>
                                <Select 
                                    value={form.toLocation || ""} 
                                    onValueChange={(val) => setForm({...form, toLocation: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select to location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations
                                            .filter(loc => loc._id !== form.fromLocation)
                                            .map((loc) => (
                                                <SelectItem key={loc._id} value={loc._id}>
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {form.action === "Disposal" && (
                            <div>
                                <Label>Disposal Method *</Label>
                                <Select 
                                    value={form.disposalMethod || ""} 
                                    onValueChange={(val) => setForm({...form, disposalMethod: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select disposal method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Scrap">Scrap</SelectItem>
                                        <SelectItem value="Resale">Resale</SelectItem>
                                        <SelectItem value="Donation">Donation</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div>
                            <Label>Scrap Value (₹)</Label>
                            <Input 
                                type="number" 
                                value={form.scrapValue} 
                                onChange={(e) => setForm({...form, scrapValue: Number(e.target.value)})} 
                                min="0"
                            />
                        </div>

                        <div>
                            <Label>Resale Value (₹)</Label>
                            <Input 
                                type="number" 
                                value={form.resaleValue} 
                                onChange={(e) => setForm({...form, resaleValue: Number(e.target.value)})} 
                                min="0"
                            />
                        </div>

                        <div>
                            <Label>Financial Reference</Label>
                            <Input 
                                value={form.financialReference || ""} 
                                onChange={(e) => setForm({...form, financialReference: e.target.value})} 
                                placeholder="Enter financial reference"
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>Reason / Notes</Label>
                            <Input 
                                value={form.reason || ""} 
                                onChange={(e) => setForm({...form, reason: e.target.value})} 
                                placeholder="Enter reason or notes"
                            />
                        </div>

                        <div className="col-span-2 flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={form.archiveImmediately} 
                                    onChange={(e) => setForm({...form, archiveImmediately: e.target.checked})} 
                                />
                                Archive record immediately
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveForm}>
                            <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
