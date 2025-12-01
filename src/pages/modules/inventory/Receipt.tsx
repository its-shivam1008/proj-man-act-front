import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchReceipts,
  createReceipt,
  updateReceipt,
  deleteReceipt,
  approveReceipt,
} from "@/redux/slices/receiptSlice";
import { usePermission } from "@/hooks/userPermission";
import { fetchProducts } from "@/redux/slices/productSlice";
import { fetchWarehouses } from "@/redux/slices/warehouseSlice";
import { fetchVendors } from "@/redux/slices/purchase/vendorSlice";
import {
  Package,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Eye,
  Trash2,
  Warehouse as WarehouseIcon,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

interface ReceiptItem {
  _id: string;
  receiveFrom: string;
  operationType: string;
  products: { productId: string; quantity: number }[];
  status: "draft" | "in-progress" | "done" | "cancelled";
  scheduledDate: string;
  warehouse?: string;
  barcode?: string;
}

const Receipt: React.FC = () => {
  const canView = usePermission("receipt", "view");
  const canCreate = usePermission("receipt", "create");
  const canEdit = usePermission("receipt", "edit");
  const canDelete = usePermission("receipt", "delete");
  const dispatch = useDispatch();

  const { vendors, loading: vendorLoading } = useSelector(
    (state: any) => state.vendors
  );

  const { receipts, loading: receiptLoading } = useSelector(
    (state: any) => state.receipts
  );
  const { products, loading: productLoading } = useSelector(
    (state: any) => state.products
  );
  const { warehouses, loading: warehouseLoading } = useSelector(
    (state: any) => state.warehouse
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<ReceiptItem | null>(
    null
  );
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptItem | null>(
    null
  );
  const orgId = localStorage.getItem('organisationId');
  useEffect(() => {
    dispatch(fetchProducts(orgId));
    dispatch(fetchReceipts());
    dispatch(fetchWarehouses({ page: 1, limit: 200 }));
    dispatch(fetchVendors());
  }, [dispatch]);

  const filteredReceipts = receipts.filter((r: ReceiptItem) => {
    const matchesSearch =
      r._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.receiveFrom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-5 w-5 text-gray-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "done":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getWarehouseName = (warehouseId?: string) => {
    if (!warehouseId) return "—";
    const wh = warehouses.find((w: any) => w._id === warehouseId);
    return wh ? `${wh.name} (${wh.location})` : "—";
  };
  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this receipt?")) return;

    dispatch(deleteReceipt(id)).then(() => {
      dispatch(fetchReceipts());
    });

    toast.success("Receipt deleted");
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setShowUpdateForm(false);
    setShowViewForm(false);
    setEditingReceipt(null);
    setViewingReceipt(null);
  };

  const handleSubmit = (formData: any) => {
    const payload = {
      receiveFrom: formData.receiveFrom,
      operationType: formData.operationType,
      products: [
        {
          productId: formData.productId,
          quantity: Number(formData.quantity),
        },
      ],
      status: editingReceipt?.status || "draft",
      scheduledDate:
        formData.scheduledDate || new Date().toISOString().split("T")[0],
      warehouse: formData.warehouse || undefined,
      barcode: formData.barcode || undefined,
    };

    if (editingReceipt) {
      dispatch(updateReceipt({ id: editingReceipt._id, data: payload }));
    } else {
      dispatch(createReceipt(payload));
    }
    handleClose();
  };

  const ReceiptForm = ({
    initialData,
  }: {
    initialData?: Partial<ReceiptItem>;
  }) => {
    const [formData, setFormData] = useState({
      receiveFrom: initialData?.receiveFrom || "",
      operationType: initialData?.operationType || "Purchase",
      productId: initialData?.products?.[0]?.productId || "",
      quantity: (initialData?.products?.[0]?.quantity || 1).toString(),
      warehouse: initialData?.warehouse || warehouses[0]?._id || "",
      scheduledDate: initialData?.scheduledDate || "",
      barcode: initialData?.barcode || "",
    });

    const handleChange =
      (field: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
          setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        };

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.productId) {
        toast.error("Please select a product");
        return;
      }
      if (!formData.warehouse && warehouses.length > 0) {
        toast.error("Please select a warehouse");
        return;
      }
      handleSubmit(formData);
    };
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
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold">
              {initialData ? "Update Receipt" : "Create New Receipt"}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="h-8 w-8" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Receive From *
                </label>
                <select
                  required
                  value={formData.receiveFrom}
                  onChange={handleChange("receiveFrom")}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Select Vendor</option>
                  {vendors?.map((v: any) => (
                    <option key={v._id} value={v._id}>
                      {v.vendorName || v.name || v.companyName}
                    </option>
                  ))}
                </select>
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
                  <option>Purchase</option>
                  <option>Transfer</option>
                  <option>Return</option>
                  <option>Manufacturing</option>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Warehouse *
                </label>
                {warehouseLoading ? (
                  <p className="text-sm text-gray-500">Loading warehouses...</p>
                ) : warehouses.length === 0 ? (
                  <p className="text-sm text-red-600">
                    No warehouses available
                  </p>
                ) : (
                  <select
                    required
                    value={formData.warehouse}
                    onChange={handleChange("warehouse")}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w: any) => (
                      <option key={w._id} value={w._id}>
                        {w.name} - {w.location}
                      </option>
                    ))}
                  </select>
                )}
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
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Barcode (Optional)
              </label>
              <input
                value={formData.barcode}
                onChange={handleChange("barcode")}
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="Scan or type barcode..."
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
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
                {initialData ? "Update Receipt" : "Create Receipt"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ViewReceipt = ({ item }: { item: ReceiptItem }) => {
    const productList = item.products
      .map((p) => {
        const product = products.find((pr: any) => pr._id === p.productId);
        return `${product?.name || "Unknown"} x${p.quantity}`;
      })
      .join(", ");

    const warehouseName = getWarehouseName(item.warehouse);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold">Receipt: {item._id}</h2>
            <button onClick={handleClose}>
              <XCircle className="h-8 w-8 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>From:</strong> {item.receiveFrom}
              </div>
              <div>
                <strong>Type:</strong> {item.operationType}
              </div>
              <div>
                <strong>Products:</strong> {productList}
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
                <strong>Date:</strong> {item.scheduledDate || "—"}
              </div>
              <div>
                <strong>Warehouse:</strong> {warehouseName}
              </div>
              {item.barcode && (
                <div>
                  <strong>Barcode:</strong> {item.barcode}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t">
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Receipt Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage incoming stock receipts and purchases
          </p>
        </div>
        <button
          disabled={!canCreate}
          onClick={() => canCreate && setShowCreateForm(true)}
          className={`px-5 py-3 rounded-lg flex items-center gap-2
    ${canCreate
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-400 text-white cursor-not-allowed"
            }`}
        >
          <Plus className="h-5 w-5" /> New Receipt
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <Package className="h-10 w-10 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{receipts.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <Clock className="h-10 w-10 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold">
              {receipts.filter((r: any) => r.status === "in-progress").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold">
              {receipts.filter((r: any) => r.status === "done").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
          <WarehouseIcon className="h-10 w-10 text-orange-500" />
          <div>
            <p className="text-sm text-gray-500">Warehouses</p>
            <p className="text-2xl font-bold">{warehouses.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search receipts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg border"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-3 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow--x-scroll">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr className="text-left text-xs font-semibold text-gray-600 tracking-wider">
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">From</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Products</th>
              <th className="px-6 py-3">Warehouse</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {receiptLoading || productLoading || warehouseLoading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filteredReceipts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-500">
                  No receipts found
                </td>
              </tr>
            ) : (
              filteredReceipts.map((r: ReceiptItem) => (
                <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {r._id}
                  </td>

                  <td className="px-6 py-4 flex items-center gap-2">
                    {/* <User className="h-4 w-4 text-gray-400" /> */}
                    {r.receiveFrom}
                  </td>

                  <td className="px-6 py-4 capitalize text-gray-700">
                    {r.operationType}
                  </td>

                  <td className="px-6 py-4 text-gray-700 space-y-1">
                    {r.products.map((p, i) => {
                      const prod = products.find(
                        (pr: any) => pr._id === p.productId
                      );
                      return (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-gray-400">•</span>
                          <span>{prod?.name || "—"}</span>
                          <span className="text-gray-500">× {p.quantity}</span>
                        </div>
                      );
                    })}
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {getWarehouseName(r.warehouse)}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        r.status
                      )}`}
                    >
                      {getStatusIcon(r.status)}
                      {r.status.replace("-", " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {r.scheduledDate}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      {/* View */}
                      <button
                        title="View"
                        onClick={() => {
                          setViewingReceipt(r);
                          setShowViewForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <Eye className="h-5 w-5" />
                      </button>

                      {/* Edit */}
                      <button
                        disabled={!canEdit}
                        onClick={() =>
                          canEdit &&
                          (setEditingReceipt(r), setShowUpdateForm(true))
                        }
                        className={`${canEdit
                            ? "text-blue-600"
                            : "text-gray-400 cursor-not-allowed"
                          }`}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {/* Approve */}
                      <button
                        title="Approve"
                        onClick={() => dispatch(approveReceipt(r._id))}
                        className="text-purple-600 hover:text-purple-800 transition"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>

                      {/* Delete */}
                      <button
                        disabled={!canDelete}
                        onClick={() => canDelete && handleDelete(r._id)}
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

      {/* Modals */}
      {showCreateForm && <ReceiptForm />}
      {showUpdateForm && editingReceipt && (
        <ReceiptForm initialData={editingReceipt} />
      )}
      {showViewForm && viewingReceipt && <ViewReceipt item={viewingReceipt} />}
    </div>
  );
};

export default Receipt;
