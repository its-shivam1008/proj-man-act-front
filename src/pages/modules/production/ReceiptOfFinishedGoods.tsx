import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
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
import { Plus, Check, XCircle, ShieldAlert } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area } from "recharts";
import {
  fetchGRNs,
  fetchPendingQC,
  createGRN,
  updateQC,
  fetchGRNTrend,
} from "../../../redux/slices/production/grnSlice";
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

type GRN = {
  _id: string;
  date: string;
  workOrderId?: string;
  items: GRNItem[];
  remarks?: string;
  acceptedBy?: string;
  requireFinalQC: boolean;
};

const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export default function ReceiptOfFinishedGoods() {
  const dispatch = useDispatch();
  const grnState = useSelector((state: any) => state.grn || {});
  const { grns = [], pendingQC = [], loading = false } = grnState;

  // Check authentication state
  const authState = useSelector((state: any) => state.auth || {});
  const { userProfile, organisationId, isAuthenticated } = authState;

  const canView = usePermission("receipt", "view");
  const canCreate = usePermission("receipt", "create");
  const canEdit = usePermission("receipt", "edit");
  const canDelete = usePermission("receipt", "delete");

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
          console.log(`✅ Successfully deducted ${quantityToDeduct} units from product ${productId}`);
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
      console.log("GRN: Loading data...");
      dispatch(fetchGRNs() as any);
      dispatch(fetchPendingQC() as any);
    }
  }, [dispatch, isAuthenticated, organisationId]);

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

  // Debug: Log products data
  useEffect(() => {
    console.log("Products state updated:", products);
  }, [products]);
  useEffect(() => {
    const loadProducts = async () => {
      if (isAuthenticated && organisationId) {
        try {
          console.log("Loading products for organisationId:", organisationId);
          const res = await axios.get(`/inventory/product/all/${organisationId}`);
          console.log("Products response:", res.data);
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

  const estimateValue = (productId: string) => {
    // TODO: Get actual product cost from backend
    return 100; // fallback demo value
  };

  /** ---------------------- Main: Create GRN ---------------------- */
  const createGRNRecord = async () => {
    if (formItems.length === 0) {
      toast.error("Add at least one item.");
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
        items: formItems.map((item) => ({
          ...item,
          status: requireFinalQC ? "Pending QC" : "Accepted"
        })),
        remarks,
        acceptedByName: acceptedBy,
        requireFinalQC,
      };

      await dispatch(createGRN(grnData) as any);

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
      dispatch(fetchGRNs() as any);
      dispatch(fetchPendingQC() as any);

      // Reset form
      setFormItems([]);
      setManualProductId("");
      setManualQty("");
      setRemarks("");
      setAcceptedBy("");
      setCurrentStock(0);
      setSelectedProductName("");
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
  const updateBatchQC = async (productId: string, batchNo: string, action: "Accepted" | "Rejected") => {
    try {
      await dispatch(updateQC({ productId, batchNo, action }) as any);

      // Refresh data
      dispatch(fetchPendingQC() as any);
      dispatch(fetchGRNs() as any);

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
    dispatch(fetchGRNTrend(range));
  }, [range]);


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
    const unitValue = estimateValue(manualProductId);
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
      <h2 className="text-2xl font-bold">Receipt of Finished Goods (GRN)</h2>
      <p className="text-muted-foreground">Transfer completed goods from WIP to Finished Goods inventory. Auto-generate batch and trigger QC.</p>

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
        <CardHeader><CardTitle>Pending QC Batches</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingQC.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No Pending QC Batches
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
                      <Badge variant="outline">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600"
                        disabled={!canEdit}
                        onClick={() =>
                          updateBatchQC(item.productId, item.batchNo, "Accepted")
                        }
                      >
                        Accept
                      </Button>

                      <Button
                        size="sm"
                        className="bg-red-600"
                        disabled={!canEdit}
                        onClick={() =>
                          updateBatchQC(item.productId, item.batchNo, "Rejected")
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
