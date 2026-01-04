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
  serialLotNumber?: string;
  customerName: string;
  repairType: "warranty" | "paid" | "internal";
  priority: "low" | "medium" | "high";
  rootCause?: "damage" | "defect" | "misuse" | "unknown";
  issueDescription: string;
  status:
    | "draft"
    | "confirmed"
    | "under-repair"
    | "testing"
    | "done"
    | "cancelled";
  teamId?: string;
  technicianId?: string;
  assignedTechnician?: string;
  requestedDate?: string;
  expectedCompletion?: string;
  sourceDocument?: string;
  warrantyType?: "in-warranty" | "extended" | "expired";
  isChargeable?: boolean;
  totalCost?: number;
  partsCost?: number;
  laborCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Repair Team ---------- */
export interface TeamMember {
  technicianId: string;
  name: string;
  hourlyRate?: number;
  availability?: 'available' | 'busy' | 'unavailable';
}

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
  members: TeamMember[];
}

/* ---------- Repair Template ---------- */
export interface RepairTemplate {
  _id: string;
  organisationId: string;
  location: string;
  templateName: string;
  productCategory: string;
  commonIssue: string;
  estimatedDuration: number;
  defaultParts: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
