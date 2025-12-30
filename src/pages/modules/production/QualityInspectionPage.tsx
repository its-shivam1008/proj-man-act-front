import { usePermission } from "@/hooks/userPermission";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Pagination } from "../../../components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Plus, XCircle, ShieldAlert } from "lucide-react";
import {
  fetchPlans,
  fetchInspections,
  fetchNCRs,
  fetchCAPAs,
  createInspection,
  createPlan,
  createNCR,
  createCAPA,
  updatePlan,
  deletePlan,
  deleteNCR,
  deleteCAPA,
  updateCAPA,
  updateNCR,
  deleteInspection,
  updateInspection
} from "../../../redux/slices/production/qualitySlice";


/**
 * QUALITY INSPECTION (Integrated with GRN)
 *
 * - Reads GRNs from STORAGE_KEYS.GRNS
 * - Displays Pending QC batches (from GRNs) in Inspections tab
 * - Accept / Reject flows update GRN item status, inventory, WIP, and create NCR/CAPA as needed
 */

export default function QualityInspectionPage() {
  const dispatch = useDispatch();
  const qualityState = useSelector((state: any) => state.quality || {});
  const { 
    plans = [], 
    inspections = [], 
    ncrs = [], 
    capas = [], 
    loading = false,
    plansPagination = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    inspectionsPagination = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    ncrsPagination = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
    capasPagination = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 }
  } = qualityState;

  // Check authentication state
  const authState = useSelector((state: any) => state.auth || {});
  const { organisationId, isAuthenticated, userProfile } = authState;
  
  // Master data for locations
  const { locations } = useSelector((state: any) => state.masterData);

  const canView = usePermission("qualityInspection", "view");
  const canCreate = usePermission("qualityInspection", "create");
  const canEdit = usePermission("qualityInspection", "edit");
  const canDelete = usePermission("qualityInspection", "delete");

  // Location filter states
  const [locationFilter, setLocationFilter] = useState("all");
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination search states for each table
  const [plansSearch, setPlansSearch] = useState("");
  const [inspectionsSearch, setInspectionsSearch] = useState("");
  const [ncrsSearch, setNcrsSearch] = useState("");
  const [capasSearch, setCapasSearch] = useState("");
  
  // Location restriction logic
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

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

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Required
        </h3>
        <p className="text-gray-600">
          Please log in to access the Quality Inspection dashboard.
        </p>
      </div>
    );
  }

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated && organisationId) {
      console.log("Quality: Loading data...");
      // Fetch master data for locations
      (dispatch as any)(fetchMasterData("location"));
    }
  }, [dispatch, isAuthenticated, organisationId]);

  // Auto-set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Load quality data when location filter changes
  useEffect(() => {
    if (isAuthenticated && organisationId) {
      const locationParam = locationFilter !== "all" ? locationFilter : undefined;
      (dispatch as any)(fetchPlans({ location: locationParam, page: 1, limit: 10 }));
      (dispatch as any)(fetchInspections({ location: locationParam, page: 1, limit: 10 }));
      (dispatch as any)(fetchNCRs({ location: locationParam, page: 1, limit: 10 }));
      (dispatch as any)(fetchCAPAs({ location: locationParam, page: 1, limit: 10 }));
    }
  }, [dispatch, isAuthenticated, organisationId, locationFilter]);

  // Location filter change handler
  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    // Refresh data with new location filter
    if (isAuthenticated && organisationId) {
      const locationParam = val !== "all" ? val : undefined;
      (dispatch as any)(fetchPlans({ location: locationParam, page: 1, limit: plansPagination.itemsPerPage, search: plansSearch }));
      (dispatch as any)(fetchInspections({ location: locationParam, page: 1, limit: inspectionsPagination.itemsPerPage, search: inspectionsSearch }));
      (dispatch as any)(fetchNCRs({ location: locationParam, page: 1, limit: ncrsPagination.itemsPerPage, search: ncrsSearch }));
      (dispatch as any)(fetchCAPAs({ location: locationParam, page: 1, limit: capasPagination.itemsPerPage, search: capasSearch }));
    }
  };

  // Helper to get location name
  const getLocationName = (locData: string | { _id: string; name: string } | undefined) => {
    if (!locData) return "No Location";
    if (typeof locData === 'object' && locData.name) return locData.name;
    const found = locations.find((l: any) => l._id === locData);
    return found ? found.name : "Unknown Location";
  };

  // Debug: Log inspections data
  useEffect(() => {
    console.log("Inspections data:", inspections);
  }, [inspections]);

  // UI state
  const [tab, setTab] = useState("plans");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  /** ---------- Analytics with Filtering (updated to use Redux data) ---------- */
  const passFailStats = useMemo(() => {
    const pass = inspections.filter((i) => i.result === "Pass").length;
    const fail = inspections.filter((i) => i.result === "Fail").length;
    return [{ name: "Pass", value: pass }, { name: "Fail", value: fail }];
  }, [inspections]);

  const defectTrends = useMemo(() => {
    const map: Record<string, number> = {};
    inspections.forEach((i) => (i.defects || []).forEach((d) => (map[d] = (map[d] || 0) + 1)));
    return Object.entries(map).map(([defect, count]) => ({ defect, count }));
  }, [inspections]);

  const capaProgress = useMemo(() => {
    const map: Record<string, number> = {};
    capas.forEach((c) => (map[c.status] = (map[c.status] || 0) + 1));
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [capas]);

  /** ---------- CRUD functions (updated to use Redux actions) ---------- */
  const addRecord = async () => {
    try {
      // Add location to form data if restricted user
      const formWithLocation = {
        ...form,
        location: form.location || (isLocationRestricted ? userProfile.location : undefined)
      };

      if (tab === "plans") {
        if (form._id) {
          await dispatch(updatePlan({ id: form._id, data: formWithLocation }) as any);
          toast.success("Plan updated");
        } else {
          await dispatch(createPlan(formWithLocation) as any);
          toast.success("Plan created");
        }
      }

      if (tab === "inspections") {
        if (form._id) {
          await dispatch(updateInspection({ id: form._id, data: formWithLocation }) as any);
          toast.success("Inspection updated");
        } else {
          await dispatch(createInspection(formWithLocation) as any);
          toast.success("Inspection created");
        }
      }

      if (tab === "ncrs") {
        if (form._id) {
          await dispatch(updateNCR({ id: form._id, data: formWithLocation }) as any);
          toast.success("NCR updated");
        } else {
          await dispatch(createNCR(formWithLocation) as any);
          toast.success("NCR created");
        }
      }

      if (tab === "capas") {
        if (form._id) {
          await dispatch(updateCAPA({ id: form._id, data: formWithLocation }) as any);
          toast.success("CAPA updated");
        } else {
          await dispatch(createCAPA(formWithLocation) as any);
          toast.success("CAPA created");
        }
      }

      setForm({});
      setDialogOpen(false);
    } catch (err) {
      toast.error("Operation failed");
      console.error(err);
    }
  };

  const confirmDelete = async (
    message: string,
    onConfirm: () => Promise<any> | void
  ) => {
    const ok = window.confirm(message);
    if (!ok) return;

    try {
      await onConfirm();
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  };


  /** ---------- GRN integration helpers (temporarily disabled - needs GRN backend integration) ---------- */

  // TODO: Implement GRN integration with backend
  const pendingGrnItems = useMemo(() => {
    // Placeholder - will be implemented when GRN backend is integrated
    return [];
  }, []);

  const acceptGrnBatch = (grnId: string, productId: string, batchNo: string) => {
    // TODO: Implement with backend API
    toast.info("GRN integration will be implemented with backend");
  };

  const rejectGrnBatch = (grnId: string, productId: string, batchNo: string) => {
    // TODO: Implement with backend API  
    toast.info("GRN integration will be implemented with backend");
  };

  /* ---------- Pagination handlers ---------- */
  const handlePlansPageChange = (page: number) => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    (dispatch as any)(fetchPlans({ 
      location: locationParam, 
      page, 
      limit: plansPagination.itemsPerPage, 
      search: plansSearch 
    }));
  };

  const handlePlansItemsPerPageChange = (itemsPerPage: number) => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    (dispatch as any)(fetchPlans({ 
      location: locationParam, 
      page: 1, 
      limit: itemsPerPage, 
      search: plansSearch 
    }));
  };

  const handleInspectionsPageChange = (page: number) => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    (dispatch as any)(fetchInspections({ 
      location: locationParam, 
      page, 
      limit: inspectionsPagination.itemsPerPage, 
      search: inspectionsSearch 
    }));
  };

  const handleInspectionsItemsPerPageChange = (itemsPerPage: number) => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    (dispatch as any)(fetchInspections({ 
      location: locationParam, 
      page: 1, 
      limit: itemsPerPage, 
      search: inspectionsSearch 
    }));
  };

  const handleNCRsPageChange = (page: number) => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    (dispatch as any)(fetchNCRs({ 
      location: locationParam, 
      page, 
      limit: ncrsPagination.itemsPerPage, 
      search: ncrsSearch 
    }));
  };

  const handleNCRsItemsPerPageChange = (itemsPerPage: number) => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    (dispatch as any)(fetchNCRs({ 
      location: locationParam, 
      page: 1, 
      limit: itemsPerPage, 
      search: ncrsSearch 
    }));
  };

  const handleCAPAsPageChange = (page: number) => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    (dispatch as any)(fetchCAPAs({ 
      location: locationParam, 
      page, 
      limit: capasPagination.itemsPerPage, 
      search: capasSearch 
    }));
  };

  const handleCAPAsItemsPerPageChange = (itemsPerPage: number) => {
    const locationParam = locationFilter !== "all" ? locationFilter : undefined;
    (dispatch as any)(fetchCAPAs({ 
      location: locationParam, 
      page: 1, 
      limit: itemsPerPage, 
      search: capasSearch 
    }));
  };

  // Search handlers with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const locationParam = locationFilter !== "all" ? locationFilter : undefined;
      (dispatch as any)(fetchPlans({ 
        location: locationParam, 
        page: 1, 
        limit: plansPagination.itemsPerPage, 
        search: plansSearch 
      }));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [plansSearch, plansPagination.itemsPerPage, locationFilter, dispatch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const locationParam = locationFilter !== "all" ? locationFilter : undefined;
      (dispatch as any)(fetchInspections({ 
        location: locationParam, 
        page: 1, 
        limit: inspectionsPagination.itemsPerPage, 
        search: inspectionsSearch 
      }));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inspectionsSearch, inspectionsPagination.itemsPerPage, locationFilter, dispatch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const locationParam = locationFilter !== "all" ? locationFilter : undefined;
      (dispatch as any)(fetchNCRs({ 
        location: locationParam, 
        page: 1, 
        limit: ncrsPagination.itemsPerPage, 
        search: ncrsSearch 
      }));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [ncrsSearch, ncrsPagination.itemsPerPage, locationFilter, dispatch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const locationParam = locationFilter !== "all" ? locationFilter : undefined;
      (dispatch as any)(fetchCAPAs({ 
        location: locationParam, 
        page: 1, 
        limit: capasPagination.itemsPerPage, 
        search: capasSearch 
      }));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [capasSearch, capasPagination.itemsPerPage, locationFilter, dispatch]);

  const renderFormFields = () => {
    switch (tab) {
      case "plans":
        return (
          <>
            <Label>Plan Name</Label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Label>Type</Label>
            <Select value={form.type || ""} onValueChange={(value) => setForm({ ...form, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Incoming">Incoming</SelectItem>
                <SelectItem value="In-Process">In-Process</SelectItem>
                <SelectItem value="Final">Final</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Location Field */}
            <Label>Location</Label>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLocationRestricted}
                >
                  {form.location
                    ? (locations || []).find((l: any) => l._id === form.location)?.name
                    : "Select Location"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              
              {!isLocationRestricted && (
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {(locations || []).map((l: any) => (
                          <CommandItem
                            key={l._id}
                            value={l.name}
                            onSelect={() => {
                              setForm({ ...form, location: l._id });
                              setLocationOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.location === l._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {l.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
            {isLocationRestricted && (
              <p className="text-[10px] text-muted-foreground">
                *Location is fixed based on your permissions.
              </p>
            )}
            
            <Label>Sampling Procedure</Label>
            <Input value={form.sampling || ""} onChange={(e) => setForm({ ...form, sampling: e.target.value })} />
            <Label>Acceptance Criteria</Label>
            <Input value={form.criteria || ""} onChange={(e) => setForm({ ...form, criteria: e.target.value })} />
          </>
        );
      case "inspections":
        return (
          <>
            <Label>Inspection Plan</Label>
            <Select value={form.planId || ""} onValueChange={(value) => setForm({ ...form, planId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p: any) => (
                  <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Location Field */}
            <Label>Location</Label>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLocationRestricted}
                >
                  {form.location
                    ? (locations || []).find((l: any) => l._id === form.location)?.name
                    : "Select Location"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              
              {!isLocationRestricted && (
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {(locations || []).map((l: any) => (
                          <CommandItem
                            key={l._id}
                            value={l.name}
                            onSelect={() => {
                              setForm({ ...form, location: l._id });
                              setLocationOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.location === l._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {l.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
            {isLocationRestricted && (
              <p className="text-[10px] text-muted-foreground">
                *Location is fixed based on your permissions.
              </p>
            )}
            
            <Label>Inspector</Label>
            <Input value={form.inspector || ""} onChange={(e) => setForm({ ...form, inspector: e.target.value })} />
            <Label>Result</Label>
            <Select value={form.result || ""} onValueChange={(value) => setForm({ ...form, result: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pass">Pass</SelectItem>
                <SelectItem value="Fail">Fail</SelectItem>
              </SelectContent>
            </Select>
            <Label>Remarks</Label>
            <Input value={form.remarks || ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </>
        );
      case "ncrs":
        return (
          <>
            <Label>Cause</Label>
            <Input value={form.cause || ""} onChange={(e) => setForm({ ...form, cause: e.target.value })} />
            <Label>Severity</Label>
            <Select value={form.severity || ""} onValueChange={(value) => setForm({ ...form, severity: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Minor">Minor</SelectItem>
                <SelectItem value="Major">Major</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Location Field */}
            <Label>Location</Label>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLocationRestricted}
                >
                  {form.location
                    ? (locations || []).find((l: any) => l._id === form.location)?.name
                    : "Select Location"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              
              {!isLocationRestricted && (
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {(locations || []).map((l: any) => (
                          <CommandItem
                            key={l._id}
                            value={l.name}
                            onSelect={() => {
                              setForm({ ...form, location: l._id });
                              setLocationOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.location === l._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {l.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
            {isLocationRestricted && (
              <p className="text-[10px] text-muted-foreground">
                *Location is fixed based on your permissions.
              </p>
            )}
            
            <Label>Responsible Department</Label>
            <Input value={form.responsibleDept || ""} onChange={(e) => setForm({ ...form, responsibleDept: e.target.value })} />
          </>
        );
      case "capas":
        return (
          <>
            <Label>NCR ID</Label>
            <Select value={form.ncrId || ""} onValueChange={(value) => setForm({ ...form, ncrId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select NCR" />
              </SelectTrigger>
              <SelectContent>
                {ncrs.map((n: any) => (
                  <SelectItem key={n._id} value={n._id}>{n._id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Type</Label>
            <Select value={form.type || ""} onValueChange={(value) => setForm({ ...form, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Corrective">Corrective</SelectItem>
                <SelectItem value="Preventive">Preventive</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Location Field */}
            <Label>Location</Label>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLocationRestricted}
                >
                  {form.location
                    ? (locations || []).find((l: any) => l._id === form.location)?.name
                    : "Select Location"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              
              {!isLocationRestricted && (
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {(locations || []).map((l: any) => (
                          <CommandItem
                            key={l._id}
                            value={l.name}
                            onSelect={() => {
                              setForm({ ...form, location: l._id });
                              setLocationOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.location === l._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {l.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
            {isLocationRestricted && (
              <p className="text-[10px] text-muted-foreground">
                *Location is fixed based on your permissions.
              </p>
            )}
            
            <Label>Action</Label>
            <Input value={form.action || ""} onChange={(e) => setForm({ ...form, action: e.target.value })} />
            <Label>Owner</Label>
            <Input value={form.owner || ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            <Label>Status</Label>
            <Select value={form.status || ""} onValueChange={(value) => setForm({ ...form, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quality Inspection & Control (Integrated with GRN)</h1>
          <p className="text-muted-foreground">Manage inspection plans, QC records, NCRs & CAPA — now integrated with GRN batches.</p>
        </div>
      </div>

      {/* Search and Location Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search quality records..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            {(locations || []).map((loc: any) => (
              <SelectItem key={loc._id} value={loc._id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="ncrs">NCRs</TabsTrigger>
          <TabsTrigger value="capas">CAPAs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Plans */}
        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <CardTitle>Inspection Plans ({plansPagination.totalItems})</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search plans..."
                    value={plansSearch}
                    onChange={(e) => setPlansSearch(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    disabled={!canCreate}
                    onClick={() => canCreate && (setForm({}), setDialogOpen(true))}
                    className={`${!canCreate ? "opacity-50 cursor-not-allowed" : ""} w-40`}
                  >
                    + New Plan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Sampling</TableHead>
                    <TableHead>Criteria</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        {loading ? "Loading plans..." : "No plans found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((p: any) => (
                      <TableRow key={p._id}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.type}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            <MapPin className="h-3 w-3" />
                            {getLocationName(p.location)}
                          </span>
                        </TableCell>
                        <TableCell>{p.sampling}</TableCell>
                        <TableCell>{p.criteria}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEdit}
                            onClick={() => {
                              setForm(p);
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canDelete}
                            onClick={() =>
                              confirmDelete(
                                "Are you sure you want to delete this Plan?",
                                () => dispatch(deletePlan(p._id) as any)
                              )
                            }
                          >
                            Delete
                          </Button>

                        </TableCell>

                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              <Pagination
                currentPage={plansPagination.currentPage}
                totalPages={plansPagination.totalPages}
                totalItems={plansPagination.totalItems}
                itemsPerPage={plansPagination.itemsPerPage}
                onPageChange={handlePlansPageChange}
                onItemsPerPageChange={handlePlansItemsPerPageChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspections + Pending GRN batches */}
        <TabsContent value="inspections">
          <div className="grid gap-4">

            {/* Quick create inspection */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <div className="flex items-center justify-between w-full">
                  <CardTitle>Inspection Records ({inspectionsPagination.totalItems})</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search inspections..."
                      value={inspectionsSearch}
                      onChange={(e) => setInspectionsSearch(e.target.value)}
                      className="w-48"
                    />
                    <Button
                      disabled={!canCreate}
                      onClick={() => canCreate && (setForm({}), setDialogOpen(true))}
                      className={`${!canCreate ? "opacity-50 cursor-not-allowed" : ""} w-40`}
                    >
                      + New Inspection
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Actions</TableHead>

                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6">
                          {loading ? "Loading inspections..." : "No inspections found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      inspections.map((i: any) => (
                        <TableRow key={i._id}>
                          <TableCell>{new Date(i.createdAt || i.date).toLocaleString()}</TableCell>
                          <TableCell>{
                            // Handle both populated and non-populated planId
                            typeof i.planId === 'object' && i.planId?.name
                              ? i.planId.name
                              : plans.find((p: any) => p._id === i.planId)?.name || "—"
                          }</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              <MapPin className="h-3 w-3" />
                              {getLocationName(i.location)}
                            </span>
                          </TableCell>
                          <TableCell>{i.inspector || "—"}</TableCell>
                          <TableCell><Badge variant={i.result === "Pass" ? "success" : i.result === "Fail" ? "destructive" : undefined}>{i.result}</Badge></TableCell>
                          <TableCell>{i.remarks}</TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canEdit}
                              onClick={() => {
                                setForm(i);
                                setTab("inspections");
                                setDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!canDelete}
                              onClick={() =>
                                confirmDelete(
                                  "Are you sure you want to delete this Inspection?",
                                  () => dispatch(deleteInspection(i._id) as any)
                                )
                              }
                            >
                              Delete
                            </Button>

                          </TableCell>

                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                <Pagination
                  currentPage={inspectionsPagination.currentPage}
                  totalPages={inspectionsPagination.totalPages}
                  totalItems={inspectionsPagination.totalItems}
                  itemsPerPage={inspectionsPagination.itemsPerPage}
                  onPageChange={handleInspectionsPageChange}
                  onItemsPerPageChange={handleInspectionsItemsPerPageChange}
                />
              </CardContent>
            </Card>

            {/* Pending QC batches sourced from GRNs */}
            <Card>
              <CardHeader><CardTitle>Pending QC — GRN Batches</CardTitle></CardHeader>
              <CardContent>
                {pendingGrnItems.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">No pending GRN batches awaiting QC.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GRN</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingGrnItems.map((it: any) => (
                        <TableRow key={it.batchNo}>
                          <TableCell>{it.grnId}</TableCell>
                          <TableCell>{it.productId}</TableCell>
                          <TableCell>{it.batchNo}</TableCell>
                          <TableCell>{it.qty}</TableCell>
                          <TableCell className="grid grid-cols-2 gap-2">
                            <Button
                              disabled={!canEdit}
                              onClick={() => canEdit && acceptGrnBatch(it.grnId, it.productId, it.batchNo)}
                              className={`${!canEdit ? "opacity-50 cursor-not-allowed" : "bg-green-600"} w-full bg-green-600`}
                            >
                              <Check className="mr-2 h-4 w-4" /> Accept
                            </Button>
                            <Button
                              disabled={!canEdit}
                              onClick={() => canEdit && rejectGrnBatch(it.grnId, it.productId, it.batchNo)}
                              className={`${!canEdit ? "opacity-50 cursor-not-allowed" : "bg-red-600"} w-full bg-red-600`}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* NCRs */}
        <TabsContent value="ncrs">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <CardTitle>Non-Conformance Reports ({ncrsPagination.totalItems})</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search NCRs..."
                    value={ncrsSearch}
                    onChange={(e) => setNcrsSearch(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    disabled={!canCreate}
                    onClick={() => canCreate && (setForm({}), setDialogOpen(true))}
                    className={`${!canCreate ? "opacity-50 cursor-not-allowed" : ""} w-40`}
                  >
                    + New NCR
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cause</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ncrs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        {loading ? "Loading NCRs..." : "No NCRs found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ncrs.map((n: any) => (
                      <TableRow key={n._id}>
                        <TableCell>{n._id}</TableCell>
                        <TableCell>{n.cause}</TableCell>
                        <TableCell>{n.severity}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            <MapPin className="h-3 w-3" />
                            {getLocationName(n.location)}
                          </span>
                        </TableCell>
                        <TableCell><Badge>{n.status}</Badge></TableCell>
                        <TableCell>{n.responsibleDept}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEdit}
                            onClick={() => {
                              setForm(n);
                              setTab("ncrs");
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canDelete}
                            onClick={() =>
                              confirmDelete(
                                "Are you sure you want to delete this NCR?",
                                () => dispatch(deleteNCR(n._id) as any)
                              )
                            }
                          >
                            Delete
                          </Button>

                        </TableCell>

                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              <Pagination
                currentPage={ncrsPagination.currentPage}
                totalPages={ncrsPagination.totalPages}
                totalItems={ncrsPagination.totalItems}
                itemsPerPage={ncrsPagination.itemsPerPage}
                onPageChange={handleNCRsPageChange}
                onItemsPerPageChange={handleNCRsItemsPerPageChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAPAs */}
        <TabsContent value="capas">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <CardTitle>CAPA Actions ({capasPagination.totalItems})</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search CAPAs..."
                    value={capasSearch}
                    onChange={(e) => setCapasSearch(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    disabled={!canCreate}
                    onClick={() => canCreate && (setForm({}), setDialogOpen(true))}
                    className={`${!canCreate ? "opacity-50 cursor-not-allowed" : ""} w-40`}
                  >
                    + New CAPA
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>

                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        {loading ? "Loading CAPAs..." : "No CAPAs found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    capas.map((c: any) => (
                      <TableRow key={c._id}>
                        <TableCell>{c._id}</TableCell>
                        <TableCell>{c.type}</TableCell>
                        <TableCell>{c.action}</TableCell>
                        <TableCell>{c.owner}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            <MapPin className="h-3 w-3" />
                            {getLocationName(c.location)}
                          </span>
                        </TableCell>
                        <TableCell><Badge>{c.status}</Badge></TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEdit}
                            onClick={() => {
                              setForm(c);
                              setTab("capas");
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canDelete}
                            onClick={() =>
                              confirmDelete(
                                "Are you sure you want to delete this CAPA?",
                                () => dispatch(deleteCAPA(c._id) as any)
                              )
                            }
                          >
                            Delete
                          </Button>

                        </TableCell>

                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              <Pagination
                currentPage={capasPagination.currentPage}
                totalPages={capasPagination.totalPages}
                totalItems={capasPagination.totalItems}
                itemsPerPage={capasPagination.itemsPerPage}
                onPageChange={handleCAPAsPageChange}
                onItemsPerPageChange={handleCAPAsItemsPerPageChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle>Pass vs Fail</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={passFailStats} dataKey="value" outerRadius={80}>
                      {passFailStats.map((e, i) => <Cell key={i} fill={["#00C49F", "#FF8042"][i % 2]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Defect Trends</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defectTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="defect" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>CAPA Status</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={capaProgress}>
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="count" stroke="#00C49F" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Generic dialog used for creating Plans / Inspections / NCR / CAPA */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form._id ? "Edit Record" : "New Record"}
            </DialogTitle>

          </DialogHeader>
          <div
            className="grid gap-3 py-3"
            style={{
              pointerEvents: canCreate ? "auto" : "none",
              opacity: canCreate ? 1 : 0.6,
            }}
          >
            {renderFormFields()}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!canCreate}
              onClick={() => canCreate && addRecord()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
