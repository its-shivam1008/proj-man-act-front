import { usePermission } from "@/hooks/userPermission";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { ClipLoader } from "react-spinners";
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "@/redux/slices/purchase/purchaseOrderSlice";
import { fetchWarehouses } from '@/redux/slices/warehouseSlice'
import { fetchVendors } from "@/redux/slices/purchase/vendorSlice";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import { fetchInventoryMaster } from "@/redux/slices/inventoryMasterSlice";
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
  Search,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

const PurchaseOrderComponent: React.FC = () => {
  const [showUpdatePo, setShowUpdatePo] = useState(false);
  const canView = usePermission("purchaseOrders", "view");
  const canCreate = usePermission("purchaseOrders", "create");
  const canEdit = usePermission("purchaseOrders", "edit");
  const canDelete = usePermission("purchaseOrders", "delete");
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
  const dispatch = useDispatch<AppDispatch>();

  const { purchaseOrders, loading, error, meta } = useSelector(
    (state: RootState) => state.purchaseOrders
  );
  const { vendors } = useSelector((state: RootState) => state.vendors);

  const { category: categories, hsn: hsnCodes } = useSelector((state: RootState) => state.inventoryMaster);

  const [showCreatePo, setShowCreatePo] = useState(false);
  const [showViewPo, setShowViewPo] = useState(false);
  const [viewingPo, setViewingPo] = useState<PurchaseOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { warehouses } = useSelector((state: RootState) => state.warehouse);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");






  useEffect(() => {
    const organisationId = localStorage.getItem("organisationId");
    dispatch(
      fetchPurchaseOrders({
        page,
        limit,
        q: search,
        organisationId,
      })
    );

    dispatch(fetchVendors());
    dispatch(fetchWarehouses(localStorage.getItem("organisationId")));
    dispatch(fetchMaterials());
    dispatch(fetchInventoryMaster({ type: "category", page: 1, limit: 100 }));
    dispatch(fetchInventoryMaster({ type: "hsn", page: 1, limit: 100 }));
  }, [dispatch, page, limit, search]);


  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const CreatePoForm = () => {
    const [itemType, setItemType] = useState<"rawMaterial" | "product">("rawMaterial");
    const [formData, setFormData] = useState({
      poNo: "",
      vendor: "", // This will be the vendor name for now, matching UI
      vendorId: "", // Added to store ID
      orderDate: "",
      deliveryAddress: "",
      warehouse: "",
      incoterms: "FOB",
      deliveryMethod: "Truck",
      scheduledDeliveryDate: "",
      itemType: "rawMaterial" as "rawMaterial" | "product",
      productLines: [
        { 
          product: "", 
          quantity: 0, 
          unitPrice: 0, 
          taxes: 0, 
          subtotal: 0,
          organisationId: localStorage.getItem("organisationId") || "",
          warehouse: ""
        },
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
        vendorId: selectedVendor ? selectedVendor._id : "",
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await dispatch(
          createPurchaseOrder({
            ...formData,
            warehouse: itemType === "rawMaterial" ? formData.warehouse : undefined, 
            status: "draft",
            organisationId: localStorage.getItem("organisationId"),
          })
        ).unwrap();

        toast.success("Purchase Order created");

        dispatch(
          fetchPurchaseOrders({
            page,
            limit,
            q: search,
            organisationId: localStorage.getItem("organisationId"),
          })
        );

        setShowCreatePo(false);
      } catch (e) {
        toast.error("Failed to create purchase order");
      } finally {
        setSubmitting(false);
      }

    };
    if (!canCreate) {
      return (
        <p className="text-center text-red-600 py-6">
          You do not have permission to create purchase orders.
        </p>
      );
    }

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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Type
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => {
                      const newType = e.target.value as "rawMaterial" | "product";
                      setItemType(newType);
                      setFormData({ 
                        ...formData, 
                        itemType: newType,
                        productLines: [{ 
                          product: "", 
                          quantity: 0, 
                          unitPrice: 0, 
                          taxes: 0, 
                          subtotal: 0,
                          organisationId: localStorage.getItem("organisationId") || "",
                          warehouse: ""
                        }]
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="rawMaterial">Raw Material</option>
                    <option value="product">Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Number <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.poNo}
                    onChange={(e) =>
                      setFormData({ ...formData, poNo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave empty for auto-generation"
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
              <div>
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
                  {itemType === "rawMaterial" ? "Material Lines" : "Product Lines"}
                </label>
                <div className="border border-gray-300 rounded-lg p-4">
                  {itemType === "rawMaterial" ? (
                    // Raw Material Fields
                    <>
                      {formData.productLines.map((line, index) => (
                        <div key={index} className="border-b pb-4 mb-4 last:border-b-0">
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600">Material Name *</label>
                              <input
                                type="text"
                                value={line.product}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].product = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Enter material name"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Item Code</label>
                              <input
                                type="text"
                                value={line.itemCode || ""}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].itemCode = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Item code"
                              />
                            </div>
                            {/* Warehouse Field: ONLY for Raw Material */}
                            {itemType === "rawMaterial" && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
                                <select
                                  value={formData.warehouse}
                                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                >
                                  <option value="">Select Warehouse</option>
                                  {warehouses.map((warehouse: any) => (
                                    <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div>
                              <label className="text-xs font-medium text-gray-600">Unit of Measure *</label>
                              <select
                                value={line.unitOfMeasure || ""}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].unitOfMeasure = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                required
                              >
                                <option value="">Select Unit</option>
                                <option value="kg">kg</option>
                                <option value="gm">gm</option>
                                <option value="mg">mg</option>
                                <option value="km">km</option>
                                <option value="meter">meter</option>
                                <option value="liter">liter</option>
                                <option value="ml">ml</option>
                                <option value="pcs">pcs</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3 mb-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600">HSN</label>
                              <select
                                value={line.hsn || ""}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].hsn = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select HSN Code</option>
                                {hsnCodes && hsnCodes.length > 0 ? (
                                  hsnCodes.map((hsn: any) => (
                                    <option key={hsn._id} value={hsn.hsnNumber}>
                                      {hsn.hsnNumber} - {hsn.taxPercent}%
                                    </option>
                                  ))
                                ) : (
                                  <option value="" disabled>
                                    No HSN codes available
                                  </option>
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">GST %</label>
                              <input
                                type="number"
                                step="0.01"
                                value={line.gstPercent || ""}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].gstPercent = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="GST %"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Valuation Method</label>
                              <select
                                value={line.valuationMethod || "FIFO"}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].valuationMethod = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="FIFO">FIFO</option>
                                <option value="WEIGHTED_AVG">Weighted Avg</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Reorder Level</label>
                              <input
                                type="number"
                                value={line.reorderLevel || ""}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].reorderLevel = parseInt(e.target.value) || 0;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Reorder level"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3 mb-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600">Quantity *</label>
                              <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].quantity = parseInt(e.target.value) || 0;
                                  newLines[index].subtotal = newLines[index].quantity * newLines[index].unitPrice;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Qty"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Unit Price *</label>
                              <input
                                type="number"
                                step="0.01"
                                value={line.unitPrice}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].unitPrice = parseFloat(e.target.value) || 0;
                                  newLines[index].subtotal = newLines[index].quantity * newLines[index].unitPrice;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Price"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Taxes (%)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={line.taxes}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].taxes = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Tax %"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Subtotal</label>
                              <input
                                type="number"
                                step="0.01"
                                value={line.subtotal}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm"
                                disabled
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Technical Specs</label>
                            <textarea
                              rows={2}
                              value={line.technicalSpecs || ""}
                              onChange={(e) => {
                                const newLines = [...formData.productLines];
                                newLines[index].technicalSpecs = e.target.value;
                                setFormData({ ...formData, productLines: newLines });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Technical specifications"
                            />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    // Product Fields (Complete)
                    <>
                      {formData.productLines.map((line, index) => (
                        <div key={index} className="border-b pb-4 mb-4 last:border-b-0">
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600">Product Name *</label>
                              <input
                                type="text"
                                value={line.product}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].product = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Enter product name"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Product Type</label>
                              <select
                                value={line.productType || "goods"}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].productType = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="goods">Goods</option>
                                <option value="services">Services</option>
                                <option value="combo">Combo</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Category</label>
                              <select
                                value={line.category || ""}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].category = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select Category</option>
                                {categories && categories.length > 0 ? (
                                  categories.map((cat: any) => (
                                    <option key={cat._id} value={cat.name}>
                                      {cat.name}
                                    </option>
                                  ))
                                ) : (
                                  <option value="" disabled>
                                    No categories available
                                  </option>
                                )}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600">
                                SKU / Reference Code <span className="text-gray-400">(Auto-generated)</span>
                              </label>
                              <input
                                type="text"
                                value={line.sku || ""}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].sku = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Leave empty for auto-generation"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Barcode</label>
                              <input
                                type="text"
                                value={line.barcode || ""}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].barcode = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Barcode"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Warehouse</label>
                              <select
                                value={line.warehouseLocation || ""}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].warehouseLocation = e.target.value;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select Warehouse</option>
                                {warehouses?.map((wh) => (
                                  <option key={wh._id} value={wh.name}>
                                    {wh.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="text-xs font-medium text-gray-600">Description</label>
                            <textarea
                              rows={2}
                              value={line.description || ""}
                              onChange={(e) => {
                                const newLines = [...formData.productLines];
                                newLines[index].description = e.target.value;
                                setFormData({ ...formData, productLines: newLines });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Product description"
                            />
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600">Quantity *</label>
                              <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].quantity = parseInt(e.target.value) || 0;
                                  newLines[index].subtotal = newLines[index].quantity * newLines[index].unitPrice;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Qty"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Unit Price *</label>
                              <input
                                type="number"
                                step="0.01"
                                value={line.unitPrice}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].unitPrice = parseFloat(e.target.value) || 0;
                                  newLines[index].subtotal = newLines[index].quantity * newLines[index].unitPrice;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Price"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Taxes (%)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={line.taxes}
                                onChange={(e) => {
                                  const newLines = [...formData.productLines];
                                  newLines[index].taxes = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, productLines: newLines });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Tax %"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Subtotal</label>
                              <input
                                type="number"
                                step="0.01"
                                value={line.subtotal}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm"
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
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
                            organisationId: localStorage.getItem("organisationId") || "",
                            warehouse: ""
                          },
                        ],
                      })
                    }
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                  >
                    + Add {itemType === "rawMaterial" ? "Material" : "Product"} Line
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
                  disabled={submitting || !canCreate}
                  className={`px-4 py-2 rounded-lg text-white flex items-center ${canCreate ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                    }`}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Type
                  </label>
                  <p className="text-sm text-gray-900">
                    {viewingPo.itemType === "product" ? "Product" : "Raw Material"}
                  </p>
                </div>
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
                  {viewingPo.itemType === "product" ? "Product Lines" : "Material Lines"}
                </label>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="grid grid-cols-5 gap-2 mb-2 text-sm font-medium text-gray-700">
                    <div>{viewingPo.itemType === "product" ? "Product" : "Material"}</div>
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
                      <p className="text-sm text-gray-500">No {viewingPo.itemType === "product" ? "product" : "material"} lines</p>
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
  const UpdatePoModal = () => {
    if (!viewingPo) return null;

    const [itemType, setItemType] = useState<"rawMaterial" | "product">(
      viewingPo.itemType || "rawMaterial"
    );
    const [formData, setFormData] = useState({
      poNo: viewingPo.poNo,
      vendor: viewingPo.vendor,
      vendorId: viewingPo.vendorId,
      orderDate: viewingPo.orderDate?.split("T")[0] || "",
      deliveryAddress: viewingPo.deliveryAddress,
      // warehouse: viewingPo.warehouse,
      incoterms: viewingPo.incoterms,
      deliveryMethod: viewingPo.deliveryMethod,
      warehouse: viewingPo.warehouse 
        ? (typeof viewingPo.warehouse === 'object' ? viewingPo.warehouse._id : viewingPo.warehouse)
        : "",
      scheduledDeliveryDate: viewingPo.scheduledDeliveryDate
        ? viewingPo.scheduledDeliveryDate.split("T")[0]
        : "",
      itemType: viewingPo.itemType || "rawMaterial" as "rawMaterial" | "product",
      productLines: viewingPo.productLines || [],
      responsibleUser: viewingPo.responsibleUser,
      totalAmount: viewingPo.totalAmount,
    });

    const handleVendorChange = (e: any) => {
      const vendorName = e.target.value;
      const selected = vendors.find((v) => v.vendorName === vendorName);

      setFormData({
        ...formData,
        vendor: vendorName,
        vendorId: selected?._id || "",
      });
    };

    const handleSubmit = async (e: any) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        await dispatch(
          updatePurchaseOrder({
            id: viewingPo._id,
            data: {
              ...formData,
              organisationId: localStorage.getItem("organisationId"),
            },
          })
        ).unwrap();

        toast.success("Purchase Order updated successfully");

        dispatch(
          fetchPurchaseOrders({
            page,
            limit,
            q: search,
            organisationId: localStorage.getItem("organisationId"),
          })
        );

        setShowUpdatePo(false);
        setViewingPo(null);
      } catch (err) {
        toast.error("Failed to update Purchase Order");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 overflow-y-auto z-50">
        <div className="relative top-10 mx-auto p-6 bg-white rounded-lg shadow-lg w-11/12 md:w-4/5 lg:w-3/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Update Purchase Order</h3>
            <button
              onClick={() => {
                setShowUpdatePo(false);
                setViewingPo(null);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* --- Same fields as Create Modal --- */}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label>Item Type</label>
                <select
                  value={itemType}
                  onChange={(e) => {
                    const newType = e.target.value as "rawMaterial" | "product";
                    setItemType(newType);
                    setFormData({ 
                      ...formData, 
                      itemType: newType,
                      productLines: [{ 
                        product: "", 
                        quantity: 0, 
                        unitPrice: 0, 
                        taxes: 0, 
                        subtotal: 0,
                        organisationId: localStorage.getItem("organisationId") || "",
                        warehouse: ""
                      }]
                    });
                  }}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="rawMaterial">Raw Material</option>
                  <option value="product">Product</option>
                </select>
              </div>

              <div>
                <label>PO Number</label>
                <input
                  type="text"
                  value={formData.poNo}
                  onChange={(e) =>
                    setFormData({ ...formData, poNo: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label>Vendor</label>
                <select
                  value={formData.vendor}
                  onChange={handleVendorChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v._id} value={v.vendorName}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Order Date</label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) =>
                    setFormData({ ...formData, orderDate: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            {/* Address & Warehouse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label>Delivery Address</label>
                <textarea
                  rows={2}
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: e.target.value,
                    })
                  }
                  className="w-full border px-3 py-2 rounded"
                ></textarea>
              </div>

              <div>
                <label>Warehouse</label>
                <select
                  value={formData.warehouse}
                  onChange={(e) =>
                    setFormData({ ...formData, warehouse: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  {warehouses?.map((wh) => (
                    <option key={wh._id} value={wh.name}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Lines */}
            <div>
              <label>{itemType === "rawMaterial" ? "Material Lines" : "Product Lines"}</label>
              <div className="border p-3 rounded-lg">
                <div className="grid grid-cols-6 gap-2 mb-2 text-sm font-medium text-gray-700">
                  <div>{itemType === "rawMaterial" ? "Material Name" : "Product Name"}</div>
                  <div>Quantity</div>
                  <div>Unit Price</div>
                  <div>Taxes (%)</div>
                  <div>Location</div>
                  <div>Subtotal</div>
                </div>
                {formData.productLines.map((line, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-6 gap-2 mb-2 text-sm"
                  >
                    <input
                      type="text"
                      value={line.product}
                      onChange={(e) => {
                        const updated = [...formData.productLines];
                        updated[index].product = e.target.value;
                        setFormData({ ...formData, productLines: updated });
                      }}
                      className="border px-2 py-1 rounded"
                      placeholder={itemType === "rawMaterial" ? "Enter material name" : "Enter product name"}
                    />
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => {
                        const updated = [...formData.productLines];
                        updated[index].quantity = Number(e.target.value);
                        updated[index].subtotal =
                          updated[index].unitPrice * updated[index].quantity;
                        setFormData({ ...formData, productLines: updated });
                      }}
                      className="border px-2 py-1 rounded"
                    />
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={(e) => {
                        const updated = [...formData.productLines];
                        updated[index].unitPrice = Number(e.target.value);
                        updated[index].subtotal =
                          updated[index].quantity * updated[index].unitPrice;
                        setFormData({ ...formData, productLines: updated });
                      }}
                      className="border px-2 py-1 rounded"
                    />
                    <input
                      type="number"
                      value={line.taxes}
                      onChange={(e) => {
                        const updated = [...formData.productLines];
                        updated[index].taxes = Number(e.target.value);
                        setFormData({ ...formData, productLines: updated });
                      }}
                      className="border px-2 py-1 rounded"
                    />
                    {/* [!code ++] Conditional Location for Update */}
                    {itemType === "rawMaterial" && (
                        <div>
                          <select
                            value={line.warehouse}
                            onChange={(e) => {
                              const updated = [...formData.productLines];
                              updated[index].warehouse = e.target.value;
                              setFormData({ ...formData, productLines: updated });
                            }}
                            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Warehouse</option>
                            {warehouses.map((warehouse: any) => (
                              <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
                            ))}
                          </select>
                        </div>
                    )}
                    <input
                      type="number"
                      value={line.subtotal}
                      disabled
                      className="border px-2 py-1 bg-gray-100 rounded"
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
                          organisationId: localStorage.getItem("organisationId") || "",
                          warehouse: ""
                        },
                      ],
                    })
                  }
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  + Add {itemType === "rawMaterial" ? "Material" : "Product"} Line
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUpdatePo(false);
                  setViewingPo(null);
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Update Purchase Order
              </button>
            </div>
          </form>
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
          dispatch(fetchPurchaseOrders({ page, limit, q: search }));
        })
        .catch(() => {
          toast.error("Failed to delete Purchase Order");
        });
    }
  };

  const handlePrev = () => {
    if (!meta) return;
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (!meta) return;
    if (page < meta.totalPages) setPage(page + 1);
  };

  const jumpToPage = (p: number) => {
    if (!meta) return;
    const pageNum = Math.min(Math.max(1, p), meta.totalPages);
    setPage(pageNum);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    setLimit(newLimit);
    setPage(1);
  };

  if (loading && !purchaseOrders.length) return <div className="flex justify-center items-center gap-2"><span>Loading </span><ClipLoader
    color="#212121"
    loading={loading}
    size={15}
    aria-label="Loading Spinner"
    data-testid="loader"
  /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-sm text-gray-600">
            Manage purchase orders and track deliveries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search purchase orders..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
          <button
            disabled={!canCreate}
            onClick={() => canCreate && setShowCreatePo(true)}
            className={`px-4 py-2 rounded-lg flex items-center justify-center whitespace-nowrap ${canCreate ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-400 text-white cursor-not-allowed"
              }`}
          >

            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
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
                    ₹{(po.totalAmount || 0).toLocaleString()}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-3">

                    {/* VIEW */}
                    <button
                      onClick={() => {
                        setViewingPo(po);
                        setShowViewPo(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* PACKAGE (GRN / RECEIVE) */}
                    <button
                      onClick={() => {
                        // open GRN modal later if you create it
                        console.log("Open Receive Goods Modal for:", po.poNo);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      <Package className="h-4 w-4" />
                    </button>

                    {/* EDIT */}
                    <button
                      disabled={!canEdit}
                      onClick={() => {
                        setViewingPo(po);
                        setShowUpdatePo(true);
                      }}
                      className={`${canEdit
                        ? "text-yellow-600 hover:text-yellow-700"
                        : "text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {/* DELETE */}
                    <button
                      disabled={!canDelete}
                      onClick={() => canDelete && handleDeletePurchasePrder(po._id)}
                      className={`${canDelete
                        ? "text-red-600 hover:text-red-900"
                        : "text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t bg-gray-50">
            <div className="flex items-center gap-2 mb-3 sm:mb-0">
              <button
                onClick={handlePrev}
                disabled={page <= 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = meta.totalPages;
                  const current = page;
                  const delta = 3;
                  const range = [];
                  const rangeWithDots = [];

                  for (let i = 1; i <= totalPages; i++) {
                    if (
                      i === 1 ||
                      i === totalPages ||
                      (i >= current - delta && i <= current + delta)
                    ) {
                      range.push(i);
                    }
                  }

                  let last = 0;
                  range.forEach((p) => {
                    if (last && p - last > 1) {
                      rangeWithDots.push('...');
                    }
                    rangeWithDots.push(p);
                    last = p;
                  });

                  return rangeWithDots.map((p, idx) =>
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => jumpToPage(p as number)}
                        className={`px-3 py-1.5 rounded-md text-sm ${p === current
                          ? 'bg-blue-600 text-white font-medium'
                          : 'border border-gray-300 hover:bg-gray-100'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}
              </div>

              <button
                onClick={handleNext}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>
                Showing <strong>{(page - 1) * limit + 1}</strong> to{' '}
                <strong>{Math.min(page * limit, meta.total)}</strong> of <strong>{meta.total}</strong>{' '}
                Purchase Orders
              </span>

              <select
                value={limit}
                onChange={handleLimitChange}
                className="border border-gray-300 px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        )}
      </div>
      {showUpdatePo && <UpdatePoModal />}

      {showCreatePo && <CreatePoForm />}
      {showViewPo && <ViewPoModal />}
    </div>
  );
};

export default PurchaseOrderComponent;
