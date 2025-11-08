import { useEffect, useState } from 'react';
import KPICard from '../../components/KPI-Card'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { WorkOrder, QualityCheck, WorkCenter } from '../../types/production';
import { Activity, Package, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    activeOrders: 0,
    completedOrders: 0,
    efficiency: 0,
    qualityRate: 0,
    utilizationRate: 0,
    rejectionRate: 0,
  });

  const [recentActivity, setRecentActivity] = useState<WorkOrder[]>([]);

  useEffect(() => {
    calculateKPIs();
  }, []);

  const calculateKPIs = () => {
    const workOrders: WorkOrder[] = storage.get(STORAGE_KEYS.WORK_ORDERS, []);
    const qualityChecks: QualityCheck[] = storage.get(STORAGE_KEYS.QUALITY_CHECKS, []);
    const workCenters: WorkCenter[] = storage.get(STORAGE_KEYS.WORK_CENTERS, []);

    const activeOrders = workOrders.filter(wo => wo.status === 'in-progress').length;
    const completedOrders = workOrders.filter(wo => wo.status === 'completed').length;
    const totalProduced = workOrders.reduce((sum, wo) => sum + wo.producedQuantity, 0);
    const totalRejected = workOrders.reduce((sum, wo) => sum + wo.rejectedQuantity, 0);

    const passedQC = qualityChecks.filter(qc => qc.result === 'pass').length;
    const totalQC = qualityChecks.length;

    const activeWorkCenters = workCenters.filter(wc => wc.status === 'active').length;
    const totalWorkCenters = workCenters.length;

    setKpis({
      activeOrders,
      completedOrders,
      efficiency: workOrders.length > 0 ? Math.round((completedOrders / workOrders.length) * 100) : 0,
      qualityRate: totalQC > 0 ? Math.round((passedQC / totalQC) * 100) : 0,
      utilizationRate: totalWorkCenters > 0 ? Math.round((activeWorkCenters / totalWorkCenters) * 100) : 0,
      rejectionRate: totalProduced > 0 ? Number(((totalRejected / totalProduced) * 100).toFixed(2)) : 0,
    });

    setRecentActivity(workOrders.slice(0, 5));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Production Dashboard</h1>
        <p className="text-muted-foreground">Real-time monitoring of manufacturing operations</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          label="Active Work Orders"
          value={kpis.activeOrders}
          type="info"
          icon={<Activity className="w-5 h-5" />}
        />
        <KPICard
          label="Completed Orders"
          value={kpis.completedOrders}
          type="success"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <KPICard
          label="Production Efficiency"
          value={`${kpis.efficiency}%`}
          change={kpis.efficiency - 85}
          trend={kpis.efficiency > 85 ? 'up' : 'down'}
          type={kpis.efficiency > 85 ? 'success' : 'warning'}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          label="Quality Pass Rate"
          value={`${kpis.qualityRate}%`}
          change={kpis.qualityRate - 95}
          trend={kpis.qualityRate > 95 ? 'up' : 'down'}
          type={kpis.qualityRate > 95 ? 'success' : 'warning'}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <KPICard
          label="Work Center Utilization"
          value={`${kpis.utilizationRate}%`}
          type="info"
          icon={<Package className="w-5 h-5" />}
        />
        <KPICard
          label="Rejection Rate"
          value={`${kpis.rejectionRate}%`}
          type={kpis.rejectionRate < 2 ? 'success' : 'danger'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Recent Activity */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Work Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No work orders yet. Create your first one to get started!</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 bg-gradient-card rounded-lg border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{order.orderNumber}</h4>
                    <p className="text-sm text-muted-foreground">{order.productName}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm font-medium">{order.producedQuantity}/{order.quantity}</p>
                    <p className="text-xs text-muted-foreground">Produced</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-success/10 text-success' :
                    order.status === 'in-progress' ? 'bg-primary/10 text-primary' :
                    order.status === 'planned' ? 'bg-warning/10 text-warning' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
