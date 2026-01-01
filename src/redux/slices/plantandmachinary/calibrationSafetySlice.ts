"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

/* TYPES */
export interface OperatorTraining {
  operatorName: string;
  licenseNumber?: string;
  validUntil?: string;
}

export interface CalibrationSafetyRecord {
  _id?: string;
  id: string;
  equipmentId: string;
  equipmentName: string;
  certificationType: "calibration" | "safety-inspection" | "load-test" | "pressure-test" | "other";
  certificateNumber: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  nextDueDate: string;
  inspectionAgency: string;
  result: "pass" | "fail" | "conditional";
  findings?: string;
  recommendations?: string;
  cost: number;
  operatorTraining: OperatorTraining[];
  status: "valid" | "expiring-soon" | "expired" | "pending";
  location?: {
    _id: string;
    name: string;
  };
  documents: string[];
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalibrationSafetyStats {
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
  pending: number;
  passed: number;
  failed: number;
  conditional: number;
  totalCost: number;
}

/* STATE */
interface CalibrationSafetyState {
  records: CalibrationSafetyRecord[];
  stats: CalibrationSafetyStats | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: CalibrationSafetyState = {
  records: [],
  stats: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

/* API CALLS */

// FETCH WITH PAGINATION
export const fetchCalibrationSafetyRecords = createAsyncThunk(
  "calibrationSafety/fetchRecords",
  async (
    { 
      page = 1, 
      limit = 10, 
      location, 
      status, 
      certificationType,
      result,
      search 
    }: { 
      page: number; 
      limit: number; 
      location?: string; 
      status?: string; 
      certificationType?: string;
      result?: string;
      search?: string; 
    },
    thunkAPI
  ) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        organisationId: organisationId || "",
      });

      if (location) params.append("location", location);
      if (status) params.append("status", status);
      if (certificationType) params.append("certificationType", certificationType);
      if (result) params.append("result", result);
      if (search) params.append("search", search);

      const res = await api.get(`/calibration-safety?${params.toString()}`);
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch records");
    }
  }
);

// FETCH STATS
export const fetchCalibrationSafetyStats = createAsyncThunk(
  "calibrationSafety/fetchStats",
  async (_, thunkAPI) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.get(`/calibration-safety/stats?organisationId=${organisationId}`);
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
  }
);

// CREATE
export const createCalibrationSafetyRecord = createAsyncThunk(
  "calibrationSafety/createRecord",
  async (payload: Partial<CalibrationSafetyRecord>, thunkAPI) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post("/calibration-safety/create", {
        ...payload,
        organisationId,
      });
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to create record");
    }
  }
);

// UPDATE
export const updateCalibrationSafetyRecord = createAsyncThunk(
  "calibrationSafety/updateRecord",
  async ({ id, data }: { id: string; data: Partial<CalibrationSafetyRecord> }, thunkAPI) => {
    try {
      const res = await api.put(`/calibration-safety/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to update record");
    }
  }
);

// RENEW CERTIFICATE
export const renewCertificate = createAsyncThunk(
  "calibrationSafety/renewCertificate",
  async ({ 
    id, 
    expiryDate, 
    nextDueDate, 
    certificateNumber, 
    cost, 
    remarks 
  }: { 
    id: string; 
    expiryDate: string; 
    nextDueDate: string; 
    certificateNumber: string; 
    cost?: number; 
    remarks?: string; 
  }, thunkAPI) => {
    try {
      const res = await api.put(`/calibration-safety/${id}/renew`, {
        expiryDate,
        nextDueDate,
        certificateNumber,
        cost,
        remarks
      });
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to renew certificate");
    }
  }
);

// DELETE
export const deleteCalibrationSafetyRecord = createAsyncThunk(
  "calibrationSafety/deleteRecord",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/calibration-safety/${id}`);
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to delete record");
    }
  }
);

/* SLICE */
const calibrationSafetySlice = createSlice({
  name: "calibrationSafety",
  initialState,
  reducers: {
    setPage(state, action) {
      state.page = action.payload;
    },
    setLimit(state, action) {
      state.limit = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    /* FETCH RECORDS */
    builder.addCase(fetchCalibrationSafetyRecords.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(fetchCalibrationSafetyRecords.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload.data;
      state.total = action.payload.pagination.total;
      state.page = action.payload.pagination.page;
      state.limit = action.payload.pagination.limit;
    });

    builder.addCase(fetchCalibrationSafetyRecords.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* FETCH STATS */
    builder.addCase(fetchCalibrationSafetyStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });

    /* CREATE */
    builder.addCase(createCalibrationSafetyRecord.fulfilled, (state, action) => {
      state.records.unshift(action.payload);
      state.total += 1;
    });

    /* UPDATE */
    builder.addCase(updateCalibrationSafetyRecord.fulfilled, (state, action) => {
      const index = state.records.findIndex(
        (record) => record._id === action.payload._id
      );
      if (index !== -1) state.records[index] = action.payload;
    });

    /* RENEW CERTIFICATE */
    builder.addCase(renewCertificate.fulfilled, (state, action) => {
      const index = state.records.findIndex(
        (record) => record._id === action.payload._id
      );
      if (index !== -1) state.records[index] = action.payload;
    });

    /* DELETE */
    builder.addCase(deleteCalibrationSafetyRecord.fulfilled, (state, action) => {
      state.records = state.records.filter(
        (record) => record._id !== action.payload
      );
      state.total -= 1;
    });
  },
});

/* EXPORTS */
export const { setPage, setLimit, clearError } = calibrationSafetySlice.actions;
export default calibrationSafetySlice.reducer;