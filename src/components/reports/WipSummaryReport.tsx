"use client";

import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useMemo } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { ShieldAlert, Layers } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchWIP } from "@/redux/slices/production/materialIssueSlice";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

export default function WipSummaryReport() {
  const dispatch = useDispatch<AppDispatch>();
  const canView = usePermission("wipSummaryReport", "view");

  const { wip, loading } = useSelector(
    (state: RootState) => state.materialIssue
  );

  useEffect(() => {
    dispatch(fetchWIP());
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

  /* ================= DERIVED DATA ================= */

  const totalWipQty = useMemo(
    () => wip.reduce((s: number, r: any) => s + r.quantity, 0),
    [wip]
  );

  const highWipCount = wip.filter((r: any) => r.quantity > 50).length;
  const lowWipCount = wip.filter((r: any) => r.quantity <= 5).length;

  const pieData = wip.map((r: any) => ({
    name: r.itemId?.name || "Unknown",
    value: r.quantity,
  }));

  const topWip = [...wip]
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5);

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WIP Summary Report</h1>
        <p className="text-muted-foreground">
          Work-in-progress inventory created from material issues
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Total WIP Qty</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {totalWipQty}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>WIP Materials</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {wip.length}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              High WIP
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {highWipCount}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardHeader><CardTitle>Low / Near Zero</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {lowWipCount}
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* PIE */}
        <Card>
          <CardHeader>
            <CardTitle>WIP Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* BAR */}
        <Card>
          <CardHeader>
            <CardTitle>Top WIP Materials</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWip}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="itemId.name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed WIP Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {wip.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No WIP Inventory Found
                  </TableCell>
                </TableRow>
              ) : (
                wip.map((row: any) => {
                  const status =
                    row.quantity > 50
                      ? "High"
                      : row.quantity <= 5
                      ? "Low"
                      : "Normal";

                  return (
                    <TableRow key={row._id}>
                      <TableCell className="font-medium">
                        {row.itemId?.name || "-"}
                      </TableCell>

                      <TableCell>{row.quantity}</TableCell>

                      <TableCell>
                        {row.itemId?.unitOfMeasure || "-"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            status === "High"
                              ? "bg-red-100 text-red-700"
                              : status === "Low"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
