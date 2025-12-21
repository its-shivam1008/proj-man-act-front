import React from 'react';
import Layout from '../components/Layout';
import StockNotificationTester from '../components/StockNotificationTester';
import NotificationCenter from '../components/NotificationCenter';

const StockNotificationTest: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Notification Testing</h1>
            <p className="text-gray-600">Test and monitor low stock notifications for raw materials and products</p>
          </div>
          
          {/* Notification Center Integration */}
          <div className="flex items-center">
            <NotificationCenter destination="inventory.raw-materials" title="Stock Alerts" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Notification Tester */}
          <div>
            <StockNotificationTester />
          </div>

          {/* Information Panel */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">How Stock Notifications Work</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900">Raw Materials</h3>
                <p>Notifications are created when the total stock across all warehouses is less than or equal to the reorder level.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Products</h3>
                <p>Notifications are created when the total stock across all warehouses is less than or equal to the minimum stock level.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Automatic Monitoring</h3>
                <p>The system automatically checks stock levels every hour during business hours (9 AM to 6 PM, Monday to Friday).</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Notification Cleanup</h3>
                <p>Resolved notifications (items that are no longer low stock) are automatically cleaned up daily at 8 AM.</p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <h3 className="font-medium text-yellow-800">Important Notes</h3>
                <ul className="list-disc list-inside text-yellow-700 text-xs space-y-1 mt-1">
                  <li>Only items with reorder level (raw materials) or min stock (products) set will be monitored</li>
                  <li>Only items with trackInventory enabled will be checked</li>
                  <li>Duplicate notifications for the same item are prevented</li>
                  <li>Notifications appear on all pages through the notification center</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Current Stock Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Stock Monitoring Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900">Monitoring Active</h3>
              <p className="text-blue-700 text-sm">Automatic stock checks run every hour during business hours</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900">Notifications Enabled</h3>
              <p className="text-green-700 text-sm">Low stock alerts will appear in the notification center</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-900">Auto Cleanup</h3>
              <p className="text-purple-700 text-sm">Resolved notifications are cleaned up automatically</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StockNotificationTest;