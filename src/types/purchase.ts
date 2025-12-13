export interface Vendor {
  location: string | { name: string; } | any;
  id: string;
  vendorName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  organisationId:string;
  currency: string;
  paymentTerms: string;
  productsSupplied?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  notes?: string;
  isActive: boolean;
  vendorRating: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RFQProduct {
  name: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  taxes: number;
}

export interface RFQ {
  id: string;
  location: string | { name: string; } | any;
  organisationId:string;
  rfqNumber: string;
  orderDate?: string;
  currency?: string;
  vendors: string[]; // Array of Vendor IDs
  paymentTerms?: string;
  deliveryDate?: string;
  products: RFQProduct[];
  notes?: string;
  status: 'draft' | 'sent' | 'received' | 'done' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderProductLine {
  itemType?: "material" | "product";

  /** Item name (existing or new) */
  product: string;

  /** NEW FIELDS — REQUIRED FOR NEW MATERIAL/PRODUCT SUPPORT */
  isNew?: boolean;
  newProductName?: string;

  quantity: number;
  unitPrice: number;
  taxes: number;
  subtotal: number;

  organisationId: string;
  warehouse: string | { name: string } | any;

  // Raw Material specific fields
  itemCode?: string;
  unitOfMeasure?: string;
  hsn?: string;
  gstPercent?: number;
  valuationMethod?: string;
  reorderLevel?: number;
  technicalSpecs?: string;

  // Product specific fields
  productType?: string;
  category?: string;
  sku?: string;
  barcode?: string;
  warehouseLocation?: string;
  description?: string;
}


export interface PurchaseOrder {
  id: string;
  poNumber: string;
  organisationId: string;
  vendor: string; // Vendor Name
  vendorId?: string; // Vendor ID
  orderDate?: string;
  deliveryAddress?: string;
  warehouse?: string;
  incoterms?: string;
  deliveryMethod?: string;
  scheduledDeliveryDate?: string;
  productLines: PurchaseOrderProductLine[];
  responsibleUser?: string;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'waiting-for-delivery' | 'done' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseAgreement {
  location: string | { name: string; } | any;
  id: string;
  organisationId:string;
  agreementNumber: string;
  vendor: string; // Vendor Name
  vendorId?: string; // Vendor ID
  startDate?: string;
  endDate?: string;
  totalValue: number;
  status: 'active' | 'expired' | 'pending';
  terms?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
