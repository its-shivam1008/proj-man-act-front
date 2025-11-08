import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { WorkCenter } from '@/types/production';
import { toast } from 'sonner';

export default function WorkCentersPage() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<WorkCenter | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    description: string;
    capacity: number;
    costPerHour: number;
    efficiency: number;
    status: 'active' | 'maintenance' | 'inactive';
    shift: 'single' | 'double' | 'triple';
    operatorCount: number;
  }>({
    code: '',
    name: '',
    description: '',
    capacity: 8,
    costPerHour: 0,
    efficiency: 100,
    status: 'active',
    shift: 'single',
    operatorCount: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const saved = storage.get<WorkCenter[]>(STORAGE_KEYS.WORK_CENTERS, []);
    setWorkCenters(saved);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error('Please fill required fields');
      return;
    }

    const centerData: WorkCenter = {
      id: editingCenter?.id || `WC-${Date.now()}`,
      ...formData,
      createdAt: editingCenter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = editingCenter
      ? workCenters.map(wc => wc.id === editingCenter.id ? centerData : wc)
      : [...workCenters, centerData];

    storage.set(STORAGE_KEYS.WORK_CENTERS, updated);
    setWorkCenters(updated);
    resetForm();
    setIsDialogOpen(false);
    toast.success(editingCenter ? 'Work center updated' : 'Work center created');
  };

  const handleEdit = (center: WorkCenter) => {
    setEditingCenter(center);
    setFormData({
      code: center.code,
      name: center.name,
      description: center.description,
      capacity: center.capacity,
      costPerHour: center.costPerHour,
      efficiency: center.efficiency,
      status: center.status,
      shift: center.shift,
      operatorCount: center.operatorCount,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = workCenters.filter(wc => wc.id !== id);
    storage.set(STORAGE_KEYS.WORK_CENTERS, updated);
    setWorkCenters(updated);
    toast.success('Work center deleted');
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      capacity: 8,
      costPerHour: 0,
      efficiency: 100,
      status: 'active',
      shift: 'single',
      operatorCount: 1,
    });
    setEditingCenter(null);
  };

  const filtered = workCenters.filter(wc =>
    wc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wc.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Work Centers</h1>
          <p className="text-muted-foreground">Manage machines and production resources</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Work Center
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCenter ? 'Edit Work Center' : 'Add Work Center'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Code</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Capacity (hrs/day)</Label>
                  <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <Label>Cost per Hour</Label>
                  <Input type="number" value={formData.costPerHour} onChange={(e) => setFormData({ ...formData, costPerHour: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Efficiency (%)</Label>
                  <Input type="number" value={formData.efficiency} onChange={(e) => setFormData({ ...formData, efficiency: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <Label>Operators</Label>
                  <Input type="number" value={formData.operatorCount} onChange={(e) => setFormData({ ...formData, operatorCount: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shift</Label>
                  <Select value={formData.shift} onValueChange={(value: any) => setFormData({ ...formData, shift: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full bg-gradient-primary">
                {editingCenter ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Search work centers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              No work centers found. Add your first one!
            </CardContent>
          </Card>
        ) : (
          filtered.map((center) => (
            <Card key={center.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{center.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{center.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      center.status === 'active' ? 'bg-success/10 text-success' :
                      center.status === 'maintenance' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {center.status}
                    </span>
                    <Button size="icon" variant="outline" onClick={() => handleEdit(center)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(center.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{center.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Capacity</p>
                    <p className="font-semibold">{center.capacity} hrs/day</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Efficiency</p>
                    <p className="font-semibold">{center.efficiency}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Shift</p>
                    <p className="font-semibold capitalize">{center.shift}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Operators</p>
                    <p className="font-semibold">{center.operatorCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
