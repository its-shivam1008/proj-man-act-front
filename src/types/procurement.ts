
export interface MRSItem {
  _id: string;
  projectId?: string;
  task?: string;
  item: string;
  materialId?: string; // Add materialId field
  quantity: number;
  price?: number;
  requiredDate?: string;
  status?: "open" | "sent" | "ordered" | "received" | "cancelled";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // 🚀 NEW: Delivery Status Tracking Fields
  deliveryStatus?: "pending" | "sent" | "in-transit" | "received" | "returned";
  deliveryDetails?: {
    sentDate?: string;
    inTransitDate?: string;
    receivedDate?: string;
    returnedDate?: string;
    transportDetails?: {
      method?: string;
      vehicleNo?: string;
      driverName?: string;
      driverContact?: string;
      estimatedDelivery?: string;
    };
    receivedBy?: string;
    receivedQuantity?: number;
    returnedQuantity?: number;
    deliveryNotes?: string;
    deliveryImages?: string[];
  };
  
  // 🚀 NEW: Purchase Request Status Tracking Fields
  purchaseRequestStatus?: "not-sent" | "sent" | "processed";
  purchaseRequestDetails?: {
    sentDate?: string;
    sentBy?: string;
    processedDate?: string;
    processedBy?: string;
    remarks?: string;
  };
  
  statusHistory?: Array<{
    status?: string;
    deliveryStatus?: string;
    purchaseRequestStatus?: string;
    changedBy?: string;
    changedAt?: string;
    remarks?: string;
  }>;
}

export interface PurchaseRequest {
  _id: string;
  mrsIds: string[];
  createdAt: string;
  status: "open" | "converted" | "closed";
}

export interface POItem {
  mrsId: string;
  item: string;
  qty: number;
}

export interface PurchaseOrder {
  _id: string;
  prId: string;
  supplier?: string;
  poNo?: string;
  items: POItem[];
  createdAt: string;
  deliveryDate?: string;
  received?: number;
  issued?: number;
  status?: "open" | "delivered" | "partial" | "closed";
}

export interface InventoryItem {
  _id: string;
  item: string;
  qty: number;
  uom?: string;
  location?: string;
}
