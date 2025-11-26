import { usePermission } from "@/hooks/userPermission";

import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldAlert } from 'lucide-react';

const PurchaseSettings: React.FC = () => {

  const canView = usePermission("purchaseSettings", "view");
  const canEdit = usePermission("purchaseSettings", "edit");

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
  const [settings, setSettings] = useState({
    defaultWarehouse: 'Warehouse A',
    defaultCurrency: 'USD',
    multiCurrency: true,
    enableApprovalWorkflow: false,
    approvalThreshold: 10000,
    autoReplenishment: true,
    emailNotifications: true,
    smsNotifications: false,
    contractRenewalAlerts: true,
    localPurchase: true,
    importPurchase: true,
    dropShipping: false,
    defaultPurchaseTax: 10.00,
    taxInclusivePricing: true,
    evaluationCriteria: 'Quality & Delivery',
    autoVendorScoring: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Purchase Settings</h2>
        <p className="text-sm text-gray-600">Configure purchase module settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Warehouse</label>
              <select
               disabled={!canEdit}
                value={settings.defaultWarehouse}
                onChange={(e) => handleSettingChange('defaultWarehouse', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Warehouse A</option>
                <option>Warehouse B</option>
                <option>Warehouse C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleSettingChange('defaultCurrency', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>USD</option>
                <option>EUR</option>
                <option>INR</option>
              </select>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.multiCurrency}
                onChange={(e) => handleSettingChange('multiCurrency', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Multi-Currency Support</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Workflow</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enableApprovalWorkflow}
                onChange={(e) => handleSettingChange('enableApprovalWorkflow', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable Approval Workflow</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Threshold</label>
              <input
                type="number"
                value={settings.approvalThreshold}
                onChange={(e) => handleSettingChange('approvalThreshold', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10000"
              />
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoReplenishment}
                onChange={(e) => handleSettingChange('autoReplenishment', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-Replenishment</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">SMS Notifications</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.contractRenewalAlerts}
                onChange={(e) => handleSettingChange('contractRenewalAlerts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Contract Renewal Alerts</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Types</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.localPurchase}
                onChange={(e) => handleSettingChange('localPurchase', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Local Purchase</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.importPurchase}
                onChange={(e) => handleSettingChange('importPurchase', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Import Purchase</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.dropShipping}
                onChange={(e) => handleSettingChange('dropShipping', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Drop Shipping</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Configuration</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Purchase Tax</label>
              <input
                type="number"
                step="0.01"
                value={settings.defaultPurchaseTax}
                onChange={(e) => handleSettingChange('defaultPurchaseTax', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10.00"
              />
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.taxInclusivePricing}
                onChange={(e) => handleSettingChange('taxInclusivePricing', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Tax Inclusive Pricing</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Evaluation</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Criteria</label>
              <select
                value={settings.evaluationCriteria}
                onChange={(e) => handleSettingChange('evaluationCriteria', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Quality & Delivery</option>
                <option>Price & Payment Terms</option>
                <option>Service & Support</option>
              </select>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoVendorScoring}
                onChange={(e) => handleSettingChange('autoVendorScoring', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto Vendor Scoring</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Purchase Order Template</h4>
            <p className="text-sm text-gray-600 mb-3">Template for sending purchase orders to vendors</p>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
              Edit Template
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">RFQ Template</h4>
            <p className="text-sm text-gray-600 mb-3">Template for sending RFQs to vendors</p>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
              Edit Template
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Reset to Defaults
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default PurchaseSettings;