import React, { useState } from 'react';
import Layout from '../../../components/Layout';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Edit,
  Save,
  X,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  FileText,
  Store,
  Warehouse,
  Package,
  TrendingUp
} from 'lucide-react';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  visible: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  order: number;
}

const FormBuilder: React.FC = () => {
  const [selectedForm, setSelectedForm] = useState('add-product');
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Configurations matching the exact fields in your provided page files
  const [formFields, setFormFields] = useState<Record<string, FormField[]>>({
    'add-product': [
      { id: 'p1', name: 'name', label: 'Product Name', type: 'text', required: true, visible: true, placeholder: 'e.g. Stainless Steel Rod', order: 1 },
      { id: 'p2', name: 'type', label: 'Product Type', type: 'select', required: true, visible: true, options: ['goods', 'services', 'combo'], order: 2 },
      { id: 'p3', name: 'category', label: 'Category', type: 'text', required: true, visible: true, placeholder: 'e.g. Raw Materials', order: 3 },
      { id: 'p4', name: 'referenceCode', label: 'SKU / Reference', type: 'text', required: false, visible: true, placeholder: 'e.g. SKU-1001', order: 4 },
      { id: 'p5', name: 'description', label: 'Description', type: 'textarea', required: false, visible: true, placeholder: 'Detailed product description...', order: 5 },
      { id: 'p6', name: 'trackInventory', label: 'Track Inventory', type: 'checkbox', required: false, visible: true, placeholder: 'Enable tracking', order: 6 },
      { id: 'p7', name: 'inventoryAvailable', label: 'Available Stock', type: 'number', required: false, visible: true, placeholder: '0', order: 7 },
      { id: 'p8', name: 'minimumStockLevel', label: 'Min Stock Level', type: 'number', required: false, visible: true, placeholder: '0', order: 8 },
      { id: 'p9', name: 'location', label: 'Location', type: 'text', required: false, visible: true, placeholder: 'e.g. Rack A-12', order: 9 },
      { id: 'p10', name: 'barcode', label: 'Barcode', type: 'text', required: false, visible: true, placeholder: 'Scan barcode', order: 10 },
      { id: 'p11', name: 'costPrice', label: 'Cost Price', type: 'number', required: true, visible: true, placeholder: '0.00', order: 11 },
      { id: 'p12', name: 'salesPrice', label: 'Sales Price', type: 'number', required: false, visible: true, placeholder: '0.00', order: 12 },
      { id: 'p13', name: 'salesTax', label: 'Sales Tax (%)', type: 'number', required: false, visible: true, placeholder: '0', order: 13 },
      { id: 'p14', name: 'purchaseTax', label: 'Purchase Tax (%)', type: 'number', required: false, visible: true, placeholder: '0', order: 14 },
      { id: 'p15', name: 'upsellSuggestion', label: 'Upsell Suggestion', type: 'text', required: false, visible: true, placeholder: 'e.g. Buy with Lubricant', order: 15 },
      { id: 'p16', name: 'warehouseId', label: 'Default Warehouse', type: 'select', required: false, visible: true, options: ['Warehouse A', 'Warehouse B'], order: 16 },
      { id: 'p17', name: 'storeId', label: 'Default Store', type: 'select', required: false, visible: true, options: ['Store A', 'Store B'], order: 17 },
    ],
    'receipt': [
      { id: 'r1', name: 'receiveFrom', label: 'Receive From', type: 'text', required: true, visible: true, placeholder: 'Partner/Customer/Supplier', order: 1 },
      { id: 'r2', name: 'operationType', label: 'Operation Type', type: 'select', required: true, visible: true, options: ['Purchase', 'Transfer', 'Return', 'Manufacturing'], order: 2 },
      { id: 'r3', name: 'productId', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 3 },
      { id: 'r4', name: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true, placeholder: 'Enter quantity', order: 4 },
      { id: 'r5', name: 'warehouse', label: 'Warehouse/Location', type: 'select', required: true, visible: true, options: ['Warehouse A', 'Warehouse B', 'Warehouse C'], order: 5 },
      { id: 'r6', name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: false, visible: true, order: 6 },
      { id: 'r7', name: 'barcode', label: 'Barcode Scan', type: 'text', required: false, visible: true, placeholder: 'Scan or enter barcode', order: 7 },
    ],
    'delivery': [
      { id: 'd1', name: 'deliverTo', label: 'Deliver To', type: 'text', required: true, visible: true, placeholder: 'Customer/Partner', order: 1 },
      { id: 'd2', name: 'operationType', label: 'Operation Type', type: 'select', required: true, visible: true, options: ['Sale', 'Transfer', 'Return', 'Sample'], order: 2 },
      { id: 'd3', name: 'productId', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 3 },
      { id: 'd4', name: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true, placeholder: 'Enter quantity', order: 4 },
      { id: 'd5', name: 'shippingMethod', label: 'Shipping Method', type: 'select', required: true, visible: true, options: ['Standard', 'Express', 'Overnight', 'Ground'], order: 5 },
      { id: 'd6', name: 'priority', label: 'Priority', type: 'select', required: true, visible: true, options: ['low', 'medium', 'high'], order: 6 },
      { id: 'd7', name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: false, visible: true, order: 7 },
    ],
    'scrap-order': [
      { id: 'sc1', name: 'productId', label: 'Product Name', type: 'select', required: true, visible: true, options: [], order: 1 },
      { id: 'sc2', name: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true, placeholder: 'Enter quantity to scrap', order: 2 },
      { id: 'sc3', name: 'reason', label: 'Scrap Reason', type: 'select', required: true, visible: true, options: ['damaged', 'expired', 'lost', 'obsolete'], order: 3 },
      { id: 'sc4', name: 'scrapLocation', label: 'Scrap Location', type: 'select', required: true, visible: true, options: ['Scrap Yard A', 'Scrap Yard B', 'Disposal Center', 'Recycling Center'], order: 4 },
      { id: 'sc5', name: 'remark', label: 'Remark', type: 'textarea', required: false, visible: true, placeholder: 'Enter detailed reason...', order: 5 },
    ],
    'forecasting': [
      { id: 'f1', name: 'productId', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 1 },
      { id: 'f2', name: 'currentStock', label: 'Current Stock', type: 'number', required: true, visible: true, placeholder: '0', order: 2 },
      { id: 'f3', name: 'demandForecast', label: 'Demand Forecast', type: 'number', required: true, visible: true, placeholder: '0', order: 3 },
      { id: 'f4', name: 'suggestedReplenishment', label: 'Suggested Replenishment', type: 'number', required: true, visible: true, placeholder: '0', order: 4 },
      { id: 'f5', name: 'leadTime', label: 'Lead Time (days)', type: 'number', required: true, visible: true, placeholder: '0', order: 5 },
      { id: 'f6', name: 'priority', label: 'Priority', type: 'select', required: true, visible: true, options: ['low', 'medium', 'high', 'critical'], order: 6 },
      { id: 'f7', name: 'replenishmentRule', label: 'Replenishment Rule', type: 'select', required: true, visible: true, options: ['automatic', 'manual'], order: 7 },
    ],
    'warehouse': [
      { id: 'w1', name: 'name', label: 'Name', type: 'text', required: true, visible: true, placeholder: 'e.g. Main Warehouse', order: 1 },
      { id: 'w2', name: 'type', label: 'Type', type: 'select', required: true, visible: true, options: ['General', 'Cold Storage', 'Bonded', 'Quarantine'], order: 2 },
      { id: 'w3', name: 'location', label: 'Location', type: 'text', required: true, visible: true, placeholder: 'Address/Plant', order: 3 },
      { id: 'w4', name: 'capacity', label: 'Capacity (sq units)', type: 'number', required: false, visible: true, placeholder: 'Enter capacity in square units', order: 4 },
      { id: 'w5', name: 'raw', label: 'Raw Materials Stock', type: 'number', required: false, visible: true, placeholder: '0', order: 5 },
      { id: 'w6', name: 'finished', label: 'Finished Goods Stock', type: 'number', required: false, visible: true, placeholder: '0', order: 6 },
      { id: 'w7', name: 'consumables', label: 'Consumables Stock', type: 'number', required: false, visible: true, placeholder: '0', order: 7 },
      { id: 'w8', name: 'inTransit', label: 'In Transit', type: 'number', required: false, visible: true, placeholder: '0', order: 8 },
      { id: 'w9', name: 'reorderAlerts', label: 'Reorder Alerts', type: 'text', required: false, visible: true, placeholder: 'Comma separated items', order: 9 },
      { id: 'w10', name: 'bins', label: 'Bins/Racks', type: 'text', required: false, visible: true, placeholder: 'Comma separated locations', order: 10 },
    ],
    'store': [
      { id: 's1', name: 'name', label: 'Store Name', type: 'text', required: true, visible: true, placeholder: 'Store Name', order: 1 },
      { id: 's2', name: 'location', label: 'Location', type: 'text', required: true, visible: true, placeholder: 'Address', order: 2 },
      { id: 's3', name: 'dailySales', label: 'Daily Sales (₹)', type: 'number', required: false, visible: true, placeholder: '0', order: 3 },
      { id: 's4', name: 'stock', label: 'Current Stock (items)', type: 'number', required: false, visible: true, placeholder: '0', order: 4 },
      { id: 's5', name: 'fastMoving', label: 'Fast Moving Items', type: 'textarea', required: false, visible: true, placeholder: 'Comma separated', order: 5 },
      { id: 's6', name: 'slowMoving', label: 'Slow Moving Items', type: 'textarea', required: false, visible: true, placeholder: 'Comma separated', order: 6 },
      { id: 's7', name: 'returns', label: 'Returns (30 days)', type: 'number', required: false, visible: true, placeholder: '0', order: 7 },
      { id: 's8', name: 'scrap', label: 'Scrap Items', type: 'number', required: false, visible: true, placeholder: '0', order: 8 },
      { id: 's9', name: 'manager', label: 'Store Manager', type: 'text', required: false, visible: true, placeholder: 'Name', order: 9 },
      { id: 's10', name: 'last7DaysSales', label: 'Last 7 Days Sales', type: 'text', required: false, visible: true, placeholder: 'Comma separated numbers', order: 10 },
      { id: 's11', name: 'lowStockAlerts', label: 'Low Stock Alerts', type: 'textarea', required: false, visible: true, placeholder: 'Comma separated items', order: 11 },
    ],
    'stock-report': [
      { id: 'sr1', name: 'itemId', label: 'Item Name', type: 'select', required: true, visible: true, options: [], order: 1 },
      { id: 'sr2', name: 'unitCost', label: 'Unit Cost', type: 'number', required: true, visible: true, placeholder: '0.00', order: 2 },
      { id: 'sr3', name: 'incomingQuantity', label: 'Incoming Quantity', type: 'number', required: true, visible: true, placeholder: '0', order: 3 },
      { id: 'sr4', name: 'outgoingQuantity', label: 'Outgoing Quantity', type: 'number', required: true, visible: true, placeholder: '0', order: 4 },
      { id: 'sr5', name: 'category', label: 'Category', type: 'select', required: true, visible: true, options: ['Raw Materials', 'Components', 'Finished Goods'], order: 5 },
      { id: 'sr6', name: 'warehouse', label: 'Warehouse', type: 'select', required: true, visible: true, options: ['Warehouse A', 'Warehouse B', 'Warehouse C'], order: 6 },
      { id: 'sr7', name: 'productType', label: 'Product Type', type: 'select', required: true, visible: true, options: ['goods', 'services', 'combo'], order: 7 },
    ],
    'transaction-history': [
      { id: 'th1', name: 'date', label: 'Date', type: 'date', required: true, visible: true, order: 1 },
      { id: 'th2', name: 'reference', label: 'Reference', type: 'text', required: true, visible: true, placeholder: 'Enter reference number', order: 2 },
      { id: 'th3', name: 'productId', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 3 },
      { id: 'th4', name: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true, placeholder: '0', order: 4 },
      { id: 'th5', name: 'fromLocation', label: 'From Location', type: 'text', required: true, visible: true, placeholder: 'Source', order: 5 },
      { id: 'th6', name: 'toLocation', label: 'To Location', type: 'text', required: true, visible: true, placeholder: 'Destination', order: 6 },
      { id: 'th7', name: 'operationType', label: 'Operation Type', type: 'select', required: true, visible: true, options: ['receipt', 'delivery', 'internal', 'scrap', 'adjustment'], order: 7 },
      { id: 'th8', name: 'status', label: 'Status', type: 'select', required: true, visible: true, options: ['draft', 'confirmed', 'done', 'cancelled'], order: 8 },
    ],
    'moves-analysis': [
      { id: 'ma1', name: 'product', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 1 },
      { id: 'ma2', name: 'demand', label: 'Demand', type: 'number', required: true, visible: true, placeholder: '0', order: 2 },
      { id: 'ma3', name: 'snLots', label: 'Number of SN/Lots', type: 'number', required: true, visible: true, placeholder: '0', order: 3 },
      { id: 'ma4', name: 'packagingQty', label: 'Packaging Quantity', type: 'number', required: true, visible: true, placeholder: '0', order: 4 },
      { id: 'ma5', name: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true, placeholder: '0', order: 5 },
      { id: 'ma6', name: 'realQuantity', label: 'Real Quantity', type: 'number', required: true, visible: true, placeholder: '0', order: 6 },
      { id: 'ma7', name: 'unitPrice', label: 'Unit Price', type: 'number', required: true, visible: true, placeholder: '0.00', order: 7 },
      { id: 'ma8', name: 'inboundTrend', label: 'Inbound Trend', type: 'select', required: true, visible: true, options: ['up', 'down', 'stable'], order: 8 },
      { id: 'ma9', name: 'outboundTrend', label: 'Outbound Trend', type: 'select', required: true, visible: true, options: ['up', 'down', 'stable'], order: 9 },
    ],
    'valuation': [
      { id: 'v1', name: 'date', label: 'Date', type: 'date', required: true, visible: true, order: 1 },
      { id: 'v2', name: 'reference', label: 'Reference', type: 'text', required: true, visible: true, placeholder: 'Enter reference', order: 2 },
      { id: 'v3', name: 'product', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 3 },
      { id: 'v4', name: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true, placeholder: '+ for in, - for out', order: 4 },
      { id: 'v5', name: 'unitValue', label: 'Unit Value', type: 'number', required: true, visible: true, placeholder: '0.00', order: 5 },
      { id: 'v6', name: 'method', label: 'Valuation Method', type: 'select', required: true, visible: true, options: ['FIFO', 'LIFO', 'Average Cost'], order: 6 },
      { id: 'v7', name: 'notes', label: 'Notes', type: 'textarea', required: false, visible: true, placeholder: 'Additional notes...', order: 7 },
    ]
  });

  const formOptions = [
    { id: 'add-product', name: 'Product Form', icon: Package },
    { id: 'warehouse', name: 'Warehouse Form', icon: Warehouse },
    { id: 'store', name: 'Store Form', icon: Store },
    { id: 'receipt', name: 'Receipt Form', icon: FileText },
    { id: 'delivery', name: 'Delivery Form', icon: FileText },
    { id: 'scrap-order', name: 'Scrap Order Form', icon: Trash2 },
    { id: 'forecasting', name: 'Forecasting Rule', icon: TrendingUp },
    { id: 'stock-report', name: 'Stock Report', icon: FileText },
    { id: 'transaction-history', name: 'Transaction History', icon: FileText },
    { id: 'moves-analysis', name: 'Moves Analysis', icon: FileText },
    { id: 'valuation', name: 'Valuation Report', icon: FileText }
  ];

  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'number', label: 'Number Input', icon: Hash },
    { type: 'email', label: 'Email Input', icon: Type },
    { type: 'date', label: 'Date Input', icon: Calendar },
    { type: 'select', label: 'Dropdown Select', icon: List },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'textarea', label: 'Text Area', icon: FileText }
  ];

  const currentFields = formFields[selectedForm] || [];

  const toggleFieldVisibility = (fieldId: string) => {
    setFormFields(prev => ({
      ...prev,
      [selectedForm]: prev[selectedForm].map(field =>
        field.id === fieldId ? { ...field, visible: !field.visible } : field
      )
    }));
  };

  const toggleFieldRequired = (fieldId: string) => {
    setFormFields(prev => ({
      ...prev,
      [selectedForm]: prev[selectedForm].map(field =>
        field.id === fieldId ? { ...field, required: !field.required } : field
      )
    }));
  };

  const deleteField = (fieldId: string) => {
    setFormFields(prev => ({
      ...prev,
      [selectedForm]: prev[selectedForm].filter(field => field.id !== fieldId)
    }));
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const fields = [...currentFields];
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    
    if (direction === 'up' && fieldIndex > 0) {
      [fields[fieldIndex], fields[fieldIndex - 1]] = [fields[fieldIndex - 1], fields[fieldIndex]];
    } else if (direction === 'down' && fieldIndex < fields.length - 1) {
      [fields[fieldIndex], fields[fieldIndex + 1]] = [fields[fieldIndex + 1], fields[fieldIndex]];
    }

    // Update order values
    fields.forEach((field, index) => {
      field.order = index + 1;
    });

    setFormFields(prev => ({
      ...prev,
      [selectedForm]: fields
    }));
  };

  const AddFieldForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Custom Field</h3>
            <button
              onClick={() => setShowAddField(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter field name (camelCase)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter display label"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {fieldTypes.map((fieldType) => {
                  const Icon = fieldType.icon;
                  return (
                    <button
                      key={fieldType.type}
                      type="button"
                      className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Icon className="h-5 w-5 text-gray-600 mb-1" />
                      <span className="text-xs text-gray-600">{fieldType.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder Text
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter placeholder text"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-700">Required Field</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Visible</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddField(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Field
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
            <p className="mt-1 text-sm text-gray-600">
              Customize forms by adding fields, repositioning elements, and configuring visibility
            </p>
          </div>
          <button 
            onClick={() => setShowAddField(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Field
          </button>
        </div>

        {/* Form Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Form to Customize</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {formOptions.map((form) => {
              const Icon = form.icon;
              return (
                <button
                  key={form.id}
                  onClick={() => setSelectedForm(form.id)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    selectedForm === form.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center">
                    {Icon && <Icon className="h-4 w-4 mr-2" />}
                    <span className="text-sm font-medium">{form.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Fields Configuration */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Configure Fields - {formOptions.find(f => f.id === selectedForm)?.name}
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {currentFields.map((field, index) => (
                <div
                  key={field.id}
                  className={`border rounded-lg p-4 ${
                    field.visible ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => moveField(field.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveField(field.id, 'down')}
                          disabled={index === currentFields.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{field.label}</h4>
                        <p className="text-xs text-gray-500">
                          Type: {field.type} • Key: {field.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFieldRequired(field.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          field.required
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {field.required ? 'Required' : 'Optional'}
                      </button>
                      <button
                        onClick={() => toggleFieldVisibility(field.id)}
                        className={`p-1 rounded ${
                          field.visible
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {field.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setEditingField(field.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {field.placeholder && (
                    <p className="text-xs text-gray-500 mt-2">
                      Placeholder: {field.placeholder}
                    </p>
                  )}
                  {field.options && field.options.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Options: {field.options.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {currentFields.length === 0 && (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No fields configured for this form</p>
                <button
                  onClick={() => setShowAddField(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Add your first field
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form Preview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Preview: {formOptions.find(f => f.id === selectedForm)?.name}
            </h3>
          </div>
          <div className="p-6">
            <div className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="space-y-4">
                {currentFields
                  .filter(field => field.visible)
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="">Select {field.label}</option>
                          {field.options?.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={field.placeholder}
                        />
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center h-10">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{field.placeholder || 'Enable this option'}</span>
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                
                <div className="pt-4 flex justify-end">
                    <button disabled className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed">
                        Submit (Preview)
                    </button>
                </div>
              </div>
              {currentFields.filter(field => field.visible).length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No visible fields to preview
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Add Field Modal */}
        {showAddField && <AddFieldForm />}
      </div>
  );
};

export default FormBuilder;