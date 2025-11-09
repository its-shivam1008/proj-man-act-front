// types/erpModels.ts

// ============================================================================
// 🏗 PROJECT MANAGEMENT ENTITIES
// ============================================================================

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  type: "construction" | "infrastructure" | "renovation" | "other";
  location: string;
  budget: number;
  startDate: string;
  endDate: string;
  manager: string;
  status: "planning" | "active" | "on-hold" | "completed" | "cancelled";
  progress: number;
  actualCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface WBSItem {
  id: string;
  projectId: string;
  parentId?: string;
  name: string;
  description: string;
  type: "phase" | "activity" | "task";
  startDate: string;
  endDate: string;
  duration: number;
  assignedTeam: string[];
  plannedCost: number;
  actualCost: number;
  progress: number;
  status: "not-started" | "in-progress" | "completed" | "delayed";
  dependencies: string[];
  createdAt: string;
}

export interface Resource {
  id: string;
  projectId: string;
  wbsItemId?: string;
  type: "labour" | "equipment" | "material";
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  totalCost: number;
  availability: "available" | "booked" | "unavailable";
  assignedDate?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  projectId: string;
  category: "material" | "labour" | "equipment" | "overhead" | "other";
  description: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  status: "within-budget" | "over-budget" | "critical";
  createdAt: string;
  updatedAt: string;
}

export interface ProgressUpdate {
  id: string;
  projectId: string;
  wbsItemId: string;
  date: string;
  percentComplete: number;
  materialUsed: { name: string; quantity: number; unit: string }[];
  labourHours: number;
  equipmentHours: number;
  remarks: string;
  photos?: string[];
  updatedBy: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
  value: number;
  percentValue: number;
  status: "pending" | "achieved" | "delayed";
  billingStatus: "not-billed" | "billed" | "paid";
  achievedDate?: string;
  createdAt: string;
}

// ============================================================================
// 🏭 MANUFACTURING & PRODUCTION ENTITIES
// ============================================================================

export interface BOMItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
}

export interface BOM {
  id: string;
  productId: string;
  productName: string;
  items: BOMItem[];
  version: string;
  status: "active" | "inactive" | "draft";
  createdAt: string;
  updatedAt: string;
}

export interface RoutingStep {
  id: string;
  sequence: number;
  operation: string;
  workCenterId: string;
  workCenterName: string;
  standardTime: number; // in minutes
  description: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: "planned" | "in-progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  routing: RoutingStep[];
  producedQuantity: number;
  rejectedQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  description: string;
  capacity: number; // hours per day
  costPerHour: number;
  efficiency: number; // percentage
  status: "active" | "maintenance" | "inactive";
  shift: "single" | "double" | "triple";
  operatorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialIssue {
  id: string;
  issueNumber: string;
  workOrderId: string;
  workOrderNumber: string;
  materialId: string;
  materialName: string;
  plannedQuantity: number;
  issuedQuantity: number;
  unit: string;
  issuedBy: string;
  issuedDate: string;
  status: "issued" | "backflushed" | "returned";
  notes?: string;
  createdAt: string;
}

export interface QualityCheck {
  id: string;
  checkNumber: string;
  workOrderId: string;
  workOrderNumber: string;
  inspectionType: "in-process" | "final" | "material";
  parameter: string;
  standardValue: string;
  actualValue: string;
  result: "pass" | "fail" | "pending";
  inspectedBy: string;
  inspectedDate: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  standardCost: number;
  createdAt: string;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  unitCost: number;
  createdAt: string;
}

// ============================================================================
// 📊 ANALYTICS & PERFORMANCE
// ============================================================================

export interface KPI {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "stable";
  type: "success" | "warning" | "danger" | "info";
}
