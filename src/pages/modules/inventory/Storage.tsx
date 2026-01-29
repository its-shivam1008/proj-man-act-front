import React, { useState, useEffect, useCallback } from "react";
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
  Hash,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

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

  // Pagination and Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
  const { stores, loading, totalPages, totalStores, hasNextPage, hasPrevPage } = useSelector((state: RootState) => state.storages);
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch stores with pagination
  const loadStores = useCallback(() => {
    dispatch(fetchStores({
      page: currentPage,
      limit: itemsPerPage,
      location: locationFilter,
      search: debouncedSearch
    }));
  }, [dispatch, currentPage, itemsPerPage, locationFilter, debouncedSearch]);

  useEffect(() => {
    dispatch(fetchMasterData("location"));
  }, [dispatch]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Load material issues from localStorage
  useEffect(() => {
    const loadMaterialIssues = () => {
      const stored = localStorage.getItem('acceptedMaterialIssues');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const realData = parsed.filter((item: MaterialIssueItem) => !item._id.startsWith('sample-'));
          setMaterialIssues(realData);

          if (realData.length !== parsed.length) {
            localStorage.setItem('acceptedMaterialIssues', JSON.stringify(realData));
          }
        } catch (error) {
          console.error('Error parsing stored material issues:', error);
          localStorage.removeItem('acceptedMaterialIssues');
        }
      }
    };

    loadMaterialIssues();

    // Listen for material issue acceptance events
    const handleMaterialIssueAccepted = (event: CustomEvent) => {
      const issueData = event.detail;

      const newIssue: MaterialIssueItem = {
        _id: issueData.issueSlipId || `issue-${Date.now()}`,
        workOrderCode: issueData.workOrderCode,
        issueDate: issueData.issueDate || new Date().toISOString(),
        totalValue: issueData.totalValue,
        items: issueData.items || [],
        acceptedDate: new Date().toISOString(),
        status: 'accepted'
      };

      setMaterialIssues(prev => {
        const updated = [newIssue, ...prev];
        localStorage.setItem('acceptedMaterialIssues', JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('materialIssueAccepted', handleMaterialIssueAccepted as EventListener);

    return () => {
      window.removeEventListener('materialIssueAccepted', handleMaterialIssueAccepted as EventListener);
    };
  }, []);

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
    }
  };

  const handleShowItems = (issue: MaterialIssueItem) => {
    setSelectedIssueItems(issue);
    setShowItemsDialog(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  const handleLocationChange = (value: string) => {
    setLocationFilter(value);
    setCurrentPage(1); // Reset to first page
  };

  const handleRefresh = () => {
    loadStores();
  };

  const handleSubmit = (formData: any) => {
    const payload: Partial<StoreData> = {
      name: formData.name || "New Store",
      location: formData.location || "",
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
                <select
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  disabled={isLocationRestricted}
                  className="w-full px-4 py-3 border rounded-lg bg-white disabled:bg-gray-100"
                >
                  <option value="">Select Location</option>
                  {locations.map((l: any) => (
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

  // Pagination component
  const Pagination = () => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalStores);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Showing</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <SelectItem key={option} value={option.toString()}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>of {totalStores} stores</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {totalStores > 0 ? `${startItem}-${endItem}` : '0'} of {totalStores}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={!hasPrevPage || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevPage || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-3 py-1 text-sm font-medium">
              Page {currentPage} of {totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={!hasNextPage || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
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
                          onClick={() => handleShowItems(issue)}
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

      {/* Search & Filter Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Store className="text-green-600" />
              Stores
              <Badge variant="secondary" className="ml-2">
                {totalStores} Total
              </Badge>
            </CardTitle>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>

              {/* Location Filter */}
              {!isLocationRestricted && (
                <Select value={locationFilter} onValueChange={handleLocationChange}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc: any) => (
                      <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Refresh Button */}
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && stores.length === 0 ? (
            <div className="text-center py-10">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Loading stores...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No stores found</p>
              <p className="text-sm">
                {searchQuery ? `No stores match "${searchQuery}"` : "Click 'Add Store' to create your first store"}
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {stores.map((store) => (
                <AccordionItem
                  key={store._id}
                  value={store._id}
                  className="border rounded-xl shadow-sm overflow-hidden bg-white"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-green-50 transition-colors">
                    <div className="grid grid-cols-12 w-full items-center text-left gap-4">
                      <div className="col-span-4 font-bold text-base flex items-center gap-3">
                        <Store className="text-green-600 w-5 h-5" />
                        {store.name || "Unnamed Store"}
                      </div>
                      <div className="col-span-3 text-gray-600 flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4" /> {getLocationName(store.location)}
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="text-xl font-bold text-green-600">
                          ₹{(store.dailySales || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">daily avg</div>
                      </div>
                      <div className="col-span-2 text-right font-semibold text-sm">
                        {store.stock || 0} items
                      </div>
                      <div className="col-span-1">
                        <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 transition-all"
                            style={{
                              width: `${Math.min(((store.stock || 0) / 200) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 py-6 bg-gradient-to-b from-green-50 to-white border-t">
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
                          Manager: <strong>{store.manager || "Unassigned"}</strong>
                        </p>
                        <p>
                          Returns:{" "}
                          <Badge variant="destructive">{store.returns || 0}</Badge>
                        </p>
                        <p>
                          Scrap: <Badge variant="secondary">{store.scrap || 0}</Badge>
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-green-700 mb-4">Fast Moving</h4>
                        <ul className="space-y-2">
                          {(store.fastMoving || []).map((item, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-green-600"
                            >
                              <span className="text-xs">✔</span> {item}
                            </li>
                          ))}
                          {(!store.fastMoving || store.fastMoving.length === 0) && (
                            <li className="text-gray-400 text-sm">No items</li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-orange-700 mb-4">
                          Slow Moving
                        </h4>
                        <ul className="space-y-2">
                          {(store.slowMoving || []).map((item, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-orange-600"
                            >
                              <span className="text-xs">⚠</span> {item}
                            </li>
                          ))}
                          {(!store.slowMoving || store.slowMoving.length === 0) && (
                            <li className="text-gray-400 text-sm">No items</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {store.lowStockAlerts && store.lowStockAlerts.length > 0 && (
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
                          {(store.transferHistory || []).map((t, i) => (
                            <li key={i} className="text-gray-600">
                              {t.date} → +{t.qty} from <strong>{t.from}</strong>
                            </li>
                          ))}
                          {(!store.transferHistory || store.transferHistory.length === 0) && (
                            <li className="text-gray-400">No transfers</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Last 7 Days Sales</h4>
                        <div className="space-y-1 text-right font-mono text-sm">
                          {(store.last7DaysSales || []).map((sale, i) => (
                            <div key={i}>
                              Day {i + 1}: ₹{(sale || 0).toLocaleString()}
                            </div>
                          ))}
                          {(!store.last7DaysSales || store.last7DaysSales.length === 0) && (
                            <div className="text-gray-400 text-left">No data</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Pagination */}
          {totalStores > 0 && <Pagination />}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoresManagement;
