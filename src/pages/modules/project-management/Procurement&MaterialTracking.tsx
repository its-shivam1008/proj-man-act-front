// Procurement.tsx (updated with defensive guards)
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Tooltip, TooltipProvider } from "../../../components/ui/tooltip";
import { Calendar } from "lucide-react";
import { Plus, Edit2, Trash2, Truck, ShoppingCart, CheckCircle2 } from "lucide-react";


import { RootState } from "@/redux/store";
import {
    fetchMRS,
    createMRS,
    updateMRS,
    deleteMRS,
} from "@/redux/slices/mrsSlice"; // Adjust path to your slices
import {
    convertToPR,
} from "@/redux/slices/prSlice"; // Adjust path
import {
    receivePO,
} from "@/redux/slices/poSlice"; // Adjust path

// --- Local types (adapt if you have central types) ---
type MRSItem = {
    id: string;
    _id?: string; // Backend might use _id
    projectId?: string;
    task?: string;
    item: string;
    quantity: number;
    requiredDate?: string; // ISO
    status?: "open" | "sent" | "ordered" | "received" | "cancelled";
    remarks?: string;
    createdAt?: string;
    updatedAt?: string;
};

type PurchaseRequest = {
    id: string;
    _id?: string;
    mrsIds: string[]; // MRS items included
    createdAt: string;
    status: "open" | "converted" | "closed";
};

type PurchaseOrder = {
    id: string;
    _id?: string;
    prId: string;
    supplier?: string;
    poNo?: string;
    items: { mrsId: string; item: string; qty: number }[]; // <-- Explicitly array
    createdAt: string;
    deliveryDate?: string;
    received?: number; // qty received
    issued?: number; // qty issued to sites
    status?: "open" | "delivered" | "partial" | "closed";
};

type InventoryItem = {
    id: string;
    item: string;
    qty: number;
    uom?: string;
    location?: string;
};

// --- Local Inventory Helpers (keep localStorage for inventory until slice is added) ---
const getInventory = (): InventoryItem[] => {
    // Assuming you have getFromStorage imported; adjust as needed
    // For now, keeping localStorage for inventory
    const stored = localStorage.getItem('INVENTORY'); // Adjust key
    return stored ? JSON.parse(stored) : [];
};
const saveInventory = (list: InventoryItem[]) => localStorage.setItem('INVENTORY', JSON.stringify(list));

// --- Component ---
export default function ProcurementPage() {
    const dispatch = useDispatch();

    // Redux Selectors
    const mrsList = useSelector((state: RootState) => state.mrs.list) as MRSItem[];
    const prs = useSelector((state: RootState) => state.pr.list) as PurchaseRequest[];
    const pos = useSelector((state: RootState) => state.po.list) as PurchaseOrder[];
    const mrsLoading = useSelector((state: RootState) => state.mrs.loading);
    const prLoading = useSelector((state: RootState) => state.pr.loading);
    const poLoading = useSelector((state: RootState) => state.po.loading);

    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    // dialog / form state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<MRSItem | null>(null);
    const [form, setForm] = useState<Partial<MRSItem>>({ item: "", quantity: 1, requiredDate: "" });

    // load data on mount
    useEffect(() => {
        dispatch(fetchMRS());
        setInventory(getInventory());
    }, [dispatch]);

    // persist inventory helper
    const persistInventory = (list: InventoryItem[]) => {
        setInventory(list);
        saveInventory(list);
    };

    // --- MRS CRUD ---
    const openCreate = () => {
        setEditing(null);
        setForm({ item: "", quantity: 1, requiredDate: "" });
        setIsDialogOpen(true);
    };

    const openEdit = (m: MRSItem) => {
        setEditing(m);
        setForm(m);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.item?.trim() || form.quantity === undefined || form.quantity < 1) {
            // Optional: Add toast/alert for user feedback
            console.warn("Item and quantity are required");
            return;
        }
        const cleanForm: Partial<MRSItem> = {
            ...form,
            item: form.item.trim(),
            quantity: Number(form.quantity), // Ensure number
            requiredDate: form.requiredDate ? form.requiredDate : undefined,
        };
        console.log('Sending payload:', cleanForm); // Debug log
        if (editing) {
            await dispatch(updateMRS({ id: editing._id || editing.id, data: cleanForm }));
        } else {
            await dispatch(createMRS(cleanForm));
        }
        setIsDialogOpen(false);
        setEditing(null);
        setForm({ item: "", quantity: 1, requiredDate: "" });
    };

    const handleDelete = async (id: string) => {
        await dispatch(deleteMRS(id));
    };

    const updatemrsStatus = async (id: string, status: MRSItem["status"]) => {
        // For status update, dispatch updateMRS with status
        await dispatch(updateMRS({ id, data: { status } }));
    };

    // --- Integration Actions ---
    // 1) Send selected MRS items to Purchase -> create PR and auto-create a PO
    const sendToPurchase = async (mrsIds: string[], supplier?: string, deliveryDate?: string) => {
        if (!mrsIds || mrsIds.length === 0) return;
        const payload = {
            mrsIds: mrsIds.filter(id => id?.trim()), // Clean IDs
            supplier: supplier?.trim(),
            deliveryDate,
        };
        console.log('Send to Purchase payload:', payload); // Debug
        try {
            await dispatch(convertToPR(payload)).unwrap();
            // Optionally update MRS status to 'sent' after success
            mrsIds.forEach(id => updatemrsStatus(id, "sent"));
        } catch (err: any) {
            console.error('Send to Purchase failed:', err.payload?.errors || err);
            // Optional: Show user alert with error details
        }
    };

    // 2) Simple stock availability check (reads INVENTORY)
    const checkStockAvailability = (itemName: string) => {
        const found = inventory.find((it) => it.item.toLowerCase() === itemName.toLowerCase());
        return found ? found.qty : 0;
    };

    // 3) Receive goods against PO
    const receiveAgainstPO = async (poId: string, qtyReceived: number) => {
        await dispatch(receivePO({ poId, qty: qtyReceived }));
        // Update inventory locally (or add inventory slice)
        const po = pos.find(p => p.id === poId || p._id === poId);
        if (po) {
            const inv = getInventory();
            (po.items || []).forEach((it) => { // Guard here too
                const existing = inv.find((x) => x.item.toLowerCase() === it.item.toLowerCase());
                if (existing) {
                    existing.qty += qtyReceived; // Simplistic; adjust for per-item
                } else {
                    inv.push({ id: generateId(), item: it.item, qty: qtyReceived });
                }
            });
            persistInventory(inv);
        }
    };

    // --- Material Status Tracker derived from POs & Inventory (with guards) ---
    const materialStatus = useMemo(() => {
        const rows: {
            item: string;
            poNo?: string;
            supplier?: string;
            deliveryDate?: string;
            received: number;
            issued: number;
            remaining: number;
        }[] = [];

        (pos || []).forEach((po) => { // Guard outer array
            (po.items || []).forEach((it) => { // <-- KEY FIX: Guard po.items
                const invItem = inventory.find((x) => x.item.toLowerCase() === it.item.toLowerCase());
                const received = po.received || 0;
                const issued = po.issued || 0;
                const remaining = (invItem?.qty || 0) - issued;
                rows.push({
                    item: it.item,
                    poNo: po.poNo,
                    supplier: po.supplier,
                    deliveryDate: po.deliveryDate,
                    received,
                    issued,
                    remaining: remaining < 0 ? 0 : remaining,
                });
            });
        });

        return rows;
    }, [pos, inventory]);


    // --- UI derived numbers ---
    const totalRequired = useMemo(() => (mrsList || []).reduce((s, m) => s + (m.quantity || 0), 0), [mrsList]);
    const totalOpen = useMemo(() => (mrsList || []).filter((m) => m.status === "open").length, [mrsList]);
    const totalSent = useMemo(() => (mrsList || []).filter((m) => m.status === "sent").length, [mrsList]);

    // --- Selection handling for bulk send ---
    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
    const toggleSelect = (id: string) => setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
    const selectedList = Object.keys(selectedIds).filter((k) => selectedIds[k]);

    // quick helper to prefill some inventory if empty (developer convenience)
    const bootstrapInventory = () => {
        if (inventory.length > 0) return;
        const sample: InventoryItem[] = [
            { id: generateId(), item: "Cement 50kg", qty: 250, uom: "bag" },
            { id: generateId(), item: "Steel 8mm", qty: 1200, uom: "kg" },
            { id: generateId(), item: "Sand", qty: 5000, uom: "kg" },
        ];
        persistInventory(sample);
    };

    // UI
    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Procurement & Material Tracking</h2>
                    <p className="text-muted-foreground">Integrate MRS with Purchase & Inventory</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={openCreate} disabled={mrsLoading}>
                        <Plus className="mr-2 h-4 w-4" /> Create MRS Item
                    </Button>
                    <Button variant="outline" onClick={bootstrapInventory}>
                        <Truck className="mr-2 h-4 w-4" /> Bootstrap Inventory
                    </Button>
                </div>
            </div>

            {/* Alerts / Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader><CardTitle>Total Required</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRequired}</div>
                        <div className="text-sm text-muted-foreground">MRS items quantity</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Open / Sent</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div><div className="text-lg font-semibold">{totalOpen}</div><div className="text-xs text-muted-foreground">Open</div></div>
                            <div><div className="text-lg font-semibold">{totalSent}</div><div className="text-xs text-muted-foreground">Sent</div></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Bulk Actions</CardTitle></CardHeader>
                    <CardContent>
                        <TooltipProvider>
                            <div className="flex gap-2 items-center">
                                <Button disabled={selectedList.length === 0 || prLoading} onClick={() => sendToPurchase(selectedList)}>
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Send to Purchase
                                </Button>
                                <Tooltip content="Select multiple rows then send to purchase">
                                    <span className="text-muted-foreground text-xs">{selectedList.length} selected</span>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </CardContent>
                </Card>
            </div>

            {/* MRS Table */}
            <Card>
                <CardHeader><CardTitle>Material Requirement Sheet (MRS)</CardTitle></CardHeader>
                <CardContent>
                    {mrsLoading && <div className="text-center py-4">Loading MRS...</div>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Required Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(mrsList || []).map((m) => (
                                <TableRow key={m.id || m._id}>
                                    <TableCell>
                                        <input type="checkbox" checked={!!selectedIds[m.id || m._id!]} onChange={() => toggleSelect(m.id || m._id!)} />
                                    </TableCell>
                                    <TableCell>{m.task || "—"}</TableCell>
                                    <TableCell>{m.item}</TableCell>
                                    <TableCell>{m.quantity}</TableCell>
                                    <TableCell>{m.requiredDate ? new Date(m.requiredDate).toLocaleDateString() : "—"}</TableCell>
                                    <TableCell>
                                        <Badge className="capitalize" variant={m.status === "open" ? "outline" : "default"}>{m.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => openEdit(m)} disabled={mrsLoading}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id || m._id!)} disabled={mrsLoading}>
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => sendToPurchase([m.id || m._id!])} disabled={prLoading}>
                                                <ShoppingCart className="h-4 w-4 mr-2" />Send
                                            </Button>
                                            <Button size="sm" onClick={() => {
                                                const inStock = checkStockAvailability(m.item);
                                                window.alert(`Stock for "${m.item}": ${inStock}`);
                                            }}>
                                                <Truck className="h-4 w-4 mr-2" />Check Stock
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {mrsList?.length === 0 && !mrsLoading && <div className="text-center py-8 text-muted-foreground">No MRS items — create one.</div>}
                </CardContent>
            </Card>

            {/* Purchase Requests & Orders (simple view) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Purchase Requests (PR)</CardTitle></CardHeader>
                    <CardContent>
                        {prLoading && <div className="text-center py-4">Loading PRs...</div>}
                        {(prs || []).length === 0 ? (
                            <div className="text-muted-foreground">No PRs yet.</div>
                        ) : (
                            <div className="space-y-2">
                                {prs.map((pr) => (
                                    <div key={pr.id || pr._id} className="rounded-md border p-3">
                                        <div className="flex justify-between">
                                            <div>PR: <strong>{pr.id || pr._id}</strong></div>
                                            <div className="text-sm text-muted-foreground">{new Date(pr.createdAt).toLocaleString()}</div>
                                        </div>
                                        <div className="text-sm mt-2">MRS Items: {pr.mrsIds?.length || 0}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Purchase Orders (PO)</CardTitle></CardHeader>
                    <CardContent>
                        {poLoading && <div className="text-center py-4">Loading POs...</div>}
                        {(pos || []).length === 0 ? (
                            <div className="text-muted-foreground">No POs yet.</div>
                        ) : (
                            <div className="space-y-2">
                                {pos.map((po) => (
                                    <div key={po._id || po.id}>  
                                        {/* ... */}
                                        <Button onClick={() => {
                                            const poId = po._id || po.id;  // Prioritize _id
                                            if (!poId) {
                                                console.error('No ID on PO:', po);
                                                return;
                                            }
                                            console.log('Using poId:', poId);  // Log here too
                                            const totalQty = (po.items || []).reduce((s, it) => s + (it.qty || 0), 0);
                                            receiveAgainstPO(poId, totalQty);
                                        }}>
                                            Mark Received
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Material Status Tracker */}
            <Card>
                <CardHeader><CardTitle>Material Status Tracker</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>PO No</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Delivery Date</TableHead>
                                <TableHead>Received</TableHead>
                                <TableHead>Issued</TableHead>
                                <TableHead>Remaining</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materialStatus.map((r, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{r.item}</TableCell>
                                    <TableCell>{r.poNo}</TableCell>
                                    <TableCell>{r.supplier}</TableCell>
                                    <TableCell>{r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString() : "—"}</TableCell>
                                    <TableCell>{r.received}</TableCell>
                                    <TableCell>{r.issued}</TableCell>
                                    <TableCell>{r.remaining}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {materialStatus.length === 0 && <div className="text-center py-8 text-muted-foreground">No material statuses yet.</div>}
                </CardContent>
            </Card>

            {/* Dialog to create/edit MRS */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><span /></DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit MRS Item" : "Create MRS Item"}</DialogTitle>
                        <DialogDescription>{editing ? "Update item info." : "Add material requirement"}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Task</Label>
                                <Input value={form.task || ""} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="Which task/area?" />
                            </div>
                            <div>
                                <Label>Item</Label>
                                <Input value={form.item || ""} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="e.g., Cement 50kg" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Quantity</Label>
                                <Input type="number" value={form.quantity ?? 1} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value || "0") })} />
                            </div>
                            <div>
                                <Label>Required Date</Label>
                                <Input type="date" value={form.requiredDate ? form.requiredDate.split("T")[0] : ""} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <Label>Remarks</Label>
                            <Textarea value={form.remarks || ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={mrsLoading}>{editing ? "Save Changes" : "Create Item"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/**
 * Key Changes:
 * - Added `(po.items || []).forEach(...)` in materialStatus useMemo to prevent undefined.forEach() crash.
 * - Similar guards in other loops (e.g., PO items render, receiveAgainstPO).
 * - Enhanced handleSave with payload cleaning and error logging.
 * - Added guards to derived memos (e.g., (mrsList || []).reduce(...)).
 * - This resolves the TypeError; component renders safely even if data is incomplete.
 * - For root cause: Check backend PO response—ensure `items` is always an array (not null/undefined).
 * - Debug: Add `console.log('POs with items check:', pos?.map(p => ({ id: p.id, hasItems: !!p.items })));` in component.
 */