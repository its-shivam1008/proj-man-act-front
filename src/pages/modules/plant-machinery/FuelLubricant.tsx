import React, { useState, useEffect } from 'react';
import { Plus, Search, Fuel } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../hooks/use-toast';
import { getFromStorage, saveToStorage, PM_STORAGE_KEYS, generateId } from '../../../utils/plantMachineryStorage';
import type { FuelLubricant, Equipment } from '../../../types/plantMachinery';

const FuelLubricantPage: React.FC = () => {
  const [fuelRecords, setFuelRecords] = useState<FuelLubricant[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<FuelLubricant>>({
    equipmentId: '',
    equipmentName: '',
    fuelType: 'diesel',
    lubricantType: '',
    fuelQuantity: 0,
    lubricantQuantity: 0,
    fuelCost: 0,
    lubricantCost: 0,
    totalCost: 0,
    meterReading: 0,
    previousReading: 0,
    efficiency: 0,
    filledBy: '',
    filledDate: '',
    shift: '',
    supplier: '',
    remarks: '',
  });

  useEffect(() => {
    setFuelRecords(getFromStorage<FuelLubricant>(PM_STORAGE_KEYS.FUEL_LUBRICANT));
    setEquipment(getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId);
    
    const fuelData: FuelLubricant = {
      ...formData,
      id: generateId(),
      equipmentId: formData.equipmentId!,
      equipmentName: selectedEquipment?.name || formData.equipmentName!,
      fuelType: formData.fuelType!,
      fuelQuantity: formData.fuelQuantity!,
      fuelCost: formData.fuelCost!,
      totalCost: formData.totalCost!,
      meterReading: formData.meterReading!,
      previousReading: formData.previousReading!,
      efficiency: formData.efficiency!,
      filledBy: formData.filledBy!,
      filledDate: formData.filledDate!,
      shift: formData.shift!,
      supplier: formData.supplier!,
      remarks: formData.remarks!,
      createdAt: new Date().toISOString(),
    } as FuelLubricant;

    const updated = [...fuelRecords, fuelData];
    setFuelRecords(updated);
    saveToStorage(PM_STORAGE_KEYS.FUEL_LUBRICANT, updated);
    toast({ title: 'Fuel record added successfully' });
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      equipmentId: '',
      equipmentName: '',
      fuelType: 'diesel',
      lubricantType: '',
      fuelQuantity: 0,
      lubricantQuantity: 0,
      fuelCost: 0,
      lubricantCost: 0,
      totalCost: 0,
      meterReading: 0,
      previousReading: 0,
      efficiency: 0,
      filledBy: '',
      filledDate: '',
      shift: '',
      supplier: '',
      remarks: '',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fuel & Lubricant Tracking</h1>
          <p className="text-muted-foreground">Track fuel and lubricant consumption</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Fuel Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Fuel/Lubricant Record</DialogTitle>
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
                  <Label>Fuel Type *</Label>
                  <Select value={formData.fuelType} onValueChange={(value: any) => setFormData({ ...formData, fuelType: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="lpg">LPG</SelectItem>
                      <SelectItem value="cng">CNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fuel Quantity (L) *</Label>
                  <Input type="number" step="0.01" value={formData.fuelQuantity} onChange={(e) => setFormData({ ...formData, fuelQuantity: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <Label>Fuel Cost *</Label>
                  <Input type="number" value={formData.fuelCost} onChange={(e) => setFormData({ ...formData, fuelCost: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <Label>Lubricant Quantity (L)</Label>
                  <Input type="number" step="0.01" value={formData.lubricantQuantity} onChange={(e) => setFormData({ ...formData, lubricantQuantity: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <Label>Previous Meter Reading</Label>
                  <Input type="number" value={formData.previousReading} onChange={(e) => setFormData({ ...formData, previousReading: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <Label>Current Meter Reading *</Label>
                  <Input type="number" value={formData.meterReading} onChange={(e) => setFormData({ ...formData, meterReading: parseFloat(e.target.value) })} required />
                </div>
                <div>
                  <Label>Filled By *</Label>
                  <Input value={formData.filledBy} onChange={(e) => setFormData({ ...formData, filledBy: e.target.value })} required />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={formData.filledDate} onChange={(e) => setFormData({ ...formData, filledDate: e.target.value })} required />
                </div>
                <div>
                  <Label>Shift</Label>
                  <Input value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Remarks</Label>
                  <Textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Record</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search fuel records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Equipment</th>
                  <th className="text-left p-3">Fuel Type</th>
                  <th className="text-left p-3">Quantity</th>
                  <th className="text-left p-3">Cost</th>
                  <th className="text-left p-3">Meter Reading</th>
                  <th className="text-left p-3">Filled By</th>
                </tr>
              </thead>
              <tbody>
                {fuelRecords.filter(r => r.equipmentName.toLowerCase().includes(searchTerm.toLowerCase())).map((record) => (
                  <tr key={record.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{new Date(record.filledDate).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{record.equipmentName}</td>
                    <td className="p-3 capitalize">{record.fuelType}</td>
                    <td className="p-3">{record.fuelQuantity}L</td>
                    <td className="p-3">₹{record.fuelCost}</td>
                    <td className="p-3">{record.meterReading}</td>
                    <td className="p-3">{record.filledBy}</td>
                  </tr>
                ))}
                {fuelRecords.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No fuel records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuelLubricantPage;
