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
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import {
  Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function MaterialConsumptionReport() {
  const dispatch = useDispatch<AppDispatch>();
  const canView = usePermission("materialConsumptionReport", "view");

  const { materials, loading } = useSelector(
    (state: RootState) => state.rawMaterials
  );

  useEffect(() => {
    dispatch(fetchMaterials({ page: 1, limit: 100 }));
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

  const consumptionData = useMemo(() => {
    return materials.map((m) => {
      const opening = m.stocks.reduce((s, b) => s + b.quantity, 0);
      const closing = m.stocks.reduce((s, b) => s + b.remainingQuantity, 0);
      const consumed = opening - closing;

      const avgCost =
        m.stocks.reduce((s, b) => s + (b.unitCost || 0), 0) /
        (m.stocks.length || 1);

      return {
        name: m.name,
        unit: m.unitOfMeasure,
        opening,
        consumed,
        closing,
        value: consumed * avgCost,
        lowStock: closing <= (m.reorderLevel || 0),
      };
    });
  }, [materials]);

  const totalConsumed = consumptionData.reduce((s, m) => s + m.consumed, 0);
  const totalValue = consumptionData.reduce((s, m) => s + m.value, 0);

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Material Consumption Report</h1>
        <p className="text-muted-foreground">
          Raw material usage, cost & FIFO-based consumption analysis
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Materials</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {materials.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Total Consumed Qty</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {totalConsumed}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Consumption Value</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            ₹ {totalValue.toFixed(2)}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {consumptionData.filter(m => m.lowStock).length}
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Material Consumption</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="consumed" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consumption Value (₹)</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Material Consumption</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Consumed</TableHead>
                <TableHead>Closing</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumptionData.map((m) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.opening}</TableCell>
                  <TableCell>{m.consumed}</TableCell>
                  <TableCell>{m.closing}</TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell>₹ {m.value.toFixed(2)}</TableCell>
                  <TableCell>
                    {m.lowStock ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
