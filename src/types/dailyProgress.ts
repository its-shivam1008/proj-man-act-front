export interface Photo {
  id: string;
  dataUrl: string;
  gps?: {
    lat: number;
    lng: number;
  };
}

export interface DailyProgressItem {
  _id?: string;
  date: string;
  task?: string;
  percentComplete: number;
  materialUsed?: string;
  labourHours?: number;
  machineHours?: number;
  remarks?: string;
  photos?: Photo[];
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
