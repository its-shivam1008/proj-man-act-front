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
  FileText
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

  const [formFields, setFormFields] = useState<Record<string, FormField[]>>({
    'add-product': [
      { id: '1', name: 'productName', label: 'Product Name', type: 'text', required: true, visible: true, placeholder: 'Enter product name', order: 1 },
      { id: '2', name: 'productType', label: 'Product Type', type: 'select', required: true, visible: true, options: ['Goods', 'Services', 'Combo'], order: 2 },
      { id: '3', name: 'category', label: 'Category', type: 'select', required: true, visible: true, options: ['Raw Materials', 'Components', 'Finished Goods'], order: 3 },
      { id: '4', name: 'salesPrice', label: 'Sales Price', type: 'number', required: false, visible: true, placeholder: '0.00', order: 4 },
      { id: '5', name: 'costPrice', label: 'Cost Price', type: 'number', required: false, visible: true, placeholder: '0.00', order: 5 },
    ],
    'receipt': [
      { id: '1', name: 'receiveFrom', label: 'Receive From', type: 'text', required: true, visible: true, placeholder: 'Partner/Customer/Supplier', order: 1 },
      { id: '2', name: 'operationType', label: 'Operation Type', type: 'select', required: true, visible: true, options: ['Purchase', 'Transfer', 'Return'], order: 2 },
      { id: '3', name: 'product', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 3 },
      { id: '4', name: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true, placeholder: 'Enter quantity', order: 4 },
    ],
    'delivery': [
      { id: '1', name: 'deliverTo', label: 'Deliver To', type: 'text', required: true, visible: true, placeholder: 'Customer/Partner', order: 1 },
      { id: '2', name: 'operationType', label: 'Operation Type', type: 'select', required: true, visible: true, options: ['Sale', 'Transfer', 'Return'], order: 2 },
      { id: '3', name: 'shippingMethod', label: 'Shipping Method', type: 'select', required: false, visible: true, options: ['Standard', 'Express', 'Overnight'], order: 3 },
    ],
    'scrap-order': [
      { id: '1', name: 'product', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 1 },
      { id: '2', name: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true, placeholder: 'Enter quantity to scrap', order: 2 },
      { id: '3', name: 'reason', label: 'Scrap Reason', type: 'select', required: true, visible: true, options: ['Damaged', 'Expired', 'Lost', 'Obsolete'], order: 3 },
    ],
    'stock-report': [
      { id: '1', name: 'itemName', label: 'Item Name', type: 'select', required: true, visible: true, options: [], order: 1 },
      { id: '2', name: 'unitCost', label: 'Unit Cost', type: 'number', required: true, visible: true, placeholder: 'Enter unit cost', order: 2 },
      { id: '3', name: 'incomingQty', label: 'Incoming Quantity', type: 'number', required: false, visible: true, placeholder: 'Enter incoming quantity', order: 3 },
    ],
    'transaction-history': [
      { id: '1', name: 'date', label: 'Date', type: 'date', required: true, visible: true, order: 1 },
      { id: '2', name: 'reference', label: 'Reference', type: 'text', required: true, visible: true, placeholder: 'Enter reference number', order: 2 },
      { id: '3', name: 'product', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 3 },
    ],
    'moves-analysis': [
      { id: '1', name: 'product', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 1 },
      { id: '2', name: 'demand', label: 'Demand', type: 'number', required: true, visible: true, placeholder: 'Enter demand quantity', order: 2 },
      { id: '3', name: 'snLots', label: 'Number of SN/Lots', type: 'number', required: false, visible: true, placeholder: 'Serial/Lot numbers', order: 3 },
    ],
    'valuation': [
      { id: '1', name: 'date', label: 'Date', type: 'date', required: true, visible: true, order: 1 },
      { id: '2', name: 'reference', label: 'Reference', type: 'text', required: true, visible: true, placeholder: 'Enter reference number', order: 2 },
      { id: '3', name: 'product', label: 'Product', type: 'select', required: true, visible: true, options: [], order: 3 },
    ]
  });

  const formOptions = [
    { id: 'add-product', name: 'Add Product Form' },
    { id: 'receipt', name: 'Receipt Form' },
    { id: 'delivery', name: 'Delivery Form' },
    { id: 'scrap-order', name: 'Scrap Order Form' },
    { id: 'stock-report', name: 'Stock Report Form' },
    { id: 'transaction-history', name: 'Transaction History Form' },
    { id: 'moves-analysis', name: 'Moves Analysis Form' },
    { id: 'valuation', name: 'Valuation Form' }
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
                  placeholder="Enter field name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter field label"
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
    // <Layout>
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
            {formOptions.map((form) => (
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
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">{form.name}</span>
                </div>
              </button>
            ))}
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
                          Type: {field.type} • Name: {field.name}
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
            <h3 className="text-lg font-medium text-gray-900">Form Preview</h3>
          </div>
          <div className="p-6">
            <div className="max-w-2xl">
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
                          <option value="">Select option</option>
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
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{field.placeholder || 'Check this option'}</span>
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
    // </Layout>
  );
};

export default FormBuilder;