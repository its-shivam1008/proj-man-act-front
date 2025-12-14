import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchMRS } from '@/redux/slices/mrsSlice';
import { fetchProjects } from '@/redux/slices/projectSlice';
import { ShoppingCart, Download, Calendar, Package, Search, CheckCircle } from 'lucide-react';
import api from '@/utils/axiosApi';

interface MRSPurchaseOrderData {
  _id: string;
  materialName: string;
  deliveredTo: string; // source task from MRS
  deliveredOn: string; // received date
  markAsReadDate: string; // when notification was marked as read
  quantity: number;
  unit: string;
  status: 'open' | 'sent' | 'ordered' | 'received' | 'cancelled';
  notificationStatus: 'read' | 'unread';
  purchaseOrderId: string;
}

const MRSPurchaseOrderReport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { list: mrsList, loading } = useSelector((state: RootState) => state.mrs);
  const { projects } = useSelector((state: RootState) => state.projects);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchMRS());
    dispatch(fetchProjects({ organisationId: localStorage.getItem('organisationId') }));
    fetchNotifications();
  }, [dispatch]);

  // Fetch notifications to get mark as read dates
  const fetchNotifications = async () => {
    try {
      const orgId = localStorage.getItem('organisationId');
      const response = await api.get('/notifications', {
        headers: { organisationId: orgId }
      });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Debug: Track selectedProject state changes
  useEffect(() => {
    console.log('🔍 selectedProject state changed to:', selectedProject);
  }, [selectedProject]);

  // Debug: Log projects data and set first project as default
  useEffect(() => {
    console.log('🔍 Projects available:', projects.length, projects);
    if (projects.length > 0 && !selectedProject) {
      const firstProject = (projects as any[])[0];
      setSelectedProject(firstProject._id);
      console.log('🔍 Auto-selected first project:', firstProject.name, firstProject._id);
    }
  }, [projects, selectedProject]);

  // Debug: Log notifications data
  useEffect(() => {
    console.log('🔍 Notifications loaded:', notifications.length, notifications);
    if (notifications.length > 0) {
      console.log('🔍 First notification structure:', notifications[0]);
      console.log('🔍 Notification types:', notifications.map(n => n.type));
      console.log('🔍 Notification statuses:', notifications.map(n => n.status));
      console.log('🔍 Notification itemIds:', notifications.map(n => n.itemId));
    }
  }, [notifications]);




  
  // Debug: Check selected project value
  console.log('🔍 Selected Project Value:', selectedProject, 'Type:', typeof selectedProject);
  console.log('🔍 Is All?', selectedProject === 'all');

  // Filter MRS data by projectId and transform to purchase order format
  const purchaseOrderData: MRSPurchaseOrderData[] = mrsList
    .filter((mrs: any) => {
      if (!selectedProject) return false; // Don't show anything if no project selected
      // Check if MRS projectId matches selected project _id
      const mrsProjectId = typeof mrs.projectId === 'object' ? mrs.projectId?._id : mrs.projectId;
      const matches = mrsProjectId === selectedProject;
      console.log('🔍 MRS:', mrs.item, 'ProjectId:', mrsProjectId, 'Selected:', selectedProject, 'Matches:', matches);
      return matches;
    })
    .map((mrs: any, index: number) => {
      // Find related notification for this MRS item - try multiple matching strategies
      let relatedNotification = notifications.find((notif: any) => 
        notif.itemId === mrs._id && 
        notif.status === 'read' &&
        notif.markAsReadDate // Only consider notifications that have been marked as read with a date
      );

      // If not found, try matching by itemName
      if (!relatedNotification) {
        relatedNotification = notifications.find((notif: any) => 
          notif.itemName === mrs.item && 
          notif.status === 'read' &&
          notif.markAsReadDate
        );
      }

      // Debug: Log matching process
      console.log('🔍 MRS Item:', mrs.item, 'ID:', mrs._id);
      console.log('🔍 Looking for notification with itemId:', mrs._id, 'type: rawMaterialPurchase, status: read');
      console.log('🔍 Found notification:', relatedNotification);
      
      // Also check all notifications for this MRS item (any status)
      const allRelatedNotifications = notifications.filter((notif: any) => 
        notif.itemId === mrs._id
      );
      console.log('🔍 All notifications for this MRS:', allRelatedNotifications);

      return {
        _id: mrs._id,
        materialName: mrs.item || 'Unknown Material',
        deliveredTo: mrs.task || 'Unknown Task',
        deliveredOn: mrs.deliveryDetails?.receivedDate || '',
        markAsReadDate: relatedNotification?.markAsReadDate || '',
        quantity: mrs.quantity || 0,
        unit: 'units',
        status: mrs.status || 'open',
        notificationStatus: relatedNotification ? 'read' : 'unread',
        purchaseOrderId: `MRS-${String(index + 1).padStart(3, '0')}`
      };
    });

  console.log('🔍 Purchase Order Data Length:', purchaseOrderData.length);




  const filteredData = purchaseOrderData.filter(item => {
    const matchesSearch = item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.deliveredTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.purchaseOrderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesNotification = notificationFilter === 'all' || item.notificationStatus === notificationFilter;
    
    return matchesSearch && matchesStatus && matchesNotification;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'ordered':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationColor = (status: string) => {
    switch (status) {
      case 'read':
        return 'bg-green-100 text-green-800';
      case 'unread':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Material Name', 'Delivered To', 'Delivered On', 'Mark As Read Date', 'Quantity', 'Unit', 'Status', 'PO ID'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.materialName,
        item.deliveredTo,
        item.deliveredOn || 'Not Delivered',
        item.markAsReadDate ? new Date(item.markAsReadDate).toLocaleString('en-IN') : 'Not Read',
        item.quantity,
        item.unit,
        item.status,
        item.purchaseOrderId
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mrs-purchase-order-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading MRS Purchase Order Report...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            MRS Purchase Order Report
          </h1>
          <p className="text-gray-600 mt-1">
            Track material deliveries and notification read status for MRS purchase orders
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Filtered by: {(projects as any[]).find((p: any) => p._id === selectedProject)?.name || 'No Project Selected'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Current selection: {selectedProject} | Projects loaded: {projects.length}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials, tasks, or PO ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between"
              style={{ minWidth: '200px' }}
            >
              <span>
                {(projects as any[]).find((p: any) => p._id === selectedProject)?.name || 'Select Project'}
              </span>
              <span className="ml-2">▼</span>
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                {(projects as any[]).map((project: any) => (
                  <div
                    key={project._id}
                    onClick={() => {
                      console.log('🔍 Custom dropdown: Project selected:', project.name, project._id);
                      setSelectedProject(project._id);
                      setDropdownOpen(false);
                    }}
                    className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${selectedProject === project._id ? 'bg-blue-50 text-blue-600' : ''}`}
                  >
                    {project.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="sent">Sent</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={notificationFilter}
            onChange={(e) => setNotificationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Notifications</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{purchaseOrderData.length}</p>
              <p className="text-xs text-gray-400">
                {selectedProject === 'all' ? 'All Projects' : `Filtered by Project`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Received</p>
              <p className="text-2xl font-semibold text-gray-900">
                {purchaseOrderData.filter(item => item.status === 'received').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Open</p>
              <p className="text-2xl font-semibold text-gray-900">
                {purchaseOrderData.filter(item => item.status === 'open').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Unread</p>
              <p className="text-2xl font-semibold text-gray-900">
                {purchaseOrderData.filter(item => item.notificationStatus === 'unread').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivered To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivered On
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mark As Read
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.materialName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.deliveredTo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.deliveredOn ? 
                        new Date(item.deliveredOn).toLocaleDateString('en-IN') : 
                        'Not Delivered'
                      }
                    </div>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mb-1 w-fit ${getNotificationColor(item.notificationStatus)}`}>
                        {item.notificationStatus === 'read' ? 'Read' : 'Unread'}
                      </span>
                      {item.markAsReadDate ? (
                        <div className="text-xs text-gray-600">
                          <div>{new Date(item.markAsReadDate).toLocaleDateString('en-IN')}</div>
                          <div>{new Date(item.markAsReadDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">Not marked as read</div>
                      )}
                    </div>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity} {item.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">{item.purchaseOrderId}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No MRS data for selected project
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No MRS records found for the selected project. Check if MRS records have been created for this project or try selecting a different project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MRSPurchaseOrderReport;