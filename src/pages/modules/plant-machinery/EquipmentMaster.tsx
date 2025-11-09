import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../hooks/use-toast';
import { getFromStorage, saveToStorage, PM_STORAGE_KEYS, generateId } from '../../../utils/plantMachineryStorage';
import type { Equipment } from '../../../types/plantMachinery';

const EquipmentMaster: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Equipment>>({
    equipmentCode: '',
    name: '',
    model: '',
    manufacturer: '',
    supplier: '',
    serialNumber: '',
    assetNumber: '',
    category: 'heavy-machinery',
    type: '',
    purchaseDate: '',
    purchaseCost: 0,
    warrantyExpiry: '',
    location: '',
    department: '',
    project: '',
    operatingCapacity: '',
    specifications: '',
    maintenanceFrequency: 'monthly',
    depreciationMethod: 'straight-line',
    depreciationRate: 10,
    currentValue: 0,
    insurance: {
      provider: '',
      policyNumber: '',
      expiryDate: '',
    },
    status: 'operational',
    documents: [],
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = () => {
    const data = getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT);
    setEquipment(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const equipmentData: Equipment = {
      ...formData,
      id: editingEquipment?.id || generateId(),
      equipmentCode: formData.equipmentCode!,
      name: formData.name!,
      model: formData.model!,
      manufacturer: formData.manufacturer!,
      supplier: formData.supplier!,
      serialNumber: formData.serialNumber!,
      assetNumber: formData.assetNumber!,
      category: formData.category!,
      type: formData.type!,
      purchaseDate: formData.purchaseDate!,
      purchaseCost: formData.purchaseCost!,
      warrantyExpiry: formData.warrantyExpiry!,
      location: formData.location!,
      department: formData.department!,
      operatingCapacity: formData.operatingCapacity!,
      specifications: formData.specifications!,
      maintenanceFrequency: formData.maintenanceFrequency!,
      depreciationMethod: formData.depreciationMethod!,
      depreciationRate: formData.depreciationRate!,
      currentValue: formData.currentValue!,
      insurance: formData.insurance!,
      status: formData.status!,
      documents: formData.documents!,
      createdAt: editingEquipment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Equipment;

    if (editingEquipment) {
      const updated = equipment.map(e => e.id === editingEquipment.id ? equipmentData : e);
      setEquipment(updated);
      saveToStorage(PM_STORAGE_KEYS.EQUIPMENT, updated);
      toast({ title: 'Equipment updated successfully' });
    } else {
      const updated = [...equipment, equipmentData];
      setEquipment(updated);
      saveToStorage(PM_STORAGE_KEYS.EQUIPMENT, updated);
      toast({ title: 'Equipment added successfully' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormData(eq);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      const updated = equipment.filter(e => e.id !== id);
      setEquipment(updated);
      saveToStorage(PM_STORAGE_KEYS.EQUIPMENT, updated);
      toast({ title: 'Equipment deleted successfully' });
    }
  };

  const resetForm = () => {
    setEditingEquipment(null);
    setFormData({
      equipmentCode: '',
      name: '',
      model: '',
      manufacturer: '',
      supplier: '',
      serialNumber: '',
      assetNumber: '',
      category: 'heavy-machinery',
      type: '',
      purchaseDate: '',
      purchaseCost: 0,
      warrantyExpiry: '',
      location: '',
      department: '',
      project: '',
      operatingCapacity: '',
      specifications: '',
      maintenanceFrequency: 'monthly',
      depreciationMethod: 'straight-line',
      depreciationRate: 10,
      currentValue: 0,
      insurance: {
        provider: '',
        policyNumber: '',
        expiryDate: '',
      },
      status: 'operational',
      documents: [],
    });
  };

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = 
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || eq.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipment Master</h1>
          <p className="text-muted-foreground">Manage all plant and machinery assets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Equipment Code *</Label>
                  <Input
                    value={formData.equipmentCode}
                    onChange={(e) => setFormData({ ...formData, equipmentCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Equipment Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heavy-machinery">Heavy Machinery</SelectItem>
                      <SelectItem value="light-machinery">Light Machinery</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type *</Label>
                  <Input
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Manufacturer</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Serial Number</Label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Asset Number</Label>
                  <Input
                    value={formData.assetNumber}
                    onChange={(e) => setFormData({ ...formData, assetNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Purchase Date *</Label>
                  <Input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Purchase Cost *</Label>
                  <Input
                    type="number"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Current Value</Label>
                  <Input
                    type="number"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Warranty Expiry</Label>
                  <Input
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Department *</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Project</Label>
                  <Input
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Maintenance Frequency</Label>
                  <Select value={formData.maintenanceFrequency} onValueChange={(value: any) => setFormData({ ...formData, maintenanceFrequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="under-maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="breakdown">Breakdown</SelectItem>
                      <SelectItem value="idle">Idle</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Operating Capacity</Label>
                  <Input
                    value={formData.operatingCapacity}
                    onChange={(e) => setFormData({ ...formData, operatingCapacity: e.target.value })}
                    placeholder="e.g., 50 tons, 500 HP"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Specifications</Label>
                  <Textarea
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEquipment ? 'Update' : 'Add'} Equipment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="under-maintenance">Under Maintenance</SelectItem>
                <SelectItem value="breakdown">Breakdown</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Purchase Cost</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono text-sm">{eq.equipmentCode}</td>
                    <td className="p-3 font-medium">{eq.name}</td>
                    <td className="p-3 capitalize">{eq.category.replace('-', ' ')}</td>
                    <td className="p-3">{eq.location}</td>
                    <td className="p-3">{eq.department}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          eq.status === 'operational' ? 'default' :
                          eq.status === 'under-maintenance' ? 'secondary' :
                          eq.status === 'breakdown' ? 'destructive' : 'outline'
                        }
                      >
                        {eq.status}
                      </Badge>
                    </td>
                    <td className="p-3">₹{eq.purchaseCost.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(eq)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(eq.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEquipment.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No equipment found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentMaster;
