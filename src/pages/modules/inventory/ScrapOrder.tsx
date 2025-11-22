// ScrapOrder.tsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getScrapOrders,
  createScrapOrder,
  updateScrapOrder,
  deleteScrapOrder,
  approveScrapOrder,
} from "@/redux/slices/scrapOrderSlice";
import { fetchProducts } from "@/redux/slices/productSlice";

import {
  Trash2,
  Plus,
  Search,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Eye,
  X,
} from "lucide-react";

interface ScrapOrderItem {
  _id: string;
  productId: string;
  quantity: number;
  reason: "damaged" | "expired" | "lost" | "obsolete";
  scrapLocation: string;
  status: "pending" | "approved" | "completed";
  date: string;
  remark?: string;
}

const ScrapOrder: React.FC = () => {
  const dispatch = useDispatch();

  const { scrapOrders, loading: scrapLoading } = useSelector(
    (state: any) => state.scrap
  );
  const { products, loading: productLoading } = useSelector(
    (state: any) => state.products
  );

  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [editingScrap, setEditingScrap] = useState<ScrapOrderItem | null>(null);
  const [viewingScrap, setViewingScrap] = useState<ScrapOrderItem | null>(null);

  useEffect(() => {
    dispatch(getScrapOrders());
    dispatch(fetchProducts());
  }, [dispatch]);

  const filteredScrapOrders = scrapOrders.filter((s: ScrapOrderItem) => {
    const product = products.find((p: any) => p._id === s.productId);
    const matchesSearch =
      s._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesReason = reasonFilter === "all" || s.reason === reasonFilter;
    return matchesSearch && matchesStatus && matchesReason;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "damaged":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-orange-100 text-orange-800";
      case "lost":
        return "bg-purple-100 text-purple-800";
      case "obsolete":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "approved":
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getProductName = (productId: string) => {
    const p = products.find((p: any) => p._id === productId);
    return p ? p.name : "Unknown Product";
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setShowUpdateForm(false);
    setShowViewForm(false);
    setEditingScrap(null);
    setViewingScrap(null);
  };

  const handleSubmit = (formData: any) => {
    const payload = {
      productId: formData.productId,
      quantity: Number(formData.quantity),
      reason: formData.reason,
      scrapLocation: formData.scrapLocation,
      remark: formData.remark || undefined,
      date: formData.date || new Date().toISOString().split("T")[0],
    };

    if (editingScrap) {
      dispatch(updateScrapOrder({ id: editingScrap._id, data: payload }));
    } else {
      dispatch(createScrapOrder(payload));
    }
    handleClose();
  };

  const handleApprove = (id: string) => {
    if (confirm("Approve this scrap order?")) {
      dispatch(approveScrapOrder(id));
    }
  };

  const ScrapOrderForm = ({
    initialData,
  }: {
    initialData?: Partial<ScrapOrderItem>;
  }) => {
    const [formData, setFormData] = useState({
      productId: initialData?.productId || "",
      quantity: (initialData?.quantity || 1).toString(),
      reason: initialData?.reason || "damaged",
      scrapLocation: initialData?.scrapLocation || "",
      remark: initialData?.remark || "",
      date: initialData?.date || new Date().toISOString().split("T")[0],
    });

    const handleChange =
      (field: string) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      };

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.productId) return alert("Please select a product");
      if (!formData.scrapLocation.trim())
        return alert("Please enter scrap location");
      handleSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {initialData ? "Update Scrap Order" : "Create New Scrap Order"}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <select
                    required
                    value={formData.productId}
                    onChange={handleChange("productId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange("quantity")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <select
                    value={formData.reason}
                    onChange={handleChange("reason")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="damaged">Damaged</option>
                    <option value="expired">Expired</option>
                    <option value="lost">Lost</option>
                    <option value="obsolete">Obsolete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scrap Location *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.scrapLocation}
                    onChange={handleChange("scrapLocation")}
                    placeholder="e.g. Scrap Yard B, Bin #12, Disposal Area"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remark (Optional)
                </label>
                <textarea
                  value={formData.remark}
                  onChange={handleChange("remark")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={handleChange("date")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {initialData ? "Update" : "Create"} Scrap Order
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const ViewScrapOrderForm = ({ item }: { item?: ScrapOrderItem }) => {
    if (!item) return null;
    const productName = getProductName(item.productId);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Scrap Order: {item._id}</h3>
              <button onClick={handleClose}>
                <X className="h-8 w-8 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Product:</strong> {productName}
              </div>
              <div>
                <strong>Quantity:</strong> {item.quantity} units
              </div>
              <div>
                <strong>Reason:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getReasonColor(
                    item.reason
                  )}`}
                >
                  {item.reason}
                </span>
              </div>
              <div>
                <strong>Location:</strong> {item.scrapLocation}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
              </div>
              <div>
                <strong>Date:</strong> {item.date}
              </div>
              {item.remark && (
                <div className="col-span-2">
                  <strong>Remark:</strong> {item.remark}
                </div>
              )}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg"
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
          <h1 className="text-3xl font-bold text-gray-900">Scrap Orders</h1>
          <p className="text-gray-600 mt-1">
            Manage damaged, expired, or obsolete inventory
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> New Scrap Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <Trash2 className="h-10 w-10 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">Total Scraps</p>
            <p className="text-2xl font-bold">{scrapOrders.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <Clock className="h-10 w-10 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-2xl font-bold">
              {scrapOrders.filter((s: any) => s.status === "pending").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold">
              {scrapOrders.filter((s: any) => s.status === "completed").length}
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
              placeholder="Search by product or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-4 py-3 border rounded-lg"
            >
              <option value="all">All Reasons</option>
              <option value="damaged">Damaged</option>
              <option value="expired">Expired</option>
              <option value="lost">Lost</option>
              <option value="obsolete">Obsolete</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
        {/* Scrollable container */}
        <div className="overflow-x-auto max-h-[480px]">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
              <tr>
                {[
                  "Scrap ID",
                  "Product",
                  "Quantity",
                  "Reason",
                  "Remark",
                  "Location",
                  "Status",
                  "Date",
                  "Actions",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {scrapLoading || productLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-gray-500 text-sm"
                  >
                    Loading scrap orders...
                  </td>
                </tr>
              ) : filteredScrapOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-gray-500 text-sm"
                  >
                    No scrap orders found
                  </td>
                </tr>
              ) : (
                filteredScrapOrders.map(
                  (scrap: ScrapOrderItem, index: number) => (
                    <tr
                      key={scrap._id}
                      className={`transition-all duration-150 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100`}
                    >
                      {/* Scrap ID */}
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 truncate">
                        {scrap._id}
                      </td>

                      {/* Product */}
                      <td className="px-6 py-4 text-sm flex items-center whitespace-nowrap">
                        <Package className="h-4 w-4 mr-2 text-gray-400" />
                        {getProductName(scrap.productId)}
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {scrap.quantity} units
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${getReasonColor(
                            scrap.reason
                          )}`}
                        >
                          {scrap.reason}
                        </span>
                      </td>

                      {/* Remark */}
                      <td
                        className="px-6 py-4 text-sm text-gray-700 max-w-[150px] truncate"
                        title={scrap.remark}
                      >
                        {scrap.remark || "—"}
                      </td>

                      {/* Scrap Location */}
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {scrap.scrapLocation}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(scrap.status)}
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm ${getStatusColor(
                              scrap.status
                            )}`}
                          >
                            {scrap.status}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />
                        {scrap.date}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              setViewingScrap(scrap);
                              setShowViewForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingScrap(scrap);
                              setShowUpdateForm(true);
                            }}
                            className="text-green-600 hover:text-green-800 transition"
                          >
                            <Edit className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() =>
                              confirm("Delete this scrap order?") &&
                              dispatch(deleteScrapOrder(scrap._id))
                            }
                            className="text-red-600 hover:text-red-800 transition"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>

                          {scrap.status === "pending" && (
                            <button
                              onClick={() =>
                                dispatch(approveScrapOrder(scrap._id))
                              }
                              className="text-purple-600 hover:text-purple-800 text-xs font-semibold"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateForm && <ScrapOrderForm />}
      {showUpdateForm && editingScrap && (
        <ScrapOrderForm initialData={editingScrap} />
      )}
      {showViewForm && viewingScrap && (
        <ViewScrapOrderForm item={viewingScrap} />
      )}
    </div>
  );
};

export default ScrapOrder;
