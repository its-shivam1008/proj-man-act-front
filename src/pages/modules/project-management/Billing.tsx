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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Plus, Trash2, Edit2, FileText, DollarSign, Loader2 } from "lucide-react";
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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store"; 
import { Milestone, Invoice } from "@/types/billing"; 
import {
    fetchMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    fetchInvoices,
    createInvoice,
} from "@/redux/slices/billingSlice";
import { fetchProjects } from "@/redux/slices/projectSlice"; 
import { Project } from "@/types/project";

export default function BillingPage() {
    const dispatch = useDispatch();
    const { milestones, invoices, loading: billingLoading } = useSelector((state: RootState) => state.billing);
    const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
    const loading = billingLoading || projectsLoading;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Milestone | null>(null);
    const [form, setForm] = useState<Partial<Milestone & { projectId: string }>>({ percent: 0, value: 0 });
    const userId = localStorage.getItem('userId') 
    useEffect(() => {
        if(userId){
            dispatch(fetchProjects()); // Removed userId arg; thunk handles localStorage internally
        }
        dispatch(fetchMilestones());
        dispatch(fetchInvoices());
        
    }, [dispatch , userId]);

    // CRUD for milestones
    const openCreate = () => {
        setEditing(null);
        setForm({ percent: 0, value: 0 });
        setIsDialogOpen(true);
    };

    const openEdit = (m: Milestone) => {
        setEditing(m);
        setForm({ ...m, projectId: m.projectId });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name || typeof form.value !== "number" || !form.projectId || !userId || userId.trim() === '') {
            alert("Please select a project and fill required fields. Ensure you are logged in.");
            return;
        }
        const billed = Number(form.billed) || 0;
        const value = Number(form.value) || 0;
        const balance = value - billed;

        if (editing) {
            await dispatch(
                updateMilestone({
                    id: editing._id,
                    payload: { ...form, billed, balance, projectId: editing.projectId }, // Preserve original projectId
                })
            );
        } else {
            const newMilestone: Omit<Milestone, "_id" | "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string; projectId: string; userId: string } = {
                name: form.name!,
                userId: userId.trim(),  // Trim to ensure no whitespace issues
                percent: form.percent || 0,
                value,
                billed,
                balance,
                projectId: form.projectId,
                
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await dispatch(createMilestone(newMilestone));
        }
        setIsDialogOpen(false);
        setEditing(null);
        setForm({ percent: 0, value: 0 });
    };

    const handleDelete = (id: string) => {
        dispatch(deleteMilestone(id));
    };

    // Generate Invoice
    const generateInvoice = async (m?: Milestone) => {
        const safeMilestones = (milestones || []).filter(Boolean);
        const target = m || safeMilestones.find((x) => (x as Milestone).balance > 0);
        if (!target) return window.alert("No milestone to invoice.");

        const now = new Date().toISOString();
        const invoice: Omit<Invoice, "_id" | "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string } = {
            milestoneId: (target as Milestone)._id,
            milestoneName: (target as Milestone).name,
            date: now.slice(0, 10),
            amount: (target as Milestone).balance,
            status: "Pending",
            createdAt: now,
            updatedAt: now,
        };
        await dispatch(createInvoice(invoice));

        // Update milestone as fully billed
        await dispatch(
            updateMilestone({
                id: (target as Milestone)._id,
                payload: { billed: (target as Milestone).value, balance: 0 },
            })
        );
    };

    // Chart Data
    const invoicePaymentData = useMemo(() => {
        const safeInvoices = (invoices || []).filter(Boolean);
        return safeInvoices.map((inv) => ({
            date: (inv as Invoice).date,
            invoice: (inv as Invoice).amount,
            payment: (inv as Invoice).status === "Paid" ? (inv as Invoice).amount : 0,
        }));
    }, [invoices]);

    const forecastData = useMemo(() => {
        const safeMilestones = (milestones || []).filter(m => m && (m as Milestone).name);
        const cumulative: Record<string, number> = {};
        safeMilestones.forEach((m) => {
            const milestone = m as Milestone;
            cumulative[milestone.name] = milestone.value || 0;
        });
        return Object.entries(cumulative).map(([name, val]) => ({
            milestone: name,
            value: val,
        }));
    }, [milestones]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!userId || userId.trim() === '') {
        return <div className="text-center py-8 text-destructive">Please log in to access Billing.</div>;
    }

    const safeMilestones = (milestones || []).filter(Boolean);

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
                    <CardTitle>Milestones ({safeMilestones.length})</CardTitle>
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
                                <TableHead>Project</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {safeMilestones.map((m) => {
                                const milestone = m as Milestone;
                                const project = projects.find(p => p._id === milestone.projectId);
                                return (
                                    <TableRow key={milestone._id}>
                                        <TableCell>{milestone.name}</TableCell>
                                        <TableCell>{milestone.percent}%</TableCell>
                                        <TableCell>₹{(milestone.value ?? 0).toLocaleString()}</TableCell>
                                        <TableCell>₹{(milestone.billed ?? 0).toLocaleString()}</TableCell>
                                        <TableCell>₹{(milestone.balance ?? 0).toLocaleString()}</TableCell>
                                        <TableCell>{project?.name || "—"}</TableCell>

                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => openEdit(milestone)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(milestone._id)}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                                <Button size="sm" onClick={() => generateInvoice(milestone)}>
                                                    <FileText className="h-4 w-4 mr-2" /> Invoice
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    {safeMilestones.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                            No milestones yet. Add your first one.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invoice Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoices ({invoices?.length || 0})</CardTitle>
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
                            {(invoices || []).filter(Boolean).map((inv) => {
                                const invoice = inv as Invoice;
                                return (
                                    <TableRow key={invoice._id}>
                                        <TableCell>{invoice.date}</TableCell>
                                        <TableCell>{invoice.milestoneName || "—"}</TableCell>
                                        <TableCell>₹{(Number(invoice.amount) || 0).toLocaleString()}</TableCell>

                                        <TableCell>
                                            <Badge
                                                variant={
                                                    invoice.status === "Paid"
                                                        ? "default"
                                                        : invoice.status === "Approved"
                                                            ? "secondary"
                                                            : "outline"
                                                }
                                            >
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    {(invoices || []).length === 0 && (
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
                            <Label>Project *</Label>
                            <Select
                                value={form.projectId || ""}
                                onValueChange={(val) => setForm({ ...form, projectId: val })}
                                disabled={!!editing} // Disable for edit to preserve
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(projects || []).map((p: Project) => (
                                        <SelectItem key={p._id} value={p._id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Milestone Name *</Label>
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
                            <Label>Value (₹) *</Label>
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