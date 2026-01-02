import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, Wrench, Package, Fuel, Shield, AlertTriangle,
  CheckCircle, Clock, DollarSign, Activity, BarChart3,
  CircuitBoard,
  Users,
  PlaneTakeoff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { BASE_URL } from '../../../utils/constants';

interface DashboardStats {
  totalEquipment: number;
  operational: number;
  underMaintenance: number;
  breakdowns: number;
  overduePM: number;
  equipmentCosting: number;
  assetDisposalTransfer: number;
  calibrationSafety: number;
  preventivePlanning: number;
  teamsAndTechnicians: number;
}

const PlantMachineryDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEquipment: 0,
    operational: 0,
    underMaintenance: 0,
    breakdowns: 0,
    overduePM: 0,
    equipmentCosting: 0,
    assetDisposalTransfer: 0,
    calibrationSafety: 0,
    preventivePlanning: 0,
    teamsAndTechnicians: 0,
  });
  const [loading, setLoading] = useState(true);

  const organisationId = localStorage.getItem('organisationId');

  useEffect(() => {
    if (organisationId) {
      fetchDashboardStats();
    }
  }, [organisationId]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('Fetching dashboard stats for organisation:', organisationId);
      console.log('BASE_URL:', BASE_URL);

      // Fetch stats from all modules
      const [
        equipmentCostingResponse,
        assetDisposalResponse,
        calibrationResponse,
        preventivePlanningResponse,
        teamsResponse,
        breakdownResponse
      ] = await Promise.allSettled([
        // Equipment Costing stats (we know this works)
        fetch(`${BASE_URL}/equipment-costing/stats?organisationId=${organisationId}`, { headers }),
        // Asset Disposal Transfer stats (we know this works)
        fetch(`${BASE_URL}/asset-disposal-transfer/stats?organisationId=${organisationId}`, { headers }),
        // Calibration Safety stats
        fetch(`${BASE_URL}/calibration-safety/stats?organisationId=${organisationId}`, { headers }),
        // Preventive Planning stats
        fetch(`${BASE_URL}/preventive-planning/stats?organisationId=${organisationId}`, { headers }),
        // Teams and Technicians stats
        fetch(`${BASE_URL}/teams-technicians/stats?organisationId=${organisationId}`, { headers }),
        // Breakdown Maintenance stats
        fetch(`${BASE_URL}/breakdown-maintenance/stats?organisationId=${organisationId}`, { headers })
      ]);

      // Process responses
      const newStats: DashboardStats = {
        totalEquipment: 0,
        operational: 0,
        underMaintenance: 0,
        breakdowns: 0,
        overduePM: 0,
        equipmentCosting: 0,
        assetDisposalTransfer: 0,
        calibrationSafety: 0,
        preventivePlanning: 0,
        teamsAndTechnicians: 0,
      };

      // Calibration Safety stats
      if (calibrationResponse.status === 'fulfilled') {
        try {
          const response = calibrationResponse.value;
          console.log('Calibration Response Status:', response.status);
          
          const calibrationData = await response.json();
          console.log('Calibration Data:', calibrationData);
          
          if (calibrationData.success) {
            newStats.calibrationSafety = calibrationData.data.totalRecords || 0;
          }
        } catch (e) {
          console.log('Calibration safety stats error:', e);
        }
      }

      // Preventive Planning stats
      if (preventivePlanningResponse.status === 'fulfilled') {
        try {
          const response = preventivePlanningResponse.value;
          console.log('Preventive Planning Response Status:', response.status);
          
          const planningData = await response.json();
          console.log('Preventive Planning Data:', planningData);
          
          if (planningData.success) {
            newStats.preventivePlanning = planningData.data.totalRecords || 0;
            // Use overdue count for overdue PM
            if (planningData.data.overdue !== undefined) {
              newStats.overduePM = planningData.data.overdue || 0;
            }
          }
        } catch (e) {
          console.log('Preventive planning stats error:', e);
        }
      }

      // Teams and Technicians stats
      if (teamsResponse.status === 'fulfilled') {
        try {
          const response = teamsResponse.value;
          console.log('Teams Response Status:', response.status);
          
          if (response.ok) {
            const teamsData = await response.json();
            console.log('Teams Data:', teamsData);
            
            if (teamsData.success) {
              newStats.teamsAndTechnicians = teamsData.data.totalRecords || 0;
            }
          } else {
            console.log('Teams API returned error status:', response.status);
          }
        } catch (e) {
          console.log('Teams stats error:', e);
        }
      } else {
        console.log('Teams API call failed:', teamsResponse.reason);
      }

      // Breakdown Maintenance stats
      if (breakdownResponse.status === 'fulfilled') {
        try {
          const response = breakdownResponse.value;
          console.log('Breakdown Response Status:', response.status);
          
          const breakdownData = await response.json();
          console.log('Breakdown Data:', breakdownData);
          
          if (breakdownData.success) {
            newStats.breakdowns = breakdownData.data.totalBreakdowns || 0;
            // Use open breakdowns for immediate attention count
            if (breakdownData.data.openBreakdowns !== undefined) {
              newStats.breakdowns = breakdownData.data.openBreakdowns || 0;
            }
          }
        } catch (e) {
          console.log('Breakdown stats error:', e);
        }
      }

      // Equipment Costing stats
      if (equipmentCostingResponse.status === 'fulfilled') {
        try {
          const response = equipmentCostingResponse.value;
          console.log('Equipment Costing Response Status:', response.status);
          
          if (response.ok) {
            const costingData = await response.json();
            console.log('Equipment Costing Data:', costingData);
            
            if (costingData.success) {
              newStats.equipmentCosting = costingData.data.totalEquipment || 0;
              // Use equipment costing data for total equipment count
              newStats.totalEquipment = costingData.data.totalEquipment || 0;
              
              // Estimate operational and under maintenance based on breakdowns
              // Assume most equipment is operational unless there are active breakdowns
              const totalEquip = costingData.data.totalEquipment || 0;
              if (totalEquip > 0) {
                // Estimate: operational = total - breakdowns, under maintenance = some portion of breakdowns
                newStats.operational = Math.max(0, totalEquip - (newStats.breakdowns || 0));
                newStats.underMaintenance = Math.min(newStats.breakdowns || 0, Math.ceil(totalEquip * 0.1)); // Max 10% under maintenance
              }
            }
          } else {
            console.log('Equipment Costing API returned error status:', response.status);
          }
        } catch (e) {
          console.log('Equipment costing stats error:', e);
        }
      } else {
        console.log('Equipment Costing API call failed:', equipmentCostingResponse.reason);
      }

      // Asset Disposal Transfer stats
      if (assetDisposalResponse.status === 'fulfilled') {
        try {
          const response = assetDisposalResponse.value;
          console.log('Asset Disposal Response Status:', response.status);
          
          const disposalData = await response.json();
          console.log('Asset Disposal Data:', disposalData);
          
          if (disposalData.success) {
            newStats.assetDisposalTransfer = disposalData.data.totalRecords || 0;
          }
        } catch (e) {
          console.log('Asset disposal stats error:', e);
        }
      }

      console.log('Final Stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
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
      count: 0, // This would need its own API endpoint
      description: 'Track equipment usage and allocation'
    },
    {
      name: 'Preventive Maintenance',
      href: '/plant-machinery/preventive-maintenance',
      icon: CheckCircle,
      color: 'bg-yellow-600',
      count: 0, // This would need its own API endpoint
      description: 'Schedule and track PM activities'
    },
    {
      name: 'Breakdown Maintenance',
      href: '/plant-machinery/breakdown',
      icon: Wrench,
      color: 'bg-destructive',
      count: stats.breakdowns,
      description: 'Handle equipment failures'
    },
    {
      name: 'Spare Parts',
      href: '/plant-machinery/spare-parts',
      icon: Package,
      color: 'bg-blue-400',
      count: 0, // This would need its own API endpoint
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
      count: stats.calibrationSafety,
      description: 'Manage certifications and compliance'
    },
    {
      name: 'Equipment Costing',
      href: '/plant-machinery/costing',
      icon: DollarSign,
      color: 'bg-green-600',
      count: stats.equipmentCosting,
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
      count: stats.preventivePlanning,
      description: 'View KPIs and performance metrics'
    },
    {
      name: 'Teams and Technicians',
      href: '/plant-machinery/teams',
      icon: Users,
      color: 'bg-indigo-700',
      count: stats.teamsAndTechnicians,
      description: 'View KPIs and performance metrics'
    },
    {
      name: 'Kanban board',
      href: '/plant-machinery/kanban',
      icon: CircuitBoard,
      color: 'bg-yellow-700',
      count: 0,
      description: 'View KPIs and performance metrics'
    },
    {
      name: 'Assets Disposal Transfer',
      href: '/plant-machinery/asset-disposal-transfer',
      icon: Activity,
      color: 'bg-red-600',
      count: stats.assetDisposalTransfer,
      description: 'Manage asset disposal and transfers'
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
            <div className="text-2xl font-bold text-foreground">
              {loading ? '...' : stats.totalEquipment}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Registered assets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operational</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {loading ? '...' : stats.operational}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{utilizationRate}% utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {loading ? '...' : stats.underMaintenance}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In service</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Breakdowns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {loading ? '...' : stats.breakdowns}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue PM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {loading ? '...' : stats.overduePM}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Maintenance overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      {!loading && (stats.breakdowns > 0 || stats.overduePM > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.breakdowns > 0 && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="font-semibold">{stats.breakdowns} Active Breakdowns</p>
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
      {!loading && stats.totalEquipment > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.equipmentCosting}</div>
                <p className="text-sm text-muted-foreground">Equipment Costing Records</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.assetDisposalTransfer}</div>
                <p className="text-sm text-muted-foreground">Asset Disposals</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.calibrationSafety}</div>
                <p className="text-sm text-muted-foreground">Calibration Records</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.teamsAndTechnicians}</div>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlantMachineryDashboard;
