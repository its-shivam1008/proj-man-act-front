"use client";
import api from "@/utils/axiosApi"
import { useEffect, useState } from "react";
import { PurchaseOrder } from "@/types/purchaseOrder";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Separator } from "@/components/ui/separator";
import { CalendarIcon, ChevronsUpDown, Eye, Pencil, Trash, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { usePermission } from "@/hooks/userPermission";
import { fetchInventoryMaster } from "@/redux/slices/inventoryMasterSlice";
import { createPurchaseOrder, deletePurchaseOrder, fetchPurchaseOrders, updatePurchaseOrder } from "@/redux/slices/poInventorySlice";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
// import { RawMaterial } from "@/redux/slices/materialslice";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice"
import { toast } from "sonner";
import { BASE_URL } from "@/utils/constants";



export default function PurchaseOrderPage() {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { locations } = useSelector( // [!code ++]
        (state: RootState) => state.masterData
    );

    const [supplierValue, setSupplierValue] = useState("");

    const { list, loading, pagination } = useSelector(
        (state: RootState) => state.purchaseOrdersInventory
    );
    const [locationOpen, setLocationOpen] = useState(false);
    const [locationId, setLocationId] = useState<string | null>(null);

    const resetForm = () => {
        setSupplierValue("");
        setProjectId("");
        setRawMaterialId(null);
        setRawMaterialName("");
        setLocationId(null);
        setQuantity(1);
        setPoDate(undefined);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Draft":
                return "bg-gray-100 text-gray-700";
            case "Sent to RFQ":
                return "bg-blue-100 text-blue-700";
            case "Approved":
                return "bg-green-100 text-green-700";
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    const {
        projects = [] } = useSelector((state: RootState) => state.projects);
    const { supplier: supplierList = [] } =
        useSelector((state: RootState) => state.inventoryMaster);

    // raw materials
    const [rawMaterialId, setRawMaterialId] = useState<string | null>(null);
    const [rawMaterialName, setRawMaterialName] = useState("");

    const {
        materials = [],
    } = useSelector((state: RootState) => state.rawMaterials);


    const dispatch = useDispatch<AppDispatch>();
    const organisationId = localStorage.getItem('organisationId')

    const [editOpen, setEditOpen] = useState(false);
    const [editPO, setEditPO] = useState<PurchaseOrder | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [fromDate, setFromDate] = useState<Date>();
    const [toDate, setToDate] = useState<Date>();
    const [search, setSearch] = useState("");
    const { userProfile } = useSelector((state: RootState) => state.auth);
    // 🔹 Create PO modal
    const [createOpen, setCreateOpen] = useState(false);

    // const [supplier, setSupplier] = useState("");
    const [item, setItem] = useState("");
    const [quantity, setQuantity] = useState(1);
    // const [price, setPrice] = useState(0);
    const [poDate, setPoDate] = useState<Date>();

    const canView = usePermission('projects', 'view');
    const canCreate = usePermission('projects', 'create');
    const canEdit = usePermission('projects', 'edit');
    const canDelete = usePermission('projects', 'delete');
    // const suppliers = ["ABC Traders", "XYZ Pvt Ltd", "Global Supplies"];
    const [projectId, setProjectId] = useState("");
    const selectedProject = projects.find(p => p._id === projectId);

    // 🔹 View modal state
    const [viewOpen, setViewOpen] = useState(false);
    const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);

    const toggleSelect = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selected.length === list.length) {
            setSelected([]);
        } else {
            setSelected(list.map((po) => po._id));
        }
    };
    const getLocationName = (locData: string | { _id: string; name: string } | undefined) => {
        if (!locData) return "N/A";
        if (typeof locData === 'object' && locData.name) return locData.name;
        const found = locations.find((l) => l._id === locData);
        return found ? found.name : "Unknown Location";
    };
    const isLocationRestricted =
        userProfile?.role !== 'admin' &&
        !!userProfile?.location;
    const handleResetFilters = () => {
        setFromDate(undefined);
        setToDate(undefined);
        setSearch("");
        setPage(1);

        dispatch(
            fetchPurchaseOrders({
                page: 1,
                limit,
            })
        );
    };

    const handleCreatePO = () => {
        if (!supplierValue || !rawMaterialId || !locationId || !poDate) {
            alert("Please fill all required fields");
            return;
        }


        const selectedLocation = locations.find(l => l._id === locationId);

        dispatch(createPurchaseOrder({
            supplier: supplierValue,
            projectId,
            rawMaterialId,
            rawMaterialName,
            quantity,
            location: locationId,
            locationName: selectedLocation?.name, // ✅ REQUIRED
            poDate,
        })).then(() => {
            setCreateOpen(false);
            resetForm();
        });
    };
    const handleUpdatePO = () => {
        if (!editPO) return;

        dispatch(updatePurchaseOrder({
            id: editPO._id,
            data: {
                supplier: supplierValue,
                projectId,
                item: {
                    rawMaterialId,
                    rawMaterialName,
                },
                quantity,
                location: locationId,
                poDate,
            }
        })).then(() => {
            setEditOpen(false);
            setEditPO(null);
        });
    };
    const handleDeletePO = (id: string) => {
        if (!confirm("Are you sure you want to delete this PO?")) return;

        dispatch(deletePurchaseOrder(id));
    };

    // const handleSendToRFQ = async () => {
    //     try {
    //         if (selected.length === 0) return;

    //         await api.post("/rfq/from-po", {
    //             purchaseOrderIds: selected,
    //         });

    //         alert("RFQ sent successfully");

    //         setSelected([]);
    //         dispatch(fetchPurchaseOrders({ page, limit }));
    //     } catch (error: any) {
    //         console.error(error);
    //         alert(
    //             error?.response?.data?.message || "Failed to send RFQ"
    //         );
    //     }
    // };

    const handleSendToRFQ = async () => {
        if (!selected.length) return;

        try {
            await api.post(
                `${BASE_URL}/purchase-orders/send-to-rfq`,
                { purchaseOrderIds: selected },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            toast.success("RFQ request sent");

            setSelected([]);

            // ✅ VERY IMPORTANT
            dispatch(
                fetchPurchaseOrders({
                    page,
                    limit,
                    fromDate: fromDate?.toISOString(),
                    toDate: toDate?.toISOString(),
                    search,
                })
            );

        } catch (error) {
            toast.error("Failed to send RFQ");
        }
    };


    useEffect(() => {
        if (organisationId) {
            dispatch(fetchProjects({}))
            dispatch(fetchInventoryMaster({ type: "supplier" }));
            dispatch(fetchMaterials({ page, limit }));
        }
        dispatch(fetchMasterData("location"));

    }, [dispatch, organisationId])

    useEffect(() => {
        if (!organisationId) return;

        dispatch(
            fetchPurchaseOrders({
                page,
                limit,
                fromDate: fromDate?.toISOString(),
                toDate: toDate?.toISOString(),
                search,
            })
        );
    }, [dispatch, organisationId, page, limit, fromDate, toDate, search]);



    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Purchase Orders</h1>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCreateOpen(true)}>
                        Add Purchase Order
                    </Button>

                    <Button
                        disabled={selected.length === 0}
                        onClick={handleSendToRFQ}
                    >
                        Send to RFQ
                    </Button>

                </div>
            </div>

            {/* Filters */}
            {/* Filters */}
            <div className="flex gap-4 items-center">

                {/* From Date */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn("w-[150px] justify-start text-left")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fromDate ? fromDate.toDateString() : "From date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                        <Calendar mode="single" selected={fromDate} onSelect={setFromDate} />
                    </PopoverContent>
                </Popover>

                {/* To Date */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn("w-[150px] justify-start text-left")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {toDate ? toDate.toDateString() : "To date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                        <Calendar mode="single" selected={toDate} onSelect={setToDate} />
                    </PopoverContent>
                </Popover>

                {/* Search */}
                <Input
                    placeholder="Search PO / Supplier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-[250px]"
                />

                {/* 🔥 Reset Button */}
                <Button
                    variant="ghost"
                    onClick={handleResetFilters}
                    className="text-muted-foreground"
                >
                    Reset
                </Button>

            </div>


            {/* Table */}
            <div className="border rounded-lg p-3">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Checkbox
                                    checked={selected.length === list.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>PO No</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>   {/* ✅ ADD THIS */}
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>


                    <TableBody>
                        {list?.map((po) => (
                            <TableRow key={po._id} className="hover:bg-muted/40 transition">
                                <TableCell>
                                    <Checkbox
                                        checked={selected.includes(po._id)}
                                        onCheckedChange={() => toggleSelect(po._id)}
                                    />
                                </TableCell>

                                <TableCell className="font-medium">
                                    {po.poNumber}
                                </TableCell>

                                <TableCell>{po.supplier}</TableCell>

                                <TableCell>{po.rawMaterialName}</TableCell>

                                <TableCell>
                                    {new Date(po.poDate).toLocaleDateString("en-IN")}
                                </TableCell>

                                <TableCell>
                                    {getLocationName(po.location)}
                                </TableCell>

                                <TableCell>
                                    <Badge className={`${getStatusStyle(po.status)} font-medium`}>
                                        {po.status}
                                    </Badge>

                                </TableCell>

                                <TableCell>
                                    <div className="flex justify-center items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setViewPO(po);
                                                setViewOpen(true);
                                            }}
                                        >
                                            <Eye size={16} />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditPO(po);
                                                setEditOpen(true);
                                            }}
                                        >
                                            <Pencil size={16} />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeletePO(po._id)}
                                        >
                                            <Trash size={16} className="text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>


                </Table>
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>

            </div>

            {/* 🔹 View Purchase Order Modal */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Purchase Order Details</DialogTitle>
                    </DialogHeader>

                    {viewPO && (
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">PO Number</span>
                                <span className="font-medium">{viewPO.poNumber}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Supplier</span>
                                <span className="font-medium">{viewPO.supplier}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date</span>
                                <span>
                                    {new Date(viewPO.poDate).toLocaleDateString("en-IN")}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Status</span>
                                <Badge
                                    variant={
                                        viewPO.status === "Draft"
                                            ? "secondary"
                                            : viewPO.status === "Approved"
                                                ? "default"
                                                : "success"
                                    }
                                >
                                    {viewPO.status}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Items</span>
                                <span>{viewPO.rawMaterialName ?? "—"}</span>
                            </div>

                            {/* <div className="flex justify-between text-base font-semibold">
                                <span>Total Price</span>
                                <span>₹{viewPO.totalPrice.toLocaleString()}</span>
                            </div> */}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* 🔹 Create Purchase Order Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 rounded-xl">

                    {/* 🔹 HEADER (Fixed) */}
                    <div className="p-6 border-b">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                Create Purchase Order
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Fill in the required details to generate a new purchase order.
                            </p>
                        </DialogHeader>
                    </div>

                    {/* 🔹 SCROLLABLE BODY */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">

                        <div className="space-y-8">

                            {/* 🔸 BASIC INFORMATION */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Basic Information
                                </h3>

                                {/* Project */}
                                <div className="space-y-2">
                                    <Label>Project</Label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        value={projectId}
                                        onChange={(e) => {
                                            setProjectId(e.target.value);
                                            setItem("");
                                        }}
                                    >
                                        <option value="">Select project...</option>
                                        {projects.map((p) => (
                                            <option key={p._id} value={p._id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Supplier */}
                                <div className="space-y-2">
                                    <Label>Supplier</Label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        value={supplierValue}
                                        onChange={(e) => setSupplierValue(e.target.value)}
                                    >
                                        <option value="">Select supplier...</option>
                                        {supplierList.map((s) => (
                                            <option key={s._id ?? s} value={s.name ?? s}>
                                                {s.name ?? s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 🔸 ITEM DETAILS */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Item Details
                                </h3>

                                <div className="grid grid-cols-2 gap-6">

                                    {/* Item */}
                                    <div className="col-span-2 space-y-2">
                                        <Label>Item</Label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                            value={rawMaterialId ?? ""}
                                            onChange={(e) => {
                                                const rm = materials.find(r => r._id === e.target.value);
                                                setRawMaterialId(rm?._id ?? null);
                                                setRawMaterialName(rm?.name ?? "");
                                            }}
                                        >
                                            <option value="">Select item...</option>
                                            {materials.map((rm) => (
                                                <option key={rm._id} value={rm._id}>
                                                    {rm.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quantity */}
                                    <div className="space-y-2">
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                        />
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-2">
                                        <Label>Location</Label>

                                        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-between"
                                                    disabled={isLocationRestricted}
                                                >
                                                    {locationId
                                                        ? locations.find((l) => l._id === locationId)?.name
                                                        : "Select Location"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>

                                            {!isLocationRestricted && (
                                                <PopoverContent className="p-0 w-full">
                                                    <Command>
                                                        <CommandInput placeholder="Search location..." />
                                                        <CommandList>
                                                            <CommandEmpty>No location found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {locations.map((l) => (
                                                                    <CommandItem
                                                                        key={l._id}
                                                                        value={l.name}
                                                                        onSelect={() => {
                                                                            setLocationId(l._id);
                                                                            setLocationOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                locationId === l._id
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
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
                                            <p className="text-xs text-muted-foreground">
                                                * Location is fixed based on your permissions.
                                            </p>
                                        )}
                                    </div>

                                    {/* PO Date */}
                                    <div className="col-span-2 space-y-2">
                                        <Label>PO Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left",
                                                        !poDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {poDate
                                                        ? poDate.toLocaleDateString("en-IN")
                                                        : "Select date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={poDate}
                                                    onSelect={setPoDate}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>

                    {/* 🔹 FOOTER (Fixed) */}
                    <div className="p-6 border-t flex justify-end gap-3 bg-background">
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreatePO} className="px-6">
                            Create PO
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>


            {/* 🔹 Update Purchase Order Modal */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Update Purchase Order</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Modify purchase order details
                        </p>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {/* Project */}
                        <div className="col-span-2">
                            <label className="text-sm font-medium">Project</label>
                            <select
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                value={projectId}
                                onChange={(e) => {
                                    setProjectId(e.target.value);
                                    setItem("");
                                }}
                            >
                                <option value="">Select project...</option>
                                {projects.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Item</label>
                            <select
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                value={item}
                                disabled={!selectedProject}
                                onChange={(e) => setItem(e.target.value)}
                            >
                                <option value="">Select item...</option>
                                {selectedProject?.items?.map((i) => (
                                    <option key={i} value={i}>
                                        {i}
                                    </option>
                                ))}
                            </select>

                        </div>

                        {/* Supplier */}
                        <div className="col-span-2">
                            <label className="text-sm font-medium">Supplier</label>
                            <select
                                value={supplierValue}
                                onChange={(e) => setSupplierValue(e.target.value)}
                            >
                                <option value="">Select supplier...</option>
                                {supplierList.map((s) => (
                                    <option key={s._id ?? s} value={s.name ?? s}>
                                        {s.name ?? s}
                                    </option>
                                ))}
                            </select>

                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="text-sm font-medium">Quantity</label>
                            <Input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>

                        {/* PO Date */}
                        <div>
                            <label className="text-sm font-medium">PO Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left",
                                            !poDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {poDate ? poDate.toDateString() : "dd-mm-yyyy"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <Calendar
                                        mode="single"
                                        selected={poDate}
                                        onSelect={setPoDate}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdatePO}>
                            Update Purchase Order
                        </Button>

                    </div>
                </DialogContent>
            </Dialog>


        </div>
    );
}
