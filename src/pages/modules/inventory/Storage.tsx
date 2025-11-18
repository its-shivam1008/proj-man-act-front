import React, { useState, useEffect } from 'react';
import { Store, Plus, TrendingUp, Package, Users, AlertCircle, Edit, Trash2, XCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { storage, STORAGE_KEYS } from '@/lib/storage';

// TypeScript Interface
interface StoreData {
  id: string;
  name: string;
  location: string;
  dailySales: number;
  stock: number;
  categories: {
    fashion: number;
    electronics: number;
    grocery: number;
  };
  last7DaysSales: number[];
  fastMoving: string[];
  slowMoving: string[];
  returns: number;
  scrap: number;
  manager: string;
  transferHistory: { date: string; qty: number; from: string }[];
  lowStockAlerts: string[];
}

// Initial mock data
const initialStoreData: StoreData[] = [
  {
    id: "1",
    name: "Downtown Store",
    location: "City Center – Block A",
    dailySales: 9500,
    stock: 120,
    categories: { fashion: 40, electronics: 30, grocery: 50 },
    last7DaysSales: [12000, 11300, 9800, 10500, 10200, 9600, 9500],
    fastMoving: ["Mobile Charger", "T-Shirts Pack", "Milk 1L"],
    slowMoving: ["Winter Jacket XL", "Old Electronics"],
    returns: 4,
    scrap: 2,
    manager: "Amit Sharma",
    transferHistory: [
      { date: "10 Jan 2025", qty: 20, from: "Main Warehouse" },
      { date: "07 Jan 2025", qty: 15, from: "Backup Warehouse" },
    ],
    lowStockAlerts: ["Sugar 5kg", "LED Bulb 9W"],
  },
  {
    id: "2",
    name: "Mall Branch",
    location: "Galleria Mall – 2nd Floor",
    dailySales: 7200,
    stock: 110,
    categories: { fashion: 60, electronics: 20, grocery: 30 },
    last7DaysSales: [9000, 8400, 7900, 7800, 7600, 7400, 7200],
    fastMoving: ["Perfume Mini", "Earphones"],
    slowMoving: ["Winter Boots", "Formal Blazers"],
    returns: 3,
    scrap: 1,
    manager: "Rohit Verma",
    transferHistory: [
      { date: "09 Jan 2025", qty: 25, from: "Main Warehouse" },
    ],
    lowStockAlerts: ["Face Wash – Herbal", "USB Cable"],
  },
];

const StoresManagement: React.FC = () => {
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);

  // Load from storage
  useEffect(() => {
    const init = () => {
      if (!storage.has(STORAGE_KEYS.STORES)) {
        storage.set(STORAGE_KEYS.STORES, initialStoreData);
      }
      const data = storage.get<StoreData[]>(STORAGE_KEYS.STORES, []);
      setStores(Array.isArray(data) ? data : initialStoreData);
    };
    init();
  }, []);

  const handleAdd = () => {
    setEditingStoreId(null);
    setShowStoreForm(true);
  };

  const handleEdit = (id: string) => {
    setEditingStoreId(id);
    setShowStoreForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this store?")) {
      storage.deleteById(STORAGE_KEYS.STORES, id);
      setStores(storage.get<StoreData[]>(STORAGE_KEYS.STORES, []));
    }
  };

  const handleCloseForm = () => {
    setShowStoreForm(false);
    setEditingStoreId(null);
  };

  const handleSubmit = (formData: any) => {
    const payload: StoreData = {
      id: editingStoreId || Date.now().toString(),
      name: formData.name || "New Store",
      location: formData.location || "N/A",
      dailySales: Number(formData.dailySales) || 0,
      stock: Number(formData.stock) || 0,
      categories: {
        fashion: Number(formData.fashion) || 0,
        electronics: Number(formData.electronics) || 0,
        grocery: Number(formData.grocery) || 0,
      },
      last7DaysSales: formData.last7DaysSales
        ? formData.last7DaysSales.split(',').map((v: string) => Number(v.trim())).filter(Boolean)
        : [0, 0, 0, 0, 0, 0, 0],
      fastMoving: formData.fastMoving?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
      slowMoving: formData.slowMoving?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
      returns: Number(formData.returns) || 0,
      scrap: Number(formData.scrap) || 0,
      manager: formData.manager || "Unassigned",
      transferHistory: formData.transferHistory
        ? JSON.parse(formData.transferHistory || "[]")
        : [],
      lowStockAlerts: formData.lowStockAlerts?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    };

    if (editingStoreId) {
      storage.updateById(STORAGE_KEYS.STORES, editingStoreId, payload);
    } else {
      storage.push(STORAGE_KEYS.STORES, payload);
    }

    setStores(storage.get<StoreData[]>(STORAGE_KEYS.STORES, []));
    handleCloseForm();
  };

  const StoreForm = ({ initialData }: { initialData?: StoreData }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      location: initialData?.location || '',
      dailySales: initialData?.dailySales?.toString() || '0',
      stock: initialData?.stock?.toString() || '0',
      fashion: initialData?.categories?.fashion?.toString() || '0',
      electronics: initialData?.categories?.electronics?.toString() || '0',
      grocery: initialData?.categories?.grocery?.toString() || '0',
      last7DaysSales: initialData?.last7DaysSales?.join(', ') || '',
      fastMoving: initialData?.fastMoving?.join(', ') || '',
      slowMoving: initialData?.slowMoving?.join(', ') || '',
      returns: initialData?.returns?.toString() || '0',
      scrap: initialData?.scrap?.toString() || '0',
      manager: initialData?.manager || '',
      transferHistory: initialData?.transferHistory ? JSON.stringify(initialData.transferHistory, null, 2) : '[]',
      lowStockAlerts: initialData?.lowStockAlerts?.join(', ') || '',
    });

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{editingStoreId ? 'Edit' : 'Add'} Store</h2>
            <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-8 h-8" />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(formData); }} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Store Name *</label>
                <input required value={formData.name} onChange={handleChange('name')} className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location *</label>
                <input required value={formData.location} onChange={handleChange('location')} className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Daily Sales (₹)</label>
                <input type="number" value={formData.dailySales} onChange={handleChange('dailySales')} className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Stock (items)</label>
                <input type="number" value={formData.stock} onChange={handleChange('stock')} className="w-full px-4 py-3 border rounded-lg" />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Category-wise Stock</h3>
              <div className="grid grid-cols-3 gap-4">
                <input placeholder="Fashion" type="number" value={formData.fashion} onChange={handleChange('fashion')} className="px-4 py-3 border rounded-lg" />
                <input placeholder="Electronics" type="number" value={formData.electronics} onChange={handleChange('electronics')} className="px-4 py-3 border rounded-lg" />
                <input placeholder="Grocery" type="number" value={formData.grocery} onChange={handleChange('grocery')} className="px-4 py-3 border rounded-lg" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Fast Moving Items (comma separated)</label>
                <textarea rows={3} value={formData.fastMoving} onChange={handleChange('fastMoving')} className="w-full px-4 py-3 border rounded-lg" placeholder="T-Shirts, Milk, Chargers..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slow Moving Items</label>
                <textarea rows={3} value={formData.slowMoving} onChange={handleChange('slowMoving')} className="w-full px-4 py-3 border rounded-lg" placeholder="Winter Jackets, Old Phones..." />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Returns (last 30 days)</label>
                <input type="number" value={formData.returns} onChange={handleChange('returns')} className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Scrap Items</label>
                <input type="number" value={formData.scrap} onChange={handleChange('scrap')} className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Store Manager</label>
                <input value={formData.manager} onChange={handleChange('manager')} className="w-full px-4 py-3 border rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Last 7 Days Sales (comma separated)</label>
              <input value={formData.last7DaysSales} onChange={handleChange('last7DaysSales')} className="w-full px-4 py-3 border rounded-lg" placeholder="12000, 11300, 9800, ..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Low Stock Alerts (comma separated)</label>
              <textarea rows={2} value={formData.lowStockAlerts} onChange={handleChange('lowStockAlerts')} className="w-full px-4 py-3 border rounded-lg" placeholder="Sugar 5kg, LED Bulb..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Transfer History (JSON format - optional)</label>
              <textarea rows={4} value={formData.transferHistory} onChange={handleChange('transferHistory')} className="w-full px-4 py-3 border rounded-lg font-mono text-xs" placeholder='[{"date": "10 Jan 2025", "qty": 20, "from": "Main Warehouse"}]' />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={handleCloseForm}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingStoreId ? 'Update Store' : 'Create Store'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Store className="text-green-600" />
          Retail Stores & Branches
        </h1>
        <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Store
        </Button>
      </div>

      {showStoreForm && (
        <StoreForm initialData={editingStoreId ? stores.find(s => s.id === editingStoreId) : undefined} />
      )}

      <Accordion type="single" collapsible className="space-y-6">
        {stores.map((store) => (
          <AccordionItem key={store.id} value={store.id} className="border rounded-xl shadow-lg overflow-hidden bg-white">
            <AccordionTrigger className="px-8 py-6 hover:bg-green-50 transition-colors">
              <div className="grid grid-cols-12 w-full items-center text-left gap-6">
                <div className="col-span-4 font-bold text-lg flex items-center gap-3">
                  <Store className="text-green-600" />
                  {store.name}
                </div>
                <div className="col-span-3 text-gray-600 flex items-center gap-2">
                  <Package className="w-4 h-4" /> {store.location}
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-2xl font-bold text-green-600">₹{store.dailySales.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">daily avg</div>
                </div>
                <div className="col-span-2 text-right font-semibold">{store.stock} items</div>
                <div className="col-span-1">
                  <div className="w-20 bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{ width: `${Math.min((store.stock / 200) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-8 py-8 bg-gradient-to-b from-green-50 to-white border-t">
              <div className="flex justify-end gap-3 mb-6">
                <Button size="sm" variant="outline" onClick={() => handleEdit(store.id)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(store.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="font-bold text-green-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Performance
                  </h4>
                  <p>Manager: <strong>{store.manager}</strong></p>
                  <p>Returns: <Badge variant="destructive">{store.returns}</Badge></p>
                  <p>Scrap: <Badge variant="secondary">{store.scrap}</Badge></p>
                </div>

                <div>
                  <h4 className="font-bold text-green-700 mb-4">Fast Moving</h4>
                  <ul className="space-y-2">
                    {store.fastMoving.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-green-600">
                        <span className="text-xs">✔</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-orange-700 mb-4">Slow Moving</h4>
                  <ul className="space-y-2">
                    {store.slowMoving.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-orange-600">
                        <span className="text-xs">⚠</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {store.lowStockAlerts.length > 0 && (
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Low Stock Alerts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {store.lowStockAlerts.map((alert, i) => (
                      <Badge key={i} variant="destructive">{alert}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 grid md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Recent Transfers</h4>
                  <ul className="space-y-2">
                    {store.transferHistory.map((t, i) => (
                      <li key={i} className="text-gray-600">
                        {t.date} → +{t.qty} from <strong>{t.from}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Last 7 Days Sales</h4>
                  <div className="space-y-1 text-right font-mono text-sm">
                    {store.last7DaysSales.map((sale, i) => (
                      <div key={i}>Day {i + 1}: ₹{sale.toLocaleString()}</div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default StoresManagement;