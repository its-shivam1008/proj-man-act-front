"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ArrowRightCircle,
    Trash2,
    Save,
    Edit2,
    DownloadCloud,
    UploadCloud,
    Archive,
   MousePointerClick  ,
    FileText,
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
import { toast } from "sonner";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

/* -------------------------
   Types
--------------------------*/
type ActionType = "TRANSFER" | "DISPOSAL" | "WRITE_OFF" | "ARCHIVE";
type DisposalMethod = "Scrap" | "Resale" | "Donation" | "Other";

interface AssetDisposalRecord {
    id: string;
    assetId: string; // equipment_master code or id
    assetName?: string;
    action: ActionType;
    fromLocation?: string;
    toLocation?: string; // for transfer
    disposalMethod?: DisposalMethod;
    disposalDate: string;
    scrapValue?: number;
    resaleValue?: number;
    financialRef?: string;
    reason?: string;
    archived?: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface AuditEntry {
    id: string;
    recordId: string;
    action: string;
    by?: string;
    timestamp: string;
    details?: string;
}

/* -------------------------
   Constants
--------------------------*/
const LS_KEY =
    (STORAGE_KEYS && STORAGE_KEYS.ASSET_DISPOSAL_V1) || "asset_disposal_v1";
const AUDIT_KEY =
    (STORAGE_KEYS && STORAGE_KEYS.ASSET_DISPOSAL_AUDIT_V1) || "asset_disposal_audit_v1";

/* -------------------------
   Component
--------------------------*/
export default function AssetDisposalTransferPage() {
    // state
    const [records, setRecords] = useState<AssetDisposalRecord[]>([]);
    const [audit, setAudit] = useState<AuditEntry[]>([]);
    const [loaded, setLoaded] = useState(false);

    const [query, setQuery] = useState("");
    const [filterAction, setFilterAction] = useState<"ALL" | ActionType>("ALL");

    // dialog/form
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AssetDisposalRecord | null>(null);
    const [form, setForm] = useState<Partial<AssetDisposalRecord>>({
        action: "TRANSFER",
        disposalDate: new Date().toISOString().slice(0, 10),
    });

    /* -------------------------
       Load on mount (safe)
    --------------------------*/
    useEffect(() => {
        if (typeof window === "undefined") return;

        const saved = storage.get<AssetDisposalRecord[]>(LS_KEY, []);
        if (Array.isArray(saved) && saved.length > 0) setRecords(saved);

        const savedAudit = storage.get<AuditEntry[]>(AUDIT_KEY, []);
        if (Array.isArray(savedAudit) && savedAudit.length > 0) setAudit(savedAudit);

        setLoaded(true);
    }, []);

    /* -------------------------
       Save when changed (after load)
    --------------------------*/
    useEffect(() => {
        if (!loaded) return;
        storage.set(LS_KEY, records);
    }, [records, loaded]);

    useEffect(() => {
        if (!loaded) return;
        storage.set(AUDIT_KEY, audit);
    }, [audit, loaded]);

    /* -------------------------
       Cross-tab sync
    --------------------------*/
    useEffect(() => {
        if (typeof window === "undefined") return;
        const handler = (e: StorageEvent) => {
            if (!e.key) return;
            if (e.key === LS_KEY) {
                const remote = storage.get<AssetDisposalRecord[]>(LS_KEY, []);
                setRecords(remote || []);
            }
            if (e.key === AUDIT_KEY) {
                const remoteAudit = storage.get<AuditEntry[]>(AUDIT_KEY, []);
                setAudit(remoteAudit || []);
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, []);

    /* -------------------------
       CRUD
    --------------------------*/
    function openAdd() {
        setEditing(null);
        setForm({
            action: "TRANSFER",
            disposalDate: new Date().toISOString().slice(0, 10),
            scrapValue: 0,
            resaleValue: 0,
        });
        setOpen(true);
    }

    function openEdit(rec: AssetDisposalRecord) {
        setEditing(rec);
        setForm({ ...rec });
        setOpen(true);
    }

    function commitAudit(recordId: string, action: string, details?: string) {
        const entry: AuditEntry = {
            id: uuidv4(),
            recordId,
            action,
            by: "system", // you can replace with user context
            timestamp: new Date().toISOString(),
            details,
        };
        setAudit((p) => [entry, ...p]);
    }

    function saveForm() {
        if (!form.assetId || !form.action || !form.disposalDate) {
            toast.error("Asset ID, action and date are required");
            return;
        }

        const rec: AssetDisposalRecord = {
            id: editing ? editing.id : uuidv4(),
            assetId: form.assetId!,
            assetName: form.assetName || "",
            action: form.action as ActionType,
            fromLocation: form.fromLocation,
            toLocation: form.toLocation,
            disposalMethod: form.disposalMethod,
            disposalDate: form.disposalDate!,
            scrapValue: Number(form.scrapValue || 0),
            resaleValue: Number(form.resaleValue || 0),
            financialRef: form.financialRef,
            reason: form.reason,
            archived: Boolean(form.archived || false),
            createdAt: editing ? editing.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (editing) {
            setRecords((p) => p.map((x) => (x.id === editing.id ? rec : x)));
            commitAudit(rec.id, "UPDATED", `Updated ${rec.action} for ${rec.assetId}`);
            toast.success("Record updated");
        } else {
            setRecords((p) => [rec, ...p]);
            commitAudit(rec.id, "CREATED", `${rec.action} created for ${rec.assetId}`);
            toast.success("Record created");
        }

        setOpen(false);
    }

    function deleteRecord(id: string) {
        if (!confirm("Delete this record?")) return;
        setRecords((p) => p.filter((r) => r.id !== id));
        commitAudit(id, "DELETED", "Record deleted");
        toast.error("Deleted");
    }

    function markArchived(id: string, value = true) {
        setRecords((p) => p.map((r) => (r.id === id ? { ...r, archived: value, updatedAt: new Date().toISOString() } : r)));
        commitAudit(id, value ? "ARCHIVED" : "UNARCHIVED", value ? "Archived" : "Unarchived");
        toast.success(value ? "Archived" : "Restored");
    }

    /* -------------------------
       Import / Export
    --------------------------*/
    function exportAll() {
        const payload = { records, audit, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `asset_disposal_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Exported");
    }

    function importAll(file: File | null) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result as string);
                if (!data || !Array.isArray(data.records)) throw new Error("Invalid file");
                const recs: AssetDisposalRecord[] = data.records.map((r: any) => ({ id: r.id || uuidv4(), ...r }));
                const aud: AuditEntry[] = Array.isArray(data.audit) ? data.audit.map((a: any) => ({ id: a.id || uuidv4(), ...a })) : [];
                setRecords(recs);
                setAudit(aud);
                toast.success("Imported");
            } catch (err) {
                toast.error("Import failed");
            }
        };
        reader.readAsText(file);
    }

    /* -------------------------
       Derived / UI helpers
    --------------------------*/
    const filtered = useMemo(() => {
        let list = [...records];
        if (filterAction !== "ALL") list = list.filter((r) => r.action === filterAction);
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter((r) =>
                [r.assetId, r.assetName, r.fromLocation, r.toLocation, r.reason, r.financialRef]
                    .filter(Boolean)
                    .some((f) => f!.toLowerCase().includes(q))
            );
        }
        return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }, [records, query, filterAction]);

    const totalRecords = filtered.length;
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
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Archive className="h-6 w-6" /> Asset Disposal & Transfer
                </h1>

                <div className="flex items-center gap-2">
                    <input id="imp-asset-disposal" type="file" accept="application/json" className="hidden" onChange={(e) => importAll(e.target.files?.[0] || null)} />
                    <Button variant="outline" onClick={() => document.getElementById("imp-asset-disposal")?.click()}><UploadCloud className="mr-2 h-4 w-4" />Import</Button>
                    <Button variant="outline" onClick={exportAll}><DownloadCloud className="mr-2 h-4 w-4" />Export</Button>
                    <Button onClick={openAdd}><MousePointerClick size={20}  className="mr-2 h-4 w-4" />New</Button>
                </div>
            </div>

            {/* KPIs and pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader><CardTitle>Total Records</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{records.length}</div></CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Actions Breakdown</CardTitle></CardHeader>
                    <CardContent className="h-56">
                        {pieData.length === 0 ? <div className="text-sm text-muted-foreground">No data</div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                    <CardContent>
                        {audit.length === 0 ? <div className="text-sm text-muted-foreground">No activity</div> : (
                            <ul className="space-y-2 text-sm">
                                {audit.slice(0, 8).map(a => (
                                    <li key={a.id} className="text-xs">
                                        <div className="font-medium">{a.action}</div>
                                        <div className="text-muted-foreground">{new Date(a.timestamp).toLocaleString()} — {a.details}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* filters */}
            <div className="flex gap-2 items-center">
                <Input placeholder="Search asset, location, ref..." value={query} onChange={(e) => setQuery(e.target.value)} />
                <select value={filterAction} onChange={(e) => setFilterAction(e.target.value as any)} className="border rounded px-2 py-1">
                    <option value="ALL">All Actions</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="DISPOSAL">Disposal</option>
                    <option value="WRITE_OFF">Write-off</option>
                    <option value="ARCHIVE">Archive</option>
                </select>
            </div>

            {/* table */}
            <Card>
                <CardHeader><CardTitle>Records</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To / Method</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Financial Ref</TableHead>
                                    <TableHead>Archived</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>{r.disposalDate}</TableCell>
                                        <TableCell>{r.assetId} {r.assetName ? `— ${r.assetName}` : ""}</TableCell>
                                        <TableCell>{r.action}</TableCell>
                                        <TableCell>{r.fromLocation}</TableCell>
                                        <TableCell>{r.action === "TRANSFER" ? r.toLocation : r.disposalMethod}</TableCell>
                                        <TableCell>
                                            {r.scrapValue ? `Scrap ₹${r.scrapValue}` : ""}
                                            {r.resaleValue ? (r.scrapValue ? " / " : "") + `Resale ₹${r.resaleValue}` : ""}
                                        </TableCell>
                                        <TableCell>{r.financialRef}</TableCell>
                                        <TableCell>{r.archived ? "Yes" : "No"}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 className="w-4 h-4" /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => deleteRecord(r.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => markArchived(r.id, !r.archived)} title={r.archived ? "Unarchive" : "Archive"}>
                                                    <FileText className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader><DialogTitle>{editing ? "Edit Asset Action" : "New Asset Transfer / Disposal"}</DialogTitle></DialogHeader>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Asset ID / Code</Label>
                            <Input value={form.assetId || ""} onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))} />
                        </div>

                        <div>
                            <Label>Asset Name (optional)</Label>
                            <Input value={form.assetName || ""} onChange={(e) => setForm((f) => ({ ...f, assetName: e.target.value }))} />
                        </div>

                        <div>
                            <Label>Action</Label>
                            <select value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))} className="border rounded px-2 py-2 w-full">
                                <option value="TRANSFER">Transfer</option>
                                <option value="DISPOSAL">Disposal</option>
                                <option value="WRITE_OFF">Write-off</option>
                                <option value="ARCHIVE">Archive</option>
                            </select>
                        </div>

                        <div>
                            <Label>Date</Label>
                            <Input type="date" value={form.disposalDate || new Date().toISOString().slice(0, 10)} onChange={(e) => setForm((f) => ({ ...f, disposalDate: e.target.value }))} />
                        </div>

                        <div>
                            <Label>From Location</Label>
                            <Input value={form.fromLocation || ""} onChange={(e) => setForm((f) => ({ ...f, fromLocation: e.target.value }))} />
                        </div>

                        <div>
                            <Label>To Location (for transfer)</Label>
                            <Input value={form.toLocation || ""} onChange={(e) => setForm((f) => ({ ...f, toLocation: e.target.value }))} />
                        </div>

                        <div>
                            <Label>Disposal Method (if disposal)</Label>
                            <select value={form.disposalMethod} onChange={(e) => setForm((f) => ({ ...f, disposalMethod: e.target.value }))} className="border rounded px-2 py-2 w-full">
                                <option value="">Select</option>
                                <option value="Scrap">Scrap</option>
                                <option value="Resale">Resale</option>
                                <option value="Donation">Donation</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <Label>Scrap Value (₹)</Label>
                            <Input type="number" value={form.scrapValue || 0} onChange={(e) => setForm((f) => ({ ...f, scrapValue: Number(e.target.value) }))} />
                        </div>

                        <div>
                            <Label>Resale Value (₹)</Label>
                            <Input type="number" value={form.resaleValue || 0} onChange={(e) => setForm((f) => ({ ...f, resaleValue: Number(e.target.value) }))} />
                        </div>

                        <div>
                            <Label>Financial Reference</Label>
                            <Input value={form.financialRef || ""} onChange={(e) => setForm((f) => ({ ...f, financialRef: e.target.value }))} />
                        </div>

                        <div className="col-span-2">
                            <Label>Reason / Notes</Label>
                            <Input value={form.reason || ""} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
                        </div>

                        <div className="col-span-2 flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={Boolean(form.archived)} onChange={(e) => setForm((f) => ({ ...f, archived: e.target.checked }))} />
                                Archive record immediately
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={saveForm}><Save className="mr-2 h-4 w-4" /> Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
