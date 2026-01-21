import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* =========================
   TYPES
========================= */

export interface StandardCost {
  _id: string;
  productId: string;
  productName?: string;
  unitQty: number;
  material: number;
  labour: number;
  machine: number;
  overheads: number;
  updatedAt?: string;
}

export interface ActualCost {
  _id: string;
  workOrderId?: string;
  batchNo?: string;
  productId: string;
  producedQty: number;
  material: number;
  labour: number;
  machine: number;
  overheads: number;
  startTime?: string;
  endTime?: string;
  remarks?: string;
  recordedAt?: string;
}

export interface PerfMetric {
  _id: string;
  productId?: string;
  date: string;
  yieldPct?: number;
  scrapPct?: number;
  machineUtilPct?: number;
  labourEffPct?: number;
  notes?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CostingState {
  standards: StandardCost[];
  actuals: ActualCost[];
  metrics: PerfMetric[];
  loading: boolean;
  error: string | null;
  // Pagination states
  standardsPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  actualsPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  metricsPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/* =========================
   INITIAL STATE
========================= */

const initialState: CostingState = {
  standards: [],
  actuals: [],
  metrics: [],
  loading: false,
  error: null,
  // Pagination states
  standardsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  actualsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  metricsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  }
};

/* =========================
   THUNKS – STANDARDS
========================= */

export const fetchStandards = createAsyncThunk(
  "costing/fetchStandards",
  async (
    { location, page = 1, limit = 10, search = "" }:
      { location?: string; page?: number; limit?: number; search?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      // ✅ Read directly from localStorage
      const organisationId =
        typeof window !== "undefined"
          ? localStorage.getItem("organisationId")
          : null;

      // ✅ Stop API call if not present
      if (!organisationId) {
        return rejectWithValue("organisationId not found");
      }

      const params: any = { page, limit, search };
      if (location) params.location = location;

      const res = await axios.get("/api/costing/standards", {
        params,
        headers: {
          organisationid: organisationId, // 🔥 BACKEND MATCH
        },
      });

      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);


export const createStandard = createAsyncThunk(
  "costing/createStandard",
  async (
    { data, organisationId }:
      { data: Partial<StandardCost>; organisationId: string }
  ) => {
    const res = await axios.post(
      "/api/costing/standards",
      data,
      { headers: { organisationId } }
    );
    return res.data.data;
  }
);


export const updateStandard = createAsyncThunk(
  "costing/updateStandard",
  async ({ id, data, organisationId }: any) => {
    const res = await axios.put(
      `/api/costing/standards/${id}`,   // ✅ ID IN URL
      data,                             // ✅ BODY ONLY
      {
        headers: {
          organisationId,
        },
      }
    );
    return res.data.data;
  }
);



export const deleteStandard = createAsyncThunk(
  "costing/deleteStandard",
  async ({ id, organisationId }: any) => {
    await axios.delete(
      `/api/costing/standards/${id}`,   // ✅ ID IN URL
      {
        headers: {
          organisationId,
        },
      }
    );
    return id;
  }
);


/* =========================
   THUNKS – ACTUALS
========================= */

export const fetchActuals = createAsyncThunk(
  "costing/fetchActuals",
  async ({ location, page = 1, limit = 10, search = "" } = {}, { rejectWithValue }) => {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) return rejectWithValue("organisationId not found");

    const res = await axios.get("/api/costing/actuals", {
      params: { page, limit, search, location },
      headers: { organisationid: organisationId },
    });

    return res.data;
  }
);


export const createActual = createAsyncThunk(
  "costing/createActual",
  async (payload: Partial<ActualCost>, { rejectWithValue }) => {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) return rejectWithValue("organisationId not found");

    const res = await axios.post("/api/costing/actuals", payload, {
      headers: { organisationid: organisationId },
    });

    return res.data.data;
  }
);


export const updateActual = createAsyncThunk(
  "costing/updateActual",
  async ({ id, data }: { id: string; data: Partial<ActualCost> }, { rejectWithValue }) => {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) return rejectWithValue("organisationId not found");

    const res = await axios.put(`/api/costing/actuals/${id}`, data, {
      headers: { organisationid: organisationId },
    });

    return res.data.data;
  }
);



export const deleteActual = createAsyncThunk(
  "costing/deleteActual",
  async (id: string, { rejectWithValue }) => {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) return rejectWithValue("organisationId not found");

    await axios.delete(`/api/costing/actuals/${id}`, {
      headers: { organisationid: organisationId },
    });

    return id;
  }
);



/* =========================
   THUNKS – METRICS
========================= */

export const fetchMetrics = createAsyncThunk(
  "costing/fetchMetrics",
  async (
    { location, page = 1, limit = 10, search = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const organisationId =
        typeof window !== "undefined"
          ? localStorage.getItem("organisationId")
          : null;

      if (!organisationId) {
        return rejectWithValue("organisationId not found");
      }

      const params: any = { page, limit, search };
      if (location) params.location = location;

      const res = await axios.get("/api/costing/metrics", {
        params,
        headers: { organisationid: organisationId },
      });

      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);


export const createMetric = createAsyncThunk(
  "costing/createMetric",
  async (payload: Partial<PerfMetric>, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      if (!organisationId) {
        return rejectWithValue("organisationId not found");
      }

      const res = await axios.post(
        "/api/costing/metrics",
        payload,
        {
          headers: {
            organisationid: organisationId, // ✅ REQUIRED
          },
        }
      );

      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateMetric = createAsyncThunk(
  "costing/updateMetric",
  async (
    { id, data }: { id: string; data: Partial<PerfMetric> },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      if (!organisationId) {
        return rejectWithValue("organisationId not found");
      }

      const res = await axios.put(
        `/api/costing/metrics/${id}`,
        data,
        {
          headers: {
            organisationid: organisationId, // ✅ REQUIRED
          },
        }
      );

      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);


export const deleteMetric = createAsyncThunk(
  "costing/deleteMetric",
  async (id: string, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      if (!organisationId) {
        return rejectWithValue("organisationId not found");
      }

      await axios.delete(`/api/costing/metrics/${id}`, {
        headers: {
          organisationid: organisationId, // ✅ REQUIRED
        },
      });

      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* =========================
   SLICE
========================= */

const costingSlice = createSlice({
  name: "costingPerformance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ===== STANDARDS ===== */
      .addCase(fetchStandards.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Properly handle backend response structure
        state.standards = action.payload.data || [];
        if (action.payload.pagination) {
          state.standardsPagination = {
            currentPage: action.payload.pagination.currentPage,
            totalPages: action.payload.pagination.totalPages,
            totalItems: action.payload.pagination.totalItems,
            itemsPerPage: action.payload.pagination.itemsPerPage
          };
        }
      })
      .addCase(createStandard.fulfilled, (state, action) => {
        state.standards.unshift(action.payload);
      })
      .addCase(updateStandard.fulfilled, (state, action) => {
        const i = state.standards.findIndex(s => s._id === action.payload._id);
        if (i !== -1) state.standards[i] = action.payload;
      })
      .addCase(deleteStandard.fulfilled, (state, action) => {
        state.standards = state.standards.filter(s => s._id !== action.payload);
      })

      /* ===== ACTUALS ===== */
      .addCase(fetchActuals.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Properly handle backend response structure
        state.actuals = action.payload.data || [];
        if (action.payload.pagination) {
          state.actualsPagination = {
            currentPage: action.payload.pagination.currentPage,
            totalPages: action.payload.pagination.totalPages,
            totalItems: action.payload.pagination.totalItems,
            itemsPerPage: action.payload.pagination.itemsPerPage
          };
        }
      })
      .addCase(createActual.fulfilled, (state, action) => {
        state.actuals.unshift(action.payload);
      })
      .addCase(updateActual.fulfilled, (state, action) => {
        const i = state.actuals.findIndex(a => a._id === action.payload._id);
        if (i !== -1) state.actuals[i] = action.payload;
      })
      .addCase(deleteActual.fulfilled, (state, action) => {
        state.actuals = state.actuals.filter(a => a._id !== action.payload);
      })

      /* ===== METRICS ===== */
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIXED: Properly handle backend response structure
        state.metrics = action.payload.data || [];
        if (action.payload.pagination) {
          state.metricsPagination = {
            currentPage: action.payload.pagination.currentPage,
            totalPages: action.payload.pagination.totalPages,
            totalItems: action.payload.pagination.totalItems,
            itemsPerPage: action.payload.pagination.itemsPerPage
          };
        }
      })
      .addCase(createMetric.fulfilled, (state, action) => {
        state.metrics.unshift(action.payload);
      })
      .addCase(updateMetric.fulfilled, (state, action) => {
        const i = state.metrics.findIndex(m => m._id === action.payload._id);
        if (i !== -1) state.metrics[i] = action.payload;
      })
      .addCase(deleteMetric.fulfilled, (state, action) => {
        state.metrics = state.metrics.filter(m => m._id !== action.payload);
      })

      /* ===== LOADING & ERROR HANDLING ===== */
      .addMatcher(
        (action) => action.type.startsWith("costing/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("costing/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export default costingSlice.reducer;
