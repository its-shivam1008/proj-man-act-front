export interface Milestone {
  _id?: string;
  name: string;
  percent?: number;
  value?: number;
  billed?: number;
  balance?: number;
  projectId?: string | null;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  _id?: string;
  milestoneId?: string | null;
  milestoneName?: string;
  date: string;
  amount: number;
  status?: "Pending" | "Approved" | "Paid" | "Cancelled";
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}
