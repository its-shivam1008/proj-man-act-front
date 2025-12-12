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
import api from "@/utils/axiosApi";
import { Input } from "@/components/ui/input";

type MaterialItem = {
  _id: string;
  name: string;
  unitOfMeasure?: string;
  quantity?: number;
  itemCode?: string;
  reorderLevel?: number;
};

type SelectedMaterial = {
  materialId: string;
  name: string;
  quantity: number | string;
  unit: string;
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

  // Centralized function to calculate saved materials
  const calculateSavedMaterials = () => {
    if (!isOpen || !wbsItem?.name || materials.length === 0) return [];

    // Get material status and returns from localStorage
    const materialStatusSync = JSON.parse(localStorage.getItem('MRS_STATUS_SYNC') || '{}');
    const mrsReturns = JSON.parse(localStorage.getItem('MRS_RETURNS') || '{}');

    console.log(`🔍 Calculating saved materials for task: ${wbsItem.name}`);
    console.log('📊 MRS Returns data:', mrsReturns);

    // Get MRS materials for this specific task (only received ones)
    const taskMRSMaterials = (mrsList || []).filter((mrs: any) => {
      const isForThisTask = mrs.task === wbsItem.name && !mrs.isDeleted;
      const materialId = mrs.id || mrs._id;
      const status = materialStatusSync[materialId] || 'pending';
      return isForThisTask && status === 'received';
    });

    console.log(`📦 Found ${taskMRSMaterials.length} received MRS materials for task`);

    // Convert MRS materials to SelectedMaterial format
    const mrsAsSavedMaterials = taskMRSMaterials.map((mrs: any) => {
      const materialDetails = materials.find((m) => m.name.toLowerCase() === mrs.item.toLowerCase());
      
      // Calculate remaining quantity after returns
      const originalQuantity = mrs.quantity || 1;
      const returnedQuantity = mrsReturns[mrs.id || mrs._id] || 0;
      const remainingQuantity = originalQuantity - returnedQuantity;
      
      console.log(`🧮 Material ${mrs.item} (${mrs.id || mrs._id}):`, {
        original: originalQuantity,
        returned: returnedQuantity,
        remaining: remainingQuantity
      });
      
      return {
        materialId: mrs.id || mrs._id,
        name: mrs.item,
        quantity: remainingQuantity > 0 ? remainingQuantity : 0,
        unit: materialDetails?.unitOfMeasure || 'units',
      } as SelectedMaterial;
    }).filter(material => Number(material.quantity) > 0); // Only show materials with remaining quantity

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

    // Combine both sources, avoiding duplicates
    const allMaterials = [...linkedMaterials];
    
    mrsAsSavedMaterials.forEach(mrsMaterial => {
      const exists = allMaterials.find(existing => 
        existing.name.toLowerCase() === mrsMaterial.name.toLowerCase()
      );
      if (!exists) {
        allMaterials.push(mrsMaterial);
      }
    });

    console.log(`✅ Final calculated materials (${allMaterials.length}):`, allMaterials);
    return allMaterials;
  };

  // Main useEffect to calculate and set saved materials
  useEffect(() => {
    const calculatedMaterials = calculateSavedMaterials();
    setSavedMaterials(calculatedMaterials);
  }, [isOpen, wbsItem?.name, mrsList, materials, wbsItem?.linkedMaterials]);

  // Listen for material return events to refresh saved materials
  useEffect(() => {
    const handleMaterialReturn = () => {
      console.log('🔄 Material return event received, recalculating saved materials...');
      const calculatedMaterials = calculateSavedMaterials();
      setSavedMaterials(calculatedMaterials);
    };

    window.addEventListener('materialReturned', handleMaterialReturn);
    return () => window.removeEventListener('materialReturned', handleMaterialReturn);
  }, [isOpen, wbsItem?.name, materials, mrsList]);

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
      (mrs.id === m.materialId || mrs._id === m.materialId) && mrs.task === wbsItem?.name
    );
    
    let originalQuantity = Number(m.quantity);
    
    if (isMRSMaterial) {
      // Find the original MRS entry to get the original quantity
      const mrsEntry = mrsList?.find((mrs: any) => 
        (mrs.id === m.materialId || mrs._id === m.materialId)
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

      // Check if this is an MRS material or linkedMaterial
      const isMRSMaterial = mrsList?.some((mrs: any) => 
        (mrs.id === it.materialId || mrs._id === it.materialId) && mrs.task === wbsItem?.name
      );

      if (isMRSMaterial) {
        // Handle MRS material return
        // For MRS materials, we'll update the material status and create a return record
        
        // Update material status to indicate partial return
        const materialStatusSync = JSON.parse(localStorage.getItem('MRS_STATUS_SYNC') || '{}');
        
        // Find the MRS entry
        const mrsEntry = mrsList?.find((mrs: any) => 
          (mrs.id === it.materialId || mrs._id === it.materialId)
        );
        
        if (mrsEntry) {
          // Find the corresponding raw material and add back to stock
          const rawMaterial = materials.find(rm => rm.name === it.name);
          
          if (rawMaterial) {
            try {
              // Add back to raw material stock
              const currentStock = rawMaterial.quantity || 0;
              const organisationId = localStorage.getItem("organisationId");
              await api.put(`/raw/update/${rawMaterial._id}`, {
                ...rawMaterial,
                quantity: currentStock + returnQty
              }, {
                headers: { organisationId }
              });
              console.log(`✅ Added back ${returnQty} to ${it.name}. New stock: ${currentStock + returnQty}`);
            } catch (error: any) {
              console.error('Failed to update raw material stock:', error);
              const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
              alert(`Failed to update stock for ${it.name}: ${errorMsg}`);
              setReturnModal((r) => ({ ...r, submitting: false }));
              return;
            }
          }
          
          // Create a return entry in localStorage or backend
          const returnData = {
            mrsId: it.materialId,
            materialName: it.name,
            originalQuantity: it.assignedQty,
            returnedQuantity: returnQty,
            remainingQuantity: it.assignedQty - returnQty,
            returnDate: new Date().toISOString(),
            taskName: wbsItem?.name,
            projectId: wbsItem?.projectId
          };
          
          // Store return record
          const existingReturns = JSON.parse(localStorage.getItem('MATERIAL_RETURNS') || '[]');
          existingReturns.push(returnData);
          localStorage.setItem('MATERIAL_RETURNS', JSON.stringify(existingReturns));
          
          // Update MRS quantity in localStorage to track returns
          const mrsReturns = JSON.parse(localStorage.getItem('MRS_RETURNS') || '{}');
          const currentReturned = mrsReturns[it.materialId] || 0;
          mrsReturns[it.materialId] = currentReturned + returnQty;
          localStorage.setItem('MRS_RETURNS', JSON.stringify(mrsReturns));
          
          console.log(`📦 Updated MRS_RETURNS for ${it.materialId}:`, {
            previousReturned: currentReturned,
            newReturn: returnQty,
            totalReturned: mrsReturns[it.materialId],
            originalQuantity: it.assignedQty,
            remainingQuantity: it.assignedQty - mrsReturns[it.materialId]
          });
          
          // If fully returned, update status
          if (returnQty >= it.assignedQty) {
            materialStatusSync[it.materialId] = 'returned';
            localStorage.setItem('MRS_STATUS_SYNC', JSON.stringify(materialStatusSync));
          }
          
          console.log('✅ MRS Material returned:', returnData);
        }
      } else {
        // Handle linkedMaterial return (existing logic)
        await api.post("/wbs/return-material", {
          wbsId,
          materialId: it.materialId,
          returnQty,
        });
      }

      // Force immediate refresh of saved materials with updated return data
      setTimeout(() => {
        const event = new CustomEvent('materialReturned', { 
          detail: { materialId: it.materialId, returnedQty: returnQty } 
        });
        window.dispatchEvent(event);
      }, 50); // Small delay to ensure localStorage is updated

      if (wbsItem?.projectId) {
        dispatch(fetchWbsByProject(wbsItem.projectId));
      }
      
      setReturnModal({ open: false, item: null, submitting: false });
      
      // Show success message
      const stockMessage = isMRSMaterial ? ` Stock updated.` : '';
      alert(`Successfully returned ${returnQty} ${it.unit} of ${it.name}.${stockMessage}`);
      
      // 🔥 Refetch both materials and MRS to update all data (with small delay)
      setTimeout(async () => {
        await dispatch(fetchMaterials({ page: 1, limit: 100 }));
        await dispatch(fetchMRS());
      }, 500);
      
    } catch (err) {
      console.error("Return failed", err);
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
              {/* Show toggle to switch to edit mode if there are saved materials */}
              {/* {savedMaterials.length > 0 && (
                <div className="ml-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingMode((s) => !s)}
                  >
                    {isEditingMode ? "View" : "Edit"}
                  </Button>
                </div>
              )} */}
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
              <p className="text-sm font-medium mb-2">Saved Materials</p>

              <div className="space-y-3 h-[380px] overflow-y-auto pr-2 border rounded p-2 bg-gray-50">
                {savedMaterials.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No materials saved yet.
                  </p>
                ) : (
                  savedMaterials.map((m) => {
                    // Check if this is from MRS or linkedMaterials
                    const isMRSMaterial = mrsList?.some((mrs: any) => 
                      (mrs.id === m.materialId || mrs._id === m.materialId) && mrs.task === wbsItem?.name
                    );
                    
                    // Get material status from localStorage
                    const materialStatus = (() => {
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
                            <p className="text-xs text-gray-600">
                              Qty: <strong>{m.quantity}</strong> {m.unit}
                            </p>
                          </div>

                          <div className="flex gap-2">
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
                            {/* {isMRSMaterial && (
                              <span className="text-xs text-gray-500">
                                From MRS Entry
                              </span>
                            )} */}
                          </div>
                        </div>

                        {/* Show status info */}
                        {materialStatus === 'received' && (
                          <p className="text-xs text-green-600 mt-2 flex items-center">
                            ✅ Material received and available
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* NOTE: We don't show inline editing here. Editing done via modal on Update. */}
          <div className="mt-4 flex justify-end gap-2">
            {/* <Button
              variant="outline"
              onClick={() => {
                // Refresh all data
                dispatch(fetchMaterials({ page: 1, limit: 100 }));
                dispatch(fetchMRS());
                if (wbsItem?.projectId) {
                  dispatch(fetchWbsByProject(wbsItem.projectId));
                }
              }}
            >
              🔄 Refresh
            </Button> */}
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
