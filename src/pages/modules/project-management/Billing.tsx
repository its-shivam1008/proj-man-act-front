"use client";
import { fetchWbsByIds, fetchWbsByProject } from "@/redux/slices/wbsSlice";
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
import { Plus, Trash2, Edit2, FileText, Loader2, ShieldAlert } from "lucide-react";
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
    fetchPaginatedMilestones,
} from "@/redux/slices/billingSlice";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { usePermission } from "@/hooks/userPermission";

export default function BillingPage() {
    const dispatch = useDispatch();
    const { milestones, invoices, loading: billingLoading, totalPages } = useSelector((state: RootState) => state.billing);
    const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
    const loading = billingLoading || projectsLoading;


    const [wbsList, setWbsList] = useState<any[]>([]);
    const [selectedWbs, setSelectedWbs] = useState<string[]>([]);
    const [invoiceOpen, setInvoiceOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>(null);


    const canView = usePermission('billings', 'view');
    const canCreate = usePermission('billings', 'create');
    const canEdit = usePermission('billings', 'edit');
    const canDelete = usePermission('billings', 'delete');
    const [searchDebounce, setSearchDebounce] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Milestone | null>(null);
    const [form, setForm] = useState<Partial<Milestone & { projectId: string }>>({
        percent: 0,
        value: 0,
        billed: 0,
    });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [projectId, setProjectId] = useState("");
    const safeMilestones = milestones?.length ? milestones : [];

    const safeProjects = (projects || []).filter(Boolean);

    // Safely get from localStorage
    const organisationId = localStorage.getItem("organisationId") || "";

    useEffect(() => {
        dispatch(fetchPaginatedMilestones({
            page,
            limit,
            search: searchDebounce,
            projectId,
            organisationId,
        }));
    }, [page, searchDebounce, projectId]);


    useEffect(() => {
        if (form.projectId) {
            dispatch(fetchWbsByProject(form.projectId))
                .unwrap()
                .then((res) => setWbsList(res || []));
        } else {
            setWbsList([]);
            setSelectedWbs([]);
        }
    }, [form.projectId]);

    useEffect(() => {
        if (safeMilestones.length === 0 && page > 1 && !loading) {
            setPage(page - 1);
        }

    }, [safeMilestones])
    useEffect(() => {
        // Fetch all required data
        // dispatch(fetchMilestones());
        dispatch(fetchInvoices());

        // Correct way: pass object with pagination params
        dispatch(
            fetchProjects({
                page: 1,
                limit: 999,     // Fetch all or enough projects
                search: "",
                status: "",
            })
        );
    }, [dispatch]);
    useEffect(() => {
        const delay = setTimeout(() => {
            setSearchDebounce(search);
        }, 300);

        return () => clearTimeout(delay);
    }, [search]);


    const openCreate = () => {
        setEditing(null);
        setForm({ percent: 0, value: 0, billed: 0 });
        setIsDialogOpen(true);
    };

    const openEdit = (m: Milestone) => {
        setEditing(m);
        setForm({
            ...m,
            projectId: m.projectId,
            percent: m.percent ?? 0,
            value: m.value ?? 0,
            billed: m.billed ?? 0,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.projectId || (form.value ?? 0) <= 0) {
            alert("Please fill Milestone Name, select a Project, and enter a valid Value.");
            return;
        }

        const billed = Number(form.billed) || 0;
        const value = Number(form.value) || 0;
        const balance = value - billed;

        if (editing) {
            await dispatch(
                updateMilestone({
                    id: editing._id,
                    payload: {
                        ...form,
                        billed,
                        balance,
                    },
                })
            );
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

            await dispatch(createMilestone(newMilestone));
        }

        // 🔥 FIX: Refresh pagination instantly
        await dispatch(fetchPaginatedMilestones({
            page,
            limit,
            search,
            projectId,
            organisationId,
        }));

        setIsDialogOpen(false);
        setEditing(null);
        setForm({ percent: 0, value: 0, billed: 0 });
    };


    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this milestone?")) {
            dispatch(deleteMilestone(id));
        }
    };

    const generateInvoice = async (m?: Milestone) => {
        const safeMilestones = milestones?.filter(Boolean) || [];
        const target = m || safeMilestones.find((x: Milestone) => x.balance > 0);

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
            amount: target.balance,
            status: "Pending" as const,
            createdAt: now,
            updatedAt: now,
        };

        await dispatch(createInvoice(invoice));

        // Mark milestone as fully billed
        await dispatch(
            updateMilestone({
                id: target._id,
                payload: { billed: target.value, balance: 0 },
            })
        );
    };

    const openInvoicePreview = async (milestone: any) => {
        if (!milestone.wbsIds || milestone.wbsIds.length === 0) {
            alert("No WBS linked with this milestone");
            return;
        }

        const wbsItems = await dispatch(
            fetchWbsByIds(milestone.wbsIds)
        ).unwrap();

        const totalAmount = wbsItems.reduce(
            (sum: number, w: any) => sum + (w.plannedCost || 0),
            0
        );

        setInvoiceData({
            project: safeProjects.find(p => p._id === milestone.projectId),
            milestone,
            wbsItems,
            totalAmount,
            invoice: {
                date: new Date().toISOString().slice(0, 10),
                status: "Pending",
            },
        });

        setInvoiceOpen(true);
    };


    const printInvoice = () => {
        const input = document.getElementById("invoice");
        if (!input) return;

        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("invoice.pdf");
        });
    };



    // Chart Data
    const invoicePaymentData = useMemo(() => {
        return (invoices || [])
            .filter(Boolean)
            .map((inv: Invoice) => ({
                date: inv.date,
                invoice: inv.amount,
                payment: inv.status === "Paid" ? inv.amount : 0,
            }));
    }, [invoices]);

    const forecastData = useMemo(() => {
        return (milestones || [])
            .filter((m): m is Milestone => !!m && !!m.name)
            .map((m) => ({
                milestone: m.name,
                value: m.value || 0,
            }));
    }, [milestones]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }



    if (!canView) {
        return (
            <div className="text-center py-12 px-4">
                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
            </div>
        );
    }


    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Billing & Invoicing</h2>
                    <p className="text-muted-foreground">
                        Link project progress with client billing and invoices.
                    </p>
                </div>
                <div className="flex gap-3">
                    {canCreate && <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add Milestone
                    </Button>}
                    <Button variant="outline" onClick={() => generateInvoice()}>
                        <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                    </Button>
                </div>
            </div>
           <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
  <DialogContent className="max-w-4xl p-0">
    <DialogHeader className="px-8 pt-6 pb-4 border-b">
      <DialogTitle className="text-2xl font-semibold">
        Invoice Preview
      </DialogTitle>
    </DialogHeader>

    {invoiceData && (
      <>
        {/* INVOICE */}
        <div
          id="invoice"
          className="bg-white px-10 py-8 text-gray-900"
        >
          {/* Title */}
          <div className="flex justify-between items-start mb-8">
            <h1 className="text-3xl font-bold tracking-wide">
              INVOICE
            </h1>
            <div className="text-right text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Date:</span> {invoiceData.invoice.date}</p>
              <p><span className="font-medium">Status:</span> {invoiceData.invoice.status}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-6 text-sm mb-8">
            <div className="space-y-1">
              <p className="text-gray-500">Project</p>
              <p className="font-medium">{invoiceData.project?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Milestone</p>
              <p className="font-medium">{invoiceData.milestone.name}</p>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">WBS</th>
                  <th className="px-4 py-3 text-center font-medium">Duration</th>
                  <th className="px-4 py-3 text-center font-medium">Progress</th>
                  <th className="px-4 py-3 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.wbsItems.map((w: any) => (
                  <tr key={w._id} className="border-t">
                    <td className="px-4 py-3">{w.name}</td>
                    <td className="px-4 py-3 text-center">{w.duration} days</td>
                    <td className="px-4 py-3 text-center">{w.progress}%</td>
                    <td className="px-4 py-3 text-right">
                      ₹{w.plannedCost?.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end mt-8">
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-2xl font-semibold">
                ₹{invoiceData.totalAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-8 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
            Close
          </Button>
          <Button onClick={printInvoice}>
            Download PDF
          </Button>
        </DialogFooter>
      </>
    )}
  </DialogContent>
</Dialog>



            {/* Milestones Table */}
            <Card>
                <CardHeader>

                    <div className="flex justify-between items-center mb-4">
                        <CardTitle>Milestones ({safeMilestones.length})</CardTitle>
                        <Input
                            placeholder="Search milestone..."
                            value={search}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearch(value);
                                setPage(1);        // 🔥 important
                            }}
                            className="w-64"
                        />
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
                                        <TableCell className={m.balance > 0 ? "text-green-600 font-semibold" : ""}>
                                            ₹{(m.balance ?? 0).toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell>{project?.name || "—"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                {canEdit && <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>}
                                                {canDelete && <Button size="icon" variant="ghost" onClick={() => handleDelete(m._id)}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>}
                                                {m.balance > 0 && (
                                                    <Button size="sm" onClick={() => generateInvoice(m)}>
                                                        <FileText className="h-4 w-4 mr-1" /> Invoice
                                                    </Button>
                                                )}
                                                <Button size="sm" onClick={() => openInvoicePreview(m)}>
                                                    <FileText className="h-4 w-4 mr-1" /> Bill
                                                </Button>

                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    {safeMilestones.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No milestones yet. Click "Add Milestone" to create one.
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
                            Previous
                        </Button>

                        <span>Page {page} of {totalPages}</span>

                        <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                            Next
                        </Button>
                    </div>


                </CardContent>
            </Card>

            {/* Invoices Table */}
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
                            {(invoices || [])
                                .filter(Boolean)
                                .map((inv: Invoice) => (
                                    <TableRow key={inv._id}>
                                        <TableCell>{inv.date}</TableCell>
                                        <TableCell>{inv.milestoneName || "—"}</TableCell>
                                        <TableCell>₹{Number(inv.amount).toLocaleString("en-IN")}</TableCell>
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
                    {(invoices || []).length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No invoices generated yet.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-md border border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Invoice vs Payment Trend</CardTitle>
                    </CardHeader>

                    <CardContent className="h-[340px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={invoicePaymentData}
                                barGap={10}
                                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                            >
                                {/* Gradient Definitions */}
                                <defs>
                                    <linearGradient id="invoiceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    </linearGradient>

                                    <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid stroke="#f0f0f0" vertical={false} />

                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <YAxis
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: "white",
                                        borderRadius: "10px",
                                        border: "1px solid #e5e7eb",
                                        boxShadow: "0px 8px 20px rgba(0,0,0,0.1)"
                                    }}
                                    formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
                                />

                                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />

                                <Bar
                                    dataKey="invoice"
                                    name="Invoiced"
                                    fill="url(#invoiceGradient)"
                                    radius={[8, 8, 0, 0]}
                                />

                                <Bar
                                    dataKey="payment"
                                    name="Paid"
                                    fill="url(#paymentGradient)"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>


                <Card className="shadow-md border border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                            Billing Forecast by Milestone
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="h-[340px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={forecastData}
                                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                            >
                                {/* Gradient Line */}
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid stroke="#f0f0f0" vertical={false} />

                                <XAxis
                                    dataKey="milestone"
                                    angle={-35}
                                    textAnchor="end"
                                    height={60}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <YAxis
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: "white",
                                        borderRadius: "10px",
                                        border: "1px solid #e5e7eb",
                                        boxShadow: "0px 8px 20px rgba(0,0,0,0.1)"
                                    }}
                                    formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
                                />

                                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />

                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="url(#lineGradient)"
                                    strokeWidth={3}
                                    dot={{
                                        r: 5,
                                        stroke: "#8b5cf6",
                                        strokeWidth: 2,
                                        fill: "white"
                                    }}
                                    activeDot={{
                                        r: 8,
                                        fill: "#8b5cf6",
                                        strokeWidth: 2,
                                        stroke: "white"
                                    }}
                                    animationDuration={900}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>


            </div>

            {/* Add/Edit Milestone Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <span className="hidden" />
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Milestone" : "Add New Milestone"}</DialogTitle>
                        <DialogDescription>
                            {editing ? "Update milestone details" : "Create a new billing milestone linked to a project"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Project *</Label>
                            <Select
                                value={form.projectId || ""}
                                onValueChange={(val) => setForm({ ...form, projectId: val })}
                                disabled={!!editing}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeProjects.map((p: any) => (
                                        <SelectItem key={p._id} value={p._id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {safeProjects.length === 0 && (
                                <p className="text-sm text-muted-foreground">No projects found. Create one first.</p>
                            )}
                        </div>

                        {wbsList.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Link WBS Activities</Label>

                                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                                    {wbsList.map((wbs) => (
                                        <div
                                            key={wbs._id}
                                            className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                                        >
                                            <div>
                                                <p className="font-medium">{wbs.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Planned: ₹{wbs.plannedCost || 0}
                                                </p>
                                            </div>

                                            <input
                                                type="checkbox"
                                                checked={selectedWbs.includes(wbs._id)}
                                                onChange={(e) => {
                                                    const updated = e.target.checked
                                                        ? [...selectedWbs, wbs._id]
                                                        : selectedWbs.filter(id => id !== wbs._id);

                                                    setSelectedWbs(updated);

                                                    // 🔥 Auto calculate milestone value
                                                    const total = wbsList
                                                        .filter(w => updated.includes(w._id))
                                                        .reduce((sum, w) => sum + (w.plannedCost || 0), 0);

                                                    setForm(prev => ({ ...prev, value: total }));
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        <div className="grid gap-2">
                            <Label>Milestone Name *</Label>
                            <Input
                                placeholder="e.g., Foundation Complete"
                                value={form.name || ""}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>% of Project (optional)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="25"
                                value={form.percent ?? ""}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    // Restrict to 0-100 range
                                    if (isNaN(value) || value < 0) {
                                        setForm({ ...form, percent: 0 });
                                    } else if (value > 100) {
                                        setForm({ ...form, percent: 100 });
                                    } else {
                                        setForm({ ...form, percent: value });
                                    }
                                }}
                                onBlur={(e) => {
                                    // Ensure value is within range on blur
                                    const value = parseFloat(e.target.value);
                                    if (isNaN(value) || value < 0) {
                                        setForm({ ...form, percent: 0 });
                                    } else if (value > 100) {
                                        setForm({ ...form, percent: 100 });
                                    }
                                }}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Value (₹) *</Label>
                            <Input
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="500000"
                                value={form.value ?? ""}
                                onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Already Billed (₹)</Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={form.billed ?? ""}
                                onChange={(e) => setForm({ ...form, billed: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editing ? "Save Changes" : "Create Milestone"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}