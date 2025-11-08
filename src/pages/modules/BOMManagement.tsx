import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { BOM, BOMItem, Product, Material } from '../../types/production';
import { toast } from 'sonner';

export default function BOMPage() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null);

  const [formData, setFormData] = useState<{
    productId: string;
    version: string;
    status: 'active' | 'inactive' | 'draft';
    items: BOMItem[];
  }>({
    productId: '',
    version: '1.0',
    status: 'draft',
    items: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedBOMs = storage.get<BOM[]>(STORAGE_KEYS.BOMS, []);
    const savedProducts = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const savedMaterials = storage.get<Material[]>(STORAGE_KEYS.MATERIALS, []);
    
    setBoms(savedBOMs);
    setProducts(savedProducts);
    setMaterials(savedMaterials);
  };

  const handleSave = () => {
    if (!formData.productId || formData.items.length === 0) {
      toast.error('Please select a product and add at least one material');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    const bomData: BOM = {
      id: editingBOM?.id || `BOM-${Date.now()}`,
      productId: formData.productId,
      productName: product.name,
      items: formData.items,
      version: formData.version,
      status: formData.status,
      createdAt: editingBOM?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedBOMs = editingBOM
      ? boms.map(b => b.id === editingBOM.id ? bomData : b)
      : [...boms, bomData];

    storage.set(STORAGE_KEYS.BOMS, updatedBOMs);
    setBoms(updatedBOMs);
    resetForm();
    setIsDialogOpen(false);
    toast.success(editingBOM ? 'BOM updated successfully' : 'BOM created successfully');
  };

  const handleEdit = (bom: BOM) => {
    setEditingBOM(bom);
    setFormData({
      productId: bom.productId,
      version: bom.version,
      status: bom.status,
      items: bom.items,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedBOMs = boms.filter(b => b.id !== id);
    storage.set(STORAGE_KEYS.BOMS, updatedBOMs);
    setBoms(updatedBOMs);
    toast.success('BOM deleted successfully');
  };

  const addBOMItem = () => {
    if (materials.length === 0) {
      toast.error('Please add materials first');
      return;
    }
    
    const newItem: BOMItem = {
      materialId: materials[0].id,
      materialName: materials[0].name,
      quantity: 1,
      unit: materials[0].unit,
    };
    
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const updateBOMItem = (index: number, field: keyof BOMItem, value: any) => {
    const updatedItems = [...formData.items];
    
    if (field === 'materialId') {
      const material = materials.find(m => m.id === value);
      if (material) {
        updatedItems[index] = {
          ...updatedItems[index],
          materialId: value,
          materialName: material.name,
          unit: material.unit,
        };
      }
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }
    
    setFormData({ ...formData, items: updatedItems });
  };

  const removeBOMItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      version: '1.0',
      status: 'draft',
      items: [],
    });
    setEditingBOM(null);
  };

  const filteredBOMs = boms.filter(bom =>
    bom.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bill of Materials</h1>
          <p className="text-muted-foreground">Manage product recipes and material requirements</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create BOM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBOM ? 'Edit BOM' : 'Create New BOM'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product</Label>
                  <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Version</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Materials</Label>
                  <Button type="button" size="sm" onClick={addBOMItem} variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Material
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center p-2 bg-muted rounded">
                      <Select
                        value={item.materialId}
                        onValueChange={(value) => updateBOMItem(index, 'materialId', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map(material => (
                            <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateBOMItem(index, 'quantity', parseFloat(e.target.value))}
                        className="w-24"
                        placeholder="Qty"
                      />
                      <Input
                        value={item.unit}
                        className="w-20"
                        disabled
                      />
                      <Button type="button" size="icon" variant="destructive" onClick={() => removeBOMItem(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} className="w-full bg-gradient-primary">
                {editingBOM ? 'Update BOM' : 'Create BOM'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search BOMs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredBOMs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No BOMs found. Create your first BOM to get started!
            </CardContent>
          </Card>
        ) : (
          filteredBOMs.map((bom) => (
            <Card key={bom.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{bom.productName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {bom.id} • Version {bom.version}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      bom.status === 'active' ? 'bg-success/10 text-success' :
                      bom.status === 'draft' ? 'bg-warning/10 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {bom.status}
                    </span>
                    <Button size="icon" variant="outline" onClick={() => handleEdit(bom)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(bom.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bom.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{item.materialName}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
