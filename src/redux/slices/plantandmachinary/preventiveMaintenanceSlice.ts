"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

/* TYPES */
export interface PreventiveMaintenancePlan {
  _id?: string;
  id: string;
  equipmentCode: string;
  equipmentName?: string;
  planType: "Time-based" | "Usage-based" | "Condition-based";
  intervalValue: number;
  intervalUnit: string;
  lastServiceDate: string;
  nextServiceDate: string;
  assignedTechnician: string;
  estimatedHours: number;
  estimatedCost: number;
  status: "Scheduled" | "Completed" | "Overdue" | "In-Progress";
  location?: {
    _id: string;
    name: string;
  };
  remarks?: string;
  completionDate?: string;
  actualHours?: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PreventiveMaintenanceStats {
  total: number;
  scheduled: number;
  completed: number;
  overdue: number;
  inProgress: number;
  totalEstimatedCost: number;
  totalActualCost: number;
}

/* STATE */
interface PreventiveMaintenanceState {
  plans: PreventiveMaintenancePlan[];
  stats: PreventiveMaintenanceStats | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: PreventiveMaintenanceState = {
  plans: [],
  stats: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

/* API CALLS */

// FETCH WITH PAGINATION
export const fetchPreventiveMaintenancePlans = createAsyncThunk(
  "preventiveMaintenance/fetchPlans",
  async (
    { 
      page = 1, 
      limit = 10, 
      location, 
      status, 
      search 
    }: { 
      page: number; 
      limit: number; 
      location?: string; 
      status?: string; 
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
      if (search) params.append("search", search);

      const res = await api.get(`/preventive-maintenance?${params.toString()}`);
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch plans");
    }
  }
);

// FETCH STATS
export const fetchPreventiveMaintenanceStats = createAsyncThunk(
  "preventiveMaintenance/fetchStats",
  async (_, thunkAPI) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.get(`/preventive-maintenance/stats?organisationId=${organisationId}`);
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
  }
);

// CREATE
export const createPreventiveMaintenancePlan = createAsyncThunk(
  "preventiveMaintenance/createPlan",
  async (payload: Partial<PreventiveMaintenancePlan>, thunkAPI) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post("/preventive-maintenance/create", {
        ...payload,
        organisationId,
      });
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to create plan");
    }
  }
);

// UPDATE
export const updatePreventiveMaintenancePlan = createAsyncThunk(
  "preventiveMaintenance/updatePlan",
  async ({ id, data }: { id: string; data: Partial<PreventiveMaintenancePlan> }, thunkAPI) => {
    try {
      const res = await api.put(`/preventive-maintenance/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to update plan");
    }
  }
);

// MARK AS COMPLETED
export const markPreventiveMaintenanceCompleted = createAsyncThunk(
  "preventiveMaintenance/markCompleted",
  async ({ 
    id, 
    actualHours, 
    actualCost, 
    remarks 
  }: { 
    id: string; 
    actualHours?: number; 
    actualCost?: number; 
    remarks?: string; 
  }, thunkAPI) => {
    try {
      const res = await api.put(`/preventive-maintenance/${id}/complete`, {
        actualHours,
        actualCost,
        remarks
      });
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to mark as completed");
    }
  }
);

// DELETE
export const deletePreventiveMaintenancePlan = createAsyncThunk(
  "preventiveMaintenance/deletePlan",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/preventive-maintenance/${id}`);
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to delete plan");
    }
  }
);

/* SLICE */
const preventiveMaintenanceSlice = createSlice({
  name: "preventiveMaintenance",
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
    /* FETCH PLANS */
    builder.addCase(fetchPreventiveMaintenancePlans.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(fetchPreventiveMaintenancePlans.fulfilled, (state, action) => {
      state.loading = false;
      state.plans = action.payload.data;
      state.total = action.payload.pagination.total;
      state.page = action.payload.pagination.page;
      state.limit = action.payload.pagination.limit;
    });

    builder.addCase(fetchPreventiveMaintenancePlans.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* FETCH STATS */
    builder.addCase(fetchPreventiveMaintenanceStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });

    /* CREATE */
    builder.addCase(createPreventiveMaintenancePlan.fulfilled, (state, action) => {
      state.plans.unshift(action.payload);
      state.total += 1;
    });

    /* UPDATE */
    builder.addCase(updatePreventiveMaintenancePlan.fulfilled, (state, action) => {
      const index = state.plans.findIndex(
        (plan) => plan._id === action.payload._id
      );
      if (index !== -1) state.plans[index] = action.payload;
    });

    /* MARK COMPLETED */
    builder.addCase(markPreventiveMaintenanceCompleted.fulfilled, (state, action) => {
      const index = state.plans.findIndex(
        (plan) => plan._id === action.payload._id
      );
      if (index !== -1) state.plans[index] = action.payload;
    });

    /* DELETE */
    builder.addCase(deletePreventiveMaintenancePlan.fulfilled, (state, action) => {
      state.plans = state.plans.filter(
        (plan) => plan._id !== action.payload
      );
      state.total -= 1;
    });
  },
});

/* EXPORTS */
export const { setPage, setLimit, clearError } = preventiveMaintenanceSlice.actions;
export default preventiveMaintenanceSlice.reducer;