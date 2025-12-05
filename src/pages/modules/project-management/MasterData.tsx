"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchMasterData,
  addMasterItem,
  updateMasterItem,
  deleteMasterItem,
  MasterItem,
  fetchPaginatedMaster,
  setPage,
  setSearchText,
} from "@/redux/slices/masterDataSlice";

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
import { Pencil, Trash2, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/userPermission";

type MasterType = "client" | "department" | "project-type";

export default function MasterDataPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { clients, departments, projectTypes } = useSelector(
    (state: RootState) => state.masterData
  );
  const { paginatedList, page, totalPages, limit, search } = useSelector(
    (state: RootState) => state.masterData
  );

  const canView = usePermission('masterData', 'view');
  const canCreate = usePermission('masterData', 'create');
  const canEdit = usePermission('masterData', 'edit');
  const canDelete = usePermission('masterData', 'delete');

  const [activeTab, setActiveTab] = useState<MasterType>("client");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });


  useEffect(() => {
    dispatch(fetchMasterData("client"));
    dispatch(fetchMasterData("department"));
    dispatch(fetchMasterData("project-type"));
  }, [dispatch]);
  useEffect(() => {
    dispatch(fetchPaginatedMaster({
      type: activeTab,
      page,
      limit,
      search,
    }));
  }, [activeTab, page, search]);

  useEffect(() => {
    if (paginatedList.length === 0 && page > 1) {
      dispatch(setPage(page - 1));
    }
  }, [paginatedList.length, page]);


  const handleOpenDialog = (item?: MasterItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, description: item.description || "" });
    } else {
      setEditingItem(null);
      setFormData({ name: "", description: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return toast.error("Name is required");

    try {
      if (editingItem) {
        await dispatch(
          updateMasterItem({
            type: activeTab,
            id: editingItem._id,
            data: formData,
          })
        ).unwrap();
        toast.success("Updated successfully");
        dispatch(
          fetchPaginatedMaster({
            type: activeTab,
            page,
            limit,
            search,
          })
        );
      } else {
        await dispatch(
          addMasterItem({ type: activeTab, data: formData })
        ).unwrap();
        toast.success("Created successfully");
        dispatch(
          fetchPaginatedMaster({
            type: activeTab,
            page,
            limit,
            search,
          })
        );
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await dispatch(deleteMasterItem({ type: activeTab, id }));
      toast.success("Deleted");
      dispatch(fetchPaginatedMaster({
        type: activeTab,
        page,
        limit,
        search
      }));
    }
  };

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Master Data Management</h2>
        {canCreate && <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as MasterType)}
      >
        <TabsList className="w-full justify-start">
          <TabsTrigger value="client">Clients</TabsTrigger>
          <TabsTrigger value="department">Departments</TabsTrigger>
          <TabsTrigger value="project-type">Project Types</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="capitalize">{activeTab.replace("-", " ")} List</CardTitle>
              <Input
                placeholder="Search..."
                className="w-64 mb-4"
                value={search}
                onChange={(e) => {
                  dispatch(setSearchText(e.target.value));
                  dispatch(setPage(1));
                }}
              />

            </div>

          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedList.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {canEdit && <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>}
                        {canDelete && <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item._id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <Button disabled={page === 1} onClick={() => dispatch(setPage(page - 1))}>
                Previous
              </Button>

              <span>Page {page} of {totalPages}</span>

              <Button
                disabled={page === totalPages}
                onClick={() => dispatch(setPage(page + 1))}
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
              {editingItem ? "Edit" : "Add"} {activeTab.replace("-", " ")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
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