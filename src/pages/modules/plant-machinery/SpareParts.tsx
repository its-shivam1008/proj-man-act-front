import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { SparePart } from '../../../types/plantMachinery';
import { generateId, getFromStorage, PM_STORAGE_KEYS, saveToStorage } from '../../../utils/plantMachineryStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardHeader } from '@/components/ui/card';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
// import { Checkbox } from '@/components/ui/checkbox';
// import { useToast } from '@/hooks/use-toast';
// import { getFromStorage, saveToStorage, PM_STORAGE_KEYS, generateId } from '@/utils/plantMachineryStorage';
// import type { SparePart } from '@/types/plantMachinery';

const SparePartsPage: React.FC = () => {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<SparePart>>({
    partCode: '',
    partName: '',
    category: '',
    compatibleEquipment: [],
    supplier: '',
    unitPrice: 0,
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderLevel: 0,
    reorderQuantity: 0,
    unit: '',
    location: '',
    isCritical: false,
    leadTime: 0,
    totalConsumption: 0,
    status: 'in-stock',
  });

  useEffect(() => {
    setSpareParts(getFromStorage<SparePart>(PM_STORAGE_KEYS.SPARE_PARTS));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const partData: SparePart = {
      ...formData,
      id: editingPart?.id || generateId(),
      partCode: formData.partCode!,
      partName: formData.partName!,
      category: formData.category!,
      compatibleEquipment: formData.compatibleEquipment || [],
      supplier: formData.supplier!,
      unitPrice: formData.unitPrice!,
      currentStock: formData.currentStock!,
      minStockLevel: formData.minStockLevel!,
      maxStockLevel: formData.maxStockLevel!,
      reorderLevel: formData.reorderLevel!,
      reorderQuantity: formData.reorderQuantity!,
      unit: formData.unit!,
      location: formData.location!,
      isCritical: formData.isCritical!,
      leadTime: formData.leadTime!,
      totalConsumption: formData.totalConsumption!,
      status: formData.status!,
      createdAt: editingPart?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as SparePart;

    if (editingPart) {
      const updated = spareParts.map(p => p.id === editingPart.id ? partData : p);
      setSpareParts(updated);
      saveToStorage(PM_STORAGE_KEYS.SPARE_PARTS, updated);
      toast({ title: 'Spare part updated successfully' });
    } else {
      const updated = [...spareParts, partData];
      setSpareParts(updated);
      saveToStorage(PM_STORAGE_KEYS.SPARE_PARTS, updated);
      toast({ title: 'Spare part added successfully' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingPart(null);
    setFormData({
      partCode: '',
      partName: '',
      category: '',
      compatibleEquipment: [],
      supplier: '',
      unitPrice: 0,
      currentStock: 0,
      minStockLevel: 0,
      maxStockLevel: 0,
      reorderLevel: 0,
      reorderQuantity: 0,
      unit: '',
      location: '',
      isCritical: false,
      leadTime: 0,
      totalConsumption: 0,
      status: 'in-stock',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Spare Parts Management</h1>
          <p className="text-muted-foreground">Track spare parts inventory and consumption</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Spare Part
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPart ? 'Edit Spare Part' : 'Add Spare Part'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Part Code *</Label>
                  <Input value={formData.partCode} onChange={(e) => setFormData({ ...formData, partCode: e.target.value })} required />
                </div>
                <div>
                  <Label>Part Name *</Label>
                  <Input value={formData.partName} onChange={(e) => setFormData({ ...formData, partName: e.target.value })} required />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
                </div>
                <div>
                  <Label>Supplier *</Label>
                  <Input value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} required />
                </div>
                <div>
                  <Label>Unit Price *</Label>
                  <Input type="number" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <Label>Unit *</Label>
                  <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g., pcs, kg, m" required />
                </div>
                <div>
                  <Label>Current Stock *</Label>
                  <Input type="number" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) })} required />
                </div>
                <div>
                  <Label>Min Stock Level *</Label>
                  <Input type="number" value={formData.minStockLevel} onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) })} required />
                </div>
                <div>
                  <Label>Max Stock Level</Label>
                  <Input type="number" value={formData.maxStockLevel} onChange={(e) => setFormData({ ...formData, maxStockLevel: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Reorder Level *</Label>
                  <Input type="number" value={formData.reorderLevel} onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })} required />
                </div>
                <div>
                  <Label>Reorder Quantity *</Label>
                  <Input type="number" value={formData.reorderQuantity} onChange={(e) => setFormData({ ...formData, reorderQuantity: parseInt(e.target.value) })} required />
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                </div>
                <div>
                  <Label>Lead Time (days)</Label>
                  <Input type="number" value={formData.leadTime} onChange={(e) => setFormData({ ...formData, leadTime: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      <SelectItem value="on-order">On Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Checkbox checked={formData.isCritical} onCheckedChange={(checked) => setFormData({ ...formData, isCritical: checked as boolean })} />
                  <Label>Critical Spare Part</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingPart ? 'Update' : 'Add'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search spare parts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Part Code</th>
                  <th className="text-left p-3">Part Name</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Current Stock</th>
                  <th className="text-left p-3">Min Level</th>
                  <th className="text-left p-3">Unit Price</th>
                  <th className="text-left p-3">Critical</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {spareParts.filter(p => p.partName.toLowerCase().includes(searchTerm.toLowerCase()) || p.partCode.toLowerCase().includes(searchTerm.toLowerCase())).map((part) => (
                  <tr key={part.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono text-sm">{part.partCode}</td>
                    <td className="p-3 font-medium">{part.partName}</td>
                    <td className="p-3">{part.category}</td>
                    <td className="p-3">{part.currentStock} {part.unit}</td>
                    <td className="p-3">{part.minStockLevel} {part.unit}</td>
                    <td className="p-3">₹{part.unitPrice}</td>
                    <td className="p-3">{part.isCritical && <Badge variant="destructive">Critical</Badge>}</td>
                    <td className="p-3">
                      <Badge variant={part.status === 'in-stock' ? 'default' : part.status === 'low-stock' ? 'secondary' : 'destructive'}>
                        {part.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingPart(part); setFormData(part); setIsDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete this part?')) { const updated = spareParts.filter(p => p.id !== part.id); setSpareParts(updated); saveToStorage(PM_STORAGE_KEYS.SPARE_PARTS, updated); toast({ title: 'Deleted' }); } }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {spareParts.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No spare parts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SparePartsPage;
