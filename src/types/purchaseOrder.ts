export interface PurchaseOrderItem {
  projectId: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;

  poDate: string;

  location: string | { _id: string; name: string };
  locationName: string;

  items: PurchaseOrderItem[];   // 🔥 IMPORTANT

  status: "Draft" | "Sent to RFQ" | "Approved" | "Rejected";

  createdAt: string;
}
