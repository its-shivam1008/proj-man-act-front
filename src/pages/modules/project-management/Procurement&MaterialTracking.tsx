"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";

// UI Components
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Tooltip, TooltipProvider } from "../../../components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../../components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../../../components/ui/command";
import { createNotification } from "@/redux/slices/notificationSlice";
// import { Textarea } from "../../../components/ui/textarea";
import {toast} from 'sonner';
// Icons
import { Plus, Edit2, Trash2, Truck, ShoppingCart, Check, ChevronsUpDown, ShoppingCartIcon, ShieldAlert } from "lucide-react";

// Redux Actions
import {
    fetchMRS,
    createMRS,
    updateMRS,
    deleteMRS,
} from "@/redux/slices/mrsSlice";
import { convertToPR } from "@/redux/slices/prSlice";
import { receivePO } from "@/redux/slices/poSlice";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchWbsByProject, WBSItem } from "@/redux/slices/wbsSlice";
import { fetchMaterials, RawMaterial } from "@/redux/slices/rawmaterialSlice";

// Hooks
import { useDebounce } from "@/hooks/useDebounce";
import { usePermission } from "@/hooks/userPermission";

// --- Types ---
type MRSItem = {
    id: string;
    _id?: string;
    projectId?: string;
    task?: string;
    item: string; // This will hold Raw Material Name
    quantity: number;
    price?: number;
    requiredDate?: string;
    status?: "open" | "sent" | "ordered" | "received" | "cancelled" | "planned";
    remarks?: string;
    createdAt?: string;
    updatedAt?: string;
    isWbsLinked?: boolean; // Helper flag
    unit?: string; // Helper for display
};

type PurchaseRequest = {
    id: string;
    _id?: string;
    mrsIds: string[];
    createdAt: string;
    status: "open" | "converted" | "closed";
};

type PurchaseOrder = {
    id: string;
    _id?: string;
    prId: string;
    supplier?: string;
    poNo?: string;
    items: { mrsId: string; item: string; qty: number }[];
    createdAt: string;
    deliveryDate?: string;
    received?: number;
    issued?: number;
    status?: "open" | "delivered" | "partial" | "closed";
};

type InventoryItem = {
    id: string;
    item: string;
    qty: number;
    uom?: string;
    location?: string;
};

// --- Helper: Generate ID ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Local Inventory Helpers ---
const getInventory = (): InventoryItem[] => {
    const stored = localStorage.getItem('INVENTORY');
    return stored ? JSON.parse(stored) : [];
};
const saveInventory = (list: InventoryItem[]) => localStorage.setItem('INVENTORY', JSON.stringify(list));

// --- Component ---
export default function ProcurementPage() {
    const dispatch = useDispatch<AppDispatch>();

    const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
    const [remarkText, setRemarkText] = useState("");
    const [notificationTarget, setNotificationTarget] = useState<{
        item: MRSItem;
        type: "INVENTORY" | "PURCHASE"; // To distinguish between the two buttons
    } | null>(null);

    const canView = usePermission('procurementMaterialTracking', 'view');
    const canCreate = usePermission('procurementMaterialTracking', 'create');
    const canEdit = usePermission('procurementMaterialTracking', 'edit');
    const canDelete = usePermission('procurementMaterialTracking', 'delete');


    const handleOpenRemarkDialog = (item: MRSItem, type: "INVENTORY" | "PURCHASE") => {
        setNotificationTarget({ item, type });
        setRemarkText(""); // Reset remark
        setRemarkDialogOpen(true);
    };

    // --- NEW FUNCTION: Submit Notification ---
    const handleSubmitNotification = async () => {
        if (!notificationTarget) return;
        if (!remarkText.trim()) {
            toast.error("Please enter a remark.");
            return;
        }

        const { item, type } = notificationTarget;

        // Define Source and Destination based on your requirements
        const source = "procurement.project-management";
        const destination = type === "INVENTORY" 
            ? "delivery.inventory"   // Clicked "Sent" button
            : "rfq.purchase";        // Clicked "Send" button

        try {
            // Create notification with complete item details
            await dispatch(createNotification({
                source,
                destination,
                remark: remarkText,
                itemId: item.id || item._id,
                itemName: item.item,
                materialData: {
                    item: item.item,
                    sourceTask: item.task || 'N/A',
                    quantity: item.quantity,
                    unit: item.unit || 'units',
                    requiredDate: item.requiredDate || new Date().toISOString(),
                    sentDate: new Date().toISOString(),
                    projectId: item.projectId || selectedProjectId,
                    projectName: selectedProject?.name || 'N/A',
                    status: item.status || 'sent'
                }
            })).unwrap();

            toast.success(`Notification sent to ${type === "INVENTORY" ? "Delivery Management" : "Purchase"}`);
            setRemarkDialogOpen(false);
            setNotificationTarget(null);
        } catch (error) {
            toast.error("Failed to send notification");
            console.error(error);
        }
    };
    // Redux Selectors
    const mrsListRaw = useSelector((state: RootState) => state.mrs.list) as MRSItem[];
    const wbsList = useSelector((state: RootState) => state.wbs.wbs) as WBSItem[]; 
    const rawMaterials = useSelector((state: RootState) => state.rawMaterials.materials) as RawMaterial[];
    const projects = useSelector((state: RootState) => state.projects.projects);
    const prs = useSelector((state: RootState) => state.pr.list) as PurchaseRequest[];
    const pos = useSelector((state: RootState) => state.po.list) as PurchaseOrder[];
    
    // Loading States
    const mrsLoading = useSelector((state: RootState) => state.mrs.loading);
    const prLoading = useSelector((state: RootState) => state.pr.loading);
    const poLoading = useSelector((state: RootState) => state.po.loading);
    const projectLoading = useSelector((state: RootState) => state.projects.loading);
    const wbsLoading = useSelector((state: RootState) => state.wbs.loading);

    // Local State
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [mrsStatusSync, setMrsStatusSync] = useState<Record<string, string>>({});
    
    // Pagination State
    const [mrsPage, setMrsPage] = useState(1);
    const MRS_PAGE_SIZE = 10;
    const [statusPage, setStatusPage] = useState(1);
    const STATUS_PAGE_SIZE = 10;

    // Project Selection State
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState("");
    const debouncedProjectSearch = useDebounce(projectSearch, 500);

    // Dialog / Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<MRSItem | null>(null);
    const [form, setForm] = useState<Partial<MRSItem>>({ item: "", quantity: 1, price: 0, requiredDate: "" });
    const [multipleItems, setMultipleItems] = useState<Partial<MRSItem>[]>([]);
    const [taskPopoverOpen, setTaskPopoverOpen] = useState(false);
    const [taskSearch, setTaskSearch] = useState("");

    // Initial Data Load
    useEffect(() => {
        dispatch(fetchMRS());
        dispatch(fetchMaterials()); // Fetch Raw Materials to map names
        setInventory(getInventory());
        
        // Load MRS status sync from localStorage
        const syncData = localStorage.getItem('MRS_STATUS_SYNC');
        if (syncData) {
            setMrsStatusSync(JSON.parse(syncData));
        }
    }, [dispatch]);
    
    // Refresh MRS status sync periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const syncData = localStorage.getItem('MRS_STATUS_SYNC');
            if (syncData) {
                setMrsStatusSync(JSON.parse(syncData));
            }
        }, 2000); // Check every 2 seconds
        
        return () => clearInterval(interval);
    }, []);

    // Fetch Projects when search changes
    useEffect(() => {
        dispatch(fetchProjects({ search: debouncedProjectSearch, page: 1, limit: 10 }));
    }, [debouncedProjectSearch, dispatch]);

    // Fetch WBS when Project is Selected
    useEffect(() => {
        if (selectedProjectId) {
            dispatch(fetchWbsByProject(selectedProjectId));
        }
    }, [selectedProjectId, dispatch]);

    const selectedProject = projects.find((p) => p._id === selectedProjectId);

    // Helper function to build hierarchical path for WBS items
    const getWbsHierarchicalPath = (item: WBSItem, allWbs: WBSItem[]): string => {
        const path: string[] = [item.name];
        let currentItem: WBSItem | undefined = item;
        
        while (currentItem?.parentId) {
            const parent = allWbs.find(w => w.id === currentItem.parentId);
            if (parent) {
                path.unshift(parent.name);
                currentItem = parent;
            } else {
                break;
            }
        }
        
        return path.join(" > ");
    };

    // Filter WBS items for selected project
    const projectWbsItems = useMemo(() => {
        if (!selectedProjectId) return [];
        return wbsList.filter((item) => item.projectId === selectedProjectId);
    }, [wbsList, selectedProjectId]);

    // --- DATA TRANSFORMATION: Filter & Merge ---
    const displayedMrsList = useMemo(() => {
        // 1. If NO project is selected, show only MRS items that don't have a projectId
        if (!selectedProjectId) {
            return mrsListRaw.filter(item => !item.projectId || item.projectId === null || item.projectId === undefined);
        }

        // 2. If Project IS selected, combine:
        //    a) WBS Linked Materials
        //    b) Manually created MRS items for this project
        
        const wbsDerivedItems: MRSItem[] = [];
        
        // Iterate through all WBS items for this project
        wbsList.forEach((wbsItem) => {
            if (wbsItem.linkedMaterials && wbsItem.linkedMaterials.length > 0) {
                wbsItem.linkedMaterials.forEach((link) => {
                    // Find the Raw Material details using the ID stored in WBS
                    const rawMat = rawMaterials.find(r => r._id === link.materialId);

                    if (rawMat) {
                        wbsDerivedItems.push({
                            id: `${wbsItem.id}-${link.materialId}`, // Create a temporary unique ID
                            _id: link.materialId, // Keep reference
                            projectId: selectedProjectId,
                            task: wbsItem.name, // The WBS Task Name
                            item: rawMat.name, // The Raw Material Name
                            quantity: link.quantity,
                            unit: link.unit || rawMat.unit,
                            status: "planned", // Mark as planned coming from WBS
                            requiredDate: wbsItem.startDate, // Use task start date
                            isWbsLinked: true, // Flag to disable editing in MRS view
                        });
                    }
                });
            }
        });

        // Get manually created MRS items for this project
        // Compare projectId as strings to handle ObjectId vs string comparison
        const manualMrsItems = mrsListRaw.filter(item => {
            const itemProjectId = String(item.projectId || '');
            const selectedId = String(selectedProjectId || '');
            return itemProjectId === selectedId && !item.isWbsLinked;
        });

        // Combine both: WBS-linked items and manually created items
        return [...wbsDerivedItems, ...manualMrsItems];

    }, [selectedProjectId, mrsListRaw, wbsList, rawMaterials]);

    // --- Pagination Logic (Applied to the Derived List) ---
    const mrsTotalPages = Math.max(1, Math.ceil((displayedMrsList?.length || 0) / MRS_PAGE_SIZE));
    const paginatedMrsItems = useMemo(() => {
        const start = (mrsPage - 1) * MRS_PAGE_SIZE;
        return displayedMrsList.slice(start, start + MRS_PAGE_SIZE);
    }, [displayedMrsList, mrsPage]);

    useEffect(() => {
        setMrsPage(1); // Reset page on filter change
    }, [displayedMrsList.length]);


    // --- CRUD Actions ---
    const persistInventory = (list: InventoryItem[]) => {
        setInventory(list);
        saveInventory(list);
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ item: "", quantity: 1, price: 0, requiredDate: "", projectId: selectedProjectId || undefined });
        setMultipleItems([]);
        setIsDialogOpen(true);
    };

    const addMoreMRSItem = () => {
        // Validate current form
        if (!form.item?.trim() || form.quantity === undefined || form.quantity < 1) {
            toast.error("Please fill Item and Quantity before adding more.");
            return;
        }

        // Add current form to multipleItems
        setMultipleItems([...multipleItems, { ...form }]);
        
        // Reset form for next item but keep project and task
        setForm({
            item: "",
            quantity: 1,
            price: 0,
            requiredDate: "",
            projectId: form.projectId,
            task: form.task,
        });
        
        toast.success(`${multipleItems.length + 1} item(s) ready to save. Fill in the next item.`);
    };

    const openEdit = (m: MRSItem) => {
        if (m.isWbsLinked) {
            alert(`This item is linked to WBS Task: "${m.task}". Please edit it in the WBS module.`);
            return;
        }
        setEditing(m);
        setForm(m);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        // If editing, use single form
        if (editing) {
            if (!form.item?.trim() || form.quantity === undefined || form.quantity < 1) {
                toast.error("Item and quantity are required");
                return;
            }
            const cleanForm: Partial<MRSItem> = {
                ...form,
                item: form.item.trim(),
                quantity: Number(form.quantity),
                price: form.price ? Number(form.price) : undefined,
                requiredDate: form.requiredDate ? form.requiredDate : undefined,
                projectId: form.projectId || selectedProjectId || undefined, 
            };
            
            await dispatch(updateMRS({ id: editing._id || editing.id, data: cleanForm }));
            await dispatch(fetchMRS());
            
            setIsDialogOpen(false);
            setEditing(null);
            setForm({ item: "", quantity: 1, price: 0, requiredDate: "" });
            return;
        }

        // For creating - validate current form
        if (!form.item?.trim() || form.quantity === undefined || form.quantity < 1) {
            toast.error("Item and quantity are required");
            return;
        }

        // Combine multipleItems with current form
        const allItems = [...multipleItems, form];

        // Save all items
        for (const item of allItems) {
            const cleanForm: Partial<MRSItem> = {
                ...item,
                item: item.item?.trim(),
                quantity: Number(item.quantity),
                price: item.price ? Number(item.price) : undefined,
                requiredDate: item.requiredDate ? item.requiredDate : undefined,
                projectId: item.projectId || selectedProjectId || undefined, 
            };
            
            await dispatch(createMRS(cleanForm));
        }
        
        // Refetch MRS list
        await dispatch(fetchMRS());
        
        toast.success(`${allItems.length} MRS item(s) created successfully.`);
        
        setIsDialogOpen(false);
        setEditing(null);
        setMultipleItems([]);
        setForm({ item: "", quantity: 1, price: 0, requiredDate: "" });
    };

    const handleDelete = async (id: string, isWbsLinked?: boolean) => {
        if (isWbsLinked) {
            alert("Cannot delete WBS linked items here. Remove the link in the WBS module.");
            return;
        }
        await dispatch(deleteMRS(id));
    };

    // --- Purchase Logic ---
    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
    const toggleSelect = (id: string) => setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
    const selectedList = Object.keys(selectedIds).filter((k) => selectedIds[k]);

    const sendToPurchase = async (mrsIds: string[], supplier?: string, deliveryDate?: string) => {
        if (!mrsIds || mrsIds.length === 0) return;
        
        const payload = {
            mrsIds: mrsIds.filter(id => id?.trim()),
            supplier: supplier?.trim(),
            deliveryDate,
        };
        try {
            await dispatch(convertToPR(payload)).unwrap();
            setSelectedIds({});
        } catch (err: any) {
            console.error('Send to Purchase failed:', err);
        }
    };

    const checkStockAvailability = (itemName: string) => {
        const found = inventory.find((it) => it.item.toLowerCase() === itemName.toLowerCase());
        return found ? found.qty : 0;
    };

    const receiveAgainstPO = async (poId: string, qtyReceived: number) => {
        await dispatch(receivePO({ poId, qty: qtyReceived }));
        const po = pos.find(p => p.id === poId || p._id === poId);
        if (po) {
            const inv = getInventory();
            (po.items || []).forEach((it) => {
                const existing = inv.find((x) => x.item.toLowerCase() === it.item.toLowerCase());
                if (existing) {
                    existing.qty += qtyReceived; 
                } else {
                    inv.push({ id: generateId(), item: it.item, qty: qtyReceived });
                }
            });
            persistInventory(inv);
        }
    };

    const handleCheckStatus = (m: MRSItem) => {
        // 1. Try to find by ID (for WBS items)
        let foundMaterial = rawMaterials.find(r => r._id === m._id);
        
        // 2. If not found, try to find by Name (for manual items)
        if (!foundMaterial) {
            foundMaterial = rawMaterials.find(r => r.name.toLowerCase() === m.item.toLowerCase());
        }

        if (foundMaterial) {
            toast.info(`Current Stock for "${foundMaterial.name}": ${foundMaterial.quantity}`);
        } else {
            // Fallback to 0 if material not found in master list
            toast.warning(`Material "${m.item}" not found in Raw Material master list. Stock: 0`);
        }
    };
    
    const handleItemReceived = (m: MRSItem) => {
        // Mark item as received
        const syncData = JSON.parse(localStorage.getItem('MRS_STATUS_SYNC') || '{}');
        syncData[m.item] = 'received';
        localStorage.setItem('MRS_STATUS_SYNC', JSON.stringify(syncData));
        setMrsStatusSync(syncData);
        
        // Update delivery status to delivered
        const materialRequests = JSON.parse(localStorage.getItem('MATERIAL_REQUESTS') || '[]');
        const updatedRequests = materialRequests.map((req: any) => {
            if (req.item === m.item && req.status === 'in-transit') {
                return { ...req, status: 'delivered' };
            }
            return req;
        });
        localStorage.setItem('MATERIAL_REQUESTS', JSON.stringify(updatedRequests));
        
        toast.success(`${m.item} marked as received and delivery status updated to delivered`);
    };

    // --- Material Status Tracker ---
    const materialStatus = useMemo(() => {
        const rows: any[] = [];
        (pos || []).forEach((po) => {
            (po.items || []).forEach((it) => {
                const invItem = inventory.find((x) => x.item.toLowerCase() === it.item.toLowerCase());
                const received = po.received || 0;
                const issued = po.issued || 0;
                const remaining = (invItem?.qty || 0) - issued;
                rows.push({
                    item: it.item,
                    poNo: po.poNo,
                    supplier: po.supplier,
                    deliveryDate: po.deliveryDate,
                    received,
                    issued,
                    remaining: remaining < 0 ? 0 : remaining,
                });
            });
        });
        return rows;
    }, [pos, inventory]);

    const statusTotalPages = Math.max(1, Math.ceil(materialStatus.length / STATUS_PAGE_SIZE));
    const paginatedMaterialStatus = useMemo(() => {
        const start = (statusPage - 1) * STATUS_PAGE_SIZE;
        return materialStatus.slice(start, start + STATUS_PAGE_SIZE);
    }, [materialStatus, statusPage]);

    // --- UI Metrics ---
    const totalRequired = useMemo(() => (displayedMrsList || []).reduce((s, m) => s + (m.quantity || 0), 0), [displayedMrsList]);
    const totalOpen = useMemo(() => (displayedMrsList || []).filter((m) => m.status === "open" || m.status === "planned").length, [displayedMrsList]);
    const totalSent = useMemo(() => (displayedMrsList || []).filter((m) => m.status === "sent").length, [displayedMrsList]);

    const bootstrapInventory = () => {
        if (inventory.length > 0) return;
        const sample: InventoryItem[] = [
            { id: generateId(), item: "Cement 50kg", qty: 250, uom: "bag" },
            { id: generateId(), item: "Steel 8mm", qty: 1200, uom: "kg" },
        ];
        persistInventory(sample);
    };

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
            {/* Header with Project Selector */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Procurement & Material Tracking</h2>
                    <p className="text-muted-foreground">
                        {selectedProject 
                            ? `Planning materials for: ${selectedProject.name}`
                            : "Manage MRS, Purchase Requests & Inventory"
                        }
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {/* PROJECT SELECTOR POPOVER */}
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={popoverOpen}
                                className="w-full md:w-64 justify-between"
                            >
                                {selectedProject ? (
                                    <span className="truncate">
                                        {selectedProject.code} - {selectedProject.name}
                                    </span>
                                ) : (
                                    "Select Project to Filter MRS"
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput
                                    placeholder="Search projects..."
                                    value={projectSearch}
                                    onValueChange={setProjectSearch}
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
                                                        setPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={`mr-2 h-4 w-4 ${
                                                            selectedProjectId === project._id ? "opacity-100" : "opacity-0"
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

                    <Button onClick={openCreate} disabled={mrsLoading}>
                        <Plus className="mr-2 h-4 w-4" /> Create MRS Item
                    </Button>
                    {/* <Button variant="outline" onClick={bootstrapInventory}>
                        <Truck className="mr-2 h-4 w-4" /> Bootstrap Inv
                    </Button> */}
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader><CardTitle>Total Required Qty</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRequired}</div>
                        <div className="text-sm text-muted-foreground">{selectedProjectId ? "For selected project" : "All items"}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Open / Sent</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div><div className="text-lg font-semibold">{totalOpen}</div><div className="text-xs text-muted-foreground">Open/Planned</div></div>
                            <div><div className="text-lg font-semibold">{totalSent}</div><div className="text-xs text-muted-foreground">Sent</div></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Bulk Actions</CardTitle></CardHeader>
                    <CardContent>
                        <TooltipProvider>
                            <div className="flex gap-2 items-center">
                                <Button disabled={selectedList.length === 0 || prLoading} onClick={() => sendToPurchase(selectedList)}>
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Send to Purchase
                                </Button>
                                <span className="text-muted-foreground text-xs">{selectedList.length} selected</span>
                            </div>
                        </TooltipProvider>
                    </CardContent>
                </Card>
            </div>

            {/* MRS Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Material Requirement Sheet (MRS)</CardTitle>
                    {selectedProjectId && wbsLoading && <p className="text-sm text-blue-500">Fetching Project WBS Materials...</p>}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Source Task</TableHead>
                                <TableHead>Item / Material</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Required Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mrsLoading && <TableRow><TableCell colSpan={7} className="text-center">Loading MRS...</TableCell></TableRow>}
                            
                            {!mrsLoading && paginatedMrsItems.length === 0 && (
                                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No materials found.</TableCell></TableRow>
                            )}

                            {paginatedMrsItems.map((m) => (
                                <TableRow key={m.id || m._id} className={m.isWbsLinked ? "bg-slate-50" : ""}>
                                    <TableCell>
                                        <input 
                                            type="checkbox" 
                                            checked={!!selectedIds[m.id || m._id!]} 
                                            onChange={() => toggleSelect(m.id || m._id!)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {m.task || "—"}
                                        {m.isWbsLinked && <Badge variant="secondary" className="ml-2 text-[10px]">WBS</Badge>}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {m.item} 
                                        {m.unit && <span className="text-xs text-gray-500 ml-1">({m.unit})</span>}
                                    </TableCell>
                                    <TableCell>{m.quantity}</TableCell>
                                    <TableCell>
                                        {mrsStatusSync[m.item] === 'in-transit' ? (
                                            <Button 
                                                size="sm" 
                                                variant="default"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleItemReceived(m)}
                                            >
                                                Item Received
                                            </Button>
                                        ) : mrsStatusSync[m.item] === 'received' ? (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                disabled
                                                className="bg-gray-100"
                                            >
                                                Received ✓
                                            </Button>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => handleOpenRemarkDialog(m, "INVENTORY")}
                                            >
                                                Sent
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell>{m.requiredDate ? new Date(m.requiredDate).toLocaleDateString() : "—"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {canEdit && <Button size="icon" variant="ghost" onClick={() => openEdit(m)} disabled={mrsLoading || !!m.isWbsLinked}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>}
                                            {canDelete && <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id || m._id!, m.isWbsLinked)} disabled={mrsLoading || !!m.isWbsLinked}>
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>}
                                            <Button 
                                                variant="ghost" 
                                                onClick={() => handleOpenRemarkDialog(m, "PURCHASE")}
                                            >
                                                <ShoppingCartIcon className="mr-2 h-4 w-4"/> Send
                                            </Button>
                                            <Button size="sm" onClick={() => handleCheckStatus(m)}>
                                                <Truck className="h-4 w-4" /> Check Status
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {displayedMrsList.length > MRS_PAGE_SIZE && (
                        <div className="flex items-center justify-end gap-2 pt-4">
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMrsPage((prev) => Math.max(1, prev - 1))}
                                disabled={mrsPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">Page {mrsPage} of {mrsTotalPages}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMrsPage((prev) => Math.min(mrsTotalPages, prev + 1))}
                                disabled={mrsPage === mrsTotalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Purchase Requests & Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Purchase Requests (PR)</CardTitle></CardHeader>
                    <CardContent>
                        {prLoading && <div className="text-center py-4">Loading...</div>}
                        {(prs || []).length === 0 ? <div className="text-muted-foreground">No PRs yet.</div> : (
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {prs.map((pr) => (
                                    <div key={pr.id || pr._id} className="rounded-md border p-3 flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-sm">PR #{pr.id?.substring(0,6) || pr._id?.substring(0,6)}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(pr.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <Badge>{pr.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Purchase Orders (PO)</CardTitle></CardHeader>
                    <CardContent>
                        {poLoading && <div className="text-center py-4">Loading...</div>}
                        {(pos || []).length === 0 ? <div className="text-muted-foreground">No POs yet.</div> : (
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {pos.map((po) => (
                                    <div key={po._id || po.id} className="rounded-md border p-3 flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-sm">{po.poNo || "PO-###"}</div>
                                            <div className="text-xs text-muted-foreground">{po.supplier}</div>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => receiveAgainstPO(po._id || po.id, 1)}>
                                            Mark Received
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Material Status Tracker */}
            <Card>
                <CardHeader><CardTitle>Material Status Tracker</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>PO No</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Received / Issued</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedMaterialStatus.map((r, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{r.item}</TableCell>
                                    <TableCell>{r.poNo}</TableCell>
                                    <TableCell>
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${r.remaining > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {r.remaining > 0 ? "Available" : "Shortage"}
                                    </TableCell>
                                    <TableCell>{r.received} / {r.issued}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog to create/edit MRS */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit MRS Item" : "Create MRS Item"}</DialogTitle>
                        <DialogDescription>{editing ? "Update item info." : "Add material requirement"}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Project</Label>
                                <Input 
                                    value={selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : "No project selected"} 
                                    disabled 
                                    className="bg-muted cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Task</Label>
                                <Popover open={taskPopoverOpen} onOpenChange={setTaskPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={taskPopoverOpen}
                                            className="w-full justify-between"
                                            disabled={!selectedProjectId || wbsLoading}
                                        >
                                            {form.task || "Select task..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search tasks..."
                                                value={taskSearch}
                                                onValueChange={setTaskSearch}
                                            />
                                            <CommandList>
                                                {wbsLoading && <div className="p-4 text-center text-sm">Loading...</div>}
                                                <CommandEmpty>
                                                    {!wbsLoading && (!selectedProjectId ? "Please select a project first" : "No tasks found")}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {!wbsLoading && projectWbsItems.length > 0 && projectWbsItems
                                                        .filter((item) => {
                                                            if (!taskSearch) return true;
                                                            const searchLower = taskSearch.toLowerCase();
                                                            const path = getWbsHierarchicalPath(item, projectWbsItems);
                                                            return path.toLowerCase().includes(searchLower) || 
                                                                   item.type.toLowerCase().includes(searchLower);
                                                        })
                                                        .map((item) => {
                                                            const path = getWbsHierarchicalPath(item, projectWbsItems);
                                                            return (
                                                                <CommandItem
                                                                    key={item.id}
                                                                    value={item.name}
                                                                    onSelect={() => {
                                                                        setForm({ ...form, task: item.name });
                                                                        setTaskPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={`mr-2 h-4 w-4 ${
                                                                            form.task === item.name ? "opacity-100" : "opacity-0"
                                                                        }`}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{path}</span>
                                                                        <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Item</Label><Input value={form.item || ""} onChange={(e) => setForm({ ...form, item: e.target.value })} /></div>
                            <div><Label>Quantity</Label><Input type="number" value={form.quantity ?? 1} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value || "0") })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Price (₹)</Label><Input type="number" step="0.01" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value || "0") })} placeholder="0.00" /></div>
                            <div><Label>Required Date</Label><Input type="date" value={form.requiredDate ? form.requiredDate.split("T")[0] : ""} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between">
                        {!editing && (
                            <Button 
                                type="button"
                                variant="secondary" 
                                onClick={addMoreMRSItem}
                                disabled={mrsLoading}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add More
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={mrsLoading}>{editing ? "Save Changes" : "Create Item"}</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Remark</DialogTitle>
                        <DialogDescription>
                            Add a note for the {notificationTarget?.type === "INVENTORY" ? "Inventory" : "Purchase"} team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Remark</Label>
                        <Textarea 
                            placeholder="Enter details here..." 
                            value={remarkText} 
                            onChange={(e) => setRemarkText(e.target.value)} 
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitNotification}>Send Notification</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}