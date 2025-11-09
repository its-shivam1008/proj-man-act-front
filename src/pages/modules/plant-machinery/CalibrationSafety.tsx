import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield } from 'lucide-react';
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
import type { CalibrationSafety, Equipment } from '../../../types/plantMachinery';

const CalibrationSafetyPage: React.FC = () => {
  const [certificates, setCertificates] = useState<CalibrationSafety[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<CalibrationSafety>>({
    equipmentId: '',
    equipmentName: '',
    certificationType: 'calibration',
    certificateNumber: '',
    issuedBy: '',
    issuedDate: '',
    expiryDate: '',
    nextDueDate: '',
    inspectionAgency: '',
    result: 'pass',
    findings: '',
    recommendations: '',
    cost: 0,
    operatorTraining: [],
    status: 'valid',
    documents: [],
  });

  useEffect(() => {
    setCertificates(getFromStorage<CalibrationSafety>(PM_STORAGE_KEYS.CALIBRATION_SAFETY));
    setEquipment(getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId);
    
    const certData: CalibrationSafety = {
      ...formData,
      id: generateId(),
      equipmentId: formData.equipmentId!,
      equipmentName: selectedEquipment?.name || formData.equipmentName!,
      certificationType: formData.certificationType!,
      certificateNumber: formData.certificateNumber!,
      issuedBy: formData.issuedBy!,
      issuedDate: formData.issuedDate!,
      expiryDate: formData.expiryDate!,
      nextDueDate: formData.nextDueDate!,
      inspectionAgency: formData.inspectionAgency!,
      result: formData.result!,
      findings: formData.findings!,
      recommendations: formData.recommendations!,
      cost: formData.cost!,
      operatorTraining: formData.operatorTraining || [],
      status: formData.status!,
      documents: formData.documents || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as CalibrationSafety;

    const updated = [...certificates, certData];
    setCertificates(updated);
    saveToStorage(PM_STORAGE_KEYS.CALIBRATION_SAFETY, updated);
    toast({ title: 'Certificate added successfully' });
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      equipmentId: '',
      equipmentName: '',
      certificationType: 'calibration',
      certificateNumber: '',
      issuedBy: '',
      issuedDate: '',
      expiryDate: '',
      nextDueDate: '',
      inspectionAgency: '',
      result: 'pass',
      findings: '',
      recommendations: '',
      cost: 0,
      operatorTraining: [],
      status: 'valid',
      documents: [],
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Calibration & Safety</h1>
          <p className="text-muted-foreground">Manage certificates and compliance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Calibration/Safety Certificate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Equipment *</Label>
                  <Select value={formData.equipmentId} onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}>
                    <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                    <SelectContent>
                      {equipment.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>{eq.equipmentCode} - {eq.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Certificate Type *</Label>
                  <Select value={formData.certificationType} onValueChange={(value: any) => setFormData({ ...formData, certificationType: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calibration">Calibration</SelectItem>
                      <SelectItem value="safety-inspection">Safety Inspection</SelectItem>
                      <SelectItem value="load-test">Load Test</SelectItem>
                      <SelectItem value="pressure-test">Pressure Test</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Certificate Number *</Label>
                  <Input value={formData.certificateNumber} onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })} required />
                </div>
                <div>
                  <Label>Issued By *</Label>
                  <Input value={formData.issuedBy} onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })} required />
                </div>
                <div>
                  <Label>Inspection Agency *</Label>
                  <Input value={formData.inspectionAgency} onChange={(e) => setFormData({ ...formData, inspectionAgency: e.target.value })} required />
                </div>
                <div>
                  <Label>Issued Date *</Label>
                  <Input type="date" value={formData.issuedDate} onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })} required />
                </div>
                <div>
                  <Label>Expiry Date *</Label>
                  <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} required />
                </div>
                <div>
                  <Label>Next Due Date *</Label>
                  <Input type="date" value={formData.nextDueDate} onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })} required />
                </div>
                <div>
                  <Label>Cost</Label>
                  <Input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <Label>Result *</Label>
                  <Select value={formData.result} onValueChange={(value: any) => setFormData({ ...formData, result: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Findings</Label>
                  <Textarea value={formData.findings} onChange={(e) => setFormData({ ...formData, findings: e.target.value })} rows={2} />
                </div>
                <div className="col-span-2">
                  <Label>Recommendations</Label>
                  <Textarea value={formData.recommendations} onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Certificate</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search certificates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Equipment</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Certificate No</th>
                  <th className="text-left p-3">Issued Date</th>
                  <th className="text-left p-3">Expiry Date</th>
                  <th className="text-left p-3">Result</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {certificates.filter(c => c.equipmentName.toLowerCase().includes(searchTerm.toLowerCase())).map((cert) => (
                  <tr key={cert.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{cert.equipmentName}</td>
                    <td className="p-3 capitalize">{cert.certificationType.replace('-', ' ')}</td>
                    <td className="p-3">{cert.certificateNumber}</td>
                    <td className="p-3">{new Date(cert.issuedDate).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(cert.expiryDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Badge variant={cert.result === 'pass' ? 'default' : cert.result === 'fail' ? 'destructive' : 'secondary'}>
                        {cert.result}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={cert.status === 'valid' ? 'default' : cert.status === 'expired' ? 'destructive' : 'secondary'}>
                        {cert.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {certificates.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No certificates found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalibrationSafetyPage;
