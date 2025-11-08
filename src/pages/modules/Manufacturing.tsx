import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import Layout from '../../components/Layout';
import { 
  Factory, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Package,
  Settings,
  BarChart3,
  FileText,
  Wrench,
  ChevronDown,
  TrendingUp,
  Target,
  Zap,
  Activity
} from 'lucide-react';

const Manufacturing: React.FC = () => {
  const { manufacturingOrders } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [workCenterFilter, setWorkCenterFilter] = useState('all');
  const [dateRange, setDateRange] = useState('this-week');
  const [showCreateMOForm, setShowCreateMOForm] = useState(false);
  const [showCreateWOForm, setShowCreateWOForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showCreateBOMForm, setShowCreateBOMForm] = useState(false);

  // Sample data for comprehensive manufacturing management
  const [workOrders] = useState([
    {
      id: 'WO-001',
      moId: 'MO-001',
      operation: 'Cutting',
      workCenter: 'CNC Machine #1',
      status: 'in-progress',
      employee: 'John Smith',
      estimatedTime: 4.0,
      actualTime: 3.5,
      startTime: '2024-01-15 08:00',
      endTime: null,
      instructions: 'Cut steel plates according to specifications'
    },
    {
      id: 'WO-002',
      moId: 'MO-001',
      operation: 'Assembly',
      workCenter: 'Assembly Line A',
      status: 'ready',
      employee: 'Sarah Wilson',
      estimatedTime: 6.0,
      actualTime: 0,
      startTime: null,
      endTime: null,
      instructions: 'Assemble valve components'
    },
    {
      id: 'WO-003',
      moId: 'MO-002',
      operation: 'Quality Check',
      workCenter: 'QC Station',
      status: 'done',
      employee: 'Mike Johnson',
      estimatedTime: 2.0,
      actualTime: 1.8,
      startTime: '2024-01-14 14:00',
      endTime: '2024-01-14 15:48',
      instructions: 'Perform pressure test'
    }
  ]);

  const [billsOfMaterials] = useState([
    {
      id: 'BOM-001',
      product: 'Industrial Valve',
      version: 'v2.1',
      type: 'Standard BOM',
      status: 'active',
      components: [
        { product: 'Steel Plates', quantity: 2, unit: 'pcs' },
        { product: 'Gasket', quantity: 1, unit: 'pcs' },
        { product: 'Bolts', quantity: 8, unit: 'pcs' }
      ],
      totalCost: 285.50,
      validFrom: '2024-01-01',
      validTo: '2024-12-31'
    },
    {
      id: 'BOM-002',
      product: 'Pressure Gauge',
      version: 'v1.0',
      type: 'Kit BOM',
      status: 'active',
      components: [
        { product: 'Aluminum Rods', quantity: 1, unit: 'pcs' },
        { product: 'Display Unit', quantity: 1, unit: 'pcs' },
        { product: 'Calibration Kit', quantity: 1, unit: 'set' }
      ],
      totalCost: 125.00,
      validFrom: '2024-01-01',
      validTo: '2024-12-31'
    }
  ]);

  const [workCenters] = useState([
    {
      id: 'WC-001',
      name: 'CNC Machine #1',
      code: 'CNC01',
      capacity: 480, // minutes per day
      costPerHour: 85.00,
      efficiency: 92,
      currentLoad: 75,
      equipment: 'Haas VF-2',
      status: 'operational'
    },
    {
      id: 'WC-002',
      name: 'Assembly Line A',
      code: 'ASM01',
      capacity: 480,
      costPerHour: 45.00,
      efficiency: 88,
      currentLoad: 60,
      equipment: 'Manual Assembly',
      status: 'operational'
    },
    {
      id: 'WC-003',
      name: 'QC Station',
      code: 'QC01',
      capacity: 480,
      costPerHour: 65.00,
      efficiency: 95,
      currentLoad: 30,
      equipment: 'Testing Equipment',
      status: 'maintenance'
    }
  ]);

  // Sample BOM routing data
  const [routings] = useState([
    { id: 'RT-001', name: 'Standard Valve Production', operations: ['Cutting', 'Assembly', 'Quality Check'] },
    { id: 'RT-002', name: 'Gauge Manufacturing', operations: ['Machining', 'Calibration', 'Testing'] }
  ]);

  // Sample employees/operators
  const [employees] = useState([
    { id: 'EMP-001', name: 'John Smith', role: 'Machine Operator' },
    { id: 'EMP-002', name: 'Sarah Wilson', role: 'Assembly Technician' },
    { id: 'EMP-003', name: 'Mike Johnson', role: 'Quality Inspector' },
    { id: 'EMP-004', name: 'David Brown', role: 'Production Manager' }
  ]);

  // Create Manufacturing Order Form
  const CreateMOForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">Create New Manufacturing Order</h3>
            <button
              onClick={() => setShowCreateMOForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-6">
            {/* Product and Quantity */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product to Manufacture *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Product</option>
                  <option value="industrial-valve">Industrial Valve</option>
                  <option value="pressure-gauge">Pressure Gauge</option>
                  <option value="hydraulic-pump">Hydraulic Pump</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Produce *
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                />
              </div>
            </div>

            {/* BOM and Routing */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BOM (Bill of Materials)
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Auto-filled after product selection</option>
                  {billsOfMaterials.map(bom => (
                    <option key={bom.id} value={bom.id}>{bom.product} - {bom.version}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">BOM will be automatically selected based on product</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing (Operations Path) *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Routing</option>
                  {routings.map(routing => (
                    <option key={routing.id} value={routing.id}>{routing.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Work Center and Responsible Person */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Center *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Work Center</option>
                  {workCenters.map(wc => (
                    <option key={wc.id} value={wc.id}>{wc.name} ({wc.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsible Person *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Responsible Person</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planned Start Date *
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raw Material Location
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Location</option>
                  <option value="warehouse-a">Warehouse A</option>
                  <option value="warehouse-b">Warehouse B</option>
                  <option value="warehouse-c">Warehouse C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Finished Product Location
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Location</option>
                  <option value="finished-goods">Finished Goods</option>
                  <option value="warehouse-a">Warehouse A</option>
                  <option value="warehouse-b">Warehouse B</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowCreateMOForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Manufacturing Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Create Work Order Form
  const CreateWOForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">Create New Work Order</h3>
            <button
              onClick={() => setShowCreateWOForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-6">
            {/* Operation and Work Center */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operation Name *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Operation</option>
                  <option value="cutting">Cutting</option>
                  <option value="assembling">Assembling</option>
                  <option value="welding">Welding</option>
                  <option value="machining">Machining</option>
                  <option value="quality-check">Quality Check</option>
                  <option value="packaging">Packaging</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Center *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Work Center</option>
                  {workCenters.map(wc => (
                    <option key={wc.id} value={wc.id}>{wc.name} ({wc.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Employee and Times */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee / Operator *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (Minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter duration in minutes"
                />
              </div>
            </div>

            {/* Scheduled Times */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Start Time *
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled End Time *
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actual Duration and Overlap */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Auto-recorded during execution"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Will be automatically recorded during execution</p>
              </div>
              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="overlapAllowed"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="overlapAllowed" className="ml-2 text-sm text-gray-700">
                  Overlap Allowed with other operations
                </label>
              </div>
            </div>

            {/* Dependencies and Status */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dependencies
                </label>
                <select multiple className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24">
                  <option value="cutting">Cutting Operation</option>
                  <option value="welding">Welding Operation</option>
                  <option value="machining">Machining Operation</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple dependencies</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="not-started">Not Started</option>
                  <option value="running">Running</option>
                  <option value="paused">Paused</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowCreateWOForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Work Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Schedule Order Form
  const ScheduleOrderForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">Schedule Production Order</h3>
            <button
              onClick={() => setShowScheduleForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-6">
            {/* MO ID and Product */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturing Order ID
                </label>
                <input
                  type="text"
                  value="MO-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated unique identifier</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product to Manufacture *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Product</option>
                  <option value="industrial-valve">Industrial Valve</option>
                  <option value="pressure-gauge">Pressure Gauge</option>
                  <option value="hydraulic-pump">Hydraulic Pump</option>
                </select>
              </div>
            </div>

            {/* Quantity and BOM */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Produce *
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill of Materials (BOM)
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Auto-populated from product</option>
                  {billsOfMaterials.map(bom => (
                    <option key={bom.id} value={bom.id}>{bom.product} - {bom.version}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Routing and Work Center */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Routing Path</option>
                  {routings.map(routing => (
                    <option key={routing.id} value={routing.id}>{routing.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Center *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Work Center</option>
                  {workCenters.map(wc => (
                    <option key={wc.id} value={wc.id}>{wc.name} ({wc.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Operations List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation(s)
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Operations from selected routing:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm">1. Cutting</span>
                    <span className="text-xs text-gray-500">Est. 4 hours</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm">2. Assembly</span>
                    <span className="text-xs text-gray-500">Est. 6 hours</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm">3. Quality Check</span>
                    <span className="text-xs text-gray-500">Est. 2 hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Location and Dates */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Production Location
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Location</option>
                  <option value="production-floor-a">Production Floor A</option>
                  <option value="production-floor-b">Production Floor B</option>
                  <option value="assembly-line-1">Assembly Line 1</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Production Lead Time
                </label>
                <input
                  type="text"
                  value="12 hours (calculated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Based on routing and quantity</p>
              </div>
            </div>

            {/* Schedule Dates */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Start Date *
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled End Date *
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Priority and Responsible */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsible (Production Planner) *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Planner</option>
                  {employees.filter(emp => emp.role.includes('Manager') || emp.role.includes('Planner')).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="planned">Planned</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schedule Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Create BOM Form
  const CreateBOMForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">Create New Bill of Materials</h3>
            <button
              onClick={() => setShowCreateBOMForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-6">
            {/* Product and BOM Type */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Product</option>
                  <option value="industrial-valve">Industrial Valve</option>
                  <option value="pressure-gauge">Pressure Gauge</option>
                  <option value="hydraulic-pump">Hydraulic Pump</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BOM Type *
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="standard">Standard BOM</option>
                  <option value="phantom">Phantom BOM</option>
                  <option value="kit">Kit BOM</option>
                </select>
              </div>
            </div>

            {/* Components Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Components *
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase">
                    <div className="col-span-5">Component</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit of Measure</div>
                    <div className="col-span-2">Unit Cost</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                        <option>Steel Plates</option>
                        <option>Aluminum Rods</option>
                        <option>Gaskets</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Qty" />
                    </div>
                    <div className="col-span-2">
                      <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                        <option>pcs</option>
                        <option>kg</option>
                        <option>m</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" step="0.01" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Cost" />
                    </div>
                    <div className="col-span-1">
                      <button type="button" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                        <option>Select Component</option>
                        <option>Steel Plates</option>
                        <option>Aluminum Rods</option>
                        <option>Gaskets</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Qty" />
                    </div>
                    <div className="col-span-2">
                      <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                        <option>pcs</option>
                        <option>kg</option>
                        <option>m</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" step="0.01" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Cost" />
                    </div>
                    <div className="col-span-1">
                      <button type="button" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  className="mt-3 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Component
                </button>
              </div>
            </div>

            {/* Byproducts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Byproducts (if applicable)
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Byproduct</option>
                  <option value="scrap-metal">Scrap Metal</option>
                  <option value="waste-material">Waste Material</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Quantity"
                />
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>kg</option>
                  <option>pcs</option>
                  <option>m</option>
                </select>
              </div>
            </div>

            {/* Routing and Reference */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select Routing</option>
                  {routings.map(routing => (
                    <option key={routing.id} value={routing.id}>{routing.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Code
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reference code"
                />
              </div>
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid From Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid To Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (drawings/specs)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Drag and drop files here, or{' '}
                    <button type="button" className="text-blue-600 hover:text-blue-800">
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported formats: PDF, DWG, JPG, PNG (Max 10MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowCreateBOMForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create BOM
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'manufacturing-orders', name: 'Manufacturing Orders', icon: Factory },
    { id: 'work-orders', name: 'Work Orders', icon: Wrench },
    { id: 'planning', name: 'Planning', icon: Calendar },
    { id: 'bom', name: 'Bills of Materials', icon: FileText },
    { id: 'reporting', name: 'Reporting', icon: TrendingUp },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'blocked':
        return 'bg-orange-100 text-orange-800';
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
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ready':
        return <Target className="h-5 w-5 text-purple-500" />;
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Factory className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Active MOs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {manufacturingOrders.filter(mo => mo.status === 'in-progress').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wrench className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Work Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{workOrders.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Efficiency</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(workCenters.reduce((sum, wc) => sum + wc.efficiency, 0) / workCenters.length)}%
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Late Orders</p>
                <p className="text-2xl font-semibold text-gray-900">2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Dashboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Work Center Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Work Center Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {workCenters.map((wc) => (
                <div key={wc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      wc.status === 'operational' ? 'bg-green-500' : 
                      wc.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{wc.name}</h4>
                      <p className="text-xs text-gray-500">Load: {wc.currentLoad}% • Efficiency: {wc.efficiency}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${wc.costPerHour}/hr</p>
                    <p className="text-xs text-gray-500">{wc.equipment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Production Schedule */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {workOrders.slice(0, 4).map((wo) => (
                <div key={wo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getStatusIcon(wo.status)}
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">{wo.operation}</h4>
                      <p className="text-xs text-gray-500">{wo.workCenter} • {wo.employee}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(wo.status)}`}>
                      {wo.status.replace('-', ' ')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{wo.estimatedTime}h est.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Production Kanban</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {['Ready', 'In Progress', 'Quality Check', 'Done'].map((stage) => (
              <div key={stage} className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">{stage}</h4>
                <div className="space-y-3">
                  {workOrders
                    .filter(wo => {
                      if (stage === 'Ready') return wo.status === 'ready';
                      if (stage === 'In Progress') return wo.status === 'in-progress';
                      if (stage === 'Quality Check') return wo.operation.includes('Quality');
                      if (stage === 'Done') return wo.status === 'done';
                      return false;
                    })
                    .map((wo) => (
                      <div key={wo.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                        <h5 className="text-xs font-medium text-gray-900">{wo.operation}</h5>
                        <p className="text-xs text-gray-500">{wo.workCenter}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{wo.employee}</span>
                          <span className="text-xs font-medium text-blue-600">{wo.estimatedTime}h</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderManufacturingOrders = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manufacturing Orders</h2>
          <p className="text-sm text-gray-600">Create and manage production orders</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Manufacturing Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={workCenterFilter}
            onChange={(e) => setWorkCenterFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Work Centers</option>
            {workCenters.map(wc => (
              <option key={wc.id} value={wc.id}>{wc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Manufacturing Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {manufacturingOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{order.productName}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.quantity} units
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="text-sm font-medium">Start: {order.startDate}</div>
                    <div className="text-sm text-gray-500">End: {order.endDate}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${order.status === 'done' ? 100 : order.status === 'in-progress' ? 60 : 20}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {order.status === 'done' ? 100 : order.status === 'in-progress' ? 60 : 20}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                  <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                  <button className="text-purple-600 hover:text-purple-900">Start</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWorkOrders = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Work Orders</h2>
          <p className="text-sm text-gray-600">Manage operations and track time</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Work Order
        </button>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Work Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Work Center
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Tracking
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workOrders.map((wo) => (
              <tr key={wo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{wo.id}</div>
                    <div className="text-sm text-gray-500">MO: {wo.moId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {wo.operation}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {wo.workCenter}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{wo.employee}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(wo.status)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(wo.status)}`}>
                      {wo.status.replace('-', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="text-sm font-medium">
                      {wo.actualTime}h / {wo.estimatedTime}h
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          wo.actualTime > wo.estimatedTime ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((wo.actualTime / wo.estimatedTime) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {wo.status === 'ready' && (
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors mr-2">
                      Start
                    </button>
                  )}
                  {wo.status === 'in-progress' && (
                    <button className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors mr-2">
                      Pause
                    </button>
                  )}
                  <button className="text-blue-600 hover:text-blue-900 mr-2">View</button>
                  <button className="text-purple-600 hover:text-purple-900">Instructions</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPlanning = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Production Planning</h2>
          <p className="text-sm text-gray-600">Schedule and optimize manufacturing activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="this-week">This Week</option>
            <option value="next-week">Next Week</option>
            <option value="this-month">This Month</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Order
          </button>
        </div>
      </div>

      {/* Gantt Chart Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Gantt Chart View</h3>
        </div>
        <div className="p-6">
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Gantt Chart</h3>
              <p className="text-sm text-gray-500 mb-4">
                Drag-and-drop scheduling with dependency management
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Visual timeline of manufacturing orders</p>
                <p>• Work center capacity planning</p>
                <p>• Dependency tracking between operations</p>
                <p>• Real-time schedule optimization</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Center Capacity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Work Center Capacity</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {workCenters.map((wc) => (
              <div key={wc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">{wc.name}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    wc.status === 'operational' ? 'bg-green-100 text-green-800' : 
                    wc.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {wc.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current Load</span>
                    <span className="font-medium">{wc.currentLoad}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        wc.currentLoad > 90 ? 'bg-red-500' : 
                        wc.currentLoad > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${wc.currentLoad}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Efficiency: {wc.efficiency}%</span>
                    <span>${wc.costPerHour}/hr</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBOM = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bills of Materials</h2>
          <p className="text-sm text-gray-600">Define product structures and components</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create BOM
        </button>
      </div>

      {/* BOM List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                BOM ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Components
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {billsOfMaterials.map((bom) => (
              <tr key={bom.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {bom.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{bom.product}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bom.version}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {bom.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="max-w-xs">
                    {bom.components.slice(0, 2).map((comp, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        {comp.product} ({comp.quantity} {comp.unit})
                      </div>
                    ))}
                    {bom.components.length > 2 && (
                      <div className="text-xs text-gray-500">+{bom.components.length - 2} more</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${bom.totalCost.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {bom.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                  <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                  <button className="text-purple-600 hover:text-purple-900">Copy</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReporting = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manufacturing Reports</h2>
          <p className="text-sm text-gray-600">Performance analytics and insights</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Generate Report
        </button>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Factory className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">MO Performance</h3>
              <p className="text-sm text-gray-500">Lead time & delay analysis</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wrench className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Work Order Efficiency</h3>
              <p className="text-sm text-gray-500">Planned vs actual time</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">OEE Analysis</h3>
              <p className="text-sm text-gray-500">Overall equipment effectiveness</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Scrap Analysis</h3>
              <p className="text-sm text-gray-500">Waste and quality metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Report */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Manufacturing Performance Dashboard</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Production Efficiency Chart</p>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Lead Time Trends</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manufacturing Settings</h2>
          <p className="text-sm text-gray-600">Configure manufacturing parameters and preferences</p>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Enable Work Orders</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Planning by Work Centers</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Byproducts in BOM</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Subcontracting Operations</span>
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Work Centers</h3>
          <div className="space-y-3">
            {workCenters.slice(0, 3).map((wc) => (
              <div key={wc.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{wc.name}</h4>
                  <p className="text-xs text-gray-500">{wc.code} • ${wc.costPerHour}/hr</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
            ))}
            <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800">
              + Add Work Center
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Control</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">QC on Work Order Start</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">QC on Work Order End</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">QC on Transfer</span>
            </label>
          </div>
        </div>
      </div>

      {/* Integration Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Module Integrations</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Inventory Integration</h4>
              <p className="text-sm text-gray-500">Raw material consumption</p>
            </div>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Quality Integration</h4>
              <p className="text-sm text-gray-500">In-process checks</p>
            </div>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Maintenance Integration</h4>
              <p className="text-sm text-gray-500">Equipment scheduling</p>
            </div>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'manufacturing-orders':
        return renderManufacturingOrders();
      case 'work-orders':
        return renderWorkOrders();
      case 'planning':
        return renderPlanning();
      case 'bom':
        return renderBOM();
      case 'reporting':
        return renderReporting();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manufacturing Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              End-to-end manufacturing process management with real-time tracking
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 transition-colors ${
                    activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Form Modals */}
        {showCreateMOForm && <CreateMOForm />}
        {showCreateWOForm && <CreateWOForm />}
        {showScheduleForm && <ScheduleOrderForm />}
        {showCreateBOMForm && <CreateBOMForm />}
      </div>
    </Layout>
  );
};

export default Manufacturing;