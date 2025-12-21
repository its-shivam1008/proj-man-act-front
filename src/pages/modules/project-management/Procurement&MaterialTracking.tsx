// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/redux/store";

// // UI Components
// import { Button } from "../../../components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "../../../components/ui/dialog";
// import { Input } from "../../../components/ui/input";
// import { Label } from "../../../components/ui/label";
// import { Textarea } from "../../../components/ui/textarea";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
// import { Badge } from "../../../components/ui/badge";
// import { Tooltip, TooltipProvider } from "../../../components/ui/tooltip";
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger,
// } from "../../../components/ui/popover";
// import {
//     Command,
//     CommandEmpty,
//     CommandGroup,
//     CommandInput,
//     CommandItem,
//     CommandList,
// } from "../../../components/ui/command";
// import { createNotification } from "@/redux/slices/notificationSlice";
// // import { Textarea } from "../../../components/ui/textarea";
// import {toast} from 'sonner';
// // Icons
// import { Plus, Trash2, Truck, ShoppingCart, Check, ChevronsUpDown, ShoppingCartIcon, ShieldAlert } from "lucide-react";

// // Redux Actions
// import {
//     fetchMRS,
//     createMRS,
//     updateMRS,
//     deleteMRS,
//     markAsSent,
//     markAsInTransit,
//     markAsReceived,
//     returnMaterial,
//     fetchDeliveryStatistics,
// } from "@/redux/slices/mrsSlice";
// import { createMaterialRequest, fetchMaterialRequests, updateMaterialRequestStatus } from "@/redux/slices/materialRequestSlice";
// import { convertToPR } from "@/redux/slices/prSlice";
// import { receivePO } from "@/redux/slices/poSlice";
// import { fetchProjects } from "@/redux/slices/projectSlice";
// import { fetchWbsByProject, WBSItem } from "@/redux/slices/wbsSlice";
// import { fetchMaterials, RawMaterial } from "@/redux/slices/rawmaterialSlice";
// import { Project } from "@/types/project";

// // Hooks
// import { useDebounce } from "@/hooks/useDebounce";
// import { usePermission } from "@/hooks/userPermission";
// import api from "@/utils/axiosApi";
// import { BASE_URL } from "@/utils/constants";

// // Import Types
// import { MRSItem, PurchaseRequest, PurchaseOrder, InventoryItem } from "@/types/procurement";

// // Extended types for local use
// interface ExtendedMRSItem extends Omit<MRSItem, '_id' | 'status'> {
//     id?: string; // Helper for compatibility
//     _id?: string; // Make optional for compatibility
//     price?: number;
//     isWbsLinked?: boolean; // Helper flag
//     unit?: string; // Helper for display
//     status?: "open" | "sent" | "ordered" | "received" | "cancelled" | "planned"; // Extended status
// }

// interface ExtendedInventoryItem extends Omit<InventoryItem, '_id'> {
//     id?: string; // Helper for compatibility
//     _id?: string; // Make optional for compatibility
// }

// // --- Helper: Generate ID ---
// const generateId = () => Math.random().toString(36).substr(2, 9);

// // --- Local Inventory Helpers ---
// const getInventory = (): ExtendedInventoryItem[] => {
//     const stored = localStorage.getItem('INVENTORY');
//     return stored ? JSON.parse(stored) : [];
// };
// const saveInventory = (list: ExtendedInventoryItem[]) => localStorage.setItem('INVENTORY', JSON.stringify(list));

// // --- Component ---
// export default function ProcurementPage() {
//     const dispatch = useDispatch<AppDispatch>();

//     const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
//     const [remarkText, setRemarkText] = useState("");
//     const [notificationTarget, setNotificationTarget] = useState<{
//         item: ExtendedMRSItem;
//         type: "INVENTORY" | "PURCHASE"; // To distinguish between the two buttons
//     } | null>(null);

//     const canView = usePermission('procurementMaterialTracking', 'view');


//     const handleOpenRemarkDialog = (item: ExtendedMRSItem, type: "INVENTORY" | "PURCHASE") => {
//         setNotificationTarget({ item, type });
//         setRemarkText(""); // Reset remark
//         setRemarkDialogOpen(true);
//     };

//     const handleSendClick = (item: ExtendedMRSItem, type: "INVENTORY" | "PURCHASE") => {
//         // Only increment count for PURCHASE type (Send button)
//         if (type === "PURCHASE") {
//             const itemId = item.id || item._id || item.item;
//             const key = `${itemId}_${type}`;
            
//             const newCounts = {
//                 ...sendClickCounts,
//                 [key]: (sendClickCounts[key] || 0) + 1
//             };
            
//             setSendClickCounts(newCounts);
//             localStorage.setItem('SEND_CLICK_COUNTS', JSON.stringify(newCounts));
//         }
        
//         // Open the remark dialog for both INVENTORY and PURCHASE
//         handleOpenRemarkDialog(item, type);
//     };

//     const resetSendCounts = () => {
//         setSendClickCounts({});
//         localStorage.removeItem('SEND_CLICK_COUNTS');
//         toast.success("Send counts reset successfully");
//     };

//     // --- NEW FUNCTION: Submit Notification ---
//     const handleSubmitNotification = async () => {
//         if (!notificationTarget) return;
//         if (!remarkText.trim()) {
//             toast.error("Please enter a remark.");
//             return;
//         }

//         const { item, type } = notificationTarget;

//         // Define Source and Destination based on your requirements
//         const source = "procurement.project-management";
//         const destination = type === "INVENTORY" 
//             ? "delivery.inventory"   // Clicked "Sent" button
//             : "rfq.purchase";        // Clicked "Send" button

//         try {
//             // 🚀 For INVENTORY type, update MRS delivery status first
//             if (type === "INVENTORY") {
//                 const itemId = item.id || item._id;
//                 if (itemId) {
//                     // Mark as sent for delivery in database
//                     await dispatch(markAsSent({
//                         id: itemId,
//                         transportDetails: {
//                             method: 'Standard Delivery',
//                             estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
//                             deliveryNotes: remarkText
//                         }
//                     }));
//                     console.log('✅ MRS marked as sent in database');
                    
//                     // Material request will be created only when delivery team accepts the notification
//                 }
//             }

//             // Create notification with complete item details
//             await dispatch(createNotification({
//                 source,
//                 destination,
//                 remark: remarkText,
//                 itemId: item.id || item._id,
//                 itemName: item.item,
//                 materialData: {
//                     item: item.item,
//                     sourceTask: item.task || 'N/A',
//                     quantity: item.quantity,
//                     unit: item.unit || 'units',
//                     requiredDate: item.requiredDate || new Date().toISOString(),
//                     sentDate: new Date().toISOString(),
//                     projectId: item.projectId || selectedProjectId,
//                     projectName: selectedProject?.name || 'N/A',
//                     status: item.status || 'sent'
//                 }
//             })).unwrap();

//             // 🚀 Refresh MRS data to show updated delivery status
//             if (type === "INVENTORY") {
//                 dispatch(fetchMRS());
//             }

//             toast.success(`Notification sent to ${type === "INVENTORY" ? "Delivery Management" : "Purchase"}`);
//             setRemarkDialogOpen(false);
//             setNotificationTarget(null);
//             setRemarkText("");
//         } catch (error) {
//             toast.error("Failed to send notification");
//             console.error(error);
//         }
//     };
//     // Redux Selectors
//     const mrsListRaw = useSelector((state: RootState) => state.mrs.list) as ExtendedMRSItem[];
//     const wbsList = useSelector((state: RootState) => state.wbs.wbs) as WBSItem[]; 
//     const rawMaterials = useSelector((state: RootState) => state.rawMaterials.materials) as RawMaterial[];
//     const projects = useSelector((state: RootState) => state.projects.projects) as Project[];
//     const prs = useSelector((state: RootState) => state.pr.list) as PurchaseRequest[];
//     const pos = useSelector((state: RootState) => state.po.list);
    
//     // Loading States
//     const mrsLoading = useSelector((state: RootState) => state.mrs.loading);
//     const prLoading = useSelector((state: RootState) => state.pr.loading);
//     const poLoading = useSelector((state: RootState) => state.po.loading);
//     const projectLoading = useSelector((state: RootState) => state.projects.loading);
//     const wbsLoading = useSelector((state: RootState) => state.wbs.loading);

//     // Local State
//     const [inventory, setInventory] = useState<ExtendedInventoryItem[]>([]);
//     const [mrsStatusSync, setMrsStatusSync] = useState<Record<string, string>>({});
//     const [sendClickCounts, setSendClickCounts] = useState<Record<string, number>>({});
    
//     // Pagination State
//     const [mrsPage, setMrsPage] = useState(1);
//     const MRS_PAGE_SIZE = 10;
//     const [statusPage, setStatusPage] = useState(1);
//     const STATUS_PAGE_SIZE = 10;

//     // Project Selection State
//     const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
//     const [popoverOpen, setPopoverOpen] = useState(false);
//     const [projectSearch, setProjectSearch] = useState("");
//     const debouncedProjectSearch = useDebounce(projectSearch, 500);

//     // Dialog / Form State
//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const [editing, setEditing] = useState<ExtendedMRSItem | null>(null);
//     const [form, setForm] = useState<Partial<ExtendedMRSItem>>({ item: "", quantity: 1, price: 0, requiredDate: "" });
//     const [multipleItems, setMultipleItems] = useState<Partial<ExtendedMRSItem>[]>([]);
//     const [taskPopoverOpen, setTaskPopoverOpen] = useState(false);
//     const [taskSearch, setTaskSearch] = useState("");
//     const [itemPopoverOpen, setItemPopoverOpen] = useState(false);
//     const [itemSearch, setItemSearch] = useState("");
//     const [isCustomItem, setIsCustomItem] = useState(false);

//     // Initial Data Load
//     useEffect(() => {
//         dispatch(fetchMRS());
//         dispatch(fetchMaterials({ page: 1, limit: 1000 })); // Fetch Raw Materials to map names
//         dispatch(fetchDeliveryStatistics()); // 🚀 Fetch delivery statistics
//         setInventory(getInventory());
        
//         // Load MRS status sync from localStorage
//         const syncData = localStorage.getItem('MRS_STATUS_SYNC');
//         if (syncData) {
//             setMrsStatusSync(JSON.parse(syncData));
//         }
        
//         // Load send click counts from localStorage
//         const clickCountsData = localStorage.getItem('SEND_CLICK_COUNTS');
//         if (clickCountsData) {
//             setSendClickCounts(JSON.parse(clickCountsData));
//         }
//     }, [dispatch]);
    
//     // 🔥 Auto-refresh MRS when project changes
//     useEffect(() => {
//         if (selectedProjectId) {
//             dispatch(fetchMRS());
//         }
//     }, [selectedProjectId, dispatch]);
    
//     // Refresh MRS status sync periodically
//     useEffect(() => {
//         const interval = setInterval(() => {
//             const syncData = localStorage.getItem('MRS_STATUS_SYNC');
//             if (syncData) {
//                 const parsed = JSON.parse(syncData);
//                 console.log('MRS Status Sync Updated:', parsed);
//                 setMrsStatusSync(parsed);
//             }
//         }, 2000); // Check every 2 seconds
        
//         return () => clearInterval(interval);
//     }, []);

//     // Fetch Projects when search changes
//     useEffect(() => {
//         dispatch(fetchProjects({ search: debouncedProjectSearch, page: 1, limit: 10 }));
//     }, [debouncedProjectSearch, dispatch]);

//     // Fetch WBS when Project is Selected
//     useEffect(() => {
//         if (selectedProjectId) {
//             dispatch(fetchWbsByProject(selectedProjectId));
//         }
//     }, [selectedProjectId, dispatch]);

//     const selectedProject = projects.find((p) => p._id === selectedProjectId);

//     // Helper function to build hierarchical path for WBS items
//     const getWbsHierarchicalPath = (item: WBSItem, allWbs: WBSItem[]): string => {
//         const path: string[] = [item.name];
//         let currentItem: WBSItem | undefined = item;
        
//         while (currentItem?.parentId) {
//             const parent = allWbs.find(w => w.id === currentItem!.parentId);
//             if (parent) {
//                 path.unshift(parent.name);
//                 currentItem = parent;
//             } else {
//                 break;
//             }
//         }
        
//         return path.join(" > ");
//     };

//     // Filter WBS items for selected project
//     const projectWbsItems = useMemo(() => {
//         if (!selectedProjectId) return [];
//         return wbsList.filter((item) => item.projectId === selectedProjectId);
//     }, [wbsList, selectedProjectId]);

//     // --- DATA TRANSFORMATION: Filter by Project ---
//     const displayedMrsList = useMemo(() => {
//         console.log("🔍 Filtering MRS items:", {
//             selectedProjectId,
//             totalMrsItems: mrsListRaw.length,
//             mrsItems: mrsListRaw.map(item => ({ id: item.id || item._id, item: item.item, projectId: item.projectId }))
//         });
        
//         // If NO project is selected, show only MRS items that don't have a projectId
//         if (!selectedProjectId) {
//             const filtered = mrsListRaw.filter(item => !item.projectId || item.projectId === null || item.projectId === undefined);
//             console.log("🔍 No project selected, showing items without projectId:", filtered.length);
//             return filtered;
//         }

//         // If Project IS selected, show all MRS items for this project
//         // Backend creates MRS entries when materials are linked to WBS
//         const filtered = mrsListRaw.filter(item => {
//             const itemProjectId = String(item.projectId || '');
//             const selectedId = String(selectedProjectId || '');
//             return itemProjectId === selectedId;
//         });
        
//         console.log("🔍 Project selected, showing items for project:", selectedProjectId, "Count:", filtered.length);
//         return filtered;

//     }, [selectedProjectId, mrsListRaw]);

//     // --- Pagination Logic (Applied to the Derived List) ---
//     const mrsTotalPages = Math.max(1, Math.ceil((displayedMrsList?.length || 0) / MRS_PAGE_SIZE));
//     const paginatedMrsItems = useMemo(() => {
//         const start = (mrsPage - 1) * MRS_PAGE_SIZE;
//         return displayedMrsList.slice(start, start + MRS_PAGE_SIZE);
//     }, [displayedMrsList, mrsPage]);

//     useEffect(() => {
//         setMrsPage(1); // Reset page on filter change
//     }, [displayedMrsList.length]);


//     // --- CRUD Actions ---
//     const persistInventory = (list: ExtendedInventoryItem[]) => {
//         setInventory(list);
//         saveInventory(list);
//     };

//     const openCreate = () => {
//         setEditing(null);
//         setForm({ item: "", quantity: 1, price: 0, requiredDate: "", projectId: selectedProjectId || undefined });
//         setMultipleItems([]);
//         setIsCustomItem(false);
//         setIsDialogOpen(true);
//     };

//     const addMoreMRSItem = () => {
//         // Validate current form
//         if (!form.item?.trim() || form.quantity === undefined || form.quantity < 1) {
//             toast.error("Please fill Item and Quantity before adding more.");
//             return;
//         }

//         // Add current form to multipleItems
//         setMultipleItems([...multipleItems, { ...form }]);
        
//         // Reset form for next item but keep project and task
//         setForm({
//             item: "",
//             quantity: 1,
//             price: 0,
//             requiredDate: "",
//             projectId: form.projectId,
//             task: form.task,
//         });
//         setIsCustomItem(false);
        
//         toast.success(`${multipleItems.length + 1} item(s) ready to save. Fill in the next item.`);
//     };

//     // const openEdit = (m: ExtendedMRSItem) => {
//     //     if (m.isWbsLinked) {
//     //         alert(`This item is linked to WBS Task: "${m.task}". Please edit it in the WBS module.`);
//     //         return;
//     //     }
//     //     setEditing(m);
//     //     setForm(m);
        
//     //     // Check if the item is a custom item (not in raw materials list)
//     //     const isInRawMaterials = rawMaterials.some(material => material.name === m.item);
//     //     setIsCustomItem(!isInRawMaterials);
        
//     //     setIsDialogOpen(true);
//     // };

//     const handleSave = async () => {
//         // If editing, use single form
//         if (editing) {
//             if (!form.item?.trim() || form.quantity === undefined || form.quantity < 1) {
//                 toast.error("Item and quantity are required");
//                 return;
//             }
//             const cleanForm: Partial<ExtendedMRSItem> = {
//                 ...form,
//                 item: form.item.trim(),
//                 quantity: Number(form.quantity),
//                 price: form.price ? Number(form.price) : undefined,
//                 requiredDate: form.requiredDate ? form.requiredDate : undefined,
//                 projectId: form.projectId || selectedProjectId || undefined, 
//             };
            
//             await dispatch(updateMRS({ id: editing._id || editing.id || '', data: cleanForm as any }));
//             await dispatch(fetchMRS());
            
//             setIsDialogOpen(false);
//             setEditing(null);
//             setForm({ item: "", quantity: 1, price: 0, requiredDate: "" });
//             setIsCustomItem(false);
//             return;
//         }

//         // For creating - validate current form
//         if (!form.item?.trim() || form.quantity === undefined || form.quantity < 1) {
//             toast.error("Item and quantity are required");
//             return;
//         }

//         // Combine multipleItems with current form
//         const allItems = [...multipleItems, form];

//         // Check stock availability and deduct from raw materials
//         for (const item of allItems) {
//             const materialName = item.item?.trim();
//             const requestedQty = Number(item.quantity);
            
//             // Find the raw material
//             const rawMaterial = rawMaterials.find(rm => rm.name === materialName);
            
//             if (rawMaterial) {
//                 // 🚀 Check FIFO stock availability (calculate from remainingQuantity in stocks)
//                 let currentStock = 0;
//                 if (rawMaterial.stocks && Array.isArray(rawMaterial.stocks)) {
//                     currentStock = rawMaterial.stocks.reduce((total: number, stock: any) => {
//                         return total + (stock.remainingQuantity || 0);
//                     }, 0);
//                 } else {
//                     currentStock = rawMaterial.quantity || 0;
//                 }
                
//                 console.log(`📊 FIFO Stock check for ${materialName}: Available=${currentStock}, Requested=${requestedQty}`);
                
//                 if (currentStock < requestedQty) {
//                     toast.error(`Not enough stock for ${materialName}. Available: ${currentStock}, Requested: ${requestedQty}`);
//                     return;
//                 }
                
//                 // 🚀 Deduct from raw material stock using FIFO
//                 try {
//                     const organisationId = localStorage.getItem("organisationId");
                    
//                     console.log(`🔍 Using FIFO to consume ${requestedQty} of ${materialName}`);
                    
//                     const fifoResponse = await api.post('/fifo/consume-stock', {
//                         materialId: rawMaterial._id,
//                         quantity: requestedQty,
//                         reason: `MRS Creation - ${item.task || 'Material Requirement'}`,
//                         referenceId: `MRS-${Date.now()}`
//                     }, {
//                         headers: { 
//                             organisationId,
//                             'Authorization': `Bearer ${localStorage.getItem('token')}`
//                         }
//                     });
                    
//                     if (fifoResponse.data.success) {
//                         console.log(`✅ FIFO consumption successful:`, fifoResponse.data.data);
//                         console.log(`📊 Consumed from ${fifoResponse.data.data.consumedBatches.length} batches`);
//                         console.log(`💰 Average cost: ₹${fifoResponse.data.data.averageCost}`);
//                     } else {
//                         throw new Error(fifoResponse.data.message || 'FIFO consumption failed');
//                     }
//                 } catch (error: any) {
//                     console.error('Failed to consume stock using FIFO:', error);
//                     const errorMsg = error.response?.data?.message || error.message || 'FIFO consumption failed';
//                     toast.error(`Failed to consume stock for ${materialName}: ${errorMsg}`);
//                     return;
//                 }
//             }
//         }

//         // Save all MRS items
//         for (const item of allItems) {
//             const cleanForm: Partial<ExtendedMRSItem> = {
//                 ...item,
//                 item: item.item?.trim(),
//                 quantity: Number(item.quantity),
//                 price: item.price ? Number(item.price) : undefined,
//                 requiredDate: item.requiredDate ? item.requiredDate : undefined,
//                 projectId: item.projectId || selectedProjectId || undefined, 
//             };
            
//             await dispatch(createMRS(cleanForm as any));
//         }
        
//         // Refetch both MRS and raw materials to show updated stock
//         await dispatch(fetchMRS());
//         await dispatch(fetchMaterials({ page: 1, limit: 1000 }));
        
//         toast.success(`${allItems.length} MRS item(s) created successfully. Stock updated using FIFO.`);
        
//         setIsDialogOpen(false);
//         setEditing(null);
//         setMultipleItems([]);
//         setForm({ item: "", quantity: 1, price: 0, requiredDate: "" });
//         setIsCustomItem(false);
//     };

//     const handleDelete = async (id: string, isWbsLinked?: boolean) => {
//         console.log("🗑️ handleDelete called with:", { id, isWbsLinked });
//         console.log("🔍 Current BASE_URL:", BASE_URL);
//         console.log("🔍 Token exists:", !!localStorage.getItem("token"));
//         console.log("🔍 Organisation ID:", localStorage.getItem("organisationId"));
        
//         // Find the MRS item to get its details before deletion
//         const mrsItem = displayedMrsList.find(item => (item.id || item._id) === id);
//         if (!mrsItem) {
//             toast.error("MRS item not found");
//             return;
//         }
        
//         console.log("📋 MRS item to delete:", mrsItem);
        
//         // 🚀 NEW: Check delivery status - only allow deletion if not received
//         const deliveryStatus = mrsItem.deliveryStatus || 'pending';
//         console.log("📦 Delivery status:", deliveryStatus);
        
//         if (deliveryStatus === 'received') {
//             toast.error("Cannot delete received items. Material has already been delivered and may be in use.");
//             return;
//         }
        
//         // Show different confirmation based on status
//         const statusMessage = deliveryStatus === 'pending' 
//             ? "This item is still pending delivery." 
//             : deliveryStatus === 'sent' 
//             ? "This item has been sent but not yet received."
//             : deliveryStatus === 'in-transit'
//             ? "This item is currently in transit."
//             : "This item has not been received yet.";
        
//         // Enhanced confirmation message based on WBS link status
//         const wbsMessage = mrsItem.task 
//             ? `\nWBS Task: ${mrsItem.task}\n\n⚠️ Note: Since material is not received, WBS task will NOT be affected. Only stock will be restored.`
//             : '';
        
//         if (!confirm(`Are you sure you want to delete this MRS item?\n\nItem: ${mrsItem.item}\nQuantity: ${mrsItem.quantity}\nStatus: ${deliveryStatus}${wbsMessage}\n\n${statusMessage}\n\n📦 This will restore ${mrsItem.quantity} units back to raw material stock.`)) {
//             console.log("❌ User cancelled deletion");
//             return;
//         }
        
//         console.log("✅ User confirmed deletion, proceeding...");
        
//         // 🎯 IMPORTANT: Since item is not received, WBS is not affected
//         // Only stock restoration is needed - no WBS material removal required
//         console.log("📝 Note: Item not received, so WBS will not be affected. Only restoring stock.");
        
//         try {
//             // 🚀 STEP 1: Restore stock to raw materials using FIFO
//             const materialName = mrsItem.item?.trim();
//             const quantityToRestore = Number(mrsItem.quantity);
            
//             if (materialName && quantityToRestore > 0) {
//                 // Find the raw material
//                 const rawMaterial = rawMaterials.find(rm => rm.name === materialName);
                
//                 if (rawMaterial) {
//                     console.log(`📦 Restoring ${quantityToRestore} units of ${materialName} to stock...`);
                    
//                     try {
//                         const organisationId = localStorage.getItem("organisationId");
                        
//                         // Add stock back using FIFO (reverse operation)
//                         const restoreResponse = await api.post('/fifo/restore-stock', {
//                             materialId: rawMaterial._id,
//                             quantity: quantityToRestore,
//                             reason: `MRS Deletion - Restoring stock for ${mrsItem.task || 'Material Requirement'}`,
//                             referenceId: `MRS-DELETE-${id}`,
//                             // Use average cost or last purchase cost for restoration
//                             unitCost: rawMaterial.averageCost || rawMaterial.unitCost || 0
//                         }, {
//                             headers: { 
//                                 organisationId,
//                                 'Authorization': `Bearer ${localStorage.getItem('token')}`
//                             }
//                         });
                        
//                         if (restoreResponse.data.success) {
//                             console.log(`✅ Stock restored successfully:`, restoreResponse.data.data);
//                             console.log(`📊 Restored ${quantityToRestore} units to ${materialName}`);
//                             console.log(`📋 Movement record created:`, restoreResponse.data.data.movementRecord?.referenceNumber);
                            
//                             // Store movement record info for success message
//                             window.lastMovementRecord = restoreResponse.data.data.movementRecord;
//                         } else {
//                             console.warn('Stock restoration response not successful:', restoreResponse.data);
//                         }
//                     } catch (stockError: any) {
//                         console.error('Failed to restore stock:', stockError);
//                         // Continue with deletion even if stock restoration fails
//                         toast.warning(`Stock restoration failed: ${stockError.response?.data?.message || stockError.message}. MRS will still be deleted.`);
//                     }
//                 } else {
//                     console.log(`⚠️ Raw material "${materialName}" not found in master list. Skipping stock restoration.`);
//                 }
//             }
            
//             // 🚀 STEP 2: Delete the MRS item
//             console.log("🚀 Dispatching deleteMRS action with ID:", id);
//             console.log("🌐 Making API call to:", `${BASE_URL}/delete/mrs/${id}`);
            
//             const result = await dispatch(deleteMRS(id)).unwrap();
//             console.log("✅ Delete successful, result:", result);
            
//             // 🚀 STEP 3: Refresh both MRS and raw materials data
//             console.log("🔄 Refreshing MRS list and raw materials...");
//             await Promise.all([
//                 dispatch(fetchMRS()),
//                 dispatch(fetchMaterials({ page: 1, limit: 1000 }))
//             ]);
//             console.log("✅ Data refreshed");
            
//             // Show user where to find movement records
//             if ((window as any).lastMovementRecord) {
//                 console.log("📋 To view movement records, check:");
//                 console.log("   - Inventory → Reporting → Moves Analysis");
//                 console.log("   - Or check Material Movements API endpoint");
//             }
            
//             // Enhanced success message with WBS clarification and movement record
//             const wbsNote = mrsItem.task ? " WBS task not affected (material was not received)." : "";
//             const movementNote = (window as any).lastMovementRecord 
//                 ? ` Movement record: ${(window as any).lastMovementRecord.referenceNumber}` 
//                 : "";
            
//             toast.success(`MRS item deleted successfully. ${quantityToRestore} units restored to ${materialName} stock.${wbsNote}${movementNote}`, {
//                 duration: 6000 // Show longer to read the movement record
//             });
            
//             // Clear the stored movement record
//             delete (window as any).lastMovementRecord;
//         } catch (error: any) {
//             console.error("❌ Delete MRS error:", error);
//             console.error("❌ Error details:", {
//                 message: error.message,
//                 status: error.status,
//                 response: error.response?.data
//             });
//             toast.error(error.message || "Failed to delete MRS item");
//         }
//     };

//     // --- Purchase Logic ---
//     const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
//     const toggleSelect = (id: string) => setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
//     const selectedList = Object.keys(selectedIds).filter((k) => selectedIds[k]);

//     const sendToPurchase = async (mrsIds: string[], supplier?: string, deliveryDate?: string) => {
//         if (!mrsIds || mrsIds.length === 0) {
//             toast.error("Please select at least one item");
//             return;
//         }
        
//         try {
//             // Get selected MRS items
//             const selectedItems = displayedMrsList.filter(item => {
//                 const itemId = item.id || item._id;
//                 return itemId && mrsIds.includes(itemId);
//             });
            
//             if (selectedItems.length === 0) {
//                 toast.error("No valid items selected");
//                 return;
//             }
            
//             // Create notifications for each selected item
//             const source = "procurement.project-management";
//             const destination = "rfq.purchase";
            
//             for (const item of selectedItems) {
//                 await dispatch(createNotification({
//                     source,
//                     destination,
//                     remark: `Bulk purchase request for ${item.item}`,
//                     itemId: item.id || item._id,
//                     itemName: item.item,
//                     materialData: {
//                         item: item.item,
//                         sourceTask: item.task || 'N/A',
//                         quantity: item.quantity,
//                         unit: item.unit || 'units',
//                         requiredDate: item.requiredDate || new Date().toISOString(),
//                         sentDate: new Date().toISOString(),
//                         projectId: item.projectId || selectedProjectId,
//                         projectName: selectedProject?.name || 'N/A',
//                         status: item.status || 'sent'
//                     }
//                 })).unwrap();
//             }
            
//             toast.success(`${selectedItems.length} notification(s) sent to Purchase`);
//             setSelectedIds({});
//         } catch (err: any) {
//             console.error('Send to Purchase failed:', err);
//             toast.error("Failed to send notifications");
//         }
//     };

//     const checkStockAvailability = (itemName: string) => {
//         const found = inventory.find((it) => it.item.toLowerCase() === itemName.toLowerCase());
//         return found ? found.qty : 0;
//     };

//     const receiveAgainstPO = async (poId: string, qtyReceived: number) => {
//         await dispatch(receivePO({ poId, qty: qtyReceived }));
//         const po = (pos as any[]).find((p: any) => p._id === poId);
//         if (po && po.items) {
//             const inv = getInventory();
//             (po.items || []).forEach((it: any) => {
//                 const existing = inv.find((x) => x.item.toLowerCase() === it.item.toLowerCase());
//                 if (existing) {
//                     existing.qty += qtyReceived; 
//                 } else {
//                     inv.push({ _id: generateId(), id: generateId(), item: it.item, qty: qtyReceived });
//                 }
//             });
//             persistInventory(inv);
//         }
//     };

//     const handleCheckStatus = (m: ExtendedMRSItem) => {
//         // 1. Try to find by ID (for WBS items)
//         let foundMaterial = rawMaterials.find(r => r._id === m._id);
        
//         // 2. If not found, try to find by Name (for manual items)
//         if (!foundMaterial) {
//             foundMaterial = rawMaterials.find(r => r.name.toLowerCase() === m.item.toLowerCase());
//         }

//         if (foundMaterial) {
//             toast.info(`Current Stock for "${foundMaterial.name}": ${foundMaterial.quantity}`);
//         } else {
//             // Fallback to 0 if material not found in master list
//             toast.warning(`Material "${m.item}" not found in Raw Material master list. Stock: 0`);
//         }
//     };
    
//     const handleItemReceived = async (m: ExtendedMRSItem) => {
//         try {
//             const itemId = m.id || m._id;
//             if (!itemId) {
//                 toast.error('Invalid item ID');
//                 return;
//             }

//             // 🚀 Mark as received in database (replaces localStorage)
//             await dispatch(markAsReceived({
//                 id: itemId,
//                 receivedBy: 'Current User', // You can get this from auth context
//                 receivedQuantity: m.quantity,
//                 deliveryNotes: `Item received on ${new Date().toLocaleDateString()}`
//             }));

//             // Update localStorage sync for backward compatibility with WBS
//             const syncData = JSON.parse(localStorage.getItem('MRS_STATUS_SYNC') || '{}');
//             syncData[itemId] = 'received';
//             localStorage.setItem('MRS_STATUS_SYNC', JSON.stringify(syncData));
//             setMrsStatusSync(syncData);
            
//             // Dispatch custom event to notify other components
//             window.dispatchEvent(new CustomEvent('mrsStatusChanged', { 
//               detail: { itemId, status: 'received', item: m } 
//             }));
            
//             // 🚀 AUTOMATICALLY ADD TO WBS SAVED MATERIALS 🚀
//             if (m.task && selectedProjectId) {
//                 try {
//                     // Find the WBS item for this task
//                     const wbsResponse = await api.get(`/wbs/project/${selectedProjectId}`);
//                     const wbsItems = wbsResponse.data?.data || [];
//                     const wbsItem = wbsItems.find((item: any) => item.name === m.task);
                    
//                     if (wbsItem) {
//                         // Prepare material data for WBS
//                         const materialData = {
//                             materialId: m._id || m.id,
//                             name: m.item,
//                             quantity: m.quantity || 1,
//                             unit: m.unit || 'kg',
//                             remarks: `Auto-added from MRS (Received: ${new Date().toLocaleDateString()})`
//                         };
                        
//                         // Try to add material to WBS item via API
//                         try {
//                             await api.post(`/wbs/item/${wbsItem.id}/materials`, materialData);
//                             toast.success(`✅ ${m.item} automatically added to WBS task "${m.task}" saved materials!`);
//                         } catch (apiError) {
//                             // Fallback: Add to localStorage for MaterialSelectionDialog
//                             const savedMaterialsKey = `WBS_SAVED_MATERIALS_${wbsItem.id}`;
//                             const existingSavedMaterials = JSON.parse(localStorage.getItem(savedMaterialsKey) || '[]');
                            
//                             // Check if material already exists
//                             const existingIndex = existingSavedMaterials.findIndex((saved: any) => 
//                                 saved.name === materialData.name || saved.materialId === materialData.materialId
//                             );
                            
//                             if (existingIndex >= 0) {
//                                 // Update existing material quantity
//                                 existingSavedMaterials[existingIndex].quantity = 
//                                     (existingSavedMaterials[existingIndex].quantity || 0) + materialData.quantity;
//                             } else {
//                                 // Add new material
//                                 existingSavedMaterials.push({
//                                     ...materialData,
//                                     id: Date.now().toString(), // Generate unique ID
//                                     addedAt: new Date().toISOString()
//                                 });
//                             }
                            
//                             localStorage.setItem(savedMaterialsKey, JSON.stringify(existingSavedMaterials));
                            
//                             // Dispatch event to refresh MaterialSelectionDialog
//                             window.dispatchEvent(new CustomEvent('wbsMaterialsUpdated', { 
//                                 detail: { wbsItemId: wbsItem.id, materials: existingSavedMaterials } 
//                             }));
                            
//                             toast.success(`✅ ${m.item} automatically added to WBS task "${m.task}" saved materials!`);
//                         }
//                     } else {
//                         console.warn(`WBS task "${m.task}" not found for auto-addition`);
//                     }
//                 } catch (error) {
//                     console.error('Error auto-adding material to WBS:', error);
//                     // Don't show error toast to user, just log it
//                 }
//             }
            
//             // Update material request status to delivered in database
//             try {
//                 console.log('🔍 Looking for material request with itemId:', itemId, 'item:', m.item, 'task:', m.task);
                
//                 // Get all material requests and search more broadly
//                 const allRequestsResponse = await api.get('/api/material-requests', {
//                     headers: { organisationId: localStorage.getItem('organisationId') }
//                 });
                
//                 console.log('📦 All material requests response:', allRequestsResponse.data);
                
//                 if (allRequestsResponse.data.success) {
//                     const allRequests = allRequestsResponse.data.requests || allRequestsResponse.data;
//                     console.log('📋 Total material requests found:', allRequests.length);
                    
//                     // Log all requests for debugging
//                     allRequests.forEach((req: any, index: number) => {
//                         console.log(`Request ${index + 1}:`, {
//                             id: req._id,
//                             itemId: req.itemId,
//                             item: req.item,
//                             sourceTask: req.sourceTask,
//                             status: req.status,
//                             isDeleted: req.isDeleted
//                         });
//                     });
                    
//                     // Try multiple search strategies
//                     let matchingRequest = null;
                    
//                     // Strategy 1: Find by itemId
//                     matchingRequest = allRequests.find((req: any) => 
//                         req.itemId === itemId && 
//                         req.status === 'in-transit' &&
//                         !req.isDeleted
//                     );
                    
//                     if (!matchingRequest) {
//                         console.log('🔍 Strategy 1 failed, trying by item name and task...');
//                         // Strategy 2: Find by item name and task
//                         matchingRequest = allRequests.find((req: any) => 
//                             req.item === m.item && 
//                             req.sourceTask === m.task &&
//                             req.status === 'in-transit' &&
//                             !req.isDeleted
//                         );
//                     }
                    
//                     if (!matchingRequest) {
//                         console.log('🔍 Strategy 2 failed, trying by item name only...');
//                         // Strategy 3: Find by item name only (most recent in-transit)
//                         const itemRequests = allRequests.filter((req: any) => 
//                             req.item === m.item && 
//                             req.status === 'in-transit' &&
//                             !req.isDeleted
//                         );
//                         matchingRequest = itemRequests.sort((a: any, b: any) => 
//                             new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//                         )[0];
//                     }
                    
//                     if (matchingRequest) {
//                         console.log('✅ Found matching request:', matchingRequest);
//                         console.log('📊 Current status:', matchingRequest.status);
                        
//                         console.log('🚀 Updating status to delivered...');
//                         console.log('📋 Request ID:', matchingRequest._id);
//                         console.log('📋 Organisation ID:', localStorage.getItem('organisationId'));
                        
//                         try {
//                             // Test API connectivity first
//                             console.log('🔗 Testing API connectivity...');
//                             const testResponse = await api.get('/api/material-requests', {
//                                 headers: { organisationId: localStorage.getItem('organisationId') }
//                             });
//                             console.log('✅ API is reachable, proceeding with update...');
                            
//                             // Verify the material request exists before updating
//                             console.log('🔍 Verifying material request exists...');
//                             const verifyResponse = await api.get(`/api/material-requests/${matchingRequest._id}`, {
//                                 headers: { organisationId: localStorage.getItem('organisationId') }
//                             });
//                             console.log('📋 Verification response:', verifyResponse.data);
                            
//                             const updateResponse = await api.patch(`/api/material-requests/${matchingRequest._id}/status`, {
//                                 status: 'delivered'
//                             }, {
//                                 headers: { 
//                                     organisationId: localStorage.getItem('organisationId'),
//                                     'Content-Type': 'application/json'
//                                 }
//                             });
                            
//                             console.log('📋 Update response:', updateResponse.data);
                            
//                             if (updateResponse.data.success) {
//                                 console.log('✅ Updated material request status to delivered');
                                
//                                 // Refresh material requests in delivery page
//                                 dispatch(fetchMaterialRequests({}));
//                                 toast.success('✅ Delivery status updated to delivered!');
//                             } else {
//                                 console.log('❌ Update failed:', updateResponse.data.message);
//                                 toast.error(`Failed to update delivery status: ${updateResponse.data.message}`);
//                             }
//                         } catch (updateError: any) {
//                             console.error('❌ API call failed:', updateError);
//                             console.error('❌ Error response:', updateError.response?.data);
//                             console.error('❌ Error status:', updateError.response?.status);
//                             console.error('❌ Error message:', updateError.message);
//                             console.error('❌ Full error:', updateError);
                            
//                             // Show specific error message to user
//                             const errorMessage = updateError.response?.data?.message || 
//                                                updateError.message || 
//                                                'Unknown error occurred';
//                             console.log('🔍 Showing error to user:', errorMessage);
                            
//                             // Try alternative approach using Redux action
//                             try {
//                                 console.log('🔄 Trying alternative update method...');
//                                 await dispatch(updateMaterialRequestStatus({
//                                     id: matchingRequest._id,
//                                     status: 'delivered'
//                                 }));
                                
//                                 console.log('✅ Updated via Redux action');
//                                 toast.success('✅ Delivery status updated to delivered!');
                                
//                                 // Refresh material requests
//                                 dispatch(fetchMaterialRequests({}));
//                             } catch (reduxError) {
//                                 console.error('❌ Redux update also failed:', reduxError);
//                                 toast.error('Failed to update delivery status. Please try again or contact support.');
//                             }
//                         }
//                     } else {
//                         console.log('❌ No in-transit material request found for item:', m.item);
                        
//                         // Check if there are any requests for this item at all
//                         const anyRequests = allRequests.filter((req: any) => 
//                             req.item === m.item && !req.isDeleted
//                         );
                        
//                         if (anyRequests.length > 0) {
//                             console.log('📋 Found requests for this item but not in-transit:', anyRequests);
//                             toast.info(`Found delivery requests for ${m.item} but none are in-transit. Current statuses: ${anyRequests.map((r: any) => r.status).join(', ')}`);
//                         } else {
//                             toast.info('No delivery request found for this item. It may not have been sent to delivery yet.');
//                         }
//                     }
//                 } else {
//                     console.log('❌ Failed to fetch material requests');
//                     toast.error('Failed to fetch delivery requests');
//                 }
//             } catch (error) {
//                 console.error('❌ Failed to update material request status:', error);
//                 console.error('Error details:', (error as any)?.response?.data || (error as any)?.message);
//                 toast.error('Failed to update delivery status');
//             }
            
//             // Refresh MRS data to show updated delivery status
//             dispatch(fetchMRS());
            
//             toast.success(`${m.item} marked as received and delivery status updated in database`);
            
//         } catch (error) {
//             console.error('Error marking item as received:', error);
//             toast.error('Failed to mark item as received');
//         }
//     };

//     // --- Material Status Tracker ---
//     const materialStatus = useMemo(() => {
//         const rows: any[] = [];
//         (pos || []).forEach((po: any) => {
//             if (po.items) { // Only process if it has items (PurchaseOrder)
//                 (po.items || []).forEach((it: any) => {
//                     const invItem = inventory.find((x) => x.item.toLowerCase() === it.item.toLowerCase());
//                     const received = po.received || 0;
//                     const issued = po.issued || 0;
//                     const remaining = (invItem?.qty || 0) - issued;
//                     rows.push({
//                         item: it.item,
//                         poNo: po.poNo,
//                         supplier: po.supplier,
//                         deliveryDate: po.deliveryDate,
//                         received,
//                         issued,
//                         remaining: remaining < 0 ? 0 : remaining,
//                     });
//                 });
//             }
//         });
//         return rows;
//     }, [pos, inventory]);

//     const statusTotalPages = Math.max(1, Math.ceil(materialStatus.length / STATUS_PAGE_SIZE));
//     const paginatedMaterialStatus = useMemo(() => {
//         const start = (statusPage - 1) * STATUS_PAGE_SIZE;
//         return materialStatus.slice(start, start + STATUS_PAGE_SIZE);
//     }, [materialStatus, statusPage]);

//     // --- UI Metrics ---
//     const totalRequired = useMemo(() => (displayedMrsList || []).reduce((s, m) => s + (m.quantity || 0), 0), [displayedMrsList]);
//     const totalOpen = useMemo(() => (displayedMrsList || []).filter((m) => m.status === "open" || m.status === "planned").length, [displayedMrsList]);
//     const totalSent = useMemo(() => (displayedMrsList || []).filter((m) => m.status === "sent").length, [displayedMrsList]);

//     const bootstrapInventory = () => {
//         if (inventory.length > 0) return;
//         const sample: ExtendedInventoryItem[] = [
//             { _id: generateId(), id: generateId(), item: "Cement 50kg", qty: 250, uom: "bag" },
//             { _id: generateId(), id: generateId(), item: "Steel 8mm", qty: 1200, uom: "kg" },
//         ];
//         persistInventory(sample);
//     };

//     if (!canView) {
//     return (
//       <div className="text-center py-12 px-4">
//         <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
//         <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
//       </div>
//     );
//   }

//     return (
//         <div className="space-y-6 p-4 md:p-6">
//             {/* Header with Project Selector */}
//             <div className="flex flex-col md:flex-row items-start justify-between gap-4">
//                 <div>
//                     <h2 className="text-3xl font-bold">Procurement & Material Tracking</h2>
//                     <p className="text-muted-foreground">
//                         {selectedProject 
//                             ? `Planning materials for: ${selectedProject.name}`
//                             : "Manage MRS, Purchase Requests & Inventory"
//                         }
//                     </p>
//                 </div>

//                 <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
//                     {/* PROJECT SELECTOR POPOVER */}
//                     <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
//                         <PopoverTrigger asChild>
//                             <Button
//                                 variant="outline"
//                                 role="combobox"
//                                 aria-expanded={popoverOpen}
//                                 className="w-full md:w-64 justify-between"
//                             >
//                                 {selectedProject ? (
//                                     <span className="truncate">
//                                         {selectedProject.code} - {selectedProject.name}
//                                     </span>
//                                 ) : (
//                                     "Select Project to Filter MRS"
//                                 )}
//                                 <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                             </Button>
//                         </PopoverTrigger>
//                         <PopoverContent className="w-[300px] p-0">
//                             <Command>
//                                 <CommandInput
//                                     placeholder="Search projects..."
//                                     value={projectSearch}
//                                     onValueChange={setProjectSearch}
//                                 />
//                                 <CommandList>
//                                     {projectLoading && <div className="p-4 text-center text-sm">Loading...</div>}
//                                     <CommandEmpty>{!projectLoading && "No projects found."}</CommandEmpty>
//                                     <CommandGroup>
//                                         {!projectLoading &&
//                                             projects.map((project) => (
//                                                 <CommandItem
//                                                     key={project._id}
//                                                     value={`${project.code} ${project.name}`}
//                                                     onSelect={() => {
//                                                         setSelectedProjectId(project._id);
//                                                         setPopoverOpen(false);
//                                                     }}
//                                                 >
//                                                     <Check
//                                                         className={`mr-2 h-4 w-4 ${
//                                                             selectedProjectId === project._id ? "opacity-100" : "opacity-0"
//                                                         }`}
//                                                     />
//                                                     <div className="flex flex-col">
//                                                         <span className="font-medium">{project.code} - {project.name}</span>
//                                                     </div>
//                                                 </CommandItem>
//                                             ))}
//                                     </CommandGroup>
//                                 </CommandList>
//                             </Command>
//                         </PopoverContent>
//                     </Popover>

//                     <Button onClick={openCreate} disabled={mrsLoading}>
//                         <Plus className="mr-2 h-4 w-4" /> Create MRS Item
//                     </Button>
//                     {/* <Button 
//                         variant="outline" 
//                         onClick={() => dispatch(fetchMRS())} 
//                         disabled={mrsLoading}
//                     >
//                         <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
//                     </Button> */}
//                     {/* <Button 
//                         variant="outline" 
//                         onClick={resetSendCounts}
//                         className="text-red-600 hover:text-red-700"
//                     >
//                         Reset Counts
//                     </Button> */}
//                     {/* <Button variant="outline" onClick={bootstrapInventory}>
//                         <Truck className="mr-2 h-4 w-4" /> Bootstrap Inv
//                     </Button> */}
//                 </div>
//             </div>

//             {/* Metrics */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <Card>
//                     <CardHeader><CardTitle>Total Required Qty</CardTitle></CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold">{totalRequired}</div>
//                         <div className="text-sm text-muted-foreground">{selectedProjectId ? "For selected project" : "All items"}</div>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardHeader><CardTitle>Open / Sent</CardTitle></CardHeader>
//                     <CardContent>
//                         <div className="flex gap-4">
//                             <div><div className="text-lg font-semibold">{totalOpen}</div><div className="text-xs text-muted-foreground">Open/Planned</div></div>
//                             <div><div className="text-lg font-semibold">{totalSent}</div><div className="text-xs text-muted-foreground">Sent</div></div>
//                         </div>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardHeader><CardTitle>Bulk Actions</CardTitle></CardHeader>
//                     <CardContent>
//                         <TooltipProvider>
//                             <div className="flex gap-2 items-center">
//                                 <Button disabled={selectedList.length === 0 || prLoading} onClick={() => sendToPurchase(selectedList)}>
//                                     <ShoppingCart className="mr-2 h-4 w-4" /> Send to Purchase
//                                 </Button>
//                                 <span className="text-muted-foreground text-xs">{selectedList.length} selected</span>
//                             </div>
//                         </TooltipProvider>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* MRS Table */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Material Requirement Sheet (MRS)</CardTitle>
//                     {selectedProjectId && wbsLoading && <p className="text-sm text-blue-500">Fetching Project WBS Materials...</p>}
//                 </CardHeader>
//                 <CardContent>
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead className="w-[50px]"></TableHead>
//                                 <TableHead>Source Task</TableHead>
//                                 <TableHead>Item / Material</TableHead>
//                                 <TableHead>Quantity</TableHead>
//                                 <TableHead>Status</TableHead>
//                                 <TableHead>Delivery Status</TableHead>
//                                 <TableHead>Required Date</TableHead>
//                                 <TableHead>Actions</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {mrsLoading && <TableRow><TableCell colSpan={8} className="text-center">Loading MRS...</TableCell></TableRow>}
                            
//                             {!mrsLoading && paginatedMrsItems.length === 0 && (
//                                 <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No materials found.</TableCell></TableRow>
//                             )}

//                             {paginatedMrsItems.map((m) => (
//                                 <TableRow key={m.id || m._id} className={m.isWbsLinked ? "bg-slate-50" : ""}>
//                                     <TableCell>
//                                         <input 
//                                             type="checkbox" 
//                                             checked={!!selectedIds[m.id || m._id!]} 
//                                             onChange={() => toggleSelect(m.id || m._id!)} 
//                                         />
//                                     </TableCell>
//                                     <TableCell>
//                                         {m.task || "—"}
//                                         {m.task && <Badge variant="secondary" className="ml-2 text-[10px]">WBS</Badge>}
//                                     </TableCell>
//                                     <TableCell className="font-medium">
//                                         {m.item} 
//                                         {m.unit && <span className="text-xs text-gray-500 ml-1">({m.unit})</span>}
//                                     </TableCell>
//                                     <TableCell>{m.quantity}</TableCell>
//                                     <TableCell>
//                                         {(() => {
//                                             const itemId = m.id || m._id;
//                                             const status = itemId ? mrsStatusSync[itemId] : undefined;
//                                             console.log(`Item: ${m.item}, ID: ${itemId}, Status: ${status}`);
//                                             return status === 'in-transit' ? (
//                                                 <Button 
//                                                     size="sm" 
//                                                     variant="default"
//                                                     className="bg-green-600 hover:bg-green-700"
//                                                     onClick={() => handleItemReceived(m)}
//                                                 >
//                                                     Item Received
//                                                 </Button>
//                                             ) : status === 'received' ? (
//                                                 <Button 
//                                                     size="sm" 
//                                                     variant="outline"
//                                                     disabled
//                                                     className="bg-gray-100"
//                                                 >
//                                                     Received ✓
//                                                 </Button>
//                                             ) : (
//                                                 <Button 
//                                                     size="sm" 
//                                                     variant="outline"
//                                                     onClick={() => handleSendClick(m, "INVENTORY")}
//                                                 >
//                                                     Sent
//                                                 </Button>
//                                             );
//                                         })()}
//                                     </TableCell>
//                                     <TableCell>
//                                         {(() => {
//                                             const deliveryStatus = m.deliveryStatus || 'pending';
//                                             const getStatusColor = (status: string) => {
//                                                 switch (status) {
//                                                     case 'pending': return 'bg-gray-100 text-gray-800';
//                                                     case 'sent': return 'bg-blue-100 text-blue-800';
//                                                     case 'in-transit': return 'bg-yellow-100 text-yellow-800';
//                                                     case 'received': return 'bg-green-100 text-green-800';
//                                                     case 'returned': return 'bg-red-100 text-red-800';
//                                                     default: return 'bg-gray-100 text-gray-800';
//                                                 }
//                                             };
                                            
//                                             return (
//                                                 <Badge className={`${getStatusColor(deliveryStatus)} capitalize`}>
//                                                     {deliveryStatus.replace('-', ' ')}
//                                                 </Badge>
//                                             );
//                                         })()}
//                                     </TableCell>
//                                     <TableCell>{m.requiredDate ? new Date(m.requiredDate).toLocaleDateString() : "—"}</TableCell>
//                                     <TableCell>
//                                         <div className="flex gap-2">
//                                             {/* {canEdit && <Button size="icon" variant="ghost" onClick={() => openEdit(m)} disabled={mrsLoading || !!m.task}>
//                                                 <Edit2 className="h-4 w-4" />
//                                             </Button>} */}
//                                             <Button 
//                                                 size="icon" 
//                                                 variant="ghost" 
//                                                 onClick={() => {
//                                                     console.log("🖱️ Delete button clicked for item:", m.id || m._id, m);
//                                                     handleDelete(m.id || m._id!, !!m.task);
//                                                 }} 
//                                                 disabled={mrsLoading || (m.deliveryStatus === 'received')}
//                                                 className={m.deliveryStatus === 'received' ? 'opacity-50 cursor-not-allowed' : ''}
//                                                 title={
//                                                     m.deliveryStatus === 'received' 
//                                                         ? "Cannot delete received items - material already delivered" 
//                                                         : m.task 
//                                                         ? `Delete WBS-linked item: ${m.task}` 
//                                                         : "Delete MRS item"
//                                                 }
//                                             >
//                                                 <Trash2 className={`h-4 w-4 ${m.deliveryStatus === 'received' ? 'text-gray-400' : 'text-red-600'}`} />
//                                             </Button>
//                                             <Button 
//                                                 variant="ghost" 
//                                                 onClick={() => handleSendClick(m, "PURCHASE")}
//                                             >
//                                                 <ShoppingCartIcon className="mr-2 h-4 w-4"/> 
//                                                 Send {(() => {
//                                                     const itemId = m.id || m._id || m.item;
//                                                     const key = `${itemId}_PURCHASE`;
//                                                     const count = sendClickCounts[key];
//                                                     return count ? (
//                                                         <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
//                                                             {count}
//                                                         </span>
//                                                     ) : '';
//                                                 })()}
//                                             </Button>
//                                             <Button size="sm" onClick={() => handleCheckStatus(m)}>
//                                                 <Truck className="h-4 w-4" /> Check Status
//                                             </Button>
//                                         </div>
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>

//                     {/* Pagination */}
//                     {displayedMrsList.length > MRS_PAGE_SIZE && (
//                         <div className="flex items-center justify-end gap-2 pt-4">
//                              <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => setMrsPage((prev) => Math.max(1, prev - 1))}
//                                 disabled={mrsPage === 1}
//                             >
//                                 Previous
//                             </Button>
//                             <span className="text-sm text-muted-foreground">Page {mrsPage} of {mrsTotalPages}</span>
//                             <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => setMrsPage((prev) => Math.min(mrsTotalPages, prev + 1))}
//                                 disabled={mrsPage === mrsTotalPages}
//                             >
//                                 Next
//                             </Button>
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>

//             {/* Purchase Requests & Orders */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <Card>
//                     <CardHeader><CardTitle>Purchase Requests (PR)</CardTitle></CardHeader>
//                     <CardContent>
//                         {prLoading && <div className="text-center py-4">Loading...</div>}
//                         {(prs || []).length === 0 ? <div className="text-muted-foreground">No PRs yet.</div> : (
//                             <div className="max-h-[300px] overflow-y-auto space-y-2">
//                                 {prs.map((pr) => (
//                                     <div key={pr._id} className="rounded-md border p-3 flex justify-between items-center">
//                                         <div>
//                                             <div className="font-semibold text-sm">PR #{pr._id?.substring(0,6)}</div>
//                                             <div className="text-xs text-muted-foreground">{new Date(pr.createdAt).toLocaleDateString()}</div>
//                                         </div>
//                                         <Badge>{pr.status}</Badge>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardHeader><CardTitle>Purchase Orders (PO)</CardTitle></CardHeader>
//                     <CardContent>
//                         {poLoading && <div className="text-center py-4">Loading...</div>}
//                         {(pos || []).length === 0 ? <div className="text-muted-foreground">No POs yet.</div> : (
//                             <div className="max-h-[300px] overflow-y-auto space-y-2">
//                                 {(pos as any[]).filter((po: any) => po.items).map((po: any) => (
//                                     <div key={po._id} className="rounded-md border p-3 flex justify-between items-center">
//                                         <div>
//                                             <div className="font-semibold text-sm">{po.poNo || "PO-###"}</div>
//                                             <div className="text-xs text-muted-foreground">{po.supplier}</div>
//                                         </div>
//                                         <Button size="sm" variant="secondary" onClick={() => receiveAgainstPO(po._id, 1)}>
//                                             Mark Received
//                                         </Button>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Material Status Tracker */}
//             <Card>
//                 <CardHeader><CardTitle>Material Status Tracker</CardTitle></CardHeader>
//                 <CardContent>
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>Item</TableHead>
//                                 <TableHead>PO No</TableHead>
//                                 <TableHead>Status</TableHead>
//                                 <TableHead>Received / Issued</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {paginatedMaterialStatus.map((r, idx) => (
//                                 <TableRow key={idx}>
//                                     <TableCell>{r.item}</TableCell>
//                                     <TableCell>{r.poNo}</TableCell>
//                                     <TableCell>
//                                         <span className={`inline-block w-2 h-2 rounded-full mr-2 ${r.remaining > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
//                                         {r.remaining > 0 ? "Available" : "Shortage"}
//                                     </TableCell>
//                                     <TableCell>{r.received} / {r.issued}</TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>
//                 </CardContent>
//             </Card>

//             {/* Dialog to create/edit MRS */}
//             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//                 <DialogContent className="max-w-2xl">
//                     <DialogHeader>
//                         <DialogTitle>{editing ? "Edit MRS Item" : "Create MRS Item"}</DialogTitle>
//                         <DialogDescription>{editing ? "Update item info." : "Add material requirement"}</DialogDescription>
//                     </DialogHeader>
//                     <div className="grid gap-4 py-4">
//                         <div className="grid grid-cols-2 gap-4">
//                             <div>
//                                 <Label>Project</Label>
//                                 <Input 
//                                     value={selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : "No project selected"} 
//                                     disabled 
//                                     className="bg-muted cursor-not-allowed"
//                                 />
//                             </div>
//                             <div className="space-y-2">
//                                 <Label>Task</Label>
//                                 <Popover open={taskPopoverOpen} onOpenChange={setTaskPopoverOpen}>
//                                     <PopoverTrigger asChild>
//                                         <Button
//                                             variant="outline"
//                                             role="combobox"
//                                             aria-expanded={taskPopoverOpen}
//                                             className="w-full justify-between"
//                                             disabled={!selectedProjectId || wbsLoading}
//                                         >
//                                             {form.task || "Select task..."}
//                                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                                         </Button>
//                                     </PopoverTrigger>
//                                     <PopoverContent className="w-[400px] p-0">
//                                         <Command>
//                                             <CommandInput
//                                                 placeholder="Search tasks..."
//                                                 value={taskSearch}
//                                                 onValueChange={setTaskSearch}
//                                             />
//                                             <CommandList>
//                                                 {wbsLoading && <div className="p-4 text-center text-sm">Loading...</div>}
//                                                 <CommandEmpty>
//                                                     {!wbsLoading && (!selectedProjectId ? "Please select a project first" : "No tasks found")}
//                                                 </CommandEmpty>
//                                                 <CommandGroup>
//                                                     {!wbsLoading && projectWbsItems.length > 0 && projectWbsItems
//                                                         .filter((item) => {
//                                                             if (!taskSearch) return true;
//                                                             const searchLower = taskSearch.toLowerCase();
//                                                             const path = getWbsHierarchicalPath(item, projectWbsItems);
//                                                             return path.toLowerCase().includes(searchLower) || 
//                                                                    item.type.toLowerCase().includes(searchLower);
//                                                         })
//                                                         .map((item) => {
//                                                             const path = getWbsHierarchicalPath(item, projectWbsItems);
//                                                             return (
//                                                                 <CommandItem
//                                                                     key={item.id}
//                                                                     value={item.name}
//                                                                     onSelect={() => {
//                                                                         setForm({ ...form, task: item.name });
//                                                                         setTaskPopoverOpen(false);
//                                                                     }}
//                                                                 >
//                                                                     <Check
//                                                                         className={`mr-2 h-4 w-4 ${
//                                                                             form.task === item.name ? "opacity-100" : "opacity-0"
//                                                                         }`}
//                                                                     />
//                                                                     <div className="flex flex-col">
//                                                                         <span className="font-medium">{path}</span>
//                                                                         <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
//                                                                     </div>
//                                                                 </CommandItem>
//                                                             );
//                                                         })}
//                                                 </CommandGroup>
//                                             </CommandList>
//                                         </Command>
//                                     </PopoverContent>
//                                 </Popover>
//                             </div>
//                         </div>
//                         <div className="grid grid-cols-2 gap-4">
//                             <div className="space-y-2">
//                                 <Label>Item</Label>
//                                 {!isCustomItem ? (
//                                     <Popover open={itemPopoverOpen} onOpenChange={setItemPopoverOpen}>
//                                         <PopoverTrigger asChild>
//                                             <Button
//                                                 variant="outline"
//                                                 role="combobox"
//                                                 aria-expanded={itemPopoverOpen}
//                                                 className="w-full justify-between"
//                                             >
//                                                 {form.item || "Select material..."}
//                                                 <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                                             </Button>
//                                         </PopoverTrigger>
//                                         <PopoverContent className="w-[400px] p-0">
//                                             <Command>
//                                                 <CommandInput
//                                                     placeholder="Search materials..."
//                                                     value={itemSearch}
//                                                     onValueChange={setItemSearch}
//                                                 />
//                                                 <CommandList>
//                                                     <CommandEmpty>No materials found.</CommandEmpty>
//                                                     <CommandGroup>
//                                                         {/* Raw Materials */}
//                                                         {rawMaterials
//                                                             .filter((material) => {
//                                                                 if (!itemSearch) return true;
//                                                                 return material.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
//                                                                        material.itemCode?.toLowerCase().includes(itemSearch.toLowerCase());
//                                                             })
//                                                             .map((material) => (
//                                                                 <CommandItem
//                                                                     key={material._id}
//                                                                     value={material.name}
//                                                                     onSelect={() => {
//                                                                         setForm({ ...form, item: material.name });
//                                                                         setItemPopoverOpen(false);
//                                                                     }}
//                                                                 >
//                                                                     <Check
//                                                                         className={`mr-2 h-4 w-4 ${
//                                                                             form.item === material.name ? "opacity-100" : "opacity-0"
//                                                                         }`}
//                                                                     />
//                                                                     <div className="flex flex-col">
//                                                                         <span className="font-medium">{material.name}</span>
//                                                                         <span className="text-xs text-muted-foreground">
//                                                                             {material.itemCode} | Stock: <span className={(material.quantity || 0) > 0 ? 'text-green-600' : 'text-red-600'}>{material.quantity || 0}</span> {material.unitOfMeasure}
//                                                                             {material.stocks && material.stocks.length > 0 && (
//                                                                                 <span className="ml-2 text-blue-600">
//                                                                                     | FIFO: {material.stocks.filter((s: any) => s.remainingQuantity > 0).length} batches
//                                                                                 </span>
//                                                                             )}
//                                                                         </span>
//                                                                     </div>
//                                                                 </CommandItem>
//                                                             ))}
                                                        
//                                                         {/* Other Option */}
//                                                         <CommandItem
//                                                             value="other"
//                                                             onSelect={() => {
//                                                                 setIsCustomItem(true);
//                                                                 setForm({ ...form, item: "" });
//                                                                 setItemPopoverOpen(false);
//                                                             }}
//                                                         >
//                                                             <Plus className="mr-2 h-4 w-4" />
//                                                             <span className="font-medium">Other (Custom Item)</span>
//                                                         </CommandItem>
//                                                     </CommandGroup>
//                                                 </CommandList>
//                                             </Command>
//                                         </PopoverContent>
//                                     </Popover>
//                                 ) : (
//                                     <div className="space-y-2">
//                                         <Input 
//                                             value={form.item || ""} 
//                                             onChange={(e) => setForm({ ...form, item: e.target.value })}
//                                             placeholder="Enter custom item name..."
//                                         />
//                                         <Button
//                                             type="button"
//                                             variant="outline"
//                                             size="sm"
//                                             onClick={() => {
//                                                 setIsCustomItem(false);
//                                                 setForm({ ...form, item: "" });
//                                             }}
//                                         >
//                                             ← Back to Material List
//                                         </Button>
//                                     </div>
//                                 )}
//                             </div>
//                             <div><Label>Quantity</Label><Input type="number" value={form.quantity ?? 1} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value || "0") })} /></div>
//                         </div>
//                         <div className="grid grid-cols-2 gap-4">
//                             <div><Label>Price (₹)</Label><Input type="number" step="0.01" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value || "0") })} placeholder="0.00" /></div>
//                             <div><Label>Required Date</Label><Input type="date" value={form.requiredDate ? form.requiredDate.split("T")[0] : ""} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} /></div>
//                         </div>
//                     </div>
//                     <DialogFooter className="flex justify-between">
//                         {!editing && (
//                             <Button 
//                                 type="button"
//                                 variant="secondary" 
//                                 onClick={addMoreMRSItem}
//                                 disabled={mrsLoading}
//                             >
//                                 <Plus className="mr-2 h-4 w-4" />
//                                 Add More
//                             </Button>
//                         )}
//                         <div className="flex gap-2">
//                             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
//                             <Button onClick={handleSave} disabled={mrsLoading}>{editing ? "Save Changes" : "Create Item"}</Button>
//                         </div>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>

//             <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
//                 <DialogContent className="max-w-md">
//                     <DialogHeader>
//                         <DialogTitle>Add Remark</DialogTitle>
//                         <DialogDescription>
//                             Add a note for the {notificationTarget?.type === "INVENTORY" ? "Inventory" : "Purchase"} team.
//                         </DialogDescription>
//                     </DialogHeader>
//                     <div className="py-4">
//                         <Label>Remark</Label>
//                         <Textarea 
//                             placeholder="Enter details here..." 
//                             value={remarkText} 
//                             onChange={(e) => setRemarkText(e.target.value)} 
//                             className="mt-2"
//                         />
//                     </div>
//                     <DialogFooter>
//                         <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>Cancel</Button>
//                         <Button onClick={handleSubmitNotification}>Send Notification</Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// }

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
import { Plus, Trash2, Truck, ShoppingCart, Check, ChevronsUpDown, ShoppingCartIcon, ShieldAlert } from "lucide-react";

// Redux Actions
import {
    fetchMRS,
    createMRS,
    updateMRS,
    deleteMRS,
    markAsSent,
    markAsInTransit,
    markAsReceived,
    returnMaterial,
    fetchDeliveryStatistics,
    markAsSentToPurchase,
    markPurchaseRequestProcessed,
} from "@/redux/slices/mrsSlice";
import { createMaterialRequest, fetchMaterialRequests, updateMaterialRequestStatus } from "@/redux/slices/materialRequestSlice";
import { convertToPR } from "@/redux/slices/prSlice";
import { receivePO } from "@/redux/slices/poSlice";
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchWbsByProject, WBSItem } from "@/redux/slices/wbsSlice";
import { fetchMaterials, RawMaterial } from "@/redux/slices/rawmaterialSlice";
import { Project } from "@/types/project";

// Hooks
import { useDebounce } from "@/hooks/useDebounce";
import { usePermission } from "@/hooks/userPermission";
import api from "@/utils/axiosApi";
import { BASE_URL } from "@/utils/constants";

// Import Types
import { MRSItem, PurchaseRequest, PurchaseOrder, InventoryItem } from "@/types/procurement";

// Extended types for local use
interface ExtendedMRSItem extends Omit<MRSItem, '_id' | 'status'> {
    id?: string; // Helper for compatibility
    _id?: string; // Make optional for compatibility
    price?: number;
    isWbsLinked?: boolean; // Helper flag
    unit?: string; // Helper for display
    status?: "open" | "sent" | "ordered" | "received" | "cancelled" | "planned"; // Extended status
}

interface ExtendedInventoryItem extends Omit<InventoryItem, '_id'> {
    id?: string; // Helper for compatibility
    _id?: string; // Make optional for compatibility
}

// --- Helper: Generate ID ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Local Inventory Helpers ---
const getInventory = (): ExtendedInventoryItem[] => {
    const stored = localStorage.getItem('INVENTORY');
    return stored ? JSON.parse(stored) : [];
};
const saveInventory = (list: ExtendedInventoryItem[]) => localStorage.setItem('INVENTORY', JSON.stringify(list));

// --- Component ---
export default function ProcurementPage() {
    const dispatch = useDispatch<AppDispatch>();

    const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
    const [remarkText, setRemarkText] = useState("");
    const [notificationTarget, setNotificationTarget] = useState<{
        item: ExtendedMRSItem;
        type: "INVENTORY" | "PURCHASE"; // To distinguish between the two buttons
    } | null>(null);

    const canView = usePermission('procurementMaterialTracking', 'view');


    const handleOpenRemarkDialog = (item: ExtendedMRSItem, type: "INVENTORY" | "PURCHASE") => {
        setNotificationTarget({ item, type });
        setRemarkText(""); // Reset remark
        setRemarkDialogOpen(true);
    };

    const handleSendClick = (item: ExtendedMRSItem, type: "INVENTORY" | "PURCHASE") => {
        // Open the remark dialog for both INVENTORY and PURCHASE
        handleOpenRemarkDialog(item, type);
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

        // Define notification type based on destination
        const notificationType = type === "INVENTORY" 
            ? "general"
            : "material_request_rfq"; // New type for RFQ material requests

        try {
            const itemId = item.id || item._id;
            if (!itemId) {
                toast.error("Invalid item ID");
                return;
            }

            // 🚀 For INVENTORY type, update MRS delivery status in database
            if (type === "INVENTORY") {
                // Mark as sent for delivery in database
                await dispatch(markAsSent({
                    id: itemId,
                    transportDetails: {
                        method: 'Standard Delivery',
                        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        deliveryNotes: remarkText
                    }
                }));
                console.log('✅ MRS marked as sent to delivery in database');
            }

            // 🚀 For PURCHASE type, update MRS purchase request status in database
            if (type === "PURCHASE") {
                // Mark as sent to purchase in database
                await dispatch(markAsSentToPurchase({
                    id: itemId,
                    sentBy: 'Current User', // You can get this from auth context
                    remarks: remarkText
                }));
                console.log('✅ MRS marked as sent to purchase in database');
            }

            // Create notification with complete item details
            await dispatch(createNotification({
                source,
                destination,
                remark: remarkText,
                itemId: itemId,
                itemName: item.item,
                type: notificationType, // Use the new notification type
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

            // 🚀 Refresh MRS data to show updated status
            dispatch(fetchMRS());

            toast.success(`Notification sent to ${type === "INVENTORY" ? "Delivery Management" : "Purchase"} and status updated in database`);
            setRemarkDialogOpen(false);
            setNotificationTarget(null);
            setRemarkText("");
        } catch (error) {
            toast.error("Failed to send notification");
            console.error(error);
        }
    };
    // Redux Selectors
    const mrsListRaw = useSelector((state: RootState) => state.mrs.list) as ExtendedMRSItem[];
    const wbsList = useSelector((state: RootState) => state.wbs.wbs) as WBSItem[]; 
    const rawMaterials = useSelector((state: RootState) => state.rawMaterials.materials) as RawMaterial[];
    const projects = useSelector((state: RootState) => state.projects.projects) as Project[];
    const prs = useSelector((state: RootState) => state.pr.list) as PurchaseRequest[];
    const pos = useSelector((state: RootState) => state.po.list);
    
    // Loading States
    const mrsLoading = useSelector((state: RootState) => state.mrs.loading);
    const prLoading = useSelector((state: RootState) => state.pr.loading);
    const poLoading = useSelector((state: RootState) => state.po.loading);
    const projectLoading = useSelector((state: RootState) => state.projects.loading);
    const wbsLoading = useSelector((state: RootState) => state.wbs.loading);

    // Local State
    const [inventory, setInventory] = useState<ExtendedInventoryItem[]>([]);
    
    // NEW: MRS Search State
    const [mrsSearch, setMrsSearch] = useState("");
    const debouncedMrsSearch = useDebounce(mrsSearch, 300);
    
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
    const [editing, setEditing] = useState<ExtendedMRSItem | null>(null);
    const [form, setForm] = useState<Partial<ExtendedMRSItem>>({ item: "", quantity: 1, price: 0, requiredDate: "" });
    const [multipleItems, setMultipleItems] = useState<Partial<ExtendedMRSItem>[]>([]);
    const [taskPopoverOpen, setTaskPopoverOpen] = useState(false);
    const [taskSearch, setTaskSearch] = useState("");
    const [itemPopoverOpen, setItemPopoverOpen] = useState(false);
    const [itemSearch, setItemSearch] = useState("");
    const [isCustomItem, setIsCustomItem] = useState(false);

    // Initial Data Load
    useEffect(() => {
        dispatch(fetchMRS());
        dispatch(fetchMaterials({ page: 1, limit: 1000 })); // Fetch Raw Materials to map names
        dispatch(fetchDeliveryStatistics()); // 🚀 Fetch delivery statistics
        setInventory(getInventory());
        

    }, [dispatch]);

    // 🚀 Auto-refresh MRS data every 30 seconds to catch delivery updates
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing MRS data for delivery updates...');
            dispatch(fetchMRS());
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [dispatch]);

    // 🚀 Listen for delivery status changes from other modules
    useEffect(() => {
        const handleDeliveryStatusChange = (event: any) => {
            console.log('📦 Delivery status changed event received:', event.detail);
            // Refresh MRS data when delivery status changes
            dispatch(fetchMRS());
            toast.info(`Delivery status updated for ${event.detail.itemName || 'item'}`);
        };

        // Listen for custom events from delivery module
        window.addEventListener('deliveryStatusChanged', handleDeliveryStatusChange);
        window.addEventListener('materialRequestStatusChanged', handleDeliveryStatusChange);

        return () => {
            window.removeEventListener('deliveryStatusChanged', handleDeliveryStatusChange);
            window.removeEventListener('materialRequestStatusChanged', handleDeliveryStatusChange);
        };
    }, [dispatch]);
    
    // 🔥 Auto-refresh MRS when project changes
    useEffect(() => {
        if (selectedProjectId) {
            dispatch(fetchMRS());
        }
    }, [selectedProjectId, dispatch]);
    


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
            const parent = allWbs.find(w => w.id === currentItem!.parentId);
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

    // --- DATA TRANSFORMATION: Filter by Project and Search ---
    const displayedMrsList = useMemo(() => {
        console.log("🔍 Filtering MRS items:", {
            selectedProjectId,
            debouncedMrsSearch, 
            totalMrsItems: mrsListRaw.length,
            mrsItems: mrsListRaw.map(item => ({ id: item.id || item._id, item: item.item, projectId: item.projectId }))
        });
        
        let filteredByProject: ExtendedMRSItem[];
        
        // 1. Filter by Project ID
        if (!selectedProjectId) {
            filteredByProject = mrsListRaw.filter(item => !item.projectId || item.projectId === null || item.projectId === undefined);
            console.log("🔍 No project selected, showing items without projectId:", filteredByProject.length);
        } else {
            // If Project IS selected, show all MRS items for this project
            const selectedId = String(selectedProjectId || '');
            filteredByProject = mrsListRaw.filter(item => {
                const itemProjectId = String(item.projectId || '');
                return itemProjectId === selectedId;
            });
            console.log("🔍 Project selected, showing items for project:", selectedProjectId, "Count:", filteredByProject.length);
        }
        
        // 2. Filter by Search Term
        if (debouncedMrsSearch.trim()) {
            const searchLower = debouncedMrsSearch.trim().toLowerCase();
            const filteredBySearch = filteredByProject.filter(item => {
                const itemId = String(item.id || item._id || '').toLowerCase();
                const itemName = String(item.item || '').toLowerCase();
                const itemTask = String(item.task || '').toLowerCase();
                const itemStatus = String(item.status || '').toLowerCase();
                const itemDeliveryStatus = String(item.deliveryStatus || '').toLowerCase();
                
                return itemName.includes(searchLower) ||
                       itemTask.includes(searchLower) ||
                       itemStatus.includes(searchLower) ||
                       itemDeliveryStatus.includes(searchLower) ||
                       itemId.includes(searchLower);
            });
            console.log("🔍 Search applied, showing items matching term:", debouncedMrsSearch, "Count:", filteredBySearch.length);
            return filteredBySearch;
        }


        return filteredByProject;

    }, [selectedProjectId, mrsListRaw, debouncedMrsSearch]); // <-- Add debouncedMrsSearch dependency

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
    const persistInventory = (list: ExtendedInventoryItem[]) => {
        setInventory(list);
        saveInventory(list);
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ item: "", quantity: 1, price: 0, requiredDate: "", projectId: selectedProjectId || undefined, materialId: undefined });
        setMultipleItems([]);
        setIsCustomItem(false);
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
            materialId: undefined
        });
        setIsCustomItem(false);
        
        toast.success(`${multipleItems.length + 1} item(s) ready to save. Fill in the next item.`);
    };

    // const openEdit = (m: ExtendedMRSItem) => {
    //     if (m.isWbsLinked) {
    //         alert(`This item is linked to WBS Task: "${m.task}". Please edit it in the WBS module.`);
    //         return;
    //     }
    //     setEditing(m);
    //     setForm(m);
        
    //     // Check if the item is a custom item (not in raw materials list)
    //     const isInRawMaterials = rawMaterials.some(material => material.name === m.item);
    //     setIsCustomItem(!isInRawMaterials);
        
    //     setIsDialogOpen(true);
    // };

    const handleSave = async () => {
        // If editing, use single form
        if (editing) {
            if (!form.item?.trim() || form.quantity === undefined || form.quantity < 1) {
                toast.error("Item and quantity are required");
                return;
            }
            const cleanForm: Partial<ExtendedMRSItem> = {
                ...form,
                item: form.item.trim(),
                quantity: Number(form.quantity),
                price: form.price ? Number(form.price) : undefined,
                requiredDate: form.requiredDate ? form.requiredDate : undefined,
                projectId: form.projectId || selectedProjectId || undefined, 
            };
            
            await dispatch(updateMRS({ id: editing._id || editing.id || '', data: cleanForm as any }));
            await dispatch(fetchMRS());
            
            setIsDialogOpen(false);
            setEditing(null);
            setForm({ item: "", quantity: 1, price: 0, requiredDate: "" });
            setIsCustomItem(false);
            return;
        }

        // For creating - validate current form
        if (!form.item?.trim() || form.quantity === undefined || form.quantity < 1) {
            toast.error("Item and quantity are required");
            return;
        }

        // Combine multipleItems with current form
        const allItems = [...multipleItems, form];

        // Check stock availability and deduct from raw materials
        for (const item of allItems) {
            const materialName = item.item?.trim();
            const requestedQty = Number(item.quantity);
            
            // Find the raw material
            const rawMaterial = rawMaterials.find(rm => rm.name === materialName);
            
            if (rawMaterial) {
                // 🚀 Check FIFO stock availability (calculate from remainingQuantity in stocks)
                let currentStock = 0;
                if (rawMaterial.stocks && Array.isArray(rawMaterial.stocks)) {
                    currentStock = rawMaterial.stocks.reduce((total: number, stock: any) => {
                        return total + (stock.remainingQuantity || 0);
                    }, 0);
                } else {
                    currentStock = rawMaterial.quantity || 0;
                }
                
                console.log(`📊 FIFO Stock check for ${materialName}: Available=${currentStock}, Requested=${requestedQty}`);
                
                if (currentStock < requestedQty) {
                    toast.error(`Not enough stock for ${materialName}. Available: ${currentStock}, Requested: ${requestedQty}`);
                    return;
                }
                
                // 🚀 Deduct from raw material stock using FIFO
                try {
                    const organisationId = localStorage.getItem("organisationId");
                    
                    console.log(`🔍 Using FIFO to consume ${requestedQty} of ${materialName}`);
                    
                    const fifoResponse = await api.post('/fifo/consume-stock', {
                        materialId: rawMaterial._id,
                        quantity: requestedQty,
                        reason: `MRS Creation - ${item.task || 'Material Requirement'}`,
                        referenceId: `MRS-${Date.now()}`
                    }, {
                        headers: { 
                            organisationId,
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    
                    if (fifoResponse.data.success) {
                        console.log(`✅ FIFO consumption successful:`, fifoResponse.data.data);
                        console.log(`📊 Consumed from ${fifoResponse.data.data.consumedBatches.length} batches`);
                        console.log(`💰 Average cost: ₹${fifoResponse.data.data.averageCost}`);
                    } else {
                        throw new Error(fifoResponse.data.message || 'FIFO consumption failed');
                    }
                } catch (error: any) {
                    console.error('Failed to consume stock using FIFO:', error);
                    const errorMsg = error.response?.data?.message || error.message || 'FIFO consumption failed';
                    toast.error(`Failed to consume stock for ${materialName}: ${errorMsg}`);
                    return;
                }
            }
        }

        // Save all MRS items
        for (const item of allItems) {
            const cleanForm: Partial<ExtendedMRSItem> = {
                ...item,
                item: item.item?.trim(),
                quantity: Number(item.quantity),
                price: item.price ? Number(item.price) : undefined,
                requiredDate: item.requiredDate ? item.requiredDate : undefined,
                projectId: item.projectId || selectedProjectId || undefined, 
            };
            
            await dispatch(createMRS(cleanForm as any));
        }
        
        // Refetch both MRS and raw materials to show updated stock
        await dispatch(fetchMRS());
        await dispatch(fetchMaterials({ page: 1, limit: 1000 }));
        
        toast.success(`${allItems.length} MRS item(s) created successfully. Stock updated using FIFO.`);
        
        setIsDialogOpen(false);
        setEditing(null);
        setMultipleItems([]);
        setForm({ item: "", quantity: 1, price: 0, requiredDate: "", materialId: undefined });
        setIsCustomItem(false);
    };

    const handleDelete = async (id: string, isWbsLinked?: boolean) => {
        console.log("🗑️ handleDelete called with:", { id, isWbsLinked });
        console.log("🔍 Current BASE_URL:", BASE_URL);
        console.log("🔍 Token exists:", !!localStorage.getItem("token"));
        console.log("🔍 Organisation ID:", localStorage.getItem("organisationId"));
        
        // Find the MRS item to get its details before deletion
        const mrsItem = displayedMrsList.find(item => (item.id || item._id) === id);
        if (!mrsItem) {
            toast.error("MRS item not found");
            return;
        }
        
        console.log("📋 MRS item to delete:", mrsItem);
        
        // 🚀 NEW: Check delivery status - only allow deletion if not received
        const deliveryStatus = mrsItem.deliveryStatus || 'pending';
        console.log("📦 Delivery status:", deliveryStatus);
        
        if (deliveryStatus === 'received') {
            toast.error("Cannot delete received items. Material has already been delivered and may be in use.");
            return;
        }
        
        // Show different confirmation based on status
        const statusMessage = deliveryStatus === 'pending' 
            ? "This item is still pending delivery." 
            : deliveryStatus === 'sent' 
            ? "This item has been sent but not yet received."
            : deliveryStatus === 'in-transit'
            ? "This item is currently in transit."
            : "This item has not been received yet.";
        
        // Enhanced confirmation message based on WBS link status
        const wbsMessage = mrsItem.task 
            ? `\nWBS Task: ${mrsItem.task}\n\n⚠️ Note: Since material is not received, WBS task will NOT be affected. Only stock will be restored.`
            : '';
        
        if (!confirm(`Are you sure you want to delete this MRS item?\n\nItem: ${mrsItem.item}\nQuantity: ${mrsItem.quantity}\nStatus: ${deliveryStatus}${wbsMessage}\n\n${statusMessage}\n\n📦 This will restore ${mrsItem.quantity} units back to raw material stock.`)) {
            console.log("❌ User cancelled deletion");
            return;
        }
        
        console.log("✅ User confirmed deletion, proceeding...");
        
        // 🎯 IMPORTANT: Since item is not received, WBS is not affected
        // Only stock restoration is needed - no WBS material removal required
        console.log("📝 Note: Item not received, so WBS will not be affected. Only restoring stock.");
        
        try {
            // 🚀 STEP 1: Restore stock to raw materials using FIFO
            const materialName = mrsItem.item?.trim();
            const quantityToRestore = Number(mrsItem.quantity);
            
            if (materialName && quantityToRestore > 0) {
                // Find the raw material
                const rawMaterial = rawMaterials.find(rm => rm.name === materialName);
                
                if (rawMaterial) {
                    console.log(`📦 Restoring ${quantityToRestore} units of ${materialName} to stock...`);
                    
                    try {
                        const organisationId = localStorage.getItem("organisationId");
                        
                        // Add stock back using FIFO (reverse operation)
                        const restoreResponse = await api.post('/fifo/restore-stock', {
                            materialId: rawMaterial._id,
                            quantity: quantityToRestore,
                            reason: `MRS Deletion - Restoring stock for ${mrsItem.task || 'Material Requirement'}`,
                            referenceId: `MRS-DELETE-${id}`,
                            // Use average cost or last purchase cost for restoration
                            unitCost: rawMaterial.averageCost || rawMaterial.unitCost || 0
                        }, {
                            headers: { 
                                organisationId,
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });
                        
                        if (restoreResponse.data.success) {
                            console.log(`✅ Stock restored successfully:`, restoreResponse.data.data);
                            console.log(`📊 Restored ${quantityToRestore} units to ${materialName}`);
                            console.log(`📋 Movement record created:`, restoreResponse.data.data.movementRecord?.referenceNumber);
                            
                            // Store movement record info for success message
                            window.lastMovementRecord = restoreResponse.data.data.movementRecord;
                        } else {
                            console.warn('Stock restoration response not successful:', restoreResponse.data);
                        }
                    } catch (stockError: any) {
                        console.error('Failed to restore stock:', stockError);
                        // Continue with deletion even if stock restoration fails
                        toast.warning(`Stock restoration failed: ${stockError.response?.data?.message || stockError.message}. MRS will still be deleted.`);
                    }
                } else {
                    console.log(`⚠️ Raw material "${materialName}" not found in master list. Skipping stock restoration.`);
                }
            }
            
            // 🚀 STEP 2: Delete the MRS item
            console.log("🚀 Dispatching deleteMRS action with ID:", id);
            console.log("🌐 Making API call to:", `${BASE_URL}/delete/mrs/${id}`);
            
            const result = await dispatch(deleteMRS(id)).unwrap();
            console.log("✅ Delete successful, result:", result);
            
            // 🚀 STEP 3: Refresh both MRS and raw materials data
            console.log("🔄 Refreshing MRS list and raw materials...");
            await Promise.all([
                dispatch(fetchMRS()),
                dispatch(fetchMaterials({ page: 1, limit: 1000 }))
            ]);
            console.log("✅ Data refreshed");
            
            // Show user where to find movement records
            if ((window as any).lastMovementRecord) {
                console.log("📋 To view movement records, check:");
                console.log("   - Inventory → Reporting → Moves Analysis");
                console.log("   - Or check Material Movements API endpoint");
            }
            
            // Enhanced success message with WBS clarification and movement record
            const wbsNote = mrsItem.task ? " WBS task not affected (material was not received)." : "";
            const movementNote = (window as any).lastMovementRecord 
                ? ` Movement record: ${(window as any).lastMovementRecord.referenceNumber}` 
                : "";
            
            toast.success(`MRS item deleted successfully. ${quantityToRestore} units restored to ${materialName} stock.${wbsNote}${movementNote}`, {
                duration: 6000 // Show longer to read the movement record
            });
            
            // Clear the stored movement record
            delete (window as any).lastMovementRecord;
        } catch (error: any) {
            console.error("❌ Delete MRS error:", error);
            console.error("❌ Error details:", {
                message: error.message,
                status: error.status,
                response: error.response?.data
            });
            toast.error(error.message || "Failed to delete MRS item");
        }
    };

    // --- Purchase Logic ---
    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
    const toggleSelect = (id: string) => setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
    const selectedList = Object.keys(selectedIds).filter((k) => selectedIds[k]);

    const sendToPurchase = async (mrsIds: string[], supplier?: string, deliveryDate?: string) => {
        if (!mrsIds || mrsIds.length === 0) {
            toast.error("Please select at least one item");
            return;
        }
        
        try {
            // Get selected MRS items
            const selectedItems = displayedMrsList.filter(item => {
                const itemId = item.id || item._id;
                return itemId && mrsIds.includes(itemId);
            });
            
            if (selectedItems.length === 0) {
                toast.error("No valid items selected");
                return;
            }
            
            // Create notifications for each selected item
            const source = "procurement.project-management";
            const destination = "rfq.purchase";
            
            for (const item of selectedItems) {
                await dispatch(createNotification({
                    source,
                    destination,
                    remark: `Bulk purchase request for ${item.item}`,
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
            }
            
            toast.success(`${selectedItems.length} notification(s) sent to Purchase`);
            setSelectedIds({});
        } catch (err: any) {
            console.error('Send to Purchase failed:', err);
            toast.error("Failed to send notifications");
        }
    };

    const checkStockAvailability = (itemName: string) => {
        const found = inventory.find((it) => it.item.toLowerCase() === itemName.toLowerCase());
        return found ? found.qty : 0;
    };

    const receiveAgainstPO = async (poId: string, qtyReceived: number) => {
        await dispatch(receivePO({ poId, qty: qtyReceived }));
        const po = (pos as any[]).find((p: any) => p._id === poId);
        if (po && po.items) {
            const inv = getInventory();
            (po.items || []).forEach((it: any) => {
                const existing = inv.find((x) => x.item.toLowerCase() === it.item.toLowerCase());
                if (existing) {
                    existing.qty += qtyReceived; 
                } else {
                    inv.push({ _id: generateId(), id: generateId(), item: it.item, qty: qtyReceived });
                }
            });
            persistInventory(inv);
        }
    };

    const handleCheckStatus = (m: ExtendedMRSItem) => {
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
    
    const handleItemReceived = async (m: ExtendedMRSItem) => {
        try {
            const itemId = m.id || m._id;
            if (!itemId) {
                toast.error('Invalid item ID');
                return;
            }

            // 🚀 Mark as received in database (replaces localStorage)
            await dispatch(markAsReceived({
                id: itemId,
                receivedBy: 'Current User', // You can get this from auth context
                receivedQuantity: m.quantity,
                deliveryNotes: `Item received on ${new Date().toLocaleDateString()}`
            }));

            // Status is now managed in database only
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('mrsStatusChanged', { 
              detail: { itemId, status: 'received', item: m } 
            }));
            
            // 🚀 AUTOMATICALLY ADD TO WBS SAVED MATERIALS 🚀
            if (m.task && selectedProjectId) {
                try {
                    // Find the WBS item for this task
                    const wbsResponse = await api.get(`/wbs/project/${selectedProjectId}`);
                    const wbsItems = wbsResponse.data?.data || [];
                    const wbsItem = wbsItems.find((item: any) => item.name === m.task);
                    
                    if (wbsItem) {
                        // Prepare material data for WBS
                        const materialData = {
                            materialId: m._id || m.id,
                            name: m.item,
                            quantity: m.quantity || 1,
                            unit: m.unit || 'kg',
                            remarks: `Auto-added from MRS (Received: ${new Date().toLocaleDateString()})`
                        };
                        
                        // Try to add material to WBS item via API
                        try {
                            await api.post(`/wbs/item/${wbsItem.id}/materials`, materialData);
                            toast.success(`✅ ${m.item} automatically added to WBS task "${m.task}" saved materials!`);
                        } catch (apiError) {
                            // Fallback: Add to localStorage for MaterialSelectionDialog
                            const savedMaterialsKey = `WBS_SAVED_MATERIALS_${wbsItem.id}`;
                            const existingSavedMaterials = JSON.parse(localStorage.getItem(savedMaterialsKey) || '[]');
                            
                            // Check if material already exists
                            const existingIndex = existingSavedMaterials.findIndex((saved: any) => 
                                saved.name === materialData.name || saved.materialId === materialData.materialId
                            );
                            
                            if (existingIndex >= 0) {
                                // Update existing material quantity
                                existingSavedMaterials[existingIndex].quantity = 
                                    (existingSavedMaterials[existingIndex].quantity || 0) + materialData.quantity;
                            } else {
                                // Add new material
                                existingSavedMaterials.push({
                                    ...materialData,
                                    id: Date.now().toString(), // Generate unique ID
                                    addedAt: new Date().toISOString()
                                });
                            }
                            
                            localStorage.setItem(savedMaterialsKey, JSON.stringify(existingSavedMaterials));
                            
                            // Dispatch event to refresh MaterialSelectionDialog
                            window.dispatchEvent(new CustomEvent('wbsMaterialsUpdated', { 
                                detail: { wbsItemId: wbsItem.id, materials: existingSavedMaterials } 
                            }));
                            
                            toast.success(`✅ ${m.item} automatically added to WBS task "${m.task}" saved materials!`);
                        }
                    } else {
                        console.warn(`WBS task "${m.task}" not found for auto-addition`);
                    }
                } catch (error) {
                    console.error('Error auto-adding material to WBS:', error);
                    // Don't show error toast to user, just log it
                }
            }
            
            // Update material request status to delivered in database
            try {
                console.log('🔍 Looking for material request with itemId:', itemId, 'item:', m.item, 'task:', m.task);
                
                // Get all material requests and search more broadly
                const allRequestsResponse = await api.get('/api/material-requests', {
                    headers: { organisationId: localStorage.getItem('organisationId') }
                });
                
                console.log('📦 All material requests response:', allRequestsResponse.data);
                
                if (allRequestsResponse.data.success) {
                    const allRequests = allRequestsResponse.data.requests || allRequestsResponse.data;
                    console.log('📋 Total material requests found:', allRequests.length);
                    
                    // Log all requests for debugging
                    allRequests.forEach((req: any, index: number) => {
                        console.log(`Request ${index + 1}:`, {
                            id: req._id,
                            itemId: req.itemId,
                            item: req.item,
                            sourceTask: req.sourceTask,
                            status: req.status,
                            isDeleted: req.isDeleted
                        });
                    });
                    
                    // Try multiple search strategies
                    let matchingRequest = null;
                    
                    // Strategy 1: Find by itemId
                    matchingRequest = allRequests.find((req: any) => 
                        req.itemId === itemId && 
                        req.status === 'in-transit' &&
                        !req.isDeleted
                    );
                    
                    if (!matchingRequest) {
                        console.log('🔍 Strategy 1 failed, trying by item name and task...');
                        // Strategy 2: Find by item name and task
                        matchingRequest = allRequests.find((req: any) => 
                            req.item === m.item && 
                            req.sourceTask === m.task &&
                            req.status === 'in-transit' &&
                            !req.isDeleted
                        );
                    }
                    
                    if (!matchingRequest) {
                        console.log('🔍 Strategy 2 failed, trying by item name only...');
                        // Strategy 3: Find by item name only (most recent in-transit)
                        const itemRequests = allRequests.filter((req: any) => 
                            req.item === m.item && 
                            req.status === 'in-transit' &&
                            !req.isDeleted
                        );
                        matchingRequest = itemRequests.sort((a: any, b: any) => 
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )[0];
                    }
                    
                    if (matchingRequest) {
                        console.log('✅ Found matching request:', matchingRequest);
                        console.log('📊 Current status:', matchingRequest.status);
                        
                        console.log('🚀 Updating status to delivered...');
                        console.log('📋 Request ID:', matchingRequest._id);
                        console.log('📋 Organisation ID:', localStorage.getItem('organisationId'));
                        
                        try {
                            // Test API connectivity first
                            console.log('🔗 Testing API connectivity...');
                            const testResponse = await api.get('/api/material-requests', {
                                headers: { organisationId: localStorage.getItem('organisationId') }
                            });
                            console.log('✅ API is reachable, proceeding with update...');
                            
                            // Verify the material request exists before updating
                            console.log('🔍 Verifying material request exists...');
                            const verifyResponse = await api.get(`/api/material-requests/${matchingRequest._id}`, {
                                headers: { organisationId: localStorage.getItem('organisationId') }
                            });
                            console.log('📋 Verification response:', verifyResponse.data);
                            
                            const updateResponse = await api.patch(`/api/material-requests/${matchingRequest._id}/status`, {
                                status: 'delivered'
                            }, {
                                headers: { 
                                    organisationId: localStorage.getItem('organisationId'),
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            console.log('📋 Update response:', updateResponse.data);
                            
                            if (updateResponse.data.success) {
                                console.log('✅ Updated material request status to delivered');
                                
                                // Refresh material requests in delivery page
                                dispatch(fetchMaterialRequests({}));
                                toast.success('✅ Delivery status updated to delivered!');
                            } else {
                                console.log('❌ Update failed:', updateResponse.data.message);
                                toast.error(`Failed to update delivery status: ${updateResponse.data.message}`);
                            }
                        } catch (updateError: any) {
                            console.error('❌ API call failed:', updateError);
                            console.error('❌ Error response:', updateError.response?.data);
                            console.error('❌ Error status:', updateError.response?.status);
                            console.error('❌ Error message:', updateError.message);
                            console.error('❌ Full error:', updateError);
                            
                            // Show specific error message to user
                            const errorMessage = updateError.response?.data?.message || 
                                               updateError.message || 
                                               'Unknown error occurred';
                            console.log('🔍 Showing error to user:', errorMessage);
                            
                            // Try alternative approach using Redux action
                            try {
                                console.log('🔄 Trying alternative update method...');
                                await dispatch(updateMaterialRequestStatus({
                                    id: matchingRequest._id,
                                    status: 'delivered'
                                }));
                                
                                console.log('✅ Updated via Redux action');
                                toast.success('✅ Delivery status updated to delivered!');
                                
                                // Refresh material requests
                                dispatch(fetchMaterialRequests({}));
                            } catch (reduxError) {
                                console.error('❌ Redux update also failed:', reduxError);
                                toast.error('Failed to update delivery status. Please try again or contact support.');
                            }
                        }
                    } else {
                        console.log('❌ No in-transit material request found for item:', m.item);
                        
                        // Check if there are any requests for this item at all
                        const anyRequests = allRequests.filter((req: any) => 
                            req.item === m.item && !req.isDeleted
                        );
                        
                        if (anyRequests.length > 0) {
                            console.log('📋 Found requests for this item but not in-transit:', anyRequests);
                            toast.info(`Found delivery requests for ${m.item} but none are in-transit. Current statuses: ${anyRequests.map((r: any) => r.status).join(', ')}`);
                        } else {
                            toast.info('No delivery request found for this item. It may not have been sent to delivery yet.');
                        }
                    }
                } else {
                    console.log('❌ Failed to fetch material requests');
                    toast.error('Failed to fetch delivery requests');
                }
            } catch (error) {
                console.error('❌ Failed to update material request status:', error);
                console.error('Error details:', (error as any)?.response?.data || (error as any)?.message);
                toast.error('Failed to update delivery status');
            }
            
            // Refresh MRS data to show updated delivery status
            dispatch(fetchMRS());
            
            toast.success(`${m.item} marked as received and delivery status updated in database`);
            
        } catch (error) {
            console.error('Error marking item as received:', error);
            toast.error('Failed to mark item as received');
        }
    };

    // --- Material Status Tracker ---
    const materialStatus = useMemo(() => {
        const rows: any[] = [];
        (pos || []).forEach((po: any) => {
            if (po.items) { // Only process if it has items (PurchaseOrder)
                (po.items || []).forEach((it: any) => {
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
            }
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
        const sample: ExtendedInventoryItem[] = [
            { _id: generateId(), id: generateId(), item: "Cement 50kg", qty: 250, uom: "bag" },
            { _id: generateId(), id: generateId(), item: "Steel 8mm", qty: 1200, uom: "kg" },
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
                    
                    {/* <Button 
                        variant="outline" 
                        onClick={() => dispatch(fetchMRS())} 
                        disabled={mrsLoading}
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button> */}
                    {/* <Button 
                        variant="outline" 
                        onClick={resetSendCounts}
                        className="text-red-600 hover:text-red-700"
                    >
                        Reset Counts
                    </Button> */}
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
            
            {/* NEW: MRS Search Input */}
            <div className="flex justify-end">
                <Input
                    placeholder="Search MRS: Item, Task, Status..."
                    value={mrsSearch}
                    onChange={(e) => setMrsSearch(e.target.value)}
                    className="w-full md:w-96"
                />
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
                                <TableHead>Delivery Status</TableHead>
                                <TableHead>Required Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mrsLoading && <TableRow><TableCell colSpan={8} className="text-center">Loading MRS...</TableCell></TableRow>}
                            
                            {!mrsLoading && paginatedMrsItems.length === 0 && (
                                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No materials found.</TableCell></TableRow>
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
                                        {m.task && <Badge variant="secondary" className="ml-2 text-[10px]">WBS</Badge>}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {m.item} 
                                        {m.unit && <span className="text-xs text-gray-500 ml-1">({m.unit})</span>}
                                    </TableCell>
                                    <TableCell>{m.quantity}</TableCell>
                                    <TableCell>
                                        {(() => {
                                            const deliveryStatus = m.deliveryStatus || 'pending';
                                            
                                            // Debug logs
                                            console.log(`🔍 Item: ${m.item}, deliveryStatus: "${deliveryStatus}"`);
                                            
                                            // Check for different variations of in-transit
                                            const isInTransit = deliveryStatus === 'in-transit' || 
                                                              deliveryStatus === 'intransit' || 
                                                              deliveryStatus === 'in_transit' ||
                                                              deliveryStatus?.toLowerCase().includes('transit');
                                            
                                            const isReceived = deliveryStatus === 'received' || 
                                                             deliveryStatus === 'delivered';
                                            
                                            const isSent = deliveryStatus === 'sent' && !isInTransit && !isReceived;
                                            
                                            if (isReceived) {
                                                console.log(`   ✅ SHOWING "Received ✓" button for ${m.item}`);
                                                return (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        disabled
                                                        className="bg-green-50 text-green-700 border-green-200"
                                                    >
                                                        Received ✓
                                                    </Button>
                                                );
                                            } else if (isInTransit) {
                                                console.log(`   🚛 SHOWING "Item Received" button for ${m.item}`);
                                                return (
                                                    <Button 
                                                        size="sm" 
                                                        variant="default"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleItemReceived(m)}
                                                    >
                                                        Item Received
                                                    </Button>
                                                );
                                            } else if (isSent) {
                                                console.log(`   📦 SHOWING "Sent ✓" button for ${m.item}`);
                                                return (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        disabled
                                                        className="bg-blue-50 text-blue-700 border-blue-200"
                                                    >
                                                        Sent ✓
                                                    </Button>
                                                );
                                            } else {
                                                console.log(`   🔄 SHOWING "Sent" button for ${m.item}`);
                                                return (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => handleSendClick(m, "INVENTORY")}
                                                    >
                                                        Sent
                                                    </Button>
                                                );
                                            }
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const deliveryStatus = m.deliveryStatus || 'pending';
                                            const getStatusColor = (status: string) => {
                                                switch (status) {
                                                    case 'pending': return 'bg-gray-100 text-gray-800';
                                                    case 'sent': return 'bg-blue-100 text-blue-800';
                                                    case 'in-transit': return 'bg-yellow-100 text-yellow-800';
                                                    case 'received': return 'bg-green-100 text-green-800';
                                                    case 'returned': return 'bg-red-100 text-red-800';
                                                    default: return 'bg-gray-100 text-gray-800';
                                                }
                                            };
                                            
                                            return (
                                                <Badge className={`${getStatusColor(deliveryStatus)} capitalize`}>
                                                    {deliveryStatus.replace('-', ' ')}
                                                </Badge>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell>{m.requiredDate ? new Date(m.requiredDate).toLocaleDateString() : "—"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {/* {canEdit && <Button size="icon" variant="ghost" onClick={() => openEdit(m)} disabled={mrsLoading || !!m.task}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>} */}
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={() => {
                                                    console.log("🖱️ Delete button clicked for item:", m.id || m._id, m);
                                                    handleDelete(m.id || m._id!, !!m.task);
                                                }} 
                                                disabled={mrsLoading || (m.deliveryStatus === 'received')}
                                                className={m.deliveryStatus === 'received' ? 'opacity-50 cursor-not-allowed' : ''}
                                                title={
                                                    m.deliveryStatus === 'received' 
                                                        ? "Cannot delete received items - material already delivered" 
                                                        : m.task 
                                                        ? `Delete WBS-linked item: ${m.task}` 
                                                        : "Delete MRS item"
                                                }
                                            >
                                                <Trash2 className={`h-4 w-4 ${m.deliveryStatus === 'received' ? 'text-gray-400' : 'text-red-600'}`} />
                                            </Button>
                                            {(() => {
                                                const purchaseStatus = m.purchaseRequestStatus || 'not-sent';
                                                
                                                if (purchaseStatus === 'sent') {
                                                    return (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            disabled
                                                            className="bg-green-50 text-green-700 border-green-200"
                                                        >
                                                            <ShoppingCartIcon className="mr-2 h-4 w-4"/> 
                                                            Sent ✓
                                                        </Button>
                                                    );
                                                } else if (purchaseStatus === 'processed') {
                                                    return (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            disabled
                                                            className="bg-blue-50 text-blue-700 border-blue-200"
                                                        >
                                                            <ShoppingCartIcon className="mr-2 h-4 w-4"/> 
                                                            Processed ✓
                                                        </Button>
                                                    );
                                                } else {
                                                    return (
                                                        <Button 
                                                            variant="ghost" 
                                                            onClick={() => handleSendClick(m, "PURCHASE")}
                                                        >
                                                            <ShoppingCartIcon className="mr-2 h-4 w-4"/> 
                                                            Send
                                                        </Button>
                                                    );
                                                }
                                            })()}
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
                                    <div key={pr._id} className="rounded-md border p-3 flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-sm">PR #{pr._id?.substring(0,6)}</div>
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
                                {(pos as any[]).filter((po: any) => po.items).map((po: any) => (
                                    <div key={po._id} className="rounded-md border p-3 flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-sm">{po.poNo || "PO-###"}</div>
                                            <div className="text-xs text-muted-foreground">{po.supplier}</div>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => receiveAgainstPO(po._id, 1)}>
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
                            <div className="space-y-2">
                                <Label>Item</Label>
                                {!isCustomItem ? (
                                    <Popover open={itemPopoverOpen} onOpenChange={setItemPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={itemPopoverOpen}
                                                className="w-full justify-between"
                                            >
                                                {form.item || "Select material..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search materials..."
                                                    value={itemSearch}
                                                    onValueChange={setItemSearch}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No materials found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {/* Raw Materials */}
                                                        {rawMaterials
                                                            .filter((material) => {
                                                                if (!itemSearch) return true;
                                                                return material.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
                                                                       material.itemCode?.toLowerCase().includes(itemSearch.toLowerCase());
                                                            })
                                                            .map((material) => (
                                                                <CommandItem
                                                                    key={material._id}
                                                                    value={material.name}
                                                                    onSelect={() => {
                                                                        setForm({ 
                                                                            ...form, 
                                                                            item: material.name,
                                                                            materialId: material._id // Add materialId
                                                                        });
                                                                        setItemPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={`mr-2 h-4 w-4 ${
                                                                            form.item === material.name ? "opacity-100" : "opacity-0"
                                                                        }`}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{material.name}</span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {material.itemCode} | Stock: <span className={(material.quantity || 0) > 0 ? 'text-green-600' : 'text-red-600'}>{material.quantity || 0}</span> {material.unitOfMeasure}
                                                                            {material.stocks && material.stocks.length > 0 && (
                                                                                <span className="ml-2 text-blue-600">
                                                                                    | FIFO: {material.stocks.filter((s: any) => s.remainingQuantity > 0).length} batches
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        
                                                        {/* Other Option */}
                                                        <CommandItem
                                                            value="other"
                                                            onSelect={() => {
                                                                setIsCustomItem(true);
                                                                setForm({ ...form, item: "", materialId: undefined });
                                                                setItemPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            <span className="font-medium">Other (Custom Item)</span>
                                                        </CommandItem>
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <div className="space-y-2">
                                        <Input 
                                            value={form.item || ""} 
                                            onChange={(e) => setForm({ ...form, item: e.target.value })}
                                            placeholder="Enter custom item name..."
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setIsCustomItem(false);
                                                setForm({ ...form, item: "", materialId: undefined });
                                            }}
                                        >
                                            ← Back to Material List
                                        </Button>
                                    </div>
                                )}
                            </div>
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