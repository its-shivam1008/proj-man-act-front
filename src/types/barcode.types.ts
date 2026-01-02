export interface BarcodeScan {
  _id: string;
  organisationId: string;
  location: string;
  code: string;
  item: string;
  action: string;
  status: "success" | "warning" | "error";
  createdAt: string;
}
