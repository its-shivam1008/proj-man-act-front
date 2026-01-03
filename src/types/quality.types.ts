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
