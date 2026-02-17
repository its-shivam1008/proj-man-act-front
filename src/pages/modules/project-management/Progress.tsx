import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Edit2, MapPin, Loader2, ShieldAlert, Check, ChevronsUpDown } from "lucide-react";
import { generateId } from "@/utils/localStorage";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchDailyProgress,
  addDailyProgress,
  editDailyProgress,
  removeDailyProgress,
} from "@/redux/slices/dailyProgressSlice";
import { fetchProjects } from "@/redux/slices/projectSlice"; // Import fetchProjects
import { fetchWbsByProject } from "@/redux/slices/wbsSlice"; // Import fetchWbsByProject
import { usePermission } from "@/hooks/userPermission";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/useDebounce";
import { parseISO, differenceInDays, addDays, format, isWithinInterval, startOfDay } from "date-fns";
import { DailyProgressItem } from "@/types/dailyProgress";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";

export default function DailyProgressPage() {
  const dispatch = useDispatch<AppDispatch>();

  // -- Selectors --
  const { items, loading: progressLoading } = useSelector((state: RootState) => state.dailyProgress);
  const { projects, loading: projectLoading } = useSelector((state: RootState) => state.projects);
  const { wbs, loading: wbsLoading } = useSelector((state: RootState) => state.wbs);
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);

  const canView = usePermission('progressUpdates', 'view');

  // -- Local State --
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DailyProgressItem | null>(null);
  const [form, setForm] = useState<Partial<DailyProgressItem>>({ date: new Date().toISOString().slice(0, 10), percentComplete: 0 });

  // Pagination
  const [progressPage, setProgressPage] = useState(1);
  const PROGRESS_PAGE_SIZE = 10;

  // -- Project Selection State --
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [locationFilter, setLocationFilter] = useState("all");
  const [updatingWbs, setUpdatingWbs] = useState<string | null>(null);

  // Local progress state for optimistic updates and animations
  const [localProgress, setLocalProgress] = useState<Record<string, number>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Daily logs filters
  const [logFilters, setLogFilters] = useState({
    dateFrom: "",
    dateTo: "",
    updaterType: "all",
    wbsId: "all"
  });

  const isLocationRestricted =
    userProfile?.role !== 'admin' &&
    !!userProfile?.location;

  // -- Initial Fetch --
  useEffect(() => {
    dispatch(fetchDailyProgress());
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

  // Fetch Projects on search
  useEffect(() => {
    dispatch(
      fetchProjects({
        search: debouncedSearchTerm,
        page: 1,
        limit: 100,
        location: locationFilter,
      })
    );
  }, [debouncedSearchTerm, locationFilter, dispatch]);

  // Fetch WBS when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWbsByProject(selectedProjectId));
    }
  }, [selectedProjectId, dispatch]);

  // -- Helper: Calculate Planned vs Actual Data based on WBS --
  // Memoize based on selectedProjectId and WBS structure (dates) only, NOT progress values
  // This prevents chart re-rendering when slider is adjusted
  const wbsStructure = useMemo(() => {
    return wbs.map(item => ({
      _id: item._id,
      startDate: item.startDate,
      endDate: item.endDate,
      parentId: item.parentId
    }));
  }, [wbs.map(i => `${i._id}-${i.startDate}-${i.endDate}`).join(',')]);

  const chartData = useMemo(() => {
    if (!selectedProjectId || wbsStructure.length === 0) return [];

    // 1. Find Date Range of the Project
    const dates = wbsStructure
      .map(item => ({ start: item.startDate ? parseISO(item.startDate) : null, end: item.endDate ? parseISO(item.endDate) : null }))
      .filter(d => d.start && d.end);

    if (dates.length === 0) return [];

    const minDate = new Date(Math.min(...dates.map(d => d.start!.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.end!.getTime())));

    const totalDays = differenceInDays(maxDate, minDate) + 1;
    const dataPoints = [];

    // 2. Generate Daily Data Points
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = addDays(minDate, i);
      const dateStr = format(currentDate, "yyyy-MM-dd");

      // Calculate Planned Progress (Simple linear distribution logic)
      // For each active WBS item on this day, add its contribution to total progress
      let activeItemsWeight = 0;
      let totalItemsWeight = 0;

      wbsStructure.forEach((item) => {
        if (!item.startDate || !item.endDate || item.parentId === null) return;
        const start = parseISO(item.startDate);
        const end = parseISO(item.endDate);

        // Simple weight: 1 per item (can be improved to use plannedCost)
        const weight = 1;
        totalItemsWeight += weight;

        if (currentDate >= start) {
          const itemDuration = differenceInDays(end, start) + 1;
          const daysPassed = differenceInDays(currentDate, start) + 1;

          if (currentDate > end) {
            activeItemsWeight += weight; // 100% complete planned
          } else {
            const percentPlanned = Math.min(100, Math.max(0, (daysPassed / itemDuration) * 100));
            activeItemsWeight += (percentPlanned / 100) * weight;
          }
        }
      });

      const plannedPercentage = totalItemsWeight > 0 ? (activeItemsWeight / totalItemsWeight) * 100 : 0;

      // Actual Progress (Aggregate current WBS progress)
      // Note: Since we don't have historical WBS snapshots, we approximate actual curve 
      // by using the "DailyProgress" entries if they match the date, or holding the current WBS progress value if looking at today.

      // For visualization, let's map "Actual" as the Weighted Average of WBS Progress *Current State* // (This creates a flat line for past/future, so we'll try to find DailyProgress logs to make it jagged)

      const dailyLog = items.find(log => log.date === dateStr);
      // If there is a daily log, use its percentComplete as a proxy for project level if applicable, 
      // or just plot it separately.

      // Better approach for "Actual" Line: Weighted Average of WBS items *Right Now* is a single point (Today).
      // To show history, we really need the DailyProgress logs to be linked to WBS items. 
      // Since they aren't explicitly linked by ID in the schema provided, we will omit the historical Actual line 
      // and only show "Planned" curve vs "Daily Log Entries" as scatter points or a secondary line.

      dataPoints.push({
        date: dateStr,
        planned: Math.round(plannedPercentage),
        actualLog: dailyLog ? dailyLog.percentComplete : null // Show daily log % if exists
      });
    }

    return dataPoints;
  }, [selectedProjectId, wbsStructure, items]);


  // -- Data Processing for UI --
  const selectedProjectDetails = projects.find(p => p._id === selectedProjectId);

  // Calculate Overall Project Actual Progress based on WBS weighted average
  const overallActualProgress = useMemo(() => {
    if (!wbs.length) return 0;
    const totalProgress = wbs.reduce((acc, item) => acc + (item.progress || 0), 0);
    return Math.round(totalProgress / wbs.length);
  }, [wbs]);

  const paginatedProgressItems = useMemo(() => {
    const start = (progressPage - 1) * PROGRESS_PAGE_SIZE;

    // Apply filters
    let filtered = items;

    if (logFilters.dateFrom) {
      filtered = filtered.filter(item => item.date >= logFilters.dateFrom);
    }
    if (logFilters.dateTo) {
      filtered = filtered.filter(item => item.date <= logFilters.dateTo);
    }
    if (logFilters.updaterType !== "all") {
      filtered = filtered.filter(item => (item as any).updaterType === logFilters.updaterType);
    }
    if (logFilters.wbsId !== "all") {
      filtered = filtered.filter(item => (item as any).wbsId === logFilters.wbsId);
    }

    return filtered.slice(start, start + PROGRESS_PAGE_SIZE);
  }, [items, progressPage, logFilters]);

  const progressTotalPages = Math.max(1, Math.ceil((items.length || 0) / PROGRESS_PAGE_SIZE));

  // -- Handlers --
  const openCreate = () => {
    setEditing(null);
    setForm({ date: new Date().toISOString().slice(0, 10), percentComplete: 0 });
    setIsDialogOpen(true);
  };

  const openEdit = (it: DailyProgressItem) => {
    setEditing(it);
    setForm({ ...it });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.date || typeof form.percentComplete !== "number") return;
    const now = new Date().toISOString();

    // Payload preparation
    const payload = {
      organisationId: localStorage.getItem("organisationId") || "",
      date: form.date,
      task: form.task || "",
      percentComplete: form.percentComplete,
      materialUsed: form.materialUsed || "",
      labourHours: form.labourHours || 0,
      machineHours: form.machineHours || 0,
      remarks: form.remarks || "",
      photos: form.photos || [],
      updatedBy: form.updatedBy || "",
      updatedAt: now,
    };

    if (editing) {
      await dispatch(editDailyProgress({ id: editing._id, payload }));
    } else {
      await dispatch(addDailyProgress({ ...payload, createdAt: now }));
    }
    setIsDialogOpen(false);
    setEditing(null);
    setForm({ date: new Date().toISOString().slice(0, 10), percentComplete: 0 });
  };

  const handleDelete = (id: string) => {
    dispatch(removeDailyProgress(id));
  };

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const gps = await new Promise<{ lat: number; lng: number } | undefined>((resolve) => {
        if (!navigator.geolocation) return resolve(undefined);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(undefined),
          { timeout: 5000 },
        );
      });
      const photo = { id: generateId(), dataUrl, gps };
      setForm((f) => ({ ...(f || {}), photos: [...((f && f.photos) || []), photo] }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (photoId: string) => {
    setForm((f) => ({ ...(f || {}), photos: (f.photos || []).filter((p) => p.id !== photoId) }));
  };

  // Debounced API call for WBS progress update
  const updateProgressAPI = useCallback(async (wbsId: string, newProgress: number) => {
    if (!selectedProjectId || !selectedProjectDetails) return;

    setUpdatingWbs(wbsId);
    try {
      const token = localStorage.getItem("token");
      const API_URL = BASE_URL;

      await axios.put(
        `${API_URL}/wbs/update-with-log/${wbsId}`,
        {
          progress: newProgress,
          projectId: selectedProjectId,
          projectName: selectedProjectDetails.name,
          updaterName: userProfile?.name || "Operator",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh WBS and daily logs
      dispatch(fetchWbsByProject(selectedProjectId));
      dispatch(fetchDailyProgress());
    } catch (error) {
      console.error("Failed to update progress:", error);
      // Revert local progress on error
      setLocalProgress(prev => {
        const updated = { ...prev };
        delete updated[wbsId];
        return updated;
      });
    } finally {
      setUpdatingWbs(null);
    }
  }, [selectedProjectId, selectedProjectDetails, userProfile, dispatch]);

  // Handle WBS progress change with debouncing and optimistic updates
  const handleProgressChange = useCallback((wbsId: string, newProgress: number) => {
    // Optimistic update - update local state immediately for smooth animation
    setLocalProgress(prev => ({ ...prev, [wbsId]: newProgress }));

    // Clear existing timer for this WBS
    if (debounceTimers.current[wbsId]) {
      clearTimeout(debounceTimers.current[wbsId]);
    }

    // Set new debounced timer (800ms delay)
    debounceTimers.current[wbsId] = setTimeout(() => {
      updateProgressAPI(wbsId, newProgress);
      delete debounceTimers.current[wbsId];
    }, 800);
  }, [updateProgressAPI]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

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
      {/* --- HEADER & PROJECT SELECTOR --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Progress Tracking</h2>
          <p className="text-muted-foreground">Monitor actual vs planned progress across projects.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Location Filter */}
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

          {/* Project Selector Popover */}
          <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={projectPopoverOpen}
                className="w-full md:w-72 justify-between"
              >
                {selectedProjectDetails ? (
                  <span className="truncate">
                    {selectedProjectDetails.code} - {selectedProjectDetails.name}
                  </span>
                ) : (
                  "Select a Project for Analysis"
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
                  {projectLoading && <div className="p-4 text-center text-sm">Loading...</div>}
                  <CommandEmpty>{!projectLoading && "No projects found."}</CommandEmpty>
                  <CommandGroup>
                    {!projectLoading &&
                      projects.map((project) => (
                        <CommandItem
                          key={project._id}
                          value={`${project.code} ${project.name}`}
                          onSelect={() => {
                            setSelectedProjectId(project._id);
                            setProjectPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${selectedProjectId === project._id ? "opacity-100" : "opacity-0"
                              }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{project.code} - {project.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* <Button onClick={openCreate} className="whitespace-nowrap">
            <Upload className="mr-2 h-4 w-4" /> Log Daily Progress
          </Button> */}
        </div>
      </div>

      {/* --- CHARTS SECTION --- */}
      {selectedProjectId ? (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project S-Curve: Planned vs Actual</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on WBS timelines vs reported progress
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{overallActualProgress}%</div>
                <div className="text-xs text-muted-foreground">Calculated Actual</div>
              </div>
            </CardHeader>
            <CardContent className="h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => val.slice(5)} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="planned"
                      name="Planned Cumulative %"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorPlanned)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="actualLog"
                      name="Daily Log Entry %"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Insufficient WBS data (dates missing) to generate S-Curve.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- WBS ITEM PROGRESS LIST --- */}
          <Card>
            <CardHeader>
              <CardTitle>WBS Items Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 overflow-y-auto max-h-[400px]">
                {wbsLoading ? (
                  <div className="text-center py-4"><Loader2 className="animate-spin mx-auto" /></div>
                ) : wbs.length === 0 ? (
                  <p className="text-muted-foreground text-center">No WBS items found for this project.</p>
                ) : (
                  <div className="grid gap-4">
                    {wbs.filter(i => {
                      // Show items that are:
                      // 1. Not parent items (parentId !== null)
                      // 2. AND (status is 'in-progress' OR progress is 0 or undefined)
                      // console.log(" i ==- ",wbs)
                      return i.status === 'in-progress';
                    }).map((item) => {
                      const currentProgress = localProgress[item._id] ?? item.progress;
                      const isChanging = localProgress[item._id] !== undefined && localProgress[item._id] !== item.progress;
                      const isIncreasing = isChanging && currentProgress > item.progress;
                      const isDecreasing = isChanging && currentProgress < item.progress;

                      return (
                        <div key={item.id} className="grid grid-cols-12 items-center gap-4 border-b pb-3 last:border-0">
                          <div className="col-span-4 md:col-span-3">
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{item.type}</div>
                          </div>
                          <div className="col-span-4 md:col-span-6">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span>{item.startDate}</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-base transition-all duration-300 ${isIncreasing ? 'text-green-600 scale-110' :
                                  isDecreasing ? 'text-red-600 scale-110' :
                                    'scale-100'
                                  }`}>
                                  {currentProgress}%
                                </span>
                                {isIncreasing && (
                                  <span className="text-green-600 text-sm animate-bounce">↑</span>
                                )}
                                {isDecreasing && (
                                  <span className="text-red-600 text-sm animate-bounce">↓</span>
                                )}
                              </div>
                              <span>{item.endDate}</span>
                            </div>
                            <div className="relative">
                              <Slider
                                value={[currentProgress]}
                                onValueChange={(value) => handleProgressChange(item._id, value[0])}
                                max={100}
                                step={1}
                                className={`cursor-pointer transition-all duration-300 ${isChanging ? 'opacity-80' : 'opacity-100'
                                  }`}
                                disabled={updatingWbs === item._id}
                              />
                              {/* Progress bar background animation */}
                              <div
                                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out pointer-events-none"
                                style={{
                                  width: `${currentProgress}%`,
                                  background: isIncreasing
                                    ? 'linear-gradient(90deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.4) 100%)'
                                    : isDecreasing
                                      ? 'linear-gradient(90deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.4) 100%)'
                                      : 'transparent'
                                }}
                              />
                            </div>
                            {updatingWbs === item._id && (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Saving...
                              </div>
                            )}
                            {isChanging && updatingWbs !== item._id && (
                              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <div className="h-1 w-1 rounded-full bg-blue-600 animate-pulse" />
                                Will save in a moment...
                              </div>
                            )}
                            {!isChanging && !updatingWbs && currentProgress === 0 && (
                              <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                Not started - Drag slider to begin
                              </div>
                            )}
                          </div>
                          <div className="col-span-4 md:col-span-3 text-right">
                            <Badge variant={item.status === 'completed' ? 'default' : 'outline'} className="capitalize">
                              {item.status?.replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-lg font-medium text-gray-600">Please select a project above to view planned vs actual analysis.</p>
            <p className="text-sm text-gray-500">The chart requires specific project WBS data to calculate timelines.</p>
          </CardContent>
        </Card>
      )}

      {/* --- DAILY PROGRESS LOGS (Existing Functionality) --- */}
      {/* <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Daily Logs ({items.length})</CardTitle>

            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex gap-2 items-center">
                <Label className="text-sm">From:</Label>
                <Input
                  type="date"
                  value={logFilters.dateFrom}
                  onChange={(e) => setLogFilters({ ...logFilters, dateFrom: e.target.value })}
                  className="w-40"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Label className="text-sm">To:</Label>
                <Input
                  type="date"
                  value={logFilters.dateTo}
                  onChange={(e) => setLogFilters({ ...logFilters, dateTo: e.target.value })}
                  className="w-40"
                />
              </div>
              <Select
                value={logFilters.updaterType}
                onValueChange={(val) => setLogFilters({ ...logFilters, updaterType: val })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Updater Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Updates</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={logFilters.wbsId}
                onValueChange={(val) => setLogFilters({ ...logFilters, wbsId: val })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="WBS Task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  {wbs.filter(i => i.parentId !== null).map((item) => (
                    <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(logFilters.dateFrom || logFilters.dateTo || logFilters.updaterType !== "all" || logFilters.wbsId !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogFilters({ dateFrom: "", dateTo: "", updaterType: "all", wbsId: "all" })}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>WBS Task</TableHead>
                  <TableHead>Progress Change</TableHead>
                  <TableHead>Updater Type</TableHead>
                  <TableHead>Updated By</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center"><Loader2 className="animate-spin inline mr-2" />Loading...</TableCell></TableRow>
                ) : paginatedProgressItems.map((it) => {
                  const itAny = it as any;
                  return (
                    <TableRow key={it._id}>
                      <TableCell>{it.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {itAny.wbsName || it.task || "—"}
                      </TableCell>
                      <TableCell>
                        {itAny.previousProgress !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{itAny.previousProgress}%</Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge variant="secondary">{it.percentComplete}%</Badge>
                            {it.percentComplete > itAny.previousProgress ? (
                              <span className="text-green-600 text-xs">↑</span>
                            ) : it.percentComplete < itAny.previousProgress ? (
                              <span className="text-red-600 text-xs">↓</span>
                            ) : null}
                          </div>
                        ) : (
                          <Badge variant="secondary">{it.percentComplete}%</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={itAny.updaterType === "operator" ? "default" : "outline"}>
                          {itAny.updaterType || "operator"}
                        </Badge>
                      </TableCell>
                      <TableCell>{itAny.updaterName || it.updatedBy || "—"}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{it.remarks || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(it.photos || []).slice(0, 3).map((p) => (
                            <div
                              key={p.id}
                              className="w-8 h-8 rounded overflow-hidden border bg-gray-100"
                              title={p.gps ? `GPS: ${p.gps.lat.toFixed(4)}, ${p.gps.lng.toFixed(4)}` : "No GPS"}
                            >
                              <img src={p.dataUrl} alt="photo" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(it)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(it._id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {items.length > PROGRESS_PAGE_SIZE && (
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProgressPage((prev) => Math.max(1, prev - 1))}
                  disabled={progressPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProgressPage((prev) => Math.min(progressTotalPages, prev + 1))}
                  disabled={progressPage === progressTotalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div> */}

      {/* --- CREATE/EDIT DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Daily Progress" : "Add Daily Progress"}</DialogTitle>
            <DialogDescription>Add percent completed, materials used, labour/machine hours, photos & GPS.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Task</Label>
                <Input value={form.task || ""} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="Task name" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>% Completed</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.percentComplete ?? 0}
                  onChange={(e) => setForm({ ...form, percentComplete: parseFloat(e.target.value || "0") })}
                />
              </div>
              <div>
                <Label>Material Used</Label>
                <Input value={form.materialUsed || ""} onChange={(e) => setForm({ ...form, materialUsed: e.target.value })} />
              </div>
              <div>
                <Label>Labour Hours</Label>
                <Input
                  type="number"
                  value={form.labourHours ?? 0}
                  onChange={(e) => setForm({ ...form, labourHours: parseFloat(e.target.value || "0") })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Machine Hours</Label>
                <Input
                  type="number"
                  value={form.machineHours ?? 0}
                  onChange={(e) => setForm({ ...form, machineHours: parseFloat(e.target.value || "0") })}
                />
              </div>
              <div>
                <Label>Updated By</Label>
                <Input
                  value={form.updatedBy || ""}
                  onChange={(e) => setForm({ ...form, updatedBy: e.target.value })}
                  placeholder="Name"
                />
              </div>
            </div>

            <div>
              <Label>Remarks</Label>
              <Textarea value={form.remarks || ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </div>

            <div>
              <Label>Photos (GPS auto-tagged)</Label>
              <div className="flex gap-2 items-center mt-1">
                <Input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files)} className="w-full" />
              </div>
              {(form.photos || []).length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(form.photos || []).map((p) => (
                    <div key={p.id} className="border rounded overflow-hidden w-20 h-20 relative bg-slate-100">
                      <img src={p.dataUrl} alt="preview" className="w-full h-full object-cover" />
                      <button className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl" onClick={() => removePhoto(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-2 rounded">
              <MapPin className="h-4 w-4" />
              {((form.photos || []).find((p) => p.gps)?.gps) ? (
                <span className="text-green-600">Location Tagged</span>
              ) : "No GPS data yet"}
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Submit Log"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}