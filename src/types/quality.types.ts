export type QualityTab =
  | "checks"
  | "control-points"
  | "alerts"
  | "teams"
  | "tags";

export interface QualityItem {
  _id: string;
  location?: string;
  [key: string]: any;
}

export interface FetchQualityArgs {
  tab: QualityTab;
  filters?: Record<string, any>;
}

export interface MutateQualityArgs {
  tab: QualityTab;
  id?: string;
  payload?: any;
}

// Quality Check specific types
export type QualityCheckOperation = 'incoming' | 'manufacturing' | 'delivery' | 'storage';
export type QualityCheckResult = 'pass' | 'fail' | 'pending';

// Control Point specific types
export type ControlPointOperation = 'manufacturing' | 'reception' | 'delivery' | 'storage';
export type ControlPointType = 'all-operations' | 'random' | 'periodic';
export type CheckType = 'text' | 'measurement' | 'pass-fail' | 'picture';

export interface ControlPoint {
  _id: string;
  controlPointId: string;
  controlPointName: string;
  operationType: ControlPointOperation;
  product: string;
  qualityTeamId: string;
  controlType: ControlPointType;
  frequency?: number | null;
  instruction: string;
  responsible: string;
  typeOfCheck: CheckType;
  toleranceMin?: number | null;
  toleranceMax?: number | null;
  active: boolean;
  location?: string;
  organisationId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateControlPointData {
  controlPointName: string;
  operationType: ControlPointOperation;
  product: string;
  qualityTeamId: string;
  controlType: ControlPointType;
  frequency?: number | null;
  instruction: string;
  responsible: string;
  typeOfCheck: CheckType;
  toleranceMin?: number | null;
  toleranceMax?: number | null;
  active?: boolean;
  location?: string;
}

export interface UpdateControlPointData {
  controlPointName?: string;
  operationType?: ControlPointOperation;
  product?: string;
  qualityTeamId?: string;
  controlType?: ControlPointType;
  frequency?: number | null;
  instruction?: string;
  responsible?: string;
  typeOfCheck?: CheckType;
  toleranceMin?: number | null;
  toleranceMax?: number | null;
  active?: boolean;
  location?: string;
}

export interface ControlPointFilters {
  organisationId: string;
  page?: number;
  limit?: number;
  operationType?: string;
  controlType?: string;
  active?: string;
  search?: string;
  location?: string;
}

export interface QualityCheck {
  _id: string;
  checkId: string;
  product: string;
  batchNumber?: string;
  relatedOperation: QualityCheckOperation;
  testType?: string;
  quantityChecked: number;
  measurementValue?: number | null;
  result: QualityCheckResult;
  performedBy: string;
  notes?: string;
  photo?: string;
  location?: string;
  organisationId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQualityCheckData {
  product: string;
  batchNumber?: string;
  relatedOperation: QualityCheckOperation;
  testType?: string;
  quantityChecked: number;
  measurementValue?: number | null;
  result: QualityCheckResult;
  performedBy: string;
  notes?: string;
  photo?: string;
  location?: string;
}

export interface UpdateQualityCheckData {
  product?: string;
  batchNumber?: string;
  relatedOperation?: QualityCheckOperation;
  testType?: string;
  quantityChecked?: number;
  measurementValue?: number | null;
  result?: QualityCheckResult;
  performedBy?: string;
  notes?: string;
  photo?: string;
}

export interface QualityCheckFilters {
  organisationId: string;
  page?: number;
  limit?: number;
  result?: string;
  operation?: string;
  search?: string;
  location?: string;
}

// Quality Alert specific types
export type QualityAlertOperation = 'reception' | 'manufacturing' | 'delivery' | 'storage';
export type QualityAlertPriority = 'low' | 'medium' | 'high' | 'urgent';
export type QualityAlertStatus = 'new' | 'in-progress' | 'resolved' | 'cancelled';
export type QualityAlertRootCause = 'material-defect' | 'process-issue' | 'equipment-failure' | 'human-error' | 'environmental' | '';

export interface QualityAlert {
  _id: string;
  alertId: string;
  alertNumber: string;
  product: string;
  operation: QualityAlertOperation;
  priority: QualityAlertPriority;
  status: QualityAlertStatus;
  description: string;
  rootCause?: QualityAlertRootCause;
  responsibleTeam: string;
  assignedTo: string;
  nextActionDate?: string | null;
  tags: string[];
  attachments: string[];
  location?: string;
  organisationId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQualityAlertData {
  product: string;
  operation: QualityAlertOperation;
  priority?: QualityAlertPriority;
  status?: QualityAlertStatus;
  description: string;
  rootCause?: QualityAlertRootCause;
  responsibleTeam: string;
  assignedTo: string;
  nextActionDate?: string | null;
  tags?: string[];
  attachments?: string[];
  location?: string;
}

export interface UpdateQualityAlertData {
  product?: string;
  operation?: QualityAlertOperation;
  priority?: QualityAlertPriority;
  status?: QualityAlertStatus;
  description?: string;
  rootCause?: QualityAlertRootCause;
  responsibleTeam?: string;
  assignedTo?: string;
  nextActionDate?: string | null;
  tags?: string[];
  attachments?: string[];
  location?: string;
}

export interface QualityAlertFilters {
  organisationId: string;
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  operation?: string;
  search?: string;
  location?: string;
}

// Quality Tag specific types
export type QualityTagColor = 
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray';

export type QualityTagCategory =
  | 'defect-type'
  | 'severity'
  | 'process'
  | 'product'
  | 'inspection';

export interface QualityTag {
  _id: string;
  tagId: string;
  name: string;
  category?: string;
  description?: string;
  color: QualityTagColor;
  isActive: boolean;
  usageCount: number;
  location?: string;
  organisationId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQualityTagData {
  name: string;
  category?: string;
  description?: string;
  color: QualityTagColor;
  isActive?: boolean;
  location?: string;
}

export interface UpdateQualityTagData {
  name?: string;
  category?: string;
  description?: string;
  color?: QualityTagColor;
  isActive?: boolean;
  location?: string;
}

export interface QualityTagFilters {
  organisationId: string;
  page?: number;
  limit?: number;
  category?: string;
  color?: string;
  isActive?: string;
  search?: string;
  location?: string;
}

// Quality Team specific types
export type QualityTeamDepartment = 'quality-control' | 'production' | 'incoming-inspection' | 'final-inspection' | 'laboratory';

export interface QualityTeamUser {
  userId: string;
  name: string;
  role: string;
  email: string;
}

export interface QualityTeam {
  _id: string;
  teamId: string;
  teamName: string;
  teamLeader: string;
  department: QualityTeamDepartment;
  email: string;
  phone?: string;
  relatedProducts: string[];
  assignedUsers: QualityTeamUser[];
  isActive: boolean;
  location?: string;
  organisationId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQualityTeamData {
  teamName: string;
  teamLeader: string;
  department: QualityTeamDepartment;
  email: string;
  phone?: string;
  relatedProducts?: string[];
  assignedUsers?: QualityTeamUser[];
  isActive?: boolean;
  location?: string;
}

export interface UpdateQualityTeamData {
  teamName?: string;
  teamLeader?: string;
  department?: QualityTeamDepartment;
  email?: string;
  phone?: string;
  relatedProducts?: string[];
  assignedUsers?: QualityTeamUser[];
  isActive?: boolean;
  location?: string;
}

export interface QualityTeamFilters {
  organisationId: string;
  page?: number;
  limit?: number;
  department?: string;
  isActive?: string;
  search?: string;
  location?: string;
}
