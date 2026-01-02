import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermission } from "@/hooks/userPermission";
import { BASE_URL } from "@/utils/constants";
import {
  ScanLine,
  Plus,
  CheckCircle,
  AlertTriangle,
  X,
  Edit,
  Trash2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  Barcode as BarcodeIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

/* ================= TYPES ================= */

interface BarcodeScan {
  _id: string;
  organisationId: string;
  location: { _id: string; name: string } | string;
  code: string;
  item: string;
  action:
    | "Stock Update"
    | "Inventory Check"
    | "Shipping"
    | "Quality Check"
    | "Maintenance"
    | "Barcode Generated";
  status: "success" | "warning" | "error";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ================= COMPONENT ================= */

const Barcode: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);

  const canView = usePermission("barcode", "view");
  const canCreate = usePermission("barcode", "create");
  const canEdit = usePermission("barcode", "edit");
  const canDelete = usePermission("barcode", "delete");

  /* ================= STATE ================= */

  const [scans, setScans] = useState<BarcodeScan[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const debouncedSearch = useDebounce(query, 500);

  const [locationFilter, setLocationFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  const organisationId = localStorage.getItem("organisationId");

  const isLocationRestricted =
    userProfile?.role !== "admin" && !!userProfile?.location;

  /* ================= SCAN FORM ================= */

  const [scanResult, setScanResult] = useState("");
  const [scanMode, setScanMode] =
    useState<BarcodeScan["action"]>("Stock Update");
  const [scanLocation, setScanLocation] = useState(
    isLocationRestricted ? userProfile?.location || "" : ""
  );

  /* ================= MODALS ================= */

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const [generateForm, setGenerateForm] = useState({
    itemName: "",
    category: "steel",
    location: isLocationRestricted ? userProfile?.location || "" : "",
  });

  const [editingScan, setEditingScan] = useState<BarcodeScan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editForm, setEditForm] = useState({
    code: "",
    item: "",
    action: "Stock Update" as BarcodeScan["action"],
    status: "success" as BarcodeScan["status"],
    location: "",
  });

  /* ================= STATS ================= */

  // Calculate stats from scans data
  const calculatedStats = useMemo(() => {
    return {
      totalScans: scans.length,
      inventoryUpdates: scans.filter(scan => 
        scan.action === 'Stock Update' || scan.action === 'Inventory Check'
      ).length,
      shippingScans: scans.filter(scan => scan.action === 'Shipping').length,
      qualityChecks: scans.filter(scan => scan.action === 'Quality Check').length,
      successfulScans: scans.filter(scan => scan.status === 'success').length,
      warningScans: scans.filter(scan => scan.status === 'warning').length,
      errorScans: scans.filter(scan => scan.status === 'error').length,
    };
  }, [scans]);

  const [stats, setStats] = useState({
    totalScans: 0,
    inventoryUpdates: 0,
    shippingScans: 0,
    qualityChecks: 0,
    successfulScans: 0,
    warningScans: 0,
    errorScans: 0,
  });

  /* ================= EFFECTS ================= */

  useEffect(() => {
    dispatch(fetchMasterData("location"));
  }, [dispatch]);

  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
      setScanLocation(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  useEffect(() => {
    if (organisationId) {
      fetchScans();
      fetchStats();
    }
  }, [
    organisationId,
    page,
    actionFilter,
    statusFilter,
    debouncedSearch,
    locationFilter,
  ]);

  /* ================= API ================= */

  const fetchScans = async () => {
    try {
      setLoading(true);

      const resolvedLocation =
        locationFilter === "all" ? undefined : locationFilter;

      const params = new URLSearchParams({
        organisationId: organisationId!,
        page: page.toString(),
        limit: limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(resolvedLocation && { location: resolvedLocation }),
        ...(actionFilter !== "all" && { action: actionFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const res = await fetch(
        `${BASE_URL}/barcode-scans/fetch?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setScans(data.data);
        setTotalPages(data.pagination.pages);
        setTotalRecords(data.pagination.total);
      } else {
        toast.error(data.message || "Failed to fetch scans");
      }
    } catch {
      toast.error("Failed to fetch scans");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/barcode-scans/stats?organisationId=${organisationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  };

  /* ================= CRUD ================= */
   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  };
  
  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    setPage(1);
  };

    const handleActionFilterChange = (val: string) => {
    setActionFilter(val);
    setPage(1);
  };
    const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
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

  

  const createScan = async (payload: any) => {
    try {
      const res = await fetch(`${BASE_URL}/barcode-scans/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          organisationId,
          location: isLocationRestricted
            ? userProfile?.location
            : payload.location,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Scan created");
        fetchScans();
        fetchStats();
        return true;
      }
      toast.error(data.message);
      return false;
    } catch {
      toast.error("Failed to create scan");
      return false;
    }
  };
    // Export function
  const exportAll = () => {
    const payload = { 
      scans, 
      exportedAt: new Date().toISOString(),
      totalRecords,
      filters: { locationFilter, actionFilter, statusFilter, query }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode_scans_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  const updateScan = async (id: string, payload: any) => {
    try {
      const res = await fetch(`${BASE_URL}/barcode-scans/update/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Scan updated");
        fetchScans();
        fetchStats();
        setShowEditModal(false);
      } else toast.error(data.message);
    } catch {
      toast.error("Update failed");
    }
  };

  const deleteScan = async (id: string) => {
    if (!confirm("Delete this scan?")) return;
    try {
      await fetch(`${BASE_URL}/barcode-scans/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Deleted");
      fetchScans();
      fetchStats();
    } catch {
      toast.error("Delete failed");
    }
  };

   const handleGenerateBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generateForm.itemName.trim() && generateForm.location) {
      const prefixes = {
        steel: 'SP',
        aluminum: 'AR',
        hydraulic: 'HP',
        electrical: 'EL',
      };
      const prefix = prefixes[generateForm.category as keyof typeof prefixes] || 'UN';
      const year = new Date().getFullYear();
      const number = Math.floor(Math.random() * 1000) + 1;
      const newCode = `${prefix}-${number.toString().padStart(3, '0')}-${year}`;
      
      setGeneratedCode(newCode);
      
      const scanData = {
        code: newCode,
        item: generateForm.itemName,
        action: 'Barcode Generated' as BarcodeScan['action'],
        status: 'success' as BarcodeScan['status'],
        location: generateForm.location
      };
      
      const success = await createScan(scanData);
      if (success) {
        setTimeout(() => {
          setGenerateForm({ 
            itemName: '', 
            category: 'steel', 
            location: isLocationRestricted ? userProfile?.location || '' : '' 
          });
          setGeneratedCode('');
          setShowGenerateModal(false);
        }, 2000);
      }
    } else {
      toast.error("Please fill in all required fields");
    }
    }

  /* ================= HELPERS ================= */
    const handleEdit = (scan: BarcodeScan) => {
    setEditingScan(scan);
    setEditForm({
      code: scan.code,
      item: scan.item,
      action: scan.action,
      status: scan.status,
      location: typeof scan.location === 'string' ? scan.location : scan.location._id
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editingScan) {
      updateScan(editingScan._id, editForm);
    }
  };

  const handleScan = async () => {
    if (!scanResult || !scanLocation) {
      toast.error("Barcode & location required");
      return;
    }

    const ok = await createScan({
      code: scanResult,
      item: "Unknown Item",
      action: scanMode,
      status: "success",
      location: scanLocation,
    });

    if (ok) setScanResult("");
  };

  const handleReprocess = (scan: BarcodeScan) => {
    updateScan(scan._id, { status: "success" });
  };

  /* ================= PERMISSION ================= */
    const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
    const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
    const categories = [
    { value: 'steel', label: 'Steel Products' },
    { value: 'aluminum', label: 'Aluminum Products' },
    { value: 'hydraulic', label: 'Hydraulic Components' },
    { value: 'electrical', label: 'Electrical Parts' },
  ];

  if (!canView) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="mx-auto h-16 w-16 text-red-500" />
        <p className="mt-4 text-lg font-semibold">Access Denied</p>
      </div>
    );
  }

  /* ================= JSX ================= */

  return (
     <div className="space-y-6">
     {/* Header */}
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-gray-900">Barcode Scanner</h1>
            <p className="mt-1 text-sm text-gray-600">
              Scan barcodes for inventory tracking, shipping, and quality control
            </p>
         </div>
         <div className="flex items-center gap-2">
           <button 
              onClick={exportAll}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              Export
            </button>
            {canCreate && (
              <button 
                onClick={() => setShowGenerateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Barcode
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ScanLine className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Scans Today</p>
                  <p className="text-2xl font-semibold text-gray-900">{calculatedStats.totalScans}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Successful Scans</p>
                  <p className="text-2xl font-semibold text-gray-900">{calculatedStats.successfulScans}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Warning Scans</p>
                  <p className="text-2xl font-semibold text-gray-900">{calculatedStats.warningScans}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <X className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Error Scans</p>
                  <p className="text-2xl font-semibold text-gray-900">{calculatedStats.errorScans}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scanner Interface */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <ScanLine className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Camera viewfinder</p>
                <p className="text-xs text-gray-400">Align barcode within the frame</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Scan Mode:</label>
              <select
                value={scanMode}
                onChange={(e) => setScanMode(e.target.value as BarcodeScan['action'])}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Stock Update">Stock Update</option>
                <option value="Inventory Check">Inventory Check</option>
                <option value="Shipping">Shipping</option>
                <option value="Quality Check">Quality Check</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Location:</label>
              <Select 
                value={scanLocation} 
                onValueChange={setScanLocation}
                disabled={isLocationRestricted}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manual Entry
                </label>
                <input
                  type="text"
                  value={scanResult}
                  onChange={(e) => setScanResult(e.target.value)}
                  placeholder="Enter barcode manually..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleScan}
                className="self-end bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Process Scan
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
          <input
            type="text"
            placeholder="Search barcode, item..."
            value={query}
            onChange={handleSearchChange}
            className="flex-1 min-w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <Select 
            disabled={isLocationRestricted} 
            value={locationFilter} 
            onValueChange={handleLocationFilterChange}
          >
            <SelectTrigger className="w-48">
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

          <Select value={actionFilter} onValueChange={handleActionFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="Stock Update">Stock Update</SelectItem>
              <SelectItem value="Inventory Check">Inventory Check</SelectItem>
              <SelectItem value="Shipping">Shipping</SelectItem>
              <SelectItem value="Quality Check">Quality Check</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Barcode Generated">Barcode Generated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recent Scans */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Scans ({totalRecords})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : scans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No scans found
                    </td>
                  </tr>
                ) : (
                  scans.map((scan) => (
                    <tr key={scan._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {scan.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scan.item}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof scan.location === 'string' ? scan.location : scan.location?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scan.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(scan.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(scan.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(scan.status)}`}>
                            {scan.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {canEdit && (
                          <button 
                            onClick={() => handleEdit(scan)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit className="h-4 w-4 inline" /> Edit
                          </button>
                        )}
                        <button 
                          onClick={() => handleReprocess(scan)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Reprocess
                        </button>
                        {canDelete && (
                          <button 
                            onClick={() => deleteScan(scan._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4 inline" /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 p-4 border-t">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages} (Total: {totalRecords})
              </span>
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Generate Barcode Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <BarcodeIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">Generate Barcode</h2>
                  </div>
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleGenerateBarcode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={generateForm.itemName}
                      onChange={(e) => setGenerateForm({ ...generateForm, itemName: e.target.value })}
                      placeholder="e.g., Steel Plates"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={generateForm.category}
                      onChange={(e) => setGenerateForm({ ...generateForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <Select 
                      value={generateForm.location} 
                      onValueChange={(val) => setGenerateForm({ ...generateForm, location: val })}
                      disabled={isLocationRestricted}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc._id} value={loc._id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Generate Barcode
                  </button>
                </form>
                {generatedCode && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">Generated Barcode:</p>
                    <div className="flex items-center justify-between bg-white p-3 rounded border">
                      <span className="font-mono text-lg font-semibold">{generatedCode}</span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Scan Modal */}
        {showEditModal && editingScan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Edit className="h-6 w-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">Edit Scan</h2>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={editForm.code}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={editForm.item}
                      onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Select 
                      value={editForm.location} 
                      onValueChange={(val) => setEditForm({ ...editForm, location: val })}
                      disabled={isLocationRestricted}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc._id} value={loc._id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action
                    </label>
                    <select
                      value={editForm.action}
                      onChange={(e) => setEditForm({ ...editForm, action: e.target.value as BarcodeScan['action'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Stock Update">Stock Update</option>
                      <option value="Inventory Check">Inventory Check</option>
                      <option value="Shipping">Shipping</option>
                      <option value="Quality Check">Quality Check</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Barcode Generated">Barcode Generated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as BarcodeScan['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Barcode;
