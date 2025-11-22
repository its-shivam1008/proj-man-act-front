import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RootState, AppDispatch } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWbsByProject,
  createWbsItem,
  updateWbsItem,
  deleteWbsItem,
} from "@/redux/slices/wbsSlice";

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
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  Users,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { fetchProjects } from "@/redux/slices/projectSlice";
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

// --- IMPORT THE SEPARATE MODAL COMPONENT ---
import TeamSelectionDialog from "@/components/TeamSelectionDialog";
import MaterialSelectionDialog from "@/components/MaterialSelectionDialog";

// --- TYPES ---
type WBSItemType = "phase" | "activity" | "task" | "subtask";
type wbstatus = "not-started" | "in-progress" | "completed" | "delayed";

interface WBSItem {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  description?: string;
  type: WBSItemType;
  startDate?: string;
  endDate?: string;
  duration?: number;
  plannedCost?: number;
  actualCost: number;
  manpowerRequirement?: string;
  materialRequirement?: string;
  dependencies: string[];
  status: wbstatus;
  progress: number;
  createdAt: string;
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
  item: WBSItem;
  allwbs: WBSItem[];
  level: number;
  onEdit: (item: WBSItem) => void;
  onDelete: (id: string) => void;
  onLinkTeam: (item: WBSItem) => void; // Prop to trigger modal
  onShowToast: (message: string) => void;
}

const WBSNode: React.FC<WBSNodeProps> = ({
  item,
  allwbs,
  level,
  onEdit,
  onDelete,
  onLinkTeam,
  onShowToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const children = useMemo(
    () => allwbs.filter((i) => i.parentId === item.id),
    [allwbs, item.id]
  );

  const [linkingMaterialItem, setLinkingMaterialItem] = useState(null);

  const getStatusColor = (status: wbstatus) => {
    const colors: Record<wbstatus, string> = {
      "not-started": "bg-gray-100 text-gray-800 border-gray-200",
      "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      delayed: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status];
  };

  const handleLinkMaterial = (item) => {
    setLinkingMaterialItem(item);
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
            {item.status.replace("-", " ")}
          </Badge>
        </div>
        <div className="w-20 text-center text-sm text-muted-foreground">
          {item.startDate || "N/A"}
        </div>
        <div className="w-20 text-center text-sm text-muted-foreground">
          {item.endDate || "N/A"}
        </div>
        <div className="w-48 text-right pr-4">
          <Button
            variant="ghost"
            size="icon"
            title="Link Materials"
            onClick={() => handleLinkMaterial(item)}
          >
            <Package className="h-4 w-4 text-blue-600" />
            <MaterialSelectionDialog
              isOpen={!!linkingMaterialItem}
              onClose={() => setLinkingMaterialItem(null)}
              wbsItem={linkingMaterialItem}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Link Team"
            onClick={() => onLinkTeam(item)} // Trigger Link Team
          >
            <Users className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit Item"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete Item"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
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
            onShowToast={onShowToast}
          />
        ))}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function WBS() {
  const organisationId = localStorage.getItem("organisationId");
  const dispatch = useDispatch<AppDispatch>();
  const { wbs, loading } = useSelector((state: RootState) => state.wbs);

  const { projects, loading: projectLoading } = useSelector(
    (state: RootState) => state.projects
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WBSItem | null>(null);
  const [formData, setFormData] = useState<Partial<WBSItem>>({});
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // --- TEAM LINKING STATE ---
  const [linkingItem, setLinkingItem] = useState<WBSItem | null>(null);

  const { toast } = useToast();

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  useEffect(() => {
    dispatch(
      fetchProjects({
        search: debouncedSearchTerm,
        page: 1,
        limit: 10,
      })
    );
  }, [debouncedSearchTerm]);

  const handleSave = () => {
    if (!formData.name || !formData.projectId || !formData.type) {
      toast({
        title: "Validation Error",
        description: "Name, Project, and Type are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "phase") {
      formData.parentId = null;
    } else if (!formData.parentId) {
      toast({
        title: "Validation Error",
        description: `${formData.type} must have a Parent Item.`,
        variant: "destructive",
      });
      return;
    }

    if (editingItem) {
      dispatch(updateWbsItem({ id: editingItem.id, data: formData }))
        .unwrap()
        .then(() => {
          toast({
            title: "Updated",
            description: "WBS item updated successfully",
          });
          setIsDialogOpen(false);
          resetForm();
        });
    } else {
      dispatch(createWbsItem(formData))
        .unwrap()
        .then(() => {
          toast({
            title: "Success",
            description: "WBS item created successfully",
          });
          setIsDialogOpen(false);
          resetForm();
        });
    }
  };

  const handleDelete = (id: string) => {
    const hasChildren = wbs.some((item) => item.parentId === id);
    if (hasChildren) {
      toast({
        title: "Error",
        description: "Cannot delete item. It has child items.",
        variant: "destructive",
      });
      return;
    }

    dispatch(deleteWbsItem(id))
      .unwrap()
      .then(() => {
        toast({
          title: "Success",
          description: "WBS item deleted successfully",
        });
      });
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

  // Open Team Link Modal
  const handleLinkTeam = (item: WBSItem) => {
    setLinkingItem(item);
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
    }
  }, [selectedProjectId, dispatch]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Work Breakdown Structure
          </h2>
          <p className="text-muted-foreground">
            Manage project phases, activities, and tasks
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-4">
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
                          value={`${project.code} ${project.name} ${
                            project.clientOrDepartment || ""
                          }`}
                          onSelect={() => {
                            setSelectedProjectId(project._id);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedProjectId === project._id
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
              <Button
                onClick={openCreateDialog}
                disabled={!selectedProjectId}
                className="w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                New WBS Item
              </Button>
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
                {/* ... (The content of your create/edit form remains unchanged) ... */}
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
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="30"
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

                <div className="space-y-2">
                  <Label htmlFor="manpowerRequirement">
                    Manpower Requirements
                  </Label>
                  <Textarea
                    id="manpowerRequirement"
                    value={formData.manpowerRequirement || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manpowerRequirement: e.target.value,
                      })
                    }
                    placeholder="e.g., 5 Skilled Laborers, 2 Engineers"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialRequirement">
                    Material Requirements
                  </Label>
                  <Textarea
                    id="materialRequirement"
                    value={formData.materialRequirement || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        materialRequirement: e.target.value,
                      })
                    }
                    placeholder="e.g., 100 bags Cement, 2 tons Steel"
                  />
                </div>
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
            <div className="w-48 text-right pr-4">Actions</div>
          </div>
        </CardHeader>
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
                onShowToast={showToast}
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
        organisationId={"81b48a8b-f574-4562-be38-f480e99359c9"}
      />
    </div>
  );
}
