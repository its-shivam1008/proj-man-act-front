import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, Wrench, Package, Fuel, Shield, TrendingUp, AlertTriangle,
  CheckCircle, Clock, DollarSign, Activity, BarChart3,
  CircuitBoard,
  User,
  Users,
  PlaneTakeoff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { getFromStorage, PM_STORAGE_KEYS } from '../../../utils/plantMachineryStorage';
import type { Equipment, PreventiveMaintenance, BreakdownMaintenance, SparePart } from '../../../types/plantMachinery';

const PlantMachineryDashboard: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [preventiveMaintenance, setPreventiveMaintenance] = useState<PreventiveMaintenance[]>([]);
  const [breakdowns, setBreakdowns] = useState<BreakdownMaintenance[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);

  useEffect(() => {
    setEquipment(getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT));
    setPreventiveMaintenance(getFromStorage<PreventiveMaintenance>(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE));
    setBreakdowns(getFromStorage<BreakdownMaintenance>(PM_STORAGE_KEYS.BREAKDOWN_MAINTENANCE));
    setSpareParts(getFromStorage<SparePart>(PM_STORAGE_KEYS.SPARE_PARTS));
  }, []);

  const stats = {
    totalEquipment: equipment.length,
    operational: equipment.filter(e => e.status === 'operational').length,
    underMaintenance: equipment.filter(e => e.status === 'under-maintenance').length,
    breakdown: equipment.filter(e => e.status === 'breakdown').length,
    idle: equipment.filter(e => e.status === 'idle').length,
    scheduledPM: preventiveMaintenance.filter(pm => pm.status === 'scheduled').length,
    overduePM: preventiveMaintenance.filter(pm => pm.status === 'overdue').length,
    activeBreakdowns: breakdowns.filter(b => b.status !== 'completed').length,
    lowStockParts: spareParts.filter(p => p.status === 'low-stock' || p.status === 'out-of-stock').length,
  };

  const utilizationRate = stats.totalEquipment > 0 
    ? ((stats.operational / stats.totalEquipment) * 100).toFixed(1) 
    : '0';

  const modules = [
    {
      name: 'Equipment Master',
      href: '/plant-machinery/equipment',
      icon: Settings,
      color: 'bg-primary',
      count: stats.totalEquipment,
      description: 'Manage all machinery and equipment'
    },
    {
      name: 'Equipment Allocation',
      href: '/plant-machinery/allocation',
      icon: Activity,
      color: 'bg-pink-500',
      count: stats.operational,
      description: 'Track equipment usage and allocation'
    },
    {
      name: 'Preventive Maintenance',
      href: '/plant-machinery/preventive-maintenance',
      icon: CheckCircle,
      color: 'bg-yellow-600',
      count: stats.scheduledPM,
      description: 'Schedule and track PM activities'
    },
    {
      name: 'Breakdown Maintenance',
      href: '/plant-machinery/breakdown',
      icon: Wrench,
      color: 'bg-destructive',
      count: stats.activeBreakdowns,
      description: 'Handle equipment failures'
    },
    {
      name: 'Spare Parts',
      href: '/plant-machinery/spare-parts',
      icon: Package,
      color: 'bg-blue-400',
      count: spareParts.length,
      description: 'Manage spare parts inventory'
    },
    {
      name: 'Fuel & Lubricants',
      href: '/plant-machinery/fuel',
      icon: Fuel,
      color: 'bg-orange-500',
      count: 0,
      description: 'Track fuel and lubricant consumption'
    },
    {
      name: 'Calibration & Safety',
      href: '/plant-machinery/safety',
      icon: Shield,
      color: 'bg-purple-500',
      count: 0,
      description: 'Manage certifications and compliance'
    },
    {
      name: 'Equipment Costing',
      href: '/plant-machinery/costing',
      icon: DollarSign,
      color: 'bg-green-600',
      count: 0,
      description: 'Track costs and depreciation'
    },
    {
      name: 'Reports & Analytics',
      href: '/plant-machinery/reports',
      icon: BarChart3,
      color: 'bg-violet-700',
      count: 0,
      description: 'View KPIs and performance metrics'
    },
    {
      name: 'Preventive Planning',
      href: '/plant-machinery/preventive-planning',
      icon: PlaneTakeoff,
      color: 'bg-cyan-700',
      count: 0,
      description: 'View KPIs and performance metrics'
    },
    {
      name: 'Teams and Technicians',
      href: '/plant-machinery/teams',
      icon: Users,
      color: 'bg-indigo-700',
      count: 0,
      description: 'View KPIs and performance metrics'
    },
    {
      name: 'Kanban board',
      href: '/plant-machinery/kanban',
      icon: CircuitBoard,
      color: 'bg-yellow-700',
      count: 0,
      description: 'View KPIs and performance metrics'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Plant & Machinery Management</h1>
        <p className="text-muted-foreground mt-1">
          Complete equipment lifecycle management and monitoring
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalEquipment}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered assets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operational</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.operational}</div>
            <p className="text-xs text-muted-foreground mt-1">{utilizationRate}% utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.underMaintenance}</div>
            <p className="text-xs text-muted-foreground mt-1">In service</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Breakdowns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.breakdown}</div>
            <p className="text-xs text-muted-foreground mt-1">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue PM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overduePM}</div>
            <p className="text-xs text-muted-foreground mt-1">Maintenance overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      {(stats.activeBreakdowns > 0 || stats.overduePM > 0 || stats.lowStockParts > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.activeBreakdowns > 0 && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="font-semibold">{stats.activeBreakdowns} Active Breakdowns</p>
                    <p className="text-sm text-muted-foreground">Requires immediate attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.overduePM > 0 && (
            <Card className="border-warning">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-warning" />
                  <div>
                    <p className="font-semibold">{stats.overduePM} Overdue Maintenance</p>
                    <p className="text-sm text-muted-foreground">Schedule maintenance soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.lowStockParts > 0 && (
            <Card className="border-accent">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-accent" />
                  <div>
                    <p className="font-semibold">{stats.lowStockParts} Low Stock Parts</p>
                    <p className="text-sm text-muted-foreground">Reorder spare parts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Module Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.name} to={module.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`${module.color} p-3 rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{module.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                        {module.count > 0 && (
                          <Badge variant="secondary" className="mt-2">
                            {module.count} {module.count === 1 ? 'item' : 'items'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Equipment Status */}
      {equipment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Equipment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {equipment.slice(0, 5).map((eq) => (
                <div key={eq.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{eq.name}</p>
                    <p className="text-sm text-muted-foreground">{eq.equipmentCode} • {eq.location}</p>
                  </div>
                  <Badge
                    variant={
                      eq.status === 'operational' ? 'default' :
                      eq.status === 'under-maintenance' ? 'secondary' :
                      eq.status === 'breakdown' ? 'destructive' : 'outline'
                    }
                  >
                    {eq.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlantMachineryDashboard;
