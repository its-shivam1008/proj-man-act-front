"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Plus, Trash2, Edit2, FileText, DollarSign } from "lucide-react";
import {
    getFromStorage,
    saveToStorage,
    generateId,
    STORAGE_KEYS,
} from "../../../utils/localStorage";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

// ---- Types ----
type Milestone = {
    id: string;
    name: string;
    percent: number;
    value: number;
    billed: number;
    balance: number;
};

type Invoice = {
    id: string;
    milestoneId?: string;
    milestoneName?: string;
    date: string;
    amount: number;
    status: "Pending" | "Approved" | "Paid";
    createdAt: string;
    updatedAt: string;
};

// ---- Storage helpers ----
const getMilestones = () =>
    (getFromStorage<Partial<Milestone>[]>(STORAGE_KEYS.MILESTONES) || []).map((m) => {
        const value = Number(m.value) || 0;
        const billed = Number(m.billed) || 0;
        return {
            id: m.id || generateId(),
            name: m.name || "Unnamed",
            percent: Number(m.percent) || 0,
            value,
            billed,
            balance: value - billed,
        };
    });


const saveMilestones = (list: Milestone[]) => saveToStorage(STORAGE_KEYS.MILESTONES, list);

const getInvoices = () => getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES) || [];
const saveInvoices = (list: Invoice[]) => saveToStorage(STORAGE_KEYS.INVOICES, list);

export default function BillingPage() {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Milestone | null>(null);
    const [form, setForm] = useState<Partial<Milestone>>({ percent: 0, value: 0 });

    // ---- load ----
    useEffect(() => {
        setMilestones(getMilestones());
        setInvoices(getInvoices());
    }, []);

    // ---- persist helpers ----
    const persistMilestones = (list: Milestone[]) => {
        setMilestones(list);
        saveMilestones(list);
    };
    const persistInvoices = (list: Invoice[]) => {
        setInvoices(list);
        saveInvoices(list);
    };

    // ---- CRUD for milestones ----
    const openCreate = () => {
        setEditing(null);
        setForm({ percent: 0, value: 0 });
        setIsDialogOpen(true);
    };

    const openEdit = (m: Milestone) => {
        setEditing(m);
        setForm(m);
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.name || !form.value) return;
        const billed = Number(form.billed) || 0;
        const value = Number(form.value) || 0;
        const balance = value - billed;

        const now = new Date().toISOString();

        if (editing) {
            const updated = milestones.map((m) =>
                m.id === editing.id
                    ? { ...m, ...form, billed, balance }
                    : m
            );
            persistMilestones(updated);
        } else {
            const newMilestone: Milestone = {
                id: generateId(),
                name: form.name!,
                percent: form.percent || 0,
                value: form.value || 0,
                billed,
                balance,
            };
            persistMilestones([...milestones, newMilestone]);
        }
        setIsDialogOpen(false);
        setEditing(null);
        setForm({ percent: 0, value: 0 });
    };

    const handleDelete = (id: string) => {
        const updated = milestones.filter((m) => m.id !== id);
        persistMilestones(updated);
    };

    // ---- Generate Invoice ----
    const generateInvoice = (m?: Milestone) => {
        const now = new Date().toISOString();
        const target = m || milestones.find((x) => x.balance > 0);
        if (!target) return window.alert("No milestone to invoice.");

        const invoice: Invoice = {
            id: generateId(),
            milestoneId: target.id,
            milestoneName: target.name,
            date: now.slice(0, 10),
            amount: target.balance,
            status: "Pending",
            createdAt: now,
            updatedAt: now,
        };
        persistInvoices([...invoices, invoice]);

        // mark milestone as billed
        const updated = milestones.map((x) =>
            x.id === target.id ? { ...x, billed: x.value, balance: 0 } : x
        );
        persistMilestones(updated);
    };

    // ---- Chart Data ----
    const invoicePaymentData = useMemo(() => {
        return (invoices || []).map((inv) => ({
            date: inv.date,
            invoice: inv.amount,
            payment: inv.status === "Paid" ? inv.amount : 0,
        }));
    }, [invoices]);

    const forecastData = useMemo(() => {
        const cumulative: Record<string, number> = {};
        milestones.forEach((m) => {
            cumulative[m.name] = m.value;
        });
        return Object.entries(cumulative).map(([name, val]) => ({
            milestone: name,
            value: val,
        }));
    }, [milestones]);

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Billing & Invoicing</h2>
                    <p className="text-muted-foreground">
                        Link project progress with client billing and invoices.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add Milestone
                    </Button>
                    <Button variant="outline" onClick={() => generateInvoice()}>
                        <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                    </Button>
                </div>
            </div>

            {/* Milestone Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Milestones ({milestones.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Milestone</TableHead>
                                <TableHead>%</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Billed</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {milestones.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell>{m.name}</TableCell>
                                    <TableCell>{m.percent}%</TableCell>
                                    <TableCell>₹{(m.value ?? 0).toLocaleString()}</TableCell>
                                    <TableCell>₹{(m.billed ?? 0).toLocaleString()}</TableCell>
                                    <TableCell>₹{(m.balance ?? 0).toLocaleString()}</TableCell>

                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}>
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                            <Button size="sm" onClick={() => generateInvoice(m)}>
                                                <FileText className="h-4 w-4 mr-2" /> Invoice
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {milestones.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                            No milestones yet. Add your first one.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invoice Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoices ({invoices.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Milestone</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell>{inv.date}</TableCell>
                                    <TableCell>{inv.milestoneName || "—"}</TableCell>
                                    <TableCell>₹{(Number(inv.amount) || 0).toLocaleString()}</TableCell>

                                    <TableCell>
                                        <Badge
                                            variant={
                                                inv.status === "Paid"
                                                    ? "default"
                                                    : inv.status === "Approved"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                        >
                                            {inv.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {invoices.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                            No invoices generated yet.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Invoice vs Payment */}
                <Card className="min-h-[350px]">
                    <CardHeader>
                        <CardTitle>Invoice vs Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] min-h-[300px]">
                        <div className="w-full h-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={invoicePaymentData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="invoice" name="Invoiced" />
                                    <Bar dataKey="payment" name="Paid" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>


                {/* Billing Forecast */}
                <Card className="h-[350px]">
                    <CardHeader>
                        <CardTitle>Billing Forecast</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecastData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="milestone" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="value" name="Value" stroke="#8884d8" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog: Add / Edit Milestone */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <span />
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
                        <DialogDescription>Define project billing milestone.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label>Milestone Name</Label>
                            <Input
                                value={form.name || ""}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>% of Project</Label>
                            <Input
                                type="number"
                                value={form.percent ?? 0}
                                onChange={(e) =>
                                    setForm({ ...form, percent: parseFloat(e.target.value || "0") })
                                }
                            />
                        </div>
                        <div>
                            <Label>Value (₹)</Label>
                            <Input
                                type="number"
                                value={form.value ?? 0}
                                onChange={(e) =>
                                    setForm({ ...form, value: parseFloat(e.target.value || "0") })
                                }
                            />
                        </div>
                        <div>
                            <Label>Billed (₹)</Label>
                            <Input
                                type="number"
                                value={form.billed ?? 0}
                                onChange={(e) =>
                                    setForm({ ...form, billed: parseFloat(e.target.value || "0") })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editing ? "Save Changes" : "Add Milestone"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/*
Notes:
- Relies on localStorage helpers: getFromStorage, saveToStorage, generateId, STORAGE_KEYS.
  STORAGE_KEYS should include:
  {
    MILESTONES: "milestones",
    INVOICES: "invoices"
  }
- "Generate Invoice" simulates pulling data from Finance and marks milestone as billed.
- You can expand Invoice status change (approve/pay) with a small action button if needed.
- Install Recharts: `npm i recharts`.
- Styling uses ShadCN UI components.
*/
