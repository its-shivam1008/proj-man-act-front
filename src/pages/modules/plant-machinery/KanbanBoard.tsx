// @/pages/plant-machinery/Kanban.tsx
import React from 'react';
import { useData } from '@/contexts/DataContext';

// NOTE: Assumes a Layout component exists, as in the original file
// import Layout from '../../components/Layout';

const KanbanBoard: React.FC = () => {
  const { maintenanceRecords } = useData();

  // Helper functions duplicated from Maintenance.tsx
  // Ideally, these would live in a shared utils file.
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preventive':
        return 'bg-green-100 text-green-800';
      case 'corrective':
        return 'bg-yellow-100 text-yellow-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderKanban = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Maintenance Kanban Board</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {['scheduled', 'in-progress', 'completed', 'cancelled'].map((status) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wider">
                {status.replace('-', ' ')} ({maintenanceRecords.filter(r => r.status === status).length})
              </h4>
              <div className="space-y-3">
                {maintenanceRecords
                  .filter(record => record.status === status)
                  .map((record) => (
                    <div key={record.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {record.requestTitle}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {record.equipment}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(record.priority)}`}>
                          {record.priority}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(record.type)}`}>
                          {record.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Due: {record.deadlineDate}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  return (
    // <Layout>
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Maintenance Kanban</h1>
      <p className="mt-1 text-sm text-gray-600">
        Track maintenance requests by status.
      </p>
      
      {renderKanban()}
    </div>
    // </Layout>
  );
};

export default KanbanBoard;