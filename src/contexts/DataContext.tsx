import React, { createContext, useContext, useState, useEffect } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  location: string;
  category: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
  unitCost: number;
  barcode?: string;
  productType: 'goods' | 'services' | 'combo';
  trackInventory: boolean;
  salesPrice: number;
  salesTax: number;
  costPrice: number;
  purchaseTax: number;
  referenceCode: string;
  upsellSuggestion?: string;
}

interface Receipt {
  id: string;
  receiveFrom: string;
  operationType: string;
  products: Array<{ productId: string; quantity: number; location: string }>;
  scheduledDate: string;
  status: 'draft' | 'in-progress' | 'done' | 'cancelled';
  barcodeScan?: string;
}

interface Delivery {
  id: string;
  deliverTo: string;
  operationType: string;
  products: Array<{ productId: string; quantity: number }>;
  shippingMethod: string;
  priority: 'low' | 'medium' | 'high';
  scheduledDate: string;
  status: 'draft' | 'ready' | 'in-transit' | 'delivered' | 'cancelled';
}

interface ScrapOrder {
  id: string;
  productId: string;
  quantity: number;
  reason: 'damaged' | 'expired' | 'lost' | 'obsolete';
  remark: string;
  scrapLocation: string;
  date: string;
  status: 'pending' | 'approved' | 'completed';
}

interface ForecastItem {
  id: string;
  productId: string;
  currentStock: number;
  demandForecast: number;
  suggestedReplenishment: number;
  replenishmentRule: 'manual' | 'automatic';
  leadTime: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface StockMove {
  id: string;
  date: string;
  reference: string;
  productId: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  operationType: 'receipt' | 'delivery' | 'internal' | 'scrap' | 'adjustment';
  status: 'draft' | 'confirmed' | 'done' | 'cancelled';
}

interface ManufacturingOrder {
  id: string;
  productName: string;
  quantity: number;
  status: 'draft' | 'confirmed' | 'in-progress' | 'done' | 'cancelled';
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high';
  bomId?: string;
  workCenter?: string;
  responsiblePerson?: string;
  location?: string;
  materialAvailability?: 'available' | 'partial' | 'unavailable';
  progress?: number;
}

interface MaintenanceRecord {
  id: string;
  requestTitle: string;
  equipment: string;
  equipmentId: string;
  type: 'preventive' | 'corrective' | 'emergency';
  requestDate: string;
  scheduledDate: string;
  deadlineDate: string;
  maintenanceTeam: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  technician: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'mechanical' | 'electrical' | 'software' | 'hydraulic' | 'pneumatic';
  attachments: string[];
  linkedOrder?: string;
  estimatedDuration: number;
  actualDuration?: number;
  cost?: number;
  spareParts: Array<{
    partId: string;
    quantity: number;
    cost: number;
  }>;
  notes: string;
}

interface Equipment {
  id: string;
  name: string;
  equipmentId: string;
  category: 'machine' | 'tools' | 'vehicles' | 'infrastructure';
  location: string;
  department: string;
  responsibleTechnician: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  purchaseDate: string;
  cost: number;
  warrantyExpiry: string;
  maintenanceFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  nextPreventiveMaintenance: string;
  totalDowntime: number;
  barcode: string;
  status: 'active' | 'under-maintenance' | 'retired' | 'out-of-order';
  specifications: Record<string, string>;
  manuals: string[];
  maintenanceHistory: string[];
}

interface PreventiveMaintenancePlan {
  id: string;
  planName: string;
  equipmentId: string;
  maintenanceTeam: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  customFrequencyDays?: number;
  nextExecutionDate: string;
  repeatUntil?: string;
  tasksToPerform: string[];
  autoGenerateRequest: boolean;
  estimatedDuration: number;
  requiredSkills: string[];
  spareParts: Array<{
    partId: string;
    quantity: number;
  }>;
  isActive: boolean;
}

interface MaintenanceTeam {
  id: string;
  teamName: string;
  teamLead: string;
  members: Array<{
    technicianId: string;
    name: string;
    skills: string[];
    availability: 'available' | 'busy' | 'on-leave';
  }>;
  specializations: string[];
  workingHours: {
    start: string;
    end: string;
    workingDays: string[];
  };
  contactInfo: {
    email: string;
    phone: string;
  };
}

interface QualityCheck {
  id: string;
  checkId: string;
  product: string;
  batchNumber: string;
  relatedOperation: 'incoming' | 'manufacturing' | 'delivery' | 'storage';
  quantityChecked: number;
  testType: string;
  typeOfCheck: 'text' | 'measurement' | 'pass-fail' | 'picture';
  measurementValue?: number;
  result: 'pass' | 'fail' | 'pending';
  inspector: string;
  performedBy: string;
  date: string;
  notes: string;
  photoUpload?: string;
  status: 'draft' | 'passed' | 'failed';
  linkedControlPoint?: string;
}

interface QualityControlPoint {
  id: string;
  controlPointName: string;
  operationType: 'manufacturing' | 'reception' | 'delivery' | 'storage';
  product: string;
  qualityTeam: string;
  company: string;
  controlType: 'all-operations' | 'random' | 'periodic';
  frequency?: number;
  instruction: string;
  responsible: string;
  typeOfCheck: 'text' | 'measurement' | 'pass-fail' | 'picture';
  toleranceMin?: number;
  toleranceMax?: number;
  attachment?: string;
  active: boolean;
  createdDate: string;
}

interface QualityAlert {
  id: string;
  alertNumber: string;
  product: string;
  operation: 'reception' | 'manufacturing' | 'delivery' | 'storage';
  description: string;
  rootCause: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in-progress' | 'resolved' | 'cancelled';
  responsibleTeam: string;
  assignedTo: string;
  tags: string[];
  nextActionDate: string;
  attachments: string[];
  linkedCheck?: string;
  createdDate: string;
  resolvedDate?: string;
}

interface QualityTeam {
  id: string;
  teamName: string;
  teamLeader: string;
  assignedUsers: Array<{
    userId: string;
    name: string;
    role: string;
    availability: 'available' | 'busy' | 'on-leave';
  }>;
  relatedProducts: string[];
  department: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  isActive: boolean;
}

interface QualityTag {
  id: string;
  name: string;
  color: string;
  category: string;
  description: string;
}

interface ProductRevision {
  id: string;
  productName: string;
  version: string;
  changeType: 'minor' | 'major' | 'critical';
  description: string;
  status: 'draft' | 'review' | 'approved' | 'implemented';
  requestedBy: string;
  requestDate: string;
}

interface EngineeringChangeOrder {
  id: string;
  ecoNumber: string;
  type: 'bom' | 'document' | 'product-variant' | 'routing';
  product: string;
  bomRevision: {
    oldVersion: string;
    proposedVersion: string;
  };
  description: string;
  changeReason: 'design-improvement' | 'compliance' | 'defect' | 'cost-reduction' | 'customer-request';
  effectiveDate: string;
  stage: 'new' | 'under-review' | 'approved' | 'applied' | 'cancelled';
  documents: string[];
  requestedBy: string;
  approvalNeededFrom: string[];
  approvers: Array<{
    userId: string;
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    comments: string;
    date?: string;
  }>;
  finalStatus: 'pending' | 'approved' | 'rejected';
  notes: string;
  relatedManufacturingOrders: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  createdDate: string;
  lastModified: string;
}

interface BomVersion {
  id: string;
  bomNumber: string;
  product: string;
  version: string;
  createdBy: string;
  createdDate: string;
  components: Array<{
    componentId: string;
    componentName: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
  routing: Array<{
    stepNumber: number;
    operation: string;
    workCenter: string;
    duration: number;
  }>;
  ecoLinked?: string;
  status: 'active' | 'archived' | 'draft';
  notes: string;
}

interface ProductDocument {
  id: string;
  documentName: string;
  type: 'drawing' | 'specification' | 'certification' | 'manual' | 'cad' | 'other';
  linkedTo: {
    type: 'product' | 'bom' | 'eco';
    id: string;
  };
  uploadDate: string;
  uploadedBy: string;
  version: string;
  description: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  tags: string[];
}

interface EngineeringTeam {
  id: string;
  teamName: string;
  teamLead: string;
  members: Array<{
    userId: string;
    name: string;
    role: string;
    specialization: string[];
    availability: 'available' | 'busy' | 'on-leave';
  }>;
  productCategories: string[];
  defaultApprovers: string[];
  notificationsEnabled: boolean;
  contactInfo: {
    email: string;
    phone: string;
  };
}

interface EcoComment {
  id: string;
  ecoId: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
  mentions: string[];
  attachments: string[];
}
interface RepairOrder {
  id: string;
  item: string;
  issueDescription: string;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignedTechnician: string;
  createdDate: string;
  estimatedCompletion: string;
}

interface RepairOrderDetailed {
  id: string;
  productId: string;
  quantity: number;
  serialLotNumber?: string;
  customerName: string;
  repairType: 'warranty' | 'paid' | 'internal';
  issueDescription: string;
  rootCause: 'damage' | 'defect' | 'misuse' | 'unknown';
  requestedDate: string;
  expectedCompletion: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'confirmed' | 'under-repair' | 'testing' | 'done' | 'cancelled';
  assignedTechnician: string;
  responsibleTeam: string;
  location: string;
  sourceDocument?: string;
  attachments: string[];
  partsUsed: Array<{
    partId: string;
    partName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    stockLocation: string;
  }>;
  operations: Array<{
    description: string;
    technician: string;
    duration: number;
    rate: number;
    notes: string;
  }>;
  warrantyType: 'in-warranty' | 'extended' | 'expired';
  chargeable: boolean;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  invoiceGenerated: boolean;
  invoiceLink?: string;
  createdDate: string;
  completedDate?: string;
  notes: string;
}

interface RepairTeam {
  id: string;
  teamName: string;
  teamLead: string;
  members: Array<{
    technicianId: string;
    name: string;
    specialization: string[];
    hourlyRate: number;
    availability: 'available' | 'busy' | 'on-leave';
  }>;
  location: string;
  workingHours: {
    start: string;
    end: string;
    workingDays: string[];
  };
  contactInfo: {
    email: string;
    phone: string;
  };
}

interface RepairTemplate {
  id: string;
  templateName: string;
  productCategory: string;
  commonIssue: string;
  estimatedDuration: number;
  defaultParts: Array<{
    partId: string;
    quantity: number;
  }>;
  defaultOperations: Array<{
    description: string;
    estimatedDuration: number;
  }>;
  isActive: boolean;
}
interface DataContextType {
  inventory: InventoryItem[];
  receipts: Receipt[];
  deliveries: Delivery[];
  scrapOrders: ScrapOrder[];
  forecastItems: ForecastItem[];
  stockMoves: StockMove[];
  manufacturingOrders: ManufacturingOrder[];
  purchaseOrders: PurchaseOrder[];
  maintenanceRecords: MaintenanceRecord[];
  equipment: Equipment[];
  preventiveMaintenancePlans: PreventiveMaintenancePlan[];
  maintenanceTeams: MaintenanceTeam[];
  qualityChecks: QualityCheck[];
  qualityControlPoints: QualityControlPoint[];
  qualityAlerts: QualityAlert[];
  qualityTeams: QualityTeam[];
  qualityTags: QualityTag[];
  productRevisions: ProductRevision[];
  repairOrders: RepairOrder[];
  repairOrdersDetailed: RepairOrderDetailed[];
  repairTeams: RepairTeam[];
  repairTemplates: RepairTemplate[];
  engineeringChangeOrders: EngineeringChangeOrder[];
  bomVersions: BomVersion[];
  productDocuments: ProductDocument[];
  engineeringTeams: EngineeringTeam[];
  ecoComments: EcoComment[];
  updateInventory: (item: InventoryItem) => void;
  addInventoryItem: (item: InventoryItem) => void;
  addReceipt: (receipt: Receipt) => void;
  addDelivery: (delivery: Delivery) => void;
  addScrapOrder: (scrap: ScrapOrder) => void;
  addForecastItem: (forecast: ForecastItem) => void;
  addStockMove: (move: StockMove) => void;
  addManufacturingOrder: (order: ManufacturingOrder) => void;
  addPurchaseOrder: (order: PurchaseOrder) => void;
  addMaintenanceRecord: (record: MaintenanceRecord) => void;
  addEquipment: (equipment: Equipment) => void;
  addPreventiveMaintenancePlan: (plan: PreventiveMaintenancePlan) => void;
  addMaintenanceTeam: (team: MaintenanceTeam) => void;
  updateEquipment: (equipment: Equipment) => void;
  updateMaintenanceRecord: (record: MaintenanceRecord) => void;
  addQualityCheck: (check: QualityCheck) => void;
  updateQualityCheck: (check: QualityCheck) => void;
  addQualityControlPoint: (controlPoint: QualityControlPoint) => void;
  updateQualityControlPoint: (controlPoint: QualityControlPoint) => void;
  addQualityAlert: (alert: QualityAlert) => void;
  updateQualityAlert: (alert: QualityAlert) => void;
  addQualityTeam: (team: QualityTeam) => void;
  updateQualityTeam: (team: QualityTeam) => void;
  addQualityTag: (tag: QualityTag) => void;
  addProductRevision: (revision: ProductRevision) => void;
  addRepairOrder: (order: RepairOrder) => void;
  addRepairOrderDetailed: (order: RepairOrderDetailed) => void;
  updateRepairOrderDetailed: (order: RepairOrderDetailed) => void;
  addRepairTeam: (team: RepairTeam) => void;
  updateRepairTeam: (team: RepairTeam) => void;
  addRepairTemplate: (template: RepairTemplate) => void;
  updateRepairTemplate: (template: RepairTemplate) => void;
  addEngineeringChangeOrder: (eco: EngineeringChangeOrder) => void;
  updateEngineeringChangeOrder: (eco: EngineeringChangeOrder) => void;
  addBomVersion: (bom: BomVersion) => void;
  updateBomVersion: (bom: BomVersion) => void;
  addProductDocument: (document: ProductDocument) => void;
  addEngineeringTeam: (team: EngineeringTeam) => void;
  updateEngineeringTeam: (team: EngineeringTeam) => void;
  addEcoComment: (comment: EcoComment) => void;
  rfqs: RFQ[];
  purchaseAgreements: PurchaseAgreement[];
  vendors: Vendor[];
  addRfq: (rfq: RFQ) => void;
  addPurchaseAgreement: (agreement: PurchaseAgreement) => void;
  addVendor: (vendor: Vendor) => void;
}

interface RFQ {
  id: string;
  rfqNumber: string;
  vendors: string[];
  orderDate: string;
  currency: string;
  deliveryDate: string;
  paymentTerms: string;
  products: Array<{
    name: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    taxes: number;
  }>;
  notes: string;
  status: 'draft' | 'sent' | 'received' | 'confirmed';
  totalAmount: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  orderDate: string;
  purchaseAgreement?: string;
  deliveryAddress: string;
  warehouse: string;
  incoterms: string;
  deliveryMethod: string;
  scheduledDeliveryDate: string;
  products: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
    taxes: number;
    subtotal: number;
  }>;
  totalAmount: number;
  responsibleUser: string;
  status: 'draft' | 'confirmed' | 'waiting-for-delivery' | 'done';
  currency: string;
  paymentTerms: string;
}

interface PurchaseAgreement {
  id: string;
  agreementType: 'blanket-order' | 'call-for-tender';
  agreementReference: string;
  vendors: string[];
  products: Array<{
    product: string;
    quantity: number;
    price: number;
    uom: string;
  }>;
  validityPeriod: {
    start: string;
    end: string;
  };
  status: 'draft' | 'confirmed' | 'closed' | 'expired';
  totalValue: number;
  currency: string;
}

interface Vendor {
  id: string;
  vendorName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  currency: string;
  paymentTerms: string;
  productsSupplied: string[];
  vendorRating: number;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  notes: string;
  isActive: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Steel Plates',
      sku: 'SP-001',
      quantity: 250,
      minStock: 100,
      location: 'Warehouse A',
      category: 'Raw Materials',
      status: 'in-stock',
      lastUpdated: '2024-01-15',
      unitCost: 150.00,
      barcode: '1234567890123',
      productType: 'goods',
      trackInventory: true,
      salesPrice: 200.00,
      salesTax: 10,
      costPrice: 150.00,
      purchaseTax: 5,
      referenceCode: 'SP001',
      upsellSuggestion: 'Steel Rods'
    },
    {
      id: '2',
      name: 'Aluminum Rods',
      sku: 'AR-002',
      quantity: 45,
      minStock: 50,
      location: 'Warehouse B',
      category: 'Raw Materials',
      status: 'low-stock',
      lastUpdated: '2024-01-14',
      unitCost: 75.00,
      barcode: '1234567890124',
      productType: 'goods',
      trackInventory: true,
      salesPrice: 100.00,
      salesTax: 10,
      costPrice: 75.00,
      purchaseTax: 5,
      referenceCode: 'AR002'
    },
    {
      id: '3',
      name: 'Hydraulic Pumps',
      sku: 'HP-003',
      quantity: 0,
      minStock: 10,
      location: 'Warehouse C',
      category: 'Components',
      status: 'out-of-stock',
      lastUpdated: '2024-01-13',
      unitCost: 500.00,
      barcode: '1234567890125',
      productType: 'goods',
      trackInventory: true,
      salesPrice: 750.00,
      salesTax: 10,
      costPrice: 500.00,
      purchaseTax: 5,
      referenceCode: 'HP003'
    }
  ]);

  const [receipts, setReceipts] = useState<Receipt[]>([
    {
      id: 'REC-001',
      receiveFrom: 'Steel Corp Ltd',
      operationType: 'Purchase',
      products: [{ productId: '1', quantity: 500, location: 'Warehouse A' }],
      scheduledDate: '2024-01-22',
      status: 'in-progress'
    },
    {
      id: 'REC-002',
      receiveFrom: 'Aluminum Co',
      operationType: 'Purchase',
      products: [{ productId: '2', quantity: 200, location: 'Warehouse B' }],
      scheduledDate: '2024-01-25',
      status: 'draft'
    }
  ]);

  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: 'DEL-001',
      deliverTo: 'Customer ABC',
      operationType: 'Sale',
      products: [{ productId: '1', quantity: 50 }],
      shippingMethod: 'Standard',
      priority: 'medium',
      scheduledDate: '2024-01-20',
      status: 'ready'
    },
    {
      id: 'DEL-002',
      deliverTo: 'Customer XYZ',
      operationType: 'Sale',
      products: [{ productId: '2', quantity: 25 }],
      shippingMethod: 'Express',
      priority: 'high',
      scheduledDate: '2024-01-23',
      status: 'draft'
    }
  ]);

  const [scrapOrders, setScrapOrders] = useState<ScrapOrder[]>([
    {
      id: 'SCR-001',
      productId: '2',
      quantity: 5,
      reason: 'damaged',
      remark: 'Physical damage during transport',
      scrapLocation: 'Scrap Yard A',
      date: '2024-01-14',
      status: 'completed'
    }
  ]);

  const [forecastItems, setForecastItems] = useState<ForecastItem[]>([
    {
      id: 'FC-001',
      productId: '3',
      currentStock: 0,
      demandForecast: 15,
      suggestedReplenishment: 25,
      replenishmentRule: 'manual',
      leadTime: 7,
      priority: 'critical'
    },
    {
      id: 'FC-002',
      productId: '2',
      currentStock: 45,
      demandForecast: 60,
      suggestedReplenishment: 100,
      replenishmentRule: 'automatic',
      leadTime: 5,
      priority: 'medium'
    }
  ]);

  const [stockMoves, setStockMoves] = useState<StockMove[]>([
    {
      id: 'SM-001',
      date: '2024-01-15',
      reference: 'REC-001',
      productId: '1',
      fromLocation: 'Vendor',
      toLocation: 'Warehouse A',
      quantity: 250,
      operationType: 'receipt',
      status: 'done'
    },
    {
      id: 'SM-002',
      date: '2024-01-14',
      reference: 'DEL-001',
      productId: '3',
      fromLocation: 'Warehouse C',
      toLocation: 'Customer',
      quantity: 15,
      operationType: 'delivery',
      status: 'done'
    }
  ]);

  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrder[]>([
    {
      id: 'MO-001',
      productName: 'Industrial Valve',
      quantity: 100,
      status: 'in-progress',
      startDate: '2024-01-10',
      endDate: '2024-01-25',
      priority: 'high'
    },
    {
      id: 'MO-002',
      productName: 'Pressure Gauge',
      quantity: 250,
      status: 'confirmed',
      startDate: '2024-01-20',
      endDate: '2024-02-05',
      priority: 'medium'
    }
  ]);

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([
    {
      id: 'MR-001',
      requestTitle: 'Monthly CNC Machine Calibration',
      equipment: 'CNC Machine #1',
      equipmentId: 'EQ-001',
      type: 'preventive',
      requestDate: '2024-01-15',
      scheduledDate: '2024-01-18',
      deadlineDate: '2024-01-20',
      maintenanceTeam: 'Mechanical Team',
      description: 'Regular maintenance and calibration',
      status: 'scheduled',
      technician: 'John Smith',
      priority: 'medium',
      category: 'mechanical',
      attachments: ['manual.pdf', 'checklist.pdf'],
      estimatedDuration: 4,
      spareParts: [
        { partId: 'SP-001', quantity: 2, cost: 50.00 }
      ],
      notes: 'Check all moving parts and lubrication points'
    },
    {
      id: 'MR-002',
      requestTitle: 'Hydraulic Press Oil Leak Repair',
      equipment: 'Hydraulic Press',
      equipmentId: 'EQ-002',
      type: 'corrective',
      requestDate: '2024-01-14',
      scheduledDate: '2024-01-15',
      deadlineDate: '2024-01-16',
      maintenanceTeam: 'Hydraulic Team',
      description: 'Oil leak repair',
      status: 'in-progress',
      technician: 'Mike Johnson',
      priority: 'high',
      category: 'hydraulic',
      attachments: ['leak_photo.jpg'],
      estimatedDuration: 6,
      actualDuration: 4,
      cost: 350.00,
      spareParts: [
        { partId: 'SP-002', quantity: 1, cost: 150.00 },
        { partId: 'SP-003', quantity: 3, cost: 25.00 }
      ],
      notes: 'Replace main seal and check hydraulic fluid levels'
    }
  ]);

  const [equipment, setEquipment] = useState<Equipment[]>([
    {
      id: 'EQ-001',
      name: 'CNC Machine #1',
      equipmentId: 'CNC-001',
      category: 'machine',
      location: 'Manufacturing Floor A',
      department: 'Manufacturing',
      responsibleTechnician: 'John Smith',
      manufacturer: 'Haas Automation',
      modelNumber: 'VF-2SS',
      serialNumber: 'HAS-2024-001',
      purchaseDate: '2023-06-15',
      cost: 125000,
      warrantyExpiry: '2026-06-15',
      maintenanceFrequency: 'monthly',
      nextPreventiveMaintenance: '2024-02-18',
      totalDowntime: 12,
      barcode: 'EQ001-CNC-2024',
      status: 'active',
      specifications: {
        'Max Spindle Speed': '8100 RPM',
        'Table Size': '30" x 16"',
        'Power': '20 HP'
      },
      manuals: ['cnc_manual.pdf', 'safety_guide.pdf'],
      maintenanceHistory: ['MR-001']
    },
    {
      id: 'EQ-002',
      name: 'Hydraulic Press',
      equipmentId: 'HP-001',
      category: 'machine',
      location: 'Manufacturing Floor B',
      department: 'Manufacturing',
      responsibleTechnician: 'Mike Johnson',
      manufacturer: 'Greenerd Press',
      modelNumber: 'H-Frame 50T',
      serialNumber: 'GP-2023-002',
      purchaseDate: '2023-03-10',
      cost: 45000,
      warrantyExpiry: '2025-03-10',
      maintenanceFrequency: 'quarterly',
      nextPreventiveMaintenance: '2024-04-10',
      totalDowntime: 8,
      barcode: 'EQ002-HP-2024',
      status: 'under-maintenance',
      specifications: {
        'Max Force': '50 Tons',
        'Bed Size': '24" x 18"',
        'Stroke': '12"'
      },
      manuals: ['hydraulic_manual.pdf'],
      maintenanceHistory: ['MR-002']
    },
    {
      id: 'EQ-003',
      name: 'Forklift #1',
      equipmentId: 'FL-001',
      category: 'vehicles',
      location: 'Warehouse A',
      department: 'Logistics',
      responsibleTechnician: 'Sarah Wilson',
      manufacturer: 'Toyota',
      modelNumber: '8FGU25',
      serialNumber: 'TY-2023-FL001',
      purchaseDate: '2023-08-20',
      cost: 35000,
      warrantyExpiry: '2025-08-20',
      maintenanceFrequency: 'weekly',
      nextPreventiveMaintenance: '2024-01-22',
      totalDowntime: 4,
      barcode: 'EQ003-FL-2024',
      status: 'active',
      specifications: {
        'Capacity': '5000 lbs',
        'Lift Height': '189"',
        'Fuel Type': 'Propane'
      },
      manuals: ['forklift_manual.pdf', 'safety_checklist.pdf'],
      maintenanceHistory: []
    }
  ]);

  const [preventiveMaintenancePlans, setPreventiveMaintenancePlans] = useState<PreventiveMaintenancePlan[]>([
    {
      id: 'PMP-001',
      planName: 'CNC Monthly Maintenance',
      equipmentId: 'EQ-001',
      maintenanceTeam: 'Mechanical Team',
      frequency: 'monthly',
      nextExecutionDate: '2024-02-18',
      tasksToPerform: [
        'Check spindle alignment',
        'Lubricate all moving parts',
        'Calibrate axes',
        'Clean coolant system',
        'Inspect tool changer'
      ],
      autoGenerateRequest: true,
      estimatedDuration: 4,
      requiredSkills: ['CNC Operation', 'Mechanical Maintenance'],
      spareParts: [
        { partId: 'SP-001', quantity: 2 }
      ],
      isActive: true
    },
    {
      id: 'PMP-002',
      planName: 'Forklift Weekly Inspection',
      equipmentId: 'EQ-003',
      maintenanceTeam: 'Vehicle Team',
      frequency: 'weekly',
      nextExecutionDate: '2024-01-22',
      tasksToPerform: [
        'Check tire pressure',
        'Inspect hydraulic fluid levels',
        'Test brakes',
        'Check battery connections',
        'Inspect forks for damage'
      ],
      autoGenerateRequest: true,
      estimatedDuration: 1,
      requiredSkills: ['Vehicle Maintenance'],
      spareParts: [],
      isActive: true
    }
  ]);

  const [maintenanceTeams, setMaintenanceTeams] = useState<MaintenanceTeam[]>([
    {
      id: 'MT-001',
      teamName: 'Mechanical Team',
      teamLead: 'John Smith',
      members: [
        {
          technicianId: 'T-001',
          name: 'John Smith',
          skills: ['CNC Operation', 'Mechanical Maintenance', 'Welding'],
          availability: 'available'
        },
        {
          technicianId: 'T-002',
          name: 'Robert Davis',
          skills: ['Mechanical Maintenance', 'Pneumatics'],
          availability: 'available'
        }
      ],
      specializations: ['CNC Machines', 'Mechanical Systems', 'Pneumatic Systems'],
      workingHours: {
        start: '08:00',
        end: '17:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      contactInfo: {
        email: 'mechanical.team@company.com',
        phone: '+1-555-0101'
      }
    },
    {
      id: 'MT-002',
      teamName: 'Hydraulic Team',
      teamLead: 'Mike Johnson',
      members: [
        {
          technicianId: 'T-003',
          name: 'Mike Johnson',
          skills: ['Hydraulic Systems', 'Mechanical Maintenance'],
          availability: 'busy'
        },
        {
          technicianId: 'T-004',
          name: 'Lisa Chen',
          skills: ['Hydraulic Systems', 'Electrical Systems'],
          availability: 'available'
        }
      ],
      specializations: ['Hydraulic Systems', 'Pressure Systems'],
      workingHours: {
        start: '07:00',
        end: '16:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      contactInfo: {
        email: 'hydraulic.team@company.com',
        phone: '+1-555-0102'
      }
    },
    {
      id: 'MT-003',
      teamName: 'Vehicle Team',
      teamLead: 'Sarah Wilson',
      members: [
        {
          technicianId: 'T-005',
          name: 'Sarah Wilson',
          skills: ['Vehicle Maintenance', 'Electrical Systems'],
          availability: 'available'
        }
      ],
      specializations: ['Forklifts', 'Industrial Vehicles'],
      workingHours: {
        start: '06:00',
        end: '15:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },
      contactInfo: {
        email: 'vehicle.team@company.com',
        phone: '+1-555-0103'
      }
    }
  ]);

  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([
    {
      id: 'QC-001',
      checkId: 'CHK-2024-001',
      product: 'Industrial Valve',
      batchNumber: 'IV-2024-001',
      relatedOperation: 'manufacturing',
      quantityChecked: 50,
      testType: 'Pressure Test',
      typeOfCheck: 'measurement',
      measurementValue: 150,
      result: 'pass',
      inspector: 'Sarah Wilson',
      performedBy: 'Sarah Wilson',
      date: '2024-01-14',
      notes: 'All units passed pressure test at 150 PSI',
      status: 'passed',
      linkedControlPoint: 'CP-001'
    },
    {
      id: 'QC-002',
      checkId: 'CHK-2024-002',
      product: 'Pressure Gauge',
      batchNumber: 'PG-2024-002',
      relatedOperation: 'incoming',
      quantityChecked: 25,
      testType: 'Calibration Check',
      typeOfCheck: 'pass-fail',
      result: 'pending',
      inspector: 'David Brown',
      performedBy: 'David Brown',
      date: '2024-01-15',
      notes: 'Calibration in progress',
      status: 'draft'
    },
    {
      id: 'QC-003',
      checkId: 'CHK-2024-003',
      product: 'Steel Plates',
      batchNumber: 'SP-2024-001',
      relatedOperation: 'incoming',
      quantityChecked: 100,
      testType: 'Visual Inspection',
      typeOfCheck: 'picture',
      result: 'fail',
      inspector: 'Mike Johnson',
      performedBy: 'Mike Johnson',
      date: '2024-01-13',
      notes: 'Surface defects found on 5% of units',
      status: 'failed',
      linkedControlPoint: 'CP-002'
    }
  ]);

  const [qualityControlPoints, setQualityControlPoints] = useState<QualityControlPoint[]>([
    {
      id: 'CP-001',
      controlPointName: 'Manufacturing Pressure Test',
      operationType: 'manufacturing',
      product: 'Industrial Valve',
      qualityTeam: 'QT-001',
      company: 'SCM Pro',
      controlType: 'all-operations',
      instruction: 'Test all valves at 150 PSI for 5 minutes',
      responsible: 'Sarah Wilson',
      typeOfCheck: 'measurement',
      toleranceMin: 145,
      toleranceMax: 155,
      active: true,
      createdDate: '2024-01-01'
    },
    {
      id: 'CP-002',
      controlPointName: 'Incoming Material Inspection',
      operationType: 'reception',
      product: 'Steel Plates',
      qualityTeam: 'QT-002',
      company: 'SCM Pro',
      controlType: 'random',
      frequency: 5,
      instruction: 'Visual inspection for surface defects and dimensional accuracy',
      responsible: 'Mike Johnson',
      typeOfCheck: 'picture',
      active: true,
      createdDate: '2024-01-01'
    },
    {
      id: 'CP-003',
      controlPointName: 'Final Product Inspection',
      operationType: 'delivery',
      product: 'All Products',
      qualityTeam: 'QT-001',
      company: 'SCM Pro',
      controlType: 'periodic',
      frequency: 10,
      instruction: 'Complete functional test and packaging verification',
      responsible: 'Quality Team Lead',
      typeOfCheck: 'pass-fail',
      active: true,
      createdDate: '2024-01-01'
    }
  ]);

  const [qualityAlerts, setQualityAlerts] = useState<QualityAlert[]>([
    {
      id: 'QA-001',
      alertNumber: 'ALERT-2024-001',
      product: 'Steel Plates',
      operation: 'reception',
      description: 'Surface defects found on incoming steel plates from Vendor A',
      rootCause: 'Supplier Issue',
      priority: 'high',
      status: 'in-progress',
      responsibleTeam: 'QT-002',
      assignedTo: 'Mike Johnson',
      tags: ['Surface Defect', 'Supplier Issue'],
      nextActionDate: '2024-01-16',
      attachments: ['defect_photos.jpg', 'inspection_report.pdf'],
      linkedCheck: 'QC-003',
      createdDate: '2024-01-13'
    },
    {
      id: 'QA-002',
      alertNumber: 'ALERT-2024-002',
      product: 'Hydraulic Pumps',
      operation: 'manufacturing',
      description: 'Pressure test failure on batch HP-2024-003',
      rootCause: 'Manufacturing Process',
      priority: 'urgent',
      status: 'new',
      responsibleTeam: 'QT-001',
      assignedTo: 'Sarah Wilson',
      tags: ['Pressure Test', 'Manufacturing Defect'],
      nextActionDate: '2024-01-15',
      attachments: ['test_results.pdf'],
      createdDate: '2024-01-14'
    },
    {
      id: 'QA-003',
      alertNumber: 'ALERT-2024-003',
      product: 'Aluminum Rods',
      operation: 'delivery',
      description: 'Customer complaint about dimensional variance',
      rootCause: 'Measurement Error',
      priority: 'medium',
      status: 'resolved',
      responsibleTeam: 'QT-001',
      assignedTo: 'David Brown',
      tags: ['Customer Complaint', 'Dimensional Issue'],
      nextActionDate: '2024-01-12',
      attachments: ['customer_feedback.pdf'],
      createdDate: '2024-01-10',
      resolvedDate: '2024-01-12'
    }
  ]);

  const [qualityTeams, setQualityTeams] = useState<QualityTeam[]>([
    {
      id: 'QT-001',
      teamName: 'Manufacturing Quality Team',
      teamLeader: 'Sarah Wilson',
      assignedUsers: [
        {
          userId: 'U-001',
          name: 'Sarah Wilson',
          role: 'Quality Manager',
          availability: 'available'
        },
        {
          userId: 'U-002',
          name: 'David Brown',
          role: 'Quality Inspector',
          availability: 'available'
        },
        {
          userId: 'U-003',
          name: 'Lisa Chen',
          role: 'Quality Technician',
          availability: 'busy'
        }
      ],
      relatedProducts: ['Industrial Valve', 'Pressure Gauge', 'Hydraulic Pumps'],
      department: 'Manufacturing',
      contactInfo: {
        email: 'quality.manufacturing@company.com',
        phone: '+1-555-0201'
      },
      isActive: true
    },
    {
      id: 'QT-002',
      teamName: 'Incoming Quality Team',
      teamLeader: 'Mike Johnson',
      assignedUsers: [
        {
          userId: 'U-004',
          name: 'Mike Johnson',
          role: 'Incoming Quality Lead',
          availability: 'available'
        },
        {
          userId: 'U-005',
          name: 'Anna Rodriguez',
          role: 'Material Inspector',
          availability: 'available'
        }
      ],
      relatedProducts: ['Steel Plates', 'Aluminum Rods', 'Raw Materials'],
      department: 'Receiving',
      contactInfo: {
        email: 'quality.incoming@company.com',
        phone: '+1-555-0202'
      },
      isActive: true
    }
  ]);

  const [qualityTags, setQualityTags] = useState<QualityTag[]>([
    {
      id: 'TAG-001',
      name: 'Surface Defect',
      color: 'bg-red-100 text-red-800',
      category: 'Physical',
      description: 'Issues related to surface quality and finish'
    },
    {
      id: 'TAG-002',
      name: 'Dimensional Issue',
      color: 'bg-orange-100 text-orange-800',
      category: 'Measurement',
      description: 'Problems with dimensions and tolerances'
    },
    {
      id: 'TAG-003',
      name: 'Supplier Issue',
      color: 'bg-purple-100 text-purple-800',
      category: 'External',
      description: 'Quality problems originating from suppliers'
    },
    {
      id: 'TAG-004',
      name: 'Manufacturing Defect',
      color: 'bg-blue-100 text-blue-800',
      category: 'Internal',
      description: 'Quality issues from internal manufacturing processes'
    },
    {
      id: 'TAG-005',
      name: 'Packaging Issue',
      color: 'bg-green-100 text-green-800',
      category: 'Packaging',
      description: 'Problems with product packaging and labeling'
    },
    {
      id: 'TAG-006',
      name: 'Customer Complaint',
      color: 'bg-yellow-100 text-yellow-800',
      category: 'External',
      description: 'Issues reported by customers'
    }
  ]);

  const [productRevisions, setProductRevisions] = useState<ProductRevision[]>([
    {
      id: 'PR-001',
      productName: 'Industrial Valve',
      version: 'v2.1',
      changeType: 'minor',
      description: 'Updated gasket material for better temperature resistance',
      status: 'approved',
      requestedBy: 'Engineering Team',
      requestDate: '2024-01-10'
    }
  ]);

  const [engineeringChangeOrders, setEngineeringChangeOrders] = useState<EngineeringChangeOrder[]>([
    {
      id: 'ECO-001',
      ecoNumber: 'ECO-2024-001',
      type: 'bom',
      product: 'Industrial Valve',
      bomRevision: {
        oldVersion: 'v2.0',
        proposedVersion: 'v2.1'
      },
      description: 'Replace steel gasket with PTFE gasket for better chemical resistance',
      changeReason: 'design-improvement',
      effectiveDate: '2024-02-01',
      stage: 'approved',
      documents: ['gasket_spec.pdf', 'test_results.pdf'],
      requestedBy: 'John Smith',
      approvalNeededFrom: ['Engineering Manager', 'Quality Manager', 'Production Manager'],
      approvers: [
        { userId: 'U-001', name: 'Sarah Wilson', status: 'approved', comments: 'Approved - good improvement', date: '2024-01-12' },
        { userId: 'U-002', name: 'Mike Johnson', status: 'approved', comments: 'Quality tests passed', date: '2024-01-13' },
        { userId: 'U-003', name: 'David Brown', status: 'approved', comments: 'Production ready', date: '2024-01-14' }
      ],
      finalStatus: 'approved',
      notes: 'Implementation scheduled for next production run',
      relatedManufacturingOrders: ['MO-001'],
      priority: 'medium',
      estimatedCost: 2500,
      createdDate: '2024-01-10',
      lastModified: '2024-01-14'
    },
    {
      id: 'ECO-002',
      ecoNumber: 'ECO-2024-002',
      type: 'document',
      product: 'Pressure Gauge',
      bomRevision: {
        oldVersion: 'v1.0',
        proposedVersion: 'v1.1'
      },
      description: 'Update assembly instructions for improved clarity',
      changeReason: 'defect',
      effectiveDate: '2024-01-25',
      stage: 'under-review',
      documents: ['assembly_guide_v1.1.pdf'],
      requestedBy: 'Lisa Chen',
      approvalNeededFrom: ['Technical Writer', 'Quality Manager'],
      approvers: [
        { userId: 'U-004', name: 'Anna Rodriguez', status: 'pending', comments: '', date: undefined },
        { userId: 'U-002', name: 'Mike Johnson', status: 'pending', comments: '', date: undefined }
      ],
      finalStatus: 'pending',
      notes: 'Addressing assembly errors reported by production team',
      relatedManufacturingOrders: [],
      priority: 'high',
      estimatedCost: 500,
      createdDate: '2024-01-15',
      lastModified: '2024-01-15'
    }
  ]);

  const [bomVersions, setBomVersions] = useState<BomVersion[]>([
    {
      id: 'BOM-001',
      bomNumber: 'BOM-IV-001',
      product: 'Industrial Valve',
      version: 'v2.1',
      createdBy: 'John Smith',
      createdDate: '2024-01-14',
      components: [
        { componentId: 'C-001', componentName: 'PTFE Gasket', quantity: 1, unit: 'piece', cost: 15.00 },
        { componentId: 'C-002', componentName: 'Valve Body', quantity: 1, unit: 'piece', cost: 85.00 },
        { componentId: 'C-003', componentName: 'Handle Assembly', quantity: 1, unit: 'piece', cost: 25.00 },
        { componentId: 'C-004', componentName: 'Bolts M8x20', quantity: 4, unit: 'pieces', cost: 2.50 }
      ],
      routing: [
        { stepNumber: 1, operation: 'Machining', workCenter: 'CNC-001', duration: 30 },
        { stepNumber: 2, operation: 'Assembly', workCenter: 'ASM-001', duration: 15 },
        { stepNumber: 3, operation: 'Testing', workCenter: 'TEST-001', duration: 10 }
      ],
      ecoLinked: 'ECO-001',
      status: 'active',
      notes: 'Updated with PTFE gasket per ECO-001'
    },
    {
      id: 'BOM-002',
      bomNumber: 'BOM-IV-002',
      product: 'Industrial Valve',
      version: 'v2.0',
      createdBy: 'John Smith',
      createdDate: '2024-01-01',
      components: [
        { componentId: 'C-005', componentName: 'Steel Gasket', quantity: 1, unit: 'piece', cost: 8.00 },
        { componentId: 'C-002', componentName: 'Valve Body', quantity: 1, unit: 'piece', cost: 85.00 },
        { componentId: 'C-003', componentName: 'Handle Assembly', quantity: 1, unit: 'piece', cost: 25.00 },
        { componentId: 'C-004', componentName: 'Bolts M8x20', quantity: 4, unit: 'pieces', cost: 2.50 }
      ],
      routing: [
        { stepNumber: 1, operation: 'Machining', workCenter: 'CNC-001', duration: 30 },
        { stepNumber: 2, operation: 'Assembly', workCenter: 'ASM-001', duration: 15 },
        { stepNumber: 3, operation: 'Testing', workCenter: 'TEST-001', duration: 10 }
      ],
      status: 'archived',
      notes: 'Replaced by v2.1 due to gasket material change'
    }
  ]);

  const [productDocuments, setProductDocuments] = useState<ProductDocument[]>([
    {
      id: 'DOC-001',
      documentName: 'Industrial Valve Technical Drawing',
      type: 'drawing',
      linkedTo: { type: 'product', id: 'Industrial Valve' },
      uploadDate: '2024-01-10',
      uploadedBy: 'John Smith',
      version: 'v2.1',
      description: 'Technical drawing with updated gasket specifications',
      fileUrl: '/documents/industrial_valve_v2.1.pdf',
      fileSize: 2048000,
      fileType: 'application/pdf',
      tags: ['technical', 'drawing', 'gasket']
    },
    {
      id: 'DOC-002',
      documentName: 'PTFE Gasket Specification',
      type: 'specification',
      linkedTo: { type: 'eco', id: 'ECO-001' },
      uploadDate: '2024-01-11',
      uploadedBy: 'Sarah Wilson',
      version: 'v1.0',
      description: 'Material specification for new PTFE gasket',
      fileUrl: '/documents/ptfe_gasket_spec.pdf',
      fileSize: 512000,
      fileType: 'application/pdf',
      tags: ['specification', 'material', 'ptfe']
    },
    {
      id: 'DOC-003',
      documentName: 'Assembly Instructions',
      type: 'manual',
      linkedTo: { type: 'product', id: 'Pressure Gauge' },
      uploadDate: '2024-01-15',
      uploadedBy: 'Lisa Chen',
      version: 'v1.1',
      description: 'Updated assembly instructions with clearer diagrams',
      fileUrl: '/documents/pressure_gauge_assembly_v1.1.pdf',
      fileSize: 1024000,
      fileType: 'application/pdf',
      tags: ['manual', 'assembly', 'instructions']
    }
  ]);

  const [engineeringTeams, setEngineeringTeams] = useState<EngineeringTeam[]>([
    {
      id: 'ET-001',
      teamName: 'Mechanical Design Team',
      teamLead: 'John Smith',
      members: [
        {
          userId: 'U-001',
          name: 'John Smith',
          role: 'Senior Mechanical Engineer',
          specialization: ['CAD Design', 'Mechanical Systems', 'Product Development'],
          availability: 'available'
        },
        {
          userId: 'U-005',
          name: 'Robert Davis',
          role: 'Mechanical Engineer',
          specialization: ['3D Modeling', 'Prototyping', 'Testing'],
          availability: 'busy'
        },
        {
          userId: 'U-006',
          name: 'Emily Johnson',
          role: 'Design Engineer',
          specialization: ['Technical Drawing', 'Documentation', 'Standards'],
          availability: 'available'
        }
      ],
      productCategories: ['Industrial Valves', 'Pressure Gauges', 'Mechanical Components'],
      defaultApprovers: ['John Smith', 'Sarah Wilson'],
      notificationsEnabled: true,
      contactInfo: {
        email: 'mechanical.design@company.com',
        phone: '+1-555-0301'
      }
    },
    {
      id: 'ET-002',
      teamName: 'Quality Engineering Team',
      teamLead: 'Sarah Wilson',
      members: [
        {
          userId: 'U-002',
          name: 'Sarah Wilson',
          role: 'Quality Manager',
          specialization: ['Quality Systems', 'Testing', 'Compliance'],
          availability: 'available'
        },
        {
          userId: 'U-007',
          name: 'Michael Brown',
          role: 'Quality Engineer',
          specialization: ['Statistical Analysis', 'Process Control', 'Auditing'],
          availability: 'available'
        }
      ],
      productCategories: ['All Products'],
      defaultApprovers: ['Sarah Wilson', 'Mike Johnson'],
      notificationsEnabled: true,
      contactInfo: {
        email: 'quality.engineering@company.com',
        phone: '+1-555-0302'
      }
    }
  ]);

  const [ecoComments, setEcoComments] = useState<EcoComment[]>([
    {
      id: 'COM-001',
      ecoId: 'ECO-001',
      userId: 'U-001',
      userName: 'John Smith',
      comment: 'Initial testing shows 40% improvement in chemical resistance with PTFE gasket.',
      timestamp: '2024-01-11T10:30:00Z',
      mentions: ['Sarah Wilson'],
      attachments: ['test_results.pdf']
    },
    {
      id: 'COM-002',
      ecoId: 'ECO-001',
      userId: 'U-002',
      userName: 'Sarah Wilson',
      comment: '@John Smith Great results! Quality team approves this change. Cost impact is acceptable.',
      timestamp: '2024-01-12T14:15:00Z',
      mentions: ['John Smith'],
      attachments: []
    },
    {
      id: 'COM-003',
      ecoId: 'ECO-002',
      userId: 'U-003',
      userName: 'Lisa Chen',
      comment: 'Production team reported 3 assembly errors this week. Updated instructions should resolve these issues.',
      timestamp: '2024-01-15T09:45:00Z',
      mentions: [],
      attachments: ['error_report.pdf']
    }
  ]);
  const [repairOrders, setRepairOrders] = useState<RepairOrder[]>([
    {
      id: 'RO-001',
      item: 'Hydraulic Pump HP-003',
      issueDescription: 'Excessive noise and vibration during operation',
      status: 'in-progress',
      priority: 'high',
      assignedTechnician: 'Mike Johnson',
      createdDate: '2024-01-13',
      estimatedCompletion: '2024-01-17'
    }
  ]);

  const [rfqs, setRfqs] = useState<RFQ[]>([
    {
      id: 'RFQ-001',
      rfqNumber: 'RFQ-2024-001',
      vendors: ['Steel Corp Ltd', 'Metal Works Inc', 'Industrial Supply Co'],
      orderDate: '2024-01-10',
      currency: 'USD',
      deliveryDate: '2024-01-25',
      paymentTerms: 'Net 30',
      products: [
        { name: 'Steel Plates', quantity: 500, uom: 'pieces', unitPrice: 150, taxes: 10 },
        { name: 'Steel Rods', quantity: 200, uom: 'pieces', unitPrice: 75, taxes: 10 }
      ],
      notes: 'Urgent requirement for Q1 production',
      status: 'sent',
      totalAmount: 91500
    }
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: 'PO-001',
      poNumber: 'PO-2024-001',
      vendor: 'Steel Corp Ltd',
      orderDate: '2024-01-12',
      deliveryAddress: '123 Industrial Ave, Manufacturing District',
      warehouse: 'Warehouse A',
      incoterms: 'FOB',
      deliveryMethod: 'Truck',
      scheduledDeliveryDate: '2024-01-22',
      products: [
        { product: 'Steel Plates', quantity: 500, unitPrice: 150, taxes: 10, subtotal: 82500 },
        { product: 'Steel Rods', quantity: 200, unitPrice: 75, taxes: 10, subtotal: 16500 }
      ],
      totalAmount: 99000,
      responsibleUser: 'John Doe',
      status: 'confirmed',
      currency: 'USD',
      paymentTerms: 'Net 30'
    }
  ]);

  const [purchaseAgreements, setPurchaseAgreements] = useState<PurchaseAgreement[]>([
    {
      id: 'PA-001',
      agreementType: 'blanket-order',
      agreementReference: 'PA-2024-STEEL-001',
      vendors: ['Steel Corp Ltd'],
      products: [
        { product: 'Steel Plates', quantity: 2000, price: 145, uom: 'pieces' },
        { product: 'Steel Rods', quantity: 1000, price: 70, uom: 'pieces' }
      ],
      validityPeriod: {
        start: '2024-01-01',
        end: '2024-12-31'
      },
      status: 'confirmed',
      totalValue: 360000,
      currency: 'USD'
    }
  ]);

  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: 'V-001',
      vendorName: 'Steel Corp Ltd',
      contactPerson: 'Michael Johnson',
      email: 'michael@steelcorp.com',
      phone: '+1-555-0123',
      address: '456 Steel Street, Industrial Zone, NY 10001',
      gstin: 'GST123456789',
      currency: 'USD',
      paymentTerms: 'Net 30',
      productsSupplied: ['Steel Plates', 'Steel Rods', 'Steel Beams'],
      vendorRating: 4.5,
      bankDetails: {
        bankName: 'Industrial Bank',
        accountNumber: '1234567890',
        ifscCode: 'INDB0001234'
      },
      notes: 'Reliable supplier with excellent quality standards',
      isActive: true
    },
    {
      id: 'V-002',
      vendorName: 'Aluminum Co',
      contactPerson: 'Sarah Wilson',
      email: 'sarah@aluminumco.com',
      phone: '+1-555-0124',
      address: '789 Aluminum Ave, Metal District, CA 90210',
      gstin: 'GST987654321',
      currency: 'USD',
      paymentTerms: 'Net 15',
      productsSupplied: ['Aluminum Rods', 'Aluminum Sheets', 'Aluminum Pipes'],
      vendorRating: 4.2,
      bankDetails: {
        bankName: 'Metal Finance Bank',
        accountNumber: '0987654321',
        ifscCode: 'MFNB0009876'
      },
      notes: 'Good pricing and fast delivery',
      isActive: true
    }
  ]);

  const [repairOrdersDetailed, setRepairOrdersDetailed] = useState<RepairOrderDetailed[]>([
    {
      id: 'RO-001',
      productId: '3',
      quantity: 1,
      serialLotNumber: 'HP-2024-001',
      customerName: 'ABC Manufacturing',
      repairType: 'warranty',
      issueDescription: 'Excessive noise and vibration during operation',
      rootCause: 'defect',
      requestedDate: '2024-01-13',
      expectedCompletion: '2024-01-17',
      priority: 'high',
      status: 'under-repair',
      assignedTechnician: 'Mike Johnson',
      responsibleTeam: 'Hydraulic Repair Team',
      location: 'Repair Center A',
      sourceDocument: 'SO-2024-001',
      attachments: ['noise_recording.mp3', 'vibration_analysis.pdf'],
      partsUsed: [
        {
          partId: 'SP-001',
          partName: 'Hydraulic Seal',
          quantity: 2,
          unitCost: 25.00,
          totalCost: 50.00,
          stockLocation: 'Warehouse A'
        }
      ],
      operations: [
        {
          description: 'Disassemble pump and inspect components',
          technician: 'Mike Johnson',
          duration: 2,
          rate: 75.00,
          notes: 'Found worn seals causing vibration'
        }
      ],
      warrantyType: 'in-warranty',
      chargeable: false,
      laborCost: 150.00,
      partsCost: 50.00,
      totalCost: 200.00,
      invoiceGenerated: false,
      createdDate: '2024-01-13',
      notes: 'Customer reported issue after 6 months of operation'
    },
    {
      id: 'RO-002',
      productId: '1',
      quantity: 5,
      customerName: 'Internal - Quality Department',
      repairType: 'internal',
      issueDescription: 'Surface corrosion on steel plates',
      rootCause: 'damage',
      requestedDate: '2024-01-14',
      expectedCompletion: '2024-01-18',
      priority: 'medium',
      status: 'confirmed',
      assignedTechnician: 'Robert Davis',
      responsibleTeam: 'Surface Treatment Team',
      location: 'Repair Center B',
      attachments: ['corrosion_photos.jpg'],
      partsUsed: [],
      operations: [],
      warrantyType: 'expired',
      chargeable: true,
      laborCost: 0,
      partsCost: 0,
      totalCost: 0,
      invoiceGenerated: false,
      createdDate: '2024-01-14',
      notes: 'Plates damaged during storage due to moisture'
    }
  ]);

  const [repairTeams, setRepairTeams] = useState<RepairTeam[]>([
    {
      id: 'RT-001',
      teamName: 'Hydraulic Repair Team',
      teamLead: 'Mike Johnson',
      members: [
        {
          technicianId: 'T-001',
          name: 'Mike Johnson',
          specialization: ['Hydraulic Systems', 'Pumps', 'Valves'],
          hourlyRate: 75.00,
          availability: 'busy'
        },
        {
          technicianId: 'T-002',
          name: 'Lisa Chen',
          specialization: ['Hydraulic Systems', 'Pressure Testing'],
          hourlyRate: 65.00,
          availability: 'available'
        }
      ],
      location: 'Repair Center A',
      workingHours: {
        start: '08:00',
        end: '17:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      contactInfo: {
        email: 'hydraulic.repair@company.com',
        phone: '+1-555-0301'
      }
    },
    {
      id: 'RT-002',
      teamName: 'Surface Treatment Team',
      teamLead: 'Robert Davis',
      members: [
        {
          technicianId: 'T-003',
          name: 'Robert Davis',
          specialization: ['Surface Treatment', 'Coating', 'Corrosion Repair'],
          hourlyRate: 70.00,
          availability: 'available'
        },
        {
          technicianId: 'T-004',
          name: 'Emma Wilson',
          specialization: ['Sandblasting', 'Painting', 'Quality Control'],
          hourlyRate: 60.00,
          availability: 'available'
        }
      ],
      location: 'Repair Center B',
      workingHours: {
        start: '07:00',
        end: '16:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      contactInfo: {
        email: 'surface.repair@company.com',
        phone: '+1-555-0302'
      }
    }
  ]);

  const [repairTemplates, setRepairTemplates] = useState<RepairTemplate[]>([
    {
      id: 'RT-001',
      templateName: 'Hydraulic Pump Standard Repair',
      productCategory: 'Hydraulic Equipment',
      commonIssue: 'Seal replacement and pressure testing',
      estimatedDuration: 4,
      defaultParts: [
        { partId: 'SP-001', quantity: 2 },
        { partId: 'SP-002', quantity: 1 }
      ],
      defaultOperations: [
        { description: 'Disassemble and inspect', estimatedDuration: 1 },
        { description: 'Replace seals and gaskets', estimatedDuration: 2 },
        { description: 'Reassemble and test', estimatedDuration: 1 }
      ],
      isActive: true
    },
    {
      id: 'RT-002',
      templateName: 'Steel Surface Corrosion Treatment',
      productCategory: 'Steel Products',
      commonIssue: 'Surface corrosion removal and protection',
      estimatedDuration: 6,
      defaultParts: [
        { partId: 'SP-003', quantity: 1 }
      ],
      defaultOperations: [
        { description: 'Surface preparation and cleaning', estimatedDuration: 2 },
        { description: 'Corrosion treatment application', estimatedDuration: 3 },
        { description: 'Quality inspection and finishing', estimatedDuration: 1 }
      ],
      isActive: true
    }
  ]);
  const updateInventory = (item: InventoryItem) => {
    setInventory(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const addInventoryItem = (item: InventoryItem) => {
    setInventory(prev => [...prev, item]);
  };

  const addReceipt = (receipt: Receipt) => {
    setReceipts(prev => [...prev, receipt]);
  };

  const addDelivery = (delivery: Delivery) => {
    setDeliveries(prev => [...prev, delivery]);
  };

  const addScrapOrder = (scrap: ScrapOrder) => {
    setScrapOrders(prev => [...prev, scrap]);
  };

  const addForecastItem = (forecast: ForecastItem) => {
    setForecastItems(prev => [...prev, forecast]);
  };

  const addStockMove = (move: StockMove) => {
    setStockMoves(prev => [...prev, move]);
  };

  const addManufacturingOrder = (order: ManufacturingOrder) => {
    setManufacturingOrders(prev => [...prev, order]);
  };

  const addPurchaseOrder = (order: PurchaseOrder) => {
    setPurchaseOrders(prev => [...prev, order]);
  };

  const addMaintenanceRecord = (record: MaintenanceRecord) => {
    setMaintenanceRecords(prev => [...prev, record]);
  };

  const addEquipment = (newEquipment: Equipment) => {
    setEquipment(prev => [...prev, newEquipment]);
  };

  const addPreventiveMaintenancePlan = (plan: PreventiveMaintenancePlan) => {
    setPreventiveMaintenancePlans(prev => [...prev, plan]);
  };

  const addMaintenanceTeam = (team: MaintenanceTeam) => {
    setMaintenanceTeams(prev => [...prev, team]);
  };

  const updateEquipment = (updatedEquipment: Equipment) => {
    setEquipment(prev => prev.map(eq => eq.id === updatedEquipment.id ? updatedEquipment : eq));
  };

  const updateMaintenanceRecord = (updatedRecord: MaintenanceRecord) => {
    setMaintenanceRecords(prev => prev.map(record => record.id === updatedRecord.id ? updatedRecord : record));
  };

  const addQualityCheck = (check: QualityCheck) => {
    setQualityChecks(prev => [...prev, check]);
  };

  const updateQualityCheck = (updatedCheck: QualityCheck) => {
    setQualityChecks(prev => prev.map(check => check.id === updatedCheck.id ? updatedCheck : check));
  };

  const addQualityControlPoint = (controlPoint: QualityControlPoint) => {
    setQualityControlPoints(prev => [...prev, controlPoint]);
  };

  const updateQualityControlPoint = (updatedControlPoint: QualityControlPoint) => {
    setQualityControlPoints(prev => prev.map(cp => cp.id === updatedControlPoint.id ? updatedControlPoint : cp));
  };

  const addQualityAlert = (alert: QualityAlert) => {
    setQualityAlerts(prev => [...prev, alert]);
  };

  const updateQualityAlert = (updatedAlert: QualityAlert) => {
    setQualityAlerts(prev => prev.map(alert => alert.id === updatedAlert.id ? updatedAlert : alert));
  };

  const addQualityTeam = (team: QualityTeam) => {
    setQualityTeams(prev => [...prev, team]);
  };

  const updateQualityTeam = (updatedTeam: QualityTeam) => {
    setQualityTeams(prev => prev.map(team => team.id === updatedTeam.id ? updatedTeam : team));
  };

  const addQualityTag = (tag: QualityTag) => {
    setQualityTags(prev => [...prev, tag]);
  };

  const addProductRevision = (revision: ProductRevision) => {
    setProductRevisions(prev => [...prev, revision]);
  };

  const addRfq = (rfq: RFQ) => {
    setRfqs(prev => [...prev, rfq]);
  };

  const addPurchaseAgreement = (agreement: PurchaseAgreement) => {
    setPurchaseAgreements(prev => [...prev, agreement]);
  };

  const addVendor = (vendor: Vendor) => {
    setVendors(prev => [...prev, vendor]);
  };

  const addRepairOrder = (order: RepairOrder) => {
    setRepairOrders(prev => [...prev, order]);
  };

  const addRepairOrderDetailed = (order: RepairOrderDetailed) => {
    setRepairOrdersDetailed(prev => [...prev, order]);
  };

  const updateRepairOrderDetailed = (updatedOrder: RepairOrderDetailed) => {
    setRepairOrdersDetailed(prev => prev.map(order => order.id === updatedOrder.id ? updatedOrder : order));
  };

  const addRepairTeam = (team: RepairTeam) => {
    setRepairTeams(prev => [...prev, team]);
  };

  const updateRepairTeam = (updatedTeam: RepairTeam) => {
    setRepairTeams(prev => prev.map(team => team.id === updatedTeam.id ? updatedTeam : team));
  };

  const addRepairTemplate = (template: RepairTemplate) => {
    setRepairTemplates(prev => [...prev, template]);
  };

  const updateRepairTemplate = (updatedTemplate: RepairTemplate) => {
    setRepairTemplates(prev => prev.map(template => template.id === updatedTemplate.id ? updatedTemplate : template));
  };
  const addEngineeringChangeOrder = (eco: EngineeringChangeOrder) => {
    setEngineeringChangeOrders(prev => [...prev, eco]);
  };

  const updateEngineeringChangeOrder = (updatedEco: EngineeringChangeOrder) => {
    setEngineeringChangeOrders(prev => prev.map(eco => eco.id === updatedEco.id ? updatedEco : eco));
  };

  const addBomVersion = (bom: BomVersion) => {
    setBomVersions(prev => [...prev, bom]);
  };

  const updateBomVersion = (updatedBom: BomVersion) => {
    setBomVersions(prev => prev.map(bom => bom.id === updatedBom.id ? updatedBom : bom));
  };

  const addProductDocument = (document: ProductDocument) => {
    setProductDocuments(prev => [...prev, document]);
  };

  const addEngineeringTeam = (team: EngineeringTeam) => {
    setEngineeringTeams(prev => [...prev, team]);
  };

  const updateEngineeringTeam = (updatedTeam: EngineeringTeam) => {
    setEngineeringTeams(prev => prev.map(team => team.id === updatedTeam.id ? updatedTeam : team));
  };

  const addEcoComment = (comment: EcoComment) => {
    setEcoComments(prev => [...prev, comment]);
  };
  return (
    <DataContext.Provider value={{
      inventory,
      receipts,
      deliveries,
      scrapOrders,
      forecastItems,
      stockMoves,
      manufacturingOrders,
      purchaseOrders,
      maintenanceRecords,
      equipment,
      preventiveMaintenancePlans,
      maintenanceTeams,
      qualityChecks,
      qualityControlPoints,
      qualityAlerts,
      qualityTeams,
      qualityTags,
      productRevisions,
      repairOrders,
      repairOrdersDetailed,
      repairTeams,
      repairTemplates,
      engineeringChangeOrders,
      bomVersions,
      productDocuments,
      engineeringTeams,
      ecoComments,
      rfqs,
      purchaseAgreements,
      vendors,
      updateInventory,
      addInventoryItem,
      addReceipt,
      addDelivery,
      addScrapOrder,
      addForecastItem,
      addStockMove,
      addManufacturingOrder,
      addPurchaseOrder,
      addMaintenanceRecord,
      addEquipment,
      addPreventiveMaintenancePlan,
      addMaintenanceTeam,
      updateEquipment,
      updateMaintenanceRecord,
      addQualityCheck,
      updateQualityCheck,
      addQualityControlPoint,
      updateQualityControlPoint,
      addQualityAlert,
      updateQualityAlert,
      addQualityTeam,
      updateQualityTeam,
      addQualityTag,
      addProductRevision,
      addRfq,
      addPurchaseAgreement,
      addVendor,
      addRepairOrder,
      addRepairOrderDetailed,
      updateRepairOrderDetailed,
      addRepairTeam,
      updateRepairTeam,
      addRepairTemplate,
      updateRepairTemplate,
      addEngineeringChangeOrder,
      updateEngineeringChangeOrder,
      addBomVersion,
      updateBomVersion,
      addProductDocument,
      addEngineeringTeam,
      updateEngineeringTeam,
      addEcoComment
    }}>
      {children}
    </DataContext.Provider>
  );
};