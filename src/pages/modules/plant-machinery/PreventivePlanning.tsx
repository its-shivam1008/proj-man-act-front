import { useState, useEffect } from "react";
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
  Calendar,
  Search,
  MapPin,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Users,
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ClipLoader } from "react-spinners";

/* -------------------------------
   Types
------------------------------- */
type FrequencyType = "Daily" | "Weekly" | "Bi-Weekly" | "Monthly" | "Quarterly" | "Yearly";
type StatusType = "Active" | "Inactive" | "Completed" | "Overdue";
type PriorityType = "Low" | "Medium" | "High" | "Critical";

interface SparePart {
  partName: string;
  quantity: number;
  estimatedCost: number;
}

interface PreventivePlanningForm {
  planName?: string;
  equipmentId?: string;
  equipmentName?: string;
  frequency?: FrequencyType;
  nextExecutionDate?: string;
  lastExecutionDate?: string;
  maintenanceTeam?: string;
  tasksToPerform?: string[];
  estimatedDuration?: number;
  requiredSkills?: string[];
  spareParts?: SparePart[];
  priority?: PriorityType;
  status?: StatusType;
  autoGenerateRequest?: boolean;
  location?: string;
  notes?: string;
}

interface PreventivePlanning {
  _id: string;
  planName: string;
  equipmentId: string;
  equipmentName: string;
  frequency: FrequencyType;
  nextExecutionDate: string;
  lastExecutionDate?: string;
  maintenanceTeam?: string;
  tasksToPerform?: string[];
  estimatedDuration?: number;
  requiredSkills?: string[];
  spareParts?: SparePart[];
  priority: PriorityType;
  status: StatusType;
  autoGenerateRequest: boolean;
  location?: string | { _id: string; name: string };
  notes?: string;
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------
   Component
------------------------------- */
const PreventivePlanning: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);
  const { equipments } = useSelector((state: RootState) => state.equipment);
  
  const canView = usePermission('preventivePlanning', 'view');
  const canCreate = usePermission('preventivePlanning', 'create');
  const canEdit = usePermission('preventivePlanning', 'edit');
  const canDelete = usePermission('preventivePlanning', 'delete');

  const [records, setRecords] = useState<PreventivePlanning[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);

  const debouncedSearch = useDebounce(query, 500);
  const organisationId = localStorage.getItem('organisationId');

  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PreventivePlanning | null>(null);
  const [form, setForm] = useState<PreventivePlanningForm>({
    frequency: "Monthly",
    priority: "Medium",
    status: "Active",
    autoGenerateRequest: false,
    location: isLocationRestricted ? userProfile?.location : undefined,
    tasksToPerform: [],
    requiredSkills: [],
    spareParts: [],
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
      fetchPreventivePlannings();
    }
  }, [organisationId, page, debouncedSearch, locationFilter, statusFilter, frequencyFilter, priorityFilter]);

  const fetchPreventivePlannings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organisationId: organisationId!,
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        location: locationFilter,
        status: statusFilter,
        frequency: frequencyFilter,
        priority: priorityFilter,
      });

      const response = await fetch(`${BASE_URL}/preventive-planning?${params}`, {
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
        toast.error(data.message || "Failed to fetch preventive planning records");
      }
    } catch (error) {
      toast.error("Failed to fetch preventive planning records");
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
      frequency: "Monthly",
      priority: "Medium",
      status: "Active",
      autoGenerateRequest: false,
      location: isLocationRestricted ? userProfile?.location : undefined,
      tasksToPerform: [],
      requiredSkills: [],
      spareParts: [],
    });
    setIsDialogOpen(true);
  }

  function openEdit(rec: PreventivePlanning) {
    setEditing(rec);
    const getSafeId = (field: any) => (typeof field === 'object' && field?._id ? field._id : field);
    setForm({
      ...rec,
      location: getSafeId(rec.location),
      nextExecutionDate: rec.nextExecutionDate ? new Date(rec.nextExecutionDate).toISOString().split('T')[0] : undefined,
      lastExecutionDate: rec.lastExecutionDate ? new Date(rec.lastExecutionDate).toISOString().split('T')[0] : undefined,
    });
    setIsDialogOpen(true);
  }

  async function deleteRecord(id: string) {
    if (!confirm("Delete this preventive planning record?")) return;
    
    try {
      const response = await fetch(`${BASE_URL}/preventive-planning/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Record deleted successfully");
        fetchPreventivePlannings();
      } else {
        toast.error(data.message || "Failed to delete record");
      }
    } catch (error) {
      toast.error("Failed to delete record");
      console.error(error);
    }
  }

  async function saveRecord() {
    if (!form.planName || !form.equipmentId || !form.equipmentName || !form.location || !form.nextExecutionDate) {
      toast.error("Plan Name, Equipment, Location, and Next Execution Date are required");
      return;
    }

    // Validate that equipment exists in the list (for new records)
    if (!editing) {
      const equipmentExists = equipments.find(eq => 
        eq.name === form.equipmentName && (eq.code === form.equipmentId || eq._id === form.equipmentId)
      );
      if (!equipmentExists && equipments.length > 0) {
        toast.error("Please select a valid equipment from the dropdown");
        return;
      }
    }

    try {
      const url = editing ? `${BASE_URL}/preventive-planning/${editing._id}` : `${BASE_URL}/preventive-planning/create`;
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
        fetchPreventivePlannings();
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
    if (typeof locData === 'object' && locData.name) return locData.name;
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

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleFrequencyFilterChange = (val: string) => {
    setFrequencyFilter(val);
    setPage(1);
  };

  const handlePriorityFilterChange = (val: string) => {
    setPriorityFilter(val);
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

  const getStatusBadge = (status: StatusType) => {
    const variants: Record<StatusType, string> = {
      Active: "bg-green-100 text-green-800 border-green-200",
      Inactive: "bg-gray-100 text-gray-800 border-gray-200",
      Completed: "bg-blue-100 text-blue-800 border-blue-200",
      Overdue: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[status];
  };

  const getPriorityBadge = (priority: PriorityType) => {
    const variants: Record<PriorityType, string> = {
      Low: "bg-gray-100 text-gray-800 border-gray-200",
      Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      High: "bg-orange-100 text-orange-800 border-orange-200",
      Critical: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[priority];
  };

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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold">Preventive Planning</h2>
          <p className="text-muted-foreground">Manage scheduled maintenance plans to prevent equipment failure.</p>
        </div>

        {canCreate && (
          <Button onClick={openAdd} className="flex items-center gap-2">
            <Plus size={16} />
            Create Plan
          </Button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by plan name, equipment, team..."
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
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={frequencyFilter} onValueChange={handleFrequencyFilterChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequency</SelectItem>
            <SelectItem value="Daily">Daily</SelectItem>
            <SelectItem value="Weekly">Weekly</SelectItem>
            <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
            <SelectItem value="Yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Preventive Planning Records ({totalRecords})</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Plan Name</TableHead>
                  <TableHead className="min-w-[150px]">Equipment</TableHead>
                  <TableHead className="min-w-[120px]">Location</TableHead>
                  <TableHead className="min-w-[100px]">Frequency</TableHead>
                  <TableHead className="min-w-[120px]">Next Execution</TableHead>
                  <TableHead className="min-w-[120px]">Team</TableHead>
                  <TableHead className="min-w-[80px]">Priority</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-3">
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
                    <TableCell colSpan={9} className="text-center py-6">
                      No preventive planning records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium">{r.planName}</TableCell>
                      <TableCell>{r.equipmentName} ({r.equipmentId})</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {getLocationName(r.location)}
                        </div>
                      </TableCell>
                      <TableCell>{r.frequency}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(r.nextExecutionDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          {r.maintenanceTeam || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(r.priority)} variant="outline">
                          {r.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(r.status)} variant="outline">
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(r)}
                            >
                              <Edit2 size={16} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRecord(r._id)}
                            >
                              <Trash2 size={16} className="text-red-500" />
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

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Preventive Planning" : "Create Preventive Planning"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Plan Name */}
            <div className="space-y-2">
              <Label htmlFor="planName">Plan Name *</Label>
              <Input
                id="planName"
                value={form.planName || ""}
                onChange={(e) => setForm({ ...form, planName: e.target.value })}
                placeholder="Enter plan name"
              />
            </div>

            {/* Equipment Selection */}
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment *</Label>
              <Select
                value={form.equipmentId || ""}
                onValueChange={(value) => {
                  const selectedEquipment = equipments.find(eq => eq._id === value);
                  if (selectedEquipment) {
                    setForm({
                      ...form,
                      equipmentId: selectedEquipment.code || selectedEquipment._id,
                      equipmentName: selectedEquipment.name,
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map((equipment) => (
                    <SelectItem key={equipment._id} value={equipment._id}>
                      {equipment.name} ({equipment.code || equipment._id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select
                disabled={isLocationRestricted}
                value={form.location || ""}
                onValueChange={(value) => setForm({ ...form, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location._id} value={location._id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={form.frequency || "Monthly"}
                onValueChange={(value: FrequencyType) => setForm({ ...form, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Next Execution Date */}
            <div className="space-y-2">
              <Label htmlFor="nextExecutionDate">Next Execution Date *</Label>
              <Input
                id="nextExecutionDate"
                type="date"
                value={form.nextExecutionDate || ""}
                onChange={(e) => setForm({ ...form, nextExecutionDate: e.target.value })}
              />
            </div>

            {/* Last Execution Date */}
            <div className="space-y-2">
              <Label htmlFor="lastExecutionDate">Last Execution Date</Label>
              <Input
                id="lastExecutionDate"
                type="date"
                value={form.lastExecutionDate || ""}
                onChange={(e) => setForm({ ...form, lastExecutionDate: e.target.value })}
              />
            </div>

            {/* Maintenance Team */}
            <div className="space-y-2">
              <Label htmlFor="maintenanceTeam">Maintenance Team</Label>
              <Input
                id="maintenanceTeam"
                value={form.maintenanceTeam || ""}
                onChange={(e) => setForm({ ...form, maintenanceTeam: e.target.value })}
                placeholder="Enter maintenance team"
              />
            </div>

            {/* Estimated Duration */}
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                min="0"
                step="0.5"
                value={form.estimatedDuration || ""}
                onChange={(e) => setForm({ ...form, estimatedDuration: parseFloat(e.target.value) || undefined })}
                placeholder="Enter duration in hours"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority || "Medium"}
                onValueChange={(value: PriorityType) => setForm({ ...form, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status || "Active"}
                onValueChange={(value: StatusType) => setForm({ ...form, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Generate Request */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoGenerateRequest"
                  checked={form.autoGenerateRequest || false}
                  onChange={(e) => setForm({ ...form, autoGenerateRequest: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="autoGenerateRequest">Auto Generate Request</Label>
              </div>
            </div>

            {/* Tasks to Perform */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tasksToPerform">Tasks to Perform</Label>
              <Textarea
                id="tasksToPerform"
                value={form.tasksToPerform?.join('\n') || ""}
                onChange={(e) => setForm({ 
                  ...form, 
                  tasksToPerform: e.target.value.split('\n').filter(task => task.trim()) 
                })}
                placeholder="Enter tasks (one per line)"
                rows={3}
              />
            </div>

            {/* Required Skills */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="requiredSkills">Required Skills</Label>
              <Textarea
                id="requiredSkills"
                value={form.requiredSkills?.join('\n') || ""}
                onChange={(e) => setForm({ 
                  ...form, 
                  requiredSkills: e.target.value.split('\n').filter(skill => skill.trim()) 
                })}
                placeholder="Enter required skills (one per line)"
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Enter additional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRecord}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreventivePlanning;