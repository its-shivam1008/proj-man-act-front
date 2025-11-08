import React, { useState } from 'react';
import { Trash2, Edit2, Plus, BarChart3, Zap, Package, Clock, AlertCircle } from 'lucide-react';

export default function ProductionDashboard() {
  const [operations, setOperations] = useState([
    { id: 1, name: 'Assembly Line A', status: 'Running', efficiency: 92, downtime: 0.5 },
    { id: 2, name: 'Assembly Line B', status: 'Maintenance', efficiency: 0, downtime: 2 },
  ]);
  
  const [inventory, setInventory] = useState([
    { id: 1, product: 'Component X', current: 450, optimal: 500, min: 100 },
    { id: 2, product: 'Component Y', current: 280, optimal: 400, min: 150 },
  ]);
  
  const [utilization, setUtilization] = useState([
    { id: 1, resource: 'Machine M1', utilization: 85, status: 'Optimal' },
    { id: 2, resource: 'Labour Team A', utilization: 78, status: 'Good' },
  ]);
  
  const [costs, setCosts] = useState([
    { id: 1, category: 'Labour', amount: 25000, trend: 'up' },
    { id: 2, category: 'Materials', amount: 45000, trend: 'down' },
  ]);
  
  const [quality, setQuality] = useState([
    { id: 1, product: 'Product A', passRate: 98.5, defects: 15 },
    { id: 2, product: 'Product B', passRate: 96.2, defects: 38 },
  ]);
  
  const [shopFloor, setShopFloor] = useState([
    { id: 1, station: 'Station 1', activity: 'Assembly', progress: 65, timestamp: '14:30' },
    { id: 2, station: 'Station 2', activity: 'QC Testing', progress: 80, timestamp: '14:25' },
  ]);

  const [activeTab, setActiveTab] = useState('overview');
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});

  const openModal = (type, item = null) => {
    setModalType(type);
    setShowModal(true);
    if (item) {
      setEditingId(item.id);
      setFormData(item);
    } else {
      setFormData({});
      setEditingId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
    setEditingId(null);
  };

  const handleSave = () => {
    switch(modalType) {
      case 'operations':
        if (editingId) {
          setOperations(operations.map(o => o.id === editingId ? { ...formData, id: editingId } : o));
        } else {
          setOperations([...operations, { ...formData, id: Math.max(...operations.map(o => o.id), 0) + 1 }]);
        }
        break;
      case 'inventory':
        if (editingId) {
          setInventory(inventory.map(i => i.id === editingId ? { ...formData, id: editingId } : i));
        } else {
          setInventory([...inventory, { ...formData, id: Math.max(...inventory.map(i => i.id), 0) + 1 }]);
        }
        break;
      case 'quality':
        if (editingId) {
          setQuality(quality.map(q => q.id === editingId ? { ...formData, id: editingId } : q));
        } else {
          setQuality([...quality, { ...formData, id: Math.max(...quality.map(q => q.id), 0) + 1 }]);
        }
        break;
      case 'shopfloor':
        if (editingId) {
          setShopFloor(shopFloor.map(s => s.id === editingId ? { ...formData, id: editingId } : s));
        } else {
          setShopFloor([...shopFloor, { ...formData, id: Math.max(...shopFloor.map(s => s.id), 0) + 1 }]);
        }
        break;
    }
    closeModal();
  };

  const handleDelete = (type, id) => {
    switch(type) {
      case 'operations':
        setOperations(operations.filter(o => o.id !== id));
        break;
      case 'inventory':
        setInventory(inventory.filter(i => i.id !== id));
        break;
      case 'quality':
        setQuality(quality.filter(q => q.id !== id));
        break;
      case 'shopfloor':
        setShopFloor(shopFloor.filter(s => s.id !== id));
        break;
    }
  };

  const StatCard = ({ icon: Icon, title, value, unit, color }) => (
    <div className="bg-white p-4 rounded-lg shadow border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}<span className="text-sm text-gray-500 ml-1">{unit}</span></p>
        </div>
        <div style={{ color }}>
          <Icon size={32} />
        </div>
      </div>
    </div>
  );

  const Modal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingId ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
        </h2>
        
        <div className="space-y-3">
          {modalType === 'operations' && (
            <>
              <input placeholder="Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded" />
              <select value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border p-2 rounded">
                <option>Running</option>
                <option>Maintenance</option>
                <option>Idle</option>
              </select>
              <input type="number" placeholder="Efficiency %" value={formData.efficiency || ''} onChange={e => setFormData({...formData, efficiency: e.target.value})} className="w-full border p-2 rounded" />
              <input type="number" placeholder="Downtime (hrs)" value={formData.downtime || ''} onChange={e => setFormData({...formData, downtime: e.target.value})} className="w-full border p-2 rounded" />
            </>
          )}
          
          {modalType === 'inventory' && (
            <>
              <input placeholder="Product" value={formData.product || ''} onChange={e => setFormData({...formData, product: e.target.value})} className="w-full border p-2 rounded" />
              <input type="number" placeholder="Current" value={formData.current || ''} onChange={e => setFormData({...formData, current: e.target.value})} className="w-full border p-2 rounded" />
              <input type="number" placeholder="Optimal" value={formData.optimal || ''} onChange={e => setFormData({...formData, optimal: e.target.value})} className="w-full border p-2 rounded" />
              <input type="number" placeholder="Minimum" value={formData.min || ''} onChange={e => setFormData({...formData, min: e.target.value})} className="w-full border p-2 rounded" />
            </>
          )}

          {modalType === 'quality' && (
            <>
              <input placeholder="Product" value={formData.product || ''} onChange={e => setFormData({...formData, product: e.target.value})} className="w-full border p-2 rounded" />
              <input type="number" placeholder="Pass Rate %" value={formData.passRate || ''} onChange={e => setFormData({...formData, passRate: e.target.value})} className="w-full border p-2 rounded" />
              <input type="number" placeholder="Defects" value={formData.defects || ''} onChange={e => setFormData({...formData, defects: e.target.value})} className="w-full border p-2 rounded" />
            </>
          )}

          {modalType === 'shopfloor' && (
            <>
              <input placeholder="Station" value={formData.station || ''} onChange={e => setFormData({...formData, station: e.target.value})} className="w-full border p-2 rounded" />
              <input placeholder="Activity" value={formData.activity || ''} onChange={e => setFormData({...formData, activity: e.target.value})} className="w-full border p-2 rounded" />
              <input type="number" placeholder="Progress %" value={formData.progress || ''} onChange={e => setFormData({...formData, progress: e.target.value})} className="w-full border p-2 rounded" />
              <input placeholder="Timestamp" value={formData.timestamp || ''} onChange={e => setFormData({...formData, timestamp: e.target.value})} className="w-full border p-2 rounded" />
            </>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={handleSave} className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Save</button>
          <button onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400">Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <h1 className="text-3xl font-bold">Production Management Dashboard</h1>
        <p className="text-blue-100 mt-2">Real-time manufacturing operations oversight</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {['overview', 'operations', 'inventory', 'utilization', 'costs', 'quality', 'shopfloor'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={Zap} title="Active Operations" value={operations.filter(o => o.status === 'Running').length} unit="units" color="#3b82f6" />
              <StatCard icon={Package} title="Inventory Level" value={Math.round(inventory.reduce((a, i) => a + i.current, 0) / inventory.length)} unit="avg" color="#10b981" />
              <StatCard icon={BarChart3} title="Avg Efficiency" value={Math.round(operations.reduce((a, o) => a + o.efficiency, 0) / operations.length)} unit="%" color="#f59e0b" />
              <StatCard icon={Clock} title="Total Downtime" value={Math.round(operations.reduce((a, o) => a + o.downtime, 0) * 10) / 10} unit="hrs" color="#ef4444" />
              <StatCard icon={AlertCircle} title="Quality Pass Rate" value={Math.round(quality.reduce((a, q) => a + q.passRate, 0) / quality.length * 10) / 10} unit="%" color="#8b5cf6" />
              <StatCard icon={BarChart3} title="Active Stations" value={shopFloor.length} unit="stations" color="#ec4899" />
            </div>
          </div>
        )}

        {/* Manufacturing Operations */}
        {activeTab === 'operations' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manufacturing Operations</h2>
              <button onClick={() => openModal('operations')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                <Plus size={18} /> Add Operation
              </button>
            </div>
            <div className="grid gap-4">
              {operations.map(op => (
                <div key={op.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{op.name}</h3>
                      <p className="text-sm text-gray-600">Status: <span className={`font-semibold ${op.status === 'Running' ? 'text-green-600' : op.status === 'Maintenance' ? 'text-orange-600' : 'text-gray-600'}`}>{op.status}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openModal('operations', op)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete('operations', op.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-sm text-gray-600">Efficiency</p>
                      <div className="w-full bg-gray-200 rounded h-2 mt-1"><div className="bg-green-500 h-2 rounded" style={{ width: `${op.efficiency}%` }}></div></div>
                      <p className="text-sm font-semibold mt-1">{op.efficiency}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Downtime</p>
                      <p className="text-sm font-semibold">{op.downtime} hrs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Management */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Inventory Levels</h2>
              <button onClick={() => openModal('inventory')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                <Plus size={18} /> Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Product</th>
                    <th className="px-4 py-3 text-left font-semibold">Current</th>
                    <th className="px-4 py-3 text-left font-semibold">Optimal</th>
                    <th className="px-4 py-3 text-left font-semibold">Minimum</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.product}</td>
                      <td className="px-4 py-3">{item.current}</td>
                      <td className="px-4 py-3">{item.optimal}</td>
                      <td className="px-4 py-3">{item.min}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${item.current < item.min ? 'bg-red-100 text-red-800' : item.current < item.optimal ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {item.current < item.min ? 'Low' : item.current < item.optimal ? 'Medium' : 'Optimal'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => openModal('inventory', item)} className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete('inventory', item.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Utilization */}
        {activeTab === 'utilization' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Machine & Labour Utilisation</h2>
            <div className="grid gap-4">
              {utilization.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">{item.resource}</h3>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${item.status === 'Optimal' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{item.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${item.utilization}%` }}></div></div>
                  <p className="text-sm text-gray-600 mt-2">{item.utilization}% Utilisation</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Costs */}
        {activeTab === 'costs' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Production Costs</h2>
            <div className="grid gap-4">
              {costs.map(cost => (
                <div key={cost.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{cost.category}</h3>
                    <p className="text-2xl font-bold text-gray-900">${cost.amount.toLocaleString()}</p>
                  </div>
                  <div className={`text-lg font-bold ${cost.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                    {cost.trend === 'up' ? '↑' : '↓'} {cost.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Consistency */}
        {activeTab === 'quality' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Quality Consistency</h2>
              <button onClick={() => openModal('quality')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                <Plus size={18} /> Add Product
              </button>
            </div>
            <div className="grid gap-4">
              {quality.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold">{item.product}</h3>
                      <p className="text-sm text-gray-600">Defects: {item.defects}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openModal('quality', item)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete('quality', item.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${item.passRate}%` }}></div></div>
                  <p className="text-sm font-semibold mt-2">{item.passRate}% Pass Rate</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shop Floor Activity */}
        {activeTab === 'shopfloor' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Real-time Shop Floor Activity</h2>
              <button onClick={() => openModal('shopfloor')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
                <Plus size={18} /> Add Activity
              </button>
            </div>
            <div className="space-y-3">
              {shopFloor.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{item.station}</h3>
                      <p className="text-sm text-gray-600">{item.activity} • Updated: {item.timestamp}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openModal('shopfloor', item)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete('shopfloor', item.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${item.progress}%` }}></div></div>
                  <p className="text-sm font-semibold mt-2">{item.progress}% Complete</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && <Modal />}
    </div>
  );
}