import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
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
import type { BreakdownMaintenance, Equipment } from '../../../types/plantMachinery';

const BreakdownMaintenancePage: React.FC = () => {
  const [breakdowns, setBreakdowns] = useState<BreakdownMaintenance[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBreakdown, setEditingBreakdown] = useState<BreakdownMaintenance | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<BreakdownMaintenance>>({
    equipmentId: '',
    equipmentName: '',
    reportedBy: '',
    reportedDate: '',
    breakdownType: 'mechanical',
    severity: 'medium',
    description: '',
    symptoms: '',
    assignedTechnician: '',
    diagnosisDate: '',
    diagnosis: '',
    repairStartDate: '',
    repairEndDate: '',
    downtime: 0,
    spareParts: [],
    labourCost: 0,
    totalCost: 0,
    rootCause: '',
    correctiveAction: '',
    preventiveAction: '',
    status: 'reported',
    attachments: [],
  });

  useEffect(() => {
    setBreakdowns(getFromStorage<BreakdownMaintenance>(PM_STORAGE_KEYS.BREAKDOWN_MAINTENANCE));
    setEquipment(getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId);
    
    const breakdownData: BreakdownMaintenance = {
      ...formData,
      id: editingBreakdown?.id || generateId(),
      equipmentId: formData.equipmentId!,
      equipmentName: selectedEquipment?.name || formData.equipmentName!,
      reportedBy: formData.reportedBy!,
      reportedDate: formData.reportedDate!,
      breakdownType: formData.breakdownType!,
      severity: formData.severity!,
      description: formData.description!,
      symptoms: formData.symptoms!,
      assignedTechnician: formData.assignedTechnician!,
      diagnosis: formData.diagnosis!,
      downtime: formData.downtime!,
      spareParts: formData.spareParts || [],
      labourCost: formData.labourCost!,
      totalCost: formData.totalCost!,
      rootCause: formData.rootCause!,
      correctiveAction: formData.correctiveAction!,
      preventiveAction: formData.preventiveAction!,
      status: formData.status!,
      attachments: formData.attachments || [],
      createdAt: editingBreakdown?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as BreakdownMaintenance;

    if (editingBreakdown) {
      const updated = breakdowns.map(b => b.id === editingBreakdown.id ? breakdownData : b);
      setBreakdowns(updated);
      saveToStorage(PM_STORAGE_KEYS.BREAKDOWN_MAINTENANCE, updated);
      toast({ title: 'Breakdown record updated successfully' });
    } else {
      const updated = [...breakdowns, breakdownData];
      setBreakdowns(updated);
      saveToStorage(PM_STORAGE_KEYS.BREAKDOWN_MAINTENANCE, updated);
      toast({ title: 'Breakdown reported successfully' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingBreakdown(null);
    setFormData({
      equipmentId: '',
      equipmentName: '',
      reportedBy: '',
      reportedDate: '',
      breakdownType: 'mechanical',
      severity: 'medium',
      description: '',
      symptoms: '',
      assignedTechnician: '',
      diagnosisDate: '',
      diagnosis: '',
      repairStartDate: '',
      repairEndDate: '',
      downtime: 0,
      spareParts: [],
      labourCost: 0,
      totalCost: 0,
      rootCause: '',
      correctiveAction: '',
      preventiveAction: '',
      status: 'reported',
      attachments: [],
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Breakdown Maintenance</h1>
          <p className="text-muted-foreground">Handle equipment failures and repairs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} variant="destructive">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Breakdown
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBreakdown ? 'Edit Breakdown' : 'Report Breakdown'}</DialogTitle>
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
                        <SelectItem key={eq.id} value={eq.id}>{eq.equipmentCode} - {eq.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reported By *</Label>
                  <Input value={formData.reportedBy} onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })} required />
                </div>
                <div>
                  <Label>Reported Date *</Label>
                  <Input type="date" value={formData.reportedDate} onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })} required />
                </div>
                <div>
                  <Label>Breakdown Type *</Label>
                  <Select value={formData.breakdownType} onValueChange={(value: any) => setFormData({ ...formData, breakdownType: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mechanical">Mechanical</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="hydraulic">Hydraulic</SelectItem>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity *</Label>
                  <Select value={formData.severity} onValueChange={(value: any) => setFormData({ ...formData, severity: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Description *</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={2} />
                </div>
                <div className="col-span-2">
                  <Label>Symptoms *</Label>
                  <Textarea value={formData.symptoms} onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} required rows={2} />
                </div>
                <div>
                  <Label>Assigned Technician *</Label>
                  <Input value={formData.assignedTechnician} onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })} required />
                </div>
                <div>
                  <Label>Downtime (hours)</Label>
                  <Input type="number" value={formData.downtime} onChange={(e) => setFormData({ ...formData, downtime: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <Label>Labour Cost</Label>
                  <Input type="number" value={formData.labourCost} onChange={(e) => setFormData({ ...formData, labourCost: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <Input type="number" value={formData.totalCost} onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reported">Reported</SelectItem>
                      <SelectItem value="diagnosed">Diagnosed</SelectItem>
                      <SelectItem value="in-repair">In Repair</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Diagnosis</Label>
                  <Textarea value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} rows={2} />
                </div>
                <div className="col-span-2">
                  <Label>Root Cause</Label>
                  <Textarea value={formData.rootCause} onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })} rows={2} />
                </div>
                <div className="col-span-2">
                  <Label>Corrective Action</Label>
                  <Textarea value={formData.correctiveAction} onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingBreakdown ? 'Update' : 'Report'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search breakdowns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Equipment</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Severity</th>
                  <th className="text-left p-3">Reported Date</th>
                  <th className="text-left p-3">Technician</th>
                  <th className="text-left p-3">Downtime</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {breakdowns.filter(b => b.equipmentName.toLowerCase().includes(searchTerm.toLowerCase())).map((breakdown) => (
                  <tr key={breakdown.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{breakdown.equipmentName}</td>
                    <td className="p-3 capitalize">{breakdown.breakdownType}</td>
                    <td className="p-3">
                      <Badge variant={breakdown.severity === 'critical' ? 'destructive' : breakdown.severity === 'high' ? 'destructive' : 'secondary'}>
                        {breakdown.severity}
                      </Badge>
                    </td>
                    <td className="p-3">{new Date(breakdown.reportedDate).toLocaleDateString()}</td>
                    <td className="p-3">{breakdown.assignedTechnician}</td>
                    <td className="p-3">{breakdown.downtime}h</td>
                    <td className="p-3">
                      <Badge variant={breakdown.status === 'completed' ? 'default' : 'secondary'}>{breakdown.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingBreakdown(breakdown); setFormData(breakdown); setIsDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete this breakdown?')) { const updated = breakdowns.filter(b => b.id !== breakdown.id); setBreakdowns(updated); saveToStorage(PM_STORAGE_KEYS.BREAKDOWN_MAINTENANCE, updated); toast({ title: 'Deleted' }); } }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {breakdowns.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No breakdowns reported</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BreakdownMaintenancePage;
