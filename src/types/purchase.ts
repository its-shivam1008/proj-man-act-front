export interface Vendor {
  id: string;
  vendorName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
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
  product: string;
  quantity: number;
  unitPrice: number;
  taxes: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
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
  id: string;
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
