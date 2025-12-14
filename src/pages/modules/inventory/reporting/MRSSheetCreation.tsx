import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchMRS } from '@/redux/slices/mrsSlice';
import { fetchProjects } from '@/redux/slices/projectSlice';
import { FileText, Download, Calendar, Package, Search } from 'lucide-react';

interface MRSSheetData {
  _id: string;
  materialName: string;
  quantity: number;
  creationDate: string;
  receivedDate: string;
  status: 'open' | 'sent' | 'ordered' | 'received' | 'cancelled';
  sourceTask: string;
  unit: string;
}

const MRSSheetCreationReport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { list: mrsList, loading } = useSelector((state: RootState) => state.mrs);
  const { projects } = useSelector((state: RootState) => state.projects);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMRS());
    dispatch(fetchProjects({ organisationId: localStorage.getItem('organisationId') }));
  }, [dispatch]);

  // Debug: Track selectedProject state changes
  useEffect(() => {
    console.log('🔍 selectedProject state changed to:', selectedProject);
  }, [selectedProject]);

  // Debug: Log projects data and set first project as default
  useEffect(() => {
    console.log('🔍 Projects available:', projects.length, projects);
    if (projects.length > 0 && !selectedProject) {
      const firstProject = (projects as any[])[0];
      setSelectedProject(firstProject._id);
      console.log('🔍 Auto-selected first project:', firstProject.name, firstProject._id);
    }
  }, [projects, selectedProject]);




  
  // Debug: Check selected project value
  console.log('🔍 Selected Project Value:', selectedProject, 'Type:', typeof selectedProject);
  console.log('🔍 Is All?', selectedProject === 'all');

  // Filter MRS data by projectId and transform to report format
  const mrsData: MRSSheetData[] = mrsList
    .filter((mrs: any) => {
      if (!selectedProject) return false; // Don't show anything if no project selected
      // Check if MRS projectId matches selected project _id
      const mrsProjectId = typeof mrs.projectId === 'object' ? mrs.projectId?._id : mrs.projectId;
      const matches = mrsProjectId === selectedProject;
      console.log('🔍 MRS:', mrs.item, 'ProjectId:', mrsProjectId, 'Selected:', selectedProject, 'Matches:', matches);
      return matches;
    })
    .map((mrs: any) => ({
      _id: mrs._id,
      materialName: mrs.item || 'Unknown Material',
      quantity: mrs.quantity || 0,
      creationDate: mrs.createdAt ? new Date(mrs.createdAt).toISOString().split('T')[0] : '',
      receivedDate: mrs.deliveryDetails?.receivedDate ? new Date(mrs.deliveryDetails.receivedDate).toISOString().split('T')[0] : '',
      status: mrs.status || 'open',
      sourceTask: mrs.task || 'Unknown Task',
      unit: 'units'
    }));

  console.log('🔍 MRS Data Length:', mrsData.length);




  const filteredData = mrsData.filter(item => {
    const matchesSearch = item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sourceTask.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const today = new Date();
      const itemDate = new Date(item.creationDate);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = itemDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = itemDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = itemDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'ordered':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Material Name', 'Quantity', 'Unit', 'Creation Date', 'Received Date', 'Status', 'Source Task'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.materialName,
        item.quantity,
        item.unit,
        item.creationDate,
        item.receivedDate || 'Not Received',
        item.status,
        item.sourceTask
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mrs-sheet-creation-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading MRS Sheet Creation Report...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            MRS Sheet Creation Report
          </h1>
          <p className="text-gray-600 mt-1">
            Track material requirement sheet creation and receipt status
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Filtered by: {(projects as any[]).find((p: any) => p._id === selectedProject)?.name || 'No Project Selected'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Current selection: {selectedProject} | Projects loaded: {projects.length}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials or tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between"
              style={{ minWidth: '200px' }}
            >
              <span>
                {(projects as any[]).find((p: any) => p._id === selectedProject)?.name || 'Select Project'}
              </span>
              <span className="ml-2">▼</span>
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                {(projects as any[]).map((project: any) => (
                  <div
                    key={project._id}
                    onClick={() => {
                      console.log('🔍 Custom dropdown: Project selected:', project.name, project._id);
                      setSelectedProject(project._id);
                      setDropdownOpen(false);
                    }}
                    className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${selectedProject === project._id ? 'bg-blue-50 text-blue-600' : ''}`}
                  >
                    {project.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="sent">Sent</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total MRS</p>
              <p className="text-2xl font-semibold text-gray-900">{mrsData.length}</p>
              <p className="text-xs text-gray-400">
                {selectedProject === 'all' ? 'All Projects' : `Filtered by Project`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Received</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mrsData.filter(item => item.status === 'received').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Open</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mrsData.filter(item => item.status === 'open').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mrsData.filter(item => item.status === 'sent').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MRS Material Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creation Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source Task
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.materialName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity} {item.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(item.creationDate).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.receivedDate ? 
                        new Date(item.receivedDate).toLocaleDateString('en-IN') : 
                        'Not Received'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.sourceTask}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No MRS data for selected project
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No MRS records found for the selected project. Check if MRS records have been created for this project or try selecting a different project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MRSSheetCreationReport;