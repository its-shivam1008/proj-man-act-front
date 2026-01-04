import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Wrench, Clock, CheckCircle, DollarSign, Activity } from 'lucide-react';
import { usePermission } from '@/hooks/userPermission';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import { fetchRepairOrders } from '@/redux/slices/repairOrderSlice';
import { fetchProducts } from '@/redux/slices/productSlice';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);
  const { data: repairOrders } = useSelector((state: any) => state.repairOrders);
  const { products } = useSelector((state: any) => state.products);
  
  // Permissions
  const canView = usePermission('repair', 'view');
  
  // Local state for this component's location filter
  const [locationFilter, setLocationFilter] = useState('all');
  
  // Location restrictions
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;
  
  // Get locations from master data
  const masterDataLocations = React.useMemo(() => {
    return locations || [];
  }, [locations]);

  // Load master data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location") as any);
    dispatch(fetchProducts({ page: 1, limit: 1000 }) as any);
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
    
    if (organisationId && canView) {
      dispatch(fetchRepairOrders({ 
        location: locationFilter !== 'all' ? locationFilter : undefined 
      }) as any);
    }
  }, [locationFilter, canView, dispatch]);

  // Filter orders based on location restrictions
  const filteredOrders = React.useMemo(() => {
    if (!isLocationRestricted || locationFilter === 'all') {
      return repairOrders;
    }
    return repairOrders.filter((order: any) => order.location === locationFilter);
  }, [repairOrders, isLocationRestricted, locationFilter]);

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-600">You do not have permission to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Filter for Dashboard */}
      {!isLocationRestricted && masterDataLocations.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center space-x-4">
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
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wrench className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredOrders.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Under Repair</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredOrders.filter((order: any) => order.status === 'under-repair').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredOrders.filter((order: any) => order.status === 'done').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${filteredOrders.reduce((sum: number, order: any) => sum + (order.totalCost || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
          {isLocationRestricted && (
            <p className="text-sm text-gray-500 mb-4">Showing data for your location only</p>
          )}
          <div className="space-y-4">
            {filteredOrders.slice(0, 5).map((order: any) => {
              const product = products.find((p: any) => (p._id || p.id) === order.productId);
              return (
                <div key={order._id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      Repair order for <span className="font-medium">{product?.name || product?.productName || 'Unknown Product'}</span>
                    </p>
                    <p className="text-sm text-gray-500">Status: {order.status}</p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Repair Status Distribution</h3>
            <div className="space-y-3">
              {['draft', 'confirmed', 'under-repair', 'testing', 'done', 'cancelled'].map(status => {
                const count = filteredOrders.filter((order: any) => order.status === status).length;
                const percentage = filteredOrders.length > 0 ? (count / filteredOrders.length) * 100 : 0;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">{status.replace('-', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{count}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Priority Distribution</h3>
            <div className="space-y-3">
              {['low', 'medium', 'high'].map(priority => {
                const count = filteredOrders.filter((order: any) => order.priority === priority).length;
                const percentage = filteredOrders.length > 0 ? (count / filteredOrders.length) * 100 : 0;
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">{priority}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{count}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            priority === 'high' ? 'bg-red-600' : 
                            priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;