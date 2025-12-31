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
  async (params: { search?: string; status?: string; page?: number; limit?: number; location?: string } = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/work-centers", { params });
      return res.data;
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
export const fetchWorkCenterPerformance = createAsyncThunk(
  "workcenter/performance",
  async (params: { location?: string; page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const { location, page = 1, limit = 10, search = '' } = params;
      console.log("🔄 Fetching work center performance...", location ? `Location: ${location}` : "All locations", `Page: ${page}, Limit: ${limit}`);
      
      const queryParams: any = { page, limit };
      if (location && location !== 'all') queryParams.location = location;
      if (search) queryParams.search = search;
      
      const res = await axios.get("/work-centers/performance", { params: queryParams });
      console.log("✅ Performance data received:", res.data.data?.length, "work centers");
      return res.data;
    } catch (err: any) {
      console.error("❌ Performance fetch error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || "Failed to fetch analytics");
    }
  }
);

/* =======================
   STATE TYPE
======================= */

interface WorkCenterState {
  list: WorkCenter[];
  performance: WorkCenterPerformance[];
  analytics: {
    total: number;
    active: number;
    avgEfficiency: number;
  };
  loading: boolean;
  error: string | null;
  // Pagination state
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  // Performance pagination state
  performancePagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
export interface WorkCenterPerformance {
  id: string;
  workCenterId: string;
  workCenterName: string;
  location?: string | { _id: string; name: string }; // ✅ ADD LOCATION FIELD
  runTime: number;
  downtimeMin: number;
  produced: number;
  rejected: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

const initialState: WorkCenterState = {
  list: [],
  performance: [],
  analytics: {
    total: 0,
    active: 0,
    avgEfficiency: 0,
  },
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5
  },
  performancePagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  }
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
      state.list = action.payload.data?.map((w: any) => ({
        ...w,
        id: w._id, // ✅ normalize once
      })) || [];
      // Update pagination state
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      } else {
        // Fallback for backward compatibility
        state.pagination = {
          currentPage: action.payload.page || 1,
          totalPages: Math.ceil((action.payload.total || state.list.length) / (action.payload.limit || 5)),
          totalItems: action.payload.total || state.list.length,
          itemsPerPage: action.payload.limit || 5
        };
      }
    });

    /* ---------- CREATE ---------- */
    builder.addCase(createWorkCenter.fulfilled, (state, action) => {
      state.loading = false;
      state.list.unshift({
        ...action.payload,
        id: action.payload._id,
      });
    });

    /* ---------- UPDATE ---------- */
    builder.addCase(updateWorkCenter.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.list.findIndex(
        (w) => w.id === action.payload._id
      );
      if (index !== -1) {
        state.list[index] = {
          ...action.payload,
          id: action.payload._id,
        };
      }
    });

    /* ---------- DELETE ---------- */
    builder.addCase(deleteWorkCenter.fulfilled, (state, action) => {
      state.loading = false;
      state.list = state.list.filter(
        (w) => w.id !== action.payload
      );
    });

    /* ---------- PERFORMANCE REPORT ---------- */
    builder.addCase(fetchWorkCenterPerformance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(fetchWorkCenterPerformance.fulfilled, (state, action) => {
      state.loading = false;
      state.performance = action.payload.data?.map((p: any) => ({
        ...p,
        id: p.workCenterId,
      })) || [];
      
      // Update performance pagination state
      if (action.payload.pagination) {
        state.performancePagination = action.payload.pagination;
      }
    });

    /* ---------- LOADING & ERROR HANDLING ---------- */
    builder.addMatcher(
      (action) =>
        (action.type.startsWith("workCenters/") ||
          action.type.startsWith("workcenter/")) &&
        action.type.endsWith("/pending"),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      (action) =>
        (action.type.startsWith("workCenters/") ||
          action.type.startsWith("workcenter/")) &&
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
