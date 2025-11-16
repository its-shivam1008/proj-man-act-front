
export interface MRSItem {
  _id: string;
  projectId?: string;
  task?: string;
  item: string;
  quantity: number;
  requiredDate?: string;
  status?: "open" | "sent" | "ordered" | "received" | "cancelled";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
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
