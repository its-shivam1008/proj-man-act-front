"use client";
import { usePermission } from "@/hooks/userPermission";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Pencil, Trash2, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type InventoryMasterType = "category" | "hsn" | "supplier";

export default function InventoryMasterData() {
  const canView = usePermission("masterdatainv", "view");
  const canCreate = usePermission("masterdatainv", "create");
  const canEdit = usePermission("masterdatainv", "edit");
  const canDelete = usePermission("masterdatainv", "delete");

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const dispatch = useDispatch<AppDispatch>();
  const { category, hsn, supplier, pagination } = useSelector(
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
    company: "",
    phone: "",
    email: "",
  });

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
    if (activeTab === "category") return category;
    if (activeTab === "hsn") return hsn;
    return supplier;
  };

  const handlePageChange = (page: number) => {
    dispatch(
      fetchInventoryMaster({
        type: activeTab,
        page,
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
        company: item.company || "",
        phone: item.phone || "",
        email: item.email || "",
      });
    } else {
      setEditItem(null);
      setFormData({
        name: "",
        description: "",
        hsnNumber: "",
        taxPercent: "",
        company: "",
        phone: "",
        email: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (activeTab === "category" && !formData.name)
      return toast.error("Category name required");

    if (activeTab === "hsn" && !formData.hsnNumber)
      return toast.error("HSN number required");

    if (activeTab === "supplier" && !formData.name)
      return toast.error("Supplier name required");

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
          addInventoryMaster({
            type: activeTab,
            data: formData,
          })
        ).unwrap();
        toast.success("Created successfully");
      }

      handlePageChange(1);
      setIsDialogOpen(false);
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      await dispatch(
        deleteInventoryMaster({ type: activeTab, id })
      ).unwrap();
      toast.success("Deleted successfully");
      handlePageChange(1);
    } catch {
      toast.error("Delete failed");
    }
  };

  const pageInfo = pagination[activeTab];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Master Data</h1>
        {canCreate && (
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Add New
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as InventoryMasterType)}
      >
        <TabsList className="w-full justify-start">
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="hsn">HSN Codes</TabsTrigger>
          <TabsTrigger value="supplier">Supplier</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="capitalize">{activeTab} List</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === "supplier" ? (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                    </>
                  ) : activeTab === "category" ? (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>HSN</TableHead>
                      <TableHead>Tax %</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {getList().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  getList().map((item: any) => (
                    <TableRow key={item._id}>
                      {activeTab === "supplier" ? (
                        <>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.company}</TableCell>
                          <TableCell>{item.phone}</TableCell>
                          <TableCell>{item.email}</TableCell>
                        </>
                      ) : activeTab === "category" ? (
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
                        {canEdit && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(item._id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                disabled={pageInfo.page === 1}
                onClick={() => handlePageChange(pageInfo.page - 1)}
              >
                Previous
              </Button>
              <span>
                Page {pageInfo.page} of {pageInfo.pages}
              </span>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit" : "Add"} {activeTab}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {activeTab === "category" && (
              <>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </>
            )}

            {activeTab === "hsn" && (
              <>
                <Label>HSN Number</Label>
                <Input
                  type="number"
                  value={formData.hsnNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, hsnNumber: e.target.value })
                  }
                />
                <Label>Tax %</Label>
                <Input
                  type="number"
                  value={formData.taxPercent}
                  onChange={(e) =>
                    setFormData({ ...formData, taxPercent: e.target.value })
                  }
                />
              </>
            )}

            {activeTab === "supplier" && (
              <>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <Label>Company</Label>
                <Input
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
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
