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
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchWarehouses } from "@/redux/slices/warehouseSlice";
import NotificationCenter from "@/components/NotificationCenter";

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
} from "lucide-react";

interface DeliveryItem {
  _id: string;
  deliverTo: string;
  operationType: string;
  productId: string;
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

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryItem | null>(
    null
  );
  const [viewingDelivery, setViewingDelivery] = useState<DeliveryItem | null>(
    null
  );
  const orgId = localStorage.getItem('organisationId');
  useEffect(() => {
    dispatch(getAllDeliveries());
    dispatch(fetchProducts(orgId));
    dispatch(fetchWarehouses({ page: 1, limit: 200 }));
  }, [dispatch]);

  const filteredDeliveries = deliveries.filter((d: DeliveryItem) => {
    const matchesSearch =
      d._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.deliverTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || d.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
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
    ${
      initialData
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

  return (
    <div className="space-y-6">
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

          <button
            disabled={!canCreate}
            onClick={() => canCreate && setShowCreateForm(true)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg
    ${
      canCreate
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-gray-400 text-white cursor-not-allowed"
    }`}
          >
            <Plus className="h-5 w-5" /> New Delivery
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <Truck className="h-10 w-10 text-gray-600" />
          <div>
            <p className="text-sm text-gray-500">Total Deliveries</p>
            <p className="text-2xl font-bold">{deliveries.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <Truck className="h-10 w-10 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">In Transit</p>
            <p className="text-2xl font-bold">
              {deliveries.filter((d: any) => d.status === "in-transit").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-2xl font-bold">
              {deliveries.filter((d: any) => d.status === "delivered").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">High Priority</p>
            <p className="text-2xl font-bold">
              {deliveries.filter((d: any) => d.priority === "high").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search deliveries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
            />
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-3 border rounded-lg"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                          dispatch(
                            updateDelivery({
                              id: d._id,
                              data: {
                                status: value,
                                warehouseId: d.warehouseId,
                              },
                            })
                          )
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
                          className={`${
                            canEdit
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
                          className={`${
                            canDelete
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
      </div>

      {/* Modals */}
      {showCreateForm && <DeliveryForm />}
      {showUpdateForm && editingDelivery && (
        <DeliveryForm initialData={editingDelivery} />
      )}
      {showViewForm && viewingDelivery && (
        <ViewDeliveryForm item={viewingDelivery} />
      )}
    </div>
  );
};

export default Deliveries;
