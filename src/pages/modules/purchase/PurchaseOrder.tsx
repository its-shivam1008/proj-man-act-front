import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "@/redux/slices/purchase/purchaseOrderSlice";
import { fetchVendors } from "@/redux/slices/purchase/vendorSlice";
import { PurchaseOrder, PurchaseOrderProductLine } from "@/types/purchase";
import {
  Plus,
  Eye,
  Edit,
  Package,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const PurchaseOrderComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { purchaseOrders, loading, error } = useSelector(
    (state: RootState) => state.purchaseOrders
  );
  const { vendors } = useSelector((state: RootState) => state.vendors);

  const [showCreatePo, setShowCreatePo] = useState(false);
  const [showViewPo, setShowViewPo] = useState(false);
  const [viewingPo, setViewingPo] = useState<PurchaseOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchVendors());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const CreatePoForm = () => {
    const [formData, setFormData] = useState({
      poNo: "",
      vendor: "", // This will be the vendor name for now, matching UI
      vendorId: "", // Added to store ID
      orderDate: "",
      deliveryAddress: "",
      warehouse: "Warehouse A",
      incoterms: "FOB",
      deliveryMethod: "Truck",
      scheduledDeliveryDate: "",
      productLines: [
        { product: "", quantity: 0, unitPrice: 0, taxes: 0, subtotal: 0 },
      ] as PurchaseOrderProductLine[],
      responsibleUser: "",
      totalAmount: 0,
    });

    const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedVendorName = e.target.value;
      const selectedVendor = vendors.find(
        (v) => v.vendorName === selectedVendorName
      );
      setFormData({
        ...formData,
        vendor: selectedVendorName,
        vendorId: selectedVendor ? selectedVendor.id : "",
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await dispatch(
          createPurchaseOrder({
            ...formData,
            status: "draft",
          })
        ).unwrap();
        toast.success("Purchase Order created");
        dispatch(fetchPurchaseOrders());
        setShowCreatePo(false);
      } catch (e) {
        // handled
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Create Purchase Order
              </h3>
              <button
                onClick={() => setShowCreatePo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={formData.poNo}
                    onChange={(e) =>
                      setFormData({ ...formData, poNo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Auto-generated"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <select
                    value={formData.vendor}
                    onChange={handleVendorChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.vendorName}>
                        {vendor.vendorName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) =>
                      setFormData({ ...formData, orderDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.deliveryAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter delivery address"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse
                  </label>
                  <select
                    value={formData.warehouse}
                    onChange={(e) =>
                      setFormData({ ...formData, warehouse: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Warehouse A</option>
                    <option>Warehouse B</option>
                    <option>Warehouse C</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incoterms
                  </label>
                  <select
                    value={formData.incoterms}
                    onChange={(e) =>
                      setFormData({ ...formData, incoterms: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>FOB</option>
                    <option>CIF</option>
                    <option>EXW</option>
                    <option>DDP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Method
                  </label>
                  <select
                    value={formData.deliveryMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryMethod: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Truck</option>
                    <option>Air Freight</option>
                    <option>Sea Freight</option>
                    <option>Rail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Delivery
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDeliveryDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDeliveryDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Lines
                </label>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="grid grid-cols-5 gap-2 mb-2 text-sm font-medium text-gray-700">
                    <div>Product</div>
                    <div>Quantity</div>
                    <div>Unit Price</div>
                    <div>Taxes (%)</div>
                    <div>Subtotal</div>
                  </div>
                  {formData.productLines.map((line, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                      <input
                        type="text"
                        value={line.product}
                        onChange={(e) => {
                          const newLines = [...formData.productLines];
                          newLines[index].product = e.target.value;
                          setFormData({ ...formData, productLines: newLines });
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                        placeholder="Product name"
                        required
                      />
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => {
                          const newLines = [...formData.productLines];
                          newLines[index].quantity =
                            parseInt(e.target.value) || 0;
                          newLines[index].subtotal =
                            newLines[index].quantity *
                            newLines[index].unitPrice;
                          setFormData({ ...formData, productLines: newLines });
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                        placeholder="Qty"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => {
                          const newLines = [...formData.productLines];
                          newLines[index].unitPrice =
                            parseFloat(e.target.value) || 0;
                          newLines[index].subtotal =
                            newLines[index].quantity *
                            newLines[index].unitPrice;
                          setFormData({ ...formData, productLines: newLines });
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                        placeholder="Price"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={line.taxes}
                        onChange={(e) => {
                          const newLines = [...formData.productLines];
                          newLines[index].taxes =
                            parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, productLines: newLines });
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                        placeholder="Tax %"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={line.subtotal}
                        className="px-2 py-1 border border-gray-300 rounded bg-gray-50"
                        disabled
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        productLines: [
                          ...formData.productLines,
                          {
                            product: "",
                            quantity: 0,
                            unitPrice: 0,
                            taxes: 0,
                            subtotal: 0,
                          },
                        ],
                      })
                    }
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Product Line
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsible User
                  </label>
                  <select
                    value={formData.responsibleUser}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsibleUser: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>John Doe</option>
                    <option>Jane Smith</option>
                    <option>Mike Johnson</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calculated automatically"
                    disabled
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreatePo(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  {submitting && (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  )}
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const ViewPoModal = () => {
    if (!viewingPo) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                PO Number: {viewingPo.poNo}
              </h3>
              <button
                onClick={() => {
                  setShowViewPo(false);
                  setViewingPo(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <p className="text-sm text-gray-900">{viewingPo.vendor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {viewingPo.orderDate
                      ? new Date(viewingPo.orderDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse
                  </label>
                  <p className="text-sm text-gray-900">{viewingPo.warehouse}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incoterms
                  </label>
                  <p className="text-sm text-gray-900">{viewingPo.incoterms}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Method
                  </label>
                  <p className="text-sm text-gray-900">
                    {viewingPo.deliveryMethod}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Delivery Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {viewingPo.scheduledDeliveryDate
                      ? new Date(
                          viewingPo.scheduledDeliveryDate
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsible User
                  </label>
                  <p className="text-sm text-gray-900">
                    {viewingPo.responsibleUser}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <p className="text-sm text-gray-900">
                    ${viewingPo.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address
                </label>
                <p className="text-sm text-gray-900">
                  {viewingPo.deliveryAddress}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Lines
                </label>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="grid grid-cols-5 gap-2 mb-2 text-sm font-medium text-gray-700">
                    <div>Product</div>
                    <div>Quantity</div>
                    <div>Unit Price</div>
                    <div>Taxes (%)</div>
                    <div>Subtotal</div>
                  </div>
                  {viewingPo.productLines?.map((line, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-5 gap-2 mb-2 text-sm text-gray-900"
                    >
                      <div>{line.product}</div>
                      <div>{line.quantity}</div>
                      <div>${line.unitPrice}</div>
                      <div>{line.taxes}%</div>
                      <div>${line.subtotal}</div>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No product lines</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewPo(false);
                    setViewingPo(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "waiting-for-delivery":
        return "bg-yellow-100 text-yellow-800";
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
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "waiting-for-delivery":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "done":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleDeletePurchasePrder = (id) => {
    if (confirm("Are you sure?")) {
      dispatch(deletePurchaseOrder(id))
        .unwrap()
        .then(() => {
          toast.success("Purchase Order deleted");
          dispatch(fetchPurchaseOrders());
        })
        .catch(() => {
          toast.error("Failed to delete Purchase Order");
        });
    }
  };

  if (loading && !purchaseOrders.length) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-sm text-gray-600">
            Manage purchase orders and track deliveries
          </p>
        </div>
        <button
          onClick={() => setShowCreatePo(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {po.poNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {po.vendor}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {po.orderDate
                    ? new Date(po.orderDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {po.scheduledDeliveryDate
                    ? new Date(po.scheduledDeliveryDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${(po.totalAmount || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(po.status)}
                    <span
                      className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        po.status
                      )}`}
                    >
                      {po.status?.replace("-", " ") || "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setViewingPo(po);
                      setShowViewPo(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-purple-600 hover:text-purple-900 mr-3">
                    <Package className="h-4 w-4" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeletePurchasePrder(po._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreatePo && <CreatePoForm />}
      {showViewPo && <ViewPoModal />}
    </div>
  );
};

export default PurchaseOrderComponent;
