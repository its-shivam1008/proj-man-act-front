import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchQualityChecks } from '@/redux/slices/qualityCheckSlice';
import { fetchQualityAlerts } from '@/redux/slices/qualityAlertSlice';
import { fetchQualityTeams } from '@/redux/slices/qualityTeamSlice';
import { fetchQualityTags } from '@/redux/slices/qualityTagSlice';
import { fetchControlPoints } from '@/redux/slices/controlPointSlice';
import { BarChart3, FileText, Download, TrendingUp, Activity, AlertTriangle, CheckCircle, Clock, Users, Target, Tag } from 'lucide-react';

interface ReportsProps {
  // Remove props since we'll use Redux data
}

const Reports: React.FC<ReportsProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { qualityChecks = [], loading: checksLoading } = useSelector((state: RootState) => state.qualityChecks);
  const { qualityAlerts = [], loading: alertsLoading } = useSelector((state: RootState) => state.qualityAlerts);
  const { qualityTeams = [], loading: teamsLoading } = useSelector((state: RootState) => state.qualityTeams);
  const { qualityTags = [], loading: tagsLoading } = useSelector((state: RootState) => state.qualityTags);
  const { controlPoints = [], loading: controlPointsLoading } = useSelector((state: RootState) => state.controlPoints);
  const { userProfile } = useSelector((state: RootState) => state.auth);

  const [selectedReportType, setSelectedReportType] = useState('quality-performance');
  const [dateRange, setDateRange] = useState('last-30-days');
  const [loading, setLoading] = useState(true);

  // Get organisation ID
  const organisationId = localStorage.getItem('organisationId');

  // Location restrictions
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  // Load all data on mount
  useEffect(() => {
    if (organisationId) {
      const loadData = async () => {
        setLoading(true);
        try {
          // Load all quality data
          await Promise.all([
            dispatch(fetchQualityChecks({
              organisationId,
              page: 1,
              limit: 1000, // Get all for reporting
              location: isLocationRestricted ? userProfile?.location : 'all',
            })),
            dispatch(fetchQualityAlerts({
              organisationId,
              page: 1,
              limit: 1000,
              location: isLocationRestricted ? userProfile?.location : 'all',
            })),
            dispatch(fetchQualityTeams({
              organisationId,
              page: 1,
              limit: 1000,
              location: isLocationRestricted ? userProfile?.location : 'all',
            })),
            dispatch(fetchQualityTags({
              organisationId,
              page: 1,
              limit: 1000,
              location: isLocationRestricted ? userProfile?.location : 'all',
            })),
            dispatch(fetchControlPoints({
              organisationId,
              page: 1,
              limit: 1000,
              location: isLocationRestricted ? userProfile?.location : 'all',
            })),
          ]);
        } catch (error) {
          console.error('Error loading quality data:', error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [dispatch, organisationId, isLocationRestricted, userProfile]);

  // Calculate metrics from Redux data
  const totalChecks = qualityChecks.length;
  const passedChecks = qualityChecks.filter(check => check.result === 'pass').length;
  const failedChecks = qualityChecks.filter(check => check.result === 'fail').length;
  const pendingChecks = qualityChecks.filter(check => check.result === 'pending').length;
  const passRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : '0';

  const totalAlerts = qualityAlerts.length;
  const openAlerts = qualityAlerts.filter(alert => alert.status === 'new' || alert.status === 'in-progress').length;
  const resolvedAlerts = qualityAlerts.filter(alert => alert.status === 'resolved').length;
  const urgentAlerts = qualityAlerts.filter(alert => alert.priority === 'urgent').length;
  const highPriorityAlerts = qualityAlerts.filter(alert => alert.priority === 'high').length;

  const activeControlPoints = controlPoints.filter(cp => cp.active).length;
  const activeTeams = qualityTeams.filter(team => team.isActive).length;
  const totalTags = qualityTags.length;

  // Calculate defect categories
  const defectsByOperation = qualityAlerts.reduce((acc, alert) => {
    acc[alert.operation] = (acc[alert.operation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const defectsByPriority = qualityAlerts.reduce((acc, alert) => {
    acc[alert.priority] = (acc[alert.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate team performance
  const teamPerformance = qualityTeams.map(team => {
    const teamAlerts = qualityAlerts.filter(alert => alert.responsibleTeam === team.teamName);
    const resolvedByTeam = teamAlerts.filter(alert => alert.status === 'resolved').length;
    const totalByTeam = teamAlerts.length;
    const resolutionRate = totalByTeam > 0 ? ((resolvedByTeam / totalByTeam) * 100).toFixed(1) : '0';
    
    return {
      teamName: team.teamName,
      totalAlerts: totalByTeam,
      resolvedAlerts: resolvedByTeam,
      resolutionRate: parseFloat(resolutionRate),
      department: team.department,
      isActive: team.isActive,
    };
  });

  const reportTypes = [
    {
      id: 'quality-performance',
      name: 'Quality Performance',
      description: 'Overall quality metrics and trends',
      icon: TrendingUp
    },
    {
      id: 'defect-analysis',
      name: 'Defect Analysis',
      description: 'Detailed analysis of quality issues',
      icon: Activity
    },
    {
      id: 'compliance-report',
      name: 'Compliance Report',
      description: 'Regulatory compliance status',
      icon: FileText
    },
    {
      id: 'team-performance',
      name: 'Team Performance',
      description: 'Quality team productivity metrics',
      icon: BarChart3
    }
  ];

  const generateReport = () => {
    // Create CSV content
    let csvContent = '';
    
    if (selectedReportType === 'quality-performance') {
      csvContent = `Quality Performance Report - ${dateRange}\n\n`;
      csvContent += `Metric,Value\n`;
      csvContent += `Total Checks,${totalChecks}\n`;
      csvContent += `Pass Rate,${passRate}%\n`;
      csvContent += `Failed Checks,${failedChecks}\n`;
      csvContent += `Pending Checks,${pendingChecks}\n`;
      csvContent += `Total Alerts,${totalAlerts}\n`;
      csvContent += `Open Alerts,${openAlerts}\n`;
      csvContent += `Resolved Alerts,${resolvedAlerts}\n`;
      csvContent += `Active Teams,${activeTeams}\n`;
      csvContent += `Active Control Points,${activeControlPoints}\n`;
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-report-${selectedReportType}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const QualityPerformanceReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Checks</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalChecks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pass Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{passRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Open Alerts</dt>
                  <dd className="text-lg font-medium text-gray-900">{openAlerts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Control Points</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeControlPoints}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Teams</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeTeams}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Tag className="h-6 w-6 text-pink-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Quality Tags</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalTags}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Checks</dt>
                  <dd className="text-lg font-medium text-gray-900">{pendingChecks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Urgent Alerts</dt>
                  <dd className="text-lg font-medium text-gray-900">{urgentAlerts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Check Results Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Passed</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">{passedChecks}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Failed</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${totalChecks > 0 ? (failedChecks / totalChecks) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">{failedChecks}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Pending</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${totalChecks > 0 ? (pendingChecks / totalChecks) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">{pendingChecks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Alert Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Open Alerts</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  {openAlerts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Resolved</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {resolvedAlerts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Urgent Priority</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                  {urgentAlerts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">High Priority</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  {highPriorityAlerts}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DefectAnalysisReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Defects by Operation</h3>
            <div className="space-y-3">
              {Object.entries(defectsByOperation).map(([operation, count]) => (
                <div key={operation} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">{operation}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${totalAlerts > 0 ? (count / totalAlerts) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(defectsByOperation).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No defect data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Defects by Priority</h3>
            <div className="space-y-3">
              {Object.entries(defectsByPriority).map(([priority, count]) => {
                const getColorClass = (priority: string) => {
                  switch (priority) {
                    case 'urgent': return 'bg-red-600';
                    case 'high': return 'bg-orange-600';
                    case 'medium': return 'bg-yellow-600';
                    case 'low': return 'bg-green-600';
                    default: return 'bg-gray-600';
                  }
                };

                return (
                  <div key={priority} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">{priority}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className={`${getColorClass(priority)} h-2 rounded-full`}
                          style={{ width: `${totalAlerts > 0 ? (count / totalAlerts) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{count}</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(defectsByPriority).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No priority data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Quality Alerts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qualityAlerts.slice(0, 10).map((alert) => (
                  <tr key={alert._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {alert.alertNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {alert.product}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {alert.operation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alert.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        alert.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {alert.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {qualityAlerts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No quality alerts found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ComplianceReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Compliance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Overall Compliance Rate</span>
                <span className="text-2xl font-bold text-green-600">{passRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Active Control Points</span>
                <span className="text-lg font-semibold text-blue-600">{activeControlPoints}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Quality Teams</span>
                <span className="text-lg font-semibold text-purple-600">{activeTeams}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Open Non-Compliance Issues</span>
                <span className="text-lg font-semibold text-red-600">{openAlerts}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Control Point Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Active Points</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {activeControlPoints}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Inactive Points</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {controlPoints.length - activeControlPoints}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Points</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {controlPoints.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TeamPerformanceReport = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Team Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Alerts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamPerformance.map((team, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {team.teamName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {team.department.replace('-', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {team.totalAlerts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {team.resolvedAlerts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            team.resolutionRate >= 80 ? 'bg-green-600' :
                            team.resolutionRate >= 60 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${team.resolutionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{team.resolutionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      team.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {team.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teamPerformance.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No team performance data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    if (loading || checksLoading || alertsLoading || teamsLoading || tagsLoading || controlPointsLoading) {
      return (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500">Loading report data...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (selectedReportType) {
      case 'quality-performance':
        return <QualityPerformanceReport />;
      case 'defect-analysis':
        return <DefectAnalysisReport />;
      case 'compliance-report':
        return <ComplianceReport />;
      case 'team-performance':
        return <TeamPerformanceReport />;
      default:
        return <QualityPerformanceReport />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Quality Reports & Analytics</h3>
            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="last-90-days">Last 90 Days</option>
                <option value="last-year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <button
                onClick={generateReport}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportType(report.id)}
                  className={`p-4 text-left border rounded-lg transition-colors ${
                    selectedReportType === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Icon className={`h-5 w-5 mr-2 ${
                      selectedReportType === report.id ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <h4 className={`font-medium ${
                      selectedReportType === report.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {report.name}
                    </h4>
                  </div>
                  <p className={`text-sm ${
                    selectedReportType === report.id ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {report.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default Reports;