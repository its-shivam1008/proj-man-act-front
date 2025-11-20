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
import api from "@/utils/axiosApi";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function MaterialSelectionDialog({ isOpen, onClose, wbsItem }) {
  const dispatch = useDispatch<AppDispatch>();
  const raw = useSelector((state: RootState) => state.rawMaterials);
  const materials = raw?.materials || [];

  const [selectedMaterials, setSelectedMaterials] = useState([]);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchMaterials());
      setSelectedMaterials([]);
    }
  }, [isOpen, dispatch]);

  const toggleSelect = (material) => {
    const exists = selectedMaterials.find((m) => m.materialId === material._id);

    if (exists) {
      setSelectedMaterials(selectedMaterials.filter((m) => m.materialId !== material._id));
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
    await api.post("/wbs/link-materials", {
      wbsId: wbsItem.id,
      materials: selectedMaterials.map((m) => ({
        materialId: m.materialId,
        quantity: m.quantity,
        unit: m.unit,
      })),
    });

    onClose();
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

                  {m.hsn && (
                    <p className="text-xs">
                      <strong>HSN:</strong> {m.hsn}
                    </p>
                  )}

                  {m.gstPercent && (
                    <p className="text-xs">
                      <strong>GST:</strong> {m.gstPercent}%
                    </p>
                  )}

                  {m.preferredVendor && (
                    <p className="text-xs">
                      <strong>Vendor:</strong> {m.preferredVendor}
                    </p>
                  )}

                  {m.technicalSpecs && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      <strong>Specs:</strong> {m.technicalSpecs}
                    </p>
                  )}
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

                    {/* FIXED CLOSE BUTTON */}
                    <DialogClose asChild>
                      <button
                        onClick={() =>
                          setSelectedMaterials(
                            selectedMaterials.filter(
                              (item) => item.materialId !== m.materialId
                            )
                          )
                        }
                        className="rounded-full p-1 hover:bg-gray-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </DialogClose>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs">Quantity</label>
                      <Input
                        value={m.quantity}
                        onChange={(e) =>
                          updateField(
                            m.materialId,
                            "quantity",
                            e.target.value
                          )
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
          disabled={selectedMaterials.length === 0}
          onClick={handleSave}
        >
          Save Materials
        </Button>
      </DialogContent>
    </Dialog>
  );
}
