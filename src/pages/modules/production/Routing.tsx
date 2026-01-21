import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import {
    createRouting,
    fetchRoutings,
    updateRouting,
    deleteRouting,
    clearSelectedRouting,
    fetchRoutingById
} from "@/redux/slices/production/routingSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { fetchWorkCenters } from "@/redux/slices/production/workCenterSlice";
import { fetchBOMs } from "@/redux/slices/production/bomSlice";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Icons
import { Plus, Pencil, Trash2, X, Save, FileText, AlertCircle } from "lucide-react";

/* ================= TYPES ================= */

interface Operation {
    id: number | string;
    seq: number;
    name: string;
    workCenter: string;
    setupTime: number;
    runTime: number;
    inspection: boolean;
    location: string;
}

/* ================= HELPER COMPONENTS ================= */

// 🏷️ CUSTOM TAG INPUT COMPONENT
// Handles "one word at a time" input behavior
function TagInput({
    value = [],
    onChange,
    placeholder = "Type and press Enter...",
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const word = inputValue.trim().replace(/\s+/g, ''); // Removes all internal spaces
            if (word && !value.includes(word)) {
                onChange([...value, word]);
                setInputValue("");
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 mb-1">
                {value.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1 text-sm flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
            />
            <p className="text-[10px] text-muted-foreground">Press Enter or Space to add a tag.</p>
        </div>
    );
}

/* ================= MAIN COMPONENT ================= */

export default function RoutingMaster() {


    const [editRoutingId, setEditRoutingId] = useState<string | null>(null);
    const [deleteRoutingId, setDeleteRoutingId] = useState<string | null>(null);

    const dispatch = useDispatch<AppDispatch>();

    // ✅ Redux Selectors (Fixed)
    const { list: boms = [] } = useSelector((state: RootState) => state.bom);
    const { list: workCenters = [] } = useSelector((state: RootState) => state.workCenters);
    const { locations = [] } = useSelector((state: RootState) => state.masterData);

    // ✅ FIX: Correctly destructure 'routings' (was 'list' in previous code)
    const { routings = [], status, pagination } = useSelector(
        (state: RootState) => state.routing
    );

    const handleSaveDraft = async () => {
        if (!routingForm.routingName) {
            alert("Routing Name is required to save draft");
            return;
        }

        const payload = {
            ...routingForm,
            organisationId,
            status: "DRAFT" as const,
            operations: operations.map(({ id, ...op }) => op),
        };

        try {
            if (editRoutingId) {
                await dispatch(
                    updateRouting({ id: editRoutingId, data: payload })
                ).unwrap();
                alert("Draft updated successfully");
            } else {
                await dispatch(createRouting(payload)).unwrap();
                alert("Draft saved successfully");
            }

            setEditRoutingId(null);
            setOperations([]);
            setRoutingForm({
                routingName: "",
                product: "",
                bomId: "",
                plant: "",
                shop: "",
                line: "",
                description: "",
                tags: [],
            });

            dispatch(fetchRoutings({ page: 1, limit: 10, organisationId }));
        } catch (err) {
            alert(err);
        }
    };

    const currentPage = pagination?.page ?? 1;
    const totalPages = pagination?.totalPages ?? 1;
    const limit = pagination?.limit ?? 10;
    const organisationId = localStorage.getItem("organisationId");
    const handlePageChange = (page: number) => {
        if (!organisationId) return;
        if (page < 1 || page > totalPages) return;

        dispatch(fetchRoutings({ page, limit, organisationId }));
    };




    /* ================= LOCAL STATE ================= */

    const [operations, setOperations] = useState<Operation[]>([]);
    const [openSheet, setOpenSheet] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedOp, setSelectedOp] = useState<Operation | null>(null);

    // Added 'tags' to form state
    const [routingForm, setRoutingForm] = useState({
        routingName: "",
        product: "",
        bomId: "",
        plant: "",
        shop: "",
        line: "",
        description: "",
        tags: [] as string[], // New Tags Field
    });

    /* ================= EFFECTS ================= */

    useEffect(() => {
        if (organisationId) {
            dispatch(fetchRoutings({ page: 1, limit: 10, organisationId }));
            dispatch(fetchBOMs({ organisationId }));
            dispatch(fetchWorkCenters());
            dispatch(fetchMasterData("location"));
        }
    }, [dispatch, organisationId]);

    /* ================= CALCULATIONS ================= */

    const totalSetup = operations.reduce((sum, op) => sum + (op.setupTime || 0), 0);
    const totalRun = operations.reduce((sum, op) => sum + (op.runTime || 0), 0);
    const bottleneck = operations.length > 0
        ? operations.reduce((prev, curr) => (prev.runTime > curr.runTime ? prev : curr)).name
        : "-";

    /* ================= HANDLERS ================= */

    // --- Operation Handlers ---
    const openAddOperation = () => {
        const lastSeq = operations.length > 0 ? Math.max(...operations.map((o) => o.seq)) : 0;
        setSelectedOp({
            id: `temp_${Date.now()}`,
            seq: lastSeq + 10,
            name: "",
            workCenter: "",
            setupTime: 0,
            runTime: 0,
            inspection: false,
            location: "",
        });
        setOpenSheet(true);
    };

    const openEditOperation = (op: Operation) => {
        setSelectedOp({ ...op });
        setOpenSheet(true);
    };

    const saveOperation = () => {
        if (!selectedOp) return;

        // Check duplicate sequence
        const duplicateSeq = operations.find(
            (o) => o.seq === selectedOp.seq && o.id !== selectedOp.id
        );

        if (duplicateSeq) {
            alert("Sequence number already exists! Please choose a unique sequence.");
            return;
        }

        setOperations((prev) => {
            const exists = prev.some((o) => o.id === selectedOp.id);
            let updated = exists
                ? prev.map((o) => (o.id === selectedOp.id ? selectedOp : o))
                : [...prev, selectedOp];
            return updated.sort((a, b) => a.seq - b.seq);
        });

        setOpenSheet(false);
        setSelectedOp(null);
    };

    const confirmDeleteOperation = () => {
        if (!selectedOp) return;
        setOperations((prev) => prev.filter((o) => o.id !== selectedOp.id));
        setDeleteDialog(false);
        setSelectedOp(null);
    };

    // --- Routing Handlers ---
    const handleSaveRouting = async () => {
        if (!routingForm.routingName || !routingForm.bomId) {
            alert("Routing Name and BOM are required");
            return;
        }

        const payload = {
            ...routingForm,
            organisationId,
            status: "ACTIVE" as const,
            operations: operations.map(({ id, ...op }) => op),
        };

        try {
            if (editRoutingId) {
                // 🔄 UPDATE
                await dispatch(
                    updateRouting({ id: editRoutingId, data: payload })
                ).unwrap();

                alert("Routing updated successfully");
            } else {
                // ➕ CREATE
                await dispatch(createRouting(payload)).unwrap();
                alert("Routing created successfully");
            }

            // RESET
            setEditRoutingId(null);
            setRoutingForm({
                routingName: "",
                product: "",
                bomId: "",
                plant: "",
                shop: "",
                line: "",
                description: "",
                tags: [],
            });
            setOperations([]);

            dispatch(fetchRoutings({ page: 1, limit: 10, organisationId }));
        } catch (err) {
            alert(err);
        }
    };

    /* ================= UI RENDER ================= */

    return (
        <div className="container mx-auto p-4 space-y-6 bg-gray-50/50 min-h-screen">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Routing Master</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Configure manufacturing sequences and operational standards.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleSaveDraft}
                    >
                        <FileText className="h-4 w-4" />
                        Save Draft
                    </Button>

                    <Button onClick={handleSaveRouting} disabled={status === "loading" || operations.length === 0} className="gap-2">
                        <Save className="h-4 w-4" />
                        {status === "loading" ? "Saving..." : "Activate Routing"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: FORM */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Routing Details</CardTitle>
                            <CardDescription>Basic information for this product routing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Routing Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={routingForm.routingName}
                                        onChange={(e) => setRoutingForm({ ...routingForm, routingName: e.target.value })}
                                        placeholder="e.g. Standard Frame Assembly"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>BOM <span className="text-red-500">*</span></Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={routingForm.bomId}
                                        onChange={(e) => setRoutingForm({ ...routingForm, bomId: e.target.value })}
                                    >
                                        <option value="">Select BOM...</option>
                                        {boms.map((bom) => (
                                            <option key={bom._id} value={bom._id}>
                                                {bom.productName} (v{bom.version})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Product / SKU</Label>
                                    <Input
                                        value={routingForm.product}
                                        onChange={(e) => setRoutingForm({ ...routingForm, product: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Plant</Label>
                                    <Input
                                        value={routingForm.plant}
                                        onChange={(e) => setRoutingForm({ ...routingForm, plant: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Tag Input Section */}
                            <div className="space-y-2">
                                <Label>Keywords / Tags</Label>
                                <TagInput
                                    value={routingForm.tags}
                                    onChange={(newTags) => setRoutingForm({ ...routingForm, tags: newTags })}
                                    placeholder="Type tag (e.g. 'Steel', 'Export') and press Enter"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={routingForm.description}
                                    onChange={(e) => setRoutingForm({ ...routingForm, description: e.target.value })}
                                    rows={3}
                                    placeholder="Additional notes about this routing..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* OPERATIONS TABLE */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>Operations Sequence</CardTitle>
                                <CardDescription>Define the step-by-step manufacturing process.</CardDescription>
                            </div>
                            <Button size="sm" onClick={openAddOperation} className="gap-2">
                                <Plus className="h-4 w-4" /> Add Operation
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="w-[60px] text-center">Seq</TableHead>
                                            <TableHead>Operation Name</TableHead>
                                            <TableHead>Work Center</TableHead>
                                            <TableHead className="text-right">Setup (min)</TableHead>
                                            <TableHead className="text-right">Run (min)</TableHead>
                                            <TableHead className="text-center">QC</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {operations.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <AlertCircle className="h-6 w-6 opacity-20" />
                                                        <p>No operations defined yet.</p>
                                                        <Button variant="link" onClick={openAddOperation}>Add your first operation</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            operations.map((op) => (
                                                <TableRow key={op.id}>
                                                    <TableCell className="text-center font-medium bg-gray-50/50">{op.seq}</TableCell>
                                                    <TableCell className="font-medium">{op.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-normal text-gray-600 bg-gray-50">
                                                            {workCenters.find(w => w._id === op.workCenter)?.name || op.workCenter}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-gray-600">{op.setupTime}</TableCell>
                                                    <TableCell className="text-right text-gray-600">{op.runTime}</TableCell>
                                                    <TableCell className="text-center">
                                                        {op.inspection && <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-none">QC Required</Badge>}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEditOperation(op)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelectedOp(op); setDeleteDialog(true); }}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: SUMMARY & LIST */}
                {/* RIGHT COLUMN: SUMMARY & LIST */}
                <div className="space-y-6">
                    {/* COST & TIME SUMMARY */}
                    <Card className="bg-slate-900 text-white border-slate-800 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Live Estimation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                                <span className="text-slate-400">Total Setup Time</span>
                                <span className="font-mono font-bold text-xl text-blue-400">{totalSetup} <span className="text-sm font-normal text-slate-500">min</span></span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                                <span className="text-slate-400">Total Run Time</span>
                                <span className="font-mono font-bold text-xl text-blue-400">{totalRun} <span className="text-sm font-normal text-slate-500">min</span></span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-slate-400">Bottleneck Op</span>
                                <span className="font-medium text-orange-400 truncate max-w-[120px]">{bottleneck}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* RECENT ROUTINGS TABLE */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Recent Routings</CardTitle>
                                <Badge variant="outline">
                                    {pagination?.total ?? routings.length} Total
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="px-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow>
                                            <TableHead className="pl-4">Name</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right pr-4">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {routings.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-center py-10 text-muted-foreground"
                                                >
                                                    No records found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            routings.map((r) => (
                                                <TableRow key={r._id} className="group">
                                                    <TableCell className="pl-4 font-medium">
                                                        {r.routingName}
                                                    </TableCell>

                                                    <TableCell className="text-xs text-gray-600">
                                                        {r.product || "N/A"}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge
                                                            variant={r.status === "ACTIVE" ? "default" : "secondary"}
                                                            className={
                                                                r.status === "ACTIVE"
                                                                    ? "bg-green-100 text-green-700 border-green-200"
                                                                    : ""
                                                            }
                                                        >
                                                            {r.status}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell className="text-right pr-4">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setEditRoutingId(r._id);

                                                                    setRoutingForm({
                                                                        routingName: r.routingName,
                                                                        product: r.product,
                                                                        bomId: r.bomId,
                                                                        plant: r.plant || "",
                                                                        shop: r.shop || "",
                                                                        line: r.line || "",
                                                                        description: r.description || "",
                                                                        tags: r.tags || [],
                                                                    });

                                                                    setOperations(
                                                                        r.operations.map((op: any, idx: number) => ({
                                                                            id: `op_${idx}`,
                                                                            ...op,
                                                                        }))
                                                                    );
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive"
                                                                onClick={() => setDeleteRoutingId(r._id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>

                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <Dialog
                                open={!!deleteRoutingId}
                                onOpenChange={() => setDeleteRoutingId(null)}
                            >
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Delete Routing</DialogTitle>
                                        <DialogDescription>
                                            This will permanently remove the routing. This action cannot be undone.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDeleteRoutingId(null)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={async () => {
                                                if (!deleteRoutingId) return;

                                                await dispatch(deleteRouting(deleteRoutingId)).unwrap();
                                                setDeleteRoutingId(null);
                                                dispatch(fetchRoutings({ page: 1, limit: 10, organisationId }));
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>


                            {/* ✅ PAGINATION */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/30">
                                    <span className="text-xs text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                        >
                                            Prev
                                        </Button>

                                        {Array.from({ length: totalPages }).map((_, i) => {
                                            const page = i + 1;
                                            return (
                                                <Button
                                                    key={page}
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    variant={page === currentPage ? "default" : "outline"}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* ================= MODALS & SHEETS ================= */}

            {/* ADD / EDIT OPERATION SHEET */}
            <Sheet open={openSheet} onOpenChange={setOpenSheet}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {selectedOp?.id?.toString().startsWith("temp_") ? "Add New Operation" : "Edit Operation"}
                        </SheetTitle>
                        <SheetDescription>
                            Configure the parameters for this manufacturing step.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedOp && (
                        <div className="grid gap-5 py-6">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Seq No.</Label>
                                <Input
                                    type="number"
                                    className="col-span-3"
                                    value={selectedOp.seq}
                                    onChange={(e) => setSelectedOp({ ...selectedOp, seq: Number(e.target.value) })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name</Label>
                                <Input
                                    className="col-span-3"
                                    placeholder="e.g. Laser Cutting"
                                    value={selectedOp.name}
                                    onChange={(e) => setSelectedOp({ ...selectedOp, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Work Center</Label>
                                <select
                                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedOp.workCenter}
                                    onChange={(e) => setSelectedOp({ ...selectedOp, workCenter: e.target.value })}
                                >
                                    <option value="">Select Work Center...</option>
                                    {workCenters.map((wc) => (
                                        <option key={wc._id} value={wc._id}>{wc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Setup Time (min)</Label>
                                    <Input
                                        type="number"
                                        value={selectedOp.setupTime}
                                        onChange={(e) => setSelectedOp({ ...selectedOp, setupTime: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Run Time (min)</Label>
                                    <Input
                                        type="number"
                                        value={selectedOp.runTime}
                                        onChange={(e) => setSelectedOp({ ...selectedOp, runTime: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Location / Shop Floor Area</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedOp.location}
                                    onChange={(e) => setSelectedOp({ ...selectedOp, location: e.target.value })}
                                >
                                    <option value="">Select Location...</option>
                                    {locations.map((loc) => (
                                        <option key={loc._id} value={loc._id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label>Quality Inspection</Label>
                                    <p className="text-xs text-muted-foreground">Require QC check after completion</p>
                                </div>
                                <Switch
                                    checked={selectedOp.inspection}
                                    onCheckedChange={(checked) => setSelectedOp({ ...selectedOp, inspection: checked })}
                                />
                            </div>
                        </div>
                    )}

                    <SheetFooter>
                        <Button variant="outline" onClick={() => setOpenSheet(false)}>Cancel</Button>
                        <Button onClick={saveOperation}>Save Changes</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Operation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove <strong>{selectedOp?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteOperation}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}