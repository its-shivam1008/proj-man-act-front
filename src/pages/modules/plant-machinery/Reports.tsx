import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { getFromStorage, PM_STORAGE_KEYS } from '../../../utils/plantMachineryStorage';
import type { Equipment, PreventiveMaintenance, BreakdownMaintenance, SparePart } from '../../../types/plantMachinery';

const PlantMachineryReportsPage: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [pmRecords, setPMRecords] = useState<PreventiveMaintenance[]>([]);
  const [breakdowns, setBreakdowns] = useState<BreakdownMaintenance[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);

  useEffect(() => {
    setEquipment(getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT));
    setPMRecords(getFromStorage<PreventiveMaintenance>(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE));
    setBreakdowns(getFromStorage<BreakdownMaintenance>(PM_STORAGE_KEYS.BREAKDOWN_MAINTENANCE));
    setSpareParts(getFromStorage<SparePart>(PM_STORAGE_KEYS.SPARE_PARTS));
  }, []);

  const stats = {
    totalEquipment: equipment.length,
    operational: equipment.filter(e => e.status === 'operational').length,
    underMaintenance: equipment.filter(e => e.status === 'under-maintenance').length,
    breakdown: equipment.filter(e => e.status === 'breakdown').length,
    utilizationRate: equipment.length > 0 
      ? ((equipment.filter(e => e.status === 'operational').length / equipment.length) * 100).toFixed(1) 
      : '0',
    pmCompleted: pmRecords.filter(p => p.status === 'completed').length,
    pmScheduled: pmRecords.filter(p => p.status === 'scheduled').length,
    pmOverdue: pmRecords.filter(p => p.status === 'overdue').length,
    pmComplianceRate: pmRecords.length > 0 
      ? ((pmRecords.filter(p => p.status === 'completed').length / pmRecords.length) * 100).toFixed(1)
      : '0',
    activeBreakdowns: breakdowns.filter(b => b.status !== 'completed').length,
    completedBreakdowns: breakdowns.filter(b => b.status === 'completed').length,
    avgDowntime: breakdowns.length > 0
      ? (breakdowns.reduce((sum, b) => sum + b.downtime, 0) / breakdowns.length).toFixed(1)
      : '0',
    lowStockParts: spareParts.filter(p => p.status === 'low-stock' || p.status === 'out-of-stock').length,
    criticalParts: spareParts.filter(p => p.isCritical).length,
  };

  const topCostEquipment = equipment
    .map(eq => ({
      ...eq,
      totalCost: pmRecords.filter(p => p.equipmentId === eq.id).reduce((sum, p) => sum + p.totalCost, 0) +
                 breakdowns.filter(b => b.equipmentId === eq.id).reduce((sum, b) => sum + b.totalCost, 0)
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5);

  const frequentBreakdowns = equipment
    .map(eq => ({
      ...eq,
      breakdownCount: breakdowns.filter(b => b.equipmentId === eq.id).length
    }))
    .filter(eq => eq.breakdownCount > 0)
    .sort((a, b) => b.breakdownCount - a.breakdownCount)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Equipment performance and KPI analysis</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipment Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.operational} of {stats.totalEquipment} operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">PM Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.pmComplianceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pmCompleted} completed, {stats.pmOverdue} overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Breakdowns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.activeBreakdowns}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.completedBreakdowns} resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Downtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.avgDowntime}h</div>
            <p className="text-xs text-muted-foreground mt-1">Per breakdown</p>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <div className="text-3xl font-bold text-success">{stats.operational}</div>
              <p className="text-sm text-muted-foreground mt-1">Operational</p>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <div className="text-3xl font-bold text-warning">{stats.underMaintenance}</div>
              <p className="text-sm text-muted-foreground mt-1">Under Maintenance</p>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <div className="text-3xl font-bold text-destructive">{stats.breakdown}</div>
              <p className="text-sm text-muted-foreground mt-1">Breakdown</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-foreground">{equipment.filter(e => e.status === 'idle').length}</div>
              <p className="text-sm text-muted-foreground mt-1">Idle</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Cost Equipment */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 High-Cost Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCostEquipment.map((eq, index) => (
              <div key={eq.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{eq.name}</p>
                    <p className="text-sm text-muted-foreground">{eq.equipmentCode} • {eq.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{eq.totalCost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total cost</p>
                </div>
              </div>
            ))}
            {topCostEquipment.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No cost data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Frequent Breakdowns */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment with Frequent Breakdowns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {frequentBreakdowns.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{eq.name}</p>
                  <p className="text-sm text-muted-foreground">{eq.equipmentCode} • {eq.location}</p>
                </div>
                <Badge variant="destructive">{eq.breakdownCount} breakdowns</Badge>
              </div>
            ))}
            {frequentBreakdowns.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No breakdown data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spare Parts Alert */}
      {stats.lowStockParts > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Spare Parts Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {stats.lowStockParts} spare parts are running low on stock. 
              {stats.criticalParts > 0 && ` ${stats.criticalParts} are critical parts.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlantMachineryReportsPage;
