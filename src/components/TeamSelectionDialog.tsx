import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Filter, Loader2, Plus, Trash2, UserCheck, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce"; 
import { getPublicEmployees, getPublicLabours, getPublicLocations } from "@/lib/hrmsIntegration"; 

// --- REDUX ---
import { useDispatch } from "react-redux";
import { assignPersonToWbs, removePersonFromWbs } from "@/redux/slices/wbsSlice"; 
import { AppDispatch } from "@/redux/store";
import api from "@/utils/axiosApi"; 

interface WBSItemSummary {
  id: string;
  name: string;
  type: string;
}

interface TeamSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  wbsItem: WBSItemSummary | null;
  organisationId: string | null;
}

const TeamSelectionDialog: React.FC<TeamSelectionDialogProps> = ({
  isOpen,
  onClose,
  wbsItem,
  organisationId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"labour" | "employee" | "assigned">("labour");
  
  // Filter/Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  
  // Data States
  const [data, setData] = useState<any[]>([]); // List of available Labour/Employees
  const [assignedList, setAssignedList] = useState<any[]>([]); // List of assigned people (Direct + Inherited)
  
  const [loading, setLoading] = useState(false);
  const [isFetchingAssignments, setIsFetchingAssignments] = useState(false); // <--- FIX 1.1: Gating State
  
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 1. Load Locations on mount
  useEffect(() => {
    if (organisationId && isOpen) {
      getPublicLocations(organisationId).then((res) => {
        if (res.data) setLocations(res.data || []);
      });
    }
  }, [organisationId, isOpen]);

  // 2. Load Current WBS Assigned List (with Roll-up)
  const fetchWbsDetails = async () => {
    if (!wbsItem?.id) return;
    setIsFetchingAssignments(true); // <--- FIX 1.2: Start Gating
    try {
      const res = await api.get(`/wbs/item/${wbsItem.id}`);
      
      // Check for 'allAssignments' (aggregated) first, fallback to 'assignedPersons'
      if (res.data && res.data.allAssignments) {
        setAssignedList(res.data.allAssignments);
      } else if (res.data && res.data.assignedPersons) {
        // Fallback: assume all are direct if backend hasn't updated
        setAssignedList(res.data.assignedPersons.map((p:any) => ({...p, isInherited: false})));
      } else {
        setAssignedList([]);
      }
    } catch (error) {
      console.error("Failed to fetch current assignments", error);
      setAssignedList([]);
    } finally {
      setIsFetchingAssignments(false); // <--- FIX 1.2: End Gating
    }
  };

  // <--- FIX 1.3: Trigger assignment fetch immediately and clear search list ---
  useEffect(() => {
    if (isOpen && wbsItem?.id) {
        // Clear search results immediately to prevent displaying stale 'Added' status
        setData([]); 
        setTotalCount(0);
        fetchWbsDetails();
    }
  }, [wbsItem, isOpen]); 


  // 3. Fetch Available Data (Labour/Employee) - Gated by Assignments fetch
  useEffect(() => {
    if (!organisationId || !isOpen || activeTab === 'assigned' || isFetchingAssignments) return; // <--- FIX 1.4: Check Gating State

    const fetchData = async () => {
      setLoading(true);
      try {
        let res;
        if (activeTab === "labour") {
          res = await getPublicLabours(organisationId, page, pageSize, debouncedSearch, filterLocation, "active");
        } else {
          res = await getPublicEmployees(organisationId, page, pageSize, debouncedSearch, filterLocation);
        }

        if (res.data) {
          setData(res.data.data || []);
          setTotalCount(res.data.count || 0);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [organisationId, isOpen, activeTab, page, pageSize, debouncedSearch, filterLocation, isFetchingAssignments]); // <-- Dependency added


  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, filterLocation]);


  // --- ACTION: ADD ---
  const handleLinkItem = async (item: any) => {
    if (!wbsItem) return;

    const payload = {
        wbsId: wbsItem.id,
        resourceId: item.id, 
        type: activeTab,
        personalInfo: item.personalInfo || {},
        employment: item.employment || {},
        financial: item.financial || {} 
    };

    try {
        await dispatch(assignPersonToWbs(payload)).unwrap();
        toast({ title: "Linked Successfully", variant: "default" });
        fetchWbsDetails();
    } catch (error: any) {
        toast({ title: "Failed to Link", description: error, variant: "destructive" });
    }
  };

  // --- ACTION: REMOVE ---
  const handleRemoveItem = async (resourceId: string) => {
    if (!wbsItem) return;

    try {
      await dispatch(removePersonFromWbs({
        wbsId: wbsItem.id,
        resourceId: resourceId
      })).unwrap();

      toast({ title: "Removed Successfully", variant: "default" });
      fetchWbsDetails();
    } catch (error: any) {
      toast({ title: "Failed to Remove", description: error, variant: "destructive" });
    }
  };

  const getLocationName = (locId: string) => {
    if (!locId) return "Unknown"; 
    const loc = locations.find((l) => l.id === locId);
    return loc ? loc.name : "Unknown";
  };

  // Helper: Check if assigned DIRECTLY to THIS item (Removable)
  const isDirectlyAssigned = (id: string) => {
    return assignedList.some((p: any) => p.resourceId === id && !p.isInherited);
  };

  // Helper: Get list of places person is assigned (Inheritance context)
  const getAssignmentSources = (id: string) => {
    // Find all instances of this person
    const matches = assignedList.filter((p: any) => p.resourceId === id);
    if (matches.length === 0) return null;

    // Return names of sources (e.g., "Activity A", "Task B")
    const sources = matches
      .filter((p: any) => p.isInherited)
      .map((p: any) => p.sourceName);
    
    return sources.length > 0 ? sources : null;
  };
 
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Team for: {wbsItem?.type?.toUpperCase()} {wbsItem?.name}</DialogTitle>
          <DialogDescription>
            Assign resources directly or view resources rolled up from child tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          
          {/* Controls (Only show for search tabs) */}
          {activeTab !== 'assigned' && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={`Search ${activeTab}s...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(v: any) => setActiveTab(v)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="labour">Labour Search</TabsTrigger>
              <TabsTrigger value="employee">Employee Search</TabsTrigger>
              <TabsTrigger value="assigned" className="relative">
                Assigned Team
                <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {new Set(assignedList.map(item => item.resourceId)).size}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-auto border rounded-md mt-2 bg-white">
              {/* Show loading overlay while checking assignments */}
              {isFetchingAssignments && (
                 <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Loading assignments...</span>
                 </div>
              )}
              
              {/* --- VIEW: ASSIGNED LIST --- */}
              {activeTab === 'assigned' ? (
                 <table className="min-w-full divide-y divide-gray-200 text-sm">
                 <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                   <tr>
                     <th className="px-4 py-3 text-left font-medium text-gray-500">Source</th>
                     <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                     <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                     <th className="px-4 py-3 text-left font-medium text-gray-500">Role/Agency</th>
                     <th className="px-4 py-3 text-left font-medium text-gray-500">Assigned At</th>
                     <th className="px-4 py-3 text-right font-medium text-gray-500">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200">
                   {assignedList.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-500">No resources assigned yet.</td></tr>
                   ) : (
                     assignedList.map((person: any, idx: number) => (
                       <tr key={`${person.resourceId}-${idx}`} className={`hover:bg-gray-50 ${person.isInherited ? 'bg-orange-50/30' : ''}`}>
                         {/* FIX 2.1: Ensure source cell wraps */}
                         <td className="px-4 py-3 align-top">
                            {person.isInherited ? (
                                <div className="text-orange-600 text-xs font-medium" title={`Inherited from ${person.sourceName}`}>
                                    <MapPin className="w-3 h-3 mr-1 inline-block" /> From {person.sourceName}
                                </div>
                            ) : (
                                <div className="text-green-600 text-xs font-medium">
                                    Directly Added
                                </div>
                            )}
                         </td>
                         <td className="px-4 py-3 capitalize align-top">
                            <span className={`px-2 py-1 rounded-full text-xs ${person.type === 'employee' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                {person.type}
                            </span>
                         </td>
                         <td className="px-4 py-3 font-medium align-top">
                           {person.personalInfo?.firstName} {person.personalInfo?.lastName}
                         </td>
                         <td className="px-4 py-3 text-gray-500 align-top">
                           {person.type === 'labour' 
                              ? person.employment?.agency 
                              : person.employment?.designationName || person.employment?.designation}
                         </td>
                         <td className="px-4 py-3 text-gray-500 align-top">
                            {person.assignedAt ? new Date(person.assignedAt).toLocaleDateString() : 'N/A'}
                         </td>
                         <td className="px-4 py-3 text-right align-top">
                           {!person.isInherited ? (
                             <Button
                               size="sm"
                               variant="ghost"
                               className="text-red-600 hover:text-red-800 hover:bg-red-50"
                               onClick={() => handleRemoveItem(person.resourceId)}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           ) : (
                             <span className="text-xs text-gray-400 italic cursor-not-allowed">Read Only</span>
                           )}
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>

              /* --- VIEW: SEARCH LIST (LABOUR/EMPLOYEE) --- */
              ) : (
                <>
                  {loading ? (
                    <div className="h-40 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : data.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-gray-500">
                      No {activeTab}s found.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            {activeTab === "labour" ? "Agency" : "Designation"}
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Location</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.map((item: any) => {
                            const directlyAdded = isDirectlyAssigned(item.id);
                            const inheritedSources = getAssignmentSources(item.id);

                            return (
                            <tr key={item.id} className={`hover:bg-gray-50 ${directlyAdded ? 'bg-gray-50/50' : ''}`}>
                                <td className="px-4 py-3 align-top">
                                    {activeTab === "labour" ? item.formA : item.employeeId}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <div className="font-medium text-gray-900">
                                    {item.personalInfo?.firstName} {item.personalInfo?.lastName}
                                  </div>
                                  {/* FIX 2.2: Ensure source cell wraps and add title */}
                                  {inheritedSources && (
                                    <div className="text-[10px] text-orange-600 flex items-start mt-1" title={`Also assigned in: ${inheritedSources.join(", ")}`}>
                                        <MapPin className="w-3 h-3 mr-0.5 mt-[1px] flex-shrink-0" />
                                        <div className="flex-1 break-words">
                                            Also in: {inheritedSources.join(", ")}
                                        </div>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-500 align-top">
                                {activeTab === "labour"
                                    ? item.employment?.agency
                                    : item.employment?.designationName || item.employment?.designation}
                                </td>
                                <td className="px-4 py-3 text-gray-500 align-top">
                                {activeTab === "labour"
                                    ? getLocationName(item.locationId)
                                    : getLocationName(item.employment?.locationId)}
                                </td>
                                <td className="px-4 py-3 text-right align-top">
                                {directlyAdded ? (
                                    <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                                        <UserCheck className="w-4 h-4" /> Added
                                    </span>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleLinkItem(item)}
                                        title="Link to WBS Item"
                                    >
                                        <Plus className="h-4 w-4 text-blue-600" />
                                    </Button>
                                )}
                                </td>
                            </tr>
                        )})}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </Tabs>

          {/* Pagination (Only for search tabs) */}
          {activeTab !== 'assigned' && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= totalCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSelectionDialog;