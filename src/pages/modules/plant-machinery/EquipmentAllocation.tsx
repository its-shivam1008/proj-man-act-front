import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../hooks/use-toast';
import { getFromStorage, saveToStorage, PM_STORAGE_KEYS, generateId } from '../../../utils/plantMachineryStorage';
import type { EquipmentAllocation, Equipment } from '../../../types/plantMachinery';

const EquipmentAllocationPage: React.FC = () => {
  const [allocations, setAllocations] = useState<EquipmentAllocation[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<EquipmentAllocation | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<EquipmentAllocation>>({
    equipmentId: '',
    equipmentName: '',
    allocationType: 'project',
    allocatedTo: '',
    operator: '',
    shift: 'day',
    startDate: '',
    endDate: '',
    workingHours: 0,
    idleHours: 0,
    fuelConsumption: 0,
    powerConsumption: 0,
    meterReading: 0,
    status: 'active',
    remarks: '',
  });

  useEffect(() => {
    loadAllocations();
    loadEquipment();
  }, []);

  const loadAllocations = () => {
    const data = getFromStorage<EquipmentAllocation>(PM_STORAGE_KEYS.ALLOCATIONS);
    setAllocations(data);
  };

  const loadEquipment = () => {
    const data = getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT);
    setEquipment(data.filter(e => e.status === 'operational' || e.status === 'idle'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId);
    
    const allocationData: EquipmentAllocation = {
      ...formData,
      id: editingAllocation?.id || generateId(),
      equipmentId: formData.equipmentId!,
      equipmentName: selectedEquipment?.name || formData.equipmentName!,
      allocationType: formData.allocationType!,
      allocatedTo: formData.allocatedTo!,
      operator: formData.operator!,
      shift: formData.shift!,
      startDate: formData.startDate!,
      workingHours: formData.workingHours!,
      idleHours: formData.idleHours!,
      fuelConsumption: formData.fuelConsumption!,
      powerConsumption: formData.powerConsumption!,
      meterReading: formData.meterReading!,
      status: formData.status!,
      remarks: formData.remarks!,
      createdAt: editingAllocation?.createdAt || new Date().toISOString(),
    } as EquipmentAllocation;

    if (editingAllocation) {
      const updated = allocations.map(a => a.id === editingAllocation.id ? allocationData : a);
      setAllocations(updated);
      saveToStorage(PM_STORAGE_KEYS.ALLOCATIONS, updated);
      toast({ title: 'Allocation updated successfully' });
    } else {
      const updated = [...allocations, allocationData];
      setAllocations(updated);
      saveToStorage(PM_STORAGE_KEYS.ALLOCATIONS, updated);
      toast({ title: 'Equipment allocated successfully' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (allocation: EquipmentAllocation) => {
    setEditingAllocation(allocation);
    setFormData(allocation);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      const updated = allocations.filter(a => a.id !== id);
      setAllocations(updated);
      saveToStorage(PM_STORAGE_KEYS.ALLOCATIONS, updated);
      toast({ title: 'Allocation deleted successfully' });
    }
  };

  const resetForm = () => {
    setEditingAllocation(null);
    setFormData({
      equipmentId: '',
      equipmentName: '',
      allocationType: 'project',
      allocatedTo: '',
      operator: '',
      shift: 'day',
      startDate: '',
      endDate: '',
      workingHours: 0,
      idleHours: 0,
      fuelConsumption: 0,
      powerConsumption: 0,
      meterReading: 0,
      status: 'active',
      remarks: '',
    });
  };

  const filteredAllocations = allocations.filter(allocation =>
    allocation.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allocation.allocatedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allocation.operator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipment Allocation</h1>
          <p className="text-muted-foreground">Track equipment usage and allocation</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Allocate Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAllocation ? 'Edit Allocation' : 'Allocate Equipment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Equipment *</Label>
                  <Select value={formData.equipmentId} onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.equipmentCode} - {eq.name} ({eq.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Allocation Type *</Label>
                  <Select value={formData.allocationType} onValueChange={(value: any) => setFormData({ ...formData, allocationType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="production-line">Production Line</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Allocated To *</Label>
                  <Input
                    value={formData.allocatedTo}
                    onChange={(e) => setFormData({ ...formData, allocatedTo: e.target.value })}
                    placeholder="Project/Department name"
                    required
                  />
                </div>
                <div>
                  <Label>Operator *</Label>
                  <Input
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Shift *</Label>
                  <Select value={formData.shift} onValueChange={(value: any) => setFormData({ ...formData, shift: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                      <SelectItem value="rotating">Rotating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Working Hours</Label>
                  <Input
                    type="number"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Idle Hours</Label>
                  <Input
                    type="number"
                    value={formData.idleHours}
                    onChange={(e) => setFormData({ ...formData, idleHours: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Fuel Consumption (L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.fuelConsumption}
                    onChange={(e) => setFormData({ ...formData, fuelConsumption: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Power Consumption (kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.powerConsumption}
                    onChange={(e) => setFormData({ ...formData, powerConsumption: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Meter Reading</Label>
                  <Input
                    type="number"
                    value={formData.meterReading}
                    onChange={(e) => setFormData({ ...formData, meterReading: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAllocation ? 'Update' : 'Allocate'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search allocations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Equipment</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Allocated To</th>
                  <th className="text-left p-3">Operator</th>
                  <th className="text-left p-3">Shift</th>
                  <th className="text-left p-3">Start Date</th>
                  <th className="text-left p-3">Working Hours</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllocations.map((allocation) => (
                  <tr key={allocation.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{allocation.equipmentName}</td>
                    <td className="p-3 capitalize">{allocation.allocationType.replace('-', ' ')}</td>
                    <td className="p-3">{allocation.allocatedTo}</td>
                    <td className="p-3">{allocation.operator}</td>
                    <td className="p-3 capitalize">{allocation.shift}</td>
                    <td className="p-3">{new Date(allocation.startDate).toLocaleDateString()}</td>
                    <td className="p-3">{allocation.workingHours}h</td>
                    <td className="p-3">
                      <Badge variant={allocation.status === 'active' ? 'default' : 'secondary'}>
                        {allocation.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(allocation)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(allocation.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAllocations.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No allocations found
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

export default EquipmentAllocationPage;
