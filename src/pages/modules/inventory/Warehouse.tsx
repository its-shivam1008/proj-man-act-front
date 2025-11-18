import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, Package, MapPin, Edit, Trash2, XCircle, Badge } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { useDispatch, useSelector } from "react-redux";
import {
    fetchWarehouses,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
} from "@/redux/slices/warehouseSlice";

// Define proper TypeScript interface
interface WarehouseData {
    id: string;
    name: string;
    type: string;
    location: string;
    capacity: number;
    totalItems: number;
    categories: {
        raw: number;
        finished: number;
        consumables: number;
    };
    lastGRN: {
        date: string;
        qty: number;
        po: string;
    } | null;
    lastIssue: {
        date: string;
        qty: number;
        dept: string;
    } | null;
    ageing: {
        "0-30 Days": number;
        "31-90 Days": number;
        "90+ Days": number;
    };
    inTransit: number;
    reorderAlerts: string[];
    bins: string[];
}

// Initial mock data (will be saved to storage on first load)
const initialWarehouseData: WarehouseData[] = [
    {
        id: "1",
        name: "Main Warehouse",
        type: "General",
        location: "Plant A – Sector 21",
        capacity: 78,
        totalItems: 420,
        categories: { raw: 120, finished: 250, consumables: 50 },
        lastGRN: { date: "12 Jan 2025", qty: 120, po: "PO-8745" },
        lastIssue: { date: "10 Jan 2025", qty: 90, dept: "Production" },
        ageing: { "0-30 Days": 200, "31-90 Days": 150, "90+ Days": 70 },
        inTransit: 40,
        reorderAlerts: ["Steel Rod 12mm", "Lubricant Oil - 5L"],
        bins: ["Rack A1", "Rack B2", "Rack C3"],
    },
    {
        id: "2",
        name: "Cold Storage WH",
        type: "Cold Storage",
        location: "Plant B – Phase 3",
        capacity: 62,
        totalItems: 310,
        categories: { raw: 90, finished: 160, consumables: 60 },
        lastGRN: { date: "09 Jan 2025", qty: 200, po: "PO-8722" },
        lastIssue: { date: "08 Jan 2025", qty: 50, dept: "Quality" },
        ageing: { "0-30 Days": 150, "31-90 Days": 100, "90+ Days": 60 },
        inTransit: 20,
        reorderAlerts: ["Frozen Material - Type B"],
        bins: ["Cold Rack 1", "Cold Rack 2"],
    },
];

const WarehouseManagement: React.FC = () => {
    const dispatch = useDispatch();

    const { warehouses, loading } = useSelector((state: any) => state.warehouse);

    const [showWarehouseForm, setShowWarehouseForm] = useState(false);
    const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchWarehouses({ page: 1, limit: 20 }));
    }, []);


    const handleAdd = () => {
        setEditingWarehouseId(null);
        setShowWarehouseForm(true);
    };

    const handleEdit = (id: string) => {
        setEditingWarehouseId(id);
        setShowWarehouseForm(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this warehouse?")) {
            dispatch(deleteWarehouse(id));

        }
    };

    const handleCloseForm = () => {
        setShowWarehouseForm(false);
        setEditingWarehouseId(null);
    };

    const handleSubmit = (formData: any) => {
        const payload = {
            name: formData.name,
            type: formData.type,
            location: formData.location,
            capacity: Number(formData.capacity),
            totalItems: Number(formData.totalItems),
            categories: {
                raw: Number(formData.raw),
                finished: Number(formData.finished),
                consumables: Number(formData.consumables),
            },
            lastGRN: formData.lastGRN?.date
                ? { ...formData.lastGRN, qty: Number(formData.lastGRN.qty) }
                : null,
            lastIssue: formData.lastIssue?.date
                ? { ...formData.lastIssue, qty: Number(formData.lastIssue.qty) }
                : null,
            ageing: {
                "0-30 Days": Number(formData.ageing30),
                "31-90 Days": Number(formData.ageing90),
                "90+ Days": Number(formData.ageingPlus),
            },
            inTransit: Number(formData.inTransit),
            reorderAlerts: formData.reorderAlerts
                .split(",")
                .map((s: string) => s.trim()),
            bins: formData.bins.split(",").map((s: string) => s.trim()),
        };

        if (editingWarehouseId) {
            dispatch(updateWarehouse({ id: editingWarehouseId, data: payload }));
        } else {
            dispatch(addWarehouse(payload));
        }

        handleCloseForm();
    };

    const WarehouseForm = ({ initialData }: { initialData?: WarehouseData }) => {
        const [formData, setFormData] = useState({
            name: initialData?.name || '',
            type: initialData?.type || 'General',
            location: initialData?.location || '',
            capacity: initialData?.capacity?.toString() || '0',
            totalItems: initialData?.totalItems?.toString() || '0',
            raw: initialData?.categories?.raw?.toString() || '0',
            finished: initialData?.categories?.finished?.toString() || '0',
            consumables: initialData?.categories?.consumables?.toString() || '0',
            lastGRN: {
                date: initialData?.lastGRN?.date || '',
                qty: initialData?.lastGRN?.qty?.toString() || '',
                po: initialData?.lastGRN?.po || '',
            },
            lastIssue: {
                date: initialData?.lastIssue?.date || '',
                qty: initialData?.lastIssue?.qty?.toString() || '',
                dept: initialData?.lastIssue?.dept || '',
            },
            ageing30: initialData?.ageing?.["0-30 Days"]?.toString() || '0',
            ageing90: initialData?.ageing?.["31-90 Days"]?.toString() || '0',
            ageingPlus: initialData?.ageing?.["90+ Days"]?.toString() || '0',
            inTransit: initialData?.inTransit?.toString() || '0',
            reorderAlerts: initialData?.reorderAlerts?.join(', ') || '',
            bins: initialData?.bins?.join(', ') || '',
        });

        const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setFormData(prev => ({ ...prev, [field]: e.target.value }));
        };

        const handleNested = (parent: 'lastGRN' | 'lastIssue', field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [field]: e.target.value }
            }));
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{editingWarehouseId ? 'Edit' : 'Add'} Warehouse</h2>
                        <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700">
                            <XCircle className="w-8 h-8" />
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(formData); }} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input required value={formData.name} onChange={handleChange('name')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select value={formData.type} onChange={handleChange('type')} className="w-full px-4 py-2 border rounded-lg">
                                    <option>General</option>
                                    <option>Cold Storage</option>
                                    <option>Bonded</option>
                                    <option>Quarantine</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Location *</label>
                                <input required value={formData.location} onChange={handleChange('location')} className="w-full px-4 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Capacity %</label>
                                <input type="number" min="0" max="100" value={formData.capacity} onChange={handleChange('capacity')} className="w-full px-4 py-2 border rounded-lg" />
                            </div>
                        </div>

                        {/* Stock Summary */}
                        <div>
                            <h3 className="font-semibold mb-3">Category-wise Stock</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <input placeholder="Raw Materials" type="number" value={formData.raw} onChange={handleChange('raw')} className="px-4 py-2 border rounded-lg" />
                                <input placeholder="Finished Goods" type="number" value={formData.finished} onChange={handleChange('finished')} className="px-4 py-2 border rounded-lg" />
                                <input placeholder="Consumables" type="number" value={formData.consumables} onChange={handleChange('consumables')} className="px-4 py-2 border rounded-lg" />
                            </div>
                        </div>

                        {/* Last Transactions */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold mb-2">Last GRN</h3>
                                <input placeholder="Date (e.g. 18 Nov 2025)" value={formData.lastGRN.date} onChange={handleNested('lastGRN', 'date')} className="w-full mb-2 px-4 py-2 border rounded-lg" />
                                <input placeholder="Quantity" type="number" value={formData.lastGRN.qty} onChange={handleNested('lastGRN', 'qty')} className="w-full mb-2 px-4 py-2 border rounded-lg" />
                                <input placeholder="PO Number" value={formData.lastGRN.po} onChange={handleNested('lastGRN', 'po')} className="w-full px-4 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Last Issue</h3>
                                <input placeholder="Date" value={formData.lastIssue.date} onChange={handleNested('lastIssue', 'date')} className="w-full mb-2 px-4 py-2 border rounded-lg" />
                                <input placeholder="Quantity" type="number" value={formData.lastIssue.qty} onChange={handleNested('lastIssue', 'qty')} className="w-full mb-2 px-4 py-2 border rounded-lg" />
                                <input placeholder="Department" value={formData.lastIssue.dept} onChange={handleNested('lastIssue', 'dept')} className="w-full px-4 py-2 border rounded-lg" />
                            </div>
                        </div>

                        {/* Ageing & Transit */}
                        <div>
                            <h3 className="font-semibold mb-2">Stock Ageing</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <input placeholder="0-30 Days" type="number" value={formData.ageing30} onChange={handleChange('ageing30')} className="px-4 py-2 border rounded-lg" />
                                <input placeholder="31-90 Days" type="number" value={formData.ageing90} onChange={handleChange('ageing90')} className="px-4 py-2 border rounded-lg" />
                                <input placeholder="90+ Days" type="number" value={formData.ageingPlus} onChange={handleChange('ageingPlus')} className="px-4 py-2 border rounded-lg" />
                            </div>
                            <input placeholder="In Transit" type="number" value={formData.inTransit} onChange={handleChange('inTransit')} className="w-full mt-3 px-4 py-2 border rounded-lg" />
                        </div>

                        {/* Lists */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Reorder Alerts (comma separated)</label>
                            <input value={formData.reorderAlerts} onChange={handleChange('reorderAlerts')} className="w-full px-4 py-2 border rounded-lg" placeholder="Item A, Item B" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bins/Racks (comma separated)</label>
                            <input value={formData.bins} onChange={handleChange('bins')} className="w-full px-4 py-2 border rounded-lg" placeholder="A1, B2, Cold-01" />
                        </div>

                        <div className="flex justify-end gap-4 pt-6">
                            <Button type="button" variant="outline" onClick={handleCloseForm}>Cancel</Button>
                            <Button type="submit">{editingWarehouseId ? 'Update' : 'Create'} Warehouse</Button>
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
                    <Warehouse className="text-blue-600" />
                    Warehouse Management
                </h1>
                <Button onClick={handleAdd} className="flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Warehouse
                </Button>
            </div>

            {showWarehouseForm && (
                <WarehouseForm initialData={editingWarehouseId ? warehouses.find(w => w.id === editingWarehouseId) : undefined} />
            )}

            <Accordion type="single" collapsible className="space-y-4">
                {warehouses.map((w) => (
                    <AccordionItem key={w.id} value={w.id} className="border rounded-xl shadow-md overflow-hidden">
                        <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                            <div className="grid grid-cols-12 w-full items-center text-left gap-4">
                                <div className="col-span-4 font-semibold flex items-center gap-3">
                                    <Package className="text-blue-600" />
                                    {w.name}
                                </div>
                                <div className="col-span-2">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        {w.type}
                                    </span>
                                </div>
                                <div className="col-span-3 text-sm text-gray-600 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> {w.location}
                                </div>
                                <div className="col-span-2 text-right font-medium">{w.totalItems} items</div>
                                <div className="col-span-1 text-right font-bold text-blue-600">{w.capacity}%</div>
                            </div>
                        </AccordionTrigger>

                        <AccordionContent className="bg-gray-50 px-6 py-6 border-t">
                            <div className="flex justify-end gap-4 mb-6">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(w.id)}>
                                    <Edit className="w-4 h-4 mr-2" /> Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(w.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Category Summary</h4>
                                    <ul className="space-y-1">
                                        <li>Raw Materials: <strong>{w.categories.raw}</strong></li>
                                        <li>Finished Goods: <strong>{w.categories.finished}</strong></li>
                                        <li>Consumables: <strong>{w.categories.consumables}</strong></li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Last Transactions</h4>
                                    {w.lastGRN && (
                                        <div className="mb-3">
                                            <p className="font-medium text-green-700">GRN</p>
                                            <p>{w.lastGRN.date} • {w.lastGRN.qty} units • PO: {w.lastGRN.po}</p>
                                        </div>
                                    )}
                                    {w.lastIssue && (
                                        <div>
                                            <p className="font-medium text-blue-700">Issue</p>
                                            <p>{w.lastIssue.date} • {w.lastIssue.qty} units • {w.lastIssue.dept}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Stock Health</h4>
                                    <p>In Transit: <strong>{w.inTransit}</strong></p>
                                    <div className="mt-2 space-y-1">
                                        <p>0-30 Days: <strong>{w.ageing["0-30 Days"]}</strong></p>
                                        <p>31-90 Days: <strong>{w.ageing["31-90 Days"]}</strong></p>
                                        <p>90+ Days: <strong>{w.ageing["90+ Days"]}</strong></p>
                                    </div>
                                </div>
                            </div>

                            {(w.reorderAlerts.length > 0 || w.bins.length > 0) && (
                                <div className="grid md:grid-cols-2 gap-8 mt-8">
                                    {w.reorderAlerts.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-red-600 mb-2">Reorder Alerts</h4>
                                            <ul className="space-y-1">
                                                {w.reorderAlerts.map((alert, i) => (
                                                    <li key={i} className="text-red-600">• {alert}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {w.bins.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Bins / Racks</h4>
                                            <p className="text-sm text-gray-600">{w.bins.join(" • ")}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default WarehouseManagement;