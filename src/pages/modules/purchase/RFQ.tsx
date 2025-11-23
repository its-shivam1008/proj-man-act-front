import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchRFQs, createRFQ, updateRFQ, deleteRFQ } from '@/redux/slices/purchase/rfqSlice';
import { fetchVendors } from '@/redux/slices/purchase/vendorSlice';
import { RFQ, RFQProduct } from '@/types/purchase';
import {
  Plus,
  Eye,
  Edit,
  Send,
  Trash2,
  FileText,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const RFQComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rfqs, loading: rfqLoading,meta, error } = useSelector((state: RootState) => state.rfqs);
  const { vendors } = useSelector((state: RootState) => state.vendors);
  
  const [showCreateRfq, setShowCreateRfq] = useState(false);
  const [showUpdateRfq, setShowUpdateRfq] = useState(false);
  const [showViewRfq, setShowViewRfq] = useState(false);
  const [editingRfq, setEditingRfq] = useState<RFQ | null>(null);
  const [viewingRfq, setViewingRfq] = useState<RFQ | null>(null);
  const [submitting, setSubmitting] = useState(false);

    const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    dispatch(fetchRFQs({ page, limit, q: search }));
    dispatch(fetchVendors());
  }, [dispatch]);

    useEffect(() => {
    if (error) {
        toast.error(error);
    }
  }, [error]);

  const generateRfqNumber = () => {
    const year = new Date().getFullYear();
    const count = rfqs.length + 1;
    return `RFQ-${year}-${String(count).padStart(4, '0')}`;
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
    setPage(1); // reset to page 1 when changing page size
  };

  // const filteredRfqs = rfqs.filter(rfq => {
  //   const matchesSearch = rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     rfq.notes?.toLowerCase().includes(searchTerm.toLowerCase());
  //   const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
  //   return matchesSearch && matchesStatus;
  // });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'received':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleSendRfq = async (rfq: RFQ) => {
    try {
        await dispatch(updateRFQ({ id: rfq.id, data: { status: 'sent' } })).unwrap();
        toast.success("RFQ Sent to vendors");
        dispatch(fetchRFQs({ page, limit, q: search }));
    } catch (e) {
        toast.error("Failed to send RFQ");
    }
  };

  const handleDeleteRfq = async (id: string) => {
    if (confirm('Are you sure you want to delete this RFQ?')) {
        try {
             await dispatch(deleteRFQ(id)).unwrap();
             toast.success("RFQ deleted");
             dispatch(fetchRFQs({ page, limit, q: search }));
        } catch (e) {
            toast.error("Failed to delete RFQ");
        }
    }
  };

  // Create RFQ Form Component
  const CreateRfqForm = () => {
    const [formData, setFormData] = useState({
      rfqNumber: generateRfqNumber(),
      orderDate: new Date().toISOString().split('T')[0],
      currency: 'INR',
      vendors: [] as string[],
      paymentTerms: 'Net 30',
      deliveryDate: '',
      products: [{ name: '', quantity: 0, uom: 'pieces', unitPrice: 0, taxes: 0 }] as RFQProduct[],
      notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.rfqNumber || !formData.orderDate || !formData.deliveryDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.vendors.length === 0) {
          toast.error('Please select at least one vendor');
          return;
      }

      setSubmitting(true);
      try {
          await dispatch(createRFQ({
            ...formData,
            status: 'draft'
          })).unwrap();
          toast.success("RFQ created successfully");
          dispatch(fetchRFQs({ page, limit, q: search }));
          setShowCreateRfq(false);
      } catch(e) {
          // handled
      } finally {
          setSubmitting(false);
      }
    };

    const addProduct = () => {
      setFormData({
        ...formData,
        products: [...formData.products, { name: '', quantity: 0, uom: 'pieces', unitPrice: 0, taxes: 0 }]
      });
    };

    const removeProduct = (index: number) => {
      if (formData.products.length > 1) {
        const newProducts = formData.products.filter((_, i) => i !== index);
        setFormData({ ...formData, products: newProducts });
      }
    };

    const updateProduct = (index: number, field: keyof RFQProduct, value: any) => {
      const newProducts = [...formData.products];
      (newProducts[index] as any)[field] = value;
      setFormData({ ...formData, products: newProducts });
    };

    const calculateTotal = () => {
      return formData.products.reduce((sum, p) => {
        const subtotal = p.quantity * p.unitPrice;
        const taxAmount = subtotal * (p.taxes / 100);
        return sum + subtotal + taxAmount;
      }, 0);
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white mb-10">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New RFQ</h3>
              <button onClick={() => setShowCreateRfq(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RFQ Number *</label>
                  <input
                    type="text"
                    value={formData.rfqNumber}
                    onChange={(e) => setFormData({ ...formData, rfqNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* Vendors and Payment */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Vendors *</label>
                  <select
                    multiple
                    value={formData.vendors}
                    onChange={(e) => setFormData({ ...formData, vendors: Array.from(e.target.selectedOptions, option => option.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                    required
                  >
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.vendorName}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="COD">Cash on Delivery</option>
                      <option value="Advance">Advance Payment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date *</label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Products / Items</label>
                <div className="border border-gray-300 rounded-lg p-4 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-sm font-medium text-gray-700">
                        <th className="text-left pb-2">Product Name</th>
                        <th className="text-left pb-2">Quantity</th>
                        <th className="text-left pb-2">UoM</th>
                        <th className="text-left pb-2">Unit Price</th>
                        <th className="text-left pb-2">Tax (%)</th>
                        <th className="text-left pb-2">Subtotal</th>
                        <th className="text-left pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.products.map((product, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-2 pr-2">
                            <input
                              type="text"
                              value={product.name}
                              onChange={(e) => updateProduct(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                              placeholder="Product name"
                              required
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              value={product.quantity}
                              onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                              min="0"
                              required
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <select
                              value={product.uom}
                              onChange={(e) => updateProduct(index, 'uom', e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="pieces">Pieces</option>
                              <option value="kg">Kg</option>
                              <option value="meters">Meters</option>
                              <option value="liters">Liters</option>
                              <option value="units">Units</option>
                            </select>
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              step="0.01"
                              value={product.unitPrice}
                              onChange={(e) => updateProduct(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded"
                              min="0"
                              required
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              step="0.01"
                              value={product.taxes}
                              onChange={(e) => updateProduct(index, 'taxes', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                              min="0"
                            />
                          </td>
                          <td className="py-2 pr-2 text-sm text-gray-900">
                            ₹{((product.quantity * product.unitPrice) * (1 + product.taxes / 100)).toFixed(2)}
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              className="text-red-500 hover:text-red-700"
                              disabled={formData.products.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={addProduct}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Product
                    </button>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Total: </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formData.currency} {calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes, specifications, or requirements..."
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateRfq(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                   {submitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                   Create RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Update RFQ Form Component
  const UpdateRfqForm = () => {
    if (!editingRfq) return null;

    const [formData, setFormData] = useState({
      rfqNumber: editingRfq.rfqNumber,
      orderDate: editingRfq.orderDate ? new Date(editingRfq.orderDate).toISOString().split('T')[0] : '',
      currency: editingRfq.currency || 'USD',
      vendors: typeof editingRfq.vendors[0] === 'object' ? editingRfq.vendors.map((v: any) => v.id || v._id) : editingRfq.vendors,
      paymentTerms: editingRfq.paymentTerms || 'Net 30',
      deliveryDate: editingRfq.deliveryDate ? new Date(editingRfq.deliveryDate).toISOString().split('T')[0] : '',
      products: editingRfq.products || [{ name: '', quantity: 0, uom: 'pieces', unitPrice: 0, taxes: 0 }],
      notes: editingRfq.notes || '',
      status: editingRfq.status
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await dispatch(updateRFQ({ id: editingRfq._id, data: formData })).unwrap();
        toast.success("RFQ updated successfully");
        dispatch(fetchRFQs({ page, limit, q: search }));
        setShowUpdateRfq(false);
        setEditingRfq(null);
      } catch (e) {
          // handled
      } finally {
          setSubmitting(false);
      }
    };

    const updateProduct = (index: number, field: keyof RFQProduct, value: any) => {
      const newProducts = [...formData.products];
      (newProducts[index] as any)[field] = value;
      setFormData({ ...formData, products: newProducts });
    };

    const addProduct = () => {
      setFormData({
        ...formData,
        products: [...formData.products, { name: '', quantity: 0, uom: 'pieces', unitPrice: 0, taxes: 0 }]
      });
    };

    const removeProduct = (index: number) => {
      if (formData.products.length > 1) {
        const newProducts = formData.products.filter((_, i) => i !== index);
        setFormData({ ...formData, products: newProducts });
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white mb-10">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update RFQ: {editingRfq.rfqNumber}</h3>
              <button onClick={() => { setShowUpdateRfq(false); setEditingRfq(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RFQ Number *</label>
                  <input
                    type="text"
                    value={formData.rfqNumber}
                    onChange={(e) => setFormData({ ...formData, rfqNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="received">Received</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Vendors and Payment */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Vendors *</label>
                  <select
                    multiple
                    value={formData.vendors}
                    onChange={(e) => setFormData({ ...formData, vendors: Array.from(e.target.selectedOptions, option => option.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                    required
                  >
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.vendorName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="COD">Cash on Delivery</option>
                      <option value="Advance">Advance Payment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date *</label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Products / Items</label>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="grid grid-cols-7 gap-2 mb-2 text-sm font-medium text-gray-700">
                    <div>Product Name</div>
                    <div>Quantity</div>
                    <div>UoM</div>
                    <div>Unit Price</div>
                    <div>Tax (%)</div>
                    <div>Subtotal</div>
                    <div></div>
                  </div>
                  {formData.products.map((product, index) => (
                    <div key={index} className="grid grid-cols-7 gap-2 mb-2">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => updateProduct(index, 'name', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded"
                        required
                      />
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="px-2 py-1 border border-gray-300 rounded"
                        required
                      />
                      <select
                        value={product.uom}
                        onChange={(e) => updateProduct(index, 'uom', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="pieces">Pieces</option>
                        <option value="kg">Kg</option>
                        <option value="meters">Meters</option>
                        <option value="liters">Liters</option>
                        <option value="units">Units</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={product.unitPrice}
                        onChange={(e) => updateProduct(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border border-gray-300 rounded"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={product.taxes}
                        onChange={(e) => updateProduct(index, 'taxes', parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border border-gray-300 rounded"
                      />
                      <div className="px-2 py-1 text-sm text-gray-900">
                        ₹{((product.quantity * product.unitPrice) * (1 + product.taxes / 100)).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addProduct} className="text-blue-600 hover:text-blue-800 text-sm mt-2">
                    + Add Product
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowUpdateRfq(false); setEditingRfq(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  {submitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  Update RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // View RFQ Modal Component
  const ViewRfqModal = () => {
    if (!viewingRfq) return null;

    const calculateTotal = () => {
      return viewingRfq.products?.reduce((sum, p) => {
        const subtotal = p.quantity * p.unitPrice;
        const taxAmount = subtotal * (p.taxes / 100);
        return sum + subtotal + taxAmount;
      }, 0) || 0;
    };

    const getVendorNames = () => {
      return viewingRfq.vendors?.map(vendorId => {
        // If vendorId is an object (populated), use vendorName, else find in state
        if (typeof vendorId === 'object' && (vendorId as any).vendorName) {
            return (vendorId as any).vendorName;
        }
        const vendor = vendors.find(v => v.id === vendorId);
        return vendor?.vendorName || vendorId;
      }).join(', ') || 'No vendors selected';
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white mb-10">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">RFQ: {viewingRfq.rfqNumber}</h3>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingRfq.status)}`}>
                  {getStatusIcon(viewingRfq.status)}
                  <span className="ml-1">{viewingRfq.status}</span>
                </span>
              </div>
              <button onClick={() => { setShowViewRfq(false); setViewingRfq(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">RFQ Details</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Order Date</label>
                    <p className="text-sm font-medium text-gray-900">{viewingRfq.orderDate ? new Date(viewingRfq.orderDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Expected Delivery</label>
                    <p className="text-sm font-medium text-gray-900">{viewingRfq.deliveryDate ? new Date(viewingRfq.deliveryDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Currency</label>
                    <p className="text-sm font-medium text-gray-900">{viewingRfq.currency}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Payment Terms</label>
                    <p className="text-sm font-medium text-gray-900">{viewingRfq.paymentTerms}</p>
                  </div>
                </div>
              </div>

              {/* Vendors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Vendors</label>
                <p className="text-sm text-gray-900 bg-blue-50 rounded-lg p-3">{getVendorNames()}</p>
              </div>

              {/* Products Table */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Products / Items</label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UoM</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewingRfq.products?.map((product, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.uom}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{viewingRfq.currency} {product.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.taxes}%</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {viewingRfq.currency} {((product.quantity * product.unitPrice) * (1 + product.taxes / 100)).toFixed(2)}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-sm text-gray-500 text-center">No products</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Total:</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          {viewingRfq.currency} {calculateTotal().toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {viewingRfq.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Requirements</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{viewingRfq.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewRfq(false);
                    setViewingRfq(null);
                    setEditingRfq(viewingRfq);
                    setShowUpdateRfq(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                {viewingRfq.status === 'draft' && (
                  <button
                    onClick={() => {
                      handleSendRfq(viewingRfq);
                      setShowViewRfq(false);
                      setViewingRfq(null);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to Vendors
                  </button>
                )}
                <button
                  onClick={() => { setShowViewRfq(false); setViewingRfq(null); }}
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

  if (rfqLoading && !rfqs.length) return <div>Loading...</div>;

return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Request for Quotation (RFQ)</h2>
        <p className="text-sm text-gray-600">Create and manage RFQs, compare vendor offers</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search RFQs..."
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setShowCreateRfq(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New RFQ
        </button>
      </div>
    </div>

    {/* RFQ Table */}
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                RFQ Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendors
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
            {rfqs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No RFQs found</p>
                  <button
                    onClick={() => setShowCreateRfq(true)}
                    className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Create your first RFQ
                  </button>
                </td>
              </tr>
            ) : (
              rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rfq.rfqNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfq.vendors?.length || 0} vendors
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfq.orderDate ? new Date(rfq.orderDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfq.deliveryDate ? new Date(rfq.deliveryDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rfq.currency}{' '}
                    {(
                      rfq.products?.reduce(
                        (sum, p) => sum + p.quantity * p.unitPrice * (1 + p.taxes / 100),
                        0
                      ) || 0
                    ).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(rfq.status)}
                      <span
                        className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          rfq.status
                        )}`}
                      >
                        {rfq.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setViewingRfq(rfq);
                          setShowViewRfq(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingRfq(rfq);
                          setShowUpdateRfq(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {rfq.status === 'draft' && (
                        <button
                          onClick={() => handleSendRfq(rfq)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Send to Vendors"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRfq(rfq.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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

            {/* Dynamic page numbers: show up to 7 pages centered around current page */}
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
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        p === current
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
              RFQs
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

    {/* Modals */}
    {showCreateRfq && <CreateRfqForm onClose={() => setShowCreateRfq(false)} />}
    {showUpdateRfq && editingRfq && (
      <UpdateRfqForm rfq={editingRfq} onClose={() => setShowUpdateRfq(false)} />
    )}
    {showViewRfq && viewingRfq && (
      <ViewRfqModal rfq={viewingRfq} onClose={() => setShowViewRfq(false)} />
    )}
  </div>
);
};

export default RFQComponent;
