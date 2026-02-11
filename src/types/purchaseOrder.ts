export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: string;
  projectId?: string;

  rawMaterialId: string;
  rawMaterialName: string;

  quantity: number;
  poDate: string;

  location: string | { _id: string; name: string };
  locationName: string;

  status: "Draft" | "Approved" | "Rejected";
  createdAt: string;
}
