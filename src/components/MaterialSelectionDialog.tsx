import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import { fetchMRS } from "@/redux/slices/mrsSlice";
import { fetchMovements, fetchMovementSummary } from "@/redux/slices/materialMovementSlice";
import api from "@/utils/axiosApi";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type MaterialItem = {
  _id: string;
  name: string;
  unitOfMeasure?: string;
  quantity?: number;
  itemCode?: string;
  reorderLevel?: number;
  stocks?: Array<{
    _id?: string;
    warehouseId?: string | { _id: string };
    quantity?: number;
    remainingQuantity?: number;
    unitCost?: number;
    purchaseDate?: string;
    batchId?: string;
  }>;
};

type SelectedMaterial = {
  materialId: string;
  name: string;
  quantity: number | string;
  unit: string;
  usedQuantity?: number;
};

type MaterialInputState = {
  open: boolean;
  item: SelectedMaterial | null;
  submitting?: boolean;
  isEditing?: boolean;
};

type ReturnModalState = {
  open: boolean;
  item:
    | (SelectedMaterial & {
        assignedQty: number;
        returnQty: number | string;
      })
    | null;
  submitting?: boolean;
};

export default function MaterialSelectionDialog({
  isOpen,
  onClose,
  wbsItem,
}: {
  isOpen: boolean;
  onClose: () => void;
  wbsItem: any;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const raw = useSelector((state: RootState) => state.rawMaterials);
  const materials: MaterialItem[] = raw?.materials || [];
  const { list: mrsList } = useSelector((state: RootState) => state.mrs);

  const [savedMaterials, setSavedMaterials] = useState<SelectedMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isEditingMode, setIsEditingMode] = useState(false); // not used heavily here but kept for clarity
  const [materialInput, setMaterialInput] = useState<MaterialInputState>({
    open: false,
    item: null,
    submitting: false,
    isEditing: false,
  });

  const [returnModal, setReturnModal] = useState<ReturnModalState>({
    open: false,
    item: null,
    submitting: false,
  });

  const isUpdateMode = Boolean(wbsItem?.id || wbsItem?._id);
  const wbsId = wbsItem?.id || wbsItem?._id;

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchMaterials({ page: 1, limit: 100 }));
      dispatch(fetchMRS()); // Also fetch MRS data
      
      if (isUpdateMode && wbsItem?.linkedMaterials) {
        const prefilled = wbsItem.linkedMaterials.map((link: any) => {
          const details = (materials || []).find(
            (m) => m._id === link.materialId
          );
          return {
            materialId: link.materialId,
            name: details?.name || "Unknown Material",
            quantity: link.quantity,
            unit: link.unit,
          } as SelectedMaterial;
        });
        setSavedMaterials(prefilled);
      } else {
        setSavedMaterials([]);
      }
    } else {
      setMaterialInput({
        open: false,
        item: null,
        submitting: false,
        isEditing: false,
      });
      setReturnModal({ open: false, item: null, submitting: false });
      setIsEditingMode(false);
    }
  }, [isOpen, wbsItem, isUpdateMode]);
  // Sync savedMaterials with wbsItem.linkedMaterials whenever they change
  useEffect(() => {
    if (!isOpen) return;

    // wait for BOTH to exist
    if (
      isUpdateMode &&
      wbsItem?.linkedMaterials?.length > 0 &&
      materials.length > 0
    ) {
      const prefilled = wbsItem.linkedMaterials
        .map((link: any) => {
          const details = materials.find((m) => m._id === link.materialId);

          if (!details) return null;

          return {
            materialId: link.materialId,
            name: details.name,
            quantity: link.quantity,
            unit: link.unit,
          };
        })
        .filter(Boolean);

      setSavedMaterials(prefilled);
    } else if (isOpen && isUpdateMode && wbsItem?.linkedMaterials?.length === 0) {
      // If no linked materials, clear the list
      setSavedMaterials([]);
    }
  }, [isOpen, materials, wbsItem, wbsItem?.linkedMaterials, isUpdateMode]);

  // Centralized function to calculate saved materials from database
  const calculateSavedMaterials = () => {
    if (!isOpen || !wbsItem?.name || materials.length === 0) return [];
    
    // First, let's see ALL MRS items for debugging
    (mrsList || []).forEach((mrs: any, index: number) => {
      console.log(`  ${index + 1}. ${mrs.item} - Task: ${mrs.task} - DeliveryStatus: ${mrs.deliveryStatus} - Status: ${mrs.status} - Deleted: ${mrs.isDeleted}`);
    });
    
    // Now let's see items for this specific task
    const allTaskItems = (mrsList || []).filter((mrs: any) => mrs.task === wbsItem.name && !mrs.isDeleted);
    allTaskItems.forEach((mrs: any, index: number) => {
      console.log(`  ${index + 1}. ${mrs.item} - DeliveryStatus: ${mrs.deliveryStatus} - Status: ${mrs.status}`);
    });

    // Get MRS materials for this specific task (only received ones from database)
    const taskMRSMaterials = (mrsList || []).filter((mrs: any) => {
      const isForThisTask = mrs.task === wbsItem.name && !mrs.isDeleted;
      
      // Check database delivery status - look for 'received' status in deliveryStatus
      const isReceived = mrs.deliveryStatus === 'received';
      
      console.log(`📋 MRS ${mrs.item} (${mrs._id}):`, {
        task: mrs.task,
        isForThisTask,
        deliveryStatus: mrs.deliveryStatus,
        status: mrs.status,
        deliveryDetails: mrs.deliveryDetails,
        isReceived
      });
      
      return isForThisTask && isReceived;
    });


    // Convert MRS materials to SelectedMaterial format
    const mrsAsSavedMaterials = taskMRSMaterials.map((mrs: any) => {
      const materialDetails = materials.find((m) => m.name.toLowerCase() === mrs.item.toLowerCase());
      
      // Use database quantity (consider returns if stored in database)
      const originalQuantity = mrs.quantity || 1;
      const receivedQuantity = mrs.deliveryDetails?.receivedQuantity || originalQuantity;
      const returnedQuantity = mrs.deliveryDetails?.returnedQuantity || 0;
      const availableQuantity = receivedQuantity - returnedQuantity;
      
      // console.log(`🧮 Material ${mrs.item} (${mrs._id}):`, {
      //   original: originalQuantity,
      //   received: receivedQuantity,
      //   returned: returnedQuantity,
      //   available: availableQuantity
      // });
      const usedQuantity = mrs.usedQuantity || 0;
      
      return {
        materialId: mrs._id,
        name: mrs.item,
        quantity: availableQuantity,
        unit: materialDetails?.unitOfMeasure || mrs.unit || 'units',
        usedQuantity: usedQuantity 
      } as SelectedMaterial;
    }).filter(material => Number(material.quantity) > 0);

    // Get existing linkedMaterials
    const linkedMaterials = (wbsItem?.linkedMaterials || []).map((link: any) => {
      const details = materials.find((m) => m._id === link.materialId);
      return {
        materialId: link.materialId,
        name: details?.name || "Unknown Material",
        quantity: link.quantity,
        unit: link.unit,
      } as SelectedMaterial;
    });

    // Combine both sources, merging duplicate materials by adding quantities
    const allMaterials = [...linkedMaterials];
    
    mrsAsSavedMaterials.forEach(mrsMaterial => {
      const existingIndex = allMaterials.findIndex(existing => 
        existing.name.toLowerCase() === mrsMaterial.name.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        // Material already exists, add the quantities
        const existing = allMaterials[existingIndex];
        allMaterials[existingIndex] = {
          ...existing,
          quantity: Number(existing.quantity) + Number(mrsMaterial.quantity),
          materialId: existing.materialId || mrsMaterial.materialId // Keep existing ID if available
        };
        console.log(`🔄 Combined duplicate material ${mrsMaterial.name}: ${existing.quantity} + ${mrsMaterial.quantity} = ${allMaterials[existingIndex].quantity}`);
      } else {
        // New material, add it
        allMaterials.push(mrsMaterial);
      }
    });

    return allMaterials;
  };

  // Main useEffect to calculate and set saved materials from database
  useEffect(() => {
    if (isOpen && wbsItem?.name) {
      const calculatedMaterials = calculateSavedMaterials();
      setSavedMaterials(calculatedMaterials);
    }
  }, [isOpen, wbsItem?.name, mrsList, materials, wbsItem?.linkedMaterials]);

  // Listen for database updates to refresh saved materials
  useEffect(() => {
    const handleDatabaseUpdate = () => {
      dispatch(fetchMRS());
    };

    const handleMRSStatusChange = (event: any) => {
      dispatch(fetchMRS());
    };

    window.addEventListener('materialReturned', handleDatabaseUpdate);
    window.addEventListener('mrsStatusChanged', handleMRSStatusChange);
    
    return () => {
      window.removeEventListener('materialReturned', handleDatabaseUpdate);
      window.removeEventListener('mrsStatusChanged', handleMRSStatusChange);
    };
  }, [isOpen, dispatch]);

  const openMaterialModalForAdd = (m: MaterialItem) => {
    setMaterialInput({
      open: true,
      item: {
        materialId: m._id,
        name: m.name,
        quantity: "",
        unit: m.unitOfMeasure || "kg",
      },
      submitting: false,
      isEditing: false,
    });
  };

  const openMaterialModalForEdit = (saved: SelectedMaterial) => {
    setMaterialInput({
      open: true,
      item: { ...saved },
      submitting: false,
      isEditing: true,
    });
  };

  const handleMaterialInputSave = async () => {
    try {
      if (!materialInput.item) return;
      const { materialId, quantity, unit } = materialInput.item;
      const qtyNum = Number(quantity);
      if (!qtyNum || qtyNum <= 0) {
        console.warn("Enter valid quantity");
        return;
      }
      setMaterialInput((s) => ({ ...s, submitting: true }));

      if (materialInput.isEditing) {
        // For editing, we need to unlink and relink
        await api.post("/wbs/unlink-material", {
          wbsId,
          materialId,
        });

        const response = await api.post("/wbs/link-materials", {
          wbsId,
          materials: [{ materialId, quantity: qtyNum, unit }],
        });

        // Update UI from backend response
        const found = materials.find((m) => m._id === materialId);
        setSavedMaterials((prev) =>
          prev.map((p) =>
            p.materialId === materialId 
              ? { ...p, name: found?.name || p.name, quantity: qtyNum, unit } 
              : p
          )
        );
      } else {
        // Check if material already exists in saved materials
        const existingMaterial = savedMaterials.find(
          (m) => m.materialId === materialId
        );

        if (existingMaterial) {
          // Material already exists - add to existing quantity
          const newQuantity = Number(existingMaterial.quantity) + qtyNum;

          // Send only the NEW TOTAL quantity to backend
          // Backend will calculate the difference and deduct only additional stock
          const response = await api.post("/wbs/link-materials", {
            wbsId,
            materials: [{ materialId, quantity: newQuantity, unit }],
            updateExisting: true, // Flag to update existing material
          });

          // Update UI with new total
          setSavedMaterials((prev) =>
            prev.map((p) =>
              p.materialId === materialId
                ? { ...p, quantity: newQuantity }
                : p
            )
          );
        } else {
          // New material - add normally
          const response = await api.post("/wbs/link-materials", {
            wbsId,
            materials: [{ materialId, quantity: qtyNum, unit }],
          });

          const found = materials.find((m) => m._id === materialId);
          setSavedMaterials((prev) => [
            ...prev,
            {
              materialId,
              name: found?.name || materialInput.item!.name,
              quantity: qtyNum,
              unit,
            },
          ]);
        }
      }

      // Refetch materials to get updated stock (this will update the left side list)
      dispatch(fetchMaterials({ page: 1, limit: 100 }));
      
      // Refetch WBS data to get updated linkedMaterials
      if (wbsItem?.projectId) {
        dispatch(fetchWbsByProject(wbsItem.projectId));
      }

      // 🔥 Refetch MRS to show newly created entries in Procurement page
      dispatch(fetchMRS());

      // close modal
      setMaterialInput({
        open: false,
        item: null,
        submitting: false,
        isEditing: false,
      });
    } catch (err) {
      console.error("Save material failed", err);
      setMaterialInput((s) => ({ ...s, submitting: false }));
    }
  };

  const handleDeleteSaved = async (m: SelectedMaterial) => {
    try {
      // stop immediate event bubbling handled in caller
      await api.post("/wbs/unlink-material", {
        wbsId,
        materialId: m.materialId,
      });

      // remove from UI
      setSavedMaterials((prev) =>
        prev.filter((p) => p.materialId !== m.materialId)
      );

      if (wbsItem?.projectId) {
        dispatch(fetchWbsByProject(wbsItem.projectId));
      }
      dispatch(fetchMaterials({ page: 1, limit: 100 }));
      
      // 🔥 Refetch MRS to update Procurement page
      dispatch(fetchMRS());
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  /* ------------------ Return Material ------------------ */
  const openReturnModal = (m: SelectedMaterial) => {
    // For MRS materials, we need to get the original quantity from the MRS entry
    const isMRSMaterial = mrsList?.some((mrs: any) => 
      mrs._id === m.materialId && mrs.task === wbsItem?.name
    );
    
    let originalQuantity = Number(m.quantity);
    
    if (isMRSMaterial) {
      // Find the original MRS entry to get the original quantity
      const mrsEntry = mrsList?.find((mrs: any) => 
        mrs._id === m.materialId
      );
      if (mrsEntry) {
        originalQuantity = mrsEntry.quantity || 1;
      }
    }
    
    setReturnModal({
      open: true,
      item: { ...m, assignedQty: originalQuantity, returnQty: "" },
      submitting: false,
    });
  };

  const handleReturnMaterial = async () => {
    try {
      const it = returnModal.item;
      if (!it) return;
      const returnQty = Number(it.returnQty);
      if (!returnQty || returnQty <= 0) return;

      setReturnModal((r) => ({ ...r, submitting: true }));
      console.log(`🔄 Starting material return for ${it.name}, quantity: ${returnQty}`);

      // 🔍 DETECT ITEM TYPE
      // Check if this ID belongs to an MRS entry
      const mrsEntry = mrsList?.find((m: any) => 
        m._id === it.materialId
      );

      // ============================================================
      // UNIFIED RETURN HANDLING - SINGLE API CALL ONLY
      // Use WBS return API for all materials - it handles everything properly:
      // - Updates stock correctly
      // - Creates proper "return" movement record
      // - Updates WBS linked quantities
      // - No duplicate movements created
      // ============================================================
      console.log(`🔄 Processing material return using WBS API (unified approach)...`);
      
      await api.post("/wbs/return-material", {
        wbsId,
        materialId: it.materialId,
        returnQty,
        isMRSMaterial: !!mrsEntry, // Flag to help backend identify MRS materials
        mrsId: mrsEntry ? mrsEntry._id : null // Pass MRS ID for tracking
      });
      
      console.log(`✅ WBS return API completed - stock updated and return movement created`);
      
      // ❌ REMOVED: No longer calling MRS API separately to avoid duplicate movements
      // The WBS API now handles MRS record updates internally

      // ============================================================
      // COMMON SUCCESS HANDLING
      // ============================================================
      
      // Update local UI state immediately to reflect change
      setSavedMaterials(prevMaterials => 
        prevMaterials.map(material => {
          if (material.materialId === it.materialId) {
            const newQuantity = Number(material.quantity) - returnQty;
            return {
              ...material,
              quantity: Math.max(0, newQuantity)
            };
          }
          return material;
        }).filter(material => Number(material.quantity) > 0)
      );
      
      toast.success(`✅ Returned ${returnQty} ${it.unit} of ${it.name}. Stock updated! Check MovesAnalysis for return record.`);
      
      // Close modal
      setReturnModal({ open: false, item: null, submitting: false });
      
      // Refresh all data including material movements
      setTimeout(() => {
        dispatch(fetchMaterials({ page: 1, limit: 100 }));
        dispatch(fetchMRS()); // Crucial: Refetches MRS to see the new "Returned" status
        if (wbsItem?.projectId) {
          dispatch(fetchWbsByProject(wbsItem.projectId));
        }
        
        // 🔥 Refresh material movements for MovesAnalysis page
        const organisationId = localStorage.getItem("organisationId");
        if (organisationId) {
          console.log(`🔄 Refreshing material movements after return...`);
          dispatch(fetchMovements({ organisationId }));
          dispatch(fetchMovementSummary({ organisationId }));
          console.log(`✅ Material movements refreshed - check MovesAnalysis page`);
          
          // 📡 Dispatch custom event to notify MovesAnalysis page
          window.dispatchEvent(new CustomEvent('materialReturned', {
            detail: {
              materialName: it.name,
              quantity: returnQty,
              wbsTask: wbsItem?.name,
              timestamp: new Date().toISOString()
            }
          }));
        }
      }, 500);

    } catch (err: any) {
      console.error("❌ Return failed:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Return failed';
      toast.error(`Failed to return material: ${errorMsg}`);
      setReturnModal((r) => ({ ...r, submitting: false }));
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMaterialInput({
              open: false,
              item: null,
              submitting: false,
              isEditing: false,
            });

            setReturnModal({
              open: false,
              item: null,
              submitting: false,
            });

            onClose();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Materials for {wbsItem?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 mt-4">
            {/* COMMENTED OUT - LEFT: AVAILABLE MATERIALS */}
            {/* 
            <div className="border rounded p-3 h-96 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Available Materials</p>

              {materials.map((m) => (
                <div
                  key={m._id}
                  className="p-3 rounded border cursor-pointer mb-2 hover:bg-gray-50"
                  onClick={() => openMaterialModalForAdd(m)}
                >
                  <div className="flex justify-between">
                    <p className="font-semibold">{m.name}</p>
                    <span className="text-xs text-gray-500">{m.itemCode}</span>
                  </div>

                  <p className="text-xs text-gray-600">
                    Unit: {m.unitOfMeasure || "kg"}
                  </p>

                  <p className="text-xs text-gray-600">
                    Stock:{" "}
                    <span
                      className={
                        m.quantity! <= (m.reorderLevel || 0)
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {m.quantity ?? 0} {m.unitOfMeasure || "kg"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
            */}


            {/* RIGHT: SAVED MATERIALS (READ-ONLY UNLESS EDIT MODE) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Saved Materials</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 h-8 text-xs"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-gray-400 hover:text-gray-600"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 h-[380px] overflow-y-auto pr-2 border rounded p-2 bg-gray-50">
                {(() => {
                  // Filter materials based on search term
                  const filteredMaterials = savedMaterials.filter((material) => {
                    if (!searchTerm.trim()) return true;
                    
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      material.name.toLowerCase().includes(searchLower) ||
                      material.unit.toLowerCase().includes(searchLower) ||
                      material.quantity.toString().includes(searchLower)
                    );
                  });

                  if (savedMaterials.length === 0) {
                    return (
                      <p className="text-sm text-gray-500">
                        No materials saved yet.
                      </p>
                    );
                  }

                  if (filteredMaterials.length === 0) {
                    return (
                      <p className="text-sm text-gray-500">
                        No materials found matching "{searchTerm}".
                      </p>
                    );
                  }

                  return filteredMaterials.map((m) => {
                    // Check if this is from MRS or linkedMaterials
                    const isMRSMaterial = mrsList?.some((mrs: any) => 
                      mrs._id === m.materialId && mrs.task === wbsItem?.name
                    );
                    
                    // Get material status from database (MRS deliveryStatus)
                    const materialStatus = (() => {
                      // Check if this is an MRS material and get its actual database status
                      const mrsEntry = mrsList?.find((mrs: any) => 
                        mrs._id === m.materialId && mrs.task === wbsItem?.name
                      );
                      
                      if (mrsEntry) {
                        // Use the actual deliveryStatus from database
                        return mrsEntry.deliveryStatus || 'pending';
                      }
                      
                      // For non-MRS materials, check localStorage as fallback
                      const syncData = JSON.parse(localStorage.getItem('MRS_STATUS_SYNC') || '{}');
                      return syncData[m.materialId] || 'pending';
                    })();

                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'received': return 'text-green-600 bg-green-50';
                        case 'in-transit': return 'text-blue-600 bg-blue-50';
                        case 'sent': return 'text-orange-600 bg-orange-50';
                        default: return 'text-gray-600 bg-gray-50';
                      }
                    };

                    return (
                      <div
                        key={m.materialId}
                        className="border rounded p-3 bg-white"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{m.name}</p>
                              {isMRSMaterial && (
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                  MRS
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(materialStatus)}`}>
                                {materialStatus.replace('-', ' ')}
                              </span>
                            </div>
                            <div className="flex gap-4 mt-1">
                              <p className="text-xs text-gray-600">
                                Available: <strong>{m.quantity}</strong> {m.unit}
                              </p>
                              
                              {/* [!code ++] Display Used Quantity */}
                              <p className="text-xs text-blue-600">
                                Used: <strong>{m.usedQuantity || 0}</strong> {m.unit}
                              </p>
                          </div>
                          </div>

                          {/* <div className="flex gap-2">
                            {materialStatus === 'received' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReturnModal(m);
                                }}
                              >
                                Return
                              </Button>
                            )}
                          </div> */}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* NOTE: We don't show inline editing here. Editing done via modal on Update. */}
          <div className="mt-4 flex justify-end gap-2">

            <Button
              variant="outline"
              onClick={() => {
                onClose();
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MATERIAL INPUT MODAL (Add / Update) */}
      <Dialog
        open={materialInput.open}
        onOpenChange={(open) => {
          if (!open) {
            setMaterialInput({
              open: false,
              item: null,
              submitting: false,
              isEditing: false,
            });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {materialInput.isEditing ? "Update Material" : "Add Material"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            <p className="font-semibold">{materialInput.item?.name}</p>

            <div>
              <label className="text-xs font-medium">Quantity</label>
              <Input
                type="number"
                value={materialInput.item?.quantity ?? ""}
                onChange={(e) =>
                  setMaterialInput((s) => ({
                    ...s,
                    item: s.item
                      ? { ...s.item, quantity: e.target.value }
                      : s.item,
                  }))
                }
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Unit</label>
              <Input
                value={materialInput.item?.unit ?? ""}
                disabled
                readOnly
                className="bg-gray-100 cursor-not-allowed"
                placeholder="Unit (e.g., kg)"
              />
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="outline"
                onClick={() =>
                  setMaterialInput({
                    open: false,
                    item: null,
                    submitting: false,
                    isEditing: false,
                  })
                }
              >
                Cancel
              </Button>

              <Button
                onClick={handleMaterialInputSave}
                disabled={materialInput.submitting}
              >
                {materialInput.submitting
                  ? materialInput.isEditing
                    ? "Updating..."
                    : "Adding..."
                  : materialInput.isEditing
                  ? "Update"
                  : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RETURN MATERIAL MODAL */}
      <Dialog
        open={returnModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setReturnModal({
              open: false,
              item: null,
              submitting: false,
            });
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Return Material</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            <p className="font-semibold">{returnModal.item?.name}</p>

            <p className="text-sm text-gray-600">
              Original Quantity:{" "}
              <strong>{returnModal.item?.assignedQty || 0}</strong>
            </p>
            
            <p className="text-sm text-gray-600">
              Available to Return:{" "}
              <strong>{returnModal.item?.quantity || 0}</strong>
            </p>

            <label className="text-xs font-medium">
              Select Quantity to Return
            </label>
            <select
              className="border p-2 rounded w-full"
              value={returnModal.item?.returnQty ?? ""}
              onChange={(e) =>
                setReturnModal((r) => ({
                  ...r,
                  item: r.item
                    ? { ...r.item, returnQty: e.target.value }
                    : r.item,
                }))
              }
            >
              <option value="">Select</option>
              {Array.from(
                { length: Number(returnModal.item?.quantity) || 0 },
                (_, i) => i + 1
              ).map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setReturnModal({ open: false, item: null, submitting: false })
                }
              >
                Cancel
              </Button>

              <Button
                onClick={handleReturnMaterial}
                disabled={
                  !returnModal.item?.returnQty || returnModal.submitting
                }
              >
                {returnModal.submitting ? "Returning..." : "Return"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
