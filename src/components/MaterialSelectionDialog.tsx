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
import api from "@/utils/axiosApi";
import { Input } from "@/components/ui/input";
import { X, Trash } from "lucide-react";

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
      dispatch(fetchMaterials());
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
    }
  }, [isOpen, materials, wbsItem]);

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
        await api.post("/wbs/unlink-material", {
          wbsId,
          materialId,
        });

        await api.post("/wbs/link-materials", {
          wbsId,
          materials: [{ materialId, quantity: qtyNum, unit }],
        });

        setSavedMaterials((prev) =>
          prev.map((p) =>
            p.materialId === materialId ? { ...p, quantity: qtyNum, unit } : p
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

          // Update existing material without unlinking (prevents return movement)
          await api.post("/wbs/link-materials", {
            wbsId,
            materials: [{ materialId, quantity: newQuantity, unit }],
            updateExisting: true, // Flag to update existing material
          });

          // Update UI
          setSavedMaterials((prev) =>
            prev.map((p) =>
              p.materialId === materialId
                ? { ...p, quantity: newQuantity }
                : p
            )
          );
        } else {
          // New material - add normally
          await api.post("/wbs/link-materials", {
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

      if (wbsItem?.projectId) {
        dispatch(fetchWbsByProject(wbsItem.projectId));
      }
      dispatch(fetchMaterials());

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
      dispatch(fetchMaterials());
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  /* ------------------ Return Material ------------------ */
  const openReturnModal = (m: SelectedMaterial) => {
    setReturnModal({
      open: true,
      item: { ...m, assignedQty: Number(m.quantity), returnQty: "" },
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

      await api.post("/wbs/return-material", {
        wbsId,
        materialId: it.materialId,
        returnQty,
      });

      // update savedMaterials locally: decrease qty or remove if 0
      setSavedMaterials((prev) =>
        prev
          .map((p) =>
            p.materialId === it.materialId
              ? { ...p, quantity: Number(p.quantity) - returnQty }
              : p
          )
          .filter((p) => Number(p.quantity) > 0)
      );

      if (wbsItem?.projectId) {
        dispatch(fetchWbsByProject(wbsItem.projectId));
      }
      dispatch(fetchMaterials());

      setReturnModal({ open: false, item: null, submitting: false });
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

          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* LEFT: AVAILABLE MATERIALS */}
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

            {/* RIGHT: SAVED MATERIALS (READ-ONLY UNLESS EDIT MODE) */}
            <div>
              <p className="text-sm font-medium mb-2">Saved Materials</p>

              <div className="space-y-3 h-[380px] overflow-y-auto pr-2 border rounded p-2 bg-gray-50">
                {savedMaterials.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No materials saved yet.
                  </p>
                ) : (
                  savedMaterials.map((m) => (
                    <div
                      key={m.materialId}
                      className="border rounded p-3 bg-white"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{m.name}</p>
                          <p className="text-xs text-gray-600">
                            Qty: <strong>{m.quantity}</strong> {m.unit}
                          </p>
                        </div>

                        <div className="flex gap-2">
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

                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // open edit modal for this saved material
                              openMaterialModalForEdit(m);
                            }}
                          >
                            Update
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSaved(m);
                            }}
                          >
                            <Trash />
                          </Button> */}
                        </div>
                      </div>

                      {/* In editing mode, show small hint */}
                      {isEditingMode && (
                        <p className="text-xs text-gray-500 mt-2">
                          Click Update to edit quantity / unit.
                        </p>
                      )}
                    </div>
                  ))
                )}
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
                onChange={(e) =>
                  setMaterialInput((s) => ({
                    ...s,
                    item: s.item ? { ...s.item, unit: e.target.value } : s.item,
                  }))
                }
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
              Assigned Quantity:{" "}
              <strong>{returnModal.item?.assignedQty || 0}</strong>
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
                { length: returnModal.item?.assignedQty || 0 },
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
