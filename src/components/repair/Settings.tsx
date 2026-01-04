import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Settings Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Repair Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">In-Warranty</span>
              <span className="text-xs text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Out-of-Warranty (Paid)</span>
              <span className="text-xs text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Internal</span>
              <span className="text-xs text-green-600">Active</span>
            </div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            + Add Repair Type
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Labor Rates</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Standard Rate</span>
              <span className="text-sm font-medium">$75/hour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Specialist Rate</span>
              <span className="text-sm font-medium">$95/hour</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Emergency Rate</span>
              <span className="text-sm font-medium">$120/hour</span>
            </div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            Edit Rates
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Default Locations</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">Repair Center A</div>
            <div className="text-sm text-gray-700">Repair Center B</div>
            <div className="text-sm text-gray-700">Customer Site</div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            Manage Locations
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Email customer on status change</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Internal team alerts</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Auto Actions</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Auto scrap unusable parts</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Auto generate invoices</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Reserve parts automatically</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Fields</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">Customer PO Number</div>
            <div className="text-sm text-gray-700">Warranty Expiry Date</div>
            <div className="text-sm text-gray-700">Return Shipping Method</div>
          </div>
          <button className="mt-4 text-blue-600 text-sm hover:text-blue-800">
            Add Custom Field
          </button>
        </div>
      </div>

      {/* Additional Settings Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Configuration</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Default Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Default Priority</span>
                  <select className="text-sm border border-gray-300 rounded px-2 py-1">
                    <option>Medium</option>
                    <option>Low</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Auto-assign Teams</span>
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Require Approval</span>
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Integration Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Inventory Integration</span>
                  <span className="text-xs text-green-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Accounting System</span>
                  <span className="text-xs text-yellow-600">Pending</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Customer Portal</span>
                  <span className="text-xs text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;