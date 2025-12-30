import { usePermission } from "@/hooks/userPermission";
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { Plus, Check, ShieldAlert, MapPin, Search } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area } from "recharts";
import {
  fetchGRNs,
  fetchPendingQC,
  createGRN,
  updateQC,
  fetchGRNTrend,
} from "../../../redux/slices/production/grnSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
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
import { Check as CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import axios from "../../../utils/axiosApi";

// Helper function to create movement entry
const createMovementEntry = async (data: {
  materialId?: string;
  materialName: string;
  quantity: number;
  unit: string;
  source: string;
  destination: string;
  referenceNumber: string;
  remarks?: string;
  itemType: "material" | "product";
  unitCost?: number;
}) => {
  try {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) return false;

    const movementData = {
      organisationId,
      materialId: data.materialId || null,
      materialName: data.materialName,
      movementType: "outbound",
      quantity: data.quantity,
      unit: data.unit,
      source: data.source,
      destination: data.destination,
      referenceNumber: data.referenceNumber,
      remarks: data.remarks || "",
      unitCost: data.unitCost || 0,
      totalCost: (data.unitCost || 0) * data.quantity,
      itemType: data.itemType,
      movementDate: new Date().toISOString(),
    };

    const response = await axios.post("/material-movements", movementData);
    return response.data.success;
  } catch (error: any) {
    console.error("Failed to create movement entry:", error);
    return false;
  }
};

type GRNItem = {
  productId: string;
  qty: number;
  batchNo: string;
  unitValue?: number;
  totalValue?: number;
  status?: "Pending QC" | "Accepted" | "Rejected";
};

export default function ReceiptOfFinishedGoods() {
  const dispatch = useDispatch();
  const grnState = useSelector((state: any) => state.grn || {});
  const { pendingQC = [], pendingQCPagination, grnsPagination } = grnState;

  // Check authentication state
  const authState = useSelector((state: any) => state.auth || {});
  const { userProfile, organisationId, isAuthenticated } = authState;

  // ✅ LOCATION FILTERING STATE
  const { locations } = useSelector((state: any) => state.masterData);
  const [locationFilter, setLocationFilter] = useState("all");
  const [locationOpen, setLocationOpen] = useState(false);

  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  const canView = usePermission("receipt", "view");
  const canCreate = usePermission("receipt", "create");
  const canEdit = usePermission("receipt", "edit");

  // Pagination states
  const [pendingQCSearch, setPendingQCSearch] = useState("");

  // Debounced search function
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Debounced search handlers
  const debouncedPendingQCSearch = useCallback(
    debounce((searchTerm: string) => {
      (dispatch as any)(fetchPendingQC({
        location: locationFilter !== "all" ? locationFilter : undefined,
        page: 1,
        limit: pendingQCPagination?.itemsPerPage || 10,
        search: searchTerm
      }));
    }, 300),
    [dispatch, locationFilter, pendingQCPagination?.itemsPerPage]
  );

  // Search handlers
  const handlePendingQCSearch = (value: string) => {
    setPendingQCSearch(value);
    debouncedPendingQCSearch(value);
  };

  // Pagination handlers
  const handlePendingQCPageChange = (page: number) => {
    (dispatch as any)(fetchPendingQC({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page,
      limit: pendingQCPagination?.itemsPerPage || 10,
      search: pendingQCSearch
    }));
  };

  const handlePendingQCItemsPerPageChange = (itemsPerPage: number) => {
    (dispatch as any)(fetchPendingQC({
      location: locationFilter !== "all" ? locationFilter : undefined,
      page: 1,
      limit: itemsPerPage,
      search: pendingQCSearch
    }));
  };

  // Stock management functions for products
  // Function to fetch current stock for a product
  const fetchProductStock = async (productId: string) => {
    try {
      const response = await axios.get(`/product/single/${productId}`);
      if (response.data.success && response.data.product) {
        const product = response.data.product;
        // Calculate total stock from all warehouses
        const totalStock = product.stocks?.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0) || 0;
        return totalStock;
      }
      return 0;
    } catch (error: any) {
      console.error("Failed to fetch product stock:", error);
      return 0;
    }
  };

  // Function to deduct stock from product
  const deductProductStock = async (productId: string, quantityToDeduct: number) => {
    try {
      // First get the current product details
      const response = await axios.get(`/product/single/${productId}`);
      if (response.data.success && response.data.product) {
        const product = response.data.product;
        
        // Calculate total current stock
        const totalCurrentStock = product.stocks?.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0) || 0;
        
        // Check if there's enough stock
        if (totalCurrentStock < quantityToDeduct) {
          toast.warning(`Insufficient stock for ${product.name}! Available: ${totalCurrentStock}, Required: ${quantityToDeduct}`);
          return false;
        }
        
        // Calculate new stock quantities by deducting from each warehouse
        let remainingToDeduct = quantityToDeduct;
        const updatedStocks = product.stocks?.map((stock: any) => {
          const currentQty = stock.quantity || 0;
          
          if (remainingToDeduct > 0 && currentQty > 0) {
            const deductFromThisStock = Math.min(currentQty, remainingToDeduct);
            remainingToDeduct -= deductFromThisStock;
            
            return {
              ...stock,
              quantity: currentQty - deductFromThisStock
            };
          }
          return stock;
        }) || [];

        // Update the product with new stock quantities
        const updateResponse = await axios.put(`/product/update/${productId}`, {
          ...product,
          stocks: updatedStocks
        });

        if (updateResponse.data.success) {
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error("Failed to deduct product stock:", error);
      return false;
    }
  };

  // Function to validate stock availability for all GRN items
  const validateGRNStockAvailability = async (items: GRNItem[]) => {
    const stockValidations = [];
    
    for (const item of items) {
      try {
        const response = await axios.get(`/product/single/${item.productId}`);
        if (response.data.success && response.data.product) {
          const totalCurrentStock = response.data.product.stocks?.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0) || 0;
          
          stockValidations.push({
            productId: item.productId,
            productName: response.data.product.name,
            required: item.qty,
            available: totalCurrentStock,
            sufficient: totalCurrentStock >= item.qty
          });
        }
      } catch (error: any) {
        console.error(`Failed to check stock for product ${item.productId}:`, error);
        const product = products.find(p => p._id === item.productId);
        stockValidations.push({
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          required: item.qty,
          available: 0,
          sufficient: false
        });
      }
    }
    
    return stockValidations;
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

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Required
        </h3>
        <p className="text-gray-600">
          Please log in to access the Receipt of Finished Goods.
        </p>
      </div>
    );
  }

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated && organisationId) {
      (dispatch as any)(fetchMasterData("location"));
    }
  }, [dispatch, isAuthenticated, organisationId]);

  // Auto-set location filter for restricted users
  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
      // Also set form location
      setFormLocation(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  // Load GRN data when location filter changes
  useEffect(() => {
    if (isAuthenticated && organisationId) {
      const locationParam = locationFilter !== "all" ? locationFilter : undefined;
      (dispatch as any)(fetchGRNs({
        location: locationParam,
        page: grnsPagination?.currentPage || 1,
        limit: grnsPagination?.itemsPerPage || 10,
        search: ""
      }));
      (dispatch as any)(fetchPendingQC({
        location: locationParam,
        page: pendingQCPagination?.currentPage || 1,
        limit: pendingQCPagination?.itemsPerPage || 10,
        search: pendingQCSearch
      }));
    }
  }, [dispatch, isAuthenticated, organisationId, locationFilter]);

  // Handle location filter change
  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
    // Reset searches and fetch fresh data
    setPendingQCSearch("");
    
    // Fetch data with new location filter
    (dispatch as any)(fetchGRNs({
      location: val !== "all" ? val : undefined,
      page: 1,
      limit: grnsPagination?.itemsPerPage || 10,
      search: ""
    }));
    (dispatch as any)(fetchPendingQC({
      location: val !== "all" ? val : undefined,
      page: 1,
      limit: pendingQCPagination?.itemsPerPage || 10,
      search: ""
    }));
  };

  // Helper to get location name
  const getLocationName = (locData: string | { _id: string; name: string } | undefined) => {
    if (!locData) return "No Location";
    if (typeof locData === 'object' && locData.name) return locData.name;
    const found = locations.find((l: any) => l._id === locData);
    return found ? found.name : "Unknown Location";
  };

  // State for form
  const [openDialog, setOpenDialog] = useState(false);
  const [manualProductId, setManualProductId] = useState("");
  const [manualQty, setManualQty] = useState<number | "">("");
  const [formItems, setFormItems] = useState<GRNItem[]>([]);
  const [remarks, setRemarks] = useState("");
  const [acceptedBy, setAcceptedBy] = useState("");
  const [requireFinalQC, setRequireFinalQC] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  // ✅ ADD LOCATION FORM STATE
  const [formLocation, setFormLocation] = useState(isLocationRestricted ? userProfile?.location : "");

  useEffect(() => {
    const loadProducts = async () => {
      if (isAuthenticated && organisationId) {
        try {
          const res = await axios.get(`/inventory/product/all/${organisationId}`);
          setProducts(res.data.products || []);
        } catch (error) {
          console.error("Failed to load products:", error);
          toast.error("Failed to load products");
        }
      }
    };
    loadProducts();
  }, [isAuthenticated, organisationId]);

  /** ---------------------- Helpers ---------------------- */
  // Function to handle product selection and fetch stock
  const handleProductSelection = async (productId: string) => {
    setManualProductId(productId);
    
    if (productId) {
      // Fetch and set current stock automatically
      const stock = await fetchProductStock(productId);
      setCurrentStock(stock);
      
      // Set product name for display
      const product = products.find(p => p._id === productId);
      setSelectedProductName(product?.name || "");
    } else {
      setCurrentStock(0);
      setSelectedProductName("");
    }
  };

  const generateBatch = (productId: string) => {
    const d = new Date();
    const datePart = d.toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${productId}-${datePart}-${suffix}`;
  };

  const estimateValue = () => {
    // TODO: Get actual product cost from backend
    return 100; // fallback demo value
  };

  /** ---------------------- Main: Create GRN ---------------------- */
  const createGRNRecord = async () => {
    if (formItems.length === 0) {
      toast.error("Add at least one item.");
      return;
    }

    if (!formLocation) {
      toast.error("Please select a location.");
      return;
    }

    // Validate stock availability for all items
    try {
      const stockValidations = await validateGRNStockAvailability(formItems);
      const insufficientItems = stockValidations.filter(v => !v.sufficient);
      
      if (insufficientItems.length > 0) {
        const errorMessage = insufficientItems.map(item => 
          `${item.productName}: Available ${item.available}, Required ${item.required}`
        ).join('\n');
        
        toast.error(`Cannot create GRN! Insufficient stock for:\n${errorMessage}`);
        return;
      }
    } catch (error: any) {
      console.error("Failed to validate stock availability:", error);
      toast.error("Failed to verify stock availability");
      return;
    }

    try {
      const grnData = {
        location: formLocation, // ✅ ADD LOCATION
        items: formItems.map((item) => ({
          ...item,
          status: requireFinalQC ? "Pending QC" : "Accepted"
        })),
        remarks,
        acceptedByName: acceptedBy,
        requireFinalQC,
      };

      await (dispatch as any)(createGRN(grnData));

      // After successfully creating GRN, deduct quantities from product stocks
      let allStockDeducted = true;
      const deductionResults = [];
      const movementResults = [];
      
      for (const item of formItems) {
        if (item.qty > 0) {
          const stockDeducted = await deductProductStock(item.productId, item.qty);
          const product = products.find(p => p._id === item.productId);
          deductionResults.push({
            productName: product?.name || 'Unknown Product',
            quantity: item.qty,
            success: stockDeducted
          });
          
          if (!stockDeducted) {
            allStockDeducted = false;
          } else {
            // Create movement entry for the stock deduction
            const movementCreated = await createMovementEntry({
              materialId: item.productId,
              materialName: product?.name || 'Unknown Product',
              quantity: item.qty,
              unit: "pcs", // You may want to get this from product data
              source: "Finished Goods Inventory",
              destination: "GRN Receipt",
              referenceNumber: `GRN-${Date.now()}`,
              remarks: `Product received through GRN`,
              itemType: "product",
              unitCost: item.unitValue || 0
            });
            
            movementResults.push({
              productName: product?.name || 'Unknown Product',
              movementCreated
            });
          }
        }
      }

      // Refresh data
      const locationParam = locationFilter !== "all" ? locationFilter : undefined;
      (dispatch as any)(fetchGRNs({
        location: locationParam,
        page: grnsPagination?.currentPage || 1,
        limit: grnsPagination?.itemsPerPage || 10,
        search: ""
      }));
      (dispatch as any)(fetchPendingQC({
        location: locationParam,
        page: pendingQCPagination?.currentPage || 1,
        limit: pendingQCPagination?.itemsPerPage || 10,
        search: pendingQCSearch
      }));

      // Reset form
      setFormItems([]);
      setManualProductId("");
      setManualQty("");
      setRemarks("");
      setAcceptedBy("");
      setCurrentStock(0);
      setSelectedProductName("");
      setFormLocation(isLocationRestricted ? userProfile?.location : ""); // ✅ RESET LOCATION
      setOpenDialog(false);

      // Show appropriate success message
      if (allStockDeducted) {
        const totalItems = deductionResults.length;
        const successfulMovements = movementResults.filter(r => r.movementCreated).length;
        
        if (successfulMovements === totalItems) {
          toast.success(`GRN created, stock deducted for ${totalItems} products, and movement entries created`);
        } else {
          toast.success(`GRN created and stock deducted for ${totalItems} products`);
          if (successfulMovements < totalItems) {
            toast.warning(`Could not create movement entries for ${totalItems - successfulMovements} products`);
          }
        }
      } else {
        toast.success("GRN created successfully");
        const failedDeductions = deductionResults.filter(r => !r.success);
        if (failedDeductions.length > 0) {
          toast.warning(`Could not deduct stock for ${failedDeductions.length} products - please check manually`);
        }
      }

      // Refresh products data to show updated stock
      if (organisationId) {
        const res = await axios.get(`/inventory/product/all/${organisationId}`);
        setProducts(res.data.products || []);
      }
    } catch (error) {
      toast.error("Failed to create GRN");
      console.error(error);
    }
  };

  /** ---------------------- QC Accept/Reject ---------------------- */
  const updateBatchQC = async (batchNo: string, action: "Accepted" | "Rejected") => {
    try {
      await (dispatch as any)(updateQC({ productId: "", batchNo, action }));

      // Refresh data with location filter
      const locationParam = locationFilter !== "all" ? locationFilter : undefined;
      (dispatch as any)(fetchPendingQC({
        location: locationParam,
        page: pendingQCPagination?.currentPage || 1,
        limit: pendingQCPagination?.itemsPerPage || 10,
        search: pendingQCSearch
      }));
      (dispatch as any)(fetchGRNs({
        location: locationParam,
        page: grnsPagination?.currentPage || 1,
        limit: grnsPagination?.itemsPerPage || 10,
        search: ""
      }));

      toast.success(`Batch ${action.toLowerCase()} successfully`);
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} batch`);
      console.error(error);
    }
  };

  /** ---------------------- Analytics ---------------------- */
  const { trend } = useSelector((state: any) => state.grn);
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    (dispatch as any)(fetchGRNTrend(range));
  }, [range, dispatch]);


  /** ---------------------- UI ---------------------- */
  const addManualItem = () => {
    if (!manualProductId || !manualQty) {
      toast.error("Please select product and enter quantity");
      return;
    }

    // Check if there's enough stock
    if (currentStock < Number(manualQty)) {
      toast.error(`Insufficient stock! Available: ${currentStock}, Required: ${manualQty}`);
      return;
    }

    const batch = generateBatch(manualProductId);
    const unitValue = estimateValue();
    const totalValue = unitValue * Number(manualQty);
    setFormItems((p) => [...p, {
      productId: manualProductId,
      qty: Number(manualQty),
      batchNo: batch,
      unitValue,
      totalValue
    }]);
    setManualProductId("");
    setManualQty("");
    setCurrentStock(0);
    setSelectedProductName("");
    toast.success("Item added successfully");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Location Filter */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Receipt of Finished Goods (GRN)</h2>
          <p className="text-muted-foreground">Transfer completed goods from WIP to Finished Goods inventory. Auto-generate batch and trigger QC.</p>
        </div>
        
        {/* ✅ LOCATION FILTER */}
        <Select 
          disabled={isLocationRestricted} 
          value={locationFilter} 
          onValueChange={handleLocationFilterChange}
        >
          <SelectTrigger className="w-48">
            <MapPin className="w-4 h-4 mr-2" />
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
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" checked={requireFinalQC} onChange={(e) => setRequireFinalQC(e.target.checked)} />
        <Label>Require Final QC</Label>
      </div>

      <Button
        disabled={!canCreate}
        onClick={() => canCreate && setOpenDialog(true)}
        className={`${!canCreate ? "opacity-50 cursor-not-allowed bg-gray-400" : "bg-primary"} mt-3`}
      >

        <Plus className="mr-2 h-4 w-4" /> New Goods Receipt
      </Button>

      {/* GRN Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Goods Receipt Note</DialogTitle>
          </DialogHeader>
          <div
            className="grid gap-3"
            style={{
              pointerEvents: canCreate ? "auto" : "none",
              opacity: canCreate ? 1 : 0.6,
            }}
          >

            {/* ✅ LOCATION FIELD */}
            <div>
              <Label>Location *</Label>
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`w-full px-4 py-3 border rounded-lg text-left flex justify-between items-center ${
                      isLocationRestricted ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                    disabled={isLocationRestricted}
                  >
                    {formLocation
                      ? locations.find((l: any) => l._id === formLocation)?.name
                      : "Select Location"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                
                {!isLocationRestricted && (
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search location..." />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          {locations.map((l: any) => (
                            <CommandItem
                              key={l._id}
                              value={l.name}
                              onSelect={() => {
                                setFormLocation(l._id);
                                setLocationOpen(false);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formLocation === l._id ? "opacity-100" : "opacity-0"
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
                <p className="text-[10px] text-muted-foreground mt-1">
                  *Location is fixed based on your permissions.
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Product</Label>
                <Select value={manualProductId} onValueChange={handleProductSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} ({product.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={manualQty as any} onChange={(e) => setManualQty(Number(e.target.value))} />
                
                {/* Stock validation indicator */}
                {manualProductId && selectedProductName && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-600 mb-1">
                      Current Stock: <span className="font-medium">{currentStock}</span> units
                    </div>
                    {manualQty && Number(manualQty) > 0 && (
                      <div className={`text-xs p-2 rounded ${
                        currentStock >= Number(manualQty) 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {currentStock >= Number(manualQty) 
                          ? `✅ Sufficient stock available (${currentStock} ≥ ${manualQty})`
                          : `⚠️ Insufficient stock! Available: ${currentStock}, Required: ${manualQty}`
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!canCreate}
              onClick={() => canCreate && addManualItem()}
            >Add Item</Button>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formItems.map((i, idx) => {
                  const product = products.find(p => p._id === i.productId);
                  return (
                    <TableRow key={idx}>
                      <TableCell>{product?.name || i.productId}</TableCell>
                      <TableCell>{i.qty}</TableCell>
                      <TableCell>{i.batchNo}</TableCell>
                      <TableCell>₹{i.totalValue?.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Overall stock status summary for added items */}
            {formItems.length > 0 && (
              <div className="mt-3 text-center">
                {(() => {
                  // We'll need to check stock for each item when displaying this summary
                  // For now, show a simple count
                  return (
                    <div className="text-sm p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                      📦 {formItems.length} item(s) added to GRN
                    </div>
                  );
                })()}
              </div>
            )}
            
            <Label>Accepted By</Label>
            <Input value={acceptedBy} onChange={(e) => setAcceptedBy(e.target.value)} />
            <Label>Remarks</Label>
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={createGRNRecord}><Check className="mr-2 h-4 w-4" />Save & Receive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending QC Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pending QC Batches ({pendingQCPagination?.totalItems || 0})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batches, products..."
                  value={pendingQCSearch}
                  onChange={(e) => handlePendingQCSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingQC.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {grnState.loading ? "Loading..." : "No Pending QC Batches"}
                  </TableCell>
                </TableRow>
              )}

              {pendingQC.map((item: any) => {
                const product = products.find(p => p._id === item.productId);

                return (
                  <TableRow key={item.batchNo}>
                    <TableCell>{item.batchNo}</TableCell>
                    <TableCell>{product?.name || "Unknown Product"}</TableCell>
                    <TableCell>{item.qty}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        <MapPin className="h-3 w-3" />
                        {getLocationName(item.location)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600"
                        disabled={!canEdit}
                        onClick={() =>
                          updateBatchQC(item.batchNo, "Accepted")
                        }
                      >
                        Accept
                      </Button>

                      <Button
                        size="sm"
                        className="bg-red-600"
                        disabled={!canEdit}
                        onClick={() =>
                          updateBatchQC(item.batchNo, "Rejected")
                        }
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination for Pending QC */}
          {pendingQCPagination && (
            <Pagination
              currentPage={pendingQCPagination.currentPage}
              totalPages={pendingQCPagination.totalPages}
              totalItems={pendingQCPagination.totalItems}
              itemsPerPage={pendingQCPagination.itemsPerPage}
              onPageChange={handlePendingQCPageChange}
              onItemsPerPageChange={handlePendingQCItemsPerPageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* GRN Trend */}
      <Card>
        <CardHeader>
          <CardTitle>GRN Value Trend</CardTitle>

          {/* Range Toggle */}
          <div className="flex gap-2 mt-2">
            {["daily", "weekly", "monthly"].map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "default" : "outline"}
                onClick={() => setRange(r as any)}
              >
                {r.toUpperCase()}
              </Button>
            ))}
          </div>
        </CardHeader>

        {/* ✅ Chart ALWAYS goes inside CardContent */}
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trend}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              {/* Subtle grid */}
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />

              {/* Axis */}
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />

              {/* Tooltip */}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
                formatter={(v: any) => [`₹${v.toLocaleString()}`, "GRN Value"]}
                labelStyle={{ fontWeight: 600 }}
              />

              {/* Smooth animated line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10B981"           // Tailwind green-500
                strokeWidth={3}
                dot={false}                // Cleaner look
                activeDot={{ r: 6 }}
                isAnimationActive
                animationDuration={600}
              />

              {/* Gradient area under line */}
              <defs>
                <linearGradient id="grnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill="url(#grnGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>

      </Card>


    </div>
  );
}
