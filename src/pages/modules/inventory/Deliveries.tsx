import { RootState } from "@/redux/store";
import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllDeliveries,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} from "@/redux/slices/deliverySlice";
import {
  fetchMaterialRequests,
  createMaterialRequest,
  updateMaterialRequestStatus,
  deleteMaterialRequest,
  migrateMaterialRequestsFromLocalStorage,
  fetchMaterialRequestStatistics,
} from "@/redux/slices/materialRequestSlice";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchWarehouses } from "@/redux/slices/warehouseSlice";
import NotificationCenter from "@/components/NotificationCenter";
import { toast } from "sonner";

import {
  Truck,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Edit,
  Eye,
  Trash2,
  X,
  ShieldAlert,
  FolderKanban,
  Badge,
} from "lucide-react";
import { BASE_URL } from "@/utils/constants";
import MaterialRequestMigration from "@/components/MaterialRequestMigration";
import { Input } from "@/components/ui/input";
import { Separator } from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";


interface DeliveryItem {
  _id: string;
  deliverTo: string;
  operationType: string;
  productId: string;
  projectId: string;
  quantity: number;
  shippingMethod: string;
  priority: "low" | "medium" | "high";
  status: "draft" | "ready" | "in-transit" | "delivered" | "cancelled";
  scheduledDate: string;
  warehouseId: string;
}

const Deliveries: React.FC = () => {

  const canView = usePermission("deliveries", "view");
  const canCreate = usePermission("deliveries", "create");
  const canEdit = usePermission("deliveries", "edit");
  const canDelete = usePermission("deliveries", "delete");
  const dispatch = useDispatch();

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Material Requests state
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [showEditStatusDialog, setShowEditStatusDialog] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  // Stock Transfers state (lifted from child component for stats)
  const [stockTransfers, setStockTransfers] = useState<any[]>([]);
  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
    );
  }
  const { deliveries, loading: deliveryLoading } = useSelector(
    (state: any) => state.delivery
  );
  const { products, loading: productLoading } = useSelector(
    (state: any) => state.products
  );
  const { warehouses, loading: warehouseLoading } = useSelector(
    (state: any) => state.warehouse
  );
  const { requests: materialRequestsFromDB, loading: materialRequestsLoading, statistics } = useSelector(
    (state: any) => state.materialRequests
  );
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("all");;
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [requestsPage, setRequestsPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [editingDelivery, setEditingDelivery] = useState<DeliveryItem | null>(
    null
  );
  const [viewingDelivery, setViewingDelivery] = useState<DeliveryItem | null>(
    null
  );
  const orgId = localStorage.getItem('organisationId');

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const apiUrl = BASE_URL || 'http://localhost:4000';
      const url = `${apiUrl}/notifications/list?destination=delivery.inventory&status=unread`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        setNotifications([]);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setNotifications([]);
        return;
      }

      const data = await response.json();
      console.log('Fetched notifications:', data); // Debug log

      if (Array.isArray(data)) {
        const filtered = data.filter((n: any) => n.inviteResponse === 'pending');
        console.log('Filtered notifications:', filtered); // Debug log
        setNotifications(filtered);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching delivery notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handle accept/reject
  const handleDeliveryResponse = async (notificationId: string, response: 'accepted' | 'rejected', notification?: any) => {
    try {
      const apiUrl = BASE_URL || 'http://localhost:4000';

      // If accepted, add to material requests database
      if (response === 'accepted' && notification?.materialData) {
        const newRequest = {
          itemId: notification.itemId || Date.now().toString(), // Use original MRS item ID
          item: notification.materialData.item || 'Unknown Item',
          sourceTask: notification.materialData.sourceTask || 'N/A',
          quantity: notification.materialData.quantity || 0,
          unit: notification.materialData.unit || 'units',
          requiredDate: notification.materialData.requiredDate,
          sentDate: notification.materialData.sentDate,
          projectId: notification.materialData.projectId,
          projectName: notification.materialData.projectName || 'N/A',
          remark: notification.remark || '',
          status: 'ready' as const,
          acceptedAt: new Date().toISOString()
        };

        console.log('🚀 Creating material request with status:', newRequest.status);
        console.log('📦 Full request data:', newRequest);

        await dispatch(createMaterialRequest(newRequest) as any);
        console.log('✅ Material request created successfully');
      }

      const res = await fetch(`${apiUrl}/notifications/${notificationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ response })
      });

      if (res.ok) {
        fetchNotifications();
        toast.success(`Material request ${response === 'accepted' ? 'accepted and added to table' : 'rejected'}`);
      }
    } catch (error) {
      console.error('Error responding to delivery request:', error);
      toast.error('Failed to process response');
    }
  };

  // Handle status update
  const handleUpdateStatus = async (newStatus: string) => {
    if (!editingRequest) return;

    try {
      await dispatch(updateMaterialRequestStatus({
        id: editingRequest._id,
        status: newStatus
      }));

      // Update MRS status sync using unique ID instead of item name
      if (newStatus === 'in-transit') {
        const mrsStatusSync = JSON.parse(localStorage.getItem('MRS_STATUS_SYNC') || '{}');
        mrsStatusSync[editingRequest.itemId] = 'in-transit'; // Use itemId (original MRS ID)
        localStorage.setItem('MRS_STATUS_SYNC', JSON.stringify(mrsStatusSync));
      }

      setShowEditStatusDialog(false);
      setEditingRequest(null);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Handle delete request
  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Delete this material request?')) return;

    try {
      await dispatch(deleteMaterialRequest(id));
      toast.success('Material request deleted');
    } catch (error) {
      toast.error('Failed to delete material request');
    }
  };

  // Migration function to move localStorage data to database
  const performMigration = async () => {
    try {
      const localStorageData = localStorage.getItem('MATERIAL_REQUESTS');
      if (localStorageData && !migrationCompleted) {
        console.log('🔄 Migrating material requests from localStorage to database...');
        await dispatch(migrateMaterialRequestsFromLocalStorage());
        setMigrationCompleted(true);
        toast.success('Material requests migrated to database successfully');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Failed to migrate material requests');
    }
  };
  const { projects = [], page, limit } = useSelector(
    (state: RootState) => state.projects
  );

  useEffect(() => {
    if (orgId) {
      dispatch(fetchProjects({ orgId, page: 1, limit: 200 }));
    }
  }, [dispatch, orgId]);

  useEffect(() => {
    dispatch(getAllDeliveries());
    dispatch(fetchProducts(orgId));
    dispatch(fetchWarehouses({ page: 1, limit: 200 }));
    fetchNotifications();

    // Fetch material requests from database
    dispatch(fetchMaterialRequests({}));
    dispatch(fetchMaterialRequestStatistics());

    // Perform migration if needed
    performMigration();
  }, [dispatch]);

  // Auto-refresh material requests to sync with MRS updates
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchMaterialRequests({}));
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  const filteredDeliveries = deliveries.filter((d: DeliveryItem) => {
    const matchesSearch =
      d.deliverTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d._id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || d.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" || d.priority === priorityFilter;

    const matchesProject =
      projectFilter === "all" || d.projectId === projectFilter;

    const deliveryDate = d.scheduledDate
      ? new Date(d.scheduledDate)
      : null;

    const matchesFromDate =
      !fromDate || (deliveryDate && deliveryDate >= new Date(fromDate));

    const matchesToDate =
      !toDate || (deliveryDate && deliveryDate <= new Date(toDate));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesProject &&
      matchesFromDate &&
      matchesToDate
    );
  });


  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "ready":
        return "bg-yellow-100 text-yellow-800";
      case "in-transit":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-5 w-5 text-gray-500" />;
      case "ready":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "in-transit":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find((p: any) => p._id === productId);
    return product ? `${product.name} (${product.sku})` : "Unknown Product";
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setShowUpdateForm(false);
    setShowViewForm(false);
    setEditingDelivery(null);
    setViewingDelivery(null);
  };

  const handleSubmit = (formData: any) => {
    const payload = {
      deliverTo: formData.deliverTo,
      operationType: formData.operationType,
      productId: formData.productId,
      quantity: Number(formData.quantity),
      shippingMethod: formData.shippingMethod,
      priority: formData.priority,
      status: formData.status || editingDelivery?.status || "draft",
      warehouseId: formData.warehouseId,
      scheduledDate:
        formData.scheduledDate || new Date().toISOString().split("T")[0],
    };

    if (editingDelivery) {
      dispatch(updateDelivery({ id: editingDelivery._id, data: payload }));
    } else {
      dispatch(createDelivery(payload));
    }
    handleClose();
  };

  const DeliveryForm = ({
    initialData,
  }: {
    initialData?: Partial<DeliveryItem>;
  }) => {
    const [formData, setFormData] = useState({
      deliverTo: initialData?.deliverTo || "",
      operationType: initialData?.operationType || "Sale",
      productId: initialData?.productId || "",
      quantity: (initialData?.quantity || 1).toString(),
      shippingMethod: initialData?.shippingMethod || "Standard",
      priority: initialData?.priority || "medium",
      scheduledDate: initialData?.scheduledDate || "",
      warehouseId: initialData?.warehouseId || "",
      status: initialData?.status || "draft",
    });

    const handleChange =
      (field: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
          setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        };

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.productId) return alert("Please select a product");
      handleSubmit(formData);
    };


    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 my-8">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-2xl font-bold">
              {initialData ? "Update Delivery" : "Create New Delivery"}
            </h3>
            <button onClick={handleClose}>
              <X className="h-8 w-8 text-gray-500" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Deliver To *
                </label>
                <input
                  required
                  value={formData.deliverTo}
                  onChange={handleChange("deliverTo")}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer name or company"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Operation Type
                </label>
                <select
                  value={formData.operationType}
                  onChange={handleChange("operationType")}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option>Sale</option>
                  <option>Transfer</option>
                  <option>Return</option>
                  <option>Sample</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Product *
                </label>
                <select
                  required
                  value={formData.productId}
                  onChange={handleChange("productId")}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Select Product</option>
                  {products.map((p: any) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Quantity *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange("quantity")}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Status</label>
              <select
                value={formData.status}
                onChange={handleChange("status")}
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="in-transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Warehouse *
              </label>
              <select
                required
                value={formData.warehouseId}
                onChange={handleChange("warehouseId")}
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="">Select Warehouse</option>
                {warehouses?.map((w: any) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Shipping Method
                </label>
                <select
                  value={formData.shippingMethod}
                  onChange={handleChange("shippingMethod")}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option>Standard</option>
                  <option>Express</option>
                  <option>Overnight</option>
                  <option>Pickup</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={handleChange("priority")}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Scheduled Date
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={handleChange("scheduledDate")}
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={initialData ? !canEdit : !canCreate}
                className={`px-6 py-3 rounded-lg text-white
    ${initialData
                    ? canEdit
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                    : canCreate
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
              >
                {initialData ? "Update Delivery" : "Create Delivery"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ViewDeliveryForm = ({ item }: { item?: DeliveryItem }) => {
    if (!item) return null;

    const productName = getProductName(item.productId);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-2xl font-bold">Delivery: {item._id}</h3>
            <button onClick={handleClose}>
              <X className="h-8 w-8 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <strong>Deliver To:</strong> {item.deliverTo}
              </div>
              <div>
                <strong>Operation:</strong> {item.operationType}
              </div>
              <div>
                <strong>Product:</strong> {productName}
              </div>
              <div>
                <strong>Quantity:</strong> {item.quantity} units
              </div>
              <div>
                <strong>Shipping:</strong> {item.shippingMethod}
              </div>
              <div>
                <strong>Priority:</strong>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-xs ${getPriorityColor(
                    item.priority
                  )}`}
                >
                  {item.priority}
                </span>
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
              </div>
              <div>
                <strong>Date:</strong> {item.scheduledDate}
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter material requests and stock transfers
  const filteredMaterialRequests = (materialRequestsFromDB || []).filter(
    (request: any) => {
      const matchesSearch =
        request.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.sourceTask?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.projectName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      const matchesProject =
        projectFilter === "all" || request.projectId === projectFilter;

      const requestDate = request.requiredDate
        ? new Date(request.requiredDate)
        : null;

      const matchesFromDate =
        !fromDate || (requestDate && requestDate >= new Date(fromDate));

      const matchesToDate =
        !toDate || (requestDate && requestDate <= new Date(toDate));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProject &&
        matchesFromDate &&
        matchesToDate
      );
    }
  );


  const filteredStockTransfers = stockTransfers.filter((transfer: any) => {
    const matchesSearch = transfer.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromWarehouse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toWarehouse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromWarehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toWarehouseName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginate filtered data
  const paginatedRequests = filteredMaterialRequests.slice(
    (requestsPage - 1) * itemsPerPage,
    requestsPage * itemsPerPage
  );

  const paginatedTransfers = filteredStockTransfers.slice(
    (transfersPage - 1) * itemsPerPage,
    transfersPage * itemsPerPage
  );

  const requestsTotalPages = Math.ceil(filteredMaterialRequests.length / itemsPerPage);
  const transfersTotalPages = Math.ceil(filteredStockTransfers.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Migration Component */}
      <MaterialRequestMigration />

      {/* Material Request Notifications */}
      {notifications.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            New Material Requests from MRS ({notifications.length})
          </h3>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification._id} className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{notification.materialData?.item || 'Unknown Item'}</p>
                    <div className="text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <span className="font-medium">Source Task:</span>
                        <p className="text-gray-800">{notification.materialData?.sourceTask || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span>
                        <p className="text-gray-800">{notification.materialData?.quantity} {notification.materialData?.unit || 'units'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Required Date:</span>
                        <p className="text-gray-800">{notification.materialData?.requiredDate ? new Date(notification.materialData.requiredDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Sent Date:</span>
                        <p className="text-gray-800">{notification.materialData?.sentDate ? new Date(notification.materialData.sentDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    {notification.materialData?.projectName && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-600">Project:</span>
                        <span className="ml-2 text-gray-800">{notification.materialData.projectName}</span>
                      </div>
                    )}
                    {notification.remark && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-600">Remark:</span>
                        <span className="ml-2 text-gray-800">{notification.remark}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDeliveryResponse(notification._id, 'accepted', notification)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeliveryResponse(notification._id, 'rejected', notification)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Delivery Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage all outgoing deliveries
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Added Notification Center */}
          {/* <NotificationCenter
            destination="delivery.inventory"
            title="Inventory Notifications"
          /> */}

          {false && <button
            disabled={!canCreate}
            onClick={() => canCreate && setShowCreateForm(true)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg
    ${canCreate
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-400 text-white cursor-not-allowed"
              }`}
          >
            <Plus className="h-5 w-5" /> New Delivery
          </button>}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <Truck className="h-10 w-10 text-gray-600" />
          <div>
            <p className="text-sm text-gray-500">Total Deliveries</p>
            <p className="text-2xl font-bold">
              {filteredMaterialRequests.length + filteredStockTransfers.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <Truck className="h-10 w-10 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">In Transit</p>
            <p className="text-2xl font-bold">
              {filteredMaterialRequests.filter((r: any) => r.status === "in-transit").length +
                filteredStockTransfers.filter((t: any) => t.status === "in-transit").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-2xl font-bold">
              {filteredMaterialRequests.filter((r: any) => r.status === "delivered").length +
                filteredStockTransfers.filter((t: any) => t.status === "delivered").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">High Priority</p>
            <p className="text-2xl font-bold">
              {(materialRequestsFromDB || []).filter((r: any) => r.priority === "high").length +
                stockTransfers.filter((t: any) => t.priority === "high").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
  <div className="flex items-center gap-3">

    {/* Search */}
    <div className="relative flex-1 min-w-[220px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search deliveries, project, task…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9"
      />
    </div>

    {/* Filters Button */}
    <Popover open={filterOpen} onOpenChange={setFilterOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[360px] bg-white border p-4 space-y-4 z-50"
      >
        {/* Date Range */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Date Range</p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        {/* Project */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Project</p>
          <Select
            value={projectFilter}
            onValueChange={(val) => {
              setProjectFilter(val);
              setFilterOpen(false);
            }}
          >
            <SelectTrigger>
              <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p: any) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Status</p>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setFilterOpen(false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="in-transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear */}
        <Button
          variant="ghost"
          className="w-full text-red-600"
          onClick={() => {
            setFromDate("");
            setToDate("");
            setProjectFilter("all");
            setStatusFilter("all");
            setSearchTerm("");
            setFilterOpen(false);
          }}
        >
          Clear Filters
        </Button>
      </PopoverContent>
    </Popover>
  </div>
</div>






      {false && <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="max-h-[450px] overflow-y-auto overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Deliver To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Shipping
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {deliveryLoading || productLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    Loading deliveries...
                  </td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No deliveries found
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((d: DeliveryItem) => (
                  <tr key={d._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {d._id.slice(0, 15)}
                    </td>
                    <td className="px-6 py-4 flex items-center">
                      {/* <User className="inline h-4 w-4 mr-2 text-gray-400" /> */}
                      {d.deliverTo}
                    </td>
                    <td className="px-6 py-4 text-sm ">
                      <Package className="inline h-4 w-4 mr-2 text-gray-400" />
                      <div className="flex justify-center items-center">
                        <div className="font-medium">
                          {getProductName(d.productId).slice(1, 20)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {d.quantity} units
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{d.shippingMethod}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          d.priority
                        )}`}
                      >
                        {d.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        defaultValue={d.status}
                        onValueChange={(value) =>
                          dispatch(updateDelivery({
                            id: d._id,
                            data: {
                              status: value,
                              warehouseId: d.warehouseId,
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="w-[150px] text-xs">
                          <div
                            className={`px-2 py-1 rounded-md ${getStatusColor(
                              d.status
                            )}`}
                          >
                            {d.status.replace("-", " ")}
                          </div>
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="draft">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                                Draft
                              </span>
                            </div>
                          </SelectItem>

                          <SelectItem value="ready">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs">
                                Ready
                              </span>
                            </div>
                          </SelectItem>

                          <SelectItem value="in-transit">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">
                                In Transit
                              </span>
                            </div>
                          </SelectItem>

                          <SelectItem value="delivered">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                                Delivered
                              </span>
                            </div>
                          </SelectItem>

                          <SelectItem value="cancelled">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">
                                Cancelled
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />
                      {d.scheduledDate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setViewingDelivery(d);
                            setShowViewForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          disabled={!canEdit}
                          onClick={() =>
                            canEdit &&
                            (setEditingDelivery(d), setShowUpdateForm(true))
                          }
                          className={`${canEdit
                            ? "text-blue-600"
                            : "text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          disabled={!canDelete}
                          onClick={() =>
                            canDelete && dispatch(deleteDelivery(d._id))
                          }
                          className={`${canDelete
                            ? "text-red-600"
                            : "text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>}

      {/* Modals */}
      {showCreateForm && <DeliveryForm />}
      {showUpdateForm && editingDelivery && (
        <DeliveryForm initialData={editingDelivery} />
      )}
      {showViewForm && viewingDelivery && (
        <ViewDeliveryForm item={viewingDelivery} />
      )}

      {/* Material Requests Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Accepted Material Requests</h2>
          <p className="text-sm text-gray-600 mt-1">Material requests accepted from MRS</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No material requests found. Accepted requests from MRS will appear here.
                  </td>
                </tr>
              ) : paginatedRequests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{request.item}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{request.sourceTask}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{request.quantity} {request.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{request.projectName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {request.requiredDate ? new Date(request.requiredDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {request.sentDate ? new Date(request.sentDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${request.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'in-transit' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {request.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingRequest(request);
                          setShowEditStatusDialog(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Edit Status"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(request._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Request"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination for Material Requests */}
        {requestsTotalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((requestsPage - 1) * itemsPerPage) + 1} to {Math.min(requestsPage * itemsPerPage, filteredMaterialRequests.length)} of {filteredMaterialRequests.length} requests
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                disabled={requestsPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {requestsPage} of {requestsTotalPages}
              </span>
              <button
                onClick={() => setRequestsPage(p => Math.min(requestsTotalPages, p + 1))}
                disabled={requestsPage === requestsTotalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Status Dialog */}
      {showEditStatusDialog && editingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Update Status</h3>
              <button onClick={() => setShowEditStatusDialog(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">Select new status for: <strong>{editingRequest.item}</strong></p>

              <button
                onClick={() => handleUpdateStatus('ready')}
                className="w-full px-4 py-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-500"
              >
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Ready
                </span>
              </button>

              <button
                onClick={() => handleUpdateStatus('in-transit')}
                className="w-full px-4 py-3 text-left border rounded-lg hover:bg-yellow-50 hover:border-yellow-500"
              >
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  In Transit
                </span>
              </button>

              {/* <button
                onClick={() => handleUpdateStatus('delivered')}
                className="w-full px-4 py-3 text-left border rounded-lg hover:bg-green-50 hover:border-green-500"
              >
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Delivered
                </span>
              </button> */}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditStatusDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transfer History */}
      <StockTransferHistory
        onTransfersUpdate={setStockTransfers}
        filteredTransfers={paginatedTransfers}
        currentPage={transfersPage}
        totalPages={transfersTotalPages}
        totalItems={filteredStockTransfers.length}
        onPageChange={setTransfersPage}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default Deliveries;


// Stock Transfer History Section Component
const StockTransferHistory = ({
  onTransfersUpdate,
  filteredTransfers,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemsPerPage
}: {
  onTransfersUpdate: (transfers: any[]) => void;
  filteredTransfers: any[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}) => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<any>(null);

  // Add permission hooks
  const canEdit = usePermission("deliveries", "edit");
  const canDelete = usePermission("deliveries", "delete");

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL || 'http://localhost:4000'}/stock-transfers`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const fetchedTransfers = data.transfers || [];
        setTransfers(fetchedTransfers);
        onTransfersUpdate(fetchedTransfers); // Update parent component
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transfer?')) return;
    try {
      const response = await fetch(`${BASE_URL || 'http://localhost:4000'}/stock-transfers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchTransfers();
      }
    } catch (error) {
      console.error('Error deleting transfer:', error);
    }
  };

  const handleEdit = (transfer: any) => {
    setEditingTransfer(transfer);
    setShowEditForm(true);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ready: 'bg-blue-100 text-blue-800',
      'in-transit': 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Edit Transfer Form Component
  const EditTransferForm = ({ transfer, onClose, onSuccess }: { transfer: any; onClose: () => void; onSuccess: () => void }) => {
    const [formData, setFormData] = useState({
      productName: transfer.productName || '',
      fromWarehouseName: transfer.fromWarehouseName || transfer.fromWarehouse || '',
      toWarehouseName: transfer.toWarehouseName || transfer.toWarehouse || '',
      quantity: transfer.quantity || 0,
      transportType: transfer.transportType || 'Truck',
      vehicleNo: transfer.vehicleNo || '',
      driverName: transfer.driverName || '',
      transportCost: transfer.transportCost || 0,
      notes: transfer.notes || '',
      status: transfer.status || 'ready'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const response = await fetch(`${BASE_URL || 'http://localhost:4000'}/stock-transfers/${transfer._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          onSuccess();
          onClose();
        }
      } catch (error) {
        console.error('Error updating transfer:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Edit Transfer</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse *</label>
                <input
                  type="text"
                  value={formData.fromWarehouseName}
                  onChange={(e) => setFormData({ ...formData, fromWarehouseName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse *</label>
                <input
                  type="text"
                  value={formData.toWarehouseName}
                  onChange={(e) => setFormData({ ...formData, toWarehouseName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Type</label>
                <select
                  value={formData.transportType}
                  onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Truck">Truck</option>
                  <option value="Tempo">Tempo</option>
                  <option value="Courier">Courier</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={formData.vehicleNo}
                  onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.transportCost}
                  onChange={(e) => setFormData({ ...formData, transportCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="ready">Ready</option>
                <option value="in-transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Stock Transfer History</h2>
      <p className="text-sm text-gray-600 mb-4">Recent stock movements between warehouses</p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={11} className="text-center py-4">Loading...</td></tr>
            ) : filteredTransfers.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-4 text-gray-500">No transfers found</td></tr>
            ) : (
              filteredTransfers.map((transfer) => (
                <tr key={transfer._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(transfer.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{transfer.productName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transfer.fromWarehouseName || transfer.fromWarehouse || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transfer.toWarehouseName || transfer.toWarehouse || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{transfer.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">₹{transfer.transportCost || 0}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">
                    ₹{(transfer.transportCost || 0) * (transfer.quantity || 1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transfer.transportType || 'Truck'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transfer.vehicleNo || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(transfer.status || 'ready')}`}>
                      {(transfer.status || 'ready').replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(transfer)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Edit Transfer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transfer._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Transfer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination for Stock Transfer History */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} transfers
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Transfer Form Modal */}
      {showEditForm && editingTransfer && (
        <EditTransferForm
          transfer={editingTransfer}
          onClose={() => {
            setShowEditForm(false);
            setEditingTransfer(null);
          }}
          onSuccess={fetchTransfers}
        />
      )}
    </div>
  );
};
