import React, { useState, useEffect } from "react";
import {
  Store,
  Plus,
  TrendingUp,
  Package,
  AlertCircle,
  Edit,
  Trash2,
  XCircle,
  ShieldAlert,
  Calendar,
  User,
  Hash,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  fetchStores,
  addStore,
  updateStore,
  deleteStore,
} from "@/redux/slices/storageSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { usePermission } from "@/hooks/userPermission";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import NotificationCenter from "@/components/NotificationCenter";


interface StoreData {
  _id?: string;
  name: string;
  location: string | { _id: string; name: string };
  dailySales: number;
  stock: number;
  last7DaysSales: number[];
  fastMoving: string[];
  slowMoving: string[];
  returns: number;
  scrap: number;
  manager: string;
  transferHistory: { date: string; qty: number; from: string }[];
  lowStockAlerts: string[];
}

interface MaterialIssueItem {
  _id: string;
  workOrderCode: string;
  issueDate: string;
  totalValue: number;
  items: {
    itemName: string;
    issueQty: number;
    unit: string;
    rate: number;
    lineValue: number;
  }[];
  acceptedDate: string;
  status: 'accepted';
}

const StoresManagement: React.FC = () => {
  const canView = usePermission("stores", "view");
  const canCreate = usePermission("stores", "create");
  const canEdit = usePermission("stores", "edit");
  const canDelete = usePermission("stores", "delete");
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [materialIssues, setMaterialIssues] = useState<MaterialIssueItem[]>([]);
  const [selectedIssueItems, setSelectedIssueItems] = useState<MaterialIssueItem | null>(null);
  const [showItemsDialog, setShowItemsDialog] = useState(false);
  
  if (!canView) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">
          You do not have permission to view Stores.
        </h2>
      </div>
    );
  }
  const dispatch = useDispatch<AppDispatch>();
  const { stores, loading } = useSelector((state: RootState) => state.storages);
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);

  const isLocationRestricted = userProfile?.role !== 'admin' && !!userProfile?.location;
  const [locationFilter, setLocationFilter] = useState(isLocationRestricted ? userProfile.location : "all");

  const getLocationName = (loc: string | { name: string } | undefined) => {
    if (!loc) return "N/A";
    if (typeof loc === 'object') return loc.name;
    const found = locations.find((l: any) => l._id === loc);
    return found ? found.name : loc;
  };

  useEffect(() => {
    dispatch(fetchMasterData("location"));
    dispatch(fetchStores({ page: 1, limit: 100, location: locationFilter }));
    
    // Load material issues from localStorage
    const loadMaterialIssues = () => {
      const stored = localStorage.getItem('acceptedMaterialIssues');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Filter out any sample data (data with IDs starting with 'sample-')
          const realData = parsed.filter((item: MaterialIssueItem) => !item._id.startsWith('sample-'));
          setMaterialIssues(realData);
          
          // Update localStorage with only real data
          if (realData.length !== parsed.length) {
            localStorage.setItem('acceptedMaterialIssues', JSON.stringify(realData));
          }
        } catch (error) {
          console.error('Error parsing stored material issues:', error);
          // Clear corrupted data
          localStorage.removeItem('acceptedMaterialIssues');
        }
      }
    };
    
    loadMaterialIssues();
    
    console.log('🏪 Store page loaded, current material issues:', materialIssues.length);
    
    // Listen for material issue acceptance events
    const handleMaterialIssueAccepted = (event: CustomEvent) => {
      const issueData = event.detail;
      console.log('🎯 Material issue accepted in store page:', issueData);
      
      // Create new material issue entry
      const newIssue: MaterialIssueItem = {
        _id: issueData.issueSlipId || `issue-${Date.now()}`,
        workOrderCode: issueData.workOrderCode,
        issueDate: issueData.issueDate || new Date().toISOString(),
        totalValue: issueData.totalValue,
        items: issueData.items || [],
        acceptedDate: new Date().toISOString(),
        status: 'accepted'
      };
      
      console.log('📦 Adding new material issue to store table:', newIssue);
      
      setMaterialIssues(prev => {
        const updated = [newIssue, ...prev];
        // Save to localStorage
        localStorage.setItem('acceptedMaterialIssues', JSON.stringify(updated));
        console.log('✅ Material issue saved to localStorage, total issues:', updated.length);
        return updated;
      });
    };
    
    // Add event listener
    window.addEventListener('materialIssueAccepted', handleMaterialIssueAccepted as EventListener);
    
    return () => {
      window.removeEventListener('materialIssueAccepted', handleMaterialIssueAccepted as EventListener);
    };
  }, [dispatch, locationFilter]);

  const handleAdd = () => {
    setEditingStoreId(null);
    setShowStoreForm(true);
  };

  const handleEdit = (id: string) => {
    setEditingStoreId(id);
    setShowStoreForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this store?")) {
      dispatch(deleteStore(id));
    }
  };

  const handleCloseForm = () => {
    setShowStoreForm(false);
    setEditingStoreId(null);
  };

  const handleClearMaterialIssues = () => {
    if (window.confirm("Are you sure you want to clear all material issues? This action cannot be undone.")) {
      setMaterialIssues([]);
      localStorage.removeItem('acceptedMaterialIssues');
      console.log('✅ All material issues cleared from store page');
    }
  };

  const handleShowItems = (issue: MaterialIssueItem) => {
    setSelectedIssueItems(issue);
    setShowItemsDialog(true);
  };

  const handleSubmit = (formData: any) => {
    const payload: Partial<StoreData> = {
      name: formData.name || "New Store",
      location: formData.location || "N/A",
      dailySales: Number(formData.dailySales) || 0,
      stock: Number(formData.stock) || 0,
      last7DaysSales: formData.last7DaysSales
        ? formData.last7DaysSales
            .split(",")
            .map((v: string) => Number(v.trim()))
            .filter(Boolean)
        : [0, 0, 0, 0, 0, 0, 0],
      fastMoving:
        formData.fastMoving
          ?.split(",")
          .map((s: string) => s.trim())
          .filter(Boolean) || [],
      slowMoving:
        formData.slowMoving
          ?.split(",")
          .map((s: string) => s.trim())
          .filter(Boolean) || [],
      returns: Number(formData.returns) || 0,
      scrap: Number(formData.scrap) || 0,
      manager: formData.manager || "Unassigned",
      transferHistory: formData.transferHistory
        ? JSON.parse(formData.transferHistory || "[]")
        : [],
      lowStockAlerts:
        formData.lowStockAlerts
          ?.split(",")
          .map((s: string) => s.trim())
          .filter(Boolean) || [],
    };

    if (editingStoreId) {
      dispatch(updateStore({ id: editingStoreId, data: payload }));
    } else {
      dispatch(addStore(payload));
    }
    handleCloseForm();
  };

  const StoreForm = ({ initialData }: { initialData?: StoreData }) => {
    const [formData, setFormData] = useState({
      name: initialData?.name || "",
      location: initialData?.location 
        ? (typeof initialData.location === 'object' ? initialData.location._id : initialData.location)
        : (isLocationRestricted ? userProfile.location : ""),
      dailySales: initialData?.dailySales?.toString() || "0",
      stock: initialData?.stock?.toString() || "",
      last7DaysSales: initialData?.last7DaysSales?.join(", ") || "",
      fastMoving: initialData?.fastMoving?.join(", ") || "",
      slowMoving: initialData?.slowMoving?.join(", ") || "",
      returns: initialData?.returns?.toString() || "0",
      scrap: initialData?.scrap?.toString() || "0",
      manager: initialData?.manager || "",
      transferHistory: initialData?.transferHistory
        ? JSON.stringify(initialData.transferHistory, null, 2)
        : "[]",
      lowStockAlerts: initialData?.lowStockAlerts?.join(", ") || "",
    });

    const handleChange =
      (field: string) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      };
    if (!canView) {
      return (
        <div className="text-center py-12 px-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            You do not have the necessary permissions to view this page.
          </p>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {editingStoreId ? "Edit" : "Add"} Store
            </h2>
            <button
              onClick={handleCloseForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-8 h-8" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(formData);
            }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Store Name *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={handleChange("name")}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location *
                </label>
                {/* [!code ++] Replaced input with Select */}
                <select
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                  disabled={isLocationRestricted}
                  className="w-full px-4 py-3 border rounded-lg bg-white disabled:bg-gray-100"
                >
                    <option value="">Select Location</option>
                    {locations.map(l => (
                        <option key={l._id} value={l._id}>{l.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Daily Sales (₹)
                </label>
                <input
                  type="number"
                  value={formData.dailySales}
                  onChange={handleChange("dailySales")}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Stock (items)
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={handleChange("stock")}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fast Moving Items (comma separated)
                </label>
                <textarea
                  rows={3}
                  value={formData.fastMoving}
                  onChange={handleChange("fastMoving")}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="T-Shirts, Milk, Chargers..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Slow Moving Items
                </label>
                <textarea
                  rows={3}
                  value={formData.slowMoving}
                  onChange={handleChange("slowMoving")}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Winter Jackets, Old Phones..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Returns (last 30 days)
                </label>
                <input
                  type="number"
                  value={formData.returns}
                  onChange={handleChange("returns")}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Scrap Items
                </label>
                <input
                  type="number"
                  value={formData.scrap}
                  onChange={handleChange("scrap")}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Store Manager
                </label>
                <input
                  value={formData.manager}
                  onChange={handleChange("manager")}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Last 7 Days Sales (comma separated)
              </label>
              <input
                value={formData.last7DaysSales}
                onChange={handleChange("last7DaysSales")}
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="12000, 11300, 9800, ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Low Stock Alerts (comma separated)
              </label>
              <textarea
                rows={2}
                value={formData.lowStockAlerts}
                onChange={handleChange("lowStockAlerts")}
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="Sugar 5kg, LED Bulb..."
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium mb-2">
                Transfer History (JSON - optional)
              </label>
              <textarea
                rows={4}
                value={formData.transferHistory}
                onChange={handleChange("transferHistory")}
                className="w-full px-4 py-3 border rounded-lg font-mono text-xs"
                placeholder='[{"date": "10 Jan 2025", "qty": 20, "from": "Main Warehouse"}]'
              />
            </div> */}

            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingStoreId ? "Update Store" : "Create Store"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Store className="text-green-600" />
          Retail Stores & Branches
        </h1>
        <div className="flex gap-2">
          <NotificationCenter 
            destination="inventory.store" 
            title="Store Notifications"
          />
          <Button
            disabled={!canCreate}
            onClick={handleAdd}
            className=" flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Store
          </Button>
        </div>
      </div>

      {showStoreForm && (
        <StoreForm initialData={stores.find((s) => s._id === editingStoreId)} />
      )}

      {/* Material Issues Table Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Package className="text-blue-600" />
              Accepted Material Issues
              <Badge variant="secondary" className="ml-2">
                {materialIssues.length} Items
              </Badge>
            </CardTitle>
            {materialIssues.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearMaterialIssues}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
            
            {/* Test Button for Development */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const testData = {
                  issueSlipId: `test-${Date.now()}`,
                  workOrderCode: `WO-TEST-${Math.floor(Math.random() * 1000)}`,
                  issueDate: new Date().toISOString(),
                  totalValue: 12500,
                  items: [
                    {
                      itemName: 'Test Material A',
                      issueQty: 10,
                      unit: 'kg',
                      rate: 500,
                      lineValue: 5000
                    },
                    {
                      itemName: 'Test Material B',
                      issueQty: 15,
                      unit: 'pcs',
                      rate: 500,
                      lineValue: 7500
                    }
                  ]
                };
                
                const event = new CustomEvent('materialIssueAccepted', { detail: testData });
                window.dispatchEvent(event);
                console.log('🧪 Test material issue event dispatched');
              }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Test Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {materialIssues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No material issues accepted yet</p>
              <p className="text-sm">Accepted material issue notifications will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Work Order
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Issue Date
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Accepted Date
                      </div>
                    </TableHead>
                    <TableHead>Items Count</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialIssues.map((issue) => (
                    <TableRow key={issue._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {issue.workOrderCode}
                      </TableCell>
                      <TableCell>
                        {new Date(issue.issueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(issue.acceptedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowItems(issue)}
                          className="hover:bg-blue-50 text-blue-600 font-medium"
                        >
                          <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                            {issue.items.length} items
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{issue.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Accepted
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Show detailed view of items
                            const itemsList = issue.items.map(item => 
                              `• ${item.itemName}: ${item.issueQty} ${item.unit} @ ₹${item.rate} = ₹${item.lineValue}`
                            ).join('\n');
                            
                            alert(`Material Issue Details:\n\nWork Order: ${issue.workOrderCode}\nTotal Value: ₹${issue.totalValue}\n\nItems:\n${itemsList}`);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Detail Dialog */}
      <Dialog open={showItemsDialog} onOpenChange={setShowItemsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Package className="text-blue-600" />
              Material Issue Items - {selectedIssueItems?.workOrderCode}
            </DialogTitle>
          </DialogHeader>
          
          {selectedIssueItems && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Work Order:</span>
                  <p className="font-semibold">{selectedIssueItems.workOrderCode}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Value:</span>
                  <p className="font-semibold text-green-600">₹{selectedIssueItems.totalValue.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Issue Date:</span>
                  <p className="font-semibold">{new Date(selectedIssueItems.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Accepted Date:</span>
                  <p className="font-semibold">{new Date(selectedIssueItems.acceptedDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Items Details ({selectedIssueItems.items.length} items)
                </h4>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Rate (₹)</TableHead>
                        <TableHead className="text-right">Line Value (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedIssueItems.items.map((item, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell className="text-right font-semibold">{item.issueQty}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.unit}</Badge>
                          </TableCell>
                          <TableCell className="text-right">₹{item.rate.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            ₹{item.lineValue.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-800">Total Value:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{selectedIssueItems.totalValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading && <p className="text-center py-10">Loading stores...</p>}

      <Accordion type="single" collapsible className="space-y-6">
        {stores.map((store) => (
          <AccordionItem
            key={store._id}
            value={store._id}
            className="border rounded-xl shadow-lg overflow-hidden bg-white"
          >
            <AccordionTrigger className="px-8 py-6 hover:bg-green-50 transition-colors">
              <div className="grid grid-cols-12 w-full items-center text-left gap-6">
                <div className="col-span-4 font-bold text-lg flex items-center gap-3">
                  <Store className="text-green-600" />
                  {store.name}
                </div>
                <div className="col-span-3 text-gray-600 flex items-center gap-2">
                  <Package className="w-4 h-4" /> {getLocationName(store.location)}
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{store.dailySales.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">daily avg</div>
                </div>
                <div className="col-span-2 text-right font-semibold">
                  {store.stock} items
                </div>
                <div className="col-span-1">
                  <div className="w-20 bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{
                        width: `${Math.min((store.stock / 200) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-8 py-8 bg-gradient-to-b from-green-50 to-white border-t">
              <div className="flex justify-end gap-3 mb-6">
                <Button
                  disabled={!canEdit}
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(store._id)}
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button
                  disabled={!canDelete}
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(store._id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="font-bold text-green-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Performance
                  </h4>
                  <p>
                    Manager: <strong>{store.manager}</strong>
                  </p>
                  <p>
                    Returns:{" "}
                    <Badge variant="destructive">{store.returns}</Badge>
                  </p>
                  <p>
                    Scrap: <Badge variant="secondary">{store.scrap}</Badge>
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-green-700 mb-4">Fast Moving</h4>
                  <ul className="space-y-2">
                    {store.fastMoving.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-green-600"
                      >
                        <span className="text-xs">✔</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-orange-700 mb-4">
                    Slow Moving
                  </h4>
                  <ul className="space-y-2">
                    {store.slowMoving.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-orange-600"
                      >
                        <span className="text-xs">⚠</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {store.lowStockAlerts.length > 0 && (
                <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Low Stock Alerts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {store.lowStockAlerts.map((alert, i) => (
                      <Badge key={i} variant="destructive">
                        {alert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 grid md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Recent Transfers</h4>
                  <ul className="space-y-2">
                    {store.transferHistory.map((t, i) => (
                      <li key={i} className="text-gray-600">
                        {t.date} → +{t.qty} from <strong>{t.from}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Last 7 Days Sales</h4>
                  <div className="space-y-1 text-right font-mono text-sm">
                    {store.last7DaysSales.map((sale, i) => (
                      <div key={i}>
                        Day {i + 1}: ₹{sale.toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default StoresManagement;
