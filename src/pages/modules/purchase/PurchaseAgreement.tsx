import { usePermission } from "@/hooks/userPermission";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchPurchaseAgreements, createPurchaseAgreement, deletePurchaseAgreement } from '@/redux/slices/purchase/purchaseAgreementSlice';
import { fetchVendors } from '@/redux/slices/purchase/vendorSlice';
import { PurchaseAgreement } from '@/types/purchase';
import { Plus, Eye, Trash2, CheckCircle, X, Loader2, Search, ShieldAlert, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { fetchMasterData } from "@/redux/slices/masterDataSlice";

const PurchaseAgreementComponent: React.FC = () => {
  const canView = usePermission("agreements", "view");
  const canCreate = usePermission("agreements", "create");
  const canEdit = usePermission("agreements", "edit");
  const canDelete = usePermission("agreements", "delete");
  const { userProfile } = useSelector((state: any) => state.auth); // [!code ++]
  const { locations } = useSelector((state: any) => state.masterData); // [!code ++]
  const isLocationRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;
  const [locationFilter, setLocationFilter] = useState(isLocationRestricted ? userProfile.location : "all");
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
  const { purchaseAgreements, loading, error, meta } = useSelector((state: RootState) => state.purchaseAgreements);
  const { vendors } = useSelector((state: RootState) => state.vendors);

  const [showCreateAgreement, setShowCreateAgreement] = useState(false);
  const [showViewAgreement, setShowViewAgreement] = useState(false);
  const [viewingAgreement, setViewingAgreement] = useState<PurchaseAgreement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");

  const getLocationName = (loc: string | { name: string } | undefined) => {
    if (!loc) return "N/A";
    if (typeof loc === 'object') return loc.name || "N/A";
    const found = locations.find((l: any) => l._id === loc);
    return found ? found.name : "N/A";
  };

  useEffect(() => {
    dispatch(fetchMasterData("location")); // [!code ++]
    dispatch(fetchPurchaseAgreements({ page, limit, q: search, location: locationFilter })); // [!code ++]
    dispatch(fetchVendors());
  }, [dispatch, page, limit, search, locationFilter]); // [!code ++]

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const CreateAgreementForm = () => {
    const [formData, setFormData] = useState({
      agreementNumber: '',
      vendor: '',
      vendorId: '',
      startDate: '',
      endDate: '',
      terms: '',
      totalValue: 0,
      location: isLocationRestricted ? userProfile.location : "",
      notes: ''
    });

    const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedVendorName = e.target.value;
      const selectedVendor = vendors.find(v => v.vendorName === selectedVendorName);
      setFormData({
        ...formData,
        vendor: selectedVendorName,
        vendorId: selectedVendor ? selectedVendor._id : ''
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await dispatch(createPurchaseAgreement({
          ...formData,
          status: 'active'
        })).unwrap();
        dispatch(fetchPurchaseAgreements({ page, limit, q: search }));
        toast.success("Purchase Agreement created");
        setShowCreateAgreement(false);
      } catch (e) {
        toast.error("Failed to create purchase agreement");
      } finally {
        setSubmitting(false);
      }
    };

    if (!canCreate) {
      return (
        <p className="text-center text-red-600 py-6">
          You do not have permission to create purchase agreements.
        </p>
      );
    }


    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Purchase Agreement</h3>
              <button onClick={() => setShowCreateAgreement(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Number</label>
                  <input type="text" value={formData.agreementNumber} onChange={(e) => setFormData({ ...formData, agreementNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Auto-generated" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={isLocationRestricted}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map((l: any) => (
                      <option key={l._id} value={l._id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <select value={formData.vendor} onChange={handleVendorChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select Vendor</option>
                    {vendors?.map(vendor => (
                      <option key={vendor.id} value={vendor.vendorName}>{vendor.vendorName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms</label>
                <textarea rows={3} value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Agreement terms..." />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
                  <input type="number" step="0.01" value={formData.totalValue} onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateAgreement(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || !canCreate}
                  className={`px-4 py-2 rounded-lg text-white flex items-center ${canCreate ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                  {submitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  Create Agreement
                </button>

              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const ViewAgreementModal = () => {
    if (!viewingAgreement) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Agreement Number: {viewingAgreement.agreementNumber}</h3>
              <button onClick={() => { setShowViewAgreement(false); setViewingAgreement(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <p className="text-sm text-gray-900">{viewingAgreement.vendor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <p className="text-sm text-gray-900">{viewingAgreement.startDate ? new Date(viewingAgreement.startDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <p className="text-sm text-gray-900">{viewingAgreement.endDate ? new Date(viewingAgreement.endDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
                  <p className="text-sm text-gray-900">${viewingAgreement.totalValue?.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms</label>
                <p className="text-sm text-gray-900">{viewingAgreement.terms}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-sm text-gray-900">{viewingAgreement.notes}</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={() => { setShowViewAgreement(false); setViewingAgreement(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'active') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
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

  if (loading && !purchaseAgreements.length) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchase Agreements</h2>
          <p className="text-sm text-gray-600">Manage long-term purchase agreements with vendors</p>
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
              placeholder="Search agreements..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
          {/* [!code ++] Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            disabled={isLocationRestricted}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="all">All Locations</option>
            {locations.map((l: any) => (
              <option key={l._id} value={l._id}>{l.name}</option>
            ))}
          </select>
          <button
            disabled={!canCreate}
            onClick={() => canCreate && setShowCreateAgreement(true)}
            className={`px-4 py-2 rounded-lg flex items-center justify-center whitespace-nowrap ${canCreate ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-400 text-white cursor-not-allowed"
              }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Agreement
          </button>

        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agreement Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseAgreements?.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agreement?.agreementNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {agreement.location && <MapPin className="w-3 h-3" />}
                        {getLocationName(agreement?.location)}
                      </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agreement?.vendor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agreement?.startDate ? new Date(agreement.startDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agreement?.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"> ₹{(agreement.totalValue || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(agreement.status || 'active')}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(agreement.status || 'active')}`}>
                        {agreement.status || 'active'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => { setViewingAgreement(agreement); setShowViewAgreement(true); }} className="text-blue-600 hover:text-blue-900 mr-3"><Eye className="h-4 w-4" /></button>
                    <button
                      disabled={!canDelete}
                      onClick={() => canDelete && confirm('Are you sure?') && dispatch(deletePurchaseAgreement(agreement._id))
                        .unwrap()
                        .then(() => dispatch(fetchPurchaseAgreements({ page, limit, q: search })))}
                      className={`${canDelete ? "text-red-600 hover:text-red-900" : "text-gray-400 cursor-not-allowed"}`}
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
                Agreements
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

      {showCreateAgreement && <CreateAgreementForm />}
      {showViewAgreement && <ViewAgreementModal />}
    </div>
  );
};

export default PurchaseAgreementComponent;
