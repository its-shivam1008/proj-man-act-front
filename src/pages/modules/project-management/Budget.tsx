// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { RootState, AppDispatch } from "@/redux/store";

// // Slices
// import { fetchProjects } from "@/redux/slices/projectSlice";
// import { fetchResources } from "@/redux/slices/resourceSlice";
// import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
// import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
// import { fetchMRS } from "@/redux/slices/mrsSlice";

// // UI Components
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// // Icons
// import {
//   BadgeAlert,
//   Briefcase,
//   Truck,
//   Users,
//   Package,
//   ShieldAlert,
// } from "lucide-react";

// // Charts
// import {
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Legend,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
// import { usePermission } from "@/hooks/userPermission";

// export default function BudgetPage() {
//   const dispatch = useDispatch<AppDispatch>();
//   const organisationId = localStorage.getItem("organisationId") || "";

//   const canView = usePermission('budgetCost', 'view');

//   // --- Selectors ---
//   const { projects } = useSelector((state: RootState) => state.projects);
//   const { resources, loading: resourcesLoading } = useSelector(
//     (state: RootState) => state.resources
//   );
//   const { wbs, loading: wbsLoading } = useSelector((state: RootState) => state.wbs);
  
//   const { materials: rawMaterials, loading: materialsLoading } = useSelector(
//     (state: RootState) => state.rawMaterials
//   );
//   const { list: mrsList, loading: mrsLoading } = useSelector(
//     (state: RootState) => state.mrs
//   );

//   // --- Local State ---
//   const [selectedProjectId, setSelectedProjectId] = useState<string>("");

//   // --- Effects ---

//   useEffect(() => {
//     if (organisationId) {
//       dispatch(fetchProjects({ page: 1, limit: 50 }));
//       // Fetch materials with stock data for FIFO calculation
//       dispatch(fetchMaterials({ page: 1, limit: 1000 }));
//       dispatch(fetchMRS());
//     }
//   }, [organisationId, dispatch]);

//   useEffect(() => {
//     if (!selectedProjectId && projects.length > 0) {
//       setSelectedProjectId((projects[0] as any)._id);
//     }
//   }, [projects, selectedProjectId]);

//   useEffect(() => {
//     if (selectedProjectId) {
//       dispatch(fetchResources(selectedProjectId as any));
//       dispatch(fetchWbsByProject(selectedProjectId));
//       dispatch(fetchMRS()); // Fetch MRS when project changes
//       // Ensure raw materials are fetched with full data including stocks for FIFO calculation
//       dispatch(fetchMaterials({ page: 1, limit: 1000 }));
//     }
//   }, [selectedProjectId, dispatch]);

//   // --- Derived Data & Calculations ---

//   const selectedProject = useMemo(
//     () => projects.find((p: any) => p._id === selectedProjectId) || null,
//     [projects, selectedProjectId]
//   );

//   // Helper function to calculate FIFO cost (same as Raw Materials page)
//   const getAvgCost = (material: any) => {
//     // 🚀 FIFO: Calculate weighted average cost based on remaining quantities
//     if (Array.isArray((material as any).stocks) && (material as any).stocks.length > 0) {
//       const stocksWithQuantity = (material as any).stocks.filter((s: any) => s.remainingQuantity > 0);
      
//       if (stocksWithQuantity.length === 0) return 0;
      
//       const totalValue = stocksWithQuantity.reduce((sum: number, stock: any) => 
//         sum + ((stock.remainingQuantity || 0) * (stock.unitCost || 0)), 0
//       );
//       const totalQuantity = stocksWithQuantity.reduce((sum: number, stock: any) => 
//         sum + (stock.remainingQuantity || 0), 0
//       );
      
//       const avgCost = totalQuantity > 0 ? (totalValue / totalQuantity) : 0;
//       console.log(`🔍 getAvgCost for ${(material as any).name}:`, {
//         stocksWithQuantity: stocksWithQuantity.length,
//         totalValue,
//         totalQuantity,
//         avgCost,
//         stocks: stocksWithQuantity.map((s: any) => ({ remainingQty: s.remainingQuantity, unitCost: s.unitCost }))
//       });
//       return avgCost;
//     }
//     return (material as any).unitCost || 0;
//   };

//   // Helper function to get detailed FIFO breakdown for debugging
//   const getFifoBreakdown = (material: any, usedQuantity: number) => {
//     if (!Array.isArray((material as any).stocks) || (material as any).stocks.length === 0) {
//       return {
//         breakdown: [],
//         totalCost: 0,
//         avgCost: (material as any).unitCost || 0,
//         hasStocks: false
//       };
//     }

//     const stocksWithQuantity = (material as any).stocks
//       .filter((s: any) => s.remainingQuantity > 0)
//       .sort((a: any, b: any) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()); // FIFO order

//     let remainingToUse = usedQuantity;
//     const breakdown: any[] = [];
//     let totalCost = 0;

//     for (const stock of stocksWithQuantity) {
//       if (remainingToUse <= 0) break;
      
//       const availableQty = stock.remainingQuantity || 0;
//       const useFromThisStock = Math.min(remainingToUse, availableQty);
//       const costFromThisStock = useFromThisStock * (stock.unitCost || 0);
      
//       breakdown.push({
//         date: stock.createdAt || stock.date || 'Unknown',
//         availableQty,
//         usedQty: useFromThisStock,
//         unitCost: stock.unitCost || 0,
//         totalCost: costFromThisStock,
//         batchRef: stock.batchRef || stock.reference || `Batch-${stock._id?.slice(-4) || 'Unknown'}`
//       });
      
//       totalCost += costFromThisStock;
//       remainingToUse -= useFromThisStock;
//     }

//     // If we couldn't fulfill from stocks, show warning
//     if (remainingToUse > 0) {
//       breakdown.push({
//         date: 'SHORTAGE',
//         availableQty: 0,
//         usedQty: remainingToUse,
//         unitCost: (material as any).unitCost || 0,
//         totalCost: remainingToUse * ((material as any).unitCost || 0),
//         batchRef: 'Legacy Stock'
//       });
//       totalCost += remainingToUse * ((material as any).unitCost || 0);
//     }

//     return {
//       breakdown,
//       totalCost,
//       avgCost: usedQuantity > 0 ? totalCost / usedQuantity : 0,
//       hasStocks: stocksWithQuantity.length > 0
//     };
//   };



//   const totalPlannedBudget = (selectedProject as any)?.budget || 0;

//   // Check if data is still loading
//   const isDataLoading = wbsLoading || materialsLoading || mrsLoading || resourcesLoading;

//   // Debug: Log material data to check FIFO calculation
//   useEffect(() => {
//     if (rawMaterials.length > 0) {
//       console.log('🔍 Raw Materials Data for FIFO Debug:', rawMaterials.map((m: any) => ({
//         name: m.name,
//         stocks: m.stocks?.length || 0,
//         stockDetails: m.stocks?.map((s: any) => ({ remainingQty: s.remainingQuantity, unitCost: s.unitCost })),
//         calculatedAvgCost: getAvgCost(m)
//       })));
//     }
//   }, [rawMaterials]);

//   // This is the core calculation block
//   const costs = useMemo(() => {
    
//     if (isDataLoading) {
//       return { material: 0, detailedMaterial: 0, labour: 0, equipment: 0, other: 0, total: 0 };
//     }
    
//     let resourceMaterialCost = 0;   // ⭐️ NEW: For material costs from Resources (Section A)
//     let detailedMaterialCost = 0;   // ⭐️ NEW: For material costs from WBS Linked Materials & MRS (Sections B & C)
//     let labourCost = 0;
//     let equipmentCost = 0;
//     let otherCost = 0;

//     // A. Calculate from Resources (Category: Material, Equipment, Labour, Other)
//     resources.forEach((res) => {
//       const cost = Number(res.totalCost) || 0;
//       if (res.resourceType === "material") {
//          resourceMaterialCost += cost; // Using resourceMaterialCost
//       } else if (res.resourceType === "manpower") {
//          labourCost += cost;
//       } else if (res.resourceType === "equipment" || res.resourceType === "machinery") {
//         equipmentCost += cost;
//       } else {
//         otherCost += cost;
//       }
//     });

//     // B. Calculate from WBS (Assigned Persons & Linked Materials)
//     const processedPersonIds = new Set<string>();

//     wbs.forEach((item: any) => {

//       // 1. Assigned Persons (Unique Calculation - Category: Labour)
//       if (item.assignedPersons && Array.isArray(item.assignedPersons)) {
//         item.assignedPersons.forEach((person: any) => {
//           const rId = person.resourceId;
          
//           if (rId && !processedPersonIds.has(rId)) {
//             processedPersonIds.add(rId);

//             const financial = person.financial || {};
//             let personCost = 0;
//             const type = person.type; 

//             if (type === "labour") {
//               personCost = Number(financial.monthlyRate) || 0;
//             } else if (type === "employee") {
//               personCost = Number(financial.basicPay) || 0;
//             } else {
//                personCost = Number(financial.cost) || Number(financial.salary) || 0;
//             }

//             labourCost += personCost;
//           }
//         });
//       }

//       // 2. Linked Materials (Category: Material)
//       if (item.linkedMaterials && Array.isArray(item.linkedMaterials)) {
//         console.log(`🔗 Processing WBS "${item.name}" with ${item.linkedMaterials.length} linked materials`);
//         item.linkedMaterials.forEach((mat: any) => {
//           const qty = Number(mat.quantity) || 0;
          
//           // Check if materialId is populated object or just ID
//           let materialData: any = null;
//           let matId: string | null = null;
          
//           if (typeof mat.materialId === 'object' && mat.materialId !== null) {
//             // Material is populated from backend
//             materialData = mat.materialId;
//             matId = materialData._id;
//           } else {
//             // Material is just ID, find from rawMaterials array
//             matId = mat.materialId;
//             materialData = rawMaterials.find((rm: any) => rm._id === matId);
//           }
          
//           if (materialData) {
//             let unitPrice = 0;
            
//             // 🚀 Use the same FIFO calculation as Raw Materials page
//             const materialFifoBreakdown = getFifoBreakdown(materialData, qty);
//             unitPrice = materialFifoBreakdown.avgCost;
            
//             const totalCost = qty * unitPrice; // This is the value that appears in the "Cost (₹)" column of the table
//             console.log(`🔗 WBS Material: ${materialData.name} = ${qty} × ${unitPrice} = ${totalCost}`);
//             detailedMaterialCost += totalCost; // Using detailedMaterialCost
//           }
//         });
//       }
//     });

//     // C. Calculate from ALL MRS Items for selected project (price * quantity) (Category: Material)
//     if (selectedProjectId && mrsList && Array.isArray(mrsList) && mrsList.length > 0) {
//       console.log('🔍 Calculating MRS costs for project:', selectedProjectId);
//       let mrsItemsProcessed = 0;
//       let mrsTotalCost = 0;

//       mrsList.forEach((mrs: any) => {
//         if (!mrs) return;
        
//         // Match project ID - include ALL MRS items for this project
//         const mrsProjectId = String(mrs.projectId || '');
//         const selectedId = String(selectedProjectId || '');
        
//         if (mrsProjectId === selectedId) {
//           const quantity = Number(mrs.quantity) || 0;
//           let price = Number(mrs.price) || 0;
          
//           console.log(`📋 Processing MRS item: ${mrs.item}, Qty: ${quantity}, Price: ${price}`);
          
//           // If price is 0, try to get price from raw materials
//           if (price === 0 && rawMaterials.length > 0) {
//             const matchingMaterial = rawMaterials.find((rm: any) => 
//               rm.name.toLowerCase() === (mrs.item || '').toLowerCase()
//             );
            
//             if (matchingMaterial) {
//               // Calculate price from FIFO stocks
//               if (Array.isArray((matchingMaterial as any).stocks) && (matchingMaterial as any).stocks.length > 0) {
//                 const stocksWithQuantity = (matchingMaterial as any).stocks.filter((s: any) => s.remainingQuantity > 0);
                
//                 if (stocksWithQuantity.length > 0) {
//                   const totalValue = stocksWithQuantity.reduce((sum: number, stock: any) => 
//                     sum + ((stock.remainingQuantity || 0) * (stock.unitCost || 0)), 0
//                   );
//                   const totalQuantity = stocksWithQuantity.reduce((sum: number, stock: any) => 
//                     sum + (stock.remainingQuantity || 0), 0
//                   );
                  
//                   price = totalQuantity > 0 ? (totalValue / totalQuantity) : 0;
//                 }
//               }
              
//               // If no FIFO price found, try legacy unitCost
//               if (price === 0) {
//                 price = Number((matchingMaterial as any).unitCost) || 0;
//               }
//             }
//           }
          
//           // Calculate cost: price * quantity
//           const mrsMaterialCost = quantity * price; // This is the value that appears in the "Cost (₹)" column of the table
          
//           console.log(`💰 MRS Cost calculated: ${mrs.item} = ${quantity} × ${price} = ${mrsMaterialCost}`);
          
//           // Add to material cost if we have valid values
//           if (mrsMaterialCost > 0) {
//             detailedMaterialCost += mrsMaterialCost; // Using detailedMaterialCost
//             mrsTotalCost += mrsMaterialCost;
//             mrsItemsProcessed++;
//           }
//         }
//       });
      
//       console.log(`📊 MRS Summary: ${mrsItemsProcessed} items processed, Total MRS cost: ₹${mrsTotalCost}`);
//     }


//     // ⭐️ COMBINE FOR FINAL TOTALS
//     const fullMaterialCost = resourceMaterialCost + detailedMaterialCost;
//     const calculatedTotal = fullMaterialCost + labourCost + equipmentCost + otherCost;
    
//     console.log('💰 Dynamic Cost Calculation Used:');
//     console.log(`Calculated Full Material Cost: ₹${fullMaterialCost.toLocaleString()}`);
//     console.log(`Calculated Detailed Material Cost (WBS/MRS): ₹${detailedMaterialCost.toLocaleString()}`);
//     console.log(`Calculated Total Cost: ₹${calculatedTotal.toLocaleString()}`);

//     return {
//       material: fullMaterialCost,      // Full cost for overall Actual Cost
//       detailedMaterial: detailedMaterialCost, // ⭐️ Detailed cost for the Summary Card
//       labour: labourCost,
//       equipment: equipmentCost,
//       other: otherCost,
//       total: calculatedTotal,         // Full total
//     };
//   }, [resources, wbs, rawMaterials, mrsList, selectedProjectId, isDataLoading]);

//   // Variance Calculation
//   const variance = costs.total - totalPlannedBudget;
//   const isOverBudget = variance > 0;
//   const variancePercent = totalPlannedBudget
//     ? (variance / totalPlannedBudget) * 100
//     : 0;

//   // --- Chart Data ---

//   const overviewBarData = [
//     {
//       name: "Project Costs",
//       Planned: totalPlannedBudget,
//       Actual: costs.total,
//     },
//   ];
  
//   // Use the full material cost for chart breakdown
//   const breakdownData = [
//     { name: "Material", value: costs.material, color: "#3b82f6" }, 
//     { name: "Labour", value: costs.labour, color: "#22c55e" },   
//     { name: "Equipment", value: costs.equipment, color: "#f59e0b" },
//     { name: "Other", value: costs.other, color: "#94a3b8" }, 
//   ].filter((d) => d.value > 0);

//   if (!canView) {
//     return (
//       <div className="text-center py-12 px-4">
//         <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
//         <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 p-4 md:p-6">
//       {/* Header Section */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h2 className="text-3xl font-bold tracking-tight text-foreground">
//             Budget & Cost Control
//           </h2>
//           <p className="text-muted-foreground">
//             Integrated cost tracking: WBS (Unique Labour, Material w/ Unit Cost) + Resources.
//           </p>
//         </div>

//         <div className="flex gap-3 items-center">
//           <div className="w-full md:w-64">
//             <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select project" />
//               </SelectTrigger>
//               <SelectContent>
//                 {projects.map((project: any) => (
//                   <SelectItem key={project._id} value={project._id}>
//                     {project.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
          


//         </div>
//       </div>

//       {/* Alerts */}
//       {isOverBudget && (
//         <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
//           <BadgeAlert className="h-4 w-4" />
//           <AlertTitle>Budget Overrun Alert</AlertTitle>
//           <AlertDescription>
//             Actual costs (₹{costs.total.toLocaleString()}) exceeded the
//             planned budget (₹{totalPlannedBudget.toLocaleString()}) by{" "}
//             {variancePercent.toFixed(1)}%.
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <Card className="border-l-4 border-l-blue-500">
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Planned Budget
//             </CardTitle>
//             <Briefcase className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               ₹{totalPlannedBudget.toLocaleString()}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Target Budget
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Material</CardTitle>
//             <Package className="h-4 w-4 text-blue-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               ₹{costs.detailedMaterial.toLocaleString()} {/* ⭐️ CHANGED to use detailedMaterial */}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Qty * Unit Cost (WBS & MRS Items)
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Labour</CardTitle>
//             <Users className="h-4 w-4 text-green-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               ₹{costs.labour.toLocaleString()}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Unique Assignments (Monthly/Basic)
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
//             <Truck className="h-4 w-4 text-amber-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               ₹{costs.equipment.toLocaleString()}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Resource Allocation
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <Card className="lg:col-span-2">
//           <CardHeader>
//             <CardTitle>Budget Variance Analysis</CardTitle>
//           </CardHeader>
//           <CardContent className="h-[300px]">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 data={overviewBarData}
//                 layout="vertical"
//                 margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//               >
//                 <CartesianGrid strokeDasharray="3 3" horizontal={false} />
//                 <XAxis type="number" hide />
//                 <YAxis
//                   dataKey="name"
//                   type="category"
//                   axisLine={false}
//                   tickLine={false}
//                   width={100}
//                 />
//                 <Tooltip
//                   formatter={(value: number) => `₹${value.toLocaleString()}`}
//                   cursor={{ fill: "transparent" }}
//                 />
//                 <Legend />
//                 <Bar
//                   dataKey="Planned"
//                   fill="#94a3b8"
//                   name="Planned Budget"
//                   radius={[0, 4, 4, 0]}
//                   barSize={40}
//                 />
//                 <Bar
//                   dataKey="Actual"
//                   fill={isOverBudget ? "#ef4444" : "#3b82f6"}
//                   name="Total Actual Cost"
//                   radius={[0, 4, 4, 0]}
//                   barSize={40}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>

//         <Card className="lg:col-span-1">
//           <CardHeader>
//             <CardTitle>Actual Cost Breakdown</CardTitle>
//           </CardHeader>
//           <CardContent className="h-[300px] flex flex-col items-center justify-center">
//             {breakdownData.length > 0 ? (
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={breakdownData}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={60}
//                     outerRadius={80}
//                     paddingAngle={5}
//                     dataKey="value"
//                   >
//                     {breakdownData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                   <Tooltip
//                     formatter={(value: number) => `₹${value.toLocaleString()}`}
//                   />
//                   <Legend />
//                 </PieChart>
//               </ResponsiveContainer>
//             ) : (
//               <div className="text-center text-muted-foreground">
//                 No cost data available yet.
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Aggregated Cost Table */}
//       <Card>
//         <CardHeader className="flex flex-row items-center justify-between">
//           <CardTitle>Consolidated Cost Items</CardTitle>
//           <Badge variant="secondary">
//              Total: ₹{costs.total.toLocaleString()}
//           </Badge>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Category</TableHead>
//                 <TableHead>Name / Description</TableHead>
//                 <TableHead className="text-right">Cost (₹)</TableHead>
//                 <TableHead>Details</TableHead>
//                 <TableHead></TableHead> {/* ⭐️ 5th column for FIFO Debug */}
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {(wbsLoading || resourcesLoading || materialsLoading || mrsLoading) && (
//                  <TableRow>
//                    <TableCell colSpan={5} className="text-center py-8">Calculating costs...</TableCell>
//                  </TableRow>
//               )}

//               {/* 1. Resources (Material, Equipment, Manpower, Other) */}
//               {resources.map(res => (
//                 <TableRow key={`res-${res._id}`}>
//                   <TableCell className="capitalize">{res.resourceType}</TableCell>
//                   <TableCell>{res.resourceName} (Allocation)</TableCell>
//                   <TableCell className="text-right">₹{Number(res.totalCost).toLocaleString()}</TableCell>
//                   <TableCell className="text-muted-foreground text-sm">Resource Slice</TableCell>
//                   <TableCell>
//                     <span className="text-xs text-gray-500">N/A (Resource)</span>
//                   </TableCell>
//                 </TableRow>
//               ))}

//               {/* 2. Unique Labour (Category: Labour) */}
//               {(() => {
//                  const displayedPersons = new Set();
//                  return wbs.flatMap((item: any) => 
//                    (item.assignedPersons || []).map((p: any) => {
//                       if (displayedPersons.has(p.resourceId)) return null;
//                       displayedPersons.add(p.resourceId);

//                       const financial = p.financial || {};
//                       let cost = 0;
//                       if (p.type === "labour") cost = Number(financial.monthlyRate) || 0;
//                       else if (p.type === "employee") cost = Number(financial.basicPay) || 0;
//                       else cost = Number(financial.cost) || 0;

//                       // Display row even if cost is 0 to show all selected persons
//                       return (
//                         <TableRow key={`person-${p.resourceId}`}>
//                           <TableCell className="capitalize">{p.type}</TableCell>
//                           <TableCell>
//                             {p.personalInfo?.firstName && p.personalInfo?.lastName 
//                                 ? `${p.personalInfo.firstName} ${p.personalInfo.lastName}` 
//                                 : `ID: ${p.resourceId}`}
//                           </TableCell>
//                           <TableCell className="text-right">₹{cost.toLocaleString()}</TableCell>
//                           <TableCell className="text-muted-foreground text-sm">
//                             {p.type === "labour" ? "Monthly Rate" : "Basic Pay"}
//                           </TableCell>
//                           <TableCell>
//                             <span className="text-xs text-gray-500">N/A (Labour)</span> 
//                           </TableCell>
//                         </TableRow>
//                       );
//                    })
//                  );
//               })()}

//               {/* 3. WBS Linked Materials (Category: Material) */}
//               {wbs.flatMap((item: any) => 
//                 (item.linkedMaterials || []).map((m: any) => {
//                    const qty = Number(m.quantity) || 0;
                   
//                    // Check if materialId is populated object or just ID
//                    let materialData: any = null;
//                    let matId: string | null = null;
                   
//                    if (typeof m.materialId === 'object' && m.materialId !== null) {
//                      // Material is populated from backend
//                      materialData = m.materialId;
//                      matId = materialData._id;
//                    } else {
//                      // Material is just ID, find from rawMaterials array
//                      matId = m.materialId;
//                      materialData = rawMaterials.find((rm: any) => rm._id === matId);
//                    }
                   
//                    if (!materialData) return null;
                   
//                    let unitPrice = 0;
                   
//                    // 🚀 Use the same FIFO calculation as Raw Materials page
//                    const fifoBreakdown = getFifoBreakdown(materialData, qty);
//                    unitPrice = fifoBreakdown.avgCost; // Use the actual FIFO calculated cost
                   
//                    const totalCost = qty * unitPrice;
//                    const unit = materialData.unitOfMeasure || materialData.unit || m.unit || 'pcs';

//                    return (
//                     <TableRow key={`wbs-m-${item.id || item._id}-${m.materialId}`}>
//                       <TableCell>Material</TableCell>
//                       <TableCell>{materialData.name} (Qty: {qty} {unit})</TableCell>
//                       <TableCell className="text-right">₹{totalCost.toLocaleString()}</TableCell>
//                       <TableCell className="text-muted-foreground text-sm">
//                         @ ₹{unitPrice.toFixed(2)}/unit (WBS Linked)
//                       </TableCell>
//                       <TableCell>
//                         <details className="cursor-pointer">
//                           <summary className="text-xs text-blue-600 hover:text-blue-800">
//                             FIFO Debug ({fifoBreakdown.breakdown.length} batches)
//                           </summary>
//                           <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
//                             <div className="font-semibold">Material: {materialData.name}</div>
//                             <div>Used Quantity: {qty} {unit}</div>
//                             <div>Calculated Avg Cost: ₹{fifoBreakdown.avgCost.toFixed(2)}/unit</div>
//                             <div className="border-t pt-1 mt-2">
//                               <div className="font-medium">FIFO Breakdown:</div>
//                               {fifoBreakdown.breakdown.map((batch: any, idx: number) => (
//                                 <div key={idx} className="flex justify-between items-center py-1 border-b">
//                                   <span>{batch.batchRef}</span>
//                                   <span>{batch.usedQty}/{batch.availableQty} @ ₹{batch.unitCost}</span>
//                                   <span className="font-medium">₹{batch.totalCost.toFixed(2)}</span>
//                                 </div>
//                               ))}
//                               <div className="font-semibold pt-1 border-t">
//                                 Total: ₹{fifoBreakdown.totalCost.toFixed(2)}
//                               </div>
//                             </div>
//                           </div>
//                         </details>
//                       </TableCell>
//                     </TableRow>
//                    );
//                 })
//               )}

//               {/* 4. MRS Materials from WBS Tasks (Category: Material) */}
//               {selectedProjectId && mrsList && mrsList.length > 0 && wbs.flatMap((wbsItem: any) => {
//                 // Get MRS materials for this specific WBS task
//                 const taskMRSMaterials = mrsList.filter((mrs: any) => {
//                   if (!mrs) return false;
//                   const mrsProjectId = String(mrs.projectId || '');
//                   const selectedId = String(selectedProjectId || '');
//                   const isForThisTask = mrs.task === wbsItem.name && !mrs.isDeleted;
//                   const isReceived = mrs.deliveryStatus === 'received' || mrs.status === 'received';
                  
//                   return mrsProjectId === selectedId && isForThisTask && isReceived;
//                 });

//                 return taskMRSMaterials.map((mrs: any) => {
//                   const originalQuantity = mrs.quantity || 1;
//                   const receivedQuantity = mrs.deliveryDetails?.receivedQuantity || originalQuantity;
//                   const returnedQuantity = mrs.deliveryDetails?.returnedQuantity || 0;
//                   const availableQuantity = receivedQuantity - returnedQuantity;
                  
//                   let price = Number(mrs.price) || 0;
                  
//                   const matchingMaterial = rawMaterials.find((rm: any) => 
//                     rm.name.toLowerCase() === (mrs.item || '').toLowerCase()
//                   );
//                   let fifoBreakdown = matchingMaterial ? getFifoBreakdown(matchingMaterial, availableQuantity) : null;
                  
//                   // Use FIFO calculated price if available, otherwise use MRS price
//                   if (fifoBreakdown && fifoBreakdown.hasStocks) {
//                     price = fifoBreakdown.avgCost;
//                   } else if (price === 0 && matchingMaterial) {
//                      // Fallback to legacy unit cost if no FIFO stocks and price is 0
//                      price = Number((matchingMaterial as any).unitCost) || 0;
//                   }
                  
//                   const mrsCost = availableQuantity * price;
                  
//                   // Only show materials with available quantity > 0
//                   if (availableQuantity <= 0) return null;
                  
//                   return (
//                     <TableRow key={`mrs-${mrs._id || mrs.id}`}>
//                       <TableCell>Material</TableCell>
//                       <TableCell>
//                         {mrs.item || "Unknown Item"} (Qty: {availableQuantity})
//                         <div className="text-xs text-muted-foreground">
//                           Task: {wbsItem.name}
//                         </div>
//                       </TableCell>
//                       <TableCell className="text-right">₹{mrsCost.toLocaleString()}</TableCell>
//                       <TableCell className="text-muted-foreground text-sm">
//                         @ ₹{price.toFixed(2)}/unit (Manual MRS)
//                       </TableCell>
//                       <TableCell> 
//                         {fifoBreakdown && fifoBreakdown.hasStocks ? (
//                           <details className="cursor-pointer">
//                             <summary className="text-xs text-blue-600 hover:text-blue-800">
//                               FIFO Debug ({fifoBreakdown.breakdown.length} batches)
//                             </summary>
//                             <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
//                               <div className="font-semibold">Material: {matchingMaterial.name}</div>
//                               <div>Used Quantity: {availableQuantity}</div>
//                               <div>Calculated Avg Cost: ₹{fifoBreakdown.avgCost.toFixed(2)}/unit</div>
//                               <div className="border-t pt-1 mt-2">
//                                 <div className="font-medium">FIFO Breakdown:</div>
//                                 {fifoBreakdown.breakdown.map((batch: any, idx: number) => (
//                                   <div key={idx} className="flex justify-between items-center py-1 border-b">
//                                     <span>{batch.batchRef}</span>
//                                     <span>{batch.usedQty}/{batch.availableQty} @ ₹{batch.unitCost}</span>
//                                     <span className="font-medium">₹{batch.totalCost.toFixed(2)}</span>
//                                   </div>
//                                 ))}
//                                 <div className="font-semibold pt-1 border-t">
//                                   Total: ₹{fifoBreakdown.totalCost.toFixed(2)}
//                                 </div>
//                               </div>
//                             </div>
//                           </details>
//                         ) : (
//                             <span className="text-xs text-gray-500">N/A (No FIFO Data)</span>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   );
//                 }).filter(Boolean);
//               })}

//               {!wbsLoading && !resourcesLoading && !materialsLoading && !mrsLoading && costs.total === 0 && (
//                  <TableRow>
//                     <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No cost data found.</TableCell>
//                  </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//         {/* ⭐️ NEW: Total Material Cost Display below the Table */}
//         <div className="flex justify-end p-4 border-t bg-gray-50/50">
//           <div className="flex flex-col items-end">
//             <div className="text-sm font-semibold text-blue-600">
//               Total Material Cost (WBS & MRS)
//             </div>
//             <div className="text-xl font-bold text-blue-800">
//               ₹{costs.detailedMaterial.toLocaleString()}
//             </div>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";

// Slices
import { fetchProjects } from "@/redux/slices/projectSlice";
import { fetchResources } from "@/redux/slices/resourceSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";
import { fetchMaterials } from "@/redux/slices/rawmaterialSlice";
import { fetchMRS } from "@/redux/slices/mrsSlice";

// UI Components
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
  BadgeAlert,
  Briefcase,
  Truck,
  Users,
  Package,
  ShieldAlert,
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
import { usePermission } from "@/hooks/userPermission";
import { fetchMasterData } from "@/redux/slices/masterDataSlice";

export default function BudgetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const organisationId = localStorage.getItem("organisationId") || "";

  const canView = usePermission('budgetCost', 'view');

  // --- Selectors ---
  const { projects } = useSelector((state: RootState) => state.projects);
  const { resources, loading: resourcesLoading } = useSelector(
    (state: RootState) => state.resources
  );
  const { wbs, loading: wbsLoading } = useSelector((state: RootState) => state.wbs);
  
  const { materials: rawMaterials, loading: materialsLoading } = useSelector(
    (state: RootState) => state.rawMaterials
  );
  const { list: mrsList, loading: mrsLoading } = useSelector(
    (state: RootState) => state.mrs
  );
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { locations } = useSelector((state: RootState) => state.masterData);

  // --- Local State ---
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState("all");

  const isLocationRestricted = 
    userProfile?.role !== 'admin' && 
    !!userProfile?.location;

  // --- Effects ---

  useEffect(() => {
    if (organisationId) {
      dispatch(fetchProjects({ page: 1, limit: 50 }));
      dispatch(fetchMaterials({ page: 1, limit: 1000 }));
      dispatch(fetchMRS());
      dispatch(fetchMasterData("location"));
    }
  }, [organisationId, dispatch]);

  useEffect(() => {
    if (isLocationRestricted && userProfile?.location) {
      setLocationFilter(userProfile.location);
    }
  }, [isLocationRestricted, userProfile]);

  const handleLocationFilterChange = (val: string) => {
    setLocationFilter(val);
  };

  useEffect(() => {
    dispatch(
      fetchProjects({
        page: 1,
        limit: 50,
        location: locationFilter,
      })
    );
  }, [locationFilter]);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId((projects[0] as any)._id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchResources(selectedProjectId as any));
      dispatch(fetchWbsByProject(selectedProjectId));
      dispatch(fetchMRS()); 
      dispatch(fetchMaterials({ page: 1, limit: 1000 }));
    }
  }, [selectedProjectId, dispatch]);

  // --- Derived Data & Calculations (Helper Functions) ---

  const selectedProject = useMemo(
    () => projects.find((p: any) => p._id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  // Helper function to calculate FIFO cost (UNCHANGED)
  const getAvgCost = (material: any) => {
    if (Array.isArray((material as any).stocks) && (material as any).stocks.length > 0) {
      const stocksWithQuantity = (material as any).stocks.filter((s: any) => s.remainingQuantity > 0);
      
      if (stocksWithQuantity.length === 0) return 0;
      
      const totalValue = stocksWithQuantity.reduce((sum: number, stock: any) => 
        sum + ((stock.remainingQuantity || 0) * (stock.unitCost || 0)), 0
      );
      const totalQuantity = stocksWithQuantity.reduce((sum: number, stock: any) => 
        sum + (stock.remainingQuantity || 0), 0
      );
      
      const avgCost = totalQuantity > 0 ? (totalValue / totalQuantity) : 0;
      return avgCost;
    }
    return (material as any).unitCost || 0;
  };

  // Helper function to get detailed FIFO breakdown for debugging (FIXED FALLBACK)
  const getFifoBreakdown = (material: any, usedQuantity: number) => {
    const defaultUnitCost = (material as any).unitCost || 0;
    
    if (!Array.isArray((material as any).stocks) || (material as any).stocks.length === 0) {
      return {
        breakdown: [],
        totalCost: usedQuantity * defaultUnitCost, // Use default cost for total if no stocks
        avgCost: defaultUnitCost,
        hasStocks: false
      };
    }

    const stocksWithQuantity = (material as any).stocks
      .filter((s: any) => s.remainingQuantity > 0)
      .sort((a: any, b: any) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()); // FIFO order

    let remainingToUse = usedQuantity;
    const breakdown: any[] = [];
    let totalCost = 0;

    for (const stock of stocksWithQuantity) {
      if (remainingToUse <= 0) break;
      
      const availableQty = stock.remainingQuantity || 0;
      const useFromThisStock = Math.min(remainingToUse, availableQty);
      const costFromThisStock = useFromThisStock * (stock.unitCost || 0);
      
      breakdown.push({
        date: stock.createdAt || stock.date || 'Unknown',
        availableQty,
        usedQty: useFromThisStock,
        unitCost: stock.unitCost || 0,
        totalCost: costFromThisStock,
        batchRef: stock.batchRef || stock.reference || `Batch-${stock._id?.slice(-4) || 'Unknown'}`
      });
      
      totalCost += costFromThisStock;
      remainingToUse -= useFromThisStock;
    }

    if (remainingToUse > 0) {
      // Use the material's default unit cost for any shortage/legacy stock
      breakdown.push({
        date: 'SHORTAGE/LEGACY',
        availableQty: 0,
        usedQty: remainingToUse,
        unitCost: defaultUnitCost,
        totalCost: remainingToUse * defaultUnitCost,
        batchRef: 'Legacy Stock/Shortage'
      });
      totalCost += remainingToUse * defaultUnitCost;
    }

    return {
      breakdown,
      totalCost,
      avgCost: usedQuantity > 0 ? totalCost / usedQuantity : defaultUnitCost,
      hasStocks: stocksWithQuantity.length > 0
    };
  };



  const totalPlannedBudget = (selectedProject as any)?.budget || 0;

  // Check if data is still loading
  const isDataLoading = wbsLoading || materialsLoading || mrsLoading || resourcesLoading;


  // --- CORE COST CALCULATION BLOCK ---
  const costs = useMemo(() => {
    
    // Dependencies: [resources, wbs, rawMaterials, mrsList, selectedProjectId, isDataLoading]
    
    if (isDataLoading) {
      return { material: 0, detailedMaterial: 0, labour: 0, equipment: 0, other: 0, total: 0 };
    }
    
    // resourceMaterialCost is for overall budget, NOT the visible table rows.
    let resourceMaterialCost = 0;   
    // ⭐️ detailedMaterialCost: SUM of visible Material rows (WBS Linked & MRS) - This is the value you want to match the table cost.
    let detailedMaterialCost = 0;   
    let labourCost = 0;
    let equipmentCost = 0;
    let otherCost = 0;

    // A. Calculate from Resources (Category: Material, Equipment, Labour, Other)
    resources.forEach((res) => {
      const cost = Number(res.totalCost) || 0;
      if (res.resourceType === "material") {
         resourceMaterialCost += cost; 
      } else if (res.resourceType === "manpower") {
         labourCost += cost;
      } else if (res.resourceType === "equipment" || res.resourceType === "machinery") {
        equipmentCost += cost;
      } else {
        otherCost += cost;
      }
    });

    // B. Calculate from WBS (Assigned Persons & Linked Materials)
    const processedPersonIds = new Set<string>();

    wbs.forEach((item: any) => {

      // 1. Assigned Persons (Labour) (UNCHANGED)
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

      // 2. Linked Materials (Category: Material) - ONLY count if qty > 0 
      if (item.linkedMaterials && Array.isArray(item.linkedMaterials)) {
        item.linkedMaterials.forEach((mat: any) => {
          const qty = Number(mat.quantity) || 0;
          
          // ⭐️ CRITICAL CHECK: Only count if quantity > 0 (to match visible table rows)
          if (qty > 0) { 
              let materialData: any = null;
              let matId: string | null = null;
              
              if (typeof mat.materialId === 'object' && mat.materialId !== null) {
                materialData = mat.materialId;
                matId = materialData._id;
              } else {
                matId = mat.materialId;
                materialData = rawMaterials.find((rm: any) => rm._id === matId);
              }
              
              if (materialData) {
                let unitPrice = 0;
                
                const materialFifoBreakdown = getFifoBreakdown(materialData, qty);
                unitPrice = materialFifoBreakdown.avgCost;
                
                const totalCost = qty * unitPrice; 
                detailedMaterialCost += totalCost; // Add to detailedMaterialCost (visible material)
              }
          }
        });
      }
    });

    // C. Calculate from MRS Items for selected project (MUST match the Rendering Logic)
    if (selectedProjectId && mrsList && Array.isArray(mrsList) && wbs.length > 0) {
      
        // ⭐️ Iterate through WBS tasks and filter MRS to match rendering
        wbs.forEach((wbsItem: any) => {
            const taskMRSMaterials = mrsList.filter((mrs: any) => {
              if (!mrs) return false;
              const mrsProjectId = String(mrs.projectId || '');
              const selectedId = String(selectedProjectId || '');
              // Rendering Match: must be for this project, not deleted, linked to this WBS task, and received
              const isForThisTask = mrs.task === wbsItem.name && !mrs.isDeleted;
              const isReceived = mrs.deliveryStatus === 'received' || mrs.status === 'received';
              
              return mrsProjectId === selectedId && isForThisTask && isReceived;
            });

            taskMRSMaterials.forEach((mrs: any) => {
              const originalQuantity = mrs.quantity || 1;
              const receivedQuantity = mrs.deliveryDetails?.receivedQuantity || originalQuantity;
              const returnedQuantity = mrs.deliveryDetails?.returnedQuantity || 0;
              const availableQuantity = receivedQuantity - returnedQuantity; // Use available quantity

              // ⭐️ CRITICAL CHECK: Only count if availableQuantity > 0 (to match visible table rows)
              if (availableQuantity <= 0) return; 

              let price = Number(mrs.price) || 0; // MRS Item's price

              // ⭐️ NEW/ADJUSTED LOGIC: Use mrs.price first. If it's zero, then look up FIFO/material cost.
              if (price === 0) {
                  const matchingMaterial = rawMaterials.find((rm: any) => 
                    rm.name.toLowerCase() === (mrs.item || '').toLowerCase()
                  );

                  if (matchingMaterial) {
                     // Try FIFO Avg cost
                     const materialFifoBreakdown = getFifoBreakdown(matchingMaterial, availableQuantity);
                     price = materialFifoBreakdown.avgCost; 
                  
                     // Fallback to the general unitCost if FIFO is still 0
                     if (price === 0) {
                       price = Number((matchingMaterial as any).unitCost) || 0;
                     }
                  } else {
                      // If no matching material and mrs.price is 0, price remains 0.
                      price = 0;
                  }
              }
              
              // ⭐️ Calculate cost: price * availableQuantity (This should match the rendered cost column)
              const mrsMaterialCost = availableQuantity * price; 
              
              // Add to detailed material cost
              if (mrsMaterialCost > 0) {
                detailedMaterialCost += mrsMaterialCost; // Add to detailedMaterialCost (visible material)
              }
            });
        });
    }


    // ⭐️ COMBINE FOR FINAL TOTALS
    // fullMaterialCost includes Resource Materials (A) + Detailed Materials (B.2 + C)
    const fullMaterialCost = resourceMaterialCost + detailedMaterialCost; 
    const calculatedTotal = fullMaterialCost + labourCost + equipmentCost + otherCost;
    
    return {
      material: fullMaterialCost,      
      detailedMaterial: detailedMaterialCost, // ⭐️ This is the required value (WBS + MRS visible material cost)
      labour: labourCost,
      equipment: equipmentCost,
      other: otherCost,
      total: calculatedTotal,         
    };
  }, [resources, wbs, rawMaterials, mrsList, selectedProjectId, isDataLoading]); // useMemo dependencies are correct here

  // Variance Calculation (UNCHANGED)
  const variance = costs.total - totalPlannedBudget;
  const isOverBudget = variance > 0;
  const variancePercent = totalPlannedBudget
    ? (variance / totalPlannedBudget) * 100
    : 0;

  const overviewBarData = [
    {
      name: "Project Costs",
      Planned: totalPlannedBudget,
      Actual: costs.total,
    },
  ];
  
  const breakdownData = [
    // Using fullMaterialCost for the breakdown chart, as it represents the total 'Material' cost slice
    { name: "Material", value: costs.material, color: "#3b82f6" }, 
    { name: "Labour", value: costs.labour, color: "#22c55e" },   
    { name: "Equipment", value: costs.equipment, color: "#f59e0b" },
    { name: "Other", value: costs.other, color: "#94a3b8" }, 
  ].filter((d) => d.value > 0);

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

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

        <div className="flex gap-3 items-center">
          <Select disabled={isLocationRestricted} value={locationFilter} onValueChange={handleLocationFilterChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc: any) => (
                <SelectItem key={loc._id} value={loc._id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-full md:w-64">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              {/* ⭐️ Using detailedMaterial which is the sum of visible table rows */}
              ₹{costs.detailedMaterial.toLocaleString()} 
            </div>
            <p className="text-xs text-muted-foreground">
              Qty * Unit Cost (WBS & MRS Items)
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(wbsLoading || resourcesLoading || materialsLoading || mrsLoading) && (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-8">Calculating costs...</TableCell>
                 </TableRow>
              )}

              {/* 1. Resources (Material, Equipment, Manpower, Other) - Only for overall Total, not Detailed Material Sum */}
              {resources.map(res => (
                <TableRow key={`res-${res._id}`}>
                  <TableCell className="capitalize">{res.resourceType}</TableCell>
                  <TableCell>{res.resourceName} (Allocation)</TableCell>
                  <TableCell className="text-right">₹{Number(res.totalCost).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Resource Slice</TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">N/A (Resource)</span>
                  </TableCell>
                </TableRow>
              ))}

              {/* 2. Unique Labour (Category: Labour) */}
              {(() => {
                 const displayedPersons = new Set();
                 return wbs.flatMap((item: any) => 
                   (item.assignedPersons || []).map((p: any) => {
                      if (displayedPersons.has(p.resourceId)) return null;
                      displayedPersons.add(p.resourceId);

                      const financial = p.financial || {};
                      let cost = 0;
                      if (p.type === "labour") cost = Number(financial.monthlyRate) || 0;
                      else if (p.type === "employee") cost = Number(financial.basicPay) || 0;
                      else cost = Number(financial.cost) || 0;

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

              {/* 3. WBS Linked Materials (Category: Material) */}
              {wbs.flatMap((item: any) => 
                (item.linkedMaterials || []).map((m: any) => {
                   const qty = Number(m.quantity) || 0;
                   
                   if (qty <= 0) return null; // Render only if quantity > 0
                   
                   let materialData: any = null;
                   let matId: string | null = null;
                   
                   if (typeof m.materialId === 'object' && m.materialId !== null) {
                     materialData = m.materialId;
                     matId = materialData._id;
                   } else {
                     matId = m.materialId;
                     materialData = rawMaterials.find((rm: any) => rm._id === matId);
                   }
                   
                   if (!materialData) return null;
                   
                   let unitPrice = 0;
                   const fifoBreakdown = getFifoBreakdown(materialData, qty);
                   unitPrice = fifoBreakdown.avgCost; 
                   
                   const totalCost = qty * unitPrice;
                   const unit = materialData.unitOfMeasure || materialData.unit || m.unit || 'pcs';

                   return (
                    <TableRow key={`wbs-m-${item.id || item._id}-${m.materialId}`}>
                      <TableCell>Material</TableCell>
                      <TableCell>{materialData.name} (Qty: {qty} {unit})</TableCell>
                      <TableCell className="text-right">₹{totalCost.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        @ ₹{unitPrice.toFixed(2)}/unit (WBS Linked)
                      </TableCell>
                      <TableCell>
                        <details className="cursor-pointer">
                          <summary className="text-xs text-blue-600 hover:text-blue-800">
                            FIFO Debug ({fifoBreakdown.breakdown.length} batches)
                          </summary>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
                            <div className="font-semibold">Material: {materialData.name}</div>
                            <div>Used Quantity: {qty} {unit}</div>
                            <div>Calculated Avg Cost: ₹{fifoBreakdown.avgCost.toFixed(2)}/unit</div>
                            <div className="border-t pt-1 mt-2">
                              <div className="font-medium">FIFO Breakdown:</div>
                              {fifoBreakdown.breakdown.map((batch: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-1 border-b">
                                  <span>{batch.batchRef}</span>
                                  <span>{batch.usedQty}/{batch.availableQty} @ ₹{batch.unitCost}</span>
                                  <span className="font-medium">₹{batch.totalCost.toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="font-semibold pt-1 border-t">
                                Total: ₹{fifoBreakdown.totalCost.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </details>
                      </TableCell>
                    </TableRow>
                   );
                })
              )}

              {/* 4. MRS Materials from WBS Tasks (Category: Material) */}
              {selectedProjectId && mrsList && mrsList.length > 0 && wbs.flatMap((wbsItem: any) => {
                // MATCHES CALCULATION LOGIC
                const taskMRSMaterials = mrsList.filter((mrs: any) => {
                  if (!mrs) return false;
                  const mrsProjectId = String(mrs.projectId || '');
                  const selectedId = String(selectedProjectId || '');
                  const isForThisTask = mrs.task === wbsItem.name && !mrs.isDeleted;
                  const isReceived = mrs.deliveryStatus === 'received' || mrs.status === 'received';
                  
                  return mrsProjectId === selectedId && isForThisTask && isReceived;
                });

                return taskMRSMaterials.map((mrs: any) => {
                  const originalQuantity = mrs.quantity || 1;
                  const receivedQuantity = mrs.deliveryDetails?.receivedQuantity || originalQuantity;
                  const returnedQuantity = mrs.deliveryDetails?.returnedQuantity || 0;
                  const availableQuantity = receivedQuantity - returnedQuantity;
                  
                  // ⭐️ PRICE DETERMINATION LOGIC
                  let price = Number(mrs.price) || 0; // MRS Item's price (PRIORITY 1)
                  
                  const matchingMaterial = rawMaterials.find((rm: any) => 
                    rm.name.toLowerCase() === (mrs.item || '').toLowerCase()
                  );
                  let fifoBreakdown = null;

                  // If MRS price is 0, try FIFO/material cost
                  if (price === 0 && matchingMaterial) {
                        fifoBreakdown = getFifoBreakdown(matchingMaterial, availableQuantity);
                        if (fifoBreakdown.avgCost > 0) {
                           price = fifoBreakdown.avgCost; // PRIORITY 2: FIFO AVG COST
                        }
                    
                        // Fallback to the general unitCost if price is still 0
                        if (price === 0) {
                            price = Number((matchingMaterial as any).unitCost) || 0; // PRIORITY 3: MATERIAL UNIT COST
                        }
                  } else if (price === 0) {
                    // If no matching raw material found and mrs.price is 0, price remains 0.
                    price = 0;
                  }
                  
                  const mrsCost = availableQuantity * price;
                  
                  // Render only if available quantity > 0
                  if (availableQuantity <= 0) return null;
                  
                  // Re-calculate FIFO Breakdown for debug display if price was determined by FIFO
                  if (!fifoBreakdown && matchingMaterial) {
                     fifoBreakdown = getFifoBreakdown(matchingMaterial, availableQuantity);
                  }


                  return (
                    <TableRow key={`mrs-${mrs._id || mrs.id}`}>
                      <TableCell>Material</TableCell>
                      <TableCell>
                        {mrs.item || "Unknown Item"} (Qty: {availableQuantity})
                        <div className="text-xs text-muted-foreground">
                          Task: {wbsItem.name}
                        </div>
                      </TableCell>
                      {/* ⭐️ Table Cell: This value must be calculated in useMemo */}
                      <TableCell className="text-right">₹{mrsCost.toLocaleString()}</TableCell> 
                      <TableCell className="text-muted-foreground text-sm">
                        @ ₹{price.toFixed(2)}/unit (Manual MRS)
                      </TableCell>
                     
                    </TableRow>
                  );
                }).filter(Boolean);
              })}

              {!wbsLoading && !resourcesLoading && !materialsLoading && !mrsLoading && costs.total === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No cost data found.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* ⭐️ Total Material Cost Display below the Table */}
        
      </Card>
    </div>
  );
}