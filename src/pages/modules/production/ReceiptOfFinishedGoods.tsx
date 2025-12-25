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

      // Refresh data
      dispatch(fetchGRNs() as any);
      dispatch(fetchPendingQC() as any);

      // Reset form
      setFormItems([]);
      setManualProductId("");
      setManualQty("");
      setRemarks("");
      setAcceptedBy("");
      setOpenDialog(false);

      toast.success("GRN created successfully");
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
                <Select value={manualProductId} onValueChange={setManualProductId}>
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
