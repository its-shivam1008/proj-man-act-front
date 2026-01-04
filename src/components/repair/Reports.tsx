import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BarChart3, DollarSign, Clock, Star, TrendingUp, Users, Package, AlertCircle, Download, Calendar } from 'lucide-react';
import { usePermission } from '@/hooks/userPermission';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import { fetchRepairOrders } from '@/redux/slices/repairOrderSlice';
import { fetchRepairTeams } from '@/redux/slices/repairTeamSlice';
import { fetchRepairTemplates } from '@/redux/slices/repairTemplateSice';

const Reports: React.FC = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);
  const { data: repairOrders } = useSelector((state: any) => state.repairOrders);
  const { data: repairTeams } = useSelector((state: any) => state.repairTeams);
  const { data: repairTemplates } = useSelector((state: any) => state.repairTemplates);
  
  // Permissions
  const canView = usePermission('repair', 'view');
  
  // Local state for this component's location filter
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedReport, setSelectedReport] = useState('summary');
  
  // Location restrictions
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;
  
  // Get locations from master data
  const masterDataLocations = React.useMemo(() => {
    return locations || [];
  }, [locations]);

  // Helper function to get location name by ID
  const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    const location = masterDataLocations.find((loc: any) => loc._id === locationId);
    return location ? location.name : locationId;
  };

  // Load master data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location") as any);
  }, [dispatch]);

  // Set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Load data when filters change
  useEffect(() => {
    const organisationId = localStorage.getItem('organisationId');
    
    if (organisationId && canView && userProfile) {
      const locationParam = locationFilter !== 'all' ? locationFilter : undefined;
      
      dispatch(fetchRepairOrders({ location: locationParam }) as any);
      dispatch(fetchRepairTeams(locationParam) as any);
      dispatch(fetchRepairTemplates({ location: locationParam }) as any);
    }
  }, [locationFilter, canView, dispatch, userProfile]);

  // Filter orders based on location restrictions and date range
  const filteredOrders = React.useMemo(() => {
    let orders = repairOrders;
    
    // Apply location restriction
    if (isLocationRestricted && userProfile?.location) {
      orders = orders.filter((order: any) => order.location === userProfile.location);
    } else if (locationFilter !== 'all') {
      orders = orders.filter((order: any) => order.location === locationFilter);
    }
    
    // Apply date range filter
    if (dateRange !== 'all') {
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      orders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= cutoffDate;
      });
    }
    
    return orders;
  }, [repairOrders, isLocationRestricted, userProfile?.location, locationFilter, dateRange]);

  // Calculate comprehensive metrics
  const metrics = React.useMemo(() => {
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((r: any) => r.status === 'done').length;
    const inProgressOrders = filteredOrders.filter((r: any) => r.status === 'under-repair').length;
    const pendingOrders = filteredOrders.filter((r: any) => r.status === 'draft' || r.status === 'confirmed').length;
    const cancelledOrders = filteredOrders.filter((r: any) => r.status === 'cancelled').length;
    
    const totalPartsCost = filteredOrders.reduce((sum: number, r: any) => sum + (r.partsCost || 0), 0);
    const totalLaborCost = filteredOrders.reduce((sum: number, r: any) => sum + (r.laborCost || 0), 0);
    const totalCost = filteredOrders.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0);
    
    const warrantyRepairs = filteredOrders.filter((r: any) => r.repairType === 'warranty').length;
    const paidRepairs = filteredOrders.filter((r: any) => r.repairType === 'paid').length;
    const internalRepairs = filteredOrders.filter((r: any) => r.repairType === 'internal').length;
    
    const highPriorityOrders = filteredOrders.filter((r: any) => r.priority === 'high').length;
    const mediumPriorityOrders = filteredOrders.filter((r: any) => r.priority === 'medium').length;
    const lowPriorityOrders = filteredOrders.filter((r: any) => r.priority === 'low').length;
    
    // Calculate average turnaround time for completed orders
    const completedOrdersWithDates = filteredOrders.filter((r: any) => 
      r.status === 'done' && r.createdAt && r.updatedAt
    );
    
    const avgTurnaroundTime = completedOrdersWithDates.length > 0 
      ? completedOrdersWithDates.reduce((sum: number, r: any) => {
          const created = new Date(r.createdAt);
          const completed = new Date(r.updatedAt);
          const diffDays = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }, 0) / completedOrdersWithDates.length
      : 0;
    
    return {
      totalOrders,
      completedOrders,
      inProgressOrders,
      pendingOrders,
      cancelledOrders,
      completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
      totalPartsCost,
      totalLaborCost,
      totalCost,
      avgRepairCost: totalOrders > 0 ? totalCost / totalOrders : 0,
      warrantyRepairs,
      paidRepairs,
      internalRepairs,
      highPriorityOrders,
      mediumPriorityOrders,
      lowPriorityOrders,
      avgTurnaroundTime: Math.round(avgTurnaroundTime * 10) / 10, // Round to 1 decimal
    };
  }, [filteredOrders]);

  // Export functionality
  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      location: locationFilter === 'all' ? 'All Locations' : getLocationName(locationFilter),
      dateRange: dateRange === 'all' ? 'All Time' : `Last ${dateRange} days`,
      metrics,
      orders: filteredOrders.map((order: any) => ({
        id: order._id,
        customerName: order.customerName,
        repairType: order.repairType,
        priority: order.priority,
        status: order.status,
        totalCost: order.totalCost || 0,
        createdAt: order.createdAt,
        location: getLocationName(order.location),
      }))
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repair-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-600">You do not have permission to view reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {!isLocationRestricted && masterDataLocations.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter by Location:</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Locations</option>
                  {masterDataLocations.map((location: any) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
            
            {isLocationRestricted && (
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                Location: {getLocationName(userProfile?.location)}
              </div>
            )}
          </div>
          
          <button
            onClick={handleExportReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</div>
              <div className="text-sm text-gray-500">Total Repairs</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{metrics.completionRate}%</div>
              <div className="text-sm text-gray-500">Completion Rate</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">${metrics.totalCost.toFixed(0)}</div>
              <div className="text-sm text-gray-500">Total Cost</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{metrics.avgTurnaroundTime}</div>
              <div className="text-sm text-gray-500">Avg Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div 
          className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${
            selectedReport === 'summary' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedReport('summary')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Repair Summary</h3>
              <p className="text-sm text-gray-500">By status, type, priority</p>
            </div>
          </div>
        </div>
        
        <div 
          className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${
            selectedReport === 'cost' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedReport('cost')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Cost Analysis</h3>
              <p className="text-sm text-gray-500">Parts vs labor breakdown</p>
            </div>
          </div>
        </div>
        
        <div 
          className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${
            selectedReport === 'performance' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedReport('performance')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Performance</h3>
              <p className="text-sm text-gray-500">Turnaround & efficiency</p>
            </div>
          </div>
        </div>
        
        <div 
          className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${
            selectedReport === 'teams' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedReport('teams')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Team Analysis</h3>
              <p className="text-sm text-gray-500">Team performance metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Report Content */}
      {selectedReport === 'summary' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Repair Summary Report</h3>
            <p className="text-sm text-gray-500 mt-1">
              {isLocationRestricted ? 'Showing data for your location only' : `Showing data for ${locationFilter === 'all' ? 'all locations' : getLocationName(locationFilter)}`}
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Repairs by Type</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Warranty</span>
                    <span className="text-sm font-medium text-gray-900">{metrics.warrantyRepairs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paid</span>
                    <span className="text-sm font-medium text-gray-900">{metrics.paidRepairs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Internal</span>
                    <span className="text-sm font-medium text-gray-900">{metrics.internalRepairs}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Repairs by Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-green-600">{metrics.completedOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="text-sm font-medium text-yellow-600">{metrics.inProgressOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-sm font-medium text-blue-600">{metrics.pendingOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cancelled</span>
                    <span className="text-sm font-medium text-red-600">{metrics.cancelledOrders}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Repairs by Priority</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High Priority</span>
                    <span className="text-sm font-medium text-red-600">{metrics.highPriorityOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medium Priority</span>
                    <span className="text-sm font-medium text-yellow-600">{metrics.mediumPriorityOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Low Priority</span>
                    <span className="text-sm font-medium text-green-600">{metrics.lowPriorityOrders}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'cost' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Cost Analysis Report</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Cost Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Parts Cost</span>
                    <span className="text-sm font-medium text-gray-900">${metrics.totalPartsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Labor Cost</span>
                    <span className="text-sm font-medium text-gray-900">${metrics.totalLaborCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-sm font-medium text-gray-700">Total Cost</span>
                    <span className="text-sm font-bold text-gray-900">${metrics.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Repair Cost</span>
                    <span className="text-sm font-medium text-gray-900">${metrics.avgRepairCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Cost Distribution</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Parts Cost</span>
                      <span>{metrics.totalCost > 0 ? Math.round((metrics.totalPartsCost / metrics.totalCost) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${metrics.totalCost > 0 ? (metrics.totalPartsCost / metrics.totalCost) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Labor Cost</span>
                      <span>{metrics.totalCost > 0 ? Math.round((metrics.totalLaborCost / metrics.totalCost) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${metrics.totalCost > 0 ? (metrics.totalLaborCost / metrics.totalCost) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'performance' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{metrics.completedOrders}</div>
                <div className="text-sm text-gray-500">Completed Repairs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{metrics.inProgressOrders}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{metrics.completionRate}%</div>
                <div className="text-sm text-gray-500">Completion Rate</div>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Turnaround Time</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Turnaround Time</span>
                  <span className="text-lg font-bold text-purple-600">{metrics.avgTurnaroundTime} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'teams' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Team Analysis</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Team Overview</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Teams</span>
                    <span className="text-sm font-medium text-gray-900">{repairTeams.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Templates</span>
                    <span className="text-sm font-medium text-gray-900">
                      {repairTemplates.filter((t: any) => t.isActive).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Templates</span>
                    <span className="text-sm font-medium text-gray-900">{repairTemplates.length}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Workload Distribution</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Repairs per Team</span>
                    <span className="text-sm font-medium text-gray-900">
                      {repairTeams.length > 0 ? Math.round(metrics.totalOrders / repairTeams.length) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Cost per Team</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${repairTeams.length > 0 ? (metrics.totalCost / repairTeams.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;