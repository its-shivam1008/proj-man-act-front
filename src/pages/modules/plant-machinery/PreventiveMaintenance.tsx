"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePermission } from "@/hooks/userPermission";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  CalendarDays,
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Save,
  Search,
  Users,
  MapPin,
  Filter,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import {
  fetchPreventiveMaintenancePlans,
  fetchPreventiveMaintenanceStats,
  createPreventiveMaintenancePlan,
  updatePreventiveMaintenancePlan,
  markPreventiveMaintenanceCompleted,
  deletePreventiveMaintenancePlan,
  setPage,
  setLimit,
  clearError,
  PreventiveMaintenancePlan,
} from "@/redux/slices/plantandmachinary/preventiveMaintenanceSlice";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";
import { fetchEquipments } from "@/redux/slices/equipmentSlice";
import api from "@/utils/axiosApi";

export default function PreventiveMaintenanceDashboard() {
  const canView = usePermission("preventiveMaint", "view");
  const canCreate = usePermission("preventiveMaint", "create");
  const canEdit = usePermission("preventiveMaint", "edit");
  const canDelete = usePermission("preventiveMaint", "delete");
  const dispatch = useDispatch<AppDispatch>();
  
  
  const {
    plans,
    stats,
    loading,
    error,
    total,
    page,
    limit,
  } = useSelector((state: RootState) => state.preventiveMaintenance);
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
  
  const { locations } = useSelector((state: RootState) => state.masterData);
  const { equipments } = useSelector((state: RootState) => state.equipment);

  // Debug locations
  useEffect(() => {
    console.log("Locations loaded:", locations);
  }, [locations]);
  
  // Debug equipments
  useEffect(() => {
    console.log("Equipments loaded:", equipments);
  }, [equipments]);
  
  // Function to create sample locations
  const createSampleLocations = async () => {
    try {
      const response = await api.post('/master/location/sample');
      console.log("Sample locations created:", response.data);
      dispatch(fetchMasterData("location")); // Refresh locations
      toast.success("Sample locations created successfully");
    } catch (error: any) {
      console.error("Error creating sample locations:", error);
      toast.error(error.response?.data?.message || "Error creating sample locations");
    }
  };
  
  // Function to create sample equipments
  const createSampleEquipments = async () => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const sampleEquipments = [
        {
          code: "EQ001",
          name: "CNC Machine A",
          model: "CNC-2024",
          manufacturer: "TechCorp",
          category: "heavy-machinery",
          organisationId
        },
        {
          code: "EQ002", 
          name: "Hydraulic Press",
          model: "HP-500",
          manufacturer: "PowerTech",
          category: "heavy-machinery",
          organisationId
        },
        {
          code: "EQ003",
          name: "Forklift",
          model: "FL-200",
          manufacturer: "LiftCorp",
          category: "vehicles",
          organisationId
        }
      ];
      
      for (const equipment of sampleEquipments) {
        await api.post('/equipment/create', equipment);
      }
      
      dispatch(fetchEquipments({ page: 1, limit: 100 })); // Refresh equipments
      toast.success("Sample equipments created successfully");
    } catch (error: any) {
      console.error("Error creating sample equipments:", error);
      toast.error(error.response?.data?.message || "Error creating sample equipments");
    }
  };
  
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PreventiveMaintenancePlan | null>(null);
  const [form, setForm] = useState<Partial<PreventiveMaintenancePlan>>({
    planType: "Time-based",
    intervalUnit: "Days",
    status: "Scheduled",
  });
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  
  // Load data on component mount
  useEffect(() => {
    dispatch(fetchMasterData("location")); // Specify location type
    dispatch(fetchEquipments({ page: 1, limit: 100 })); // Fetch equipments
    dispatch(fetchPreventiveMaintenanceStats());
    loadPlans();
  }, [dispatch]);
  
  // Load locations if empty
  useEffect(() => {
    if (locations.length === 0) {
      console.log("Locations empty, fetching...");
      dispatch(fetchMasterData("location"))
      .unwrap()
      .then((result) => {
        console.log("Locations fetched successfully:", result);
      })
      .catch((error) => {
          console.error("Error fetching locations:", error);
        });
    }
  }, [locations, dispatch]);
  
  // Load equipmeny
  useEffect(() => {
    if (equipments.length === 0) {
      console.log("Equipments empty, fetching...");
      dispatch(fetchEquipments({ page: 1, limit: 100 }))
      .unwrap()
      .then((result) => {
        console.log("Equipments fetched successfully:", result);
        })
        .catch((error) => {
          console.error("Error fetching equipments:", error);
        });
      }
    }, [equipments, dispatch]);
    
  // Load plans when filters change
  useEffect(() => {
    loadPlans();
  }, [page, limit, query, statusFilter, locationFilter]);
  
  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);
  
  const loadPlans = () => {
    dispatch(fetchPreventiveMaintenancePlans({
      page,
      limit,
      search: query,
      status: statusFilter !== "all" ? statusFilter : undefined,
      location: locationFilter !== "all" ? locationFilter : undefined,
    }));
  };

  const calculateNextDate = (plan: Partial<PreventiveMaintenancePlan>) => {
    if (!plan.lastServiceDate || !plan.intervalValue) return "";
    const date = new Date(plan.lastServiceDate);
    const val = plan.intervalValue;
    const unit = plan.intervalUnit?.toLowerCase();
    switch (unit) {
      case "days":
        date.setDate(date.getDate() + val);
        break;
        case "months":
          date.setMonth(date.getMonth() + val);
          break;
          case "hours":
            date.setDate(date.getDate() + Math.floor(val / 24));
            break;
    }
    return date.toISOString().split("T")[0];
  };
  
  const openAdd = () => {
    setEditing(null);
    setForm({ 
      planType: "Time-based", 
      intervalUnit: "Days", 
      status: "Scheduled",
      estimatedHours: 0,
      estimatedCost: 0,
    });
    setIsDialogOpen(true);
  };
  
  const openEdit = (plan: PreventiveMaintenancePlan) => {
    setEditing(plan);
    setForm({
      ...plan,
      location: plan.location?._id,
      lastServiceDate: plan.lastServiceDate?.split('T')[0],
      nextServiceDate: plan.nextServiceDate?.split('T')[0],
    });
    setIsDialogOpen(true);
  };
  
  const saveForm = async () => {
    if (!form.equipmentName || !form.lastServiceDate || !form.intervalValue) {
      toast.error("Equipment name, interval, and last service date are required.");
      return;
    }
    
    const nextDate = calculateNextDate(form);
    const formData = {
      ...form,
      nextServiceDate: nextDate,
      intervalValue: Number(form.intervalValue),
      estimatedHours: Number(form.estimatedHours) || 0,
      estimatedCost: Number(form.estimatedCost) || 0,
    };

    try {
      if (editing) {
        await dispatch(updatePreventiveMaintenancePlan({ 
          id: editing._id!, 
          data: formData 
        })).unwrap();
        toast.success("Plan updated successfully");
      } else {
        await dispatch(createPreventiveMaintenancePlan(formData)).unwrap();
        toast.success("Plan created successfully");
      }
      
      setIsDialogOpen(false);
      dispatch(fetchPreventiveMaintenanceStats());
    } catch (error: any) {
      toast.error(error || "Operation failed");
    }
  };
  
  const deletePlan = async (id: string) => {
    if (confirm("Delete this maintenance plan?")) {
      try {
        await dispatch(deletePreventiveMaintenancePlan(id)).unwrap();
        toast.success("Plan deleted successfully");
        dispatch(fetchPreventiveMaintenanceStats());
      } catch (error: any) {
        toast.error(error || "Delete failed");
      }
    }
  };
  
  const markCompleted = async (plan: PreventiveMaintenancePlan) => {
    try {
      await dispatch(markPreventiveMaintenanceCompleted({ 
        id: plan._id!,
        actualHours: plan.estimatedHours,
        actualCost: plan.estimatedCost,
      })).unwrap();
      toast.success("Plan marked as completed");
      dispatch(fetchPreventiveMaintenanceStats());
    } catch (error: any) {
      toast.error(error || "Operation failed");
    }
  };
  
  // Technician workload data
  const technicianData = useMemo(() => {
    const map: Record<string, number> = {};
    plans.forEach((p) => {
      if (p.assignedTechnician)
        map[p.assignedTechnician] = (map[p.assignedTechnician] || 0) + 1;
    });
    return Object.entries(map).map(([tech, count]) => ({
      technician: tech,
      tasks: count,
    }));
  }, [plans]);
  
  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };
  
  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="h-6 w-6" /> Preventive Maintenance Dashboard
        </h1>
        <div className="flex gap-2">
          {locations.length === 0 && (
            <Button variant="outline" onClick={createSampleLocations}>
              Create Sample Locations
            </Button>
          )}
          {equipments.length === 0 && (
            <Button variant="outline" onClick={createSampleEquipments}>
              Create Sample Equipments
            </Button>
          )}
          <Button variant="outline" onClick={() => setViewMode(viewMode === "table" ? "calendar" : "table")}>
            <CalendarDays className="mr-2 h-4 w-4" /> {viewMode === "table" ? "Calendar View" : "Table View"}
          </Button>
          {canCreate && <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Plan
          </Button>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <h2 className="text-xl font-bold">{stats?.overdue || 0}</h2>
            <p className="text-sm text-red-600">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <h2 className="text-xl font-bold">{stats?.scheduled || 0}</h2>
            <p className="text-sm text-blue-600">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <h2 className="text-xl font-bold">{stats?.completed || 0}</h2>
            <p className="text-sm text-green-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <h2 className="text-xl font-bold">₹{stats?.totalEstimatedCost?.toFixed(0) || 0}</h2>
            <p className="text-sm text-gray-500">Est. Total Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Technician Workload Chart */}
      {technicianData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Users className="h-5 w-5 inline-block mr-2" /> Technician Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={technicianData}>
                <XAxis dataKey="technician" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search equipment, technician..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="In-Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.length === 0 ? (
                  <SelectItem value="Loading locations..." disabled>Loading locations...</SelectItem>
                ) : (
                  locations.map((location) => (
                    <SelectItem key={location._id} value={location._id}>
                      {location.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No maintenance plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan._id}>
                      <TableCell className="font-medium">{plan.equipmentName}</TableCell>
                      <TableCell>{plan.planType}</TableCell>
                      <TableCell>{new Date(plan.nextServiceDate).toLocaleDateString()}</TableCell>
                      <TableCell>{plan.assignedTechnician}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {plan.location?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.status === "Overdue" ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Overdue
                          </span>
                        ) : plan.status === "Completed" ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Done
                          </span>
                        ) : plan.status === "In-Progress" ? (
                          <span className="text-orange-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> In Progress
                          </span>
                        ) : (
                          <span className="text-blue-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Scheduled
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {plan.status !== "Completed" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => markCompleted(plan)}
                              title="Mark as completed"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {canEdit && <Button size="sm" variant="ghost" onClick={() => openEdit(plan)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>}
                          {canDelete && <Button size="sm" variant="ghost" onClick={() => deletePlan(plan._id!)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Plan" : "Add Plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Equipment Code *</Label>
              <Input 
                value={form.equipmentCode || ""} 
                onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })} 
                placeholder="Auto-filled from equipment selection"
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Equipment Name *</Label>
              <Select 
                value={form.equipmentName || ""} 
                onValueChange={(value) => {
                  const selectedEquipment = equipments.find(eq => eq.name === value);
                  setForm({ 
                    ...form, 
                    equipmentName: value,
                    equipmentCode: selectedEquipment?.code || form.equipmentCode || ""
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.length === 0 ? (
                    <SelectItem value="loading equipment" disabled>Loading equipments...</SelectItem>
                  ) : (
                    equipments.map((equipment) => (
                      <SelectItem key={equipment._id || equipment.id} value={equipment.name}>
                        {equipment.name} ({equipment.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan Type</Label>
              <Select 
                value={form.planType} 
                onValueChange={(value: any) => setForm({ ...form, planType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Time-based">Time-based</SelectItem>
                  <SelectItem value="Usage-based">Usage-based</SelectItem>
                  <SelectItem value="Condition-based">Condition-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select 
                value={form.location as string} 
                onValueChange={(value) => setForm({ ...form, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.length === 0 ? (
                    <SelectItem value="loading" disabled>Loading locations...</SelectItem>
                  ) : (
                    locations.map((location) => (
                      <SelectItem key={location._id} value={location._id}>
                        {location.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Interval Value *</Label>
              <Input 
                type="number" 
                value={form.intervalValue || ""} 
                onChange={(e) => setForm({ ...form, intervalValue: Number(e.target.value) })} 
              />
            </div>
            <div>
              <Label>Interval Unit</Label>
              <Input 
                value={form.intervalUnit || "Days"} 
                onChange={(e) => setForm({ ...form, intervalUnit: e.target.value })} 
              />
            </div>
            <div>
              <Label>Last Service Date *</Label>
              <Input 
                type="date" 
                value={form.lastServiceDate || ""} 
                onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })} 
              />
            </div>
            <div>
              <Label>Assigned Technician *</Label>
              <Input 
                value={form.assignedTechnician || ""} 
                onChange={(e) => setForm({ ...form, assignedTechnician: e.target.value })} 
              />
            </div>
            <div>
              <Label>Estimated Hours</Label>
              <Input 
                type="number" 
                value={form.estimatedHours || ""} 
                onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} 
              />
            </div>
            <div>
              <Label>Estimated Cost</Label>
              <Input 
                type="number" 
                value={form.estimatedCost || ""} 
                onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })} 
              />
            </div>
            <div className="col-span-2">
              <Label>Remarks</Label>
              <Input 
                value={form.remarks || ""} 
                onChange={(e) => setForm({ ...form, remarks: e.target.value })} 
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveForm} disabled={loading}>
              <Save className="mr-2 h-4 w-4" /> 
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// import React, { useState, useEffect } from 'react';
// import { Plus, Search, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
// import { Button } from '../../../components/ui/button';
// import { Input } from '../../../components/ui/input';
// import { Card, CardContent, CardHeader } from '../../../components/ui/card';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
// import { Label } from '../../../components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
// import { Textarea } from '../../../components/ui/textarea';
// import { Badge } from '../../../components/ui/badge';
// import { useToast } from '../../../hooks/use-toast';
// import { getFromStorage, saveToStorage, PM_STORAGE_KEYS, generateId } from '../../../utils/plantMachineryStorage';
// import type { PreventiveMaintenance, Equipment } from '../../../types/plantMachinery';

// const PreventiveMaintenancePage: React.FC = () => {
//   const [maintenanceRecords, setMaintenanceRecords] = useState<PreventiveMaintenance[]>([]);
//   const [equipment, setEquipment] = useState<Equipment[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState<string>('all');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState<PreventiveMaintenance | null>(null);
//   const { toast } = useToast();

//   const [formData, setFormData] = useState<Partial<PreventiveMaintenance>>({
//     equipmentId: '',
//     equipmentName: '',
//     maintenanceType: 'time-based',
//     frequency: '',
//     intervalHours: 0,
//     intervalDays: 0,
//     lastMaintenanceDate: '',
//     nextMaintenanceDate: '',
//     assignedTechnician: '',
//     estimatedDuration: 0,
//     checklist: [],
//     spareParts: [],
//     totalCost: 0,
//     status: 'scheduled',
//     completionDate: '',
//     remarks: '',
//   });

//   useEffect(() => {
//     loadMaintenanceRecords();
//     loadEquipment();
//   }, []);

//   const loadMaintenanceRecords = () => {
//     const data = getFromStorage<PreventiveMaintenance>(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE);
//     setMaintenanceRecords(data);
//   };

//   const loadEquipment = () => {
//     const data = getFromStorage<Equipment>(PM_STORAGE_KEYS.EQUIPMENT);
//     setEquipment(data);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId);
    
//     const maintenanceData: PreventiveMaintenance = {
//       ...formData,
//       id: editingRecord?.id || generateId(),
//       equipmentId: formData.equipmentId!,
//       equipmentName: selectedEquipment?.name || formData.equipmentName!,
//       maintenanceType: formData.maintenanceType!,
//       frequency: formData.frequency!,
//       intervalHours: formData.intervalHours || 0,
//       intervalDays: formData.intervalDays || 0,
//       lastMaintenanceDate: formData.lastMaintenanceDate!,
//       nextMaintenanceDate: formData.nextMaintenanceDate!,
//       assignedTechnician: formData.assignedTechnician!,
//       estimatedDuration: formData.estimatedDuration!,
//       checklist: formData.checklist || [],
//       spareParts: formData.spareParts || [],
//       totalCost: formData.totalCost!,
//       status: formData.status!,
//       remarks: formData.remarks!,
//       createdAt: editingRecord?.createdAt || new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     } as PreventiveMaintenance;

//     if (editingRecord) {
//       const updated = maintenanceRecords.map(m => m.id === editingRecord.id ? maintenanceData : m);
//       setMaintenanceRecords(updated);
//       saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
//       toast({ title: 'Maintenance record updated successfully' });
//     } else {
//       const updated = [...maintenanceRecords, maintenanceData];
//       setMaintenanceRecords(updated);
//       saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
//       toast({ title: 'Maintenance scheduled successfully' });
//     }

//     setIsDialogOpen(false);
//     resetForm();
//   };

//   const handleEdit = (record: PreventiveMaintenance) => {
//     setEditingRecord(record);
//     setFormData(record);
//     setIsDialogOpen(true);
//   };

//   const handleDelete = (id: string) => {
//     if (confirm('Are you sure you want to delete this maintenance record?')) {
//       const updated = maintenanceRecords.filter(m => m.id !== id);
//       setMaintenanceRecords(updated);
//       saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
//       toast({ title: 'Maintenance record deleted successfully' });
//     }
//   };

//   const handleComplete = (id: string) => {
//     const updated = maintenanceRecords.map(m =>
//       m.id === id ? { ...m, status: 'completed' as const, completionDate: new Date().toISOString() } : m
//     );
//     setMaintenanceRecords(updated);
//     saveToStorage(PM_STORAGE_KEYS.PREVENTIVE_MAINTENANCE, updated);
//     toast({ title: 'Maintenance marked as completed' });
//   };

//   const resetForm = () => {
//     setEditingRecord(null);
//     setFormData({
//       equipmentId: '',
//       equipmentName: '',
//       maintenanceType: 'time-based',
//       frequency: '',
//       intervalHours: 0,
//       intervalDays: 0,
//       lastMaintenanceDate: '',
//       nextMaintenanceDate: '',
//       assignedTechnician: '',
//       estimatedDuration: 0,
//       checklist: [],
//       spareParts: [],
//       totalCost: 0,
//       status: 'scheduled',
//       completionDate: '',
//       remarks: '',
//     });
//   };

//   const filteredRecords = maintenanceRecords.filter(record => {
//     const matchesSearch =
//       record.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       record.assignedTechnician.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
//     return matchesSearch && matchesStatus;
//   });

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">Preventive Maintenance</h1>
//           <p className="text-muted-foreground">Schedule and track preventive maintenance activities</p>
//         </div>
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogTrigger asChild>
//             <Button onClick={resetForm}>
//               <Plus className="mr-2 h-4 w-4" />
//               Schedule Maintenance
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>{editingRecord ? 'Edit Maintenance' : 'Schedule Maintenance'}</DialogTitle>
//             </DialogHeader>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="col-span-2">
//                   <Label>Equipment *</Label>
//                   <Select value={formData.equipmentId} onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select equipment" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {equipment.map(eq => (
//                         <SelectItem key={eq.id} value={eq.id}>
//                           {eq.equipmentCode} - {eq.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Maintenance Type *</Label>
//                   <Select value={formData.maintenanceType} onValueChange={(value: any) => setFormData({ ...formData, maintenanceType: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="time-based">Time-based</SelectItem>
//                       <SelectItem value="usage-based">Usage-based</SelectItem>
//                       <SelectItem value="condition-based">Condition-based</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Frequency *</Label>
//                   <Input
//                     value={formData.frequency}
//                     onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
//                     placeholder="e.g., Monthly, 500 hours"
//                     required
//                   />
//                 </div>
//                 {formData.maintenanceType === 'usage-based' && (
//                   <div>
//                     <Label>Interval Hours</Label>
//                     <Input
//                       type="number"
//                       value={formData.intervalHours}
//                       onChange={(e) => setFormData({ ...formData, intervalHours: parseInt(e.target.value) })}
//                     />
//                   </div>
//                 )}
//                 {formData.maintenanceType === 'time-based' && (
//                   <div>
//                     <Label>Interval Days</Label>
//                     <Input
//                       type="number"
//                       value={formData.intervalDays}
//                       onChange={(e) => setFormData({ ...formData, intervalDays: parseInt(e.target.value) })}
//                     />
//                   </div>
//                 )}
//                 <div>
//                   <Label>Last Maintenance Date *</Label>
//                   <Input
//                     type="date"
//                     value={formData.lastMaintenanceDate}
//                     onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Next Maintenance Date *</Label>
//                   <Input
//                     type="date"
//                     value={formData.nextMaintenanceDate}
//                     onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Assigned Technician *</Label>
//                   <Input
//                     value={formData.assignedTechnician}
//                     onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Estimated Duration (hours) *</Label>
//                   <Input
//                     type="number"
//                     value={formData.estimatedDuration}
//                     onChange={(e) => setFormData({ ...formData, estimatedDuration: parseFloat(e.target.value) })}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Total Cost</Label>
//                   <Input
//                     type="number"
//                     value={formData.totalCost}
//                     onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Status</Label>
//                   <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="scheduled">Scheduled</SelectItem>
//                       <SelectItem value="in-progress">In Progress</SelectItem>
//                       <SelectItem value="completed">Completed</SelectItem>
//                       <SelectItem value="overdue">Overdue</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 {formData.status === 'completed' && (
//                   <div>
//                     <Label>Completion Date</Label>
//                     <Input
//                       type="date"
//                       value={formData.completionDate}
//                       onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
//                     />
//                   </div>
//                 )}
//                 <div className="col-span-2">
//                   <Label>Remarks</Label>
//                   <Textarea
//                     value={formData.remarks}
//                     onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
//                     rows={3}
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end gap-2">
//                 <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
//                   Cancel
//                 </Button>
//                 <Button type="submit">
//                   {editingRecord ? 'Update' : 'Schedule'}
//                 </Button>
//               </div>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="flex gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search maintenance records..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <Select value={filterStatus} onValueChange={setFilterStatus}>
//               <SelectTrigger className="w-48">
//                 <SelectValue placeholder="Filter by status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Status</SelectItem>
//                 <SelectItem value="scheduled">Scheduled</SelectItem>
//                 <SelectItem value="in-progress">In Progress</SelectItem>
//                 <SelectItem value="completed">Completed</SelectItem>
//                 <SelectItem value="overdue">Overdue</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b">
//                   <th className="text-left p-3">Equipment</th>
//                   <th className="text-left p-3">Type</th>
//                   <th className="text-left p-3">Frequency</th>
//                   <th className="text-left p-3">Next Due</th>
//                   <th className="text-left p-3">Technician</th>
//                   <th className="text-left p-3">Duration</th>
//                   <th className="text-left p-3">Status</th>
//                   <th className="text-left p-3">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredRecords.map((record) => (
//                   <tr key={record.id} className="border-b hover:bg-muted/50">
//                     <td className="p-3 font-medium">{record.equipmentName}</td>
//                     <td className="p-3 capitalize">{record.maintenanceType.replace('-', ' ')}</td>
//                     <td className="p-3">{record.frequency}</td>
//                     <td className="p-3">{new Date(record.nextMaintenanceDate).toLocaleDateString()}</td>
//                     <td className="p-3">{record.assignedTechnician}</td>
//                     <td className="p-3">{record.estimatedDuration}h</td>
//                     <td className="p-3">
//                       <Badge
//                         variant={
//                           record.status === 'completed' ? 'default' :
//                           record.status === 'in-progress' ? 'secondary' :
//                           record.status === 'overdue' ? 'destructive' : 'outline'
//                         }
//                       >
//                         {record.status}
//                       </Badge>
//                     </td>
//                     <td className="p-3">
//                       <div className="flex gap-2">
//                         {record.status !== 'completed' && (
//                           <Button size="sm" variant="ghost" onClick={() => handleComplete(record.id)}>
//                             <CheckCircle className="h-4 w-4 text-success" />
//                           </Button>
//                         )}
//                         <Button size="sm" variant="ghost" onClick={() => handleEdit(record)}>
//                           <Edit className="h-4 w-4" />
//                         </Button>
//                         <Button size="sm" variant="ghost" onClick={() => handleDelete(record.id)}>
//                           <Trash2 className="h-4 w-4 text-destructive" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {filteredRecords.length === 0 && (
//                   <tr>
//                     <td colSpan={8} className="p-8 text-center text-muted-foreground">
//                       No maintenance records found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default PreventiveMaintenancePage;
