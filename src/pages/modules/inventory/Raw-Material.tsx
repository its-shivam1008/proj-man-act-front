import { usePermission } from "@/hooks/userPermission";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";

import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";

import {
  fetchMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
} from "@/redux/slices/rawmaterialSlice";

import { fetchInventoryMaster } from "@/redux/slices/inventoryMasterSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye, Edit, Trash2, Plus, Warehouse, ShieldAlert } from "lucide-react";

import { RawMaterial } from "@/redux/slices/rawmaterialSlice";

export default function RawMaterialMaster() {

  const [page, setPage] = useState(1);
  const limit = 10;
  const hasPrev = page > 1;
  const canView = usePermission("rawMaterials", "view");
  const canCreate = usePermission("rawMaterials", "create");
  const canEdit = usePermission("rawMaterials", "edit");
  const canDelete = usePermission("rawMaterials", "delete");
  const dispatch = useDispatch<any>();

  // Redux State
  const { materials, total, page: currentPage, limit: perPage, loading } =
    useSelector((state: RootState) => state.rawMaterials);
  const hasNext = page * limit < total;
  const [viewItem, setViewItem] = useState<RawMaterial | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RawMaterial>({
    defaultValues: {
      name: "",
      unitOfMeasure: "",
      valuationMethod: "FIFO",
      quantity: 0,
      unitCost: 0,
      reorderLevel: 0,
      trackInventory: true,
      hsn: "",
    },
  });

  // Get HSN codes from inventory master
  const { hsn: hsnCodes } = useSelector(
    (state: RootState) => state.inventoryMaster
  );

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchMaterials({ page, limit }));
    // Fetch HSN codes
    dispatch(fetchInventoryMaster({ type: "hsn", page: 1, limit: 100 }));
  }, [dispatch, page, limit]);
  const isSearching = search.trim() !== "";
  const filtered = useMemo(() => {

    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.itemCode || "").toLowerCase().includes(q)
    );
  }, [materials, search]);

  const onSubmit = async (data: RawMaterial) => {
    if (editing) {
      dispatch(updateMaterial({ id: editing._id!, data })).then(() => {
        dispatch(fetchMaterials({ page, limit }));
      });

    } else {
      dispatch(addMaterial(data)).then(() => {
        dispatch(fetchMaterials({ page, limit }));
      });

    }

    reset();
    setEditing(null);
    setOpen(false);
  };

  const startEdit = (it: RawMaterial) => {
    setEditing(it);
    reset(it);
    setOpen(true);
  };

  const calcStatus = (r: RawMaterial) => {
    if (!r.trackInventory) return <Badge variant="outline">Non-tracked</Badge>;
    if ((r.quantity ?? 0) === 0)
      return <Badge variant="destructive">Out of stock</Badge>;
    if ((r.quantity ?? 0) <= (r.reorderLevel ?? 0))
      return <Badge className="bg-yellow-500">Low</Badge>;
    return <Badge className="bg-green-600">In stock</Badge>;
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h3>
        <p className="text-gray-600">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex gap-2 items-center">
          <Warehouse /> Raw Material / Item Master
        </h1>

        {/* Search + Add Material */}
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />

          <Dialog
            open={open}
            onOpenChange={(state) => {
              setOpen(state);

              if (!state) {
                reset(); // clear form when closing
                setEditing(null); // ensure no old record
              }
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!canCreate}>
                <Plus className="h-4 w-4 mr-1" /> Add Material
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Material" : "Add New Material"}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-2 gap-4 mt-4"
              >
                <div className="col-span-2">
                  <Label>Name</Label>
                  <Input {...register("name", { required: true })} />
                </div>

                <div>
                  <Label>Item Code</Label>
                  <Input {...register("itemCode")} />
                </div>

                <div>
                  <Label>Unit of Measure</Label>
                  <Input {...register("unitOfMeasure", { required: true })} />
                </div>

                <div>
                  <Label>HSN</Label>
                  <Controller
                    name="hsn"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select HSN Code">
                            {field.value || "Select HSN Code"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {hsnCodes && hsnCodes.length > 0 ? (
                            hsnCodes.map((hsn: any) => (
                              <SelectItem key={hsn._id} value={hsn.hsnNumber}>
                                {hsn.hsnNumber} - {hsn.taxPercent}%
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-3 text-sm text-muted-foreground">
                              No HSN codes available. Add them in Master Data.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label>GST %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("gstPercent")}
                  />
                </div>

                <div>
                  <Label>Valuation Method</Label>
                  <select
                    {...register("valuationMethod")}
                    className="border rounded p-2 w-full"
                  >
                    <option value="FIFO">FIFO</option>
                    <option value="WEIGHTED_AVG">Weighted Avg</option>
                  </select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input type="number" {...register("quantity")} />
                </div>

                <div>
                  <Label>Unit Cost</Label>
                  <Input type="number" {...register("unitCost")} />
                </div>

                <div>
                  <Label>Reorder Level</Label>
                  <Input type="number" {...register("reorderLevel")} />
                </div>

                <div className="col-span-2">
                  <Label>Technical Specs</Label>
                  <Textarea rows={3} {...register("technicalSpecs")} />
                </div>

                <div className="col-span-2 flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      reset();
                      setEditing(null);
                      setOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{editing ? "Save" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Materials List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m._id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.itemCode}</TableCell>
                  <TableCell>{m.unitOfMeasure}</TableCell>
                  <TableCell>{m.quantity}</TableCell>
                  <TableCell>₹{m.unitCost}</TableCell>
                  <TableCell>{calcStatus(m)}</TableCell>
                  <TableCell className="flex gap-3">
                    <Eye
                      className="h-4 w-4 cursor-pointer"
                      onClick={() => setViewItem(m)}
                    />
                    <button disabled={!canEdit} title="Update">
                      <Edit
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => startEdit(m)}
                      />
                    </button>
                    <button disabled={!canDelete} title="Delete">
                      <Trash2
                        className="h-4 w-4 cursor-pointer text-red-500"
                        onClick={() =>
                          dispatch(deleteMaterial(m._id!)).then(() => {
                            dispatch(fetchMaterials({ page, limit })).then((res: any) => {
                              const items = res.payload?.materials || [];
                              if (items.length === 0 && page > 1) {
                                setPage((p) => p - 1);
                              }
                            });
                          })
                        }

                      />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-xl shadow">
            <button
              disabled={!hasPrev}
              onClick={() => setPage((prev) => prev - 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span>Page {page}</span>

            <button
              disabled={!hasNext}
              onClick={() => setPage((prev) => prev + 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>



          {/* View Modal */}
          <Dialog
            open={!!viewItem}
            onOpenChange={(o) => !o && setViewItem(null)}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Material Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <p>
                  <strong>Name:</strong> {viewItem?.name}
                </p>
                <p>
                  <strong>Item Code:</strong> {viewItem?.itemCode}
                </p>
                <p>
                  <strong>Unit:</strong> {viewItem?.unitOfMeasure}
                </p>
                <p>
                  <strong>Qty:</strong> {viewItem?.quantity}
                </p>
                <p>
                  <strong>Cost:</strong> ₹{viewItem?.unitCost}
                </p>
                <p>
                  <strong>HSN:</strong> {viewItem?.hsn}
                </p>
                <p>
                  <strong>GST %:</strong> {viewItem?.gstPercent}
                </p>
                <p>
                  <strong>Valuation:</strong> {viewItem?.valuationMethod}
                </p>
                <p>
                  <strong>Reorder Level:</strong> {viewItem?.reorderLevel}
                </p>
                <p>
                  <strong>Technical Specs:</strong> {viewItem?.technicalSpecs}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
