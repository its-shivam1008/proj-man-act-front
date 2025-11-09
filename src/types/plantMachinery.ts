// Plant & Machinery Management Types

export interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  model: string;
  manufacturer: string;
  supplier: string;
  serialNumber: string;
  assetNumber: string;
  category: 'heavy-machinery' | 'light-machinery' | 'tools' | 'vehicles' | 'equipment';
  type: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiry: string;
  location: string;
  department: string;
  project?: string;
  operatingCapacity: string;
  specifications: string;
  maintenanceFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  depreciationMethod: 'straight-line' | 'wdv';
  depreciationRate: number;
  currentValue: number;
  insurance: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  status: 'operational' | 'under-maintenance' | 'breakdown' | 'idle' | 'disposed';
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentAllocation {
  id: string;
  equipmentId: string;
  equipmentName: string;
  allocationType: 'project' | 'department' | 'production-line';
  allocatedTo: string;
  operator: string;
  shift: 'day' | 'night' | 'rotating';
  startDate: string;
  endDate?: string;
  workingHours: number;
  idleHours: number;
  fuelConsumption: number;
  powerConsumption: number;
  meterReading: number;
  status: 'active' | 'completed' | 'cancelled';
  remarks: string;
  createdAt: string;
}

export interface PreventiveMaintenance {
  id: string;
  equipmentId: string;
  equipmentName: string;
  maintenanceType: 'time-based' | 'usage-based' | 'condition-based';
  frequency: string;
  intervalHours?: number;
  intervalDays?: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  assignedTechnician: string;
  estimatedDuration: number;
  checklist: {
    item: string;
    completed: boolean;
  }[];
  spareParts: {
    partName: string;
    quantity: number;
    cost: number;
  }[];
  totalCost: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  completionDate?: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface BreakdownMaintenance {
  id: string;
  equipmentId: string;
  equipmentName: string;
  reportedBy: string;
  reportedDate: string;
  breakdownType: 'mechanical' | 'electrical' | 'hydraulic' | 'electronic' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  symptoms: string;
  assignedTechnician: string;
  diagnosisDate?: string;
  diagnosis: string;
  repairStartDate?: string;
  repairEndDate?: string;
  downtime: number;
  spareParts: {
    partName: string;
    partCode: string;
    quantity: number;
    cost: number;
  }[];
  labourCost: number;
  totalCost: number;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  status: 'reported' | 'diagnosed' | 'in-repair' | 'testing' | 'completed';
  attachments: string[];
  mtbf?: number;
  mttr?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SparePart {
  id: string;
  partCode: string;
  partName: string;
  category: string;
  compatibleEquipment: string[];
  supplier: string;
  unitPrice: number;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
  reorderQuantity: number;
  unit: string;
  location: string;
  isCritical: boolean;
  leadTime: number;
  lastPurchaseDate?: string;
  totalConsumption: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'on-order';
  createdAt: string;
  updatedAt: string;
}

export interface SparePartTransaction {
  id: string;
  partId: string;
  partName: string;
  transactionType: 'issue' | 'return' | 'purchase' | 'adjustment';
  equipmentId?: string;
  maintenanceId?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  issuedTo?: string;
  issuedBy: string;
  transactionDate: string;
  remarks: string;
  createdAt: string;
}

export interface FuelLubricant {
  id: string;
  equipmentId: string;
  equipmentName: string;
  fuelType: 'diesel' | 'petrol' | 'electric' | 'lpg' | 'cng';
  lubricantType?: string;
  fuelQuantity: number;
  lubricantQuantity?: number;
  fuelCost: number;
  lubricantCost?: number;
  totalCost: number;
  meterReading: number;
  previousReading: number;
  efficiency: number;
  filledBy: string;
  filledDate: string;
  shift: string;
  supplier: string;
  remarks: string;
  createdAt: string;
}

export interface CalibrationSafety {
  id: string;
  equipmentId: string;
  equipmentName: string;
  certificationType: 'calibration' | 'safety-inspection' | 'load-test' | 'pressure-test' | 'other';
  certificateNumber: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  nextDueDate: string;
  inspectionAgency: string;
  result: 'pass' | 'fail' | 'conditional';
  findings: string;
  recommendations: string;
  cost: number;
  operatorTraining: {
    operatorName: string;
    licenseNumber: string;
    validUntil: string;
  }[];
  status: 'valid' | 'expiring-soon' | 'expired' | 'pending';
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentCosting {
  id: string;
  equipmentId: string;
  equipmentName: string;
  period: string;
  purchaseCost: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  operationCost: {
    fuelCost: number;
    powerCost: number;
    labourCost: number;
  };
  maintenanceCost: {
    preventiveCost: number;
    breakdownCost: number;
    sparesPartsCost: number;
  };
  downtimeCost: number;
  insuranceCost: number;
  otherCosts: number;
  totalCost: number;
  workingHours: number;
  costPerHour: number;
  revenue?: number;
  profitability?: number;
  roi?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentDisposal {
  id: string;
  equipmentId: string;
  equipmentName: string;
  disposalType: 'sale' | 'scrap' | 'transfer' | 'donation' | 'write-off';
  disposalDate: string;
  reason: string;
  bookValue: number;
  disposalValue: number;
  gainLoss: number;
  buyer?: string;
  transferredTo?: string;
  approvedBy: string;
  approvalDate: string;
  documents: string[];
  lifetimeData: {
    totalWorkingHours: number;
    totalMaintenanceCount: number;
    totalBreakdownCount: number;
    totalCost: number;
    totalRevenue?: number;
  };
  status: 'pending' | 'approved' | 'completed';
  createdAt: string;
}

export interface EquipmentReport {
  equipmentId: string;
  equipmentName: string;
  utilization: {
    workingHours: number;
    idleHours: number;
    downtimeHours: number;
    utilizationPercent: number;
    downtimePercent: number;
  };
  maintenance: {
    preventiveCount: number;
    breakdownCount: number;
    totalMaintenanceCost: number;
    mtbf: number;
    mttr: number;
    pmCompliance: number;
  };
  costs: {
    operationCost: number;
    maintenanceCost: number;
    totalCost: number;
    costPerHour: number;
  };
  efficiency: {
    fuelEfficiency: number;
    oee: number;
  };
  status: 'excellent' | 'good' | 'average' | 'poor';
}
