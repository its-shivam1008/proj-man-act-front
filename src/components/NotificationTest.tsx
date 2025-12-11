import { useState } from 'react';
import api from '@/utils/axiosApi';

export default function NotificationTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing notification API directly...');
      
      // Test 1: Get all notifications
      const response1 = await api.get('/notifications/list?status=unread');
      console.log('✅ All unread notifications:', response1.data);
      
      // Test 2: Get user notifications (hardcoded current user ID)
      const currentUserId = "69399b759bd6dbe5e7d4d446";
      const response2 = await api.get(`/notifications/list?receiverId=${currentUserId}&status=unread`);
      console.log('✅ User notifications:', response2.data);
      
      // Test 3: Get scheduling notifications
      const response3 = await api.get('/notifications/list?destination=scheduling&status=unread');
      console.log('✅ Scheduling notifications:', response3.data);
      
      setResult({
        all: response1.data,
        user: response2.data,
        scheduling: response3.data
      });
      
    } catch (error: any) {
      console.error('❌ API Test Error:', error);
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Notification API Test</h3>
      <div className="flex gap-2">
        <button 
          onClick={testAPI} 
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>
        
        <button 
          onClick={async () => {
            try {
              console.log('🔔 Triggering cron job manually...');
              const response = await api.post('/test/force-check-all-reminders');
              console.log('✅ Cron job result:', response.data);
              alert('Cron job triggered! Check console for results.');
            } catch (error) {
              console.error('❌ Cron job error:', error);
              alert('Cron job failed! Check console for errors.');
            }
          }}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Trigger Cron Job
        </button>
      </div>
      
      {result && (
        <div className="mt-4">
          <h4 className="font-semibold">Results:</h4>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}