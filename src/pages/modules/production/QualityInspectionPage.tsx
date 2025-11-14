"use client";

import { useEffect, useMemo, useState } from "react";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Plus, Check, XCircle } from "lucide-react";

const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowISO = () => new Date().toISOString();

/**
 * QUALITY INSPECTION (Integrated with GRN)
 *
 * - Reads GRNs from STORAGE_KEYS.GRNS
 * - Displays Pending QC batches (from GRNs) in Inspections tab
 * - Accept / Reject flows update GRN item status, inventory, WIP, and create NCR/CAPA as needed
 */

export default function QualityInspectionPage() {
  // Local state mapped from storage
  const [plans, setPlans] = useState(() => storage.get(STORAGE_KEYS.QUALITY_PLANS, []));
  const [inspections, setInspections] = useState(() => storage.get(STORAGE_KEYS.INSPECTIONS, []));
  const [ncrs, setNCRs] = useState(() => storage.get(STORAGE_KEYS.NCR_REPORTS, []));
  const [capas, setCAPAs] = useState(() => storage.get(STORAGE_KEYS.CAPA_ACTIONS, []));
  const [grns, setGrns] = useState(() => storage.get(STORAGE_KEYS.GRNS, []));
  const [inventory, setInventory] = useState(() => storage.get(STORAGE_KEYS.INVENTORY, {}));
  const [wip, setWip] = useState(() => storage.get(STORAGE_KEYS.WIP_INVENTORY, {}));

  // UI state
  const [tab, setTab] = useState("plans");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  // persist back to storage whenever these states change
  useEffect(() => storage.set(STORAGE_KEYS.QUALITY_PLANS, plans), [plans]);
  useEffect(() => storage.set(STORAGE_KEYS.INSPECTIONS, inspections), [inspections]);
  useEffect(() => storage.set(STORAGE_KEYS.NCR_REPORTS, ncrs), [ncrs]);
  useEffect(() => storage.set(STORAGE_KEYS.CAPA_ACTIONS, capas), [capas]);
  useEffect(() => storage.set(STORAGE_KEYS.GRNS, grns), [grns]);
  useEffect(() => storage.set(STORAGE_KEYS.INVENTORY, inventory), [inventory]);
  useEffect(() => storage.set(STORAGE_KEYS.WIP_INVENTORY, wip), [wip]);

  /** ---------- Analytics (unchanged) ---------- */
  const passFailStats = useMemo(() => {
    const pass = inspections.filter((i) => i.result === "Pass").length;
    const fail = inspections.filter((i) => i.result === "Fail").length;
    return [{ name: "Pass", value: pass }, { name: "Fail", value: fail }];
  }, [inspections]);

  const defectTrends = useMemo(() => {
    const map: Record<string, number> = {};
    inspections.forEach((i) => (i.defects || []).forEach((d) => (map[d] = (map[d] || 0) + 1)));
    return Object.entries(map).map(([defect, count]) => ({ defect, count }));
  }, [inspections]);

  const capaProgress = useMemo(() => {
    const map: Record<string, number> = {};
    capas.forEach((c) => (map[c.status] = (map[c.status] || 0) + 1));
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [capas]);

  /** ---------- CRUD for plans / inspections / ncr / capa (unchanged) ---------- */
  const addRecord = () => {
    if (tab === "plans") {
      setPlans((p) => [...p, { id: genId("plan"), ...form }]);
    } else if (tab === "inspections") {
      const record = { id: genId("insp"), date: nowISO(), ...form };
      setInspections((p) => [record, ...p]);
      if (form.result === "Fail") autoGenerateNCR(record);
    } else if (tab === "ncrs") {
      setNCRs((p) => [{ id: genId("ncr"), createdAt: nowISO(), ...form }, ...p]);
    } else if (tab === "capas") {
      setCAPAs((p) => [{ id: genId("capa"), ...form }, ...p]);
    }
    setForm({});
    setDialogOpen(false);
  };

  const autoGenerateNCR = (inspection: any) => {
    const ncr = {
      id: genId("ncr"),
      inspectionId: inspection.id,
      cause: inspection.remarks || "Inspection failure",
      severity: "Major",
      status: "Open",
      responsibleDept: "Quality",
      createdAt: nowISO(),
    };
    setNCRs((p) => [ncr, ...p]);
    // Optionally create CAPA stub
    setCAPAs((p) => [{ id: genId("capa"), ncrId: ncr.id, type: "Corrective", action: "Investigation", owner: "QA", dueDate: "", status: "Open" }, ...p]);
  };

  /** ---------- GRN integration helpers ---------- */

  // find all GRN items that are pending QC
  const pendingGrnItems = useMemo(() => {
    const items: {
      grnId: string;
      productId: string;
      batchNo: string;
      qty: number;
      unitValue?: number;
      totalValue?: number;
    }[] = [];
    grns.forEach((g: any) => {
      (g.items || []).forEach((it: any) => {
        if (it.status === "Pending QC" || it.status === "Pending") {
          items.push({ grnId: g.id, productId: it.productId, batchNo: it.batchNo, qty: it.qty, unitValue: it.unitValue, totalValue: it.totalValue });
        }
      });
    });
    return items;
  }, [grns]);

  // Accept a GRN batch: mark GRN item accepted, mark inventory batch released, create inspection (Pass)
  const acceptGrnBatch = (grnId: string, productId: string, batchNo: string) => {
    // 1) update grns
    const newGrns = grns.map((g: any) =>
      g.id === grnId
        ? { ...g, items: g.items.map((it: any) => (it.productId === productId && it.batchNo === batchNo ? { ...it, status: "Accepted" } : it)) }
        : g
    );
    setGrns(newGrns);

    // 2) update inventory batch status
    const inv = { ...inventory };
    if (inv[productId]?.batches && inv[productId].batches[batchNo]) {
      inv[productId].batches[batchNo].status = "Released";
    } else {
      // if inventory doesn't have this batch (maybe GRN created earlier), add it
      inv[productId] = inv[productId] || { qty: 0, batches: {}, valuation: 0, warehouse: "Finished" };
      inv[productId].batches = inv[productId].batches || {};
      inv[productId].batches[batchNo] = { qty: 0, status: "Released" };
    }
    setInventory(inv);

    // 3) create inspection record (Pass)
    const insp = {
      id: genId("insp"),
      planId: "", // could map to final plan
      date: nowISO(),
      inspector: "",
      result: "Pass",
      remarks: `Auto-accepted from GRN ${grnId}`,
      linkedBatch: batchNo,
      linkedGRN: grnId,
    };
    setInspections((p) => [insp, ...p]);
  };

  // Reject a GRN batch: mark GRN item rejected, move qty back to WIP, adjust inventory, create NCR/CAPA and inspection (Fail)
  const rejectGrnBatch = (grnId: string, productId: string, batchNo: string) => {
    // 1) update grns
    const newGrns = grns.map((g: any) =>
      g.id === grnId
        ? { ...g, items: g.items.map((it: any) => (it.productId === productId && it.batchNo === batchNo ? { ...it, status: "Rejected" } : it)) }
        : g
    );
    setGrns(newGrns);

    // 2) move qty from inventory back to WIP (reduce inventory, increase wip)
    const inv = { ...inventory };
    const w = { ...wip };
    const batchInfo = inv[productId]?.batches?.[batchNo];

    const qtyToMove = batchInfo?.qty ?? (() => {
      // try find in GRN to get qty
      const g = grns.find((x: any) => x.id === grnId);
      const it = g?.items?.find((x: any) => x.batchNo === batchNo && x.productId === productId);
      return it?.qty || 0;
    })();

    // reduce inventory totals
    if (inv[productId]) {
      inv[productId].qty = Math.max(0, (inv[productId].qty || 0) - qtyToMove);
      if (inv[productId].batches && inv[productId].batches[batchNo]) {
        delete inv[productId].batches[batchNo];
      }
    }
    // add to WIP
    w[productId] = { ...(w[productId] || {}), qty: (w[productId]?.qty || 0) + qtyToMove };

    setInventory(inv);
    setWip(w);

    // 3) create inspection record (Fail)
    const insp = {
      id: genId("insp"),
      planId: "", // map to plan if needed
      date: nowISO(),
      inspector: "",
      result: "Fail",
      remarks: `Auto-rejected from GRN ${grnId}`,
      linkedBatch: batchNo,
      linkedGRN: grnId,
    };
    setInspections((p) => [insp, ...p]);

    // 4) create NCR and CAPA
    const ncr = {
      id: genId("ncr"),
      inspectionId: insp.id,
      cause: `Rejected batch ${batchNo}`,
      severity: "Major",
      status: "Open",
      responsibleDept: "Quality",
      createdAt: nowISO(),
    };
    setNCRs((p) => [ncr, ...p]);

    const capa = {
      id: genId("capa"),
      ncrId: ncr.id,
      type: "Corrective",
      action: "Investigate rejection and quarantine material",
      owner: "QA",
      dueDate: "",
      status: "Open",
    };
    setCAPAs((p) => [capa, ...p]);
  };

  /** ---------- Form rendering (unchanged from previous version) ---------- */
  const renderFormFields = () => {
    switch (tab) {
      case "plans":
        return (
          <>
            <Label>Plan Name</Label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Label>Type</Label>
            <select className="border p-2 rounded-md w-full" value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="">Select Type</option>
              <option value="Incoming">Incoming</option>
              <option value="In-Process">In-Process</option>
              <option value="Final">Final</option>
            </select>
            <Label>Sampling Procedure</Label>
            <Input value={form.sampling || ""} onChange={(e) => setForm({ ...form, sampling: e.target.value })} />
            <Label>Acceptance Criteria</Label>
            <Input value={form.criteria || ""} onChange={(e) => setForm({ ...form, criteria: e.target.value })} />
          </>
        );
      case "inspections":
        return (
          <>
            <Label>Inspection Plan</Label>
            <select className="border p-2 rounded-md w-full" value={form.planId || ""} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
              <option value="">Select Plan</option>
              {plans.map((p: any) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            <Label>Inspector</Label>
            <Input value={form.inspector || ""} onChange={(e) => setForm({ ...form, inspector: e.target.value })} />
            <Label>Result</Label>
            <select className="border p-2 rounded-md w-full" value={form.result || ""} onChange={(e) => setForm({ ...form, result: e.target.value })}>
              <option value="">Select</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
            <Label>Remarks</Label>
            <Input value={form.remarks || ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </>
        );
      case "ncrs":
        return (
          <>
            <Label>Cause</Label>
            <Input value={form.cause || ""} onChange={(e) => setForm({ ...form, cause: e.target.value })} />
            <Label>Severity</Label>
            <select className="border p-2 rounded-md w-full" value={form.severity || ""} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="">Select</option>
              <option value="Minor">Minor</option>
              <option value="Major">Major</option>
              <option value="Critical">Critical</option>
            </select>
            <Label>Responsible Department</Label>
            <Input value={form.responsibleDept || ""} onChange={(e) => setForm({ ...form, responsibleDept: e.target.value })} />
          </>
        );
      case "capas":
        return (
          <>
            <Label>NCR ID</Label>
            <select className="border p-2 rounded-md w-full" value={form.ncrId || ""} onChange={(e) => setForm({ ...form, ncrId: e.target.value })}>
              <option value="">Select NCR</option>
              {ncrs.map((n: any) => (<option key={n.id} value={n.id}>{n.id}</option>))}
            </select>
            <Label>Type</Label>
            <select className="border p-2 rounded-md w-full" value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="">Select Type</option>
              <option value="Corrective">Corrective</option>
              <option value="Preventive">Preventive</option>
            </select>
            <Label>Action</Label>
            <Input value={form.action || ""} onChange={(e) => setForm({ ...form, action: e.target.value })} />
            <Label>Owner</Label>
            <Input value={form.owner || ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            <Label>Status</Label>
            <select className="border p-2 rounded-md w-full" value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="">Select</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Quality Inspection & Control (Integrated with GRN)</h1>
      <p className="text-muted-foreground">Manage inspection plans, QC records, NCRs & CAPA — now integrated with GRN batches.</p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="ncrs">NCRs</TabsTrigger>
          <TabsTrigger value="capas">CAPAs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Plans */}
        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Inspection Plans</CardTitle>
              <Button className="w-full md:w-40" onClick={() => { setForm({}); setDialogOpen(true); }}>+ New Plan</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sampling</TableHead>
                    <TableHead>Criteria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.type}</TableCell>
                      <TableCell>{p.sampling}</TableCell>
                      <TableCell>{p.criteria}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspections + Pending GRN batches */}
        <TabsContent value="inspections">
          <div className="grid gap-4">

            {/* Quick create inspection */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Inspection Records</CardTitle>
                <Button className="w-full md:w-40" onClick={() => { setForm({}); setDialogOpen(true); }}>+ New Inspection</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((i: any) => (
                      <TableRow key={i.id}>
                        <TableCell>{new Date(i.date).toLocaleString()}</TableCell>
                        <TableCell>{plans.find((p: any) => p.id === i.planId)?.name || "—"}</TableCell>
                        <TableCell>{i.inspector || "—"}</TableCell>
                        <TableCell><Badge variant={i.result === "Pass" ? "success" : i.result === "Fail" ? "destructive" : undefined}>{i.result}</Badge></TableCell>
                        <TableCell>{i.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pending QC batches sourced from GRNs */}
            <Card>
              <CardHeader><CardTitle>Pending QC — GRN Batches</CardTitle></CardHeader>
              <CardContent>
                {pendingGrnItems.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">No pending GRN batches awaiting QC.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GRN</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingGrnItems.map((it) => {
                        const g = grns.find((x: any) => x.id === it.grnId);
                        return (
                          <TableRow key={it.batchNo}>
                            <TableCell>{it.grnId}</TableCell>
                            <TableCell>{it.productId}</TableCell>
                            <TableCell>{it.batchNo}</TableCell>
                            <TableCell>{it.qty}</TableCell>
                            <TableCell className="grid grid-cols-2 gap-2">
                              <Button className="w-full bg-green-600" onClick={() => acceptGrnBatch(it.grnId, it.productId, it.batchNo)}>
                                <Check className="mr-2 h-4 w-4" /> Accept
                              </Button>
                              <Button className="w-full bg-red-600" onClick={() => rejectGrnBatch(it.grnId, it.productId, it.batchNo)}>
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* NCRs */}
        <TabsContent value="ncrs">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Non-Conformance Reports</CardTitle>
              <Button className="w-full md:w-40" onClick={() => { setForm({}); setDialogOpen(true); }}>+ New NCR</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cause</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dept</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ncrs.map((n: any) => (
                    <TableRow key={n.id}>
                      <TableCell>{n.id}</TableCell>
                      <TableCell>{n.cause}</TableCell>
                      <TableCell>{n.severity}</TableCell>
                      <TableCell><Badge>{n.status}</Badge></TableCell>
                      <TableCell>{n.responsibleDept}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAPAs */}
        <TabsContent value="capas">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>CAPA Actions</CardTitle>
              <Button className="w-full md:w-40" onClick={() => { setForm({}); setDialogOpen(true); }}>+ New CAPA</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capas.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell>{c.type}</TableCell>
                      <TableCell>{c.action}</TableCell>
                      <TableCell>{c.owner}</TableCell>
                      <TableCell><Badge>{c.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle>Pass vs Fail</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={passFailStats} dataKey="value" outerRadius={80}>
                      {passFailStats.map((e, i) => <Cell key={i} fill={["#00C49F", "#FF8042"][i % 2]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Defect Trends</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defectTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="defect" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>CAPA Status</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={capaProgress}>
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="count" stroke="#00C49F" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Generic dialog used for creating Plans / Inspections / NCR / CAPA */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Record</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-3">{renderFormFields()}</div>
          <DialogFooter>
            <Button className="w-full" onClick={addRecord}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
