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
  pagination: Pagination;
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
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

/* =========================
   THUNKS – STANDARDS
========================= */

export const fetchStandards = createAsyncThunk(
  "costing/fetchStandards",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/costing/standards");
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const createStandard = createAsyncThunk(
  "costing/createStandard",
  async (payload: Partial<StandardCost>, { rejectWithValue }) => {
    try {
      const res = await axios.post("/costing/standards", payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateStandard = createAsyncThunk(
  "costing/updateStandard",
  async (
    { id, data }: { id: string; data: Partial<StandardCost> },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.put(`/costing/standards/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const deleteStandard = createAsyncThunk(
  "costing/deleteStandard",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/costing/standards/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* =========================
   THUNKS – ACTUALS
========================= */

export const fetchActuals = createAsyncThunk(
  "costing/fetchActuals",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/costing/actuals");
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const createActual = createAsyncThunk(
  "costing/createActual",
  async (payload: Partial<ActualCost>, { rejectWithValue }) => {
    try {
      const res = await axios.post("/costing/actuals", payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateActual = createAsyncThunk(
  "costing/updateActual",
  async (
    { id, data }: { id: string; data: Partial<ActualCost> },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.put(`/costing/actuals/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const deleteActual = createAsyncThunk(
  "costing/deleteActual",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/costing/actuals/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* =========================
   THUNKS – METRICS
========================= */

export const fetchMetrics = createAsyncThunk(
  "costing/fetchMetrics",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/costing/metrics");
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const createMetric = createAsyncThunk(
  "costing/createMetric",
  async (payload: Partial<PerfMetric>, { rejectWithValue }) => {
    try {
      const res = await axios.post("/costing/metrics", payload);
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
      await axios.delete(`/costing/metrics/${id}`);
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
      /* ===== LOADING ===== */
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
      )

      /* ===== STANDARDS ===== */
      .addCase(fetchStandards.fulfilled, (state, action) => {
        state.loading = false;
        state.standards = action.payload;
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
        state.actuals = action.payload;
        state.loading = false;
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
        state.metrics = action.payload;
        state.loading = false;
      })
      .addCase(createMetric.fulfilled, (state, action) => {
        state.metrics.unshift(action.payload);
      })
      .addCase(deleteMetric.fulfilled, (state, action) => {
        state.metrics = state.metrics.filter(m => m._id !== action.payload);
      });
  },
});

export default costingSlice.reducer;
