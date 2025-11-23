import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice"; // Import fetchWbsByProject
import api from "@/utils/axiosApi";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function MaterialSelectionDialog({ isOpen, onClose, wbsItem }) {
  const dispatch = useDispatch<AppDispatch>();
  const raw = useSelector((state: RootState) => state.rawMaterials);
  const materials = raw?.materials || [];

  const [selectedMaterials, setSelectedMaterials] = useState([]);

  // 1. Fetch materials when dialog opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchMaterials());
    }
  }, [isOpen, dispatch]);

  // 2. Sync wbsItem.linkedMaterials to local state
  useEffect(() => {
    if (isOpen && wbsItem?.linkedMaterials && materials.length > 0) {
      const prefilled = wbsItem.linkedMaterials.map((link) => {
        const details = materials.find((m) => m._id === link.materialId);
        return {
          materialId: link.materialId,
          name: details?.name || "Unknown Material",
          quantity: link.quantity,
          unit: link.unit,
        };
      });
      setSelectedMaterials(prefilled);
    } else if (isOpen && (!wbsItem?.linkedMaterials || wbsItem.linkedMaterials.length === 0)) {
      setSelectedMaterials([]);
    }
  }, [isOpen, wbsItem, materials]);

  const toggleSelect = (material) => {
    const exists = selectedMaterials.find((m) => m.materialId === material._id);

    if (exists) {
      setSelectedMaterials(
        selectedMaterials.filter((m) => m.materialId !== material._id)
      );
    } else {
      setSelectedMaterials([
        ...selectedMaterials,
        {
          materialId: material._id,
          name: material.name,
          quantity: "",
          unit: material.unitOfMeasure || "kg",
        },
      ]);
    }
  };

  const updateField = (id, field, value) => {
    setSelectedMaterials((prev) =>
      prev.map((item) =>
        item.materialId === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    try {
      const originalIds = wbsItem?.linkedMaterials?.map((m) => m.materialId) || [];
      const currentIds = selectedMaterials.map((m) => m.materialId);

      const promises = [];

      // 1. Handle Removals (Items in original but not in current)
      const toRemove = originalIds.filter((id) => !currentIds.includes(id));
      for (const id of toRemove) {
        promises.push(
          api.post("/wbs/unlink-material", {
            wbsId: wbsItem.id,
            materialId: id,
          })
        );
      }

      // 2. Handle Updates (Unlink old if quantity/unit changed so we can re-add new)
      const newMaterialsPayload = [];
      
      for (const m of selectedMaterials) {
        const original = wbsItem?.linkedMaterials?.find(
          (om) => om.materialId === m.materialId
        );

        if (!original) {
          // It's a brand new item
          newMaterialsPayload.push({
            materialId: m.materialId,
            quantity: m.quantity,
            unit: m.unit,
          });
        } else {
          // It's an existing item. Check if values changed.
          if (original.quantity != m.quantity || original.unit !== m.unit) {
             // Values changed. Remove old, add new.
             promises.push(
                api.post("/wbs/unlink-material", {
                  wbsId: wbsItem.id,
                  materialId: m.materialId,
                })
              );
              newMaterialsPayload.push({
                materialId: m.materialId,
                quantity: m.quantity,
                unit: m.unit,
              });
          }
        }
      }

      // Wait for removals to finish
      await Promise.all(promises);

      // 3. Add New / Updated Materials
      if (newMaterialsPayload.length > 0) {
        await api.post("/wbs/link-materials", {
          wbsId: wbsItem.id,
          materials: newMaterialsPayload,
        });
      }

      // Refresh the WBS list so the parent updates
      if (wbsItem.projectId) {
        dispatch(fetchWbsByProject(wbsItem.projectId));
      }

      onClose();
    } catch (error) {
      console.error("Failed to save materials", error);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link Materials to {wbsItem?.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* LEFT SIDE: Material List */}
          <div className="border rounded p-3 h-96 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Available Materials</p>

            {materials.map((m) => {
              const isSelected = selectedMaterials.some(
                (s) => s.materialId === m._id
              );

              return (
                <div
                  key={m._id}
                  onClick={() => toggleSelect(m)}
                  className={`p-3 rounded border cursor-pointer space-y-1 ${
                    isSelected
                      ? "bg-blue-100 border-blue-400"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="font-semibold">{m.name}</p>
                    <span className="text-xs text-gray-500">{m.itemCode}</span>
                  </div>

                  <p className="text-xs">
                    <strong>Category:</strong> {m.category || "N/A"}
                  </p>

                  <p className="text-xs">
                    <strong>Unit:</strong> {m.unitOfMeasure}
                  </p>

                  <p className="text-xs">
                    <strong>Stock:</strong>{" "}
                    <span
                      className={
                        m.quantity <= m.reorderLevel
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {m.quantity} {m.unitOfMeasure}
                    </span>
                  </p>

                  <p className="text-xs">
                    <strong>Rate:</strong> ₹{m.unitCost || 0}
                  </p>
                </div>
              );
            })}
          </div>

          {/* RIGHT SIDE: Selected Materials */}
          <div>
            <p className="text-sm font-medium mb-2">Selected Materials</p>

            {selectedMaterials.length === 0 && (
              <p className="text-sm text-gray-500">No materials selected.</p>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {selectedMaterials.map((m) => (
                <div key={m.materialId} className="border rounded p-3">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{m.name}</p>

                    <button
                      onClick={() =>
                        setSelectedMaterials(
                          selectedMaterials.filter(
                            (item) => item.materialId !== m.materialId
                          )
                        )
                      }
                      className="rounded-full p-1 hover:bg-gray-200"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs">Quantity</label>
                      <Input
                        value={m.quantity}
                        onChange={(e) =>
                          updateField(m.materialId, "quantity", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs">Unit</label>
                      <Input
                        value={m.unit}
                        onChange={(e) =>
                          updateField(m.materialId, "unit", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          className="mt-4"
          onClick={handleSave}
        >
          Save Materials
        </Button>
      </DialogContent>
    </Dialog>
  );
}