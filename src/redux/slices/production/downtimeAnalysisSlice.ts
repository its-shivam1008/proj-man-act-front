import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* ================= TYPES ================= */

export interface DowntimeReport {
  _id: string;
  organisationId: string;
  workCenterId: string;
  workCenterName: string;
  date: string;
  shift: "morning" | "afternoon" | "night";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  downtimeType: string;
  category: "planned" | "unplanned";
  reason: string;
  description?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  reportedBy?: string;
  reportedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  status: "reported" | "investigating" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  costImpact: number;
  productionLoss: number;
  createdAt: string;
  updatedAt: string;
}

export interface DowntimeAnalytics {
  summary: {
    totalDowntime: number;
    totalIncidents: number;
    plannedDowntime: number;
    unplannedDowntime: number;
    totalCostImpact: number;
    totalProductionLoss: number;
    avgDowntimePerIncident: number;
    criticalIncidents: number;
    highPriorityIncidents: number;
  };
  downtimeByType: Array<{
    _id: string;
    totalMinutes: number;
    incidents: number;
    avgDuration: number;
  }>;
  downtimeByWorkCenter: Array<{
    _id: string;
    workCenterName: string;
    totalMinutes: number;
    incidents: number;
    plannedMinutes: number;
    unplannedMinutes: number;
  }>;
  dailyTrend: Array<{
    _id: string;
    totalMinutes: number;
    incidents: number;
    plannedMinutes: number;
    unplannedMinutes: number;
  }>;
  monthlySummary: Array<{
    _id: string;
    totalMinutes: number;
    incidents: number;
    avgIncidentDuration: number;
  }>;
}

/* ================= ASYNC THUNKS ================= */

// CRUD Operations
export const fetchDowntimeReports = createAsyncThunk(
  "downtimeAnalysis/fetchReports",
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/downtime-reports", { params: filters });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch downtime reports");
    }
  }
);

export const createDowntimeReport = createAsyncThunk(
  "downtimeAnalysis/createReport",
  async (data: Partial<DowntimeReport>, { rejectWithValue }) => {
    try {
      const res = await axios.post("/downtime-reports", data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create downtime report");
    }
  }
);

export const updateDowntimeReport = createAsyncThunk(
  "downtimeAnalysis/updateReport",
  async ({ id, data }: { id: string; data: Partial<DowntimeReport> }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/downtime-reports/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update downtime report");
    }
  }
);

export const deleteDowntimeReport = createAsyncThunk(
  "downtimeAnalysis/deleteReport",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/downtime-reports/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete downtime report");
    }
  }
);

// Analytics
export const fetchDowntimeAnalytics = createAsyncThunk(
  "downtimeAnalysis/fetchAnalytics",
  async (dateRange: { startDate?: string; endDate?: string } = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/downtime-analytics", { params: dateRange });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch downtime analytics");
    }
  }
);

// Sample Data
export const generateSampleData = createAsyncThunk(
  "downtimeAnalysis/generateSampleData",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.post("/downtime-sample-data");
      return res.data.message;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to generate sample data");
    }
  }
);

/* ================= SLICE ================= */

interface DowntimeAnalysisState {
  reports: DowntimeReport[];
  analytics: DowntimeAnalytics | null;
  loading: boolean;
  error: string | null;
}

const initialState: DowntimeAnalysisState = {
  reports: [],
  analytics: null,
  loading: false,
  error: null,
};

const downtimeAnalysisSlice = createSlice({
  name: "downtimeAnalysis",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAnalytics: (state) => {
      state.analytics = null;
    },
  },
  extraReducers: (builder) => {
    /* ===== FETCH REPORTS ===== */
    builder.addCase(fetchDowntimeReports.fulfilled, (state, action) => {
      state.loading = false;
      state.reports = action.payload;
    });

    /* ===== CREATE REPORT ===== */
    builder.addCase(createDowntimeReport.fulfilled, (state, action) => {
      state.loading = false;
      state.reports.unshift(action.payload);
    });

    /* ===== UPDATE REPORT ===== */
    builder.addCase(updateDowntimeReport.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.reports.findIndex(r => r._id === action.payload._id);
      if (index !== -1) {
        state.reports[index] = action.payload;
      }
    });

    /* ===== DELETE REPORT ===== */
    builder.addCase(deleteDowntimeReport.fulfilled, (state, action) => {
      state.loading = false;
      state.reports = state.reports.filter(r => r._id !== action.payload);
    });

    /* ===== FETCH ANALYTICS ===== */
    builder.addCase(fetchDowntimeAnalytics.fulfilled, (state, action) => {
      state.loading = false;
      state.analytics = action.payload;
    });

    /* ===== GENERATE SAMPLE DATA ===== */
    builder.addCase(generateSampleData.fulfilled, (state) => {
      state.loading = false;
    });

    /* ===== LOADING STATES ===== */
    builder.addMatcher(
      (action) =>
        action.type.startsWith("downtimeAnalysis/") &&
        action.type.endsWith("/pending"),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    /* ===== ERROR STATES ===== */
    builder.addMatcher(
      (action) =>
        action.type.startsWith("downtimeAnalysis/") &&
        action.type.endsWith("/rejected"),
      (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      }
    );
  },
});

export const { clearError, clearAnalytics } = downtimeAnalysisSlice.actions;
export default downtimeAnalysisSlice.reducer;