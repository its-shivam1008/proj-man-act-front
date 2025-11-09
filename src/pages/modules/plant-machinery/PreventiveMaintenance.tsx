import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
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
import type { PreventiveMaintenance, Equipment } from '../../../types/plantMachinery';

const PreventiveMaintenancePage: React.FC = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<PreventiveMaintenance[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PreventiveMaintenance | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<PreventiveMaintenance>>({
    equipmentId: '',
    equipmentName: '',
    maintenanceType: 'time-based',
    frequency: '',
    intervalHours: 0,
    intervalDays: 0,
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    assignedTechnician: '',
    estimatedDuration: 0,
    checklist: [],
    spareParts: [],
    totalCost: 0,
    status: 'scheduled',
    completionDate: '',
    remarks: '',
  });

  useEffect(() => {
    loadMaintenanceRecords();
    loadEquipment();
  }, []);

  const loadMaintenanceRecords = () => {
    const data = getFromStorage<PreventiveMaintenance>(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE);
    setMaintenanceRecords(data);
  };

  const loadEquipment = () => {
    const data = getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT);
    setEquipment(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId);
    
    const maintenanceData: PreventiveMaintenance = {
      ...formData,
      id: editingRecord?.id || generateId(),
      equipmentId: formData.equipmentId!,
      equipmentName: selectedEquipment?.name || formData.equipmentName!,
      maintenanceType: formData.maintenanceType!,
      frequency: formData.frequency!,
      intervalHours: formData.intervalHours || 0,
      intervalDays: formData.intervalDays || 0,
      lastMaintenanceDate: formData.lastMaintenanceDate!,
      nextMaintenanceDate: formData.nextMaintenanceDate!,
      assignedTechnician: formData.assignedTechnician!,
      estimatedDuration: formData.estimatedDuration!,
      checklist: formData.checklist || [],
      spareParts: formData.spareParts || [],
      totalCost: formData.totalCost!,
      status: formData.status!,
      remarks: formData.remarks!,
      createdAt: editingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as PreventiveMaintenance;

    if (editingRecord) {
      const updated = maintenanceRecords.map(m => m.id === editingRecord.id ? maintenanceData : m);
      setMaintenanceRecords(updated);
      saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
      toast({ title: 'Maintenance record updated successfully' });
    } else {
      const updated = [...maintenanceRecords, maintenanceData];
      setMaintenanceRecords(updated);
      saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
      toast({ title: 'Maintenance scheduled successfully' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (record: PreventiveMaintenance) => {
    setEditingRecord(record);
    setFormData(record);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
      const updated = maintenanceRecords.filter(m => m.id !== id);
      setMaintenanceRecords(updated);
      saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
      toast({ title: 'Maintenance record deleted successfully' });
    }
  };

  const handleComplete = (id: string) => {
    const updated = maintenanceRecords.map(m =>
      m.id === id ? { ...m, status: 'completed' as const, completionDate: new Date().toISOString() } : m
    );
    setMaintenanceRecords(updated);
    saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
    toast({ title: 'Maintenance marked as completed' });
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      equipmentId: '',
      equipmentName: '',
      maintenanceType: 'time-based',
      frequency: '',
      intervalHours: 0,
      intervalDays: 0,
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      assignedTechnician: '',
      estimatedDuration: 0,
      checklist: [],
      spareParts: [],
      totalCost: 0,
      status: 'scheduled',
      completionDate: '',
      remarks: '',
    });
  };

  const filteredRecords = maintenanceRecords.filter(record => {
    const matchesSearch =
      record.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assignedTechnician.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Preventive Maintenance</h1>
          <p className="text-muted-foreground">Schedule and track preventive maintenance activities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit Maintenance' : 'Schedule Maintenance'}</DialogTitle>
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
                          {eq.equipmentCode} - {eq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Maintenance Type *</Label>
                  <Select value={formData.maintenanceType} onValueChange={(value: any) => setFormData({ ...formData, maintenanceType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time-based">Time-based</SelectItem>
                      <SelectItem value="usage-based">Usage-based</SelectItem>
                      <SelectItem value="condition-based">Condition-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequency *</Label>
                  <Input
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    placeholder="e.g., Monthly, 500 hours"
                    required
                  />
                </div>
                {formData.maintenanceType === 'usage-based' && (
                  <div>
                    <Label>Interval Hours</Label>
                    <Input
                      type="number"
                      value={formData.intervalHours}
                      onChange={(e) => setFormData({ ...formData, intervalHours: parseInt(e.target.value) })}
                    />
                  </div>
                )}
                {formData.maintenanceType === 'time-based' && (
                  <div>
                    <Label>Interval Days</Label>
                    <Input
                      type="number"
                      value={formData.intervalDays}
                      onChange={(e) => setFormData({ ...formData, intervalDays: parseInt(e.target.value) })}
                    />
                  </div>
                )}
                <div>
                  <Label>Last Maintenance Date *</Label>
                  <Input
                    type="date"
                    value={formData.lastMaintenanceDate}
                    onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Next Maintenance Date *</Label>
                  <Input
                    type="date"
                    value={formData.nextMaintenanceDate}
                    onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Assigned Technician *</Label>
                  <Input
                    value={formData.assignedTechnician}
                    onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Estimated Duration (hours) *</Label>
                  <Input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <Input
                    type="number"
                    value={formData.totalCost}
                    onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.status === 'completed' && (
                  <div>
                    <Label>Completion Date</Label>
                    <Input
                      type="date"
                      value={formData.completionDate}
                      onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                    />
                  </div>
                )}
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
                  {editingRecord ? 'Update' : 'Schedule'}
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
                  placeholder="Search maintenance records..."
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Equipment</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Frequency</th>
                  <th className="text-left p-3">Next Due</th>
                  <th className="text-left p-3">Technician</th>
                  <th className="text-left p-3">Duration</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{record.equipmentName}</td>
                    <td className="p-3 capitalize">{record.maintenanceType.replace('-', ' ')}</td>
                    <td className="p-3">{record.frequency}</td>
                    <td className="p-3">{new Date(record.nextMaintenanceDate).toLocaleDateString()}</td>
                    <td className="p-3">{record.assignedTechnician}</td>
                    <td className="p-3">{record.estimatedDuration}h</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          record.status === 'completed' ? 'default' :
                          record.status === 'in-progress' ? 'secondary' :
                          record.status === 'overdue' ? 'destructive' : 'outline'
                        }
                      >
                        {record.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {record.status !== 'completed' && (
                          <Button size="sm" variant="ghost" onClick={() => handleComplete(record.id)}>
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(record)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(record.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No maintenance records found
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

export default PreventiveMaintenancePage;
