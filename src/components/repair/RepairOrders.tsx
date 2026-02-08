import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Download,
  Plus,
  Package,
  User,
  MapPin,
  Eye,
  Edit,
  Play,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Wrench,
  Activity,
  X,
  AlertCircle
} from 'lucide-react';
import { usePermission } from '@/hooks/userPermission';
import { fetchMasterData } from '@/redux/slices/masterDataSlice';
import { fetchRepairOrders, createRepairOrder, deleteRepairOrder } from '@/redux/slices/repairOrderSlice';
import { fetchProducts } from '@/redux/slices/productSlice';
import { fetchRepairTeams } from '@/redux/slices/repairTeamSlice';
import { BreakdownMaintenance } from '@/types/plantMachinery';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { BASE_URL } from '@/utils/constants';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { RootState } from '@/redux/store';
import { fetchMachineries } from '@/redux/slices/plantandmachinary/machinerySlice';
import { fetchEquipments } from '@/redux/slices/equipmentSlice';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { SelectValue } from '@radix-ui/react-select';
import { Textarea } from '../ui/textarea';
interface CreateRepairOrderModalProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  machineries: any[];
  equipments: any[];
  repairTeams: any[];
  masterDataLocations: any[];
  isLocationRestricted: boolean;
}
// CreateRepairOrderModal component moved outside to prevent re-creation
const CreateRepairOrderModal: React.FC<CreateRepairOrderModalProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  machineries,
  equipments,
  repairTeams,
  masterDataLocations,
  isLocationRestricted,
}) => {
  // Helper to handle Select value changes easily
  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Helper for Asset Type change (resets assetId)
  const handleAssetTypeChange = (value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      assetType: value,
      assetId: "",
    }));
  };

  const assetList = formData.assetType === "machinery" ? machineries : equipments;

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Create New Repair Order</DialogTitle>
            {/* Close button is handled automatically by Dialog, but if you need custom X: */}
            {/* <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button> */}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2">
          <form id="repair-form" onSubmit={onSubmit} className="space-y-8">

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Basic Information
              </h4>
              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assetType">Asset Type *</Label>
                  <Select
                    value={formData.assetType}
                    onValueChange={handleAssetTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="machinery">Machinery</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetId">Asset *</Label>
                  <Select
                    value={formData.assetId}
                    onValueChange={(val) => handleSelectChange("assetId", val)}
                    disabled={!formData.assetType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetList.map((item: any) => (
                        <SelectItem key={item._id} value={item._id}>
                          {item.machineName || item.equipmentName || item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        quantity: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialLotNumber">Serial/Lot Number</Label>
                  <Input
                    id="serialLotNumber"
                    placeholder="Enter serial or lot number"
                    value={formData.serialLotNumber}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        serialLotNumber: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label htmlFor="customerName">Customer/Department *</Label>
                  <Input
                    id="customerName"
                    placeholder="Customer name or internal department"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Repair Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Repair Details
              </h4>
              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Repair Type *</Label>
                  <Select
                    value={formData.repairType}
                    onValueChange={(val) => handleSelectChange("repairType", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warranty">In-Warranty</SelectItem>
                      <SelectItem value="paid">Out-of-Warranty (Paid)</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(val) => handleSelectChange("priority", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Root Cause *</Label>
                  <Select
                    value={formData.rootCause}
                    onValueChange={(val) => handleSelectChange("rootCause", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Cause" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damage">Physical Damage</SelectItem>
                      <SelectItem value="defect">Manufacturing Defect</SelectItem>
                      <SelectItem value="misuse">Misuse/Abuse</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issueDescription">Issue Description *</Label>
                <Textarea
                  id="issueDescription"
                  rows={3}
                  placeholder="Detailed description of the issue..."
                  value={formData.issueDescription}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      issueDescription: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Parts Cost</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      className="pl-7"
                      value={formData.partsCost}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          partsCost: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Labor Cost</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      className="pl-7"
                      value={formData.laborCost}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          laborCost: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="col-span-2 text-right">
                  <p className="text-sm font-medium">
                    Total Estimated Cost:
                    <span className="ml-2 text-lg font-bold">
                      ₹{(Number(formData.partsCost) + Number(formData.laborCost)).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment & Timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Assignment & Timeline
              </h4>
              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Responsible Team *</Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={(val) => handleSelectChange("teamId", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      {repairTeams.map((team: any) => (
                        <SelectItem key={team._id} value={team._id}>
                          {team.teamName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTechnician">Assigned Technician *</Label>
                  <Input
                    id="assignedTechnician"
                    placeholder="Enter technician name"
                    value={formData.assignedTechnician || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        assignedTechnician: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestedDate">Requested Date *</Label>
                  <Input
                    id="requestedDate"
                    type="date"
                    value={formData.requestedDate}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        requestedDate: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedCompletion">Expected Completion *</Label>
                  <Input
                    id="expectedCompletion"
                    type="date"
                    value={formData.expectedCompletion}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        expectedCompletion: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                {!isLocationRestricted && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Location *</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(val) => handleSelectChange("location", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Location" />
                      </SelectTrigger>
                      <SelectContent>
                        {masterDataLocations.map((location: any) => (
                          <SelectItem key={location._id} value={location._id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" form="repair-form">
            Create Repair Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RepairOrders: React.FC = () => {
  const dispatch = useDispatch();


  // Inside RepairOrders component
  // const [pendingBreakdown, setPendingBreakdown] = useState<any>(null);
  const [pendingBreakdowns, setPendingBreakdowns] = useState<any[]>([]);
  const [showAcceptRejectModal, setShowAcceptRejectModal] = useState(false);
  const [pendingBreakdown, setPendingBreakdown] = useState<any>(null);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingOrder, setCompletingOrder] = useState<any>(null);

  const openCompleteModal = (order: any) => {
    setCompletingOrder(order);
    setShowCompleteModal(true);
  };
  const handleCompleteRepair = async () => {
    try {
      await fetch(`${BASE_URL}/repair-orders/${completingOrder._id}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          partsCost: completingOrder.partsCost,
          laborCost: completingOrder.laborCost,
        }),
      });

      setShowCompleteModal(false);
      setCompletingOrder(null);

      // refresh data
      dispatch(fetchRepairOrders({
        location: locationFilter !== 'all' ? locationFilter : undefined
      }) as any);

    } catch (err) {
      console.error("Failed to complete repair", err);
    }
  };

  const fetchPendingBreakdowns = async () => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      if (!organisationId) return;

      const res = await fetch(
        `${BASE_URL}/breakdown-maintenance?organisationId=${organisationId}&status=Reported`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      console.log("Pending breakdown response:", data);

      if (data.success && data.data?.breakdowns?.length) {
        setPendingBreakdowns(data.data.breakdowns);
      }
    } catch (err) {
      console.error("Failed to fetch pending breakdowns", err);
    }
  };


  // 1. Function to handle the initial click on a breakdown notification/item


  const onAcceptClick = () => {
    if (!pendingBreakdown) return; // 🔐 HARD GUARD

    setShowAcceptRejectModal(false);

    // remove handled breakdown from list
    setPendingBreakdowns(prev =>
      prev.filter(b => b._id !== pendingBreakdown._id)
    );

    setTimeout(() => {
      setCreateFormData({
        assetType: pendingBreakdown.assetType,
        assetId: pendingBreakdown.assetId,

        customerName: "Internal Breakdown",
        issueDescription: pendingBreakdown.failureDescription,
        location: pendingBreakdown.location,

        priority: pendingBreakdown.priority.toLowerCase(),
        repairType: "internal",

        notes: '',
      });

      setShowCreateForm(true);
    }, 150);
  };



  const onRejectClick = async () => {
    await fetch(
      `${BASE_URL}/breakdown-maintenance/${pendingBreakdown._id}/reject`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setShowAcceptRejectModal(false);

    // 🚫 remove rejected breakdown
    setPendingBreakdowns(prev =>
      prev.filter(b => b._id !== pendingBreakdown._id)
    );
  };


  // Redux state
  const { userProfile } = useSelector((state: any) => state.auth);
  const { locations } = useSelector((state: any) => state.masterData);
  const { data: repairOrders, loading } = useSelector((state: any) => state.repairOrders);
  const { products } = useSelector((state: any) => state.products);
  const { data: repairTeams } = useSelector((state: any) => state.repairTeams);


  const { machineries } = useSelector((s: RootState) => s.machinery);
  const { equipments } = useSelector((s: RootState) => s.equipment);

  const [formData, setFormData] = useState({
    assetType: "machinery",
    assetId: "",
    issueDescription: "",
    priority: "Medium",
  });

  useEffect(() => {
    dispatch(fetchMachineries());
    dispatch(fetchEquipments());
  }, [dispatch]);

  // Debug Redux state
  console.log('Redux State Debug:', {
    repairOrdersState: useSelector((state: any) => state.repairOrders),
    repairOrdersData: repairOrders,
    repairOrdersLength: repairOrders?.length,
    loading,
    userProfile: userProfile ? { role: userProfile.role, location: userProfile.location } : null
  });

  // Permissions
  const canView = usePermission('repair', 'view');
  const canCreate = usePermission('repair', 'create');
  const canEdit = usePermission('repair', 'edit');
  const canDelete = usePermission('repair', 'delete');

  // Local state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const [showAllRequestsModal, setShowAllRequestsModal] = useState(false);


  // Create form data
  const [createFormData, setCreateFormData] = useState({
    assetType: 'equipment', // 'equipment' | 'machinery'
    assetId: '',

    customerName: '',
    repairType: '',
    priority: '',
    rootCause: '',
    issueDescription: '',

    teamId: '',
    assignedTechnician: '',
    requestedDate: '',
    expectedCompletion: '',
    location: '',

    notes: '',
  });


  // Location restrictions
  const isLocationRestricted =
    userProfile?.role !== 'admin' &&
    !!userProfile?.location;

  // Location restriction working correctly
  console.log('RepairOrders: Location filter set to:', locationFilter);

  // Get locations from master data
  const masterDataLocations = React.useMemo(() => {
    return locations || [];
  }, [locations]);

  // Helper function to get location name by ID
  const getLocationName = (locationId: string) => {
    if (!locationId) return 'N/A';
    const location = masterDataLocations.find((loc: any) => loc._id === locationId);
    return location ? location.name : locationId;
  };

  // Load master data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location") as any);
    dispatch(fetchProducts({ page: 1, limit: 1000 }) as any);
    dispatch(fetchRepairTeams() as any);
  }, [dispatch]);

  // Set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      console.log('Setting location filter for restricted user:', userProfile.location);
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Load data when filters change
  useEffect(() => {
    const organisationId = localStorage.getItem('organisationId');

    if (organisationId && canView && userProfile) {
      console.log('Frontend: Sending API request with location filter:', {
        locationFilter,
        userProfileLocation: userProfile?.location,
        isLocationRestricted,
        organisationId,
        apiParams: { location: locationFilter !== 'all' ? locationFilter : undefined }
      });

      dispatch(fetchRepairOrders({
        location: locationFilter !== 'all' ? locationFilter : undefined
      }) as any);
    } else {
      console.log('Frontend: Not making API call because:', {
        organisationId: !!organisationId,
        canView,
        userProfile: !!userProfile
      });
    }
  }, [locationFilter, canView, dispatch, userProfile]);

  useEffect(() => {
    fetchPendingBreakdowns();
  }, []);
  // useEffect(() => {
  //   if (pendingBreakdowns.length && !showAcceptRejectModal && !showCreateForm) {
  //     setPendingBreakdown(pendingBreakdowns[0]);
  //     setShowAcceptRejectModal(true);
  //   }
  // }, [pendingBreakdowns, showAcceptRejectModal, showCreateForm]);
  // useEffect(() => {
  //   if (pendingBreakdowns.length && !showAcceptRejectModal && !showCreateForm) {
  //     setPendingBreakdown(pendingBreakdowns[0]);
  //     setShowAcceptRejectModal(true);
  //   }
  // }, [pendingBreakdowns]);


  // Runs whenever the orders list updates
  // Filter orders based on all filters

  const handleCancelCreateForm = () => {
    setShowCreateForm(false);

    setCreateFormData({
      assetType: 'equipment',
      assetId: '',

      customerName: '',
      repairType: '',
      priority: '',
      rootCause: '',
      issueDescription: '',

      teamId: '',
      assignedTechnician: '',
      requestedDate: '',
      expectedCompletion: '',
      location: '',

      notes: '',
    });
  };

  const filteredOrders = React.useMemo(() => {
    return repairOrders.filter((order: any) => {
      const asset =
        order.assetType === 'machinery'
          ? machineries.find((m: any) => m._id === order.assetId)
          : equipments.find((e: any) => e._id === order.assetId);
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        asset?.machineName?.toLowerCase().includes(search) ||
        asset?.equipmentName?.toLowerCase().includes(search) ||
        order.customerName?.toLowerCase().includes(search) ||
        order._id?.toLowerCase().includes(search);





      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesType = typeFilter === 'all' || order.repairType === typeFilter;
      const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      const matchesLocation = locationFilter === 'all' || order.location === locationFilter;

      return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesLocation;
    });
  }, [repairOrders, machineries, equipments, searchTerm, statusFilter, typeFilter, priorityFilter, locationFilter]);



  // Handle delete
  const handleDeleteRepairOrder = async (id: string) => {
    try {
      await dispatch(deleteRepairOrder(id) as any);
    } catch (error) {
      console.error('Failed to delete repair order:', error);
    }
  };

  // Handle create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newOrder = {
      ...createFormData,
      // For location-restricted users, use their location; otherwise use form data
      location: isLocationRestricted ? userProfile?.location : createFormData.location,
      status: 'draft' as const,
      repairType: createFormData.repairType as "warranty" | "paid" | "internal",
      priority: createFormData.priority as "low" | "medium" | "high",
      rootCause: createFormData.rootCause as "damage" | "defect" | "misuse" | "unknown",
      warrantyType: createFormData.warrantyType as "in-warranty" | "extended" | "expired",
    };

    try {
      await dispatch(createRepairOrder(newOrder) as any);
      setShowCreateForm(false);
      setCreateFormData({
        assetType: 'equipment',
        assetId: '',
        // assetCode: '',

        customerName: '',
        repairType: '',
        priority: '',
        rootCause: '',
        issueDescription: '',

        teamId: '',
        assignedTechnician: '',
        requestedDate: '',
        expectedCompletion: '',
        location: '',
        notes: '',
      });

    } catch (error) {
      console.error('Failed to create repair order:', error);
    }
  };

  // setTimeout(() => {
  //   setCreateFormData({
  //     assetType: pendingBreakdown.assetType,   // "machinery" | "equipment"
  //     assetId: pendingBreakdown.assetId,       // actual asset _id

  //     customerName: "Internal Breakdown",
  //     issueDescription: pendingBreakdown.failureDescription,
  //     location: pendingBreakdown.location,

  //     priority: pendingBreakdown.priority.toLowerCase(),
  //     repairType: "internal",

  //     breakdownId: pendingBreakdown._id,
  //     createdFrom: "BREAKDOWN",
  //   });

  //   setShowCreateForm(true);
  // }, 150);


  // Status color functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warranty':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'internal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'under-repair':
        return <Wrench className="h-5 w-5 text-yellow-500" />;
      case 'testing':
        return <Activity className="h-5 w-5 text-purple-500" />;
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  // ViewRepairOrderModal component
  const ViewRepairOrderModal = ({ order, onClose }: { order: any; onClose: () => void }) => {
    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Repair Order Details</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order ID</label>
                  <p className="text-sm text-gray-900">{order._id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{order.status}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                <p className="text-sm text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Issue Description</label>
                <p className="text-sm text-gray-900">{order.issueDescription}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="text-sm text-gray-900">{getLocationName(order.location)}</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-600">You do not have permission to view repair orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-900">Repair Orders</h3>

            {pendingBreakdowns.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowAllRequestsModal(true)}
                className="relative"
              >
                All Requests
                <span className="ml-2 rounded-full bg-red-600 text-white text-xs px-2 py-0.5">
                  {pendingBreakdowns.length}
                </span>
              </Button>
            )}
          </div>


          {canCreate && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </button>
          )}
        </div>


        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="under-repair">Under Repair</option>
            <option value="testing">Testing</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="warranty">Warranty</option>
            <option value="paid">Paid</option>
            <option value="internal">Internal</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {!isLocationRestricted && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {masterDataLocations.map((location: any) => (
                <option key={location._id} value={location._id}>{location.name}</option>
              ))}
            </select>
          )}
          {isLocationRestricted && (
            <div className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg border">
              Location: {getLocationName(userProfile?.location)}
            </div>
          )}
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading repair orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No repair orders found</p>
              {canCreate && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Create your first repair order
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technician
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order: any) => {
                    // const product = products.find((item: any) => (item._id || item.id) === order.productId);
                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order._id}</div>
                            <div className="text-sm text-gray-500">Qty: {order.quantity}</div>
                            {order.serialLotNumber && (
                              <div className="text-xs text-gray-400">S/N: {order.serialLotNumber}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-gray-400" />
                            <span>
                              {order.assetType === 'machinery'
                                ? machineries.find(m => m._id === order.assetId)?.machineName
                                : equipments.find(e => e._id === order.assetId)?.equipmentName}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.customerName}</div>
                          {order.sourceDocument && (
                            <div className="text-xs text-gray-500">Ref: {order.sourceDocument}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(order.repairType)}`}>
                              {order.repairType}
                            </span>
                            <br />
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                              {order.priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(order.status)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.replace('-', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">{order.assignedTechnician}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">{getLocationName(order.location)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="text-sm font-medium">Due: {order.expectedCompletion}</div>
                            <div className="text-sm text-gray-500">Created: {new Date(order.createdAt).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">${(order.totalCost || 0).toFixed(2)}</div>

                            <div className="text-xs text-gray-500">
                              Parts: ${(order.partsCost || 0).toFixed(2)} | Labor: ${(order.laborCost || 0).toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">

                            {/* VIEW */}
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => {
                                setSelectedOrder(order._id);
                                setShowViewModal(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {order.status !== "done" && canEdit && (
                              <button
                                className="text-purple-600 hover:text-purple-900"
                                title="Complete Repair"
                                onClick={() => openCompleteModal(order)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}


                            {/* ACCEPT / REJECT (ONLY FOR PENDING) */}
                            {/* {order.status === "draft" && (
                              <>
                                <button onClick={() => dispatch(acceptRepairOrder(order._id))}>
                                  Accept
                                </button>
                                <button onClick={() => dispatch(rejectRepairOrder({ id: order._id }))}>
                                  Reject
                                </button>
                              </>
                            )} */}


                            {/* EDIT */}
                            {canEdit && order.status !== "REJECTED" && (
                              <button className="text-green-600 hover:text-green-900">
                                <Edit className="h-4 w-4" />
                              </button>
                            )}

                            {/* DELETE */}
                            {canDelete && (
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteRepairOrder(order._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedOrder && (
        <ViewRepairOrderModal
          order={repairOrders.find((o: any) => o._id === selectedOrder)}
          onClose={() => {
            setShowViewModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateRepairOrderModal
          formData={createFormData}
          setFormData={setCreateFormData}
          onSubmit={handleCreateSubmit}
          onCancel={handleCancelCreateForm}
          machineries={machineries}
          equipments={equipments}
          repairTeams={repairTeams}
          masterDataLocations={masterDataLocations}
          isLocationRestricted={isLocationRestricted}
        />
      )}

      <Dialog
        open={showAcceptRejectModal}
        onOpenChange={(open) => {
          if (!open) setShowAcceptRejectModal(false);
        }}
      >

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              New Breakdown Reported
            </DialogTitle>
          </DialogHeader>

          {/* BODY */}
          <div className="space-y-3 text-sm">
            <div className="rounded-md border p-3 bg-muted/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipment</span>
                <span className="font-medium">
                  {pendingBreakdown?.equipmentCode}
                </span>
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Priority</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${pendingBreakdown?.priority === "Critical"
                    ? "bg-red-100 text-red-700"
                    : pendingBreakdown?.priority === "High"
                      ? "bg-orange-100 text-orange-700"
                      : pendingBreakdown?.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                >
                  {pendingBreakdown?.priority}
                </span>
              </div>

              <div className="mt-2">
                <p className="text-muted-foreground text-xs mb-1">
                  Failure Description
                </p>
                <p className="text-sm line-clamp-3">
                  {pendingBreakdown?.failureDescription}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground">
              Do you want to create a Repair Order for this breakdown?
            </p>
          </div>

          {/* FOOTER */}
          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={onRejectClick}
            >
              Reject
            </Button>

            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={onAcceptClick}
            >
              Accept & Create Repair Order
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* all requests */}
      <Dialog open={showAllRequestsModal} onOpenChange={setShowAllRequestsModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pending Breakdown Requests</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {pendingBreakdowns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                No pending breakdowns 🎉
              </p>
            ) : (
              pendingBreakdowns.map((b) => (
                <div
                  key={b._id}
                  className="border rounded-md p-3 hover:bg-muted cursor-pointer"
                  onClick={() => {
                    setPendingBreakdown(b);
                    setShowAllRequestsModal(false);
                    setShowAcceptRejectModal(true);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">
                        {b.assetCode || b.equipmentCode}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {b.failureDescription}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${b.priority === "Critical"
                        ? "bg-red-100 text-red-700"
                        : b.priority === "High"
                          ? "bg-orange-100 text-orange-700"
                          : b.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                    >
                      {b.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Repair</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Parts Cost</Label>
              <Input
                type="number"
                value={completingOrder?.partsCost || 0}
                onChange={(e) =>
                  setCompletingOrder((p: any) => ({
                    ...p,
                    partsCost: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label>Labor Cost</Label>
              <Input
                type="number"
                value={completingOrder?.laborCost || 0}
                onChange={(e) =>
                  setCompletingOrder((p: any) => ({
                    ...p,
                    laborCost: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Total: ₹
              {((completingOrder?.partsCost || 0) +
                (completingOrder?.laborCost || 0)).toFixed(2)}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteRepair}>
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default RepairOrders;