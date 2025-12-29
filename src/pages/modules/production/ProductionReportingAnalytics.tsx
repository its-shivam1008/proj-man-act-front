"use client";

import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { ShieldAlert } from "lucide-react";
import { fetchWorkCenterPerformance } from "@/redux/slices/production/workCenterSlice";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../../../components/ui/table";
import MaterialConsumptionReport from "@/components/reports/MaterialConsumptionReport";
import QualityRejectionReport from "@/components/reports/QualityRejectionReport";
import EquipmentUtilisationDashboard from "@/components/reports/EquipmentUtilisationDashboard";
import WipSummaryReport from "@/components/reports/WipSummaryReport";
import DailyProductionReport from "@/components/reports/DailyProductionReport";
import CostVsOutputAnalysis from "@/components/reports/CostVsOutputAnalysis";

export default function ProductionReportingAnalytics() {
  const dispatch = useDispatch<AppDispatch>();
  const [tab, setTab] = useState("workcenter-performance");

  const canView = usePermission("productionReportingAnalytics", "view");

  const { performance, loading } = useSelector(
    (state: RootState) => state.workCenters
  );

  useEffect(() => {
    dispatch(fetchWorkCenterPerformance());
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Production Reporting & Analytics</h1>
        <p className="text-muted-foreground">
          Work Center performance and efficiency analysis
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="workcenter-performance">
            Work Center Performance
          </TabsTrigger>
          <TabsTrigger value="material-consumption">
            Material Consumption
          </TabsTrigger>
          <TabsTrigger value="quality-rejection">
            Quality Rejection
          </TabsTrigger>
          <TabsTrigger value="equipment-utilisation">
            Equipment Utilisation
          </TabsTrigger>
          <TabsTrigger value="wip">
            WIP Summary
          </TabsTrigger>
          <TabsTrigger value="dpr">
            Daily Production Report 
          </TabsTrigger>
          <TabsTrigger value="costvsoutput">
            Cost vs Output
          </TabsTrigger>



        </TabsList>

        {/* ================= WORK CENTER PERFORMANCE ================= */}
        <TabsContent value="workcenter-performance">
          <div className="space-y-6">

            {/* KPI CARDS */}
            <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
              {performance.map((wc) => (
                <Card key={wc.id} className="border-l-4 border-indigo-600">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {wc.workCenterName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Availability</span>
                      <b>{wc.availability}%</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance</span>
                      <b>{wc.performance}%</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality</span>
                      <b>{wc.quality}%</b>
                    </div>
                    <div className="flex justify-between text-indigo-600">
                      <span>OEE</span>
                      <b>{wc.oee}%</b>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CHARTS */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Downtime by Work Center (min)</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="workCenterName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="downtimeMin" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>OEE Comparison (%)</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="workCenterName" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="oee" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* TABLE */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Center</TableHead>
                      <TableHead>Run Time</TableHead>
                      <TableHead>Downtime</TableHead>
                      <TableHead>Produced</TableHead>
                      <TableHead>Rejected</TableHead>
                      <TableHead>Availability %</TableHead>
                      <TableHead>Performance %</TableHead>
                      <TableHead>Quality %</TableHead>
                      <TableHead>OEE %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performance.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>{w.workCenterName}</TableCell>
                        <TableCell>{w.runTime}</TableCell>
                        <TableCell>{w.downtimeMin}</TableCell>
                        <TableCell>{w.produced}</TableCell>
                        <TableCell>{w.rejected}</TableCell>
                        <TableCell>{w.availability}</TableCell>
                        <TableCell>{w.performance}</TableCell>
                        <TableCell>{w.quality}</TableCell>
                        <TableCell className="font-bold text-indigo-600">
                          {w.oee}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
        <TabsContent value="material-consumption">
          <MaterialConsumptionReport />
        </TabsContent>
        <TabsContent value="quality-rejection">
          <QualityRejectionReport />
        </TabsContent>
        <TabsContent value="equipment-utilisation">
          <EquipmentUtilisationDashboard />
        </TabsContent>
        <TabsContent value="wip">
          <WipSummaryReport/>
        </TabsContent>
        <TabsContent value="dpr">
          <DailyProductionReport/>
        </TabsContent>
        <TabsContent value="costvsoutput">
          <CostVsOutputAnalysis/>
        </TabsContent>


      </Tabs>
    </div>
  );
}
