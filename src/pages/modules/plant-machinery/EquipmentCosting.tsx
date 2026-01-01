import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { fetchEquipments } from "@/redux/slices/equipmentSlice";
import { toast } from "sonner";
import { usePermission } from "@/hooks/userPermission";
import { useDebounce } from "@/hooks/useDebounce";
import { BASE_URL } from "@/utils/constants";
import {
  Plus,
  Edit2,
  Trash2,
  Calculator,
  Search,
  MapPin,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Cog,
  Wrench,
  AlertTriangle,
  Shield,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipLoader } from "react-spinners";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

/* -------------------------------
   Types
------------------------------- */
type DepreciationMethod = "Straight Line" | "WDV";

interface EquipmentCostForm {
  equipmentCode?: string;
  equipmentName?: string;
  purchaseCost?: number;
  operationCost?: number;
  maintenanceCost?: number;
  downtimeCost?: number;
  insuranceCost?: number;
  depreciationMethod?: DepreciationMethod;
  usefulLifeYears?: number;
  acquisitionDate?: string;
  allocatedTo?: string;
  location?: string; // Always a string ID in the form
}

interface EquipmentCost {
  _id: string;
  equipmentCode: string;
  equipmentName: string;
  purchaseCost: number;
  operationCost: number;
  maintenanceCost: number;
  downtimeCost: number;
  insuranceCost: number;
  depreciationMethod: DepreciationMethod;
  usefulLifeYears: number;
  accumulatedDepreciation: number;
  acquisitionDate: string;
  allocatedTo?: string;
  location?: string | { _id: string; name: string };
  totalCost?: number;
  netBookValue?: number;
  roaPercentage?: string;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------
   Component
------------------------------- */
export default function EquipmentCostingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);
  const { equipments } = useSelector((state: RootState) => state.equipment);
  
  const canView = usePermission('equipmentCosting', 'view');
  const canCreate = usePermission('equipmentCosting', 'create');
  const canEdit = usePermission('equipmentCosting', 'edit');
  const canDelete = usePermission('equipmentCosting', 'delete');

  const [records, setRecords] = useState<EquipmentCost[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [depreciationFilter, setDepreciationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  const [showCostInfo, setShowCostInfo] = useState(false);

  const debouncedSearch = useDebounce(query, 500);
  const organisationId = localStorage.getItem('organisationId');

  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentCost | null>(null);
  const [form, setForm] = useState<EquipmentCostForm>({
    depreciationMethod: "Straight Line",
    usefulLifeYears: 10,
    purchaseCost: 0,
    operationCost: 0,
    maintenanceCost: 0,
    downtimeCost: 0,
    insuranceCost: 0,
    location: isLocationRestricted ? userProfile?.location : undefined,
  });

  /* -------------------------------
     Load Data & Effects
  ------------------------------- */
  useEffect(() => {
    dispatch(fetchMasterData("location"));
    dispatch(fetchEquipments({})); // Fetch all equipments
  }, [dispatch]);

  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  useEffect(() => {
    if (organisationId) {
      fetchEquipmentCostings();
    }
  }, [organisationId, page, debouncedSearch, locationFilter, depreciationFilter]);

  const fetchEquipmentCostings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organisationId: organisationId!,
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        location: locationFilter,
        depreciationMethod: depreciationFilter,
      });

      const response = await fetch(`${BASE_URL}/equipment-costing?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setRecords(data.data);
        setTotalPages(data.pagination.pages);
        setTotalRecords(data.pagination.total);
      } else {
        toast.error(data.message || "Failed to fetch equipment costing records");
      }
    } catch (error) {
      toast.error("Failed to fetch equipment costing records");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     CRUD Operations
  ------------------------------- */
  function openAdd() {
    setEditing(null);
    setForm({
      depreciationMethod: "Straight Line",
      usefulLifeYears: 10,
      purchaseCost: 0,
      operationCost: 0,
      maintenanceCost: 0,
      downtimeCost: 0,
      insuranceCost: 0,
      location: isLocationRestricted ? userProfile?.location : undefined,
    });
    setIsDialogOpen(true);
  }

  function openEdit(rec: EquipmentCost) {
    setEditing(rec);
    // Extract location ID if it's a populated object
    const getSafeId = (field: any) => (typeof field === 'object' && field?._id ? field._id : field);
    setForm({
      ...rec,
      location: getSafeId(rec.location),
    });
    setIsDialogOpen(true);
  }

  async function deleteRecord(id: string) {
    if (!confirm("Delete this record?")) return;
    
    try {
      const response = await fetch(`${BASE_URL}/equipment-costing/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Record deleted successfully");
        fetchEquipmentCostings(); // This will update the records and auto-calculate summary
      } else {
        toast.error(data.message || "Failed to delete record");
      }
    } catch (error) {
      toast.error("Failed to delete record");
      console.error(error);
    }
  }

  async function saveRecord() {
    if (!form.equipmentCode || !form.equipmentName || !form.location) {
      toast.error("Equipment Code, Name, and Location are required");
      return;
    }

    // Validate that equipment exists in the list (for new records)
    if (!editing) {
      const equipmentExists = equipments.find(eq => 
        eq.name === form.equipmentName && eq.code === form.equipmentCode
      );
      if (!equipmentExists && equipments.length > 0) {
        toast.error("Please select a valid equipment from the dropdown");
        return;
      }
    }

    try {
      const url = editing ? `${BASE_URL}/equipment-costing/${editing._id}` : `${BASE_URL}/equipment-costing/create`;
      const method = editing ? 'PUT' : 'POST';
      
      const payload = {
        ...form,
        organisationId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editing ? "Record updated successfully" : "Record created successfully");
        setIsDialogOpen(false);
        fetchEquipmentCostings(); // This will update the records and auto-calculate summary
      } else {
        toast.error(data.message || "Failed to save record");
      }
    } catch (error) {
      toast.error("Failed to save record");
      console.error(error);
    }
  }

  /* -------------------------------
     Helper Functions
  ------------------------------- */
  const getLocationName = (locData: string | { _id: string; name: string } | undefined) => {
    if (!locData) return "N/A";
    // If it's already populated (object with name), return the name
    if (typeof locData === 'object' && locData.name) return locData.name;
    // If it's just an ID string, find it in the locations array
    const found = locations.find((l) => l._id === locData);
    return found ? found.name : "Unknown Location";
  };

  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  };

  const handleDepreciationFilterChange = (val: string) => {
    setDepreciationFilter(val);
    setPage(1);
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Calculate summary from current table records for real-time updates
  const currentSummary = useMemo(() => {
    const totalCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const totalDepreciation = records.reduce((sum, r) => sum + (r.accumulatedDepreciation || 0), 0);
    const totalNetBookValue = records.reduce((sum, r) => sum + (r.netBookValue || 0), 0);
    
    return {
      totalCost,
      totalDepreciation,
      totalNetBookValue,
      totalEquipment: records.length
    };
  }, [records]);

  // Calculate cost breakdown from current records
  const costBreakdownChart = useMemo(() => {
    const totalPurchase = records.reduce((sum, r) => sum + (r.purchaseCost || 0), 0);
    const totalOperation = records.reduce((sum, r) => sum + (r.operationCost || 0), 0);
    const totalMaintenance = records.reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
    const totalDowntime = records.reduce((sum, r) => sum + (r.downtimeCost || 0), 0);
    const totalInsurance = records.reduce((sum, r) => sum + (r.insuranceCost || 0), 0);
    
    return [
      { name: "Purchase", value: totalPurchase },
      { name: "Operation", value: totalOperation },
      { name: "Maintenance", value: totalMaintenance },
      { name: "Downtime", value: totalDowntime },
      { name: "Insurance", value: totalInsurance },
    ];
  }, [records]);

  const COLORS = ["#3b82f6", "#f97316", "#10b981", "#ef4444", "#6366f1"];

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

  /* -------------------------------
     Render
  ------------------------------- */
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6" /> Equipment Costing & Depreciation
        </h1>
        {canCreate && (
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Record
          </Button>
        )}
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
              <Calculator className="w-4 h-4" />
              <span className="text-sm font-medium">Total Cost</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              ₹{currentSummary.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-blue-500 mt-1">
              From {currentSummary.totalEquipment} equipment(s)
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Depreciation</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">
              ₹{currentSummary.totalDepreciation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-orange-500 mt-1">
              Accumulated depreciation
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Net Book Value</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              ₹{currentSummary.totalNetBookValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-green-500 mt-1">
              Current asset value
            </div>
          </CardContent>
        </Card>
      </div>

      {/* charts */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {costBreakdownChart.every((c) => c.value === 0) ? (
            <div className="text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie
                  data={costBreakdownChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {costBreakdownChart.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by code, name, allocated to..."
            className="pl-10"
            value={query}
            onChange={handleSearchChange}
          />
        </div>
        <Select 
          disabled={isLocationRestricted} 
          value={locationFilter} 
          onValueChange={handleLocationFilterChange}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc._id} value={loc._id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={depreciationFilter} onValueChange={handleDepreciationFilterChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="Straight Line">Straight Line</SelectItem>
            <SelectItem value="WDV">WDV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cost Types Info Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCostInfo(!showCostInfo)}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800"
          >
            <Info className="w-4 h-4" />
            Cost Types Information
            {showCostInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          {showCostInfo && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <ShoppingCart className="w-4 h-4" />
                <span><strong>Purchase Cost:</strong> Initial equipment acquisition cost</span>
              </div>
              <div className="flex items-center gap-2 text-orange-700">
                <Cog className="w-4 h-4" />
                <span><strong>Operation Cost:</strong> Daily operational expenses</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <Wrench className="w-4 h-4" />
                <span><strong>Maintenance Cost:</strong> Regular maintenance and repairs</span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span><strong>Downtime Cost:</strong> Cost due to equipment downtime</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <Shield className="w-4 h-4" />
                <span><strong>Insurance Cost:</strong> Insurance premiums and coverage</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calculator className="w-4 h-4" />
                <span><strong>Total Cost:</strong> Sum of all cost components</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Cost Records ({totalRecords})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]"> {/* Ensure minimum width for all columns */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Code</TableHead>
                    <TableHead className="min-w-[150px]">Name</TableHead>
                    <TableHead className="min-w-[120px]">Location</TableHead>
                    <TableHead className="min-w-[100px] text-blue-700">
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-4 h-4" />
                        Purchase Cost
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[100px] text-orange-700">
                      <div className="flex items-center gap-1">
                        <Cog className="w-4 h-4" />
                        Operation Cost
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[110px] text-green-700">
                      <div className="flex items-center gap-1">
                        <Wrench className="w-4 h-4" />
                        Maintenance Cost
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[100px] text-red-700">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Downtime Cost
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[100px] text-purple-700">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Insurance Cost
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[100px] text-gray-900 font-bold">Total Cost</TableHead>
                    <TableHead className="min-w-[100px]">Depreciation</TableHead>
                    <TableHead className="min-w-[100px]">Net Value</TableHead>
                    <TableHead className="min-w-[80px]">ROA %</TableHead>
                    <TableHead className="min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-3">
                      <ClipLoader
                        color="#212121"
                        loading={loading}
                        size={15}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                      />
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-6">
                      No equipment costing records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>{r.equipmentCode}</TableCell>
                      <TableCell>{r.equipmentName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {getLocationName(r.location)}
                        </div>
                      </TableCell>
                      <TableCell className="text-blue-600 font-medium">₹{r.purchaseCost.toFixed(2)}</TableCell>
                      <TableCell className="text-orange-600 font-medium">₹{r.operationCost.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600 font-medium">₹{r.maintenanceCost.toFixed(2)}</TableCell>
                      <TableCell className="text-red-600 font-medium">₹{r.downtimeCost.toFixed(2)}</TableCell>
                      <TableCell className="text-purple-600 font-medium">₹{r.insuranceCost.toFixed(2)}</TableCell>
                      <TableCell className="text-gray-900 font-bold">₹{(r.totalCost || 0).toFixed(2)}</TableCell>
                      <TableCell>₹{r.accumulatedDepreciation.toFixed(2)}</TableCell>
                      <TableCell>₹{(r.netBookValue || 0).toFixed(2)}</TableCell>
                      <TableCell>{r.roaPercentage}%</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(r)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteRecord(r._id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
        
        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} (Total: {totalRecords})
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={page === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Equipment Cost" : "Add Equipment Cost"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Equipment Code *</Label>
              <Input
                value={form.equipmentCode || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, equipmentCode: e.target.value }))
                }
                placeholder="Auto-filled when equipment is selected"
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                *Auto-filled when you select an equipment above
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Equipment Name *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(fetchEquipments({}))}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <Select
                value={form.equipmentName || ""}
                onValueChange={(value) => {
                  const selectedEquipment = equipments.find(eq => eq.name === value);
                  setForm((f) => ({ 
                    ...f, 
                    equipmentName: value,
                    equipmentCode: selectedEquipment?.code || f.equipmentCode || ""
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.length === 0 ? (
                    <SelectItem value="no-equipment" disabled>
                      No equipment available
                    </SelectItem>
                  ) : (
                    equipments.map((equipment) => (
                      <SelectItem key={equipment._id || equipment.id} value={equipment.name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{equipment.name}</span>
                          <span className="text-xs text-gray-500">
                            Code: {equipment.code} | Model: {equipment.model || 'N/A'}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Location Field */}
            <div>
              <Label>Location *</Label>
              <Select
                value={form.location || ""}
                onValueChange={(value) => setForm((f) => ({ ...f, location: value }))}
                disabled={isLocationRestricted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLocationRestricted && (
                <p className="text-xs text-muted-foreground mt-1">
                  *Location is fixed based on your permissions.
                </p>
              )}
            </div>
            
            <div>
              <Label>Allocated To (Dept / Project)</Label>
              <Input
                value={form.allocatedTo || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    allocatedTo: e.target.value,
                  }))
                }
              />
            </div>
            
            <div>
              <Label>Purchase Cost</Label>
              <Input
                type="number"
                value={form.purchaseCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    purchaseCost: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Operation Cost</Label>
              <Input
                type="number"
                value={form.operationCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    operationCost: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Maintenance Cost</Label>
              <Input
                type="number"
                value={form.maintenanceCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maintenanceCost: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Downtime Cost</Label>
              <Input
                type="number"
                value={form.downtimeCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    downtimeCost: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Insurance Cost</Label>
              <Input
                type="number"
                value={form.insuranceCost || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    insuranceCost: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label>Depreciation Method</Label>
              <Select
                value={form.depreciationMethod || "Straight Line"}
                onValueChange={(value: DepreciationMethod) =>
                  setForm((f) => ({
                    ...f,
                    depreciationMethod: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Straight Line">Straight Line</SelectItem>
                  <SelectItem value="WDV">WDV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Useful Life (Years)</Label>
              <Input
                type="number"
                value={form.usefulLifeYears || 10}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usefulLifeYears: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="col-span-2">
              <Label>Acquisition Date</Label>
              <Input
                type="date"
                value={form.acquisitionDate || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    acquisitionDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRecord}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

