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

    // const [supplierValue, setSupplierValue] = useState("");

    const { list, loading, pagination } = useSelector(
        (state: RootState) => state.purchaseOrdersInventory
    );
    const [locationOpen, setLocationOpen] = useState(false);
    const [locationId, setLocationId] = useState<string | null>(null);

    const [customItemIndex, setCustomItemIndex] = useState<number | null>(null);


    const resetForm = () => {
        setLocationId(null);
        setPoDate(undefined);

        setItems([
            {
                projectId: "",
                rawMaterialId: "",
                rawMaterialName: "",
                quantity: 1,
                price: 0,
                isCustom: false,
            },
        ]);
    };


    const addItem = () => {
        setItems([
            ...items,
            {
                projectId: "",
                rawMaterialId: "",
                rawMaterialName: "",
                quantity: 1,
                isCustom: false, // ✅ ADD
            },
        ]);
    };
    ;

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };
    const handleChange = (index: number, field: string, value: any) => {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                let updatedItem = { ...item, [field]: value };

                // 🔥 If switching to custom mode
                if (field === "isCustom" && value === true) {
                    updatedItem = {
                        ...updatedItem,
                        rawMaterialId: "",
                        rawMaterialName: "",
                    };
                }

                // 🔥 If selecting normal material
                if (field === "rawMaterialId") {
                    const material = materials.find((m) => m._id === value);
                    updatedItem = {
                        ...updatedItem,
                        rawMaterialName: material?.name || "",
                        isCustom: false,
                    };
                }

                return updatedItem;
            })
        );
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
    // const { supplier: supplierList = [] } =
    // useSelector((state: RootState) => state.inventoryMaster);

    // raw materials
    // const [rawMaterialId, setRawMaterialId] = useState<string | null>(null);
    // const [rawMaterialName, setRawMaterialName] = useState("");

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
    const [items, setItems] = useState([
        {
            projectId: "",
            rawMaterialId: "",
            rawMaterialName: "",
            quantity: 1,
            price: 0,
            isCustom: false,
        },
    ]);

    // const [supplier, setSupplier] = useState("");
    // const [item, setItem] = useState("");
    // const [quantity, setQuantity] = useState(1);
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
        if (!locationId || !poDate) {
            alert("Please fill required fields");
            return;
        }

        const invalidItem = items.some((item) => {
            if (!item.projectId || !item.quantity) return true;

            if (item.isCustom) {
                return !item.rawMaterialName;   // custom must have name
            } else {
                return !item.rawMaterialId;     // normal must have ID
            }
        });



        if (invalidItem) {
            alert("Please complete all item fields");
            return;
        }

        // ✅ Find the full location object to get the name
        const selectedLocation = locations.find(l => l._id === locationId);

        dispatch(
            createPurchaseOrder({
                location: locationId,
                locationName: selectedLocation?.name, // [!code ++] // Add this line
                poDate: poDate?.toISOString(),
                items,
            })
        ).then(() => {

            setCreateOpen(false);
            resetForm();
        });
    };

    const handleUpdatePO = () => {
        if (!editPO || !locationId || !poDate) return;

        const selectedLocation = locations.find(
            (l) => l._id === locationId
        );

        dispatch(
            updatePurchaseOrder({
                id: editPO._id,
                data: {
                    location: locationId,
                    locationName: selectedLocation?.name,
                    poDate: poDate.toISOString(),
                    items,   // 🔥 send full array
                },
            })
        ).then(() => {
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
            // dispatch(fetchInventoryMaster({ type: "supplier" }));
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

    // Permission check
    if (!canView) {
        return (
            <div className="text-center py-12 px-4">
                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">You do not have the necessary permissions to view quality checks.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Purchase Orders</h1>

                <div className="flex gap-2">
                    {canCreate && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                resetForm();   // 🔥 clear everything
                                setCreateOpen(true);
                            }}
                        >
                            Add Purchase Order
                        </Button>

                    )}

                    {canCreate && (
                        <Button
                            disabled={selected.length === 0}
                            onClick={handleSendToRFQ}
                        >
                            Send to RFQ
                        </Button>
                    )}


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
                    placeholder="Search PO ...."
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
                            {/* <TableHead>Supplier</TableHead> */}
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

                                {/* <TableCell>{po.supplier}</TableCell> */}

                                <TableCell>
                                    {po.items?.map((item: any, i: number) => (
                                        <div key={i}>
                                            {item.rawMaterialName} (Qty: {item.quantity})
                                        </div>
                                    ))}
                                </TableCell>


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

                                        {canEdit && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setEditPO(po);
                                                    setLocationId(
                                                        typeof po.location === "string"
                                                            ? po.location
                                                            : po.location._id
                                                    );
                                                    setPoDate(new Date(po.poDate));
                                                    setItems(
                                                        po.items.map((item: any) => ({
                                                            ...item,
                                                            isCustom: item.isCustom ?? !item.rawMaterialId,
                                                        }))
                                                    );

                                                    setEditOpen(true);
                                                }}
                                            >
                                                <Pencil size={16} />
                                            </Button>
                                        )}



                                        {canDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeletePO(po._id)}
                                            >
                                                <Trash size={16} className="text-red-500" />
                                            </Button>
                                        )}

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
                                <span className="text-muted-foreground">Date</span>
                                <span>
                                    {new Date(viewPO.poDate).toLocaleDateString("en-IN")}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Location</span>
                                <span>{viewPO.locationName}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Status</span>
                                <Badge>{viewPO.status}</Badge>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="text-sm font-semibold mb-2">Items</h4>

                                <div className="space-y-2">
                                    {viewPO.items?.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between border rounded-md px-3 py-2 bg-muted/30"
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {item.rawMaterialName}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Qty: {item.quantity}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                </DialogContent>
            </Dialog>

            {/* 🔹 Create Purchase Order Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 rounded-xl">

                    {/* HEADER */}
                    <div className="p-6 border-b">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                Create Purchase Order
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Add one or more items to generate a purchase order.
                            </p>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                        {/* ===== MAIN ITEM (Original Layout) ===== */}
                        <div className="space-y-4">

                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Item Details
                            </h3>

                            {/* Project */}
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    value={items[0]?.projectId}
                                    onChange={(e) =>
                                        handleChange(0, "projectId", e.target.value)
                                    }
                                >
                                    <option value="">Select project...</option>
                                    {projects.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Item */}
                            {/* Item */}
                            <div className="space-y-2">
                                <Label>Item</Label>

                                {items[0]?.isCustom ? (
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Enter custom item name..."
                                            value={items[0]?.rawMaterialName}
                                            onChange={(e) =>
                                                handleChange(0, "rawMaterialName", e.target.value)
                                            }
                                        />

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                handleChange(0, "isCustom", false);
                                                handleChange(0, "rawMaterialName", "");
                                            }}
                                        >
                                            ← Back
                                        </Button>
                                    </div>
                                ) : (
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        value={items[0]?.rawMaterialId}
                                        onChange={(e) => {
                                            if (e.target.value === "other") {
                                                setItems(prev =>
                                                    prev.map((item, i) =>
                                                        i === 0
                                                            ? {
                                                                ...item,
                                                                isCustom: true,
                                                                rawMaterialId: "",
                                                                rawMaterialName: "",
                                                            }
                                                            : item
                                                    )
                                                );
                                            }
                                            else {
                                                const mat = materials.find(
                                                    (m) => m._id === e.target.value
                                                );
                                                handleChange(0, "rawMaterialId", e.target.value);
                                                handleChange(0, "rawMaterialName", mat?.name || "");
                                            }
                                        }}
                                    >
                                        <option value="">Select item...</option>

                                        {materials.map((rm) => (
                                            <option key={rm._id} value={rm._id}>
                                                {rm.name}
                                            </option>
                                        ))}

                                        <option value="other">Other (Custom)</option>
                                    </select>
                                )}
                            </div>



                            {/* Quantity + Location */}
                            <div className="grid grid-cols-2 gap-6">

                                <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={items[0]?.quantity}
                                        onChange={(e) =>
                                            handleChange(0, "quantity", Number(e.target.value))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                {locationId
                                                    ? locations.find((l) => l._id === locationId)?.name
                                                    : "Select Location"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
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
                                                                {l.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                            </div>

                            {/* PO Date */}
                            <div className="space-y-2">
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

                        {/* ===== ADDITIONAL ITEMS ===== */}
                        {items.slice(1).map((item, index) => {
                            const actualIndex = index + 1;
                            return (
                                <div key={actualIndex} className="border rounded-lg p-4 space-y-4 bg-muted/20 relative">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Additional Item #{actualIndex}
                                        </h3>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="h-7 px-2"
                                            onClick={() => removeItem(actualIndex)}
                                        >
                                            Remove
                                        </Button>
                                    </div>

                                    {/* Project */}
                                    <div className="space-y-2">
                                        <Label>Project</Label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            value={item.projectId}
                                            onChange={(e) => handleChange(actualIndex, "projectId", e.target.value)}
                                        >
                                            <option value="">Select project...</option>
                                            {projects.map((p) => (
                                                <option key={p._id} value={p._id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Item */}
                                    <div className="space-y-2">
                                        <Label>Item</Label>

                                        {item.isCustom ? (
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="Enter custom item name..."
                                                    value={item.rawMaterialName}
                                                    onChange={(e) =>
                                                        handleChange(actualIndex, "rawMaterialName", e.target.value)
                                                    }
                                                />

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        handleChange(actualIndex, "isCustom", false);
                                                        handleChange(actualIndex, "rawMaterialName", "");
                                                    }}
                                                >
                                                    ← Back
                                                </Button>
                                            </div>
                                        ) : (
                                            <select
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                                value={item.rawMaterialId}
                                                onChange={(e) => {
                                                    const value = e.target.value;

                                                    setItems((prev) =>
                                                        prev.map((it, i) => {
                                                            if (i !== actualIndex) return it;

                                                            // 🔥 If custom selected
                                                            if (value === "other") {
                                                                return {
                                                                    ...it,
                                                                    isCustom: true,
                                                                    rawMaterialId: "",
                                                                    rawMaterialName: "",
                                                                };
                                                            }

                                                            // 🔥 If normal material selected
                                                            const mat = materials.find((m) => m._id === value);

                                                            return {
                                                                ...it,
                                                                isCustom: false,
                                                                rawMaterialId: value,
                                                                rawMaterialName: mat?.name || "",
                                                            };
                                                        })
                                                    );
                                                }}
                                            >
                                                <option value="">Select item...</option>

                                                {materials.map((rm) => (
                                                    <option key={rm._id} value={rm._id}>
                                                        {rm.name}
                                                    </option>
                                                ))}

                                                <option value="other">Other (Custom)</option>
                                            </select>
                                        )}
                                    </div>



                                    {/* Quantity - You can keep this in a grid or full width to match top */}
                                    <div className="space-y-2">
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => handleChange(actualIndex, "quantity", Number(e.target.value))}
                                        />
                                    </div>


                                </div>
                            );
                        })}

                        {/* ADD MORE BUTTON */}
                        <Button variant="outline" onClick={addItem}>
                            + Add More Item
                        </Button>

                    </div>



                    {/* FOOTER */}
                    <div className="p-6 border-t flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreatePO}>
                            Create Purchase Order
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>



            {/* 🔹 Update Purchase Order Modal */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 rounded-xl">

                    {/* HEADER */}
                    <div className="p-6 border-b">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                Update Purchase Order
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                        {/* LOCATION + DATE */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* ... Location and Date inputs remain unchanged ... */}
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            {locationId
                                                ? locations.find((l) => l._id === locationId)?.name
                                                : "Select Location"}
                                        </Button>
                                    </PopoverTrigger>
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
                                                            {l.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* PO Date */}
                            <div className="space-y-2">
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

                        {/* ITEMS */}
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 space-y-4 bg-muted/20"
                            >

                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">
                                        Item #{index + 1}
                                    </h4>

                                    {items.length > 1 && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => removeItem(index)}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>

                                {/* Project */}
                                <div className="space-y-2">
                                    <Label>Project</Label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        value={item.projectId}
                                        onChange={(e) =>
                                            handleChange(index, "projectId", e.target.value)
                                        }
                                    >
                                        <option value="">Select project...</option>
                                        {projects.map((p) => (
                                            <option key={p._id} value={p._id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Item - Updated to Support Custom Input */}
                                <div className="space-y-2">
                                    <Label>Item</Label>

                                    {item.isCustom ? (
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Enter custom item name..."
                                                value={item.rawMaterialName}
                                                onChange={(e) =>
                                                    handleChange(index, "rawMaterialName", e.target.value)
                                                }
                                            />

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    handleChange(index, "isCustom", false);
                                                    handleChange(index, "rawMaterialName", "");
                                                    handleChange(index, "rawMaterialId", ""); // Reset ID
                                                }}
                                            >
                                                ← Back to List
                                            </Button>
                                        </div>
                                    ) : (
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            value={item.rawMaterialId}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                setItems((prev) =>
                                                    prev.map((it, i) => {
                                                        if (i !== index) return it;

                                                        // 🔥 If Custom Selected
                                                        if (value === "other") {
                                                            return {
                                                                ...it,
                                                                isCustom: true,
                                                                rawMaterialId: "",
                                                                rawMaterialName: "",
                                                            };
                                                        }

                                                        // 🔥 If Normal Material Selected
                                                        const mat = materials.find((m) => m._id === value);

                                                        return {
                                                            ...it,
                                                            isCustom: false,
                                                            rawMaterialId: value,
                                                            rawMaterialName: mat?.name || "",
                                                        };
                                                    })
                                                );
                                            }}
                                        >
                                            <option value="">Select item...</option>

                                            {materials.map((rm) => (
                                                <option key={rm._id} value={rm._id}>
                                                    {rm.name}
                                                </option>
                                            ))}

                                            <option value="other">Other (Custom)</option>
                                        </select>
                                    )}
                                </div>


                                {/* Quantity */}
                                <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) =>
                                            handleChange(
                                                index,
                                                "quantity",
                                                Number(e.target.value)
                                            )
                                        }
                                    />
                                </div>

                            </div>
                        ))}

                        <Button variant="outline" onClick={addItem}>
                            + Add More Item
                        </Button>

                    </div>

                    {/* FOOTER */}
                    <div className="p-6 border-t flex justify-end gap-3">
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
