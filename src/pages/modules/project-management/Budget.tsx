import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";

// Slices
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchResources, ResourceAllocation } from "@/redux/slices/resourceSlice";
import { fetchWbsByProject, WBSItem } from "@/redux/slices/wbsSlice";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons
import {
  TrendingUp,
  BadgeAlert,
  PieChart as PieChartIcon,
  Briefcase,
  Hammer,
  Truck,
  Users,
  Package,
} from "lucide-react";

// Charts
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function BudgetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const organisationId = localStorage.getItem("organisationId") || "";

  // --- Selectors ---
  const { projects } = useSelector((state: RootState) => state.projects);
  const { resources, loading: resourcesLoading } = useSelector(
    (state: RootState) => state.resources
  );
  const { wbs, loading: wbsLoading } = useSelector((state: RootState) => state.wbs);
  
  const { materials: rawMaterials, loading: materialsLoading } = useSelector(
    (state: RootState) => state.rawMaterials
  );

  // --- Local State ---
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // --- Effects ---

  useEffect(() => {
    if (organisationId) {
      dispatch(fetchProjects({ page: 1, limit: 50 }));
      dispatch(fetchMaterials()); 
    }
  }, [organisationId, dispatch]);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchResources(selectedProjectId));
      dispatch(fetchWbsByProject(selectedProjectId));
    }
  }, [selectedProjectId, dispatch]);

  // --- Derived Data & Calculations ---

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const totalPlannedBudget = selectedProject?.budget || 0;

  // Calculate Actuals
  const costs = useMemo(() => {
    let materialCost = 0;
    let labourCost = 0;
    let equipmentCost = 0;
    let otherCost = 0;

    // A. Calculate from Resources
    resources.forEach((res) => {
      const cost = Number(res.totalCost) || 0;
      if (res.resourceType === "material") {
         materialCost += cost;
      } else if (res.resourceType === "manpower") {
         labourCost += cost;
      } else if (res.resourceType === "equipment") {
        equipmentCost += cost;
      } else {
        otherCost += cost;
      }
    });

    // B. Calculate from WBS (Assigned Persons & Linked Materials)
    const processedPersonIds = new Set<string>();

    wbs.forEach((item: any) => {
      // 1. Assigned Persons (Unique Calculation)
      if (item.assignedPersons && Array.isArray(item.assignedPersons)) {
        item.assignedPersons.forEach((person: any) => {
          const rId = person.resourceId;
          
          if (rId && !processedPersonIds.has(rId)) {
            processedPersonIds.add(rId);

            const financial = person.financial || {};
            let personCost = 0;
            const type = person.type; 

            if (type === "labour") {
              personCost = Number(financial.monthlyRate) || 0;
            } else if (type === "employee") {
              personCost = Number(financial.basicPay) || 0;
            } else {
               personCost = Number(financial.cost) || Number(financial.salary) || 0;
            }

            labourCost += personCost;
          }
        });
      }

      // 2. Linked Materials
      if (item.linkedMaterials && Array.isArray(item.linkedMaterials)) {
        item.linkedMaterials.forEach((mat: any) => {
          const qty = Number(mat.quantity) || 0;
          const matId = typeof mat.materialId === 'object' ? mat.materialId?._id : mat.materialId;

          const rawMat = rawMaterials.find((rm) => rm._id === matId);
          
          let unitPrice = 0;
          if (rawMat) {
             unitPrice = Number(rawMat.unitCost) || 0;
          } else {
             unitPrice = Number((mat.materialId as any)?.unitCost) || 0;
          }
            
          materialCost += qty * unitPrice;
        });
      }
    });

    return {
      material: materialCost,
      labour: labourCost,
      equipment: equipmentCost,
      other: otherCost,
      total: materialCost + labourCost + equipmentCost + otherCost,
    };
  }, [resources, wbs, rawMaterials]);

  // Variance Calculation
  const variance = costs.total - totalPlannedBudget;
  const isOverBudget = variance > 0;
  const variancePercent = totalPlannedBudget
    ? (variance / totalPlannedBudget) * 100
    : 0;

  // --- Chart Data ---

  const overviewBarData = [
    {
      name: "Project Costs",
      Planned: totalPlannedBudget,
      Actual: costs.total,
    },
  ];

  const breakdownData = [
    { name: "Material", value: costs.material, color: "#3b82f6" }, 
    { name: "Labour", value: costs.labour, color: "#22c55e" },   
    { name: "Equipment", value: costs.equipment, color: "#f59e0b" },
    { name: "Other", value: costs.other, color: "#94a3b8" }, 
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Budget & Cost Control
          </h2>
          <p className="text-muted-foreground">
            Integrated cost tracking: WBS (Unique Labour, Material w/ Unit Cost) + Resources.
          </p>
        </div>

        <div className="w-full md:w-64">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts */}
      {isOverBudget && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <BadgeAlert className="h-4 w-4" />
          <AlertTitle>Budget Overrun Alert</AlertTitle>
          <AlertDescription>
            Actual costs (₹{costs.total.toLocaleString()}) exceeded the
            planned budget (₹{totalPlannedBudget.toLocaleString()}) by{" "}
            {variancePercent.toFixed(1)}%.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Planned Budget
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalPlannedBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Target Budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Material</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{costs.material.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Qty * Unit Cost (Raw Materials)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labour</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{costs.labour.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique Assignments (Monthly/Basic)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Truck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{costs.equipment.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Resource Allocation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Budget Variance Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overviewBarData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                  cursor={{ fill: "transparent" }}
                />
                <Legend />
                <Bar
                  dataKey="Planned"
                  fill="#94a3b8"
                  name="Planned Budget"
                  radius={[0, 4, 4, 0]}
                  barSize={40}
                />
                <Bar
                  dataKey="Actual"
                  fill={isOverBudget ? "#ef4444" : "#3b82f6"}
                  name="Total Actual Cost"
                  radius={[0, 4, 4, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Actual Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            {breakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString()}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground">
                No cost data available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aggregated Cost Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Consolidated Cost Items</CardTitle>
          <Badge variant="secondary">
             Total: ₹{costs.total.toLocaleString()}
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Name / Description</TableHead>
                <TableHead className="text-right">Cost (₹)</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(wbsLoading || resourcesLoading || materialsLoading) && (
                 <TableRow>
                   <TableCell colSpan={4} className="text-center py-8">Calculating costs...</TableCell>
                 </TableRow>
              )}

              {/* 1. Resources */}
              {resources.map(res => (
                <TableRow key={`res-${res._id}`}>
                  <TableCell className="capitalize">{res.resourceType}</TableCell>
                  <TableCell>{res.resourceName} (Allocation)</TableCell>
                  <TableCell className="text-right">₹{Number(res.totalCost).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Resource Slice</TableCell>
                </TableRow>
              ))}

              {/* 2. Unique Labour */}
              {(() => {
                 const displayedPersons = new Set();
                 return wbs.flatMap((item: any) => 
                   (item.assignedPersons || []).map((p: any, idx: number) => {
                      if (displayedPersons.has(p.resourceId)) return null;
                      displayedPersons.add(p.resourceId);

                      const financial = p.financial || {};
                      let cost = 0;
                      if (p.type === "labour") cost = Number(financial.monthlyRate) || 0;
                      else if (p.type === "employee") cost = Number(financial.basicPay) || 0;
                      else cost = Number(financial.cost) || 0;

                      // Display row even if cost is 0 to show all selected persons
                      return (
                        <TableRow key={`person-${p.resourceId}`}>
                          <TableCell className="capitalize">{p.type}</TableCell>
                          <TableCell>
                            {p.personalInfo?.firstName && p.personalInfo?.lastName 
                                ? `${p.personalInfo.firstName} ${p.personalInfo.lastName}` 
                                : `ID: ${p.resourceId}`}
                          </TableCell>
                          <TableCell className="text-right">₹{cost.toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {p.type === "labour" ? "Monthly Rate" : "Basic Pay"}
                          </TableCell>
                        </TableRow>
                      );
                   })
                 );
              })()}

              {/* 3. WBS Linked Materials */}
              {wbs.flatMap((item: any) => 
                (item.linkedMaterials || []).map((m: any, idx: number) => {
                   const qty = Number(m.quantity) || 0;
                   const matId = typeof m.materialId === 'object' ? m.materialId?._id : m.materialId;
                   const rawMat = rawMaterials.find((rm) => rm._id === matId);
                   const unitPrice = rawMat ? (Number(rawMat.unitCost) || 0) : (Number((m.materialId as any)?.unitCost) || 0);
                   
                   const mCost = qty * unitPrice;
                   if(mCost === 0) return null;

                   return (
                    <TableRow key={`wbs-m-${item.id || item._id}-${idx}`}>
                      <TableCell>Material</TableCell>
                      <TableCell>
                         {rawMat ? rawMat.name : "Unknown Material"} (Qty: {qty})
                      </TableCell>
                      <TableCell className="text-right">₹{mCost.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        @ ₹{unitPrice}/unit
                      </TableCell>
                    </TableRow>
                   );
                })
              )}

              {!wbsLoading && !resourcesLoading && !materialsLoading && costs.total === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No cost data found.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}