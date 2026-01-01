"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { v4 as uuidv4 } from "uuid";
import {
  AlertCircle,
  Wrench,
  Plus,
  Edit2,
  Trash2,
  FileText,
  FilePlus,
  Eye,
  Download,
  DownloadCloud,
  UploadCloud,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePermission } from "@/hooks/userPermission";
import { useDebounce } from "@/hooks/useDebounce";
import { ClipLoader } from "react-spinners";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  differenceInDays,
} from "date-fns";

/* -----------------------
   Types
   ----------------------- */
type Status = "Reported" | "Assigned" | "In Progress" | "Completed" | "Cancelled";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

interface Breakdown {
  _id: string;
  equipmentCode: string;
  reportedBy: string;
  reportDate: string; // ISO
  failureDescription: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignedTo?: string;
  assignDate?: string; // ISO
  startRepair?: string; // ISO
  endRepair?: string; // ISO
  downtimeMinutes?: number;
  repairCost?: number;
  rca?: string;
  attachments?: Attachment[];
  status: Status;
  location: string | { _id: string; name: string };
  organisationId: string;
  createdAt: string;
  updatedAt: string;
}

interface BreakdownStats {
  totalBreakdowns: number;
  openBreakdowns: number;
  completedBreakdowns: number;
  mttr: number;
  totalDowntimeHours: number;
  totalCost: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

interface MaintenanceWorkOrder {
  id: string;
  breakdownId: string;
  equipmentCode: string;
  technician?: string;
  startDate?: string;
  endDate?: string;
  totalDowntimeMinutes?: number;
  totalRepairCost?: number;
  rca?: string;
  status: "Open" | "Closed";
  createdAt: string;
}

/* -----------------------
   Keys
   ----------------------- */
// const LS_KEY = "breakdown_maintenance_backup"; // For backup/export only

/* -----------------------
   Component
   ----------------------- */
export default function BreakdownCalendarWithMWO() {
  const dispatch = useDispatch<AppDispatch>();
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);
  
  // Permissions
  const canView = usePermission('breakdownMgt', 'view');
  const canCreate = usePermission('breakdownMgt', 'create');
  const canEdit = usePermission('breakdownMgt', 'edit');
  const canDelete = usePermission('breakdownMgt', 'delete');

  const [records, setRecords] = useState<Breakdown[]>([]);
  const [mwos, setMwos] = useState<MaintenanceWorkOrder[]>([]);
  const [stats, setStats] = useState<BreakdownStats>({
    totalBreakdowns: 0,
    openBreakdowns: 0,
    completedBreakdowns: 0,
    mttr: 0,
    totalDowntimeHours: 0,
    totalCost: 0
  });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBreakdowns, setTotalBreakdowns] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Breakdown | null>(null);
  const [form, setForm] = useState<Partial<Breakdown>>({
    priority: "Medium",
    reportDate: new Date().toISOString().slice(0, 16),
    repairCost: 0,
    attachments: [],
  });

  // view mode + calendar month state
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const debouncedSearch = useDebounce(query, 500);
  const organisationId = localStorage.getItem('organisationId');

  // Location restriction check
  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  // Fetch master data on mount
  useEffect(() => {
    dispatch(fetchMasterData("location"));
  }, [dispatch]);

  // Set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Fetch breakdowns
  useEffect(() => {
    if (organisationId) {
      fetchBreakdowns();
    }
  }, [organisationId, page, debouncedSearch, locationFilter, statusFilter, priorityFilter]);

  // Fetch stats
  useEffect(() => {
    if (organisationId) {
      fetchStats();
    }
  }, [organisationId, locationFilter]);

  const fetchBreakdowns = async () => {
    if (!canView) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organisationId: organisationId!,
        page: page.toString(),
        limit: "10",
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (locationFilter !== 'all') params.append('location', locationFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await fetch(`${API_BASE_URL}/breakdown-maintenance?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch breakdowns');

      const data = await response.json();
      if (data.success) {
        setRecords(data.data.breakdowns);
        setTotalPages(data.data.totalPages);
        setTotalBreakdowns(data.data.totalBreakdowns);
      }
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
      toast.error('Failed to fetch breakdowns');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        organisationId: organisationId!,
      });

      const response = await fetch(`${API_BASE_URL}/breakdown-maintenance/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  /* -----------------------
     CRUD & Workflow
  ----------------------- */
  function openAdd() {
    setEditing(null);
    setForm({
      priority: "Medium",
      reportDate: new Date().toISOString().slice(0, 16),
      repairCost: 0,
      attachments: [],
      location: isLocationRestricted ? userProfile?.location : undefined,
    });
    setIsDialogOpen(true);
  }

  function openEdit(b: Breakdown) {
    setEditing(b);
    setForm({ 
      ...b,
      location: typeof b.location === 'object' ? b.location._id : b.location,
    });
    setIsDialogOpen(true);
  }

  async function handleAttachments(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const converted: Attachment[] = await Promise.all(
      arr.map(
        (f) =>
          new Promise<Attachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: uuidv4(),
                name: f.name,
                type: f.type,
                size: f.size,
                dataUrl: reader.result as string,
              });
            reader.onerror = reject;
            reader.readAsDataURL(f);
          })
      )
    );
    setForm((p) => ({ ...p, attachments: [...(p?.attachments || []), ...converted] }));
  }

  function removeAttachment(id: string) {
    setForm((p) => ({ ...p, attachments: (p?.attachments || []).filter((a) => a.id !== id) }));
  }

  async function saveForm() {
    if (!form.equipmentCode || !form.reportedBy || !form.failureDescription || !form.location) {
      toast.error("Equipment, reporter, failure description, and location are required.");
      return;
    }

    try {
      const breakdownData = {
        ...form,
        location: isLocationRestricted ? userProfile?.location : form.location,
      };

      console.log("=== FRONTEND DEBUG ===");
      console.log("Form data being sent:", JSON.stringify(breakdownData, null, 2));
      console.log("======================");

      const url = editing 
        ? `${API_BASE_URL}/breakdown-maintenance/${editing._id}`
        : `${API_BASE_URL}/breakdown-maintenance`;
      
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(breakdownData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error response:", errorData);
        throw new Error('Failed to save breakdown');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(editing ? 'Breakdown updated successfully' : 'Breakdown reported successfully');
        setIsDialogOpen(false);
        setEditing(null);
        fetchBreakdowns();
        fetchStats();
      }
    } catch (error) {
      console.error('Error saving breakdown:', error);
      toast.error('Failed to save breakdown');
    }
  }

  async function removeRecord(id: string) {
    if (!confirm("Delete this breakdown record?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/breakdown-maintenance/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete breakdown');

      const data = await response.json();
      if (data.success) {
        toast.success('Breakdown deleted successfully');
        fetchBreakdowns();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting breakdown:', error);
      toast.error('Failed to delete breakdown');
    }
  }

  async function assignTo(id: string, tech: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/breakdown-maintenance/${id}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedTo: tech }),
      });

      if (!response.ok) throw new Error('Failed to assign breakdown');

      const data = await response.json();
      if (data.success) {
        toast.success('Breakdown assigned successfully');
        fetchBreakdowns();
        fetchStats();
      }
    } catch (error) {
      console.error('Error assigning breakdown:', error);
      toast.error('Failed to assign breakdown');
    }
  }

  async function startRepair(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/breakdown-maintenance/${id}/start-repair`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to start repair');

      const data = await response.json();
      if (data.success) {
        toast.success('Repair started successfully');
        fetchBreakdowns();
        fetchStats();
      }
    } catch (error) {
      console.error('Error starting repair:', error);
      toast.error('Failed to start repair');
    }
  }

  async function completeRepair(id: string, additionalCost = 0, rca = "") {
    try {
      const response = await fetch(`${API_BASE_URL}/breakdown-maintenance/${id}/complete-repair`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ additionalCost, rca }),
      });

      if (!response.ok) throw new Error('Failed to complete repair');

      const data = await response.json();
      if (data.success) {
        toast.success('Repair completed successfully');
        fetchBreakdowns();
        fetchStats();
        
        // Create MWO locally for display
        const breakdown = records.find(r => r._id === id);
        if (breakdown) {
          const mwo: MaintenanceWorkOrder = {
            id: uuidv4(),
            breakdownId: id,
            equipmentCode: breakdown.equipmentCode,
            technician: breakdown.assignedTo,
            startDate: breakdown.startRepair || breakdown.assignDate || breakdown.reportDate,
            endDate: new Date().toISOString(),
            totalDowntimeMinutes: breakdown.downtimeMinutes,
            totalRepairCost: breakdown.repairCost,
            rca: breakdown.rca,
            status: "Closed",
            createdAt: new Date().toISOString(),
          };
          setMwos((prevMwos) => [mwo, ...prevMwos]);
          toast.success("Work Order created");
        }
      }
    } catch (error) {
      console.error('Error completing repair:', error);
      toast.error('Failed to complete repair');
    }
  }

  /* -----------------------
     Helper Functions
  ----------------------- */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  };

  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handlePriorityFilterChange = (val: string) => {
    setPriorityFilter(val);
    setPage(1);
  };

  const getLocationName = (locData: string | { _id: string; name: string } | undefined) => {
    if (!locData) return "N/A";
    if (typeof locData === 'object' && locData.name) return locData.name;
    const found = locations.find((l) => l._id === locData);
    return found ? found.name : "Unknown Location";
  };

  /* -----------------------
     Metrics & charts
  ----------------------- */
  const mttr = stats.mttr;
  const mtbf = useMemo(() => {
    const byEquip: Record<string, string[]> = {};
    records.forEach((r) => {
      if (!byEquip[r.equipmentCode]) byEquip[r.equipmentCode] = [];
      byEquip[r.equipmentCode].push(r.reportDate);
    });
    let intervalsInDays: number[] = [];
    Object.values(byEquip).forEach((dates) => {
      const sorted = dates.map((d) => new Date(d).getTime()).sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        const diffDays = (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
        intervalsInDays.push(diffDays);
      }
    });
    if (intervalsInDays.length === 0) return 0;
    const avg = intervalsInDays.reduce((s, v) => s + v, 0) / intervalsInDays.length;
    return +avg.toFixed(2);
  }, [records]);

  const downtimeChart = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      map[r.equipmentCode] = (map[r.equipmentCode] || 0) + (r.downtimeMinutes || 0);
    });
    return Object.entries(map).map(([equipment, downtimeMinutes]) => ({
      equipment,
      downtimeHours: +(downtimeMinutes / 60).toFixed(2),
      downtimeMinutes,
    }));
  }, [records]);

  const failureCountChart = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      map[r.equipmentCode] = (map[r.equipmentCode] || 0) + 1;
    });
    return Object.entries(map).map(([equipment, count]) => ({ equipment, count }));
  }, [records]);

  /* -----------------------
     Export / Import
  ----------------------- */
  function exportJSON() {
    const payload = JSON.stringify(records, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `breakdown_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  }

  function importJSON(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data)) throw new Error("Invalid file");
        // Note: This is just for backup display, actual import would need API integration
        toast.success("Import preview loaded (display only)");
      } catch (err) {
        toast.error("Import failed: invalid file");
      }
    };
    reader.readAsText(file);
  }

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

  /* -----------------------
     Attachments utils
  ----------------------- */
  function viewAttachment(a: Attachment) {
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Popup blocked");
      return;
    }
    w.document.write(`<title>${a.name}</title>`);
    if (a.type.startsWith("image/")) {
      w.document.write(`<img src="${a.dataUrl}" style="max-width:100%;height:auto" />`);
    } else if (a.type === "application/pdf") {
      w.document.write(`<iframe src="${a.dataUrl}" style="width:100%;height:100vh;border:none"></iframe>`);
    } else {
      const link = document.createElement("a");
      link.href = a.dataUrl;
      link.download = a.name;
      link.click();
      w.close();
    }
  }

  function downloadAttachment(a: Attachment) {
    const link = document.createElement("a");
    link.href = a.dataUrl;
    link.download = a.name;
    link.click();
  }

  function formatMinutes(min?: number) {
    if (!min || min <= 0) return "--";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  }

  /* -----------------------
     Calendar logic (full month navigation)
  ----------------------- */
  function prevMonth() {
    setCurrentMonth((m) => subMonths(m, 1));
  }
  function nextMonth() {
    setCurrentMonth((m) => addMonths(m, 1));
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // produce array of days to render
  const calendarRows = useMemo(() => {
    const rows: Date[][] = [];
    let cur = startDate;
    while (cur <= endDate) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(cur);
        cur = addDays(cur, 1);
      }
      rows.push(week);
    }
    return rows;
  }, [startDate, endDate]);

  // group breakdowns by date string (yyyy-MM-dd)
  const byDate = useMemo(() => {
    const map: Record<string, Breakdown[]> = {};
    records.forEach((r) => {
      const day = format(parseISO(r.reportDate), "yyyy-MM-dd");
      if (!map[day]) map[day] = [];
      map[day].push(r);
    });
    return map;
  }, [records]);

  // determine color class for a breakdown
  function statusColorClass(r: Breakdown) {
    if (r.status === "Completed") return "bg-green-100 text-green-800";
    const reportDate = r.reportDate ? parseISO(r.reportDate) : parseISO(r.createdAt);
    const daysOld = differenceInDays(new Date(), reportDate);
    if (daysOld > 7 && !["Completed", "Cancelled"].includes(r.status)) return "bg-red-100 text-red-800"; // overdue heuristic
    return "bg-blue-100 text-blue-800";
  }

  /* -----------------------
     Last 5 MWOs
  ----------------------- */
  const last5Mwos = useMemo(() => mwos.slice(0, 5), [mwos]);

  /* -----------------------
     Render
  ----------------------- */
  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertCircle className="h-6 w-6" /> Breakdown & Corrective Maintenance
        </h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => document.getElementById("import-breakdown")?.click()}>
            <UploadCloud className="mr-2 h-4 w-4" /> Import
          </Button>
          <input id="import-breakdown" type="file" accept="application/json" className="hidden" onChange={(e) => importJSON(e.target.files?.[0] || null)} />

          <Button variant="outline" onClick={exportJSON}>
            <DownloadCloud className="mr-2 h-4 w-4" /> Export
          </Button>

          <Button variant="ghost" onClick={() => setViewMode(viewMode === "table" ? "calendar" : "table")}>
            <CalendarDays className="mr-2 h-4 w-4" /> {viewMode === "table" ? "Calendar View" : "Table View"}
          </Button>

          {canCreate && (
            <Button onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" /> New Report
            </Button>
          )}
        </div>
      </div>

      {/* top KPIs + last MWOs */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">Total Breakdowns</h3><div className="text-2xl font-bold">{stats.totalBreakdowns}</div></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">Open / In Progress</h3><div className="text-2xl font-bold">{stats.openBreakdowns}</div></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">MTTR (mins)</h3><div className="text-2xl font-bold">{mttr}</div></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">MTBF (days)</h3><div className="text-2xl font-bold">{mtbf}</div></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><h3 className="text-sm text-gray-500">Total Downtime (hrs)</h3><div className="text-2xl font-bold">{stats.totalDowntimeHours}</div></CardContent></Card>
        <Card>
          <CardHeader><CardTitle>Last 5 MWOs</CardTitle></CardHeader>
          <CardContent>
            {last5Mwos.length === 0 ? <div className="text-sm text-muted-foreground">No MWOs yet</div> : (
              <ul className="space-y-2 text-sm">
                {last5Mwos.map((m) => (
                  <li key={m.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{m.equipmentCode}</div>
                      <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">₹{(m.totalRepairCost||0).toFixed(0)}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Downtime (hours) per Equipment</CardTitle></CardHeader>
          <CardContent>
            {downtimeChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={downtimeChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="equipment" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="downtimeHours" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="text-sm text-muted-foreground">No data yet</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Failures Count per Equipment</CardTitle></CardHeader>
          <CardContent>
            {failureCountChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={failureCountChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="equipment" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="text-sm text-muted-foreground">No data yet</div>}
          </CardContent>
        </Card>
      </div>

      {/* main content: table or calendar */}
      {viewMode === "table" ? (
        <>
          {/* Search + Filter */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search equipment, reporter, technician..."
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
                <SelectItem value="Reported">Reported</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
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

          <Card>
            <CardHeader><CardTitle>Breakdown Records ({totalBreakdowns})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reported</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Downtime</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-3">
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
                        <TableCell colSpan={8} className="text-center py-6">
                          No breakdown records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell>{new Date(r.reportDate).toLocaleString()}</TableCell>
                          <TableCell>{r.equipmentCode}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {getLocationName(r.location)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              r.priority === "Critical" ? "bg-red-100 text-red-800" :
                              r.priority === "High" ? "bg-orange-100 text-orange-800" :
                              r.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                              "bg-green-100 text-green-800"
                            }`}>
                              {r.priority}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              r.status === "Completed" ? "bg-green-100 text-green-800" :
                              r.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                              r.status === "Assigned" ? "bg-yellow-100 text-yellow-800" :
                              r.status === "Cancelled" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {r.status}
                            </span>
                          </TableCell>
                          <TableCell>{formatMinutes(r.downtimeMinutes)}</TableCell>
                          <TableCell>₹{(r.repairCost||0).toFixed(0)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {canEdit && (
                                <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => {
                                if (r.status === "Assigned") startRepair(r._id);
                                else if (r.status === "In Progress") completeRepair(r._id, 0, r.rca || "");
                                else if (r.status === "Reported") assignTo(r._id, "TechName");
                                else openEdit(r);
                              }}>
                                <Wrench className="w-4 h-4" />
                              </Button>
                              {canDelete && (
                                <Button size="sm" variant="ghost" onClick={() => removeRecord(r._id)}>
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
            </CardContent>

            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} (Total: {totalBreakdowns})
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div>
          {/* month nav */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={prevMonth}><ChevronLeft /></Button>
              <div className="font-medium">{format(currentMonth, "MMMM yyyy")}</div>
              <Button variant="ghost" onClick={nextMonth}><ChevronRight /></Button>
            </div>
            <div className="text-sm text-muted-foreground">Click a breakdown to edit</div>
          </div>

          {/* calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* weekday headers */}
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="text-xs font-medium text-center">{d}</div>
            ))}

            {calendarRows.map((week, wi) => (
              <React.Fragment key={wi}>
                {week.map((day) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  const items = byDate[dayKey] || [];
                  return (
                    <div
                      key={dayKey}
                      className={`min-h-[88px] border rounded p-2 text-xs ${isSameMonth(day, currentMonth) ? "" : "bg-gray-50 text-muted-foreground"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`text-sm font-semibold ${isSameDay(day, new Date()) ? "underline" : ""}`}>{format(day, "d")}</div>
                        <div className="text-[10px] text-muted-foreground">{format(day, "MMM")}</div>
                      </div>

                      <div className="mt-2 space-y-1 overflow-hidden">
                        {items.slice(0, 4).map((r) => (
                          <button
                            key={r._id}
                            onClick={() => openEdit(r)}
                            className={`w-full text-left truncate px-1 py-0.5 rounded ${statusColorClass(r)}`}
                            title={`${r.equipmentCode} — ${r.failureDescription}`}
                          >
                            <div className="text-[11px] font-medium">{r.equipmentCode}</div>
                            <div className="text-[10px]">{r.priority}</div>
                          </button>
                        ))}

                        {items.length > 4 && (
                          <div className="text-[11px] mt-1 text-muted-foreground">+{items.length - 4} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Breakdown" : "New Breakdown Report"}</DialogTitle></DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Equipment Code *</Label>
              <Input value={form.equipmentCode || ""} onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Reported By *</Label>
              <Input value={form.reportedBy || ""} onChange={(e) => setForm({ ...form, reportedBy: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Report Date</Label>
              <Input type="datetime-local" value={(form.reportDate || "").slice(0, 16)} onChange={(e) => setForm({ ...form, reportDate: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <select className="border rounded px-2 py-2 w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Failure Description *</Label>
              <Input value={form.failureDescription || ""} onChange={(e) => setForm({ ...form, failureDescription: e.target.value })} />
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <Label>Location *</Label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 disabled:opacity-75 disabled:cursor-not-allowed"
                value={typeof form.location === 'object' ? form.location._id : (form.location || "")}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                disabled={isLocationRestricted}
                required
              >
                {!isLocationRestricted && <option value="">Select Location</option>}
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              {isLocationRestricted && (
                <p className="mt-1 text-xs text-gray-500">
                  *Location is fixed based on your permissions.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assign To (Technician)</Label>
              <Input value={form.assignedTo || ""} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Estimated Repair Cost</Label>
              <Input type="number" value={form.repairCost || 0} onChange={(e) => setForm({ ...form, repairCost: Number(e.target.value) })} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>RCA / Notes</Label>
              <Input value={form.rca || ""} onChange={(e) => setForm({ ...form, rca: e.target.value })} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Attachments (photos, reports)</Label>
              <input type="file" multiple onChange={(e) => handleAttachments(e.target.files)} />
              <div className="flex gap-2 flex-wrap mt-2">
                {(form.attachments || []).map((a) => (
                  <div key={a.id} className="border rounded px-2 py-1 text-xs flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{a.name}</span>
                    <button onClick={() => viewAttachment(a)} className="text-xs ml-2" title="View"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => downloadAttachment(a)} className="text-xs" title="Download"><Download className="w-4 h-4" /></button>
                    <button onClick={() => removeAttachment(a.id)} className="text-xs text-red-500">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveForm}><FilePlus className="mr-2 h-4 w-4" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
