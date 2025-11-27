import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import {
    Card, CardContent, CardHeader, CardTitle
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/table";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogContent } from "../../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import { Plus, Download, Barcode, Package, RefreshCw, CheckCircle, FileText, ShieldAlert } from "lucide-react";
import {
    ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from "recharts";

// Generate random ID
const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export default function MaterialIssue() {
    const canView = usePermission("materialIssueConsumption", "view");
    const canCreate = usePermission("materialIssueConsumption", "create");
    const canEdit = usePermission("materialIssueConsumption", "edit");
    const canDelete = usePermission("materialIssueConsumption", "delete");
    if (!canView) {
        return (
            <div className="text-center py-12 px-4">
                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Access Denied
                </h3>
                <p className="text-gray-600">
                    You do not have the necessary permissions to view this page.
                </p>
            </div>
        );
    }
    const [issueSlips, setIssueSlips] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<any>({
        workOrderId: "",
        items: [],
        remarks: "",
        autoBackflush: false,
    });

    // Data sources
    const workOrders = storage.get(STORAGE_KEYS.WORK_ORDERS, []);
    const boms = storage.get(STORAGE_KEYS.BOMS, []);
    const inventory = storage.get(STORAGE_KEYS.INVENTORY, {});
    const items = storage.get(STORAGE_KEYS.ITEMS, []);

    const ledger = storage.get(STORAGE_KEYS.INVENTORY_LEDGER, []);
    const wip = storage.get(STORAGE_KEYS.WIP_INVENTORY, {});

    useEffect(() => {
        setIssueSlips(storage.get(STORAGE_KEYS.ISSUE_SLIPS, []));
    }, []);

    useEffect(() => {
        storage.set(STORAGE_KEYS.ISSUE_SLIPS, issueSlips);
    }, [issueSlips]);

    /* -------------------- Helpers -------------------- */
    const getBOMItems = (workOrderId: string) => {
        const wo = workOrders.find((w: any) => w.id === workOrderId);
        if (!wo || !wo.bomId) return [];
        const bom = boms.find((b: any) => b.id === wo.bomId);
        if (!bom) return [];
        return (bom.lines || []).map((ln: any) => {
            const stock = Number(inventory[ln.itemId] || 0);
            const required = Number(ln.qty) * Number(wo.quantity);
            return {
                itemId: ln.itemId,
                itemName: (items.find((i: any) => i.id === ln.itemId)?.name) || ln.itemId,
                required,
                available: stock,
                issueQty: Math.min(stock, required),
            };
        });
    };

    const handleSelectWorkOrder = (id: string) => {
        const list = getBOMItems(id);
        setForm({ ...form, workOrderId: id, items: list });
    };

    const totalValue = (list: any[]) => {
        return list.reduce((s, i) => s + (Number(i.issueQty) * Number(i.rate || 1)), 0);
    };

    const handleIssue = () => {
        if (!form.items.length) return alert("Add at least one material to issue");


        // Deduct issued quantities from INVENTORY
        const inv = { ...inventory };
        const ledgerEntries: any[] = [];

        form.items.forEach((i: any) => {
            const prev = Number(inv[i.itemId] || 0);
            const newQty = Math.max(0, prev - i.issueQty);
            inv[i.itemId] = newQty;

            ledgerEntries.push({
                id: genId("lg"),
                date: new Date().toISOString(),
                type: "ISSUE",
                itemId: i.itemId,
                qty: i.issueQty,
                balance: newQty,
                reference: form.workOrderId,
            });
        });

        storage.set(STORAGE_KEYS.INVENTORY, inv);
        storage.set(STORAGE_KEYS.INVENTORY_LEDGER, [...ledger, ...ledgerEntries]);

        // Add to WIP
        const wipInv = { ...wip };
        form.items.forEach((i: any) => {
            wipInv[i.itemId] = (wipInv[i.itemId] || 0) + i.issueQty;
        });
        storage.set(STORAGE_KEYS.WIP_INVENTORY, wipInv);

        const newSlip = {
            id: genId("slip"),
            workOrderId: form.workOrderId,
            date: new Date().toISOString(),
            items: form.items,
            remarks: form.remarks,
            autoBackflush: form.autoBackflush,
            value: totalValue(form.items),
        };

        setIssueSlips([...issueSlips, newSlip]);
        alert("Material Issue Slip generated!");

        if (form.autoBackflush) {
            handleBackflush(newSlip);
        }

        setOpen(false);
    };

    const handleBackflush = (slip: any) => {
        // Move WIP → consumption (simulate)
        const wipInv = { ...wip };
        const ledgerEntries: any[] = [];

        slip.items.forEach((i: any) => {
            wipInv[i.itemId] = Math.max(0, (wipInv[i.itemId] || 0) - i.issueQty);

            ledgerEntries.push({
                id: genId("lg"),
                date: new Date().toISOString(),
                type: "CONSUMPTION",
                itemId: i.itemId,
                qty: i.issueQty,
                balance: wipInv[i.itemId],
                reference: slip.workOrderId,
            });
        });

        storage.set(STORAGE_KEYS.WIP_INVENTORY, wipInv);
        storage.set(STORAGE_KEYS.INVENTORY_LEDGER, [...ledger, ...ledgerEntries]);
        alert("Backflush completed — materials consumed.");
    };

    const removeSlip = (id: string) => {
        if (!confirm("Delete this slip?")) return;
        setIssueSlips(issueSlips.filter((s) => s.id !== id));
    };

    /* -------------------- Charts -------------------- */
    const issueTrend = useMemo(() => {
        const map: Record<string, number> = {};
        issueSlips.forEach((s) => {
            const d = s.date.slice(0, 10);
            map[d] = (map[d] || 0) + s.value;
        });
        return Object.entries(map).map(([date, value]) => ({ date, value }));
    }, [issueSlips]);

    const wipPie = useMemo(() => {
        const entries = Object.entries(wip);
        return entries.map(([id, qty]) => ({
            name: (items.find((i: any) => i.id === id)?.name) || id,
            value: qty,
        }));
    }, [wip, items]);

    const COLORS = ["#82ca9d", "#8884d8", "#ffc658", "#ff7f7f", "#a0aec0"];

    /* -------------------- Render -------------------- */
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Material Issue & Consumption</h2>
                    <p className="text-muted-foreground">Issue raw materials to shop floor and record consumption.</p>
                </div>
                <Button
                    disabled={!canCreate}
                    onClick={() => canCreate && setOpen(true)}
                    className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                >
                    <Plus className="mr-2 h-4 w-4" /> New Issue Slip
                </Button>
            </div>

            <Tabs defaultValue="issue">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger value="issue">Issue Slips</TabsTrigger>
                    <TabsTrigger value="ledger">Inventory Ledger</TabsTrigger>
                    <TabsTrigger value="wip">WIP Summary</TabsTrigger>
                </TabsList>

                {/* Issue Slips */}
                <TabsContent value="issue">
                    <Card>
                        <CardHeader><CardTitle>Issue History ({issueSlips.length})</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Work Order</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Backflush</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issueSlips.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell>{s.date.slice(0, 10)}</TableCell>
                                            <TableCell>{s.workOrderId}</TableCell>
                                            <TableCell>{s.items.length}</TableCell>
                                            <TableCell>₹{s.value.toFixed(2)}</TableCell>
                                            <TableCell>{s.autoBackflush ? <Badge>Auto</Badge> : "Manual"}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        disabled={!canEdit}
                                                        onClick={() => canEdit && handleBackflush(s)}
                                                        className={canEdit ? "" : "opacity-50 cursor-not-allowed"}
                                                        title="Backflush"
                                                    >
                                                        <RefreshCw />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        disabled={!canDelete}
                                                        onClick={() => canDelete && removeSlip(s.id)}
                                                        className={canDelete ? "" : "opacity-50 cursor-not-allowed"}
                                                    >
                                                        <Package />
                                                    </Button>

                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                        <Card>
                            <CardHeader><CardTitle>Issued Value Trend</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={issueTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="value" stroke="#8884d8" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Inventory Ledger */}
                <TabsContent value="ledger">
                    <Card>
                        <CardHeader><CardTitle>Inventory Ledger</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Reference</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ledger.slice(-100).reverse().map((l: any) => (
                                        <TableRow key={l.id}>
                                            <TableCell>{l.date.slice(0, 10)}</TableCell>
                                            <TableCell>{l.type}</TableCell>
                                            <TableCell>{l.itemId}</TableCell>
                                            <TableCell>{l.qty}</TableCell>
                                            <TableCell>{l.balance}</TableCell>
                                            <TableCell>{l.reference}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* WIP Summary */}
                <TabsContent value="wip">
                    <Card>
                        <CardHeader><CardTitle>Work in Progress (WIP)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Qty</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Object.keys(wip).length === 0 ? (
                                                <TableRow><TableCell colSpan={2} className="text-center">No WIP materials</TableCell></TableRow>
                                            ) : (
                                                Object.entries(wip).map(([id, qty]) => (
                                                    <TableRow key={id}>
                                                        <TableCell>{(items.find((i: any) => i.id === id)?.name) || id}</TableCell>
                                                        <TableCell>{qty}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={wipPie} dataKey="value" nameKey="name" outerRadius={90} label>
                                                {wipPie.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialog: Issue Form */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>New Material Issue Slip</DialogTitle></DialogHeader>
                    <div
                        className="space-y-3"
                        style={{
                            pointerEvents: canCreate ? "auto" : "none",
                            opacity: canCreate ? 1 : 0.6,
                        }}
                    >
                        <div>
                            <Label>Work Order</Label>
                            <select
                                value={form.workOrderId}
                                onChange={(e) => handleSelectWorkOrder(e.target.value)}
                                className="border rounded-md px-2 py-1 w-full"
                            >
                                <option value="">Select Work Order</option>
                                {workOrders.map((w: any) => (
                                    <option key={w.id} value={w.id}>{w.orderNo} — {w.productName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Barcode / QR Input</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Scan or enter item code"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const code = (e.target as HTMLInputElement).value.trim();
                                            const match = form.items.find((i: any) => i.itemId === code);
                                            if (match) {
                                                match.issueQty = Math.min(match.issueQty + 1, match.available);
                                                setForm({ ...form, items: [...form.items] });
                                            }
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }}
                                />
                                <Barcode className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>

                        <div>
                            <Label>Items to Issue</Label>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Available</TableHead>
                                        <TableHead>Issue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.items.map((i: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell>{i.itemName}</TableCell>
                                            <TableCell>{i.required}</TableCell>
                                            <TableCell>{i.available}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={i.issueQty}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        i.issueQty = Math.min(val, i.available);
                                                        setForm({ ...form, items: [...form.items] });
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.autoBackflush}
                                onChange={(e) => setForm({ ...form, autoBackflush: e.target.checked })}
                            />
                            <Label>Enable Auto Backflush</Label>
                        </div>

                        <div>
                            <Label>Remarks</Label>
                            <Input
                                value={form.remarks}
                                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!canCreate}
                            onClick={() => canCreate && handleIssue()}
                            className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                        >

                            <CheckCircle className="mr-2 h-4 w-4" /> Issue Materials</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
