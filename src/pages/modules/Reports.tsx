import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { WorkOrder, QualityCheck, WorkCenter, MaterialIssue } from '../../types/production';
import { BarChart3, TrendingUp, Package, AlertCircle } from 'lucide-react';

export default function ReportsPage() {
  const [reportData, setReportData] = useState({
    totalOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    totalProduction: 0,
    totalRejected: 0,
    qcPassRate: 0,
    workCenterUtilization: 0,
    materialIssued: 0,
  });

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = () => {
    const workOrders: WorkOrder[] = storage.get(STORAGE_KEYS.WORK_ORDERS, []);
    const qualityChecks: QualityCheck[] = storage.get(STORAGE_KEYS.QUALITY_CHECKS, []);
    const workCenters: WorkCenter[] = storage.get(STORAGE_KEYS.WORK_CENTERS, []);
    const materialIssues: MaterialIssue[] = storage.get(STORAGE_KEYS.MATERIAL_ISSUES, []);

    const totalOrders = workOrders.length;
    const completedOrders = workOrders.filter(wo => wo.status === 'completed').length;
    const inProgressOrders = workOrders.filter(wo => wo.status === 'in-progress').length;
    const totalProduction = workOrders.reduce((sum, wo) => sum + wo.producedQuantity, 0);
    const totalRejected = workOrders.reduce((sum, wo) => sum + wo.rejectedQuantity, 0);

    const passedQC = qualityChecks.filter(qc => qc.result === 'pass').length;
    const totalQC = qualityChecks.length;
    const qcPassRate = totalQC > 0 ? Math.round((passedQC / totalQC) * 100) : 0;

    const activeWorkCenters = workCenters.filter(wc => wc.status === 'active').length;
    const totalWorkCenters = workCenters.length;
    const workCenterUtilization = totalWorkCenters > 0 ? Math.round((activeWorkCenters / totalWorkCenters) * 100) : 0;

    const materialIssued = materialIssues.length;

    setReportData({
      totalOrders,
      completedOrders,
      inProgressOrders,
      totalProduction,
      totalRejected,
      qcPassRate,
      workCenterUtilization,
      materialIssued,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Production Reports</h1>
        <p className="text-muted-foreground">Comprehensive analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <BarChart3 className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{reportData.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.completedOrders} completed, {reportData.inProgressOrders} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-lg border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Production</CardTitle>
            <Package className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{reportData.totalProduction}</div>
            <p className="text-xs text-muted-foreground mt-1">Units produced</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-lg border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quality Pass Rate</CardTitle>
            <TrendingUp className="w-5 h-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{reportData.qcPassRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Quality control performance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-lg border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected Units</CardTitle>
            <AlertCircle className="w-5 h-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{reportData.totalRejected}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.totalProduction > 0 ? ((reportData.totalRejected / reportData.totalProduction) * 100).toFixed(2) : 0}% rejection rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Work Center Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Utilization Rate</span>
                  <span className="text-sm font-bold">{reportData.workCenterUtilization}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${reportData.workCenterUtilization}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Material Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Material Issues</p>
                  <p className="text-2xl font-bold">{reportData.materialIssued}</p>
                </div>
                <Package className="w-12 h-12 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Production Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-card rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Completion Rate</p>
              <p className="text-3xl font-bold text-primary">
                {reportData.totalOrders > 0 ? Math.round((reportData.completedOrders / reportData.totalOrders) * 100) : 0}%
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-card rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Average Efficiency</p>
              <p className="text-3xl font-bold text-success">
                {reportData.totalProduction > 0 ? Math.round(((reportData.totalProduction - reportData.totalRejected) / reportData.totalProduction) * 100) : 0}%
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-card rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Active Operations</p>
              <p className="text-3xl font-bold text-accent">{reportData.inProgressOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
