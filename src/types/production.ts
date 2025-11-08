
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
  status: 'active' | 'inactive' | 'draft';
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
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
  status: 'active' | 'maintenance' | 'inactive';
  shift: 'single' | 'double' | 'triple';
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
  status: 'issued' | 'backflushed' | 'returned';
  notes?: string;
  createdAt: string;
}

export interface QualityCheck {
  id: string;
  checkNumber: string;
  workOrderId: string;
  workOrderNumber: string;
  inspectionType: 'in-process' | 'final' | 'material';
  parameter: string;
  standardValue: string;
  actualValue: string;
  result: 'pass' | 'fail' | 'pending';
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

export interface KPI {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  type: 'success' | 'warning' | 'danger' | 'info';
}
