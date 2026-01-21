"use client";
import { fetchWbsByIds, fetchWbsByProject } from "@/redux/slices/wbsSlice";
import { fetchBillsByWbs, deleteBill } from "@/redux/slices/wbsBillSlice";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Plus, Trash2, Edit2, FileText, Loader2, ShieldAlert, Download, Eye } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Milestone, Invoice } from "@/types/billing";
import { fetchMilestones, createMilestone, updateMilestone, deleteMilestone, fetchInvoices, createInvoice, fetchPaginatedMilestones } from "@/redux/slices/billingSlice";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { usePermission } from "@/hooks/userPermission";

export default function BillingPage() {
    const dispatch = useDispatch();
    const { milestones, invoices, loading: billingLoading, totalPages } = useSelector((state: RootState) => state.billing);
    const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
    const { bills: wbsBills, loading: billLoading } = useSelector((state: RootState) => state.wbsBill);

    const loading = billingLoading || projectsLoading;

    // Permissions
    const canView = usePermission('billings', 'view');
    const canCreate = usePermission('billings', 'create');
    const canEdit = usePermission('billings', 'edit');
    const canDelete = usePermission('billings', 'delete');

    // Milestone States
    const [wbsList, setWbsList] = useState([]);
    const [selectedWbs, setSelectedWbs] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Milestone | null>(null);
    const [form, setForm] = useState<Partial<Milestone>>({
        percent: 0,
        value: 0,
        billed: 0,
    });

    // Invoice States
    const [invoiceOpen, setInvoiceOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>(null);

    // WBS Bill States
    const [wbsBillProject, setWbsBillProject] = useState("");
    const [wbsBillWbs, setWbsBillWbs] = useState("");
    const [wbsBillList, setWbsBillList] = useState([]);
    const [billDialogOpen, setBillDialogOpen] = useState(false);
    const [activeWbsId, setActiveWbsId] = useState<string | null>(null);
    const [previewBill, setPreviewBill] = useState<any>(null);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [searchDebounce, setSearchDebounce] = useState("");
    const [projectId, setProjectId] = useState("");

    const safeMilestones = Array.isArray(milestones) ? milestones.filter(Boolean) : [];
    const safeInvoices = Array.isArray(invoices) ? invoices.filter(Boolean) : [];
    const safeProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];
    const safeWbsBills = Array.isArray(wbsBills) ? wbsBills.filter(Boolean) : [];

    const organisationId = localStorage.getItem("organisationId") || "";

    // Debounce search
    useEffect(() => {
        const delay = setTimeout(() => {
            setSearchDebounce(search);
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    // Fetch paginated milestones
    useEffect(() => {
        if (organisationId) {
            dispatch(fetchPaginatedMilestones({
                page,
                limit,
                search: searchDebounce,
                projectId,
                organisationId,
            }));
        }
    }, [page, searchDebounce, projectId, organisationId, dispatch]);

    // Fetch initial data
    useEffect(() => {
        if (organisationId) {
            dispatch(fetchInvoices({ organisationId }));
        }
        dispatch(fetchProjects({ page: 1, limit: 999, search: "", status: "" }));
    }, [dispatch , organisationId]);

    // Fetch WBS for selected project in milestone form
    useEffect(() => {
        if (form.projectId) {
            dispatch(fetchWbsByProject(form.projectId))
                .unwrap()
                .then((res) => setWbsList(Array.isArray(res) ? res : []))
                .catch(() => setWbsList([]));
        } else {
            setWbsList([]);
            setSelectedWbs([]);
        }
    }, [form.projectId, dispatch]);

    // Fetch WBS for WBS Bill tab
    useEffect(() => {
        if (wbsBillProject) {
            dispatch(fetchWbsByProject(wbsBillProject))
                .unwrap()
                .then((res) => setWbsBillList(Array.isArray(res) ? res : []))
                .catch(() => setWbsBillList([]));
        } else {
            setWbsBillList([]);
            setWbsBillWbs("");
        }
    }, [wbsBillProject, dispatch]);

    // Fetch bills for selected WBS
    useEffect(() => {
        if (wbsBillWbs) {
            dispatch(fetchBillsByWbs(wbsBillWbs));
        }
    }, [wbsBillWbs, dispatch]);

    // Auto-adjust page if empty
    useEffect(() => {
        if (safeMilestones.length === 0 && page > 1 && !loading) {
            setPage(page - 1);
        }
    }, [safeMilestones.length, page, loading]);

    // Handlers
    const openCreate = useCallback(() => {
        setEditing(null);
        setForm({ percent: 0, value: 0, billed: 0 });
        setSelectedWbs([]);
        setIsDialogOpen(true);
    }, []);

    const openEdit = useCallback((m: Milestone) => {
        setEditing(m);
        setForm({
            ...m,
            projectId: m.projectId,
            percent: m.percent ?? 0,
            value: m.value ?? 0,
            billed: m.billed ?? 0,
        });
        setSelectedWbs(m.wbsIds || []);
        setIsDialogOpen(true);
    }, []);

    const handleSave = async () => {
        if (!form.name || !form.projectId || (form.value ?? 0) <= 0) {
            alert("Please fill Milestone Name, select a Project, and enter a valid Value.");
            return;
        }

        const billed = Number(form.billed) || 0;
        const value = Number(form.value) || 0;
        const balance = value - billed;

        try {
            if (editing) {
                await dispatch(updateMilestone({
                    id: editing._id,
                    payload: { ...form, billed, balance, wbsIds: selectedWbs },
                })).unwrap();
            } else {
                const newMilestone = {
                    name: form.name!,
                    organisationId,
                    percent: Number(form.percent) || 0,
                    value,
                    billed,
                    balance,
                    projectId: form.projectId!,
                    wbsIds: selectedWbs,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                await dispatch(createMilestone(newMilestone)).unwrap();
            }

            await dispatch(fetchPaginatedMilestones({
                page,
                limit,
                search: searchDebounce,
                projectId,
                organisationId,
            }));

            setIsDialogOpen(false);
            setEditing(null);
            setForm({ percent: 0, value: 0, billed: 0 });
            setSelectedWbs([]);
        } catch (error) {
            console.error("Failed to save milestone:", error);
            alert("Failed to save milestone. Please try again.");
        }
    };

    const handleDelete = useCallback((id: string) => {
        if (confirm("Are you sure you want to delete this milestone?")) {
            dispatch(deleteMilestone(id));
        }
    }, [dispatch]);

    const generateInvoice = async (m?: Milestone) => {
        const target = m || safeMilestones.find(
            (x: Milestone) => (x.balance ?? 0) > 0
        );

        if (!target) {
            alert("No milestone with remaining balance found to invoice.");
            return;
        }

        const now = new Date().toISOString();

        const invoice = {
            milestoneId: target._id,
            organisationId,
            milestoneName: target.name,
            date: now.slice(0, 10),
            amount: target.balance ?? 0,
            status: "Pending" as const,
        };

        try {
            // ✅ ONLY CREATE INVOICE
            await dispatch(createInvoice(invoice)).unwrap();

            // ✅ REFRESH DATA
            await dispatch(fetchInvoices({ organisationId })).unwrap();
            await dispatch(fetchPaginatedMilestones({
                page,
                limit,
                search: searchDebounce,
                projectId,
                organisationId,
            })).unwrap();

        } catch (error) {
            console.error("Failed to generate invoice:", error);
            alert("Failed to generate invoice.");
        }
    };



    const openInvoicePreview = async (milestone: Milestone) => {
        if (!milestone.wbsIds || milestone.wbsIds.length === 0) {
            alert("No WBS linked with this milestone");
            return;
        }

        try {
            const wbsItems = await dispatch(fetchWbsByIds(milestone.wbsIds)).unwrap();
            const totalAmount = wbsItems.reduce((sum: number, w: any) => sum + (w.plannedCost || 0), 0);

            setInvoiceData({
                project: safeProjects.find(p => p._id === milestone.projectId),
                milestone,
                wbsItems: Array.isArray(wbsItems) ? wbsItems : [],
                totalAmount,
                invoice: {
                    date: new Date().toISOString().slice(0, 10),
                    status: "Pending",
                },
            });
            setInvoiceOpen(true);
        } catch (error) {
            console.error("Failed to fetch WBS items:", error);
            alert("Failed to load invoice preview.");
        }
    };

    const downloadInvoicePDF = () => {
        if (!invoiceData) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(20);
        doc.text("INVOICE", pageWidth / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.text(`Date: ${invoiceData.invoice.date}`, 20, 35);
        doc.text(`Status: ${invoiceData.invoice.status}`, 20, 42);

        // Project & Milestone
        doc.setFontSize(12);
        doc.text("Project:", 20, 55);
        doc.setFontSize(10);
        doc.text(invoiceData.project?.name || "N/A", 20, 62);

        doc.setFontSize(12);
        doc.text("Milestone:", 20, 72);
        doc.setFontSize(10);
        doc.text(invoiceData.milestone.name, 20, 79);

        // Table
        const tableData = invoiceData.wbsItems.map((w: any) => [
            w.name,
            `${w.duration} days`,
            `${w.progress}%`,
            `₹${(w.plannedCost || 0).toLocaleString("en-IN")}`,
        ]);

        autoTable(doc, {
            startY: 90,
            head: [["WBS", "Duration", "Progress", "Cost"]],
            body: tableData,
            foot: [["", "", "Total Amount", `₹${invoiceData.totalAmount.toLocaleString("en-IN")}`]],
            theme: "grid",
        });

        doc.save(`invoice-${invoiceData.milestone.name}.pdf`);
    };

    const downloadBillImage = async (imageUrl: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = "WBS-Bill.jpg";
            link.click();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Failed to download bill image:", error);
            alert("Failed to download bill image.");
        }
    };

    const handleDeleteBill = useCallback((billId: string) => {
        if (confirm("Are you sure you want to delete this bill?")) {
            dispatch(deleteBill(billId))
                .unwrap()
                .then(() => {
                    if (wbsBillWbs) {
                        dispatch(fetchBillsByWbs(wbsBillWbs));
                    }
                })
                .catch((error) => {
                    console.error("Failed to delete bill:", error);
                    alert("Failed to delete bill.");
                });
        }
    }, [dispatch, wbsBillWbs]);

    // Chart data
    const invoicePaymentData = useMemo(() => {
        return safeInvoices.map((inv: Invoice) => ({
            date: inv.date,
            invoice: inv.amount,
            payment: inv.status === "Paid" ? inv.amount : 0,
        }));
    }, [safeInvoices]);

    const forecastData = useMemo(() => {
        return safeMilestones.map((m) => ({
            milestone: m.name,
            value: m.value || 0,
        }));
    }, [safeMilestones]);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Permission check
    if (!canView) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <ShieldAlert className="h-16 w-16 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have the necessary permissions to view this page.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Billing & Invoicing</h1>
                    <p className="text-muted-foreground">Link project progress with client billing and invoices.</p>
                </div>
                <div className="flex gap-2">
                    {canCreate && (
                        <>
                            <Button onClick={openCreate}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Milestone
                            </Button>
                            <Button onClick={() => generateInvoice()} variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Invoice
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Milestone Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
                        <DialogDescription>
                            {editing ? "Update milestone details" : "Create a new billing milestone"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Milestone Name</Label>
                            <Input
                                id="name"
                                value={form.name || ""}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g., Phase 1 Completion"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="project">Project</Label>
                            <Select
                                value={form.projectId || ""}
                                onValueChange={(v) => setForm({ ...form, projectId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeProjects.map((p) => (
                                        <SelectItem key={p._id} value={p._id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {wbsList.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Link WBS Items</Label>
                                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                                    {wbsList.map((wbs: any) => (
                                        <div key={wbs._id} className="flex items-center space-x-2 py-1">
                                            <input
                                                type="checkbox"
                                                id={`wbs-${wbs._id}`}
                                                checked={selectedWbs.includes(wbs._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedWbs([...selectedWbs, wbs._id]);
                                                    } else {
                                                        setSelectedWbs(selectedWbs.filter((id) => id !== wbs._id));
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <label htmlFor={`wbs-${wbs._id}`} className="text-sm cursor-pointer">
                                                {wbs.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="percent">Completion %</Label>
                                <Input
                                    id="percent"
                                    type="number"
                                    value={form.percent || 0}
                                    onChange={(e) => setForm({ ...form, percent: Number(e.target.value) })}
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="value">Total Value (₹)</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    value={form.value || 0}
                                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="billed">Amount Billed (₹)</Label>
                            <Input
                                id="billed"
                                type="number"
                                value={form.billed || 0}
                                onChange={(e) => setForm({ ...form, billed: Number(e.target.value) })}
                                min="0"
                                max={form.value || 0}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editing ? "Update" : "Create"} Milestone
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invoice Preview Dialog */}
            <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Invoice Preview</DialogTitle>
                    </DialogHeader>
                    {invoiceData && (
                        <div id="invoice" className="p-6 bg-white">
                            <div className="border-b pb-4 mb-6">
                                <h2 className="text-3xl font-bold text-center">INVOICE</h2>
                                <div className="flex justify-between mt-4 text-sm">
                                    <div>
                                        <p><strong>Date:</strong> {invoiceData.invoice.date}</p>
                                        <p><strong>Status:</strong> {invoiceData.invoice.status}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Project</h3>
                                    <p>{invoiceData.project?.name || "N/A"}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Milestone</h3>
                                    <p>{invoiceData.milestone.name}</p>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>WBS</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoiceData.wbsItems.map((w: any) => (
                                        <TableRow key={w._id}>
                                            <TableCell>{w.name}</TableCell>
                                            <TableCell>{w.duration} days</TableCell>
                                            <TableCell>{w.progress}%</TableCell>
                                            <TableCell className="text-right">
                                                ₹{(w.plannedCost || 0).toLocaleString("en-IN")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-6 flex justify-end">
                                <div className="w-64 border-t pt-4">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total Amount</span>
                                        <span>₹{invoiceData.totalAmount.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={downloadInvoicePDF}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bill Preview Dialog */}
            <Dialog open={!!previewBill} onOpenChange={(open) => !open && setPreviewBill(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Bill Preview</DialogTitle>
                    </DialogHeader>
                    {previewBill && (
                        <div className="space-y-4">
                            <img
                                src={previewBill.billImage.url}
                                alt="Bill"
                                className="w-full rounded-lg border"
                            />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-semibold">Total Amount</p>
                                    <p>₹{previewBill.billingDetails.totalAmount.toLocaleString("en-IN")}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">GST Withheld</p>
                                    <p>₹{previewBill.billingDetails.gstWithheld.toLocaleString("en-IN")}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Retention Withheld</p>
                                    <p>₹{previewBill.billingDetails.retentionWithheld.toLocaleString("en-IN")}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Status</p>
                                    <Badge>{previewBill.billingDetails.status}</Badge>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewBill(null)}>
                            Close
                        </Button>
                        {previewBill && (
                            <Button onClick={() => downloadBillImage(previewBill.billImage.url)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Image
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tabs */}
            <Tabs defaultValue="milestones" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="wbs-bills">WBS Bills</TabsTrigger>
                </TabsList>

                {/* Milestones Tab */}
                <TabsContent value="milestones" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Milestones ({safeMilestones.length})</CardTitle>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search milestones..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-64"
                                />
                                <Select value={projectId} onValueChange={(v) => {
                                    setProjectId(v);
                                    setPage(1);
                                }}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="All Projects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Projects</SelectItem>
                                        {safeProjects.map((p) => (
                                            <SelectItem key={p._id} value={p._id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {safeMilestones.map((m: Milestone) => {
                                        const project = safeProjects.find((p) => p._id === m.projectId);
                                        return (
                                            <TableRow key={m._id}>
                                                <TableCell className="font-medium">{m.name}</TableCell>
                                                <TableCell>{m.percent ?? 0}%</TableCell>
                                                <TableCell>₹{(m.value ?? 0).toLocaleString("en-IN")}</TableCell>
                                                <TableCell>₹{(m.billed ?? 0).toLocaleString("en-IN")}</TableCell>
                                                <TableCell className={(m.balance ?? 0) > 0 ? "text-green-600 font-semibold" : ""}>
                                                    ₹{(m.balance ?? 0).toLocaleString("en-IN")}
                                                </TableCell>
                                                <TableCell>{project?.name || "—"}</TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-2">
                                                        {canEdit && (
                                                            <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {canDelete && (
                                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(m._id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {(m.balance ?? 0) > 0 && (
                                                            <Button size="sm" variant="outline" onClick={() => generateInvoice(m)}>
                                                                Invoice
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="outline" onClick={() => openInvoicePreview(m)}>
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Bill
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {safeMilestones.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    No milestones yet. Click "Add Milestone" to create one.
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {page} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice vs Payment Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {invoicePaymentData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={invoicePaymentData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                                            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                                            <Legend />
                                            <Line type="monotone" dataKey="invoice" stroke="#8884d8" name="Invoice" />
                                            <Line type="monotone" dataKey="payment" stroke="#82ca9d" name="Payment" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                        No invoice data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Billing Forecast by Milestone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {forecastData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={forecastData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="milestone" />
                                            <YAxis tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                                            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                                            <Legend />
                                            <Bar dataKey="value" fill="#8884d8" name="Value" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                        No milestone data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoices ({safeInvoices.length})</CardTitle>
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
                                    {safeInvoices.map((inv: Invoice) => (
                                        <TableRow key={inv._id}>
                                            <TableCell>{inv.date}</TableCell>
                                            <TableCell>{inv.milestoneName || "—"}</TableCell>
                                            <TableCell>₹{Number(inv.amount).toLocaleString("en-IN")}</TableCell>
                                            <TableCell>
                                                <Badge variant={inv.status === "Paid" ? "default" : "secondary"}>
                                                    {inv.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {safeInvoices.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    No invoices generated yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* WBS Bills Tab */}
                <TabsContent value="wbs-bills" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>WBS Bills</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                View and manage bills associated with WBS items
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="wbs-project">Select Project</Label>
                                    <Select value={wbsBillProject} onValueChange={setWbsBillProject}>
                                        <SelectTrigger id="wbs-project">
                                            <SelectValue placeholder="Choose a project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {safeProjects.map((p) => (
                                                <SelectItem key={p._id} value={p._id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="wbs-item">Select WBS</Label>
                                    <Select
                                        value={wbsBillWbs}
                                        onValueChange={setWbsBillWbs}
                                        disabled={!wbsBillProject || wbsBillList.length === 0}
                                    >
                                        <SelectTrigger id="wbs-item">
                                            <SelectValue placeholder="Choose a WBS item" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wbsBillList.map((wbs: any) => (
                                                <SelectItem key={wbs._id} value={wbs._id}>
                                                    {wbs.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {billLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : wbsBillWbs && safeWbsBills.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Bills for Selected WBS</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {safeWbsBills.map((bill: any) => (
                                            <Card key={bill._id} className="overflow-hidden">
                                                <CardContent className="p-4 space-y-3">
                                                    <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                                                        {bill.billImage?.url ? (
                                                            <img
                                                                src={bill.billImage.url}
                                                                alt="Bill"
                                                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                                                                onClick={() => setPreviewBill(bill)}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <FileText className="h-12 w-12 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Total:</span>
                                                            <span className="font-semibold">
                                                                ₹{bill.billingDetails?.totalAmount?.toLocaleString("en-IN") || 0}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">GST:</span>
                                                            <span>₹{bill.billingDetails?.gstWithheld?.toLocaleString("en-IN") || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Retention:</span>
                                                            <span>
                                                                ₹{bill.billingDetails?.retentionWithheld?.toLocaleString("en-IN") || 0}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-muted-foreground">Status:</span>
                                                            <Badge variant={bill.billingDetails?.status === "Approved" ? "default" : "secondary"}>
                                                                {bill.billingDetails?.status || "Pending"}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                            onClick={() => setPreviewBill(bill)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                        {canDelete && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleDeleteBill(bill._id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ) : wbsBillWbs ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No bills found for this WBS item.
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    Select a project and WBS item to view bills.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// "use client";
// import { fetchWbsByIds, fetchWbsByProject } from "@/redux/slices/wbsSlice";
// import {
//     fetchBillsByWbs,
//     deleteBill,
// } from "@/redux/slices/wbsBillSlice";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// import React, { useEffect, useMemo, useState } from "react";
// import { Button } from "../../../components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "../../../components/ui/dialog";
// import { Input } from "../../../components/ui/input";
// import { Label } from "../../../components/ui/label";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "../../../components/ui/select";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
// import { Badge } from "../../../components/ui/badge";
// import { Plus, Trash2, Edit2, FileText, Loader2, ShieldAlert } from "lucide-react";
// import {
//     ResponsiveContainer,
//     BarChart,
//     Bar,
//     LineChart,
//     Line,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip,
//     Legend,
// } from "recharts";
// import { useDispatch, useSelector } from "react-redux";
// import { RootState } from "@/redux/store";
// import { Milestone, Invoice } from "@/types/billing";
// import {
//     fetchMilestones,
//     createMilestone,
//     updateMilestone,
//     deleteMilestone,
//     fetchInvoices,
//     createInvoice,
//     fetchPaginatedMilestones,
// } from "@/redux/slices/billingSlice";
// import { fetchProjects } from "@/redux/slices/projectSlice";
// import { usePermission } from "@/hooks/userPermission";

// export default function BillingPage() {
//     const dispatch = useDispatch();
//     const { milestones, invoices, loading: billingLoading, totalPages } = useSelector((state: RootState) => state.billing);
//     const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
//     const loading = billingLoading || projectsLoading;


//     const [wbsList, setWbsList] = useState<any[]>([]);
//     const [selectedWbs, setSelectedWbs] = useState<string[]>([]);
//     const [invoiceOpen, setInvoiceOpen] = useState(false);
//     const [invoiceData, setInvoiceData] = useState<any>(null);


//     const canView = usePermission('billings', 'view');
//     const canCreate = usePermission('billings', 'create');
//     const canEdit = usePermission('billings', 'edit');
//     const canDelete = usePermission('billings', 'delete');
//     const [searchDebounce, setSearchDebounce] = useState("");

//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const [editing, setEditing] = useState<Milestone | null>(null);
//     const [form, setForm] = useState<Partial<Milestone & { projectId: string }>>({
//         percent: 0,
//         value: 0,
//         billed: 0,
//     });
//     const [page, setPage] = useState(1);
//     const [limit, setLimit] = useState(10);
//     const [search, setSearch] = useState("");
//     const [projectId, setProjectId] = useState("");
//     const safeMilestones = milestones?.length ? milestones : [];

//     const { bills: wbsBills, loading: billLoading } = useSelector(
//         (state: RootState) => state.wbsBill
//     );


//     const [billDialogOpen, setBillDialogOpen] = useState(false);
//     const [activeWbsId, setActiveWbsId] = useState<string | null>(null);

//     const [previewBill, setPreviewBill] = useState<any>(null);



//     const safeProjects = (projects || []).filter(Boolean);

//     // Safely get from localStorage
//     const organisationId = localStorage.getItem("organisationId") || "";

//     useEffect(() => {
//         dispatch(fetchPaginatedMilestones({
//             page,
//             limit,
//             search: searchDebounce,
//             projectId,
//             organisationId,
//         }));
//     }, [page, searchDebounce, projectId]);


//     useEffect(() => {
//         if (form.projectId) {
//             dispatch(fetchWbsByProject(form.projectId))
//                 .unwrap()
//                 .then((res) => setWbsList(res || []));
//         } else {
//             setWbsList([]);
//             setSelectedWbs([]);
//         }
//     }, [form.projectId]);

//     useEffect(() => {
//         if (safeMilestones.length === 0 && page > 1 && !loading) {
//             setPage(page - 1);
//         }

//     }, [safeMilestones])
//     useEffect(() => {
//         // Fetch all required data
//         // dispatch(fetchMilestones());
//         dispatch(fetchInvoices());

//         // Correct way: pass object with pagination params
//         dispatch(
//             fetchProjects({
//                 page: 1,
//                 limit: 999,     // Fetch all or enough projects
//                 search: "",
//                 status: "",
//             })
//         );
//     }, [dispatch]);
//     useEffect(() => {
//         const delay = setTimeout(() => {
//             setSearchDebounce(search);
//         }, 300);

//         return () => clearTimeout(delay);
//     }, [search]);


//     const openCreate = () => {
//         setEditing(null);
//         setForm({ percent: 0, value: 0, billed: 0 });
//         setIsDialogOpen(true);
//     };

//     const openEdit = (m: Milestone) => {
//         setEditing(m);
//         setForm({
//             ...m,
//             projectId: m.projectId,
//             percent: m.percent ?? 0,
//             value: m.value ?? 0,
//             billed: m.billed ?? 0,
//         });
//         setIsDialogOpen(true);
//     };

//     // const downloadBillPdf = (bill: any) => {
//     //     if (!bill || !bill.billingDetails) {
//     //         alert("Billing details not available for this bill");
//     //         return;
//     //     }

//     //     const {
//     //         totalAmount = 0,
//     //         gstWithheld = 0,
//     //         retentionWithheld = 0,
//     //     } = bill.billingDetails;

//     //     const pdf = new jsPDF("p", "mm", "a4");

//     //     // ===== HEADER =====
//     //     pdf.setFontSize(16);
//     //     pdf.text("Your Company Name", 14, 20);

//     //     pdf.setFontSize(10);
//     //     pdf.text("GSTIN: 22AAAAA0000A1Z5", 14, 26);
//     //     pdf.text("Address Line 1, City", 14, 31);

//     //     // ===== BILL INFO =====
//     //     pdf.text(`Bill No: ${bill._id}`, 150, 20);
//     //     pdf.text(`Date: ${new Date().toLocaleDateString()}`, 150, 26);

//     //     // ===== CLIENT =====
//     //     pdf.setFontSize(11);
//     //     pdf.text("Bill To:", 14, 45);
//     //     pdf.setFontSize(10);
//     //     pdf.text(bill.project?.name || "Client Name", 14, 50);

//     //     // ===== TABLE =====
//     //     autoTable(pdf, {
//     //         startY: 60,
//     //         head: [["Description", "Amount (₹)"]],
//     //         body: [
//     //             ["Total Amount", totalAmount],
//     //             ["GST", gstWithheld],
//     //             ["Retention", retentionWithheld],
//     //         ],
//     //         styles: { fontSize: 10 },
//     //         headStyles: { fillColor: [30, 30, 30] },
//     //     });

//     //     // ===== SUMMARY =====
//     //     const finalY = (pdf as any).lastAutoTable.finalY + 10;
//     //     pdf.setFontSize(12);
//     //     pdf.text(`Grand Total: ₹ ${totalAmount}`, 140, finalY);

//     //     // ===== FOOTER =====
//     //     pdf.setFontSize(9);
//     //     pdf.text("This is a system generated bill.", 14, 280);

//     //     pdf.save("WBS-Bill.pdf");
//     // };
//     const downloadBillImage = async (imageUrl: string) => {
//         const response = await fetch(imageUrl);
//         const blob = await response.blob();

//         const blobUrl = window.URL.createObjectURL(blob);

//         const link = document.createElement("a");
//         link.href = blobUrl;
//         link.download = "WBS-Bill.jpg";
//         link.click();

//         window.URL.revokeObjectURL(blobUrl);
//     };




//     const handleSave = async () => {
//         if (!form.name || !form.projectId || (form.value ?? 0) <= 0) {
//             alert("Please fill Milestone Name, select a Project, and enter a valid Value.");
//             return;
//         }

//         const billed = Number(form.billed) || 0;
//         const value = Number(form.value) || 0;
//         const balance = value - billed;

//         if (editing) {
//             await dispatch(
//                 updateMilestone({
//                     id: editing._id,
//                     payload: {
//                         ...form,
//                         billed,
//                         balance,
//                     },
//                 })
//             );
//         } else {
//             const newMilestone = {
//                 name: form.name!,
//                 organisationId,
//                 percent: Number(form.percent) || 0,
//                 value,
//                 billed,
//                 balance,
//                 projectId: form.projectId!,
//                 wbsIds: selectedWbs,
//                 createdAt: new Date().toISOString(),
//                 updatedAt: new Date().toISOString(),
//             };

//             await dispatch(createMilestone(newMilestone));
//         }

//         // 🔥 FIX: Refresh pagination instantly
//         await dispatch(fetchPaginatedMilestones({
//             page,
//             limit,
//             search,
//             projectId,
//             organisationId,
//         }));

//         setIsDialogOpen(false);
//         setEditing(null);
//         setForm({ percent: 0, value: 0, billed: 0 });
//     };


//     const handleDelete = (id: string) => {
//         if (confirm("Are you sure you want to delete this milestone?")) {
//             dispatch(deleteMilestone(id));
//         }
//     };

//     const generateInvoice = async (m?: Milestone) => {
//         const safeMilestones = milestones?.filter(Boolean) || [];
//         const target = m || safeMilestones.find((x: Milestone) => x.balance > 0);

//         if (!target) {
//             alert("No milestone with remaining balance found to invoice.");
//             return;
//         }

//         const now = new Date().toISOString();
//         const invoice = {
//             milestoneId: target._id,
//             organisationId,
//             milestoneName: target.name,
//             date: now.slice(0, 10),
//             amount: target.balance,
//             status: "Pending" as const,
//             createdAt: now,
//             updatedAt: now,
//         };

//         await dispatch(createInvoice(invoice));

//         // Mark milestone as fully billed
//         await dispatch(
//             updateMilestone({
//                 id: target._id,
//                 payload: { billed: target.value, balance: 0 },
//             })
//         );
//     };

//     const openInvoicePreview = async (milestone: any) => {
//         if (!milestone.wbsIds || milestone.wbsIds.length === 0) {
//             alert("No WBS linked with this milestone");
//             return;
//         }

//         const wbsItems = await dispatch(
//             fetchWbsByIds(milestone.wbsIds)
//         ).unwrap();

//         const totalAmount = wbsItems.reduce(
//             (sum: number, w: any) => sum + (w.plannedCost || 0),
//             0
//         );

//         setInvoiceData({
//             project: safeProjects.find(p => p._id === milestone.projectId),
//             milestone,
//             wbsItems,
//             totalAmount,
//             invoice: {
//                 date: new Date().toISOString().slice(0, 10),
//                 status: "Pending",
//             },
//         });

//         setInvoiceOpen(true);
//     };


//     const printInvoice = () => {
//         const input = document.getElementById("invoice");
//         if (!input) return;

//         html2canvas(input).then((canvas) => {
//             const imgData = canvas.toDataURL("image/png");
//             const pdf = new jsPDF("p", "mm", "a4");

//             const pdfWidth = pdf.internal.pageSize.getWidth();
//             const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

//             pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
//             pdf.save("invoice.pdf");
//         });
//     };



//     // Chart Data
//     const invoicePaymentData = useMemo(() => {
//         return (invoices || [])
//             .filter(Boolean)
//             .map((inv: Invoice) => ({
//                 date: inv.date,
//                 invoice: inv.amount,
//                 payment: inv.status === "Paid" ? inv.amount : 0,
//             }));
//     }, [invoices]);

//     const forecastData = useMemo(() => {
//         return (milestones || [])
//             .filter((m): m is Milestone => !!m && !!m.name)
//             .map((m) => ({
//                 milestone: m.name,
//                 value: m.value || 0,
//             }));
//     }, [milestones]);

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center h-64">
//                 <Loader2 className="h-10 w-10 animate-spin" />
//             </div>
//         );
//     }



//     if (!canView) {
//         return (
//             <div className="text-center py-12 px-4">
//                 <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
//                 <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
//                 <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
//             </div>
//         );
//     }


//     return (
//         <div className="space-y-6 p-4 md:p-6">
//             {/* Header */}
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                 <div>
//                     <h2 className="text-3xl font-bold">Billing & Invoicing</h2>
//                     <p className="text-muted-foreground">
//                         Link project progress with client billing and invoices.
//                     </p>
//                 </div>
//                 <div className="flex gap-3">
//                     {canCreate && <Button onClick={openCreate}>
//                         <Plus className="mr-2 h-4 w-4" /> Add Milestone
//                     </Button>}
//                     <Button variant="outline" onClick={() => generateInvoice()}>
//                         <FileText className="mr-2 h-4 w-4" /> Generate Invoice
//                     </Button>
//                 </div>
//             </div>
//             <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
//                 <DialogContent className="max-w-4xl p-0">
//                     <DialogHeader className="px-8 pt-6 pb-4 border-b">
//                         <DialogTitle className="text-2xl font-semibold">
//                             Invoice Preview
//                         </DialogTitle>
//                     </DialogHeader>

//                     {invoiceData && (
//                         <>
//                             {/* INVOICE */}
//                             <div
//                                 id="invoice"
//                                 className="bg-white px-10 py-8 text-gray-900"
//                             >
//                                 {/* Title */}
//                                 <div className="flex justify-between items-start mb-8">
//                                     <h1 className="text-3xl font-bold tracking-wide">
//                                         INVOICE
//                                     </h1>
//                                     <div className="text-right text-sm text-gray-600 space-y-1">
//                                         <p><span className="font-medium">Date:</span> {invoiceData.invoice.date}</p>
//                                         <p><span className="font-medium">Status:</span> {invoiceData.invoice.status}</p>
//                                     </div>
//                                 </div>

//                                 {/* Meta */}
//                                 <div className="grid grid-cols-2 gap-6 text-sm mb-8">
//                                     <div className="space-y-1">
//                                         <p className="text-gray-500">Project</p>
//                                         <p className="font-medium">{invoiceData.project?.name}</p>
//                                     </div>
//                                     <div className="space-y-1">
//                                         <p className="text-gray-500">Milestone</p>
//                                         <p className="font-medium">{invoiceData.milestone.name}</p>
//                                     </div>
//                                 </div>

//                                 {/* Table */}
//                                 <div className="border rounded-lg overflow-hidden">
//                                     <table className="w-full text-sm">
//                                         <thead className="bg-gray-50 text-gray-600">
//                                             <tr>
//                                                 <th className="px-4 py-3 text-left font-medium">WBS</th>
//                                                 <th className="px-4 py-3 text-center font-medium">Duration</th>
//                                                 <th className="px-4 py-3 text-center font-medium">Progress</th>
//                                                 <th className="px-4 py-3 text-right font-medium">Cost</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {invoiceData.wbsItems.map((w: any) => (
//                                                 <tr key={w._id} className="border-t">
//                                                     <td className="px-4 py-3">{w.name}</td>
//                                                     <td className="px-4 py-3 text-center">{w.duration} days</td>
//                                                     <td className="px-4 py-3 text-center">{w.progress}%</td>
//                                                     <td className="px-4 py-3 text-right">
//                                                         ₹{w.plannedCost?.toLocaleString("en-IN")}
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>

//                                 {/* Total */}
//                                 <div className="flex justify-end mt-8">
//                                     <div className="text-right">
//                                         <p className="text-sm text-gray-500 mb-1">Total Amount</p>
//                                         <p className="text-2xl font-semibold">
//                                             ₹{invoiceData.totalAmount.toLocaleString("en-IN")}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Footer */}
//                             <DialogFooter className="px-8 py-4 border-t bg-gray-50">
//                                 <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
//                                     Close
//                                 </Button>
//                                 <Button onClick={printInvoice}>
//                                     Download PDF
//                                 </Button>
//                             </DialogFooter>
//                         </>
//                     )}
//                 </DialogContent>
//             </Dialog>



//             {/* Milestones Table */}
//             <Card>
//                 <CardHeader>

//                     <div className="flex justify-between items-center mb-4">
//                         <CardTitle>Milestones ({safeMilestones.length})</CardTitle>
//                         <Input
//                             placeholder="Search milestone..."
//                             value={search}
//                             onChange={(e) => {
//                                 const value = e.target.value;
//                                 setSearch(value);
//                                 setPage(1);        // 🔥 important
//                             }}
//                             className="w-64"
//                         />
//                     </div>

//                 </CardHeader>
//                 <CardContent>
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>Milestone</TableHead>
//                                 <TableHead>%</TableHead>
//                                 <TableHead>Value</TableHead>
//                                 <TableHead>Billed</TableHead>
//                                 <TableHead>Balance</TableHead>
//                                 <TableHead>Project</TableHead>
//                                 <TableHead className="text-right">Actions</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {safeMilestones.map((m: Milestone) => {
//                                 const project = safeProjects.find((p) => p._id === m.projectId);
//                                 return (
//                                     <TableRow key={m._id}>
//                                         <TableCell className="font-medium">{m.name}</TableCell>
//                                         <TableCell>{m.percent ?? 0}%</TableCell>
//                                         <TableCell>₹{(m.value ?? 0).toLocaleString("en-IN")}</TableCell>
//                                         <TableCell>₹{(m.billed ?? 0).toLocaleString("en-IN")}</TableCell>
//                                         <TableCell className={m.balance > 0 ? "text-green-600 font-semibold" : ""}>
//                                             ₹{(m.balance ?? 0).toLocaleString("en-IN")}
//                                         </TableCell>
//                                         <TableCell>{project?.name || "—"}</TableCell>
//                                         <TableCell>
//                                             <div className="flex items-center justify-end gap-2">
//                                                 {canEdit && <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
//                                                     <Edit2 className="h-4 w-4" />
//                                                 </Button>}
//                                                 {canDelete && <Button size="icon" variant="ghost" onClick={() => handleDelete(m._id)}>
//                                                     <Trash2 className="h-4 w-4 text-red-600" />
//                                                 </Button>}
//                                                 {m.balance > 0 && (
//                                                     <Button size="sm" onClick={() => generateInvoice(m)}>
//                                                         <FileText className="h-4 w-4 mr-1" /> Invoice
//                                                     </Button>
//                                                 )}
//                                                 <Button size="sm" onClick={() => openInvoicePreview(m)}>
//                                                     <FileText className="h-4 w-4 mr-1" /> Bill
//                                                 </Button>
//                                                 <Button
//                                                     size="sm"
//                                                     onClick={async () => {
//                                                         if (!m.wbsIds || m.wbsIds.length === 0) {
//                                                             alert("No WBS linked with this milestone");
//                                                             return;
//                                                         }

//                                                         // 🔥 Show bills of FIRST WBS (best practice)
//                                                         const wbsId = m.wbsIds[0];

//                                                         setActiveWbsId(wbsId);
//                                                         await dispatch(fetchBillsByWbs(wbsId));
//                                                         setBillDialogOpen(true);
//                                                     }}
//                                                 >
//                                                     <FileText className="h-4 w-4 mr-1" />WBS Bill
//                                                 </Button>


//                                             </div>
//                                         </TableCell>
//                                     </TableRow>
//                                 );
//                             })}
//                         </TableBody>
//                     </Table>
//                     {safeMilestones.length === 0 && (
//                         <div className="text-center py-10 text-muted-foreground">
//                             No milestones yet. Click "Add Milestone" to create one.
//                         </div>
//                     )}
//                     <Dialog open={!!previewBill} onOpenChange={() => setPreviewBill(null)}>
//                         <DialogContent className="max-w-xl">
//                             <DialogHeader>
//                                 <DialogTitle>Bill Preview</DialogTitle>
//                             </DialogHeader>

//                             {previewBill && (
//                                 <div id="bill-pdf" className="space-y-4">
//                                     {/* Image */}
//                                     <img
//                                         src={previewBill.billImage.url}
//                                         alt="Bill"
//                                         className="w-full rounded-lg border"
//                                     />

//                                     {/* Bill Info */}
//                                     <div className="grid grid-cols-2 gap-4 text-sm">
//                                         <p><b>Total:</b> ₹{previewBill.billingDetails.totalAmount}</p>
//                                         <p><b>GST:</b> ₹{previewBill.billingDetails.gstWithheld}</p>
//                                         <p><b>Retention:</b> ₹{previewBill.billingDetails.retentionWithheld}</p>
//                                         <p><b>Status:</b> {previewBill.billingDetails.status}</p>
//                                     </div>
//                                     <Button onClick={() => downloadBillImage(previewBill.billImage.url)}>
//                                         Download Image
//                                     </Button>


//                                     {/* <Button
//                                         disabled={!previewBill?.billingDetails}
//                                         onClick={() => downloadBillPdf(previewBill)}
//                                     >
//                                         Download PDF
//                                     </Button> */}
//                                 </div>
//                             )}
//                         </DialogContent>
//                     </Dialog>

//                     <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
//                         <DialogContent className="max-w-5xl">
//                             <DialogHeader>
//                                 <DialogTitle className="text-xl font-semibold">
//                                     WBS Bills
//                                 </DialogTitle>
//                             </DialogHeader>

//                             {billLoading ? (
//                                 <div className="flex justify-center py-10">
//                                     <Loader2 className="h-6 w-6 animate-spin" />
//                                 </div>
//                             ) : wbsBills?.length === 0 ? (
//                                 <div className="text-center py-10 text-muted-foreground">
//                                     No bills created for this WBS.
//                                 </div>
//                             ) : (
//                                 <Table>
//                                     <TableHeader>
//                                         <TableRow>
//                                             <TableHead>Maturity Date</TableHead>
//                                             <TableHead>Total</TableHead>
//                                             <TableHead>Received</TableHead>
//                                             <TableHead>GST</TableHead>
//                                             <TableHead>Retention</TableHead>
//                                             <TableHead>Balance</TableHead>
//                                             <TableHead>Status</TableHead>
//                                             <TableHead className="text-right">Actions</TableHead>
//                                         </TableRow>
//                                     </TableHeader>

//                                     <TableBody>
//                                         {wbsBills.map((bill: any) => {
//                                             const bd = bill.billingDetails || {};

//                                             const total = Number(bd.totalAmount || 0);
//                                             const received = Number(bd.totalPaid || 0);
//                                             const balance = Number(bd.balance ?? total - received);
//                                             const status = bd.status || "Pending";

//                                             return (
//                                                 <TableRow key={bill._id}>
//                                                     <TableCell>
//                                                         {bd.maturityDate
//                                                             ? new Date(bd.maturityDate).toLocaleDateString()
//                                                             : "—"}
//                                                     </TableCell>

//                                                     <TableCell>
//                                                         ₹{total.toLocaleString("en-IN")}
//                                                     </TableCell>

//                                                     <TableCell>
//                                                         ₹{received.toLocaleString("en-IN")}
//                                                     </TableCell>

//                                                     <TableCell>
//                                                         ₹{Number(bd.gstWithheld || 0).toLocaleString("en-IN")}
//                                                     </TableCell>

//                                                     <TableCell>
//                                                         ₹{Number(bd.retentionWithheld || 0).toLocaleString("en-IN")}
//                                                     </TableCell>

//                                                     <TableCell
//                                                         className={
//                                                             balance > 0
//                                                                 ? "text-red-600 font-semibold"
//                                                                 : "text-green-600 font-semibold"
//                                                         }
//                                                     >
//                                                         ₹{balance.toLocaleString("en-IN")}
//                                                     </TableCell>

//                                                     <TableCell>
//                                                         <Badge
//                                                             variant={
//                                                                 status === "Paid"
//                                                                     ? "default"
//                                                                     : status === "Partial"
//                                                                         ? "secondary"
//                                                                         : "outline"
//                                                             }
//                                                         >
//                                                             {status}
//                                                         </Badge>
//                                                     </TableCell>

//                                                     <TableCell className="text-right space-x-2">
//                                                         {bill.billImage?.url && (
//                                                             <Button
//                                                                 size="icon"
//                                                                 variant="ghost"
//                                                                 onClick={() => setPreviewBill(bill)}
//                                                             >
//                                                                 <FileText className="h-4 w-4 text-blue-600" />
//                                                             </Button>
//                                                         )}

//                                                         <Button
//                                                             size="icon"
//                                                             variant="ghost"
//                                                             onClick={() => dispatch(deleteBill(bill._id))}
//                                                         >
//                                                             <Trash2 className="h-4 w-4 text-red-600" />
//                                                         </Button>
//                                                     </TableCell>

//                                                 </TableRow>
//                                             );
//                                         })}
//                                     </TableBody>

//                                 </Table>
//                             )}
//                         </DialogContent>
//                     </Dialog>


//                     <div className="flex justify-between items-center mt-4">
//                         <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
//                             Previous
//                         </Button>

//                         <span>Page {page} of {totalPages}</span>

//                         <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
//                             Next
//                         </Button>
//                     </div>


//                 </CardContent>
//             </Card>

//             {/* Invoices Table */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Invoices ({invoices?.length || 0})</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>Date</TableHead>
//                                 <TableHead>Milestone</TableHead>
//                                 <TableHead>Amount</TableHead>
//                                 <TableHead>Status</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {(invoices || [])
//                                 .filter(Boolean)
//                                 .map((inv: Invoice) => (
//                                     <TableRow key={inv._id}>
//                                         <TableCell>{inv.date}</TableCell>
//                                         <TableCell>{inv.milestoneName || "—"}</TableCell>
//                                         <TableCell>₹{Number(inv.amount).toLocaleString("en-IN")}</TableCell>
//                                         <TableCell>
//                                             <Badge
//                                                 variant={
//                                                     inv.status === "Paid"
//                                                         ? "default"
//                                                         : inv.status === "Approved"
//                                                             ? "secondary"
//                                                             : "outline"
//                                                 }
//                                             >
//                                                 {inv.status}
//                                             </Badge>
//                                         </TableCell>
//                                     </TableRow>
//                                 ))}
//                         </TableBody>
//                     </Table>
//                     {(invoices || []).length === 0 && (
//                         <div className="text-center py-10 text-muted-foreground">
//                             No invoices generated yet.
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>

//             {/* Charts */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <Card className="shadow-md border border-gray-200">
//                     <CardHeader>
//                         <CardTitle className="text-lg font-semibold">Invoice vs Payment Trend</CardTitle>
//                     </CardHeader>

//                     <CardContent className="h-[340px] pt-4">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <BarChart
//                                 data={invoicePaymentData}
//                                 barGap={10}
//                                 margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
//                             >
//                                 {/* Gradient Definitions */}
//                                 <defs>
//                                     <linearGradient id="invoiceGradient" x1="0" y1="0" x2="0" y2="1">
//                                         <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
//                                         <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
//                                     </linearGradient>

//                                     <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
//                                         <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
//                                         <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
//                                     </linearGradient>
//                                 </defs>

//                                 <CartesianGrid stroke="#f0f0f0" vertical={false} />

//                                 <XAxis
//                                     dataKey="date"
//                                     tick={{ fill: "#6b7280", fontSize: 12 }}
//                                     axisLine={false}
//                                     tickLine={false}
//                                 />

//                                 <YAxis
//                                     tick={{ fill: "#6b7280", fontSize: 12 }}
//                                     axisLine={false}
//                                     tickLine={false}
//                                 />

//                                 <Tooltip
//                                     contentStyle={{
//                                         background: "white",
//                                         borderRadius: "10px",
//                                         border: "1px solid #e5e7eb",
//                                         boxShadow: "0px 8px 20px rgba(0,0,0,0.1)"
//                                     }}
//                                     formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
//                                 />

//                                 <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />

//                                 <Bar
//                                     dataKey="invoice"
//                                     name="Invoiced"
//                                     fill="url(#invoiceGradient)"
//                                     radius={[8, 8, 0, 0]}
//                                 />

//                                 <Bar
//                                     dataKey="payment"
//                                     name="Paid"
//                                     fill="url(#paymentGradient)"
//                                     radius={[8, 8, 0, 0]}
//                                 />
//                             </BarChart>
//                         </ResponsiveContainer>
//                     </CardContent>
//                 </Card>


//                 <Card className="shadow-md border border-gray-200">
//                     <CardHeader>
//                         <CardTitle className="text-lg font-semibold">
//                             Billing Forecast by Milestone
//                         </CardTitle>
//                     </CardHeader>

//                     <CardContent className="h-[340px] pt-4">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <LineChart
//                                 data={forecastData}
//                                 margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
//                             >
//                                 {/* Gradient Line */}
//                                 <defs>
//                                     <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
//                                         <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
//                                         <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
//                                     </linearGradient>
//                                 </defs>

//                                 <CartesianGrid stroke="#f0f0f0" vertical={false} />

//                                 <XAxis
//                                     dataKey="milestone"
//                                     angle={-35}
//                                     textAnchor="end"
//                                     height={60}
//                                     tick={{ fill: "#6b7280", fontSize: 12 }}
//                                     axisLine={false}
//                                     tickLine={false}
//                                 />

//                                 <YAxis
//                                     tick={{ fill: "#6b7280", fontSize: 12 }}
//                                     axisLine={false}
//                                     tickLine={false}
//                                 />

//                                 <Tooltip
//                                     contentStyle={{
//                                         background: "white",
//                                         borderRadius: "10px",
//                                         border: "1px solid #e5e7eb",
//                                         boxShadow: "0px 8px 20px rgba(0,0,0,0.1)"
//                                     }}
//                                     formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
//                                 />

//                                 <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />

//                                 <Line
//                                     type="monotone"
//                                     dataKey="value"
//                                     stroke="url(#lineGradient)"
//                                     strokeWidth={3}
//                                     dot={{
//                                         r: 5,
//                                         stroke: "#8b5cf6",
//                                         strokeWidth: 2,
//                                         fill: "white"
//                                     }}
//                                     activeDot={{
//                                         r: 8,
//                                         fill: "#8b5cf6",
//                                         strokeWidth: 2,
//                                         stroke: "white"
//                                     }}
//                                     animationDuration={900}
//                                 />
//                             </LineChart>
//                         </ResponsiveContainer>
//                     </CardContent>
//                 </Card>


//             </div>

//             {/* Add/Edit Milestone Dialog */}
//             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//                 <DialogTrigger asChild>
//                     <span className="hidden" />
//                 </DialogTrigger>
//                 <DialogContent className="max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>{editing ? "Edit Milestone" : "Add New Milestone"}</DialogTitle>
//                         <DialogDescription>
//                             {editing ? "Update milestone details" : "Create a new billing milestone linked to a project"}
//                         </DialogDescription>
//                     </DialogHeader>
//                     <div className="grid gap-4 py-4">
//                         <div className="grid gap-2">
//                             <Label>Project *</Label>
//                             <Select
//                                 value={form.projectId || ""}
//                                 onValueChange={(val) => setForm({ ...form, projectId: val })}
//                                 disabled={!!editing}
//                             >
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Select a project" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     {safeProjects.map((p: any) => (
//                                         <SelectItem key={p._id} value={p._id}>
//                                             {p.name}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                             {safeProjects.length === 0 && (
//                                 <p className="text-sm text-muted-foreground">No projects found. Create one first.</p>
//                             )}
//                         </div>

//                         {wbsList.length > 0 && (
//                             <div className="grid gap-2">
//                                 <Label>Link WBS Activities</Label>

//                                 <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
//                                     {wbsList.map((wbs) => (
//                                         <div
//                                             key={wbs._id}
//                                             className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
//                                         >
//                                             <div>
//                                                 <p className="font-medium">{wbs.name}</p>
//                                                 <p className="text-xs text-muted-foreground">
//                                                     Planned: ₹{wbs.plannedCost || 0}
//                                                 </p>
//                                             </div>

//                                             <input
//                                                 type="checkbox"
//                                                 checked={selectedWbs.includes(wbs._id)}
//                                                 onChange={(e) => {
//                                                     const updated = e.target.checked
//                                                         ? [...selectedWbs, wbs._id]
//                                                         : selectedWbs.filter(id => id !== wbs._id);

//                                                     setSelectedWbs(updated);

//                                                     // 🔥 Auto calculate milestone value
//                                                     const total = wbsList
//                                                         .filter(w => updated.includes(w._id))
//                                                         .reduce((sum, w) => sum + (w.plannedCost || 0), 0);

//                                                     setForm(prev => ({ ...prev, value: total }));
//                                                 }}
//                                             />
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         )}


//                         <div className="grid gap-2">
//                             <Label>Milestone Name *</Label>
//                             <Input
//                                 placeholder="e.g., Foundation Complete"
//                                 value={form.name || ""}
//                                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//                             />
//                         </div>

//                         <div className="grid gap-2">
//                             <Label>% of Project (optional)</Label>
//                             <Input
//                                 type="number"
//                                 min="0"
//                                 max="100"
//                                 placeholder="25"
//                                 value={form.percent ?? ""}
//                                 onChange={(e) => {
//                                     const value = parseFloat(e.target.value);
//                                     // Restrict to 0-100 range
//                                     if (isNaN(value) || value < 0) {
//                                         setForm({ ...form, percent: 0 });
//                                     } else if (value > 100) {
//                                         setForm({ ...form, percent: 100 });
//                                     } else {
//                                         setForm({ ...form, percent: value });
//                                     }
//                                 }}
//                                 onBlur={(e) => {
//                                     // Ensure value is within range on blur
//                                     const value = parseFloat(e.target.value);
//                                     if (isNaN(value) || value < 0) {
//                                         setForm({ ...form, percent: 0 });
//                                     } else if (value > 100) {
//                                         setForm({ ...form, percent: 100 });
//                                     }
//                                 }}
//                             />
//                         </div>

//                         <div className="grid gap-2">
//                             <Label>Value (₹) *</Label>
//                             <Input
//                                 type="number"
//                                 min="0"
//                                 step="1000"
//                                 placeholder="500000"
//                                 value={form.value ?? ""}
//                                 onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
//                             />
//                         </div>

//                         <div className="grid gap-2">
//                             <Label>Already Billed (₹)</Label>
//                             <Input
//                                 type="number"
//                                 min="0"
//                                 placeholder="0"
//                                 value={form.billed ?? ""}
//                                 onChange={(e) => setForm({ ...form, billed: parseFloat(e.target.value) || 0 })}
//                             />
//                         </div>
//                     </div>
//                     <DialogFooter>
//                         <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
//                             Cancel
//                         </Button>
//                         <Button onClick={handleSave}>
//                             {editing ? "Save Changes" : "Create Milestone"}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// }