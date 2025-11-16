

export type ProjectStatus =
  | "planning"
  | "active"
  | "on-hold"
  | "completed"
  | "cancelled";

export type ProjectType =
  | "construction"
  | "manufacturing"
  | "internal"
  | "client-based"
  | "other";

export interface Project {
  _id: string;
  code: string;
  name: string;
  description: string;
  clientOrDepartment: string;
  type: ProjectType;
  location?: string;
  budget?: number;
  expectedRevenue?: number;
  duration?: string;
  manager?: string;
  assignedTeam?: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  progress: number;
  actualCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressUpdate {
  _id: string;
  projectId: string;
  wbsItemId?: string;
  date: string;
  percentComplete: number;
  labourHours: number;
  equipmentHours: number;
  materialUsed: string[];
  updatedBy: string;
  remarks?: string;
  createdAt: string;
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "active",
  "on-hold",
  "completed",
  "cancelled",
];

export const PROJECT_TYPES: ProjectType[] = [
  "construction",
  "manufacturing",
  "internal",
  "client-based",
  "other",
];