import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchVendors, createVendor, updateVendor, deleteVendor } from '@/redux/slices/purchase/vendorSlice';
import { Vendor } from '@/types/purchase';
import { Plus, Eye, Edit, Trash2, Building, Mail, Phone, MapPin, CreditCard, Star, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PurchaseVendors: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { vendors, loading, error } = useSelector((state: RootState) => state.vendors);
  
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [showViewVendor, setShowViewVendor] = useState(false);
  const [showEditVendor, setShowEditVendor] = useState(false);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
        toast.error(error);
    }
  }, [error]);

  const CreateVendorForm = () => {
    const [formData, setFormData] = useState({
      vendorName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      currency: 'USD',
      paymentTerms: 'Net 30',
      productsSupplied: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      notes: '',
      isActive: true,
      vendorRating: 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          await dispatch(createVendor(formData)).unwrap();
          toast.success("Vendor created successfully");
          dispatch(fetchVendors());
          setShowCreateVendor(false);
      } catch (err) {
          // Error handled by global toaster via state listener or unwrap catch
          toast.error("Failed to create vendor");
      } finally {
          setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Vendor</h3>
              <button onClick={() => setShowCreateVendor(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
                  <input type="text" value={formData.vendorName} onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter vendor name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input type="text" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Contact person name" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="vendor@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+1-555-0123" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Complete address"></textarea>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN / Tax ID</label>
                  <input type="text" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="GST123456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Products Supplied</label>
                <input type="text" value={formData.productsSupplied} onChange={(e) => setFormData({ ...formData, productsSupplied: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Comma-separated list of products" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Details</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border border-gray-300 rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Bank name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input type="text" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Account number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input type="text" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="IFSC code" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Additional notes about the vendor..."></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateVendor(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    {submitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    Add Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const EditVendorForm = () => {
    if (!editingVendor) return null;
    const [formData, setFormData] = useState({
      vendorName: editingVendor.vendorName,
      contactPerson: editingVendor.contactPerson || '',
      email: editingVendor.email || '',
      phone: editingVendor.phone || '',
      address: editingVendor.address || '',
      gstin: editingVendor.gstin || '',
      currency: editingVendor.currency || 'USD',
      paymentTerms: editingVendor.paymentTerms || 'Net 30',
      productsSupplied: editingVendor.productsSupplied || '',
      bankName: editingVendor.bankName || '',
      accountNumber: editingVendor.accountNumber || '',
      ifscCode: editingVendor.ifscCode || '',
      notes: editingVendor.notes || '',
      isActive: editingVendor.isActive,
      vendorRating: editingVendor.vendorRating
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          await dispatch(updateVendor({ id: editingVendor.id, data: formData })).unwrap();
          toast.success("Vendor updated successfully");
          dispatch(fetchVendors());
          setShowEditVendor(false);
          setEditingVendor(null);
      } catch (err) {
          const message = typeof err === "string" ? err : err?.message ?? "Failed to create vendor";
          toast.error(message);
      } finally {
          setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
          <div className="mt-3">
             <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Vendor</h3>
              <button onClick={() => { setShowEditVendor(false); setEditingVendor(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
                  <input type="text" value={formData.vendorName} onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter vendor name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input type="text" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Contact person name" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="vendor@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+1-555-0123" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Complete address"></textarea>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN / Tax ID</label>
                  <input type="text" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="GST123456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Products Supplied</label>
                <input type="text" value={formData.productsSupplied} onChange={(e) => setFormData({ ...formData, productsSupplied: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Comma-separated list of products" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Details</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border border-gray-300 rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Bank name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input type="text" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Account number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input type="text" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="IFSC code" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Additional notes about the vendor..."></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setShowEditVendor(false); setEditingVendor(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                     {submitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                     Update Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const ViewVendorModal = () => {
    if (!viewingVendor) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">View Vendor: {viewingVendor.vendorName}</h3>
              <button onClick={() => { setShowViewVendor(false); setViewingVendor(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <p className="text-sm text-gray-900">{viewingVendor.contactPerson}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{viewingVendor.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-sm text-gray-900">{viewingVendor.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <p className="text-sm text-gray-900">{viewingVendor.paymentTerms}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <p className="text-sm text-gray-900">{viewingVendor.currency}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN / Tax ID</label>
                  <p className="text-sm text-gray-900">{viewingVendor.gstin}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-sm text-gray-900">{viewingVendor.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Products Supplied</label>
                <p className="text-sm text-gray-900">{viewingVendor.productsSupplied}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Details</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border border-gray-300 rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <p className="text-sm text-gray-900">{viewingVendor.bankName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <p className="text-sm text-gray-900">{viewingVendor.accountNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <p className="text-sm text-gray-900">{viewingVendor.ifscCode}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-sm text-gray-900">{viewingVendor.notes}</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={() => { setShowViewVendor(false); setViewingVendor(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-sm text-gray-600">Manage vendor database and performance</p>
        </div>
        <button
          onClick={() => setShowCreateVendor(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </button>
      </div>

      {loading && !vendors.length ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
      ) : (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors?.map((vendor) => (
          <div key={vendor.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{vendor.vendorName}</h3>
                  <p className="text-sm text-gray-500">{vendor.contactPerson}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm font-medium text-gray-900">{vendor.vendorRating}</span>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {vendor.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {vendor.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {vendor.address ? vendor.address.substring(0, 50) + '...' : ''}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CreditCard className="h-4 w-4 mr-2" />
                {vendor.paymentTerms}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Products Supplied:</p>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  let products: string[] = [];
                  if (vendor.productsSupplied) {
                    products = vendor.productsSupplied.split(',').map(p => p.trim()).filter(p => p);
                  }
                  return products.slice(0, 3).map((product: string, index: number) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {product}
                    </span>
                  ));
                })()}
                {(() => {
                   let products: string[] = [];
                   if (vendor.productsSupplied) {
                     products = vendor.productsSupplied.split(',').map(p => p.trim()).filter(p => p);
                   }
                  if (products.length > 3) {
                    return (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        +{products.length - 3} more
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {vendor.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="flex space-x-2">
                <button onClick={() => { setViewingVendor(vendor); setShowViewVendor(true); }} className="text-blue-600 hover:text-blue-900"><Eye className="h-4 w-4" /></button>
                <button onClick={() => { setEditingVendor(vendor); setShowEditVendor(true); }} className="text-green-600 hover:text-green-900"><Edit className="h-4 w-4" /></button>
                <button className="text-red-600 hover:text-red-900" onClick={() => {
                  if (confirm('Are you sure?')) {
                    dispatch(deleteVendor(vendor.id));
                  }
                }}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {showCreateVendor && <CreateVendorForm />}
      {showEditVendor && <EditVendorForm />}
      {showViewVendor && <ViewVendorModal />}
    </div>
  );
};

export default PurchaseVendors;
