import { useState, useEffect } from 'react';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { MaterialIssue, WorkOrder, Material } from '@/types/production';
import { toast } from 'sonner';

export default function MaterialIssuePage() {
  const [issues, setIssues] = useState<MaterialIssue[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    workOrderId: '',
    materialId: '',
    issuedQuantity: 0,
    issuedBy: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIssues(storage.get<MaterialIssue[]>(STORAGE_KEYS.MATERIAL_ISSUES, []));
    setWorkOrders(storage.get<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, []));
    setMaterials(storage.get<Material[]>(STORAGE_KEYS.MATERIALS, []));
  };

  const handleSave = () => {
    if (!formData.workOrderId || !formData.materialId || formData.issuedQuantity <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    const workOrder = workOrders.find(wo => wo.id === formData.workOrderId);
    const material = materials.find(m => m.id === formData.materialId);
    if (!workOrder || !material) return;

    const issueData: MaterialIssue = {
      id: `MI-${Date.now()}`,
      issueNumber: `MI-${Date.now()}`,
      workOrderId: formData.workOrderId,
      workOrderNumber: workOrder.orderNumber,
      materialId: formData.materialId,
      materialName: material.name,
      plannedQuantity: formData.issuedQuantity,
      issuedQuantity: formData.issuedQuantity,
      unit: material.unit,
      issuedBy: formData.issuedBy,
      issuedDate: new Date().toISOString(),
      status: 'issued',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [...issues, issueData];
    storage.set(STORAGE_KEYS.MATERIAL_ISSUES, updated);
    setIssues(updated);
    resetForm();
    setIsDialogOpen(false);
    toast.success('Material issued successfully');
  };

  const resetForm = () => {
    setFormData({
      workOrderId: '',
      materialId: '',
      issuedQuantity: 0,
      issuedBy: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Material Issue</h1>
          <p className="text-muted-foreground">Track raw material consumption</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Issue Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Material to Work Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Work Order</Label>
                <Select value={formData.workOrderId} onValueChange={(value) => setFormData({ ...formData, workOrderId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select work order" /></SelectTrigger>
                  <SelectContent>
                    {workOrders.map(wo => (
                      <SelectItem key={wo.id} value={wo.id}>{wo.orderNumber} - {wo.productName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Material</Label>
                <Select value={formData.materialId} onValueChange={(value) => setFormData({ ...formData, materialId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent>
                    {materials.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Issued Quantity</Label>
                <Input type="number" value={formData.issuedQuantity} onChange={(e) => setFormData({ ...formData, issuedQuantity: parseFloat(e.target.value) })} />
              </div>

              <div>
                <Label>Issued By</Label>
                <Input value={formData.issuedBy} onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })} />
              </div>

              <div>
                <Label>Notes</Label>
                <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <Button onClick={handleSave} className="w-full bg-gradient-primary">Issue Material</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {issues.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No material issues recorded yet
            </CardContent>
          </Card>
        ) : (
          issues.map((issue) => (
            <Card key={issue.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {issue.issueNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{issue.workOrderNumber}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                    {issue.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Material</p>
                    <p className="font-semibold">{issue.materialName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-semibold">{issue.issuedQuantity} {issue.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Issued By</p>
                    <p className="font-semibold">{issue.issuedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">{new Date(issue.issuedDate).toLocaleDateString()}</p>
                  </div>
                </div>
                {issue.notes && <p className="text-sm text-muted-foreground mt-4">Notes: {issue.notes}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
