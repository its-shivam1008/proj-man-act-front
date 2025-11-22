import React, { useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { Plus, Eye, Trash2, CheckCircle, X } from 'lucide-react';

interface PurchaseAgreement {
  id: string | number;
  agreementNumber: string;
  vendor: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  status: string;
  terms: string;
  notes: string;
}

interface Vendor {
  id: string;
  vendorName: string;
}

const PurchaseAgreement: React.FC = () => {
  const [purchaseAgreements, setPurchaseAgreements] = useState<PurchaseAgreement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showCreateAgreement, setShowCreateAgreement] = useState(false);
  const [showViewAgreement, setShowViewAgreement] = useState(false);
  const [viewingAgreement, setViewingAgreement] = useState<PurchaseAgreement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedAgreements = storage.get<PurchaseAgreement[]>(STORAGE_KEYS.PURCHASE_AGREEMENTS, []);
    setPurchaseAgreements(Array.isArray(loadedAgreements) ? loadedAgreements : []);
    const loadedVendors = storage.get<Vendor[]>(STORAGE_KEYS.VENDORS, []);
    setVendors(Array.isArray(loadedVendors) ? loadedVendors : []);
  };

  const CreateAgreementForm = () => {
    const [formData, setFormData] = useState({
      agreementNumber: '',
      vendor: '',
      startDate: '',
      endDate: '',
      terms: '',
      totalValue: 0,
      notes: ''
    });

    const handleSubmit = () => {
      const newAgreement: PurchaseAgreement = {
        ...formData,
        id: Date.now().toString(),
        status: 'active'
      };
      storage.push(STORAGE_KEYS.PURCHASE_AGREEMENTS, newAgreement);
      loadData();
      setShowCreateAgreement(false);
    };

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
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Number</label>
                  <input type="text" value={formData.agreementNumber} onChange={(e) => setFormData({ ...formData, agreementNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Auto-generated" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <select value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Select Vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.vendorName}>{vendor.vendorName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
                <button onClick={() => setShowCreateAgreement(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Agreement</button>
              </div>
            </div>
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
              <h3 className="text-lg font-medium text-gray-900">View Agreement: {viewingAgreement.agreementNumber}</h3>
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
                  <p className="text-sm text-gray-900">{viewingAgreement.startDate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <p className="text-sm text-gray-900">{viewingAgreement.endDate}</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchase Agreements</h2>
          <p className="text-sm text-gray-600">Manage long-term purchase agreements with vendors</p>
        </div>
        <button
          onClick={() => setShowCreateAgreement(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Agreement
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agreement Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchaseAgreements.map((agreement) => (
              <tr key={agreement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agreement?.agreementNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agreement?.vendor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agreement?.startDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agreement?.endDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${(agreement.totalValue || 0).toLocaleString()}</td>
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
                  <button className="text-red-600 hover:text-red-900" onClick={() => {
                    if (confirm('Are you sure?')) {
                      storage.deleteById(STORAGE_KEYS.PURCHASE_AGREEMENTS, agreement.id.toString());
                      loadData();
                    }
                  }}><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateAgreement && <CreateAgreementForm />}
      {showViewAgreement && <ViewAgreementModal />}
    </div>
  );
};

export default PurchaseAgreement;