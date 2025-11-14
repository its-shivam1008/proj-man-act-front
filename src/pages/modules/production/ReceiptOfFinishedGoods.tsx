"use client";

import React, { useEffect, useMemo, useState } from "react";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { Plus, Check, XCircle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type InventoryMap = Record<
  string,
  { qty: number; valuation?: number; batches?: Record<string, { qty: number; status?: string }>; warehouse?: string }
>;

type GRN = {
  id: string;
  date: string;
  workOrderId?: string;
  items: {
    productId: string;
    qty: number;
    batchNo: string;
    unitValue?: number;
    totalValue?: number;
    status?: "Pending QC" | "Accepted" | "Rejected";
  }[];
  remarks?: string;
  acceptedBy?: string;
};

const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowISO = () => new Date().toISOString();

export default function ReceiptOfFinishedGoods() {
  const [inventory, setInventory] = useState<InventoryMap>(() => storage.get(STORAGE_KEYS.INVENTORY, {}));
  const [wipInventory, setWipInventory] = useState<InventoryMap>(() => storage.get(STORAGE_KEYS.WIP_INVENTORY, {}));
  const [ledger, setLedger] = useState<any[]>(() => storage.get(STORAGE_KEYS.INVENTORY_LEDGER, []));
  const [journals, setJournals] = useState<any[]>(() => storage.get(STORAGE_KEYS.JOURNALS, []));
  const [grns, setGrns] = useState<GRN[]>(() => storage.get(STORAGE_KEYS.GRNS, []));

  const [openDialog, setOpenDialog] = useState(false);
  const [manualProductId, setManualProductId] = useState("");
  const [manualQty, setManualQty] = useState<number | "">("");
  const [formItems, setFormItems] = useState<GRN["items"]>([]);
  const [remarks, setRemarks] = useState("");
  const [acceptedBy, setAcceptedBy] = useState("");
  const [requireFinalQC, setRequireFinalQC] = useState(true);

  // Persist
  useEffect(() => storage.set(STORAGE_KEYS.INVENTORY, inventory), [inventory]);
  useEffect(() => storage.set(STORAGE_KEYS.WIP_INVENTORY, wipInventory), [wipInventory]);
  useEffect(() => storage.set(STORAGE_KEYS.INVENTORY_LEDGER, ledger), [ledger]);
  useEffect(() => storage.set(STORAGE_KEYS.JOURNALS, journals), [journals]);
  useEffect(() => storage.set(STORAGE_KEYS.GRNS, grns), [grns]);

  /** ---------------------- Helpers ---------------------- */
  const generateBatch = (productId: string) => {
    const d = new Date();
    const datePart = d.toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${productId}-${datePart}-${suffix}`;
  };

  const estimateValue = (productId: string) => {
    const inv = inventory[productId];
    if (inv?.valuation && inv.qty) return inv.valuation / inv.qty;
    return 100; // fallback demo value
  };

  const postJournal = (desc: string, debit: string, credit: string, amt: number) => {
    const j = { id: genId("jr"), date: nowISO(), description: desc, debitAccount: debit, creditAccount: credit, amount: amt };
    setJournals((p) => [...p, j]);
  };

  const addLedger = (type: string, productId: string, qty: number, batchNo: string) => {
    const e = { id: genId("lg"), date: nowISO(), type, productId, qty, batchNo };
    setLedger((p) => [...p, e]);
  };

  /** ---------------------- Main: Create GRN ---------------------- */
  const createGRN = () => {
    if (formItems.length === 0) return alert("Add at least one item.");
    const grn: GRN = {
      id: genId("grn"),
      date: nowISO(),
      items: formItems.map((i) => ({ ...i, status: requireFinalQC ? "Pending QC" : "Accepted" })),
      remarks,
      acceptedBy,
    };
    const inv = { ...inventory };
    const wip = { ...wipInventory };

    grn.items.forEach((it) => {
      const { productId, qty, unitValue = 100, batchNo } = it;
      // reduce WIP
      wip[productId] = { ...wip[productId], qty: Math.max(0, (wip[productId]?.qty || 0) - qty) };
      // add to finished goods
      if (!inv[productId]) inv[productId] = { qty: 0, batches: {}, warehouse: "Finished" };
      inv[productId].qty += qty;
      inv[productId].batches = inv[productId].batches || {};
      inv[productId].batches![batchNo] = { qty, status: requireFinalQC ? "Pending" : "Released" };
      addLedger("GRN", productId, qty, batchNo);
      postJournal(`GRN ${grn.id}`, "Finished Goods", "WIP", qty * unitValue);
    });

    setInventory(inv);
    setWipInventory(wip);
    setGrns((p) => [...p, grn]);
    setFormItems([]);
    setManualProductId("");
    setManualQty("");
    setRemarks("");
    setAcceptedBy("");
    setOpenDialog(false);
  };

  /** ---------------------- QC Accept/Reject ---------------------- */
  const updateBatchQC = (productId: string, batchNo: string, result: "Accepted" | "Rejected") => {
    const inv = { ...inventory };
    const batches = inv[productId]?.batches || {};
    if (!batches[batchNo]) return;

    if (result === "Accepted") {
      batches[batchNo].status = "Released";
      // update GRN item status
      setGrns((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.map((it) =>
            it.batchNo === batchNo && it.productId === productId ? { ...it, status: "Accepted" } : it
          ),
        }))
      );
    } else {
      // rejected — move back to WIP
      const qty = batches[batchNo].qty;
      delete batches[batchNo];
      inv[productId].qty = Math.max(0, inv[productId].qty - qty);
      const wip = { ...wipInventory };
      wip[productId] = { ...wip[productId], qty: (wip[productId]?.qty || 0) + qty };
      setWipInventory(wip);
      addLedger("QC Reject", productId, -qty, batchNo);
      postJournal(`QC Reject ${batchNo}`, "WIP", "Finished Goods", qty * estimateValue(productId));

      // update GRN item status
      setGrns((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.map((it) =>
            it.batchNo === batchNo && it.productId === productId ? { ...it, status: "Rejected" } : it
          ),
        }))
      );
    }

    inv[productId].batches = batches;
    setInventory(inv);
  };

  /** ---------------------- Analytics ---------------------- */
  const grnTrend = useMemo(() => {
    const map: Record<string, number> = {};
    grns.forEach((g) => {
      const date = g.date.slice(0, 10);
      const total = g.items.reduce((s, i) => s + (i.totalValue || i.qty * 100), 0);
      map[date] = (map[date] || 0) + total;
    });
    return Object.entries(map).map(([date, value]) => ({ date, value }));
  }, [grns]);

  /** ---------------------- UI ---------------------- */
  const addManualItem = () => {
    if (!manualProductId || !manualQty) return;
    const batch = generateBatch(manualProductId);
    const unitValue = estimateValue(manualProductId);
    const totalValue = unitValue * Number(manualQty);
    setFormItems((p) => [...p, { productId: manualProductId, qty: Number(manualQty), batchNo: batch, unitValue, totalValue }]);
    setManualProductId("");
    setManualQty("");
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Receipt of Finished Goods (GRN)</h2>
      <p className="text-muted-foreground">Transfer completed goods from WIP to Finished Goods inventory. Auto-generate batch and trigger QC.</p>

      <div className="flex items-center gap-3">
        <input type="checkbox" checked={requireFinalQC} onChange={(e) => setRequireFinalQC(e.target.checked)} />
        <Label>Require Final QC</Label>
      </div>

      <Button className=" bg-primary mt-3" onClick={() => setOpenDialog(true)}>
        <Plus className="mr-2 h-4 w-4" /> New Goods Receipt
      </Button>

      {/* GRN Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Goods Receipt Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Product ID</Label>
                <Input value={manualProductId} onChange={(e) => setManualProductId(e.target.value)} />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={manualQty as any} onChange={(e) => setManualQty(Number(e.target.value))} />
              </div>
            </div>
            <Button className="w-full" onClick={addManualItem}>Add Item</Button>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formItems.map((i, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{i.productId}</TableCell>
                    <TableCell>{i.qty}</TableCell>
                    <TableCell>{i.batchNo}</TableCell>
                    <TableCell>₹{i.totalValue?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Label>Accepted By</Label>
            <Input value={acceptedBy} onChange={(e) => setAcceptedBy(e.target.value)} />
            <Label>Remarks</Label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={createGRN}><Check className="mr-2 h-4 w-4" />Save & Receive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending QC Section */}
      <Card>
        <CardHeader><CardTitle>Pending QC Batches</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grns.flatMap((g) =>
                g.items
                  .filter((it) => it.status === "Pending QC")
                  .map((it) => (
                    <TableRow key={it.batchNo}>
                      <TableCell>{it.batchNo}</TableCell>
                      <TableCell>{it.productId}</TableCell>
                      <TableCell>{it.qty}</TableCell>
                      <TableCell><Badge>Pending</Badge></TableCell>
                      <TableCell className="flex gap-2">
                        <Button className="w-full bg-green-600" onClick={() => updateBatchQC(it.productId, it.batchNo, "Accepted")}>
                          Accept
                        </Button>
                        <Button className="w-full bg-red-600" onClick={() => updateBatchQC(it.productId, it.batchNo, "Rejected")}>
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* GRN Trend */}
      <Card>
        <CardHeader><CardTitle>GRN Value Trend</CardTitle></CardHeader>
        <CardContent className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={grnTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="value" stroke="#00C49F" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
