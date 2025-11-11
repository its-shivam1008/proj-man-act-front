// Procurement.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Tooltip, TooltipProvider } from "../../components/ui/tooltip";
import { Calendar } from "lucide-react";
import { Plus, Edit2, Trash2, Truck, ShoppingCart, CheckCircle2 } from "lucide-react";
import {
    getFromStorage,
    saveToStorage,
    generateId,
    STORAGE_KEYS,
} from "../../utils/localStorage"; // <-- uses your localStorage helpers

// --- Local types (adapt if you have central types) ---
type MRSItem = {
    id: string;
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
    mrsIds: string[]; // MRS items included
    createdAt: string;
    status: "open" | "converted" | "closed";
};

type PurchaseOrder = {
    id: string;
    prId: string;
    supplier?: string;
    poNo?: string;
    items: { mrsId: string; item: string; qty: number }[];
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

// --- Helpers to read/write standardized keys ---
const getMRS = (): MRSItem[] => getFromStorage<MRSItem[]>(STORAGE_KEYS.MRS) || [];
const saveMRS = (list: MRSItem[]) => saveToStorage(STORAGE_KEYS.MRS, list);
const getPRs = (): PurchaseRequest[] => {
    const raw = getFromStorage<Partial<PurchaseRequest>[]>(STORAGE_KEYS.PURCHASE_REQUESTS) || [];
    return raw.map(pr => ({
        id: pr.id || generateId(),
        mrsIds: Array.isArray(pr.mrsIds) ? pr.mrsIds : [],
        createdAt: pr.createdAt || new Date().toISOString(),
        status: (pr as any).status || "open",
    }));
};;

const savePRs = (list: PurchaseRequest[]) => saveToStorage(STORAGE_KEYS.PURCHASE_REQUESTS, list);

const getPOs = (): PurchaseOrder[] => {
    const raw = getFromStorage<Partial<PurchaseOrder>[]>(STORAGE_KEYS.PURCHASE_ORDERS) || [];
    return raw.map(po => ({
        id: po.id || generateId(),
        prId: po.prId || "",
        poNo: po.poNo || "",
        supplier: po.supplier || "",
        items: Array.isArray(po.items) ? po.items.map(item => ({
            mrsId: item.mrsId || "",
            item: item.item || "Unknown item",
            qty: typeof item.qty === "number" ? item.qty : 0,
        })) : [],
        createdAt: po.createdAt || new Date().toISOString(),
        deliveryDate: po.deliveryDate,
        received: typeof po.received === "number" ? po.received : 0,
        issued: typeof po.issued === "number" ? po.issued : 0,
        status: (po as any).status || "open",
    }));
};
const savePOs = (list: PurchaseOrder[]) => saveToStorage(STORAGE_KEYS.PURCHASE_ORDERS, list);

const getInventory = (): InventoryItem[] => getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY) || [];
const saveInventory = (list: InventoryItem[]) => saveToStorage(STORAGE_KEYS.INVENTORY, list);

// --- Component ---
export default function ProcurementPage() {
    const [mrsList, setMrsList] = useState<MRSItem[]>([]);
    const [prs, setPrs] = useState<PurchaseRequest[]>([]);
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    // dialog / form state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<MRSItem | null>(null);
    const [form, setForm] = useState<Partial<MRSItem>>({ item: "", quantity: 1, requiredDate: "" });

    // load storage on mount
    useEffect(() => {
        setMrsList(getMRS());
        setPrs(getPRs());
        setPos(getPOs());
        setInventory(getInventory());
    }, []);

    // persist helpers
    const persistMrs = (list: MRSItem[]) => {
        setMrsList(list);
        saveMRS(list);
    };
    const persistPRs = (list: PurchaseRequest[]) => {
        setPrs(list);
        savePRs(list);
    };
    const persistPOs = (list: PurchaseOrder[]) => {
        setPos(list);
        savePOs(list);
    };
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

    const handleSave = () => {
        if (!form.item || !form.quantity) return;
        const now = new Date().toISOString();
        if (editing) {
            const updated = mrsList.map((m) => (m.id === editing.id ? { ...m, ...form, updatedAt: now } as MRSItem : m));
            persistMrs(updated);
        } else {
            const newItem: MRSItem = {
                id: generateId(),
                item: form.item!.trim(),
                quantity: form.quantity || 1,
                requiredDate: form.requiredDate,
                status: "open",
                remarks: form.remarks,
                createdAt: now,
                updatedAt: now,
            };
            persistMrs([...mrsList, newItem]);
        }
        setIsDialogOpen(false);
        setEditing(null);
        setForm({});
    };

    const handleDelete = (id: string) => {
        const updated = mrsList.filter((m) => m.id !== id);
        persistMrs(updated);
    };

    const updatemrsStatus = (id: string, status: MRSItem["status"]) => {
        const updated = mrsList.map((m) => (m.id === id ? { ...m, status, updatedAt: new Date().toISOString() } : m));
        persistMrs(updated);
    };

    // --- Integration Actions ---
    // 1) Send selected MRS items to Purchase -> create PR and auto-create a PO (simulated)
    const sendToPurchase = (mrsIds: string[], supplier?: string, deliveryDate?: string) => {
        if (!mrsIds || mrsIds.length === 0) return;

        const now = new Date().toISOString();
        const pr: PurchaseRequest = {
            id: generateId(),
            mrsIds: mrsIds || [],   // ✅ always an array
            createdAt: now,
            status: "converted",
        };

        const prList = [...prs, pr];
        persistPRs(prList);

        // create a simple PO from PR (simulate immediate vendor confirmation)
        const po: PurchaseOrder = {
            id: generateId(),
            prId: pr.id,
            poNo: `PO-${Math.floor(Math.random() * 900000 + 100000)}`,
            supplier: supplier || "Default Supplier",
            items: mrsIds.map((id) => {
                const m = mrsList.find((x) => x.id === id)!;
                return { mrsId: id, item: m.item, qty: m.quantity };
            }),
            createdAt: now,
            deliveryDate: deliveryDate,
            received: 0,
            issued: 0,
            status: "open",
        };
        const poList = [...pos, po];
        persistPOs(poList);

        // mark MRS items as 'sent' or 'ordered'
        const updatedMrs = mrsList.map((m) => (mrsIds.includes(m.id) ? { ...m, status: "sent", updatedAt: now } : m));
        persistMrs(updatedMrs);
    };

    // 2) Simple stock availability check (reads INVENTORY)
    const checkStockAvailability = (itemName: string) => {
        const found = inventory.find((it) => it.item.toLowerCase() === itemName.toLowerCase());
        return found ? found.qty : 0;
    };

    // 3) Receive goods against PO (simulate partial/full receipt)
    const receiveAgainstPO = (poId: string, itemIndex: number, qtyReceived: number) => {
        const poList = getPOs();
        const po = poList.find((p) => p.id === poId);
        if (!po) return;
        po.items[itemIndex].qty = po.items[itemIndex].qty; // original qty
        po.received = (po.received || 0) + qtyReceived;
        // update status
        po.status = po.received >= po.items.reduce((s, it) => s + it.qty, 0) ? "delivered" : "partial";
        persistPOs(poList);

        // add to inventory (simple append / add qty)
        const inv = getInventory();
        po.items.forEach((it) => {
            const existing = inv.find((x) => x.item.toLowerCase() === it.item.toLowerCase());
            if (existing) {
                existing.qty += qtyReceived; // NOTE: simplistic: adds same received qty to every item; in real scenario, you pass per-item qty
            } else {
                inv.push({ id: generateId(), item: it.item, qty: qtyReceived });
            }
        });
        persistInventory(inv);
    };

    // --- Material Status Tracker derived from POs & Inventory ---
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

        // safe iteration: default to empty arrays
        (pos || []).forEach((po) => {
            (po.items || []).forEach((it) => {
                const invItem = (inventory || []).find((x) => x.item.toLowerCase() === it.item.toLowerCase());
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
    const totalRequired = useMemo(() => mrsList.reduce((s, m) => s + (m.quantity || 0), 0), [mrsList]);
    const totalOpen = useMemo(() => mrsList.filter((m) => m.status === "open").length, [mrsList]);
    const totalSent = useMemo(() => mrsList.filter((m) => m.status === "sent").length, [mrsList]);

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
                    <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Create MRS Item</Button>
                    <Button variant="outline" onClick={() => { bootstrapInventory(); }}><Truck className="mr-2 h-4 w-4" /> Bootstrap Inventory</Button>
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
                                <Button disabled={selectedList.length === 0} onClick={() => sendToPurchase(selectedList)}> <ShoppingCart className="mr-2 h-4 w-4" /> Send to Purchase</Button>
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
                            {mrsList.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell>
                                        <input type="checkbox" checked={!!selectedIds[m.id]} onChange={() => toggleSelect(m.id)} />
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
                                            <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Edit2 className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                            <Button size="sm" variant="secondary" onClick={() => sendToPurchase([m.id])}><ShoppingCart className="h-4 w-4 mr-2" />Send</Button>
                                            <Button size="sm" onClick={() => {
                                                const inStock = checkStockAvailability(m.item);
                                                window.alert(`Stock for "${m.item}": ${inStock}`);
                                            }}><Truck className="h-4 w-4 mr-2" />Check Stock</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {mrsList.length === 0 && <div className="text-center py-8 text-muted-foreground">No MRS items — create one.</div>}
                </CardContent>
            </Card>

            {/* Purchase Requests & Orders (simple view) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Purchase Requests (PR)</CardTitle></CardHeader>
                    <CardContent>
                        {prs.length === 0 ? (
                            <div className="text-muted-foreground">No PRs yet.</div>
                        ) : (
                            <div className="space-y-2">
                                {prs.map((pr) => (
                                    <div key={pr.id} className="rounded-md border p-3">
                                        <div className="flex justify-between">
                                            <div>PR: <strong>{pr.id}</strong></div>
                                            <div className="text-sm text-muted-foreground">{new Date(pr.createdAt).toLocaleString()}</div>
                                        </div>
                                        <div className="text-sm mt-2">MRS Items: {Array.isArray(pr.mrsIds) ? pr.mrsIds.length : 0}</div>


                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Purchase Orders (PO)</CardTitle></CardHeader>
                    <CardContent>
                        {pos.length === 0 ? (
                            <div className="text-muted-foreground">No POs yet.</div>
                        ) : (
                            <div className="space-y-2">
                                {pos.map((po) => (
                                    <div key={po.id} className="rounded-md border p-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-sm text-muted-foreground">PO</div>
                                                <div className="font-medium">{po.poNo}</div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">{po.supplier}</div>
                                        </div>

                                        <div className="mt-2 text-sm">
                                            Items:
                                            <ul className="list-disc ml-5">
                                                {(po.items || []).map((it, idx) => (
                                                    <li key={idx}>{it.item} — {it.qty}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            <Button size="sm" onClick={() => {
                                                const totalQty = (po.items || []).reduce((s, it) => s + (it.qty || 0), 0);
                                                receiveAgainstPO(po.id, 0, totalQty);
                                                window.alert("Received against PO (inventory updated).");
                                            }}>
                                                <CheckCircle2 className="h-4 w-4 mr-2" />Mark Received
                                            </Button>
                                        </div>
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
                        <Button onClick={handleSave}>{editing ? "Save Changes" : "Create Item"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/**
 * Notes:
 * - This file relies on your `../../utils/localStorage` to expose:
 *    getFromStorage<T>(key:string): T | null
 *    saveToStorage<T>(key:string, value:T): void
 *    generateId(): string
 *    STORAGE_KEYS: { MRS: string; PURCHASE_REQUESTS: string; PURCHASE_ORDERS: string; INVENTORY: string; ... }
 *
 * - If STORAGE_KEYS uses different key names, adjust imports or the keys used at top.
 * - This is a simulation: PR -> PO flow is simplified for demo. Adjust to mirror your real backend flow.
 * - For stock receipt you may want to capture per-item qty instead of the simple approach in `receiveAgainstPO`.
 *
 * - Dependencies:
 *    - shadcn/ui components (used across your app)
 *    - lucide-react for icons
 *
 * - To wire with other pages:
 *    - `Budget.tsx` can link to this module by pushing MRS items (or creating PRs) when budget items are approved.
 *    - Inventory can be used by other pages by reading STORAGE_KEYS.INVENTORY.
 *
 * Want me to:
 * - make `Send to Purchase` open a dialog to select supplier & per-item quantities? (I can add that)
 * - create a tiny `Inventory.tsx` editor page (CRUD for inventory)? (useful)
 * - implement more robust receive/issue transactions with per-item receipts? (recommended)
 */
