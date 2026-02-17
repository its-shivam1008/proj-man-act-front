import { useState, useEffect, useMemo } from "react";
import BillModal from "@/components/wbsBill";
import { parseISO, format, min, max } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RootState, AppDispatch } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWbsByProject,
  createWbsItem,
  updateWbsItem,
  deleteWbsItem,
  pauseWbsTask,
  resumeWbsTask,
  WBSItem as ImportedWBSItem,
  assignPersonToWbs,
} from "@/redux/slices/wbsSlice";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  Users,
  ChevronsUpDown,
  Check,
  ShieldAlert,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  Pause,
  Play,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { Project } from "@/types/project";
import { fetchMRS } from "@/redux/slices/mrsSlice";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast as toastSonner } from 'sonner';
// --- IMPORT THE SEPARATE MODAL COMPONENT ---
import TeamSelectionDialog from "@/components/TeamSelectionDialog";
import MaterialSelectionDialog from "@/components/MaterialSelectionDialog";
import { usePermission } from "@/hooks/userPermission";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
// import { hrmsOrganisationIdFromDB } from "@/utils/constants";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";

// --- TYPES ---
type WBSItemType = "phase" | "activity" | "task" | "subtask";
type wbstatus = "not-started" | "in-progress" | "completed" | "delayed";

interface LinkedMaterial {
  materialId: string;
  quantity: number;
  unit: string;
  name?: string;
  status?: 'pending' | 'sent' | 'in-transit' | 'received';
}

// Extend the imported WBSItem type
interface WBSItem extends Omit<ImportedWBSItem, 'linkedMaterials'> {
  linkedMaterials?: LinkedMaterial[];
  delayReason?: string;
  assignedPersons?: Array<{
    resourceId: string;
    type: string;
    assignedAt?: string;
    personalInfo?: any;
    progress?: number;
    employment?: any;
    financial?: any;
  }>;
}

const WBS_ITEM_TYPES: WBSItemType[] = ["phase", "activity", "task", "subtask"];
const WBS_ITEM_STATUSES: wbstatus[] = [
  "not-started",
  "in-progress",
  "completed",
  "delayed",
];

// --- WBS NODE COMPONENT ---
interface WBSNodeProps {
  onOpenBill: (wbsId: string) => void;
  item: WBSItem;
  allwbs: WBSItem[];
  level: number;
  onEdit: (item: WBSItem) => void;
  onDelete: (id: string) => void;
  onLinkTeam: (item: WBSItem) => void; // Prop to trigger modal
  onLinkMaterial: (item: any) => void; // Prop to trigger material modal
  onTeamView: (item: WBSItem) => void; // Prop to view team members (UI only)
  onShowToast: (message: string) => void;
  onPause: (item: WBSItem) => void;
  onResume: (item: WBSItem) => void;
  getMaterialStatusSummary: (wbsItem: WBSItem) => {
    total: number;
    received: number;
    inTransit: number;
    sent: number;
    pending: number;
  };
}

const WBSNode: React.FC<WBSNodeProps> = ({
  item,
  allwbs,
  level,
  onEdit,
  onDelete,
  onLinkTeam,
  onLinkMaterial,
  onTeamView,
  onShowToast,
  onPause,
  onResume,
  onOpenBill,
  getMaterialStatusSummary,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const canEdit = usePermission("wbsManagement", "edit");
  const canDelete = usePermission("wbsManagement", "delete");
  // const [billModalOpen, setBillModalOpen] = useState(false);
  // const [selectedBillWbsId, setSelectedBillWbsId] = useState<string | null>(null);

  // const openBillModal = (wbsId: string) => {
  //   setSelectedBillWbsId(wbsId);
  //   setBillModalOpen(true);
  // };


  const children = useMemo(
    () => allwbs.filter((i) => i.parentId === item.id),
    [allwbs, item.id]
  );

  const getStatusColor = (status?: wbstatus) => {
    // Check if item is paused first
    if (item.isPaused) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }

    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    const colors: Record<wbstatus, string> = {
      "not-started": "bg-gray-100 text-gray-800 border-gray-200",
      "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      delayed: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status];
  };



  return (
    <div className="flex flex-col">
      {/* Render current item */}
      <div
        className="flex items-center border-b border-gray-200 hover:bg-gray-50 py-2"
        style={{ paddingLeft: `${level * 24}px` }}
      >
        <div className="flex-1 flex items-center">
          {children.length > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mr-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-9 h-9 mr-1" />
          )}
          <span className="font-medium">{item.name}</span>
          <span className="text-xs capitalize text-muted-foreground ml-2">
            ({item.type})
          </span>
        </div>
        <div className="w-24 text-center">
          <Badge className={getStatusColor(item.status)} variant="outline">
            {item.isPaused ? "paused" : (item.status?.replace("-", " ") || "not-started")}
          </Badge>
        </div>
        <div className="w-20 text-center text-sm text-muted-foreground">
          {item.startDate || "N/A"}
        </div>
        <div className="w-20 text-center text-sm text-muted-foreground">
          {item.endDate || "N/A"}
        </div>
        <div className="flex flex-col px-2 items-center gap-2">
          <span className='text-xs'>{item.progress}%</span>
          <Progress value={item.progress} className="w-16" />
        </div>
        {/* Material Status Indicators */}
        <div className="w-32 flex justify-center">
          {(() => {
            const summary = getMaterialStatusSummary(item);
            return summary.total > 0 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-1">
                      {summary.received > 0 && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600 ml-1">{summary.received}</span>
                        </div>
                      )}
                      {summary.inTransit > 0 && (
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-blue-600 ml-1">{summary.inTransit}</span>
                        </div>
                      )}
                      {summary.sent > 0 && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="text-xs text-orange-600 ml-1">{summary.sent}</span>
                        </div>
                      )}
                      {summary.pending > 0 && (
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-gray-500" />
                          <span className="text-xs text-gray-500 ml-1">{summary.pending}</span>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-semibold">Received Materials for {item.name}:</p>
                      <div className="space-y-1 mt-1">
                        <p className="text-green-600">✅ {summary.received} Materials Received & Available</p>
                        <p className="text-xs text-gray-400 mt-2">Click Package icon to view/return materials</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null;
          })()}
        </div>

        <div className="w-62 flex  items-center pr-4">
          {/* ===== TOP ICON ROW ===== */}
          <div className="w-62 flex items-center gap-6 pr-4">
            {canEdit && (
              <Package
                className="h-4 w-4 text-blue-600 cursor-pointer"
                title="Link Materials"
                onClick={() => onLinkMaterial(item)}
              />
            )}

            {canEdit &&
              (item.isPaused ? (
                <UserCheck
                  className="h-4 w-4 text-orange-600 cursor-pointer"
                  title="View Team"
                  onClick={() => onTeamView(item)}
                />
              ) : (
                <Users
                  className="h-4 w-4 text-green-600 cursor-pointer"
                  title="Link Team"
                  onClick={() => onLinkTeam(item)}
                />
              ))}

            {canEdit &&
              (item.isPaused ? (
                <Play
                  className="h-4 w-4 text-green-600 cursor-pointer"
                  title="Resume Task"
                  onClick={() => onResume(item)}
                />
              ) : (
                <Pause
                  className="h-4 w-4 text-orange-600 cursor-pointer"
                  title="Pause Task"
                  onClick={() => onPause(item)}
                />
              ))}

            {canEdit && (
              <Pencil
                className="h-4 w-4 cursor-pointer"
                title="Edit Item"
                onClick={() => onEdit(item)}
              />
            )}

            {canEdit && (
              <FileText
                className="h-4 w-4 text-blue-600 cursor-pointer"
                title="Add / View Bill"
                onClick={() => onOpenBill(item._id)}
              />
            )}

            {canDelete && (
              <Trash2
                className="h-4 w-4 text-destructive cursor-pointer"
                title="Delete Item"
                onClick={() => onDelete(item.id)}
              />
            )}
          </div>

        </div>

      </div>

      {/* Render children */}
      {isExpanded &&
        children.map((child) => (
          <WBSNode
            key={child.id}
            item={child}
            allwbs={allwbs}
            level={level + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            onLinkTeam={onLinkTeam} // Pass down prop
            onLinkMaterial={onLinkMaterial} // Pass down prop
            onTeamView={onTeamView} // Pass down prop
            onShowToast={onShowToast}
            onPause={onPause}
            onResume={onResume}
            getMaterialStatusSummary={getMaterialStatusSummary}
            onOpenBill={onOpenBill}
          />
        ))}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function WBS() {
  const dispatch = useDispatch<AppDispatch>();
  const { wbs } = useSelector((state: RootState) => state.wbs);
  const { list: mrsList } = useSelector((state: RootState) => state.mrs);
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);
  const canView = usePermission("wbsManagement", "view");
  const canCreate = usePermission("wbsManagement", "create");

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [selectedBillWbsId, setSelectedBillWbsId] = useState<string | null>(null);

  const openBillModal = (wbsId: string) => {
    setSelectedBillWbsId(wbsId);
    setBillModalOpen(true);
  };



  const { projects, loading: projectLoading } = useSelector(
    (state: RootState) => state.projects
  ) as { projects: Project[], loading: boolean };

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WBSItem | null>(null);
  const [formData, setFormData] = useState<Partial<WBSItem>>({});
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [locationFilter, setLocationFilter] = useState("all");

  const isLocationRestricted =
    userProfile?.role !== 'admin' &&
    !!userProfile?.location;

  const [resumeConflicts, setResumeConflicts] = useState<any[]>([]);
  const [resolutionMap, setResolutionMap] = useState<Record<string, "both" | "resumed_only">>({});



  // --- TEAM LINKING STATE ---
  const [linkingItem, setLinkingItem] = useState<WBSItem | null>(null);

  // --- MATERIAL LINKING STATE ---
  const [linkingMaterialItem, setLinkingMaterialItem] = useState<any>(null);

  // --- RESUME DIALOG STATE ---
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [resumingItem, setResumingItem] = useState<WBSItem | null>(null);
  const [resumeReason, setResumeReason] = useState("");

  // --- TEAM REASSIGNMENT STATE (UI ONLY) ---
  const [teamViewDialogOpen, setTeamViewDialogOpen] = useState(false);
  const [teamViewItem, setTeamViewItem] = useState<WBSItem | null>(null);
  const [availableTasks, setAvailableTasks] = useState<WBSItem[]>([]);

  // --- MATERIAL STATUS TRACKING ---
  const [, setMaterialStatusSync] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  // Fetch Master Data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location"));
  }, [dispatch]);

  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
  };

  useEffect(() => {
    dispatch(
      fetchProjects({
        search: debouncedSearchTerm,
        page: 1,
        limit: 100,
        location: locationFilter,
      })
    );
  }, [debouncedSearchTerm, locationFilter]);

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);

    const diffTime = endDate.getTime() - startDate.getTime();

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays > 0 ? diffDays : 0;
  };

  // remain it commented.
  const handleSave = async () => {
    // 1. Basic Validation
    if (!formData.name || !formData.projectId || !formData.type) {
      toastSonner.error("Validation Error", {
        description: "Name, Project, and Type are required.",
      });
      return;
    }

    // 2. Date Validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end < start) {
        toastSonner.error("Date Error", {
          description: "End Date cannot be earlier than Start Date.",
        });
        return;
      }
    }

    // 3. Delay Reason Validation
    if (formData.status === "delayed" && !formData.delayReason?.trim()) {
      toastSonner.error("Validation Error", {
        description: "Please provide a reason for the delay.",
      });
      return;
    }

    // 4. Parent Validation
    if (formData.type === "phase") {
      formData.parentId = null;
    } else if (!formData.parentId) {
      toastSonner.error("Validation Error", {
        description: `${formData.type} must have a Parent Item.`,
      });
      return;
    }

    try {
      if (editingItem) {
        // A. Update the Item First
        await dispatch(updateWbsItem({ id: editingItem.id, data: formData })).unwrap();

        // B. Check if Status is Delayed and Item is NOT already paused
        // We trigger the pause action automatically here
        if (formData.status === "delayed" && !editingItem.isPaused) {
          const pauseReason = `DELAYED: ${formData.delayReason}`;

          await dispatch(pauseWbsTask({
            id: editingItem.id,
            reason: pauseReason
          })).unwrap();

          toastSonner.warning("Task Delayed & Paused", {
            description: "The task has been paused automatically due to delay status.",
          });
        } else {
          toastSonner.success("Updated", {
            description: "WBS item updated successfully",
          });
        }
      } else {
        // Create New Item
        const newItem = await dispatch(createWbsItem(formData)).unwrap();

        // Handle case where a new item is created immediately as delayed (rare but possible)
        if (formData.status === "delayed") {
          const pauseReason = `DELAYED: ${formData.delayReason}`;
          await dispatch(pauseWbsTask({
            id: newItem.id,
            reason: pauseReason
          })).unwrap();
        }

        toastSonner.success("Success", {
          description: "WBS item created successfully",
        });
      }

      // Close Dialog and Reset
      setIsDialogOpen(false);
      resetForm();

    } catch (error: any) {
      toastSonner.error("Error", {
        description: error.message || "Failed to save WBS item",
      });
    }
  };

  // const handleSave = () => {
  //   if (!formData.name || !formData.projectId || !formData.type) {
  //     toastSonner.error("Validation Error",{
  //       description: "Name, Project, and Type are required.",
  //     });
  //     return;
  //   }

  //   if (formData.startDate && formData.endDate) {
  //     const start = new Date(formData.startDate);
  //     const end = new Date(formData.endDate);

  //     if (end < start) {
  //       toastSonner.error("Date Error",{
  //         description: "End Date cannot be earlier than Start Date.",
  //       });
  //       return;
  //     }
  //   }

  //   // 3. [NEW] Delay Reason Validation
  //   if (formData.status === "delayed" && !formData.delayReason?.trim()) {
  //     toastSonner.error( "Validation Error",{
  //       description: "Please provide a reason for the delay.",
  //     });
  //     return;
  //   }

  //   if (formData.type === "phase") {
  //     formData.parentId = null;
  //   } else if (!formData.parentId) {
  //     toastSonner.error("Validation Error",{
  //       description: `${formData.type} must have a Parent Item.`,
  //     });
  //     return;
  //   }

  //   if (editingItem) {
  //     dispatch(updateWbsItem({ id: editingItem.id, data: formData }))
  //       .unwrap()
  //       .then(() => {
  //         toastSonner.success("Updated",{
  //           description: "WBS item updated successfully",
  //         });
  //         setIsDialogOpen(false);
  //         resetForm();
  //       });
  //   } else {
  //     dispatch(createWbsItem(formData))
  //       .unwrap()
  //       .then(() => {
  //         toastSonner.success( "Success",{
  //           description: "WBS item created successfully",
  //         });
  //         setIsDialogOpen(false);
  //         resetForm();
  //       });
  //   }
  // };
  const handleDelete = async (id: string) => {
    // 1️⃣ Check child dependency
    const hasChildren = wbs.some((item) => item.parentId === id);
    if (hasChildren) {
      toast({
        title: "Error",
        description: "Cannot delete item. It has child items.",
        variant: "destructive",
      });
      return;
    }

    // 2️⃣ Confirm delete
    const confirmed = window.confirm(
      "Are you sure you want to delete this WBS item? This action cannot be undone."
    );
    if (!confirmed) return;

    // 3️⃣ Delete with error handling
    try {
      await dispatch(deleteWbsItem(id)).unwrap();
      toast({
        title: "Success",
        description: "WBS item deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete WBS item",
        variant: "destructive",
      });
    }
  };


  const openEditDialog = (item: WBSItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    if (!selectedProjectId) return;
    resetForm();
    setFormData({
      projectId: selectedProjectId,
      type: "phase",
      status: "not-started",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({});
  };

  const showToast = (message: string) => {
    toast({
      title: "Feature",
      description: message,
    });
  };

  // Get material status from localStorage sync
  const getMaterialStatus = (materialId: string) => {
    const syncData = JSON.parse(localStorage.getItem('MRS_STATUS_SYNC') || '{}');
    return syncData[materialId] || 'pending';
  };

  // Get MRS materials for a specific WBS task
  const getMRSMaterialsForTask = (taskName: string) => {
    if (!selectedProjectId || !mrsList) return [];

    return mrsList.filter((mrs: any) => {
      const mrsProjectId = String(mrs.projectId || '');
      const selectedId = String(selectedProjectId || '');
      return mrsProjectId === selectedId && mrs.task === taskName;
    });
  };

  // Get material status summary for WBS item (only show received materials)
  const getMaterialStatusSummary = (wbsItem: WBSItem) => {
    // Get materials from both sources
    const linkedMaterials = (wbsItem as any).linkedMaterials || [];
    const mrsMaterials = getMRSMaterialsForTask(wbsItem.name);

    // Combine both sources
    const allMaterials = [
      ...linkedMaterials.map((lm: any) => ({ id: lm.materialId, source: 'linked' })),
      ...mrsMaterials.map((mrs: any) => ({ id: mrs.id || mrs._id, source: 'mrs' }))
    ];

    // Remove duplicates (in case material is both linked and in MRS)
    const uniqueMaterials = allMaterials.filter((material, index, self) =>
      index === self.findIndex(m => m.id === material.id)
    );

    // Filter to only show received materials
    const receivedMaterials = uniqueMaterials.filter(material => {
      const status = getMaterialStatus(material.id);
      return status === 'received';
    });

    if (receivedMaterials.length === 0) {
      return { total: 0, received: 0, inTransit: 0, sent: 0, pending: 0 };
    }

    // For display purposes, we only show received count
    const summary = {
      total: receivedMaterials.length,
      received: receivedMaterials.length,
      inTransit: 0,
      sent: 0,
      pending: 0
    };

    return summary;
  };

  const handleLinkTeam = (item: WBSItem) => {
    setLinkingItem(item);
  };

  const handleLinkMaterial = (item: any) => {
    // Refresh MRS data when opening material dialog to get latest status
    dispatch(fetchMRS());
    setLinkingMaterialItem(item);
  };

  const handleTeamView = (item: WBSItem) => {
    setTeamViewItem(item);
    // Get all non-paused tasks in the same project for display
    const nonPausedTasks = wbs.filter(task =>
      task.projectId === item.projectId &&
      !task.isPaused &&
      task.id !== item.id
    );
    setAvailableTasks(nonPausedTasks);
    setTeamViewDialogOpen(true);
  };

  const handleTaskSelection = async (member: any, targetTask: WBSItem) => {
    try {
      // We essentially just assign this person to the new task
      // The backend 'assignPersonToWbs' handles the "add" logic
      const payload = {
        wbsId: targetTask.id,
        resourceId: member.resourceId,
        type: member.type,
        personalInfo: member.personalInfo,
        employment: member.employment || {},
        financial: member.financial || {},
      };

      await dispatch(assignPersonToWbs(payload)).unwrap();
      console.log("1")
      toast({
        title: 'Success',
        description: `Successfully assigned ${member.personalInfo?.name || "Member"} to "${targetTask.name}".`,
        className: "bg-green-50 border-green-200",
      });
      console.log("2")

      // Close the dropdown or dialog if needed, or keep open for more moves
    } catch (error: any) {
      toast({
        title: "Reassignment Failed",
        description: error || "Could not assign person to task",
        variant: "destructive",
      });
    }
  };

  const handlePauseTask = async (item: WBSItem) => {
    const reason = prompt("Enter reason for pausing this task (optional):");

    try {
      await dispatch(pauseWbsTask({ id: item.id, reason: reason || "" })).unwrap();
      toast({
        title: "Task Paused",
        description: `${item.name} has been paused successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to pause task",
        variant: "destructive",
      });
    }
  };

  const handleResumeTask = (item: WBSItem) => {
    setResumingItem(item);
    setResumeReason("");
    setResumeConflicts([]); // Reset conflicts
    setResolutionMap({});

    // --- CHECK FOR CONFLICTS ---
    // Look at the snapshot of who was here when we paused
    const snapshot = item.pausedAssignmentsSnapshot || [];
    if (snapshot.length === 0) {
      setResumeDialogOpen(true);
      return;
    }

    // Identify which of these people are currently assigned to OTHER active tasks in this project
    const conflicts: any[] = [];

    // Helper: Get all active tasks for this project (excluding the one being resumed)
    const activeProjectTasks = wbs.filter(
      t => t.projectId === item.projectId && t.id !== item.id && !t.isDeleted
    );

    snapshot.forEach(person => {
      // Find if this person is assigned to any active task
      // We check 'assignedPersons' of other tasks
      const activeAssignments = activeProjectTasks.filter(t =>
        t.assignedPersons?.some(p => p.resourceId === person.resourceId)
      );

      if (activeAssignments.length > 0) {
        // Just take the first one found for simplicity, or list them all
        const currentTask = activeAssignments[0];
        conflicts.push({
          person,
          currentTask,
          conflictType: 'reassigned'
        });

        // Default resolution
        setResolutionMap(prev => ({ ...prev, [person.resourceId]: "both" }));
      }
    });

    if (conflicts.length > 0) {
      setResumeConflicts(conflicts);
    }

    setResumeDialogOpen(true);
  };

  const confirmResumeTask = async () => {
    if (!resumingItem) return;

    // Build resolution payload
    const resolutions = resumeConflicts.map(conflict => ({
      resourceId: conflict.person.resourceId,
      tempTaskId: conflict.currentTask.id,
      action: resolutionMap[conflict.person.resourceId] || "both"
    }));

    try {
      const result = await dispatch(resumeWbsTask({
        id: resumingItem.id,
        resumeReason: resumeReason,
        resolutions
      })).unwrap();

      const pausedDays = result.pauseHistory?.[result.pauseHistory.length - 1]?.pausedDays || 0;

      toast({
        title: "Task Resumed",
        description: `Task active. End date extended by ${Math.round(pausedDays)} days.`,
      });

      setResumeDialogOpen(false);
      setResumingItem(null);
      setResumeReason("");
      setResumeConflicts([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to resume task",
        variant: "destructive",
      });
    }
  };

  const validParents = useMemo(() => {
    if (!selectedProjectId || !formData.type || formData.type === "phase") {
      return [];
    }

    let parentType: WBSItemType;
    if (formData.type === "activity") parentType = "phase";
    else if (formData.type === "task") parentType = "activity";
    else if (formData.type === "subtask") parentType = "task";
    else return [];

    return wbs.filter(
      (i) => i.projectId === selectedProjectId && i.type === parentType
    );
  }, [formData.type, selectedProjectId, wbs]);

  const topLevelItems = useMemo(() => {
    return wbs.filter(
      (i) => i.projectId === selectedProjectId && i.parentId === null
    );
  }, [selectedProjectId, wbs]);

  // Calculate min start date and max end date for selected project
  const projectDateRange = useMemo(() => {
    if (!selectedProjectId) return null;

    // Filter WBS items for the selected project only
    const projectWbsItems = wbs.filter((item) => {
      const itemProjectId = item.projectId || (item as any)._id?.projectId || (item as any).projectId;
      return itemProjectId === selectedProjectId;
    });

    if (projectWbsItems.length === 0) return null;

    const datesWithStart = projectWbsItems
      .filter((item) => item.startDate)
      .map((item) => {
        try {
          return parseISO(item.startDate!);
        } catch (e) {
          return null;
        }
      })
      .filter((date): date is Date => date !== null);

    const datesWithEnd = projectWbsItems
      .filter((item) => item.endDate)
      .map((item) => {
        try {
          return parseISO(item.endDate!);
        } catch (e) {
          return null;
        }
      })
      .filter((date): date is Date => date !== null);

    if (datesWithStart.length === 0 && datesWithEnd.length === 0) return null;

    const minStartDate = datesWithStart.length > 0 ? min(datesWithStart) : null;
    const maxEndDate = datesWithEnd.length > 0 ? max(datesWithEnd) : null;

    return {
      minStartDate,
      maxEndDate,
    };
  }, [selectedProjectId, wbs]);

  useEffect(() => {
    if (selectedProjectId) {
      setFormData((prev) => ({
        ...prev,
        projectId: selectedProjectId,
      }));
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWbsByProject(selectedProjectId));
      dispatch(fetchMRS()); // Also fetch MRS data
    }
  }, [selectedProjectId, dispatch]);





  // Load material status sync from localStorage and listen for updates
  useEffect(() => {
    // Load initial status
    const syncData = localStorage.getItem('MRS_STATUS_SYNC');
    if (syncData) {
      setMaterialStatusSync(JSON.parse(syncData));
    }

    // Listen for MRS status changes
    const handleMrsStatusChange = (event: CustomEvent) => {
      const { itemId, status } = event.detail;
      setMaterialStatusSync(prev => ({
        ...prev,
        [itemId]: status
      }));
    };

    // Listen for WBS materials updates
    const handleWbsMaterialsUpdate = () => {
      // Refresh both WBS and MRS data when materials are updated
      if (selectedProjectId) {
        dispatch(fetchWbsByProject(selectedProjectId));
        dispatch(fetchMRS());
      }
    };

    window.addEventListener('mrsStatusChanged', handleMrsStatusChange as EventListener);
    window.addEventListener('wbsMaterialsUpdated', handleWbsMaterialsUpdate);

    // Periodic sync check
    const interval = setInterval(() => {
      const syncData = localStorage.getItem('MRS_STATUS_SYNC');
      if (syncData) {
        const parsed = JSON.parse(syncData);
        setMaterialStatusSync(parsed);
      }
    }, 2000);

    return () => {
      window.removeEventListener('mrsStatusChanged', handleMrsStatusChange as EventListener);
      window.removeEventListener('wbsMaterialsUpdated', handleWbsMaterialsUpdate);
      clearInterval(interval);
    };
  }, [selectedProjectId, dispatch]);

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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Work Breakdown Structure
          </h2>
          <p className="text-muted-foreground">
            Manage project phases, activities, and tasks
          </p>
          {projectDateRange && selectedProjectId && (
            <div className="flex items-center gap-4 mt-2 text-sm">
              {projectDateRange.minStartDate && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-semibold text-green-700">
                    {format(projectDateRange.minStartDate, "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              {projectDateRange.maxEndDate && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">End:</span>
                  <span className="font-semibold text-red-700">
                    {format(projectDateRange.maxEndDate, "MMM dd, yyyy")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <Select disabled={isLocationRestricted} value={locationFilter} onValueChange={handleLocationFilterChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc: any) => (
                <SelectItem key={loc._id} value={loc._id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-full md:w-64 justify-between"
              >
                {selectedProject ? (
                  <span className="truncate">
                    {selectedProject.code} - {selectedProject.name}
                  </span>
                ) : (
                  "Select a Project"
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput
                  placeholder="Search projects..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  {projectLoading && (
                    <div className="p-4 text-center text-sm">Loading...</div>
                  )}
                  <CommandEmpty>
                    {!projectLoading && "No projects found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {!projectLoading &&
                      projects.map((project) => (
                        <CommandItem
                          key={project._id}
                          value={`${project.code} ${project.name} ${project.clientOrDepartment || ""
                            }`}
                          onSelect={() => {
                            setSelectedProjectId(project._id);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${selectedProjectId === project._id
                              ? "opacity-100"
                              : "opacity-0"
                              }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {project.code} - {project.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {project.clientOrDepartment}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* CREATE/EDIT DIALOG */}


          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              {canCreate && (
                <Button
                  onClick={openCreateDialog}
                  disabled={!selectedProjectId}
                  className="w-full md:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New WBS Item
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit WBS Item" : "Create New WBS Item"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update WBS item details"
                    : "Add a new phase, activity, or task"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Input
                    disabled
                    value={
                      projects.find((p) => p._id === formData.projectId)
                        ?.name || ""
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: WBSItemType) =>
                        setFormData({
                          ...formData,
                          type: value,
                          parentId: null,
                        })
                      }
                      disabled={!!editingItem}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {WBS_ITEM_TYPES.map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="capitalize"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentId">Parent Item</Label>
                    <Select
                      value={formData.parentId || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, parentId: value })
                      }
                      disabled={!formData.type || formData.type === "phase"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {validParents.length > 0 ? (
                          validParents.map((parent) => (
                            <SelectItem key={parent.id} value={parent.id}>
                              {parent.name} ({parent.type})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-sm text-muted-foreground">
                            No valid parents.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Foundation Work"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drawingCode">Drawing Code</Label>
                  <Input
                    id="drawingCode"
                    value={formData.drawingCode || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, drawingCode: e.target.value })
                    }
                    placeholder="e.g. STR-05"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Detailed description of the work..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate || ""}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        const newDuration = calculateDuration(
                          newStartDate,
                          formData.endDate || ""
                        );
                        setFormData({
                          ...formData,
                          startDate: newStartDate,
                          duration: newDuration,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate || ""}
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        const newDuration = calculateDuration(
                          formData.startDate || "",
                          newEndDate
                        );
                        setFormData({
                          ...formData,
                          endDate: newEndDate,
                          duration: newDuration,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      readOnly
                      className="bg-gray-100"
                      value={formData.duration || ""}
                      placeholder="Auto"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plannedCost">Planned Cost (₹)</Label>
                    <Input
                      id="plannedCost"
                      type="number"
                      value={formData.plannedCost || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          plannedCost: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: wbstatus) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {WBS_ITEM_STATUSES.map((status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            className="capitalize"
                          >
                            {status.replace("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.status === "delayed" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="delayReason" className="text-red-600 font-medium">
                      Reason for Delay *
                    </Label>
                    <Textarea
                      id="delayReason"
                      value={formData.delayReason || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, delayReason: e.target.value })
                      }
                      placeholder="Provide a reason for your delay..."
                      className="border-red-200 focus:border-red-500"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Dependencies</Label>

                  <Select
                    onValueChange={(value) => {
                      const newDeps = formData.dependencies
                        ? [...formData.dependencies]
                        : [];
                      if (!newDeps.includes(value)) {
                        newDeps.push(value);
                      }
                      setFormData({ ...formData, dependencies: newDeps });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dependency" />
                    </SelectTrigger>

                    <SelectContent>
                      {wbs
                        .filter((item) => item.id !== editingItem?.id)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.type})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.dependencies?.map((dep) => (
                      <span
                        key={dep}
                        className="px-2 py-1 text-xs bg-blue-100 border rounded cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            dependencies: formData.dependencies!.filter(
                              (d) => d !== dep
                            ),
                          })
                        }
                      >
                        {wbs.find((w) => w.id === dep)?.name || dep} ✕
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save WBS Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* --- WBS TREE SECTION --- */}
      <Card>
        <CardHeader>
          <CardTitle>WBS Tree</CardTitle>
          <div className="flex items-center border-b border-gray-300 py-2 mt-2 text-sm font-semibold text-muted-foreground">
            <div className="flex-1">
              <span className="ml-10">Task Name</span>
            </div>
            <div className="w-24 text-center">Status</div>
            <div className="w-20 text-center">Start Date</div>
            <div className="w-20 text-center">End Date</div>
            <div className="w-20 text-center">Progress</div>
            <div className="w-32 text-center">Materials</div>
            <div className="w-60 text-right pr-4">Actions</div>
          </div>
        </CardHeader>
        {selectedBillWbsId && (
          <BillModal
            open={billModalOpen}
            onClose={() => setBillModalOpen(false)}
            wbsId={selectedBillWbsId}
          />
        )}

        <CardContent>
          {!selectedProjectId ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Please select a project to view its WBS.
              </p>
            </div>
          ) : topLevelItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No WBS items yet for this project.
              </p>
              <Button
                variant="link"
                className="mt-2"
                onClick={openCreateDialog}
              >
                Create your first item
              </Button>
            </div>
          ) : (
            topLevelItems.map((item) => (
              <WBSNode
                key={item.id}
                item={item}
                allwbs={wbs}
                level={0}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onLinkTeam={handleLinkTeam} // Pass link handler
                onLinkMaterial={handleLinkMaterial} // Pass material link handler
                onTeamView={handleTeamView} // Pass team view handler
                onShowToast={showToast}
                onPause={handlePauseTask}
                onResume={handleResumeTask}
                getMaterialStatusSummary={getMaterialStatusSummary}
                onOpenBill={openBillModal}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* --- TEAM LINKING MODAL --- */}
      <TeamSelectionDialog
        isOpen={!!linkingItem}
        onClose={() => setLinkingItem(null)}
        wbsItem={linkingItem}
        organisationId={userProfile.hrmsOrganisationId}
      />

      {/* --- MATERIAL LINKING MODAL --- */}
      <MaterialSelectionDialog
        isOpen={!!linkingMaterialItem}
        onClose={() => setLinkingMaterialItem(null)}
        wbsItem={linkingMaterialItem}
      />

      {/* --- RESUME TASK DIALOG --- */}
      <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resume Task</DialogTitle>
            <DialogDescription>
              Resume task "{resumingItem?.name}"? The end date will be automatically extended based on the paused duration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resumeReason">Reason for resuming (optional)</Label>
              <Textarea
                id="resumeReason"
                value={resumeReason}
                onChange={(e) => setResumeReason(e.target.value)}
                placeholder="Enter reason for resuming this task..."
                className="min-h-[80px]"
              />
            </div>
            {resumingItem?.isPaused && (
              <div className="text-sm text-muted-foreground">
                <p>Paused since: {resumingItem.pausedAt ? new Date(resumingItem.pausedAt).toLocaleDateString() : 'N/A'}</p>
                <p>Total paused days so far: {resumingItem.totalPausedDays || 0}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResumeDialogOpen(false);
                setResumingItem(null);
                setResumeReason("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmResumeTask}>
              Resume Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- TEAM VIEW DIALOG (UI ONLY) --- */}
      <Dialog open={teamViewDialogOpen} onOpenChange={setTeamViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Team Members - {teamViewItem?.name}</DialogTitle>
            <DialogDescription>
              Task is paused. View assigned team members and available tasks for reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {teamViewItem?.assignedPersons && teamViewItem.assignedPersons.length > 0 ? (
              <div className="space-y-3">
                <Label>Assigned Team Members:</Label>
                {teamViewItem.assignedPersons.map((member: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {member.personalInfo?.name ||
                          member.personalInfo?.firstName ||
                          member.personalInfo?.fullName ||
                          member.name ||
                          `Team Member`}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {member.type} • Progress: {member.progress || 0}%
                      </p>
                      {/* <p className="text-xs text-gray-500">
                        ID: {member.resourceId}
                      </p> */}
                      {member.personalInfo?.designation && (
                        <p className="text-xs text-muted-foreground">
                          {member.personalInfo.designation}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          View Tasks
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Available Active Tasks</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {availableTasks.length > 0 ? (
                          availableTasks.map((task) => (
                            <DropdownMenuItem
                              key={task.id}
                              onClick={() => handleTaskSelection(member, task)}
                              className="cursor-pointer hover:bg-gray-50"
                            >
                              <div className="flex flex-col w-full">
                                <span className="font-medium text-sm">{task.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {task.type} • {task.status?.replace("-", " ") || "not-started"}
                                </span>
                                {task.startDate && task.endDate && (
                                  <span className="text-xs text-blue-600">
                                    {task.startDate} to {task.endDate}
                                  </span>
                                )}
                              </div>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled className="text-center">
                            <span className="text-muted-foreground">No available active tasks</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No team members assigned to this task.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTeamViewDialogOpen(false);
                setTeamViewItem(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
