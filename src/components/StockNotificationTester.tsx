import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import api from '@/utils/axiosApi';

const StockNotificationTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerStockCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/inventory/stock/monitor/trigger');
      setResult(response.data);
      console.log('Stock check result:', response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger stock check');
      console.error('Stock check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAllStock = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/inventory/stock/check/all');
      setResult(response.data);
      console.log('All stock check result:', response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check stock');
      console.error('All stock check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cleanupNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/inventory/stock/notifications/cleanup');
      console.log('Cleanup result:', response.data);
      alert(`Cleaned up ${response.data.cleanedCount} resolved notifications`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cleanup notifications');
      console.error('Cleanup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Stock Notification Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={triggerStockCheck} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Trigger Stock Monitoring
          </Button>
          
          <Button 
            onClick={checkAllStock} 
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
            Check All Stock
          </Button>
          
          <Button 
            onClick={cleanupNotifications} 
            disabled={loading}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Cleanup Notifications
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Result:</h3>
            <pre className="text-xs text-green-700 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Trigger Stock Monitoring:</strong> Runs the complete stock monitoring process (same as cron job)</li>
            <li><strong>Check All Stock:</strong> Checks both raw materials and products for low stock</li>
            <li><strong>Cleanup Notifications:</strong> Removes notifications for items that are no longer low stock</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Note: This is a testing component. In production, stock monitoring runs automatically every hour during business hours.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockNotificationTester;