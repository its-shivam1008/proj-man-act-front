import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { QualityCheck, WorkOrder } from '../../types/production';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/userPermission';

export default function QualityControlPage() {
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const canView = usePermission('qualityControl', 'view');

  const [formData, setFormData] = useState({
    workOrderId: '',
    inspectionType: 'in-process' as const,
    parameter: '',
    standardValue: '',
    actualValue: '',
    result: 'pending' as const,
    inspectedBy: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setChecks(storage.get<QualityCheck[]>(STORAGE_KEYS.QUALITY_CHECKS, []));
    setWorkOrders(storage.get<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, []));
  };

  const handleSave = () => {
    if (!formData.workOrderId || !formData.parameter) {
      toast.error('Please fill all required fields');
      return;
    }

    const workOrder = workOrders.find(wo => wo.id === formData.workOrderId);
    if (!workOrder) return;

    const checkData: QualityCheck = {
      id: `QC-${Date.now()}`,
      checkNumber: `QC-${Date.now()}`,
      workOrderId: formData.workOrderId,
      workOrderNumber: workOrder.orderNumber,
      inspectionType: formData.inspectionType,
      parameter: formData.parameter,
      standardValue: formData.standardValue,
      actualValue: formData.actualValue,
      result: formData.result,
      inspectedBy: formData.inspectedBy,
      inspectedDate: new Date().toISOString(),
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [...checks, checkData];
    storage.set(STORAGE_KEYS.QUALITY_CHECKS, updated);
    setChecks(updated);
    resetForm();
    setIsDialogOpen(false);
    toast.success('Quality check recorded');
  };

  const resetForm = () => {
    setFormData({
      workOrderId: '',
      inspectionType: 'in-process',
      parameter: '',
      standardValue: '',
      actualValue: '',
      result: 'pending',
      inspectedBy: '',
      notes: '',
    });
  };

  const getStats = () => {
    const passed = checks.filter(c => c.result === 'pass').length;
    const failed = checks.filter(c => c.result === 'fail').length;
    const pending = checks.filter(c => c.result === 'pending').length;
    const total = checks.length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { passed, failed, pending, passRate };
  };

  const stats = getStats();

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quality Control</h1>
          <p className="text-muted-foreground">Inspection and quality assurance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Inspection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quality Inspection</DialogTitle>
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
                <Label>Inspection Type</Label>
                <Select value={formData.inspectionType} onValueChange={(value: any) => setFormData({ ...formData, inspectionType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-process">In-Process</SelectItem>
                    <SelectItem value="final">Final Inspection</SelectItem>
                    <SelectItem value="material">Material Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Parameter</Label>
                <Input value={formData.parameter} onChange={(e) => setFormData({ ...formData, parameter: e.target.value })} placeholder="e.g., Dimension, Weight" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Standard Value</Label>
                  <Input value={formData.standardValue} onChange={(e) => setFormData({ ...formData, standardValue: e.target.value })} />
                </div>
                <div>
                  <Label>Actual Value</Label>
                  <Input value={formData.actualValue} onChange={(e) => setFormData({ ...formData, actualValue: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Result</Label>
                <Select value={formData.result} onValueChange={(value: any) => setFormData({ ...formData, result: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Inspected By</Label>
                <Input value={formData.inspectedBy} onChange={(e) => setFormData({ ...formData, inspectedBy: e.target.value })} />
              </div>

              <div>
                <Label>Notes</Label>
                <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <Button onClick={handleSave} className="w-full bg-gradient-primary">Record Inspection</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-md border-l-4 border-l-success">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-success">{stats.passed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold text-primary">{stats.passRate}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {checks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No quality checks recorded yet
            </CardContent>
          </Card>
        ) : (
          checks.map((check) => (
            <Card key={check.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{check.checkNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {check.workOrderNumber} • {check.inspectionType}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    check.result === 'pass' ? 'bg-success/10 text-success' :
                    check.result === 'fail' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {check.result}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Parameter</p>
                    <p className="font-semibold">{check.parameter}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Standard</p>
                    <p className="font-semibold">{check.standardValue}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Actual</p>
                    <p className="font-semibold">{check.actualValue}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Inspector</p>
                    <p className="font-semibold">{check.inspectedBy}</p>
                  </div>
                </div>
                {check.notes && <p className="text-sm text-muted-foreground mt-4">Notes: {check.notes}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
