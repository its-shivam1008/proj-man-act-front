"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";

import {
  fetchInventoryMaster,
  addInventoryMaster,
  updateInventoryMaster,
  deleteInventoryMaster,
} from "@/redux/slices/inventoryMasterSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

type InventoryMasterType = "category" | "hsn";

export default function InventoryMasterData() {
  const dispatch = useDispatch<AppDispatch>();

  const { category, hsn, pagination, loading } = useSelector(
    (state: RootState) => state.inventoryMaster
  );

  const [activeTab, setActiveTab] =
    useState<InventoryMasterType>("category");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hsnNumber: "",
    taxPercent: "",
  });

  // Fetch data with pagination
  useEffect(() => {
    dispatch(
      fetchInventoryMaster({
        type: activeTab,
        page: pagination[activeTab].page,
        limit: pagination[activeTab].limit,
      })
    );
  }, [dispatch, activeTab]);

  const getList = () => {
    return activeTab === "category" ? category : hsn;
  };

  const handlePageChange = (newPage: number) => {
    dispatch(
      fetchInventoryMaster({
        type: activeTab,
        page: newPage,
        limit: pagination[activeTab].limit,
      })
    );
  };

  const openDialog = (item?: any) => {
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name || "",
        description: item.description || "",
        hsnNumber: item.hsnNumber || "",
        taxPercent: item.taxPercent || "",
      });
    } else {
      setEditItem(null);
      setFormData({
        name: "",
        description: "",
        hsnNumber: "",
        taxPercent: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (activeTab === "category" && !formData.name)
      return toast.error("Category name required");

    if (activeTab === "hsn" && !formData.hsnNumber)
      return toast.error("HSN number required");

    try {
      if (editItem) {
        await dispatch(
          updateInventoryMaster({
            type: activeTab,
            id: editItem._id,
            data: formData,
          })
        ).unwrap();
        toast.success("Updated successfully");
      } else {
        await dispatch(
          addInventoryMaster({ type: activeTab, data: formData })
        ).unwrap();
        toast.success("Created successfully");
      }

      // Refresh first page
      handlePageChange(1);
      setIsDialogOpen(false);

    } catch (err) {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;

    await dispatch(deleteInventoryMaster({ type: activeTab, id }));
    toast.success("Deleted");

    handlePageChange(1);
  };

  const pageInfo = pagination[activeTab];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Master Data</h1>

        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Add New
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as InventoryMasterType)}
      >
        <TabsList className="w-full justify-start">
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="hsn">HSN Codes</TabsTrigger>
        </TabsList>

        {/* Table */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="capitalize">{activeTab} List</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === "category" ? (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>HSN Number</TableHead>
                      <TableHead>Tax %</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {getList().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      No data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  getList().map((item) => (
                    <TableRow key={item._id}>
                      {activeTab === "category" ? (
                        <>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.description}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{item.hsnNumber}</TableCell>
                          <TableCell>{item.taxPercent}%</TableCell>
                        </>
                      )}
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item._id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                disabled={pageInfo.page === 1}
                onClick={() => handlePageChange(pageInfo.page - 1)}
              >
                Previous
              </Button>

              <div className="text-sm font-medium">
                Page {pageInfo.page} of {pageInfo.pages}
              </div>

              <Button
                variant="outline"
                disabled={pageInfo.page >= pageInfo.pages}
                onClick={() => handlePageChange(pageInfo.page + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit" : "Add"}{" "}
              {activeTab === "category" ? "Category" : "HSN Code"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeTab === "category" ? (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>HSN Number</Label>
                  <Input
                    type="number"
                    value={formData.hsnNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hsnNumber: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tax %</Label>
                  <Input
                    type="number"
                    value={formData.taxPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taxPercent: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
