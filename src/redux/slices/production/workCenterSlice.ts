import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* =======================
   TYPES
======================= */

export interface WorkCenterResource {
  id?: string;
  _id?: string;
  // Spare Parts
  sparePartId?: string;
  sparePartName?: string;
  sparePartQuantity?: number;
  
  // WBS Tasks
  wbsTaskId?: string;
  wbsTaskName?: string;
  wbsTaskDuration?: number;
  
  // Projects
  projectId?: string;
  projectName?: string;
  projectAllocation?: number;
  
  // Products
  productId?: string;
  productName?: string;
  productQuantity?: number;
  
  // Equipment
  equipmentId?: string;
  equipmentName?: string;
  equipmentCode?: string;
  
  // Machine
  machineId?: string;
  machineName?: string;
  machineCode?: string;
  machineConfig?: {
    inputs: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
    }>;
    personHours: number;
    output: {
      id: string;
      name: string;
      quantity: number;
      unit: string;
      isCustom?: boolean;
    } | null;
  };
  
  // Common fields
  resourceType: "sparePart" | "wbsTask" | "project" | "product" | "equipment" | "machine";
  priority?: "low" | "medium" | "high" | "critical";
  estimatedHours?: number;
  actualHours?: number;
  status?: "planned" | "in-progress" | "completed" | "on-hold";
  notes?: string;
  startDate?: string;
  endDate?: string;
}

export interface WorkCenter {
  _id: string;
  organisationId: string;
  code: string;
  name: string;
  description?: string;
  capacity: number;
  costPerHour: number;
  efficiency: number;
  status: "active" | "maintenance" | "inactive";
  shift: "single" | "double" | "triple";
  operatorCount: number;
  location?: {
    _id: string;
    name: string;
  };
  resources: WorkCenterResource[];
  projects?: Array<{
    id: string;
    projectId: string;
    projectName: string;
    projectAllocation: number;
    priority: string;
    estimatedHours: number;
    actualHours: number;
    status: string;
  }>;
  wbsTasks?: Array<{
    id: string;
    wbsTaskId: string;
    wbsTaskName: string;
    wbsTaskDuration: number;
    priority: string;
    estimatedHours: number;
    actualHours: number;
    status: string;
  }>;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/* =======================
   ASYNC THUNKS
======================= */

export const fetchWorkCenters = createAsyncThunk(
  "workCenters/fetch",
  async (params: { search?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/work-centers", { params });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch work centers");
    }
  }
);

export const createWorkCenter = createAsyncThunk(
  "workCenters/create",
  async (data: Partial<WorkCenter>, { rejectWithValue }) => {
    try {
      const res = await axios.post("/work-centers", data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create work center");
    }
  }
);

export const updateWorkCenter = createAsyncThunk(
  "workCenters/update",
  async ({ id, data }: { id: string; data: Partial<WorkCenter> }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/work-centers/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update work center");
    }
  }
);

export const deleteWorkCenter = createAsyncThunk(
  "workCenters/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/work-centers/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete work center");
    }
  }
);

export const fetchWorkCenterAnalytics = createAsyncThunk(
  "workCenters/analytics",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/work-centers/analytics/summary");
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch analytics");
    }
  }
);

/* =======================
   STATE TYPE
======================= */

interface WorkCenterState {
  list: WorkCenter[];
  analytics: {
    total: number;
    active: number;
    avgEfficiency: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: WorkCenterState = {
  list: [],
  analytics: {
    total: 0,
    active: 0,
    avgEfficiency: 0,
  },
  loading: false,
  error: null,
};

/* =======================
   SLICE
======================= */

const workCenterSlice = createSlice({
  name: "workCenters",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    /* ---------- FETCH ---------- */
    builder.addCase(fetchWorkCenters.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });

    /* ---------- CREATE ---------- */
    builder.addCase(createWorkCenter.fulfilled, (state, action) => {
      state.loading = false;
      state.list.unshift(action.payload);
    });

    /* ---------- UPDATE ---------- */
    builder.addCase(updateWorkCenter.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.list.findIndex(
        (w) => w._id === action.payload._id
      );
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    });

    /* ---------- DELETE ---------- */
    builder.addCase(deleteWorkCenter.fulfilled, (state, action) => {
      state.loading = false;
      state.list = state.list.filter(
        (w) => w._id !== action.payload
      );
    });

    /* ---------- ANALYTICS ---------- */
    builder.addCase(fetchWorkCenterAnalytics.fulfilled, (state, action) => {
      state.loading = false;
      state.analytics = action.payload;
    });

    /* ---------- LOADING & ERROR HANDLING ---------- */
    builder.addMatcher(
      (action) =>
        action.type.startsWith("workCenters/") &&
        action.type.endsWith("/pending"),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      (action) =>
        action.type.startsWith("workCenters/") &&
        action.type.endsWith("/rejected"),
      (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      }
    );
  },
});

export const { clearError } = workCenterSlice.actions;
export default workCenterSlice.reducer;
