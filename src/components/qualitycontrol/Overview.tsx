import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchQualityChecks } from '@/redux/slices/qualityCheckSlice';
import { fetchQualityAlerts } from '@/redux/slices/qualityAlertSlice';
import { fetchQualityTeams } from '@/redux/slices/qualityTeamSlice';
import { fetchControlPoints } from '@/redux/slices/controlPointSlice';
import { 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Users,
  Target,
  Bell
} from 'lucide-react';

const Overview: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { qualityChecks = [], loading: checksLoading } = useSelector((state: RootState) => state.qualityChecks);
  const { qualityAlerts = [], loading: alertsLoading } = useSelector((state: RootState) => state.qualityAlerts);
  const { qualityTeams = [], loading: teamsLoading } = useSelector((state: RootState) => state.qualityTeams);
  const { controlPoints = [], loading: controlPointsLoading } = useSelector((state: RootState) => state.controlPoints);
  const { userProfile } = useSelector((state: RootState) => state.auth);

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
              limit: 1000, // Get all for overview
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
            dispatch(fetchControlPoints({
              organisationId,
              page: 1,
              limit: 1000,
              location: isLocationRestricted ? userProfile?.location : 'all',
            }))
          ]);
        } catch (error) {
          console.error('Error loading overview data:', error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [dispatch, organisationId, userProfile?.location, isLocationRestricted]);
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

  const activeControlPoints = controlPoints.filter(cp => cp.active).length;
  const activeTeams = qualityTeams.filter(team => team.isActive).length;

  // Recent activities (last 5 items) - create copies before sorting
  const recentChecks = [...qualityChecks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentAlerts = [...qualityAlerts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Show loading state
  if (loading || checksLoading || alertsLoading || teamsLoading || controlPointsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 bg-gray-300 rounded"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white shadow rounded-lg animate-pulse">
          <div className="px-4 py-5 sm:p-6">
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Quality Checks</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalChecks}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Pass Rate</span>
                <span className={`font-medium ${passRate >= '90' ? 'text-green-600' : passRate >= '70' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {passRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Quality Alerts</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalAlerts}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Open Alerts</span>
                <span className={`font-medium ${openAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {openAlerts}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Control Points</dt>
                  <dd className="text-lg font-medium text-gray-900">{controlPoints.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Active</span>
                <span className="font-medium text-green-600">{activeControlPoints}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Quality Teams</dt>
                  <dd className="text-lg font-medium text-gray-900">{qualityTeams.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Active Teams</span>
                <span className="font-medium text-green-600">{activeTeams}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Performance Chart */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quality Performance Overview</h3>
          
          {/* Quality Metrics Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Check Results Distribution</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">Passed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{passedChecks}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-gray-700">Failed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${totalChecks > 0 ? (failedChecks / totalChecks) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{failedChecks}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-700">Pending</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${totalChecks > 0 ? (pendingChecks / totalChecks) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{pendingChecks}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Alert Status Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Total Alerts</span>
                  <span className="text-sm font-medium text-gray-900">{totalAlerts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Open Alerts</span>
                  <span className={`text-sm font-medium ${openAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {openAlerts}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Resolved</span>
                  <span className="text-sm font-medium text-green-600">{resolvedAlerts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Urgent Priority</span>
                  <span className={`text-sm font-medium ${urgentAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {urgentAlerts}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Quality Checks */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Quality Checks</h3>
            {recentChecks.length > 0 ? (
              <div className="space-y-3">
                {recentChecks.map((check) => (
                  <div key={check._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      {getResultIcon(check.result)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{check.checkId}</p>
                        <p className="text-sm text-gray-500">{check.product}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {new Date(check.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">{check.performedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No quality checks</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first quality check.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Quality Alerts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Quality Alerts</h3>
            {recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div key={alert._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{alert.alertId}</p>
                        <p className="text-sm text-gray-500">{alert.product}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No quality alerts</h3>
                <p className="mt-1 text-sm text-gray-500">All systems are running smoothly.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              New Quality Check
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
              <Bell className="h-4 w-4 mr-2" />
              Create Alert
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              <Target className="h-4 w-4 mr-2" />
              Add Control Point
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;