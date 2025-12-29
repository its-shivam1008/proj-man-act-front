"use client";

import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { Plus, ShieldAlert } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  fetchDPRs,
  createDPR,
} from "@/redux/slices/production/productionReportingSlice";

/* ============================================================
   COMPONENT
============================================================ */
export default function DailyProductionReport() {
  const dispatch = useDispatch<AppDispatch>();
  const canView = usePermission("dailyProductionReport", "view");
  const canCreate = usePermission("dailyProductionReport", "create");

  const { dprs, loading } = useSelector(
    (state: RootState) => state.productionReporting
  );

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    date: new Date().toISOString().slice(0, 10),
    totalProduced: 0,
    totalRejected: 0,
    totalDowntimeMin: 0,
    remarks: "",
  });

  useEffect(() => {
    dispatch(fetchDPRs());
  }, [dispatch]);

  if (!canView) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="w-14 h-14 text-red-500 mx-auto mb-3" />
        <h3 className="text-xl font-semibold">Access Denied</h3>
        <p className="text-muted-foreground">
          You do not have permission to view this report.
        </p>
      </div>
    );
  }

  /* ============================================================
     KPI + CHART DATA
  ============================================================ */
  const kpis = useMemo(() => {
    const produced = dprs.reduce((s, d) => s + (d.totalProduced || 0), 0);
    const rejected = dprs.reduce((s, d) => s + (d.totalRejected || 0), 0);
    const downtime = dprs.reduce((s, d) => s + (d.totalDowntimeMin || 0), 0);

    return { produced, rejected, downtime };
  }, [dprs]);

  const trend = useMemo(() => {
    return [...dprs]
      .reverse()
      .map((d) => ({
        date: d.date,
        produced: d.totalProduced || 0,
        rejected: d.totalRejected || 0,
      }));
  }, [dprs]);

  /* ============================================================
     HANDLERS
  ============================================================ */
  const onChange = (k: string, v: any) =>
    setForm((p: any) => ({ ...p, [k]: v }));

  const onSave = () => {
    dispatch(createDPR(form));
    setOpen(false);
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daily Production Report</h1>
          <p className="text-muted-foreground">
            Shift-wise production output, rejection & downtime
          </p>
        </div>

        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New DPR
          </Button>
        )}
      </div>

      {/* KPI CARDS */}
      <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Produced</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">
            {kpis.produced}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardHeader><CardTitle>Total Rejected</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold text-red-600">
            {kpis.rejected}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500">
          <CardHeader><CardTitle>Downtime (min)</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold text-yellow-600">
            {kpis.downtime}
          </CardContent>
        </Card>
      </div>

      {/* TREND CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Production Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="produced" stroke="#16a34a" strokeWidth={2} />
              <Line dataKey="rejected" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* DPR TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>DPR History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produced</TableHead>
                <TableHead>Rejected</TableHead>
                <TableHead>Downtime (min)</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {dprs.map((d) => (
                <TableRow key={d._id}>
                  <TableCell>{d.date}</TableCell>
                  <TableCell>{d.totalProduced}</TableCell>
                  <TableCell className="text-red-600">
                    {d.totalRejected}
                  </TableCell>
                  <TableCell>{d.totalDowntimeMin}</TableCell>
                  <TableCell>{d.remarks || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CREATE DPR DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Daily Production Report</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => onChange("date", e.target.value)}
              />
            </div>

            <div>
              <Label>Total Produced</Label>
              <Input
                type="number"
                value={form.totalProduced}
                onChange={(e) =>
                  onChange("totalProduced", Number(e.target.value))
                }
              />
            </div>

            <div>
              <Label>Total Rejected</Label>
              <Input
                type="number"
                value={form.totalRejected}
                onChange={(e) =>
                  onChange("totalRejected", Number(e.target.value))
                }
              />
            </div>

            <div>
              <Label>Downtime (minutes)</Label>
              <Input
                type="number"
                value={form.totalDowntimeMin}
                onChange={(e) =>
                  onChange("totalDowntimeMin", Number(e.target.value))
                }
              />
            </div>

            <div>
              <Label>Remarks</Label>
              <Input
                value={form.remarks}
                onChange={(e) => onChange("remarks", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onSave}>Save DPR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
