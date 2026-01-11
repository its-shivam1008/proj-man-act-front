import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import {
    createRouting,
    fetchRoutings,
} from "@/redux/slices/production/routingSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { fetchWorkCenters } from "@/redux/slices/production/workCenterSlice"
import { fetchBOMs } from "@/redux/slices/production/bomSlice"
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

/* ================= MAIN ================= */

export default function RoutingMaster() {
    const dispatch = useDispatch<AppDispatch>();

    // const { routings, status, pagination } = useSelector(
    //     (state: RootState) => state.routing
    // );
    const { list: boms = [] } = useSelector(
        (state: RootState) => state.bom
    );

    const { list: workCenters = [] } = useSelector(
        (state: RootState) => state.workCenters
    );
    const { locations = [] } = useSelector((state: RootState) => state.masterData);

    const status = useSelector(
        (state: RootState) => state.routing.status
    );

    /* ================= STATE ================= */

    const [operations, setOperations] = useState<Operation[]>([]);
    const [openSheet, setOpenSheet] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedOp, setSelectedOp] = useState<Operation | null>(null);

    const [routingForm, setRoutingForm] = useState({
        routingName: "",
        product: "",
        bomId: "",
        plant: "",
        shop: "",
        line: "",
        description: "",
    });

    /* ================= MASTER DATA ================= */

    // const bomList = [
    //     { id: "BOM-001", name: "Steel Door BOM" },
    //     { id: "BOM-002", name: "Iron Gate BOM" },
    // ];
    /* ================= EFFECTS ================= */
    const organisationId = localStorage.getItem('organisationId')
    useEffect(() => {
        dispatch(fetchRoutings({ page: 1, limit: 10 }));
        dispatch(
            fetchBOMs({
                organisationId
            })
        );
        dispatch(fetchWorkCenters())
        dispatch(fetchMasterData('location'))
    }, [dispatch]);

    /* ================= CALCULATIONS ================= */

    const totalSetup = operations.reduce((sum, op) => sum + op.setupTime, 0);
    const totalRun = operations.reduce((sum, op) => sum + op.runTime, 0);

    const bottleneck = operations.length > 0
        ? operations.reduce((prev, curr) =>
            prev.runTime > curr.runTime ? prev : curr
        ).name
        : "-";

    /* ================= HANDLERS ================= */

    const openAdd = () => {
        const lastSeq = operations.length > 0
            ? Math.max(...operations.map(o => o.seq))
            : 0;

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

    const openEdit = (op: Operation) => {
        setSelectedOp({ ...op });
        setOpenSheet(true);
    };

    const saveOperation = () => {
        if (!selectedOp) return;

        // Check for duplicate sequence
        const duplicateSeq = operations.find(
            (o) => o.seq === selectedOp.seq && o.id !== selectedOp.id
        );

        if (duplicateSeq) {
            alert("Sequence number already exists!");
            return;
        }

        setOperations((prev) => {
            const exists = prev.some((o) => o.id === selectedOp.id);

            let updated: Operation[];

            if (exists) {
                updated = prev.map((o) => (o.id === selectedOp.id ? selectedOp : o));
            } else {
                updated = [...prev, selectedOp];
            }

            // Always sort by sequence
            return updated.sort((a, b) => a.seq - b.seq);
        });

        setOpenSheet(false);
        setSelectedOp(null);
    };

    const confirmDelete = () => {
        if (!selectedOp) return;

        setOperations((prev) => prev.filter((o) => o.id !== selectedOp.id));
        setDeleteDialog(false);
        setSelectedOp(null);
    };
    const handleSaveRouting = async () => {
        if (!routingForm.routingName || !routingForm.bomId) {
            alert("Routing Name and BOM are required");
            return;
        }

        const payload = {
            ...routingForm,
            status: "ACTIVE" as const,
            operations: operations.map(({ id, ...op }) => op),
        };

        try {
            await dispatch(createRouting(payload)).unwrap();
            // Reset form only on success
            setRoutingForm({
                routingName: "", product: "", bomId: "",
                plant: "", shop: "", line: "", description: "",
            });
            setOperations([]);
            alert("Routing activated successfully!");
        } catch (error) {
            alert(`Error: ${error}`);
        }
    };
    const handleSaveDraft = () => {
        const payload = {
            ...routingForm,
            status: "DRAFT" as const,
            operations: operations.map(({ id, ...op }) => op), // Clean temp IDs
        };

        dispatch(createRouting(payload))
            .unwrap()
            .then(() => alert("Draft saved successfully"))
            .catch((err) => alert(err));
    };
    /* ================= RENDER HELPERS ================= */
    function Field({
        label,
        value,
        onChange,
        type = "text",
        ...rest
    }: {
        label: string;
        value: string | number;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        type?: string;
    }) {
        return (
            <div>
                <Label>{label}</Label>
                <Input type={type} value={value} onChange={onChange} {...rest} />
            </div>
        );
    }

    const Summary = ({ title, value }: { title: string; value: string }) => (
        <div className="text-center">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    );

    /* ================= UI ================= */

    return (
        <div className="container mx-auto p-4 space-y-6 bg-gray-50 min-h-screen">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Routing Master</h1>
                    <p className="text-muted-foreground">
                        Define the sequence of operations to manufacture a product
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleSaveDraft}>
                        Save Draft
                    </Button>

                    <Button
                        onClick={handleSaveRouting}
                        disabled={status === "loading" || operations.length === 0}
                    >
                        {status === "loading" ? "Saving..." : "Activate Routing"}
                    </Button>
                </div>
            </div>

            {/* ROUTING INFORMATION */}
            <Card>
                <CardHeader>
                    <CardTitle>Routing Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Field
                        label="Routing Name"
                        value={routingForm.routingName}
                        onChange={(e) =>
                            setRoutingForm({ ...routingForm, routingName: e.target.value })
                        }
                    />
                    <Field
                        label="Product"
                        value={routingForm.product}
                        onChange={(e) =>
                            setRoutingForm({ ...routingForm, product: e.target.value })
                        }
                    />
                    <div>
                        <Label>BOM</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={routingForm.bomId}
                            onChange={(e) =>
                                setRoutingForm({ ...routingForm, bomId: e.target.value })
                            }
                        >
                            <option value="">Select BOM</option>

                            {boms.map((bom) => (
                                <option key={bom._id} value={bom._id}>
                                    {bom.productName} (v{bom.version})
                                </option>
                            ))}
                        </select>
                    </div>


                    <Field
                        label="Plant"
                        value={routingForm.plant}
                        onChange={(e) =>
                            setRoutingForm({ ...routingForm, plant: e.target.value })
                        }
                    />
                    <Field
                        label="Shop"
                        value={routingForm.shop}
                        onChange={(e) =>
                            setRoutingForm({ ...routingForm, shop: e.target.value })
                        }
                    />
                    <Field
                        label="Line"
                        value={routingForm.line}
                        onChange={(e) =>
                            setRoutingForm({ ...routingForm, line: e.target.value })
                        }
                    />

                    <div className="sm:col-span-2 lg:col-span-3">
                        <Label>Description</Label>
                        <Textarea
                            value={routingForm.description}
                            onChange={(e) =>
                                setRoutingForm({ ...routingForm, description: e.target.value })
                            }
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* OPERATIONS TABLE */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Operations Sequence</CardTitle>
                    <Button onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Operation
                    </Button>
                </CardHeader>

                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Seq</TableHead>
                                    <TableHead>Operation</TableHead>
                                    <TableHead>Work Center</TableHead>
                                    <TableHead className="w-24">Setup</TableHead>
                                    <TableHead className="w-24">Run</TableHead>
                                    <TableHead className="w-28">Inspection</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="w-32 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {operations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No operations defined yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    operations.map((op) => (
                                        <TableRow key={op.id}>
                                            <TableCell className="font-medium">{op.seq}</TableCell>
                                            <TableCell>{op.name || "-"}</TableCell>
                                            <TableCell>{op.workCenter || "-"}</TableCell>
                                            <TableCell>{op.setupTime} min</TableCell>
                                            <TableCell>{op.runTime} min</TableCell>
                                            <TableCell>
                                                {op.inspection ? (
                                                    <Badge className="bg-green-600 hover:bg-green-600">Yes</Badge>
                                                ) : (
                                                    <Badge variant="secondary">No</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{op.location || "-"}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => openEdit(op)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedOp(op);
                                                        setDeleteDialog(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* SUMMARY CARDS */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <Summary title="Total Setup Time" value={`${totalSetup} min`} />
                        <Summary title="Total Run Time" value={`${totalRun} min`} />
                        <Summary title="Bottleneck Operation" value={bottleneck} />
                        <Summary title="Est. Cost / Unit" value="₹420" />
                    </div>
                </CardContent>
            </Card>

            {/* OPERATION SHEET */}
            <Sheet open={openSheet} onOpenChange={setOpenSheet}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {/* If the ID starts with 'temp_', it's a new unsaved operation */}
                            {selectedOp?.id?.toString().startsWith("temp_") ? "Add" : "Edit"} Operation
                        </SheetTitle>
                    </SheetHeader>

                    {selectedOp && (
                        <div className="space-y-5 py-6">
                            <Field
                                label="Sequence"
                                type="number"
                                value={selectedOp.seq}
                                onChange={(e) =>
                                    setSelectedOp({
                                        ...selectedOp,
                                        seq: Number(e.target.value) || 10,
                                    })
                                }
                            />

                            <Field
                                label="Operation Name"
                                value={selectedOp.name}
                                onChange={(e) =>
                                    setSelectedOp({ ...selectedOp, name: e.target.value })
                                }
                                placeholder="e.g. Laser Cutting"
                            />

                            <div>
                                <Label>Work Center</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedOp.workCenter}
                                    onChange={(e) =>
                                        setSelectedOp({
                                            ...selectedOp,
                                            workCenter: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Select Work Center</option>

                                    {workCenters.map((wc) => (
                                        <option key={wc._id} value={wc._id}>
                                            {wc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Setup Time (min)"
                                    type="number"
                                    value={selectedOp.setupTime}
                                    onChange={(e) =>
                                        setSelectedOp({
                                            ...selectedOp,
                                            setupTime: Number(e.target.value) || 0,
                                        })
                                    }
                                />
                                <Field
                                    label="Run Time (min)"
                                    type="number"
                                    value={selectedOp.runTime}
                                    onChange={(e) =>
                                        setSelectedOp({
                                            ...selectedOp,
                                            runTime: Number(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>Location</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedOp.location}
                                    onChange={(e) =>
                                        setSelectedOp({
                                            ...selectedOp,
                                            location: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Select Location</option>

                                    {locations.map((loc) => (
                                        <option key={loc._id} value={loc._id}>
                                            {loc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <div className="flex items-center justify-between">
                                <Label>Inspection Required</Label>
                                <Switch
                                    checked={selectedOp.inspection}
                                    onCheckedChange={(checked) =>
                                        setSelectedOp({ ...selectedOp, inspection: checked })
                                    }
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    className="w-full"
                                    onClick={saveOperation}
                                    disabled={!selectedOp.name || !selectedOp.workCenter}
                                >
                                    Save Operation
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* DELETE CONFIRMATION */}
            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Operation?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete this operation? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}