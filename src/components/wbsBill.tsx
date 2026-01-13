"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { createBill, fetchBillsByWbs } from "@/redux/slices/wbsBillSlice";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  wbsId: string;
}

interface BillForm {
  totalAmount: string;
  amountReceived: string;
  gstWithheld: string;
  retentionWithheld: string;
  maturityDate: string;
  file: File | null;
}

const emptyBill: BillForm = {
  totalAmount: "",
  amountReceived: "",
  gstWithheld: "",
  retentionWithheld: "",
  maturityDate: "",
  file: null,
};

export default function BillModal({ open, onClose, wbsId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.wbsBill);

  const [bills, setBills] = useState<BillForm[]>([{ ...emptyBill }]);

  /* ================= ADD / REMOVE BILL ================= */

  const addBill = () => {
    setBills([...bills, { ...emptyBill }]);
  };

  const removeBill = (index: number) => {
    setBills(bills.filter((_, i) => i !== index));
  };

  const updateBill = (index: number, field: keyof BillForm, value: any) => {
    const updated = [...bills];
    updated[index][field] = value;
    setBills(updated);
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    for (const bill of bills) {
      if (!bill.totalAmount) {
        alert("Total Amount is required for all bills");
        return;
      }
    }

    for (const bill of bills) {
      const formData = new FormData();

      formData.append("wbsId", wbsId);
      formData.append("totalAmount", bill.totalAmount);
      formData.append("amountReceived", bill.amountReceived || "0");
      formData.append("gstWithheld", bill.gstWithheld || "0");
      formData.append("retentionWithheld", bill.retentionWithheld || "0");
      formData.append("maturityDate", bill.maturityDate);

      if (bill.file) {
        formData.append("billImage", bill.file);
      }

      const res = await dispatch(createBill(formData));
      if (!createBill.fulfilled.match(res)) {
        alert("Failed to create one of the bills");
        return;
      }
    }

    await dispatch(fetchBillsByWbs(wbsId));
    setBills([{ ...emptyBill }]);
    onClose();
  };

  /* ================= UI ================= */

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add Bills for WBS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {bills.map((bill, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-4 bg-muted/30"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">
                  Bill #{index + 1}
                </h4>

                {bills.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeBill(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Total Amount *"
                  type="number"
                  value={bill.totalAmount}
                  onChange={(e) =>
                    updateBill(index, "totalAmount", e.target.value)
                  }
                />

                <Input
                  placeholder="Amount Received"
                  type="number"
                  value={bill.amountReceived}
                  onChange={(e) =>
                    updateBill(index, "amountReceived", e.target.value)
                  }
                />

                <Input
                  placeholder="GST Withheld"
                  type="number"
                  value={bill.gstWithheld}
                  onChange={(e) =>
                    updateBill(index, "gstWithheld", e.target.value)
                  }
                />

                <Input
                  placeholder="Retention Withheld"
                  type="number"
                  value={bill.retentionWithheld}
                  onChange={(e) =>
                    updateBill(index, "retentionWithheld", e.target.value)
                  }
                />

                <Input
                  type="date"
                  value={bill.maturityDate}
                  onChange={(e) =>
                    updateBill(index, "maturityDate", e.target.value)
                  }
                />
              </div>

              <label className="block border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted transition">
                <p className="text-sm font-medium">Upload Bill Image</p>
                <p className="text-xs text-muted-foreground">
                  PNG / JPG up to 5MB
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    updateBill(index, "file", e.target.files?.[0] || null)
                  }
                />
                {bill.file && (
                  <p className="mt-1 text-xs text-green-600">
                    Selected: {bill.file.name}
                  </p>
                )}
              </label>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addBill}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Another Bill
          </Button>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save All Bills"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
