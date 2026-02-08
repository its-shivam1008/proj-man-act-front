"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";

import {
  fetchPlantMachineryMaster,
  addPlantMachineryMaster,
  updatePlantMachineryMaster,
  deletePlantMachineryMaster,
} from "@/redux/slices/plantandmachinary/plantMachineryMasterSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";


type MasterType = "category" | "supplier";
type CategoryForType = "machinery" | "equipment" | "sparepart";


export default function PlantMachineryMasterPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [activeCategoryFor, setActiveCategoryFor] =
    useState<CategoryForType>("machinery");


  const { category, supplier, pagination } = useSelector(
    (state: RootState) => state.plantMachineryMaster
  );

  const [activeTab, setActiveTab] = useState<MasterType>("category");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (activeTab === "category") {
      dispatch(
        fetchPlantMachineryMaster({
          type: "category",
          categoryFor: activeCategoryFor,
          page: pagination.category[activeCategoryFor].page,
          limit: 10,
        })
      );
    } else {
      dispatch(
        fetchPlantMachineryMaster({
          type: "supplier",
          page: pagination.supplier.page,
          limit: 10,
        })
      );
    }
  }, [dispatch, activeTab, activeCategoryFor]);


  const list =
    activeTab === "category"
      ? category[activeCategoryFor]
      : supplier;


  const openDialog = (item?: any) => {
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name || "",
        description: item.description || "",
        company: item.company || "",
        phone: item.phone || "",
        email: item.email || "",
      });
    } else {
      setEditItem(null);
      setFormData({
        name: "",
        description: "",
        company: "",
        phone: "",
        email: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      return toast.error("Name is required");
    }

    const payload =
      activeTab === "category"
        ? { ...formData, categoryFor: activeCategoryFor }
        : formData;

    try {
      if (editItem) {
        await dispatch(
          updatePlantMachineryMaster({
            id: editItem._id,
            type: activeTab,
            data: payload,
          })
        ).unwrap();
        toast.success("Updated successfully");
      } else {
        await dispatch(
          addPlantMachineryMaster({
            type: activeTab,
            data: payload,
          })
        ).unwrap();
        toast.success("Created successfully");
      }

      setDialogOpen(false);
    } catch {
      toast.error("Operation failed");
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;

    try {
      await dispatch(
        deletePlantMachineryMaster({ id, type: activeTab })
      ).unwrap();
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Plant & Machinery Master
        </h1>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Add New
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as MasterType)}
      >
        <TabsList>
          <TabsTrigger value="category">
            Category
          </TabsTrigger>
          <TabsTrigger value="supplier">
            Supplier
          </TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="capitalize">
              {activeTab} List
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {activeTab === "category" && (
                    <Tabs
                      value={activeCategoryFor}
                      onValueChange={(v) =>
                        setActiveCategoryFor(v as CategoryForType)
                      }
                      className="mt-4"
                    >
                      <TabsList>
                        <TabsTrigger value="machinery">Machinery</TabsTrigger>
                        <TabsTrigger value="equipment">Equipment</TabsTrigger>
                        <TabsTrigger value="sparepart">Spare Parts</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                  {activeTab === "supplier" && (
                    <>
                      <TableHead>Company</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((item: any) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.name}</TableCell>

                      {activeTab === "category" && (
                        <TableCell>
                          {item.description}
                        </TableCell>
                      )}

                      {activeTab === "supplier" && (
                        <>
                          <TableCell>
                            {item.company}
                          </TableCell>
                          <TableCell>
                            {item.phone}
                          </TableCell>
                          <TableCell>
                            {item.email}
                          </TableCell>
                        </>
                      )}

                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleDelete(item._id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit" : "Add"}{" "}
              {activeTab === "category"
                ? `${activeCategoryFor} category`
                : "supplier"}
            </DialogTitle>

          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
              />
            </div>

            {activeTab === "category" && (
              <div>
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
            )}

            {activeTab === "supplier" && (
              <>
                <div>
                  <Label>Company</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
