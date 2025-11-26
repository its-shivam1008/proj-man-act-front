import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPublicEmployees } from "@/lib/hrmsIntegration";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { RootState, AppDispatch } from "@/redux/store";
import { toast } from "sonner";
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
import { Check, ChevronsUpDown, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Search, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  fetchProjects,
  addProject,
  updateProject,
  deleteProject,
} from "@/redux/slices/projectSlice";
import { ClipLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermission } from "@/hooks/userPermission";

// ---------------- Types ----------------
type ProjectStatus =
  | "planning"
  | "active"
  | "on-hold"
  | "completed"
  | "cancelled";

// Interface updated to reflect that client/department/type can be ID strings or populated objects
interface Project {
  _id: string;
  code: string;
  name: string;
  description: string;
  client?: string | { _id: string; name: string };
  department?: string | { _id: string; name: string };
  projectType?: string | { _id: string; name: string };
  location?: string;
  budget?: number;
  expectedRevenue?: number;
  duration?: string;
  manager?: string;
  assignedTeam?: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  progress: number;
  actualCost: number;
  createdAt: string;
  updatedAt: string;
}

const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "active",
  "on-hold",
  "completed",
  "cancelled",
];

// ---------------- Component Start ----------------
export default function Projects() {
  const [managerPopoverOpen, setManagerPopoverOpen] = useState(false);
  const [employeePage, setEmployeePage] = useState(1);
  const employeePageSize = 250; 
  
  const [employeeSearch, setEmployeeSearch] = useState("");
  const debouncedEmployeeSearch = useDebounce(employeeSearch, 400);

  const [employeeList, setEmployeeList] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const organisationId = localStorage.getItem("organisationId");

  const dispatch = useDispatch<AppDispatch>();

  const {
    projects = [],
    loading,
    currentPage,
    totalPages,
    totalProjects,
  } = useSelector((state: RootState) => state.projects);

  const canView = usePermission('projects', 'view');
  const canCreate = usePermission('projects', 'create');
  const canEdit = usePermission('projects', 'edit');
  const canDelete = usePermission('projects', 'delete');

  const [color, setColor] = useState("#212121");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 500);
  const uuid = "81b48a8b-f574-4562-be38-f480e99359c9";

  // Get Master Data from Redux
  const { clients, departments, projectTypes } = useSelector(
    (state: RootState) => state.masterData
  );

  const [clientOpen, setClientOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  // Fetch Master Data on mount
  useEffect(() => {
    dispatch(fetchMasterData("client"));
    dispatch(fetchMasterData("department"));
    dispatch(fetchMasterData("project-type"));
  }, [dispatch]);

  const [formData, setFormData] = useState<{
    code?: string;
    name?: string;
    description?: string;
    client?: string;
    department?: string;
    projectType?: string;
    status: ProjectStatus;
    budget?: number;
    expectedRevenue?: number;
    manager?: string;
  }>({
    status: "planning",
    client: undefined, 
    department: undefined,
    projectType: undefined
  });

  useEffect(() => {
    if (organisationId) {
      dispatch(
        fetchProjects({
          page,
          limit,
          status: statusFilter,
          search: debouncedSearch,
        })
      );
    }
  }, [organisationId, page, limit, statusFilter, debouncedSearch]);

  useEffect(() => {
    if (!uuid) return;

    const fetchEmployees = async () => {
      setEmployeeLoading(true);
      try {
        const res = await getPublicEmployees(
          uuid,
          employeePage,
          employeePageSize,
          debouncedEmployeeSearch,
          ""
        );

        if (res.data?.data) {
          setEmployeeList(res.data.data);
        } else {
          setEmployeeList([]);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        setEmployeeList([]);
      } finally {
        setEmployeeLoading(false);
      }
    };

    fetchEmployees();
  }, [uuid, debouncedEmployeeSearch, employeePage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (val: any) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleSave = async () => {
    if (
      !formData?.code ||
      !formData?.name ||
      !formData?.description ||
      !formData?.client || 
      !formData?.department
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (editingProject) {
      const res = await dispatch(
        updateProject({ id: editingProject._id, data: formData })
      );

      if (updateProject.fulfilled.match(res)) {
        toast.success("Project updated successfully");
      } else {
        toast.error(res.payload || "Update failed");
      }
    } else {
      const res = await dispatch(addProject(formData));

      if (addProject.fulfilled.match(res)) {
        toast.success("Project created successfully");
      } else {
        toast.error(res.payload || "Failed to create project");
      }
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const res = await dispatch(deleteProject(id));
    if (deleteProject.fulfilled.match(res)) {
      toast.success("Project deleted");
    } else {
      toast.error(res.payload || "Delete failed");
    }
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({ status: "planning" });
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    
    // When opening edit, ensure we extract the ID if the field is an object (populated)
    const getSafeId = (field: any) => (typeof field === 'object' && field?._id ? field._id : field);

    setFormData({
      ...project,
      client: getSafeId(project.client),
      department: getSafeId(project.department),
      projectType: getSafeId(project.projectType),
    });
    
    setIsDialogOpen(true);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  };

  const getStatusBadge = (status: Project["status"]) => {
    const variants: Record<ProjectStatus, string> = {
      planning: "bg-blue-100 text-blue-800 border-blue-200",
      active: "bg-green-100 text-green-800 border-green-200",
      "on-hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
      completed: "bg-purple-100 text-purple-800 border-purple-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[status];
  };

  // ---------------- HELPER FUNCTIONS FOR NAMES ----------------
  
  // Helper to find Client Name by ID
  const getClientName = (clientData: string | { _id: string; name: string } | undefined) => {
    if (!clientData) return "N/A";
    // If it's already an object (populated from backend)
    if (typeof clientData === 'object' && clientData.name) return clientData.name;
    // If it's an ID, find it in the redux store
    const found = clients.find((c) => c._id === clientData);
    return found ? found.name : "Unknown Client";
  };

  // Helper to find Project Type Name by ID
  const getProjectTypeName = (typeData: string | { _id: string; name: string } | undefined) => {
    if (!typeData) return "N/A";
    if (typeof typeData === 'object' && typeData.name) return typeData.name;
    const found = projectTypes.find((t) => t._id === typeData);
    return found ? found.name : "Unknown Type";
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold">Projects</h2>
          <p className="text-muted-foreground">Manage all company projects.</p>
        </div>

       {canCreate && <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Project
        </Button>}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, code, client..."
            className="pl-10"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects ({projects?.length ?? 0})</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-3">
                    <ClipLoader
                      color={color}
                      loading={loading}
                      size={15}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                  </TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{p?.code}</TableCell>
                    <TableCell>{p?.name}</TableCell>
                    
                    {/* USE HELPERS HERE */}
                    <TableCell>{getClientName(p.client)}</TableCell>
                    <TableCell className="capitalize">{getProjectTypeName(p.projectType)}</TableCell>

                    <TableCell>
                      <Badge
                        className={getStatusBadge(p.status)}
                        variant="outline"
                      >
                        {p.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="w-16" />
                        <span>{p.progress}%</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {p.budget ? `₹${(p.budget / 100000).toFixed(2)}L` : "N/A"}
                    </TableCell>

                    <TableCell className="text-right flex justify-end gap-2">
                      {canEdit && <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(p)}
                      >
                        <Pencil size={16} />
                      </Button>}

                      {canDelete && <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p._id)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex items-center justify-end space-x-2 p-4 border-t">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} (Total: {totalProjects})
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Modify project details."
                : "Fill project details."}
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <div className="grid gap-6 py-4">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Code *</Label>
                <Input
                  value={formData.code || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Project Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Client + Department Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CLIENT POPOVER */}
              <div className="flex flex-col gap-2">
                <Label>Client</Label>
                <Popover open={clientOpen} onOpenChange={setClientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="justify-between"
                    >
                      {formData.client
                        ? clients.find((c) => c._id === formData.client)?.name
                        : "Select Client"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search client..." />
                      <CommandList>
                        <CommandEmpty>No client found.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((c) => (
                            <CommandItem
                              key={c._id}
                              value={c.name}
                              onSelect={() => {
                                setFormData({ ...formData, client: c._id });
                                setClientOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.client === c._id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* DEPARTMENT POPOVER */}
              <div className="flex flex-col gap-2">
                <Label>Department</Label>
                <Popover open={deptOpen} onOpenChange={setDeptOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="justify-between"
                    >
                      {formData.department
                        ? departments.find((d) => d._id === formData.department)?.name
                        : "Select Department"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search department..." />
                      <CommandList>
                        <CommandEmpty>No department found.</CommandEmpty>
                        <CommandGroup>
                          {departments.map((d) => (
                            <CommandItem
                              key={d._id}
                              value={d.name}
                              onSelect={() => {
                                setFormData({ ...formData, department: d._id });
                                setDeptOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.department === d._id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {d.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Project Type POPOVER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <Label>Project Type</Label>
                <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="justify-between"
                    >
                      {formData.projectType
                        ? projectTypes.find((t) => t._id === formData.projectType)?.name
                        : "Select Type"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search type..." />
                      <CommandList>
                        <CommandEmpty>No type found.</CommandEmpty>
                        <CommandGroup>
                          {projectTypes.map((t) => (
                            <CommandItem
                              key={t._id}
                              value={t.name}
                              onSelect={() => {
                                setFormData({ ...formData, projectType: t._id });
                                setTypeOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.projectType === t._id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {t.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Budget + Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Budget</Label>
                <Input
                  type="number"
                  value={formData.budget || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <Label>Expected Revenue</Label>
                <Input
                  type="number"
                  value={formData.expectedRevenue || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedRevenue: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Manager + Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Manager</Label>

                <Popover
                  open={managerPopoverOpen}
                  onOpenChange={setManagerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={managerPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.manager
                        ? employeeList.find(
                            (e: any) => e.id === formData.manager
                          )
                          ? `${
                              employeeList.find(
                                (e: any) => e.id === formData.manager
                              )?.personalInfo?.firstName
                            } ${
                              employeeList.find(
                                (e: any) => e.id === formData.manager
                              )?.personalInfo?.lastName
                            }`
                          : "Select Project Manager"
                        : "Select Project Manager"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    sideOffset={5}
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                    style={{ zIndex: 9999 }}
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search employee..."
                        value={employeeSearch}
                        onValueChange={setEmployeeSearch}
                      />

                      <div className="max-h-80 overflow-y-auto">
                        <CommandList>
                          {employeeLoading ? (
                            <CommandEmpty>
                              <div className="py-6 text-center text-sm">
                                Loading employees...
                              </div>
                            </CommandEmpty>
                          ) : employeeList.length === 0 ? (
                            <CommandEmpty>No employees found.</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {employeeList.map((emp: any) => (
                                <CommandItem
                                  key={emp.id}
                                  value={`${
                                    emp.personalInfo?.firstName || ""
                                  } ${emp.personalInfo?.lastName || ""} ${
                                    emp.id
                                  }`}
                                  onSelect={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      manager: emp.id,
                                    }));
                                    setManagerPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.manager === emp.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>
                                      {emp.personalInfo?.firstName}{" "}
                                      {emp.personalInfo?.lastName}
                                    </span>
                                    {emp.personalInfo?.email && (
                                      <span className="text-xs text-muted-foreground">
                                        {emp.personalInfo.email}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </div>

                      {/* Next / Previous Buttons */}
                      <div className="flex items-center justify-between border-t p-2 bg-gray-50 dark:bg-gray-900">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEmployeePage((p) => Math.max(1, p - 1))
                          }
                          disabled={employeePage === 1 || employeeLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        <span className="text-xs text-muted-foreground">
                          Page {employeePage}
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEmployeePage((p) => p + 1)}
                          disabled={
                            employeeList.length < employeePageSize ||
                            employeeLoading
                          }
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: ProjectStatus) =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingProject ? "Update Project" : "Save Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}