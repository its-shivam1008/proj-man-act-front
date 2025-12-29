import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { storage, STORAGE_KEYS } from "../../../lib/storage";
import { useDispatch, useSelector } from "react-redux";
import { fetchWorkOrders } from "@/redux/slices/production/workOrderSlice";

import {
    Card, CardContent, CardHeader, CardTitle
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/table";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogContent } from "../../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import { Plus, Download, Barcode, Package, RefreshCw, CheckCircle, FileText, ShieldAlert } from "lucide-react";
import {
    ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from "recharts";
import { RootState } from "@/redux/store";
import { createIssueSlip, deleteIssueSlip, fetchIssueSlips, fetchLedger, fetchWIP } from "@/redux/slices/production/materialIssueSlice";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import axios from "../../../utils/axiosApi";
import { toast } from "sonner";
// Generate random ID
const genId = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export default function MaterialIssue() {
    const { list: orders } = useSelector(
        (state: RootState) => state.workOrders
    );
    const [selectedItems, setSelectedItems] = useState<any[]>([]);

    const dispatch = useDispatch();
    const canView = usePermission("materialIssueConsumption", "view");
    const canCreate = usePermission("materialIssueConsumption", "create");
    const canEdit = usePermission("materialIssueConsumption", "edit");
    const canDelete = usePermission("materialIssueConsumption", "delete");

    // Stock management functions for raw materials
    // Function to fetch current stock for a raw material
    const fetchMaterialStock = async (materialId: string) => {
        try {
            const response = await axios.get(`/raw/single/${materialId}`);
            if (response.data.success && response.data.material) {
                const material = response.data.material;
                // Calculate total stock from all warehouses using remainingQuantity
                const totalStock = material.stocks?.reduce((sum: number, stock: any) => sum + (stock.remainingQuantity || 0), 0) || 0;
                return totalStock;
            }
            return 0;
        } catch (error: any) {
            console.error("Failed to fetch material stock:", error);
            return 0;
        }
    };

    // Function to validate stock availability for all selected items
    const validateMaterialStockAvailability = async (items: any[]) => {
        const stockValidations = [];
        
        for (const item of items) {
            if (item.issueQty > 0) {
                try {
                    const response = await axios.get(`/raw/single/${item.itemId}`);
                    if (response.data.success && response.data.material) {
                        const totalCurrentStock = response.data.material.stocks?.reduce((sum: number, stock: any) => sum + (stock.remainingQuantity || 0), 0) || 0;
                        
                        stockValidations.push({
                            materialId: item.itemId,
                            materialName: item.itemName,
                            required: item.issueQty,
                            available: totalCurrentStock,
                            sufficient: totalCurrentStock >= item.issueQty
                        });
                    }
                } catch (error: any) {
                    console.error(`Failed to check stock for material ${item.itemId}:`, error);
                    stockValidations.push({
                        materialId: item.itemId,
                        materialName: item.itemName,
                        required: item.issueQty,
                        available: 0,
                        sufficient: false
                    });
                }
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
    const { issueSlips, ledger, wip, loading, error } =
        useSelector((state: RootState) => state.materialIssue);

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<any>({
        workOrderId: "",
        items: [],
        remarks: "",
        autoBackflush: false,
    });

    // Data sources
    const workOrders = orders; // from Redux

    const { list: boms } = useSelector(
        (state: RootState) => state.bom
    );

    const { materials, loading: materialLoading, page, limit } = useSelector(
        (state: RootState) => state.rawMaterials
    );

    const { list: items } = useSelector(
        (state: RootState) => state.itemMaster
    );
    const displayDate = (s: any) => {
        const raw = s.issueDate || s.createdAt;
        if (!raw) return "-";
        const d = new Date(raw);
        return isNaN(d.getTime()) ? "-" : d.toISOString().slice(0, 10);
    };


    // const ledger = storage.get(STORAGE_KEYS.INVENTORY_LEDGER, []);
    // const wip = storage.get(STORAGE_KEYS.WIP_INVENTORY, {});
    const orgId = localStorage.getItem('organisationId') || '';
    useEffect(() => {
        if (orgId) {
            dispatch(fetchMaterials({ page, limit }));
            dispatch(fetchIssueSlips());
            dispatch(fetchLedger());
            dispatch(fetchWIP(orgId));
            dispatch(fetchWorkOrders());
        }

    }, [orgId, page, limit, dispatch]);


    /* -------------------- Helpers -------------------- */
    const getBOMItems = (workOrderId: string) => {
        const wo = workOrders.find((w: any) => w._id === workOrderId);
        if (!wo || !wo.bomId) return [];

        const bom = boms.find((b: any) => b.id === wo.bomId);
        if (!bom) return [];
        return (bom.lines || []).map((ln: any) => {
            const stock = Number(inventory[ln.itemId] || 0);
            const required = Number(ln.qty) * Number(wo.quantity);
            return {
                itemId: ln.itemId,
                itemName: (items.find((i: any) => i.id === ln.itemId)?.name) || ln.itemId,
                required,
                available: stock,
                issueQty: Math.min(stock, required),
            };
        });
    };

    const getAvailableQty = (material: any) => {
        return material.stocks?.reduce(
            (sum: number, s: any) =>
                sum + Number(s.remainingQuantity ?? s.quantity ?? 0),
            0
        ) || 0;
    };

    const getRateFIFO = (material: any) => {
        const batch = material.stocks
            ?.filter((s: any) => s.remainingQuantity > 0)
            .sort(
                (a: any, b: any) =>
                    new Date(a.purchaseDate).getTime() -
                    new Date(b.purchaseDate).getTime()
            )[0];

        return batch?.unitCost || 0;
    };






    const handleSelectWorkOrder = (id: string) => {
        const list = getBOMItems(id);
        setForm({ ...form, workOrderId: id, items: list });
    };

    const totalValue = (list: any[]) => {
        return list.reduce((s, i) => s + (Number(i.issueQty) * Number(i.rate || 1)), 0);
    };

    const handleIssue = async () => {
        if (!form.workOrderId) {
            toast.error("Please select Work Order");
            return;
        }

        if (!selectedItems.length) {
            toast.error("Select at least one material");
            return;
        }

        // Validate stock availability for all selected items
        try {
            const stockValidations = await validateMaterialStockAvailability(selectedItems);
            const insufficientItems = stockValidations.filter(v => !v.sufficient);
            
            if (insufficientItems.length > 0) {
                const errorMessage = insufficientItems.map(item => 
                    `${item.materialName}: Available ${item.available}, Required ${item.required}`
                ).join('\n');
                
                toast.error(`Cannot issue materials! Insufficient stock for:\n${errorMessage}`);
                return;
            }
        } catch (error: any) {
            console.error("Failed to validate stock availability:", error);
            toast.error("Failed to verify stock availability");
            return;
        }

        try {
            // The backend createIssueSlip already handles stock deduction using FIFO logic
            // So we don't need to deduct stock manually in the frontend
            await dispatch(createIssueSlip({
                organisationId: localStorage.getItem("organisationId"),
                workOrderId: form.workOrderId,
                items: selectedItems,
                remarks: form.remarks,
                autoBackflush: form.autoBackflush,
            }));

            // Reset form and close dialog
            setSelectedItems([]);
            setForm({
                workOrderId: "",
                items: [],
                remarks: "",
                autoBackflush: false,
            });
            setOpen(false);

            // Show success message
            toast.success(`Material issue slip created successfully for ${selectedItems.length} materials`);

            // Refresh materials data to show updated stock
            const orgId = localStorage.getItem('organisationId') || '';
            if (orgId) {
                dispatch(fetchMaterials({ page, limit }));
            }
        } catch (error) {
            toast.error("Failed to create material issue slip");
            console.error(error);
        }
    };


    const handleBackflush = (slip: any) => {
        // Move WIP → consumption (simulate)
        const wipInv = { ...wip };
        const ledgerEntries: any[] = [];

        slip.items.forEach((i: any) => {
            wipInv[i.itemId] = Math.max(0, (wipInv[i.itemId] || 0) - i.issueQty);

            ledgerEntries.push({
                id: genId("lg"),
                date: new Date().toISOString(),
                type: "CONSUMPTION",
                itemId: i.itemId,
                qty: i.issueQty,
                balance: wipInv[i.itemId],
                reference: slip.workOrderId,
            });
        });

        storage.set(STORAGE_KEYS.WIP_INVENTORY, wipInv);
        storage.set(STORAGE_KEYS.INVENTORY_LEDGER, [...ledger, ...ledgerEntries]);
        alert("Backflush completed — materials consumed.");
    };

    const removeSlip = (id: string) => {
        if (!confirm("Delete this slip?")) return;
        dispatch(deleteIssueSlip(id));
    };

    /* -------------------- Charts -------------------- */
    const issueTrend = useMemo(() => {
        const map: Record<string, number> = {};

        issueSlips.forEach((s: any) => {
            // 🔒 pick the correct date field safely
            const rawDate =
                s.issueDate || s.date || s.createdAt;

            if (!rawDate) return; // skip broken rows

            const d = new Date(rawDate).toISOString().slice(0, 10);

            map[d] = (map[d] || 0) + (s.totalValue || s.value || 0);
        });

        return Object.entries(map).map(([date, value]) => ({
            date,
            value,
        }));
    }, [issueSlips]);


    const wipPie = useMemo(() => {
  return wip.map((row: any) => ({
    name: row.itemId?.name || "Unknown",
    value: row.quantity,
  }));
}, [wip]);


    const COLORS = ["#82ca9d", "#8884d8", "#ffc658", "#ff7f7f", "#a0aec0"];

    /* -------------------- Render -------------------- */
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Material Issue & Consumption</h2>
                    <p className="text-muted-foreground">Issue raw materials to shop floor and record consumption.</p>
                </div>
                <Button
                    disabled={!canCreate}
                    onClick={() => canCreate && setOpen(true)}
                    className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                >
                    <Plus className="mr-2 h-4 w-4" /> New Issue Slip
                </Button>
            </div>

            <Tabs defaultValue="issue">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger value="issue">Issue Slips</TabsTrigger>
                    <TabsTrigger value="ledger">Inventory Ledger</TabsTrigger>
                    <TabsTrigger value="wip">WIP Summary</TabsTrigger>
                </TabsList>

                {/* Issue Slips */}
                <TabsContent value="issue">
                    <Card>
                        <CardHeader><CardTitle>Issue History ({issueSlips.length})</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Work Order</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Backflush</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {issueSlips.map((s: any) => (
                                        <TableRow key={s._id}>
                                            <TableCell>{displayDate(s)}</TableCell>

                                            <TableCell>{s.workOrderCode}</TableCell>

                                            <TableCell>
                                                <div className="text-sm">
                                                    {s.items.slice(0, 2).map((i: any) => (
                                                        <div key={i.itemId}>{i.itemName}</div>
                                                    ))}
                                                    {s.items.length > 2 && (
                                                        <span className="text-muted-foreground">
                                                            +{s.items.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>₹{Number(s.totalValue || 0).toFixed(2)}</TableCell>

                                            <TableCell>
                                                {s.autoBackflush ? <Badge>Auto</Badge> : "Manual"}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="icon" variant="ghost" onClick={() => handleBackflush(s)}>
                                                        <RefreshCw />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => removeSlip(s._id)}>
                                                        <Package />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                    ))}
                                </TableBody>
                            </Table>

                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                        <Card>
                            <CardHeader><CardTitle>Issued Value Trend</CardTitle></CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={issueTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="value" stroke="#8884d8" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Inventory Ledger */}
                <TabsContent value="ledger">
                    <Card>
                        <CardHeader><CardTitle>Inventory Ledger</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Reference</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ledger.slice(-100).reverse().map((l: any) => (
                                        <TableRow key={l._id}>
                                            <TableCell>
                                                {l.date ? new Date(l.date).toISOString().slice(0, 10) : "-"}
                                            </TableCell>

                                            <TableCell>{l.type}</TableCell>
                                            <TableCell>{l.itemId?.name || "-"}</TableCell>
                                            <TableCell>{l.qty}</TableCell>
                                            <TableCell>{l.balance}</TableCell>
                                            <TableCell>{l.reference}</TableCell>
                                        </TableRow>

                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* WIP Summary */}
           <TabsContent value="wip">
  <div className="space-y-6">

    {/* ================= HEADER ================= */}
    <div>
      <h2 className="text-2xl font-bold">WIP Summary</h2>
      <p className="text-muted-foreground">
        Work-in-progress inventory generated from material issues
      </p>
    </div>

    {/* ================= KPI CARDS ================= */}
    <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total WIP Qty</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {wip.reduce((s: number, r: any) => s + r.quantity, 0)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WIP Items</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {wip.length}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-red-500">
        <CardHeader>
          <CardTitle>High WIP</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold text-red-600">
          {wip.filter((r: any) => r.quantity > 50).length}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-green-500">
        <CardHeader>
          <CardTitle>Low / Near Zero</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold text-green-600">
          {wip.filter((r: any) => r.quantity <= 5).length}
        </CardContent>
      </Card>
    </div>

    {/* ================= CHARTS + TABLE ================= */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ================= TABLE ================= */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>WIP Material Details</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {wip.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No WIP materials found
                  </TableCell>
                </TableRow>
              ) : (
                wip.map((row: any) => {
                  const status =
                    row.quantity > 50
                      ? "High"
                      : row.quantity <= 5
                      ? "Low"
                      : "Normal";

                  return (
                    <TableRow key={row._id}>
                      <TableCell className="font-medium">
                        {row.itemId?.name || "-"}
                      </TableCell>

                      <TableCell>{row.quantity}</TableCell>

                      <TableCell>
                        {row.itemId?.unitOfMeasure || "-"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            status === "High"
                              ? "bg-red-100 text-red-700"
                              : status === "Low"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ================= PIE CHART ================= */}
      <Card>
        <CardHeader>
          <CardTitle>WIP Distribution</CardTitle>
        </CardHeader>

        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={wip.map((r: any) => ({
                  name: r.itemId?.name || "Unknown",
                  value: r.quantity,
                }))}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {wip.map((_: any, i: number) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  </div>
</TabsContent>



            </Tabs>

            {/* Dialog: Issue Form */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>New Material Issue Slip</DialogTitle></DialogHeader>
                    <div
                        className="space-y-3"
                        style={{
                            pointerEvents: canCreate ? "auto" : "none",
                            opacity: canCreate ? 1 : 0.6,
                        }}
                    >
                        <div>
                            <Label>Work Order</Label>
                            <select
                                value={form.workOrderId}
                                onChange={(e) => handleSelectWorkOrder(e.target.value)}
                                className="border rounded-md px-2 py-1 w-full"
                            >
                                <option value="">Select Work Order</option>
                                {workOrders?.map((w: any) => (
                                    <option key={w._id} value={w._id}>{w.orderNo} — {w.productName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Barcode / QR Input</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Scan or enter item code"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const code = (e.target as HTMLInputElement).value.trim();
                                            const match = form.items.find((i: any) => i.itemId === code);
                                            if (match) {
                                                match.issueQty = Math.min(match.issueQty + 1, match.available);
                                                setForm({ ...form, items: [...form.items] });
                                            }
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }}
                                />
                                <Barcode className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>

                        <div>
                            <Label>Items to Issue</Label>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Select</TableHead>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Available</TableHead>
                                        <TableHead>Issue Qty</TableHead>
                                        <TableHead>Rate</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {materials.map((m: any) => {
                                        const selected = selectedItems.find(i => i.itemId === m._id);
                                        const availableQty = getAvailableQty(m);
                                        const rate = getRateFIFO(m);

                                        return (
                                            <TableRow key={m._id} className="space-y-2">
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        disabled={availableQty === 0}
                                                        checked={!!selected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedItems(prev => [
                                                                    ...prev,
                                                                    {
                                                                        itemId: m._id,
                                                                        itemName: m.name,
                                                                        unit: m.unitOfMeasure,
                                                                        availableQty,
                                                                        issueQty: availableQty > 0 ? 1 : 0,
                                                                        rate,
                                                                    },
                                                                ]);
                                                            } else {
                                                                setSelectedItems(prev =>
                                                                    prev.filter(i => i.itemId !== m._id)
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{m.name}</div>
                                                        {availableQty === 0 && (
                                                            <div className="text-xs text-red-600 mt-1">
                                                                ⚠️ Out of stock
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className={`${availableQty === 0 ? 'text-red-600' : availableQty < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {availableQty} {m.unitOfMeasure}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {selected && (
                                                        <div className="space-y-2">
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={availableQty}
                                                                value={selected.issueQty}
                                                                onChange={(e) =>
                                                                    setSelectedItems(prev =>
                                                                        prev.map(i =>
                                                                            i.itemId === m._id
                                                                                ? {
                                                                                    ...i,
                                                                                    issueQty: Math.min(+e.target.value, availableQty),
                                                                                }
                                                                                : i
                                                                        )
                                                                    )
                                                                }
                                                            />
                                                            {/* Stock validation indicator */}
                                                            {selected.issueQty > 0 && (
                                                                <div className={`text-xs p-1 rounded ${
                                                                    availableQty >= selected.issueQty 
                                                                        ? 'bg-green-50 text-green-700' 
                                                                        : 'bg-red-50 text-red-700'
                                                                }`}>
                                                                    {availableQty >= selected.issueQty 
                                                                        ? `✅ Available: ${availableQty}`
                                                                        : `⚠️ Need: ${selected.issueQty}, Have: ${availableQty}`
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {selected && (
                                                        <Input
                                                            type="number"
                                                            value={selected.rate}
                                                            onChange={(e) =>
                                                                setSelectedItems(prev =>
                                                                    prev.map(i =>
                                                                        i.itemId === m._id
                                                                            ? { ...i, rate: +e.target.value }
                                                                            : i
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                </TableBody>
                            </Table>

                            {/* Overall stock status summary for selected items */}
                            {selectedItems.length > 0 && (
                                <div className="mt-3 text-center">
                                    {(() => {
                                        const insufficientItems = selectedItems.filter(item => item.availableQty < item.issueQty);
                                        const sufficientItems = selectedItems.filter(item => item.availableQty >= item.issueQty);
                                        
                                        if (insufficientItems.length === 0) {
                                            return (
                                                <div className="text-sm p-2 bg-green-50 text-green-700 border border-green-200 rounded">
                                                    ✅ All selected materials have sufficient stock ({selectedItems.length} items)
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div className="text-sm p-2 bg-red-50 text-red-700 border border-red-200 rounded">
                                                    ⚠️ {insufficientItems.length} material(s) have insufficient stock out of {selectedItems.length} selected
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            )}

                        </div>


                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.autoBackflush}
                                onChange={(e) => setForm({ ...form, autoBackflush: e.target.checked })}
                            />
                            <Label>Enable Auto Backflush</Label>
                        </div>

                        <div>
                            <Label>Remarks</Label>
                            <Input
                                value={form.remarks}
                                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!canCreate}
                            onClick={() => canCreate && handleIssue()}
                            className={canCreate ? "" : "opacity-50 cursor-not-allowed"}
                        >

                            <CheckCircle className="mr-2 h-4 w-4" /> Issue Materials</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
