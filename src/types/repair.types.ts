export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ---------- Repair Order ---------- */
export interface RepairOrder {
  _id: string;
  organisationId: string;
  location: string;
  productId: string;
  quantity: number;
  customerName: string;
  repairType: "warranty" | "paid" | "internal";
  priority: "low" | "medium" | "high";
  status:
    | "draft"
    | "confirmed"
    | "under-repair"
    | "testing"
    | "done"
    | "cancelled";
  teamId?: string;
  technicianId?: string;
  requestedDate?: string;
  expectedCompletion?: string;
  notes?: string;
  createdAt: string;
}

/* ---------- Repair Team ---------- */
export interface RepairTeam {
  _id: string;
  organisationId: string;
  location: string;
  teamName: string;
  teamLead: string;
  contactInfo: {
    email: string;
    phone?: string;
  };
  members: any[];
}

/* ---------- Repair Template ---------- */
export interface RepairTemplate {
  _id: string;
  organisationId: string;
  templateName: string;
  productCategory: string;
  commonIssue: string;
  estimatedDuration: number;
  defaultParts: string[];
  isActive: boolean;
}
