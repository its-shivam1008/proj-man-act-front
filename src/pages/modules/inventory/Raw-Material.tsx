import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as XLSX from 'xlsx';
import { Upload, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";

import {
  fetchMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
} from "@/redux/slices/rawmaterialSlice";

import { fetchInventoryMaster } from "@/redux/slices/inventoryMasterSlice";
import { createMovement } from "@/redux/slices/materialMovementSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { fetchWarehouses } from "@/redux/slices/warehouseSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
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
import { Label } from "@/components/ui/label";
import { Eye, Edit, Trash2, Plus, Warehouse, ShieldAlert, Package, ChevronDown, ChevronUp, History } from "lucide-react";

import { RawMaterial } from "@/redux/slices/rawmaterialSlice";
import { BASE_URL } from "@/utils/constants";
import { toast } from "sonner";


export default function RawMaterialMaster() {

  const getTotalQuantity = (material: any) => {
    // 🚀 Use the backend-calculated quantity (which is calculated from FIFO remainingQuantity)
    // The backend service already calculates this from stocks.remainingQuantity
    console.log(`📊 Material ${material.name}: backend quantity=${material.quantity}`, material);
    return material.quantity || 0;
  };

  const getAvgCost = (material: any) => {
    // 🚀 FIFO: Calculate weighted average cost based on remaining quantities
    if (Array.isArray(material.stocks) && material.stocks.length > 0) {
      const stocksWithQuantity = material.stocks.filter((s: any) => s.remainingQuantity > 0);

      if (stocksWithQuantity.length === 0) return 0;

      const totalValue = stocksWithQuantity.reduce((sum: number, stock: any) =>
        sum + ((stock.remainingQuantity || 0) * (stock.unitCost || 0)), 0
      );
      const totalQuantity = stocksWithQuantity.reduce((sum: number, stock: any) =>
        sum + (stock.remainingQuantity || 0), 0
      );

      return totalQuantity > 0 ? (totalValue / totalQuantity).toFixed(2) : 0;
    }
    return material.unitCost || 0;
  };


  const [page, setPage] = useState(1);
  const limit = 10;
  const hasPrev = page > 1;

  // Purchase History State
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<{ [key: string]: any[] }>({});
  const [loadingHistory, setLoadingHistory] = useState<{ [key: string]: boolean }>({});

  // Warehouse Dialog State
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [selectedMaterialForWarehouses, setSelectedMaterialForWarehouses] = useState<any>(null);
  const canView = usePermission("rawMaterials", "view");
  const canCreate = usePermission("rawMaterials", "create");
  const canEdit = usePermission("rawMaterials", "edit");
  const canDelete = usePermission("rawMaterials", "delete");
  const dispatch = useDispatch<any>();

  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);
  const { warehouses } = useSelector((state: RootState) => state.warehouse);

  const validUoMs = ['kg', 'gm', 'mg', 'km', 'meter', 'liter', 'ml', 'pcs'];

  // [!code ++] State
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<{
    total: number; success: number; failed: number; errors: string[];
  } | null>(null);

  // [!code ++] Handler
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let failCount = 0;
        const errorLog: string[] = [];

        for (const [index, row] of data.entries()) {
          const rowNum = index + 2;
          try {
            // 1. Basic Validation
            if (!row["Name"]) throw new Error("Missing Name");

            // 2. Validate UoM
            const uom = row["Unit of measure"]?.toLowerCase()?.trim();
            if (!validUoMs.includes(uom)) {
              throw new Error(`Invalid Unit of Measure: '${row["Unit of measure"]}'. Allowed: ${validUoMs.join(', ')}`);
            }

            // 3. Validate Warehouse
            const excelWarehouse = row["Warehouse"]?.trim();
            const warehouseMatch = warehouses.find(
              (w: any) => w.name.toLowerCase() === excelWarehouse?.toLowerCase()
            );
            
            if (excelWarehouse && !warehouseMatch) {
              throw new Error(`Warehouse '${excelWarehouse}' not found.`);
            }
            if (!excelWarehouse && !warehouses[0]) {
               throw new Error(`No Warehouse specified and no default available.`);
            }

            // 4. Construct Payload (Matching onSubmit logic)
            const warehouseId = warehouseMatch?._id || warehouses[0]?._id;
            const quantity = Number(row["Quantity"] || 0);
            const unitCost = Number(row["Unit Cost"] || 0);

            const payload: any = {
              organisationId: localStorage.getItem("organisationId"),
              name: row["Name"],
              itemCode: row["Item code"] || "",
              unitOfMeasure: uom,
              hsn: row["HSN"] || "",
              gstPercent: Number(row["GST"] || 0),
              valuationMethod: "FIFO",
              trackInventory: true,
              reorderLevel: 0,
              
              // Raw Material specific structure for Stocks
              stocks: quantity > 0 ? [{
                warehouseId: warehouseId,
                quantity: quantity,
                unitCost: unitCost
              }] : []
            };

            // 5. Dispatch
            await dispatch(addMaterial(payload)).unwrap();
            successCount++;

          } catch (err: any) {
            failCount++;
            errorLog.push(`Row ${rowNum} (${row["Name"] || "Unknown"}): ${err.message}`);
          }
        }

        setImportReport({
          total: data.length,
          success: successCount,
          failed: failCount,
          errors: errorLog
        });

      } catch (error) {
        toast.error("Failed to parse Excel file");
      } finally {
        setIsImporting(false);
        e.target.value = "";
        dispatch(fetchMaterials({ page, limit }));
      }
    };
    reader.readAsBinaryString(file);
  };

  const getLocationName = (loc: string | { name: string } | undefined) => {
    if (!loc) return "N/A";
    if (typeof loc === 'object') return loc.name || "N/A";
    const found = locations.find((l: any) => l._id === loc);
    return found ? found.name : loc;
  };

  const getWarehouseName = (warehouseId: string | { name: string } | undefined) => {
    if (!warehouseId) return "N/A";
    if (typeof warehouseId === 'object') return warehouseId.name || "N/A";
    const found = warehouses.find((w: any) => w._id === warehouseId);
    return found ? found.name : "N/A";
  };
  // Fetch purchase history for a material
  const fetchPurchaseHistory = async (materialId: string, forceRefresh = false) => {
    setLoadingHistory(prev => ({ ...prev, [materialId]: true }));

    try {
      console.log(`🔍 Fetching FIFO stock summary for material: ${materialId}`);
      const organisationId = localStorage.getItem('organisationId');

      // First try to get FIFO stock summary which includes actual consumption data
      const fifoResponse = await fetch(`${BASE_URL}/fifo/stock-summary/${materialId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (fifoResponse.ok) {
        const fifoData = await fifoResponse.json();

        if (fifoData.success && fifoData.data.batches) {
          const batches = fifoData.data.batches;
          console.log(`📦 Found ${batches.length} FIFO batches for material ${materialId}`, batches);

          // Convert FIFO batches to purchase history format with actual progress data
          const purchaseHistoryWithProgress = batches.map((batch: any) => ({
            _id: batch.batchId,
            movementDate: batch.purchaseDate,
            quantity: batch.originalQuantity || batch.quantity, // Original purchased quantity
            remainingQuantity: batch.quantity, // Current remaining quantity
            originalQuantity: batch.originalQuantity || batch.quantity, // Store original for progress calculation
            consumedQuantity: batch.consumedQuantity || 0, // How much has been consumed
            progressPercentage: batch.progressPercentage || 0, // Use FIFO service calculation
            unitCost: batch.unitCost,
            totalCost: (batch.originalQuantity || batch.quantity) * batch.unitCost,
            source: 'Purchase Order',
            referenceNumber: batch.batchId,
            remarks: `FIFO Batch - ${batch.warehouseName || 'Warehouse'}`,
            unit: batch.unit || 'units'
          }));

          // Sort by purchase date (oldest first for FIFO order)
          const sortedHistory = purchaseHistoryWithProgress.sort((a: any, b: any) =>
            new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime()
          );

          setPurchaseHistory(prev => ({
            ...prev,
            [materialId]: sortedHistory
          }));

          if (forceRefresh) {
            toast.success(`FIFO stock summary refreshed! Found ${sortedHistory.length} batches.`);
          }
        } else {
          // Fallback to material movements if no FIFO data
          await fetchMovementHistory(materialId, forceRefresh);
        }
      } else {
        // Fallback to material movements if FIFO API fails
        await fetchMovementHistory(materialId, forceRefresh);
      }
    } catch (error) {
      console.error('Error fetching FIFO stock summary:', error);
      // Fallback to material movements
      await fetchMovementHistory(materialId, forceRefresh);
    } finally {
      setLoadingHistory(prev => ({ ...prev, [materialId]: false }));
    }
  };

  // Fallback function to fetch from material movements
  const fetchMovementHistory = async (materialId: string, forceRefresh = false) => {
    try {
      console.log(`📦 Fallback: Fetching material movements for ${materialId}`);
      const organisationId = localStorage.getItem('organisationId');

      const response = await fetch(`${BASE_URL}/material-movements?organisationId=${organisationId}&materialId=${materialId}&movementType=inbound&source=Purchase Order`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const movements = data.data || [];

        console.log(`📦 Found ${movements.length} purchase movements for material ${materialId}`);

        // Add default progress data for movements (no FIFO data available)
        const movementsWithProgress = movements.map((movement: any) => ({
          ...movement,
          remainingQuantity: movement.quantity, // Assume fully available if no FIFO data
          originalQuantity: movement.quantity,
          consumedQuantity: 0,
          progressPercentage: 0 // No consumption data available
        }));

        // Sort by date (oldest first for FIFO order)
        const sortedMovements = movementsWithProgress.sort((a: any, b: any) =>
          new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime()
        );

        setPurchaseHistory(prev => ({
          ...prev,
          [materialId]: sortedMovements
        }));

        if (forceRefresh) {
          toast.success(`Purchase history refreshed! Found ${sortedMovements.length} purchases.`);
        }
      } else {
        console.error('Failed to fetch material movements');
        setPurchaseHistory(prev => ({
          ...prev,
          [materialId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching material movements:', error);
      setPurchaseHistory(prev => ({
        ...prev,
        [materialId]: []
      }));
    }
  };



  // Toggle purchase history dropdown
  const togglePurchaseHistory = (materialId: string) => {
    if (expandedMaterial === materialId) {
      setExpandedMaterial(null);
    } else {
      setExpandedMaterial(materialId);
      if (!purchaseHistory[materialId]) {
        fetchPurchaseHistory(materialId);
      }
    }
  };

  const getWarehouseNames = (material: any) => {
    if (!material.stocks || material.stocks.length === 0) return "N/A";

    // Get unique warehouse names
    const uniqueWarehouses = [...new Set(
      material.stocks
        .map((s: any) => getWarehouseName(s.warehouseId))
        .filter((name: string) => name !== "N/A")
    )];

    return uniqueWarehouses.length > 0 ? uniqueWarehouses.join(", ") : "N/A";
  };

  // Get detailed warehouse info for a material
  const getWarehouseDetails = (material: any) => {
    if (!material.stocks || material.stocks.length === 0) return [];

    const warehouseMap = new Map();

    material.stocks.forEach((stock: any) => {
      const warehouseName = getWarehouseName(stock.warehouseId);
      if (warehouseName !== "N/A") {
        if (warehouseMap.has(warehouseName)) {
          warehouseMap.get(warehouseName).quantity += (stock.remainingQuantity || 0);
        } else {
          warehouseMap.set(warehouseName, {
            name: warehouseName,
            quantity: stock.remainingQuantity || 0,
            unit: material.unitOfMeasure
          });
        }
      }
    });

    return Array.from(warehouseMap.values());
  };

  // Function to get all warehouses where a material is available
  const getWarehousesForMaterial = (materialId: string) => {
    if (!warehouses || warehouses.length === 0) return [];

    const availableWarehouses = warehouses.filter((warehouse: any) => {
      return warehouse.rawMaterials && warehouse.rawMaterials.some((material: any) =>
        material.materialId === materialId && (material.quantity || 0) > 0
      );
    });

    return availableWarehouses;
  };

  // Function to display warehouses for a material
  const displayWarehousesForMaterial = (material: any) => {
    const materialWarehouses = getWarehousesForMaterial(material._id);

    if (materialWarehouses.length === 0) {
      // Fallback to warehouse field or location field for backward compatibility
      return getWarehouseName(material.warehouse || material.location);
    }

    if (materialWarehouses.length === 1) {
      return materialWarehouses[0].name;
    }

    // Multiple warehouses - show all warehouse names
    if (materialWarehouses.length <= 3) {
      // For 3 or fewer warehouses, show vertically
      return (
        <div className="flex flex-col gap-1">
          {materialWarehouses.map((warehouse: any) => (
            <span key={warehouse._id} className="text-sm">
              {warehouse.name}
            </span>
          ))}
        </div>
      );
    } else {
      // For more than 3 warehouses, show as comma-separated to save space
      return (
        <div className="text-sm">
          {materialWarehouses.map(w => w.name).join(', ')}
        </div>
      );
    }
  };

  // Redux State
  const { materials, total, page: currentPage, limit: perPage, loading } =
    useSelector((state: RootState) => state.rawMaterials);
  const hasNext = page * limit < total;
  const [viewItem, setViewItem] = useState<RawMaterial | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);

  const [warehouseFilter, setWarehouseFilter] = useState("all");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<RawMaterial>({
    defaultValues: {
      name: "",
      warehouse: "",
      unitOfMeasure: "",
      valuationMethod: "FIFO",
      quantity: 0,
      unitCost: 0,
      reorderLevel: 0,
      trackInventory: true,
      hsn: "",
    },
  });

  // Get HSN codes from inventory master
  const { hsn: hsnCodes } = useSelector(
    (state: RootState) => state.inventoryMaster
  );

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Reject dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingNotification, setRejectingNotification] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectRemark, setRejectRemark] = useState('');

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const apiUrl = BASE_URL || 'http://localhost:4000';
      const url = `${apiUrl}/notifications/list?destination=inventory.raw-materials&status=unread`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        setNotifications([]);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        const filtered = data.filter((n: any) => n.type === 'rawMaterialPurchase' && n.inviteResponse === 'pending');
        setNotifications(filtered);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handle accept/reject
  const handleMaterialResponse = async (notificationId: string, response: 'accepted' | 'rejected', notification?: any) => {
    try {
      if (response === 'rejected') {
        setRejectingNotification(notification);
        setShowRejectDialog(true);
        return;
      }

      // Validate warehouse before accepting
      if (response === 'accepted' && notification?.materialData && !notification.materialData.warehouse) {
        toast.error('Cannot accept: Warehouse information is missing from purchase order. Please ensure warehouse was selected when creating the purchase order.');
        return;
      }

      const res = await fetch(`${BASE_URL}/purchase/orders/material-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notificationId, response })
      });

      if (res.ok) {
        toast.success('Material purchase accepted successfully');
        fetchNotifications();
        dispatch(fetchMaterials({ page, limit }));
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to accept material purchase');
      }
    } catch (error) {
      console.error('Error responding to material purchase:', error);
      toast.error('Failed to process material purchase response');
    }
  };

  const handleRejectWithReason = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }

    try {
      // Add to scrap orders
      const scrapOrder = {
        productName: rejectingNotification?.materialData?.material || rejectingNotification?.materialData?.product || 'Unknown Material',
        sku: rejectingNotification?.materialData?.itemCode || rejectingNotification?.materialData?.sku || 'N/A',
        quantity: rejectingNotification?.materialData?.quantity || 0,
        stock: 0,
        reason: rejectReason,
        remark: rejectRemark,
        scrapLocation: 'Rejected from Purchase Order - Raw Material',
        category: rejectingNotification?.materialData?.category || 'N/A',
        hsn: rejectingNotification?.materialData?.hsn || 'N/A',
        unitPrice: rejectingNotification?.materialData?.unitPrice || 0,
        rejectedDate: new Date().toISOString(),
        status: 'pending'
      };

      const scrapOrders = JSON.parse(localStorage.getItem('SCRAP_ORDERS') || '[]');
      scrapOrders.unshift(scrapOrder);
      localStorage.setItem('SCRAP_ORDERS', JSON.stringify(scrapOrders));

      const movementData = {
        organisationId: localStorage.getItem("organisationId") || "",
        materialName: scrapOrder.productName,
        movementType: "outbound",
        quantity: scrapOrder.quantity,
        unit: rejectingNotification?.materialData?.unitOfMeasure || "units",
        source: "Purchase Order",
        destination: "Scrap - Rejected",
        referenceNumber: `REJECT-${Date.now()}`,
        remarks: `Rejected: ${rejectReason}. ${rejectRemark}`,
        movementDate: new Date().toISOString().split("T")[0],
        unitCost: scrapOrder.unitPrice,
        totalCost: scrapOrder.unitPrice * scrapOrder.quantity,
        itemType: "material",
      };

      try {
        await dispatch(createMovement(movementData)).unwrap();
        toast.success("Movement created successfully! Check Move Analysis page.");
      } catch (error: any) {
        toast.error(`Failed to create movement: ${error.message || error}`);
      }

      const res = await fetch(`${BASE_URL}/purchase/orders/material-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notificationId: rejectingNotification._id, response: 'rejected' })
      });

      if (res.ok) {
        fetchNotifications();
        dispatch(fetchMaterials({ page, limit }));
        setShowRejectDialog(false);
        setRejectingNotification(null);
        setRejectReason('');
        setRejectRemark('');
        toast.success('Material purchase rejected and added to scrap orders');
      }
    } catch (error) {
      toast.error('Failed to reject material purchase');
    }
  };

  useEffect(() => {
    dispatch(fetchMasterData("location"));
    dispatch(fetchWarehouses(localStorage.getItem("organisationId")));
    dispatch(fetchMaterials({ page, limit }));
    dispatch(fetchInventoryMaster({ type: "hsn", page: 1, limit: 100 }));
    fetchNotifications();
  }, [dispatch, page, limit, warehouseFilter]);

  // Add a refresh function to reload materials with updated FIFO quantities
  const refreshMaterials = () => {
    console.log('🔄 Refreshing materials with updated FIFO quantities...');
    dispatch(fetchMaterials({ page, limit, _refresh: Date.now() })); // Add timestamp to force refresh
    toast.success('Materials refreshed with updated quantities');
  };

  // Ensure default warehouse is set for new entries
  useEffect(() => {
    if (open && !editing && warehouses.length > 0) {
      setValue("warehouse", warehouses[0]._id);
    }
  }, [open, editing, warehouses, setValue]);

  const isSearching = search.trim() !== "";
  const filtered = useMemo(() => {
    return materials.filter((m) => {
      // Search filter
      const matchesSearch =
        !search.trim() ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.itemCode || "").toLowerCase().includes(search.toLowerCase());

      // Warehouse filter
      const matchesWarehouse =
        warehouseFilter === "all"
          ? true
          : Array.isArray(m.stocks) &&
          m.stocks.some(
            (s: any) => String(s.warehouseId) === warehouseFilter
          );

      return matchesSearch && matchesWarehouse;
    });
  }, [materials, search, warehouseFilter]);


  const onSubmit = async (data: RawMaterial) => {
    try {
      const payload: any = {
        ...data,
        organisationId: localStorage.getItem("organisationId"),
      };

      // 🔥 Convert quantity → stocks
      if (data.trackInventory && data.quantity > 0) {
        payload.stocks = [
          {
            warehouseId: data.warehouse,
            quantity: Number(data.quantity),
            unitCost: Number(data.unitCost || 0),
          },
        ];
      } else {
        payload.stocks = [];
      }

      // ❌ Remove legacy fields
      delete payload.quantity;
      delete payload.unitCost;
      delete payload.warehouse;

      if (editing) {
        await dispatch(updateMaterial({ id: editing._id!, data: payload })).unwrap();
        toast.success("Material updated successfully");
      } else {
        await dispatch(addMaterial(payload)).unwrap();
        toast.success("Material created successfully");
      }

      dispatch(fetchMaterials({ page, limit }));
      reset();
      setEditing(null);
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  const startEdit = (it: RawMaterial) => {
    setEditing(it);

    // Prepare form data: safely extract warehouse ID if it's an object, fallback to location for backward compatibility
    const formData = {
      ...it,
      warehouse: it.warehouse
        ? (typeof it.warehouse === 'object' ? (it.warehouse as any)._id : it.warehouse)
        : (typeof it.location === 'object' ? (it.location as any)._id : (it.location || "")),
    };

    reset(formData);
    setOpen(true);
  };

  // [!code ++] New Handler for Add Material
  const handleAdd = () => {
    setEditing(null);
    // Explicitly reset form to empty defaults
    reset({
      name: "",
      warehouse: "",
      unitOfMeasure: "",
      valuationMethod: "FIFO",
      quantity: 0,
      unitCost: 0,
      reorderLevel: 0,
      trackInventory: true,
      hsn: "",
      itemCode: "",
      technicalSpecs: "",
      gstPercent: 0
    });
    setOpen(true);
  };

  const calcStatus = (r: RawMaterial) => {
    if (!r.trackInventory) return <Badge variant="outline">Non-tracked</Badge>;
    const qty = getTotalQuantity(r);

    if (!r.trackInventory) return <Badge variant="outline">Non-tracked</Badge>;
    if (qty === 0) return <Badge variant="destructive">Out of stock</Badge>;
    if (qty <= (r.reorderLevel ?? 0))
      return <Badge className="bg-yellow-500">Low</Badge>;
    return <Badge className="bg-green-600">In stock</Badge>;

    if ((r.quantity ?? 0) <= (r.reorderLevel ?? 0))
      return <Badge className="bg-yellow-500">Low</Badge>;
    return <Badge className="bg-green-600">In stock</Badge>;
  };

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
    <div className="p-6 space-y-6">
      {/* Purchase Notifications */}
      {notifications.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            New Material Purchase Orders ({notifications.length})
          </h3>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification._id} className="bg-white p-4 rounded-lg border border-blue-200 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{notification.materialData?.product}</p>
                  <div className="text-sm text-gray-600 mt-1 grid grid-cols-2 gap-2">
                    <span>Quantity: <strong>{notification.materialData?.quantity}</strong></span>
                    <span>Unit Price: <strong>₹{notification.materialData?.unitPrice}</strong></span>
                    {notification.materialData?.itemCode && (
                      <span>Item Code: <strong>{notification.materialData.itemCode}</strong></span>
                    )}
                    {notification.materialData?.unitOfMeasure && (
                      <span>UoM: <strong>{notification.materialData.unitOfMeasure}</strong></span>
                    )}
                    {notification.materialData?.warehouse ? (
                      <span className="text-green-600">Warehouse: <strong>{getWarehouseName(notification.materialData.warehouse)}</strong></span>
                    ) : (
                      <span className="text-red-600">⚠️ <strong>No Warehouse Selected</strong></span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleMaterialResponse(notification._id, 'accepted', notification)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleMaterialResponse(notification._id, 'rejected', notification)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex gap-2 items-center">
          <Warehouse /> Raw Material / Item Master
        </h1>

        {/* Search + Add Material */}
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select
            value={warehouseFilter}
            onValueChange={setWarehouseFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {warehouses.map((warehouse: any) => (
                <SelectItem key={warehouse._id} value={warehouse._id}>{warehouse.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* [!code ++] Updated Dialog triggering logic */}
          <Dialog
            open={open}
            onOpenChange={setOpen}
          >
            {/* [!code ++] Remove DialogTrigger wrapper and use direct Button */}
            <input
            type="file"
            accept=".xlsx, .xls"
            id="rm-import"
            className="hidden"
            onChange={handleImport}
            disabled={isImporting}
          />

          <label 
            htmlFor="rm-import"
            className={`cursor-pointer bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm font-medium ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
          >
             {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
             Import
          </label>
            <Button disabled={!canCreate} onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add Material
            </Button>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Material" : "Add New Material"}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-2 gap-4 mt-4"
              >
                <div className="col-span-2">
                  <Label>Name</Label>
                  <Input {...register("name", { required: true })} />
                </div>

                <div>
                  <Label>Item Code</Label>
                  <Input {...register("itemCode")} />
                </div>

                <div>
                  <Label>Unit of Measure</Label>
                  <Controller
                    name="unitOfMeasure"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="gm">gm</SelectItem>
                          <SelectItem value="mg">mg</SelectItem>
                          <SelectItem value="km">km</SelectItem>
                          <SelectItem value="meter">meter</SelectItem>
                          <SelectItem value="liter">liter</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="pcs">pcs</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Warehouse</Label>
                  <Controller
                    name="warehouse"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse: any) => (
                            <SelectItem key={warehouse._id} value={warehouse._id}>{warehouse.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label>HSN</Label>
                  <Controller
                    name="hsn"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select HSN Code">
                            {field.value || "Select HSN Code"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {hsnCodes && hsnCodes.length > 0 ? (
                            hsnCodes.map((hsn: any) => (
                              <SelectItem key={hsn._id} value={hsn.hsnNumber}>
                                {hsn.hsnNumber} - {hsn.taxPercent}%
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-3 text-sm text-muted-foreground">
                              No HSN codes available. Add them in Master Data.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label>GST %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("gstPercent")}
                  />
                </div>

                <div>
                  <Label>Valuation Method</Label>
                  <select
                    {...register("valuationMethod")}
                    className="border rounded p-2 w-full"
                  >
                    <option value="FIFO">FIFO</option>
                    <option value="WEIGHTED_AVG">Weighted Avg</option>
                  </select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input type="number" {...register("quantity")} />
                </div>

                <div>
                  <Label>Unit Cost</Label>
                  <Input type="number" {...register("unitCost")} />
                </div>

                <div>
                  <Label>Reorder Level</Label>
                  <Input type="number" {...register("reorderLevel")} />
                </div>

                <div className="col-span-2">
                  <Label>Technical Specs</Label>
                  <Textarea rows={3} {...register("technicalSpecs")} />
                </div>

                <div className="col-span-2 flex justify-end gap-2 mt-4">
                  {/* [!code ++] Fixed Cancel Button: Added type="button" */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset();
                      setEditing(null);
                      setOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{editing ? "Save" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Materials List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {/* <TableHead>Code</TableHead> */}
                <TableHead>Warehouse</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead>Qty</TableHead>
                {/* <TableHead>Cost</TableHead> */}
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((m) => (
                <React.Fragment key={m._id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePurchaseHistory(m._id!)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Purchase History"
                        >
                          {expandedMaterial === m._id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        <span>{m.name}</span>
                      </div>
                    </TableCell>
                    {/* <TableCell>{m.itemCode}</TableCell> */}
                    {/* Display Warehouses */}
                    <TableCell>
                      <button
                        onClick={() => {
                          setSelectedMaterialForWarehouses(m);
                          setWarehouseDialogOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                        title="Click to view warehouse details"
                      >
                        {getWarehouseNames(m)}
                      </button>
                    </TableCell>

                    <TableCell>{m.unitOfMeasure}</TableCell>
                    <TableCell>{getTotalQuantity(m)}</TableCell>
                    {/* <TableCell>₹{getAvgCost(m)}</TableCell> */}

                    <TableCell>{calcStatus(m)}</TableCell>
                    <TableCell className="flex gap-3">
                      <Eye
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => setViewItem(m)}
                      />
                      <button disabled={!canEdit} title="Update">
                        <Edit
                          className="h-4 w-4 cursor-pointer"
                          onClick={() => startEdit(m)}
                        />
                      </button>
                      <button disabled={!canDelete} title="Delete">
                        <Trash2
                          className="h-4 w-4 cursor-pointer text-red-500"
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Are you sure you want to delete "${m.name}"?\nThis action cannot be undone.`
                            );

                            if (!confirmed) return;

                            dispatch(deleteMaterial(m._id!)).then(() => {
                              dispatch(fetchMaterials({ page, limit, warehouse: warehouseFilter })).then(
                                (res: any) => {
                                  const items = res.payload?.materials || [];
                                  if (items.length === 0 && page > 1) {
                                    setPage((p) => p - 1);
                                  }
                                }
                              );
                            });
                          }}


                        />
                      </button>
                    </TableCell>
                  </TableRow>

                  {/* Purchase History Dropdown */}
                  {expandedMaterial === m._id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-gray-50 p-0">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold text-gray-900">Purchase History for {m.name}</h4>
                              </div>
                            </div>
                          </div>

                          {purchaseHistory[m._id!] ? (
                            purchaseHistory[m._id!].length > 0 ? (
                              <div className="bg-white rounded-lg border">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-100">
                                      <TableHead className="text-xs">Date</TableHead>
                                      <TableHead className="text-xs">Quantity</TableHead>
                                      <TableHead className="text-xs">Unit Cost</TableHead>
                                      <TableHead className="text-xs">Total Cost</TableHead>
                                      <TableHead className="text-xs">FIFO Consumption</TableHead>
                                      <TableHead className="text-xs">Source</TableHead>
                                      <TableHead className="text-xs">Reference</TableHead>
                                      <TableHead className="text-xs">Remarks</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {purchaseHistory[m._id!].map((purchase: any, index: number) => {
                                      const progress = (((purchase.originalQuantity || purchase.quantity) - (purchase.remainingQuantity || 0)) / (purchase.originalQuantity || purchase.quantity || 0)) * 100
                                      return (
                                        <TableRow key={purchase._id || index} className="text-sm">
                                          <TableCell className="text-xs">
                                            {purchase.movementDate ?
                                              new Date(purchase.movementDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                              }) : 'N/A'
                                            }
                                          </TableCell>
                                          <TableCell className="text-xs font-medium">
                                            {purchase.quantity} {purchase.unit}
                                          </TableCell>
                                          <TableCell className="text-xs">
                                            ₹{purchase.unitCost || 0}
                                          </TableCell>
                                          <TableCell className="text-xs font-medium">
                                            ₹{purchase.totalCost || 0}
                                          </TableCell>
                                          <TableCell className="text-xs">
                                            <div className="space-y-1">
                                              <div className="flex justify-between text-xs">
                                                <span>Used: {(purchase.originalQuantity || purchase.quantity) - (purchase.remainingQuantity || 0)}</span>
                                                <span>Left: {purchase.remainingQuantity || 0}</span>
                                              </div>
                                              <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                  className={`h-2 rounded-full ${progress >= 100 ? 'bg-red-500' :
                                                    progress >= 75 ? 'bg-orange-500' :
                                                      progress >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}
                                                  style={{
                                                    width: `${Math.min(progress || 0, 100)}%`
                                                  }}
                                                ></div>
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                {(progress || 0).toFixed(1)}% consumed
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-xs">
                                            {purchase.source || 'Purchase Order'}
                                          </TableCell>
                                          <TableCell className="text-xs">
                                            {purchase.referenceNumber || 'N/A'}
                                          </TableCell>
                                          <TableCell className="text-xs">
                                            {purchase.remarks || 'Material purchase'}
                                          </TableCell>
                                        </TableRow>)
                                    })}
                                  </TableBody>
                                </Table>

                                {/* Summary */}
                                <div className="p-3 bg-blue-50 border-t">
                                  <div className="grid grid-cols-2 gap-6 text-sm">
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-gray-600">Total Purchases:</span>
                                        <span className="ml-2 font-semibold">{purchaseHistory[m._id!].length}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Total Purchased:</span>
                                        <span className="ml-2 font-semibold">
                                          {purchaseHistory[m._id!].reduce((sum: number, p: any) => sum + (p.originalQuantity || p.quantity || 0), 0)} {m.unitOfMeasure}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Total Value:</span>
                                        <span className="ml-2 font-semibold">
                                          ₹{purchaseHistory[m._id!].reduce((sum: number, p: any) => sum + (p.totalCost || 0), 0)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-gray-600">Total Consumed:</span>
                                        <span className="ml-2 font-semibold text-red-600">
                                          {purchaseHistory[m._id!].reduce((sum: number, p: any) => sum + ((p.originalQuantity || p.quantity || 0) - (p.remainingQuantity || 0)), 0)} {m.unitOfMeasure}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Remaining Stock:</span>
                                        <span className="ml-2 font-semibold text-green-600">
                                          {purchaseHistory[m._id!].reduce((sum: number, p: any) => sum + (p.remainingQuantity || 0), 0)} {m.unitOfMeasure}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Consumption Rate:</span>
                                        <span className="ml-2 font-semibold text-blue-600">
                                          {(() => {
                                            const totalPurchased = purchaseHistory[m._id!].reduce((sum: number, p: any) => sum + (p.originalQuantity || p.quantity || 0), 0);
                                            const totalConsumed = purchaseHistory[m._id!].reduce((sum: number, p: any) => sum + ((p.originalQuantity || p.quantity || 0) - (p.remainingQuantity || 0)), 0);
                                            return totalPurchased > 0 ? ((totalConsumed / totalPurchased) * 100).toFixed(1) : '0.0';
                                          })()}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p>No purchase history found for this material</p>
                              </div>
                            )
                          ) : (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="text-gray-500 mt-2">Loading purchase history...</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-xl shadow">
            <button
              disabled={!hasPrev}
              onClick={() => setPage((prev) => prev - 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span>Page {page}</span>

            <button
              disabled={!hasNext}
              onClick={() => setPage((prev) => prev + 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* View Modal */}
          <Dialog
            open={!!viewItem}
            onOpenChange={(o) => !o && setViewItem(null)}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Material Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <p><strong>Name:</strong> {viewItem?.name}</p>
                <p><strong>Item Code:</strong> {viewItem?.itemCode}</p>
                {/* Show Warehouses */}
                <p><strong>Warehouses:</strong> {viewItem ? (() => {
                  const warehouses = getWarehousesForMaterial(viewItem._id || '');
                  if (warehouses.length === 0) {
                    return getWarehouseName(viewItem.warehouse || viewItem.location);
                  }
                  return warehouses.map(w => w.name).join(', ');
                })() : 'N/A'}</p>
                <p><strong>Unit:</strong> {viewItem?.unitOfMeasure}</p>
                <p><strong>Qty:</strong> {viewItem?.quantity}</p>
                <p><strong>Cost:</strong> ₹{viewItem?.unitCost}</p>
                <p><strong>HSN:</strong> {viewItem?.hsn}</p>
                <p><strong>GST %:</strong> {viewItem?.gstPercent}</p>
                <p><strong>Valuation:</strong> {viewItem?.valuationMethod}</p>
                <p><strong>Reorder Level:</strong> {viewItem?.reorderLevel}</p>
                <p><strong>Technical Specs:</strong> {viewItem?.technicalSpecs}</p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Warehouse Details Dialog */}
      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Warehouse Details</DialogTitle>
          </DialogHeader>

          {selectedMaterialForWarehouses && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Material: <strong>{selectedMaterialForWarehouses.name}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Total Quantity: <strong>{getTotalQuantity(selectedMaterialForWarehouses)} {selectedMaterialForWarehouses.unitOfMeasure}</strong>
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Warehouse Distribution:</h4>
                <div className="space-y-2">
                  {getWarehouseDetails(selectedMaterialForWarehouses).map((warehouse: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{warehouse.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          {warehouse.quantity} {warehouse.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {getWarehouseDetails(selectedMaterialForWarehouses).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Warehouse className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No warehouse data available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setWarehouseDialogOpen(false);
                setSelectedMaterialForWarehouses(null);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      {showRejectDialog && rejectingNotification && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Material Purchase</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Material: <strong>{rejectingNotification.materialData?.material}</strong></p>
                <p className="text-sm text-gray-600">Quantity: <strong>{rejectingNotification.materialData?.quantity}</strong></p>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Rejection *</Label>
                <Select
                  value={rejectReason}
                  onValueChange={(value) => setRejectReason(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="obsolete">Obsolete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="remark">Additional Remark</Label>
                <Textarea
                  id="remark"
                  rows={3}
                  value={rejectRemark}
                  onChange={(e) => setRejectRemark(e.target.value)}
                  placeholder="Any additional details..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectingNotification(null);
                  setRejectReason('');
                  setRejectRemark('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectWithReason}
              >
                Reject & Add to Scrap
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {importReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Upload className="h-5 w-5" /> Import Results
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importReport.total}</div>
                  <div className="text-xs text-gray-600">Total Rows</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importReport.success}</div>
                  <div className="text-xs text-gray-600">Success</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importReport.failed}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>

              {importReport.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Failed Rows
                  </h4>
                  <div className="bg-red-50 p-3 rounded-lg max-h-60 overflow-y-auto text-sm space-y-2 border border-red-100">
                    {importReport.errors.map((err, i) => (
                      <div key={i} className="text-red-700 border-b border-red-100 last:border-0 pb-1">
                        • {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setImportReport(null)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}