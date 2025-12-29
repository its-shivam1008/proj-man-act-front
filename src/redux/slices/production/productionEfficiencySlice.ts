import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* ================= TYPES ================= */

export interface WorkCenterEfficiency {
  workCenterId: string;
  workCenterName: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  produced: number;
  planned: number;
  rejected: number;
  downtime: number;
  runtime: number;
  efficiency: number;
  utilizationRate: number;
  throughput: number;
  cycleTime: number;
  setupTime: number;
  status: "excellent" | "good" | "average" | "poor";
}

export interface ProductionEfficiencyData {
  summary: {
    totalProduced: number;
    totalPlanned: number;
    totalRejected: number;
    overallEfficiency: number;
    avgOEE: number;
    avgAvailability: number;
    avgPerformance: number;
    avgQuality: number;
    totalDowntime: number;
    totalRuntime: number;
    productivityIndex: number;
  };
  workCenters: WorkCenterEfficiency[];
  benchmarks: {
    industryAvgOEE: number;
    targetOEE: number;
    bestInClassOEE: number;
    companyAvgOEE: number;
  };
  trends: {
    oeeImprovement: number;
    efficiencyTrend: "improving" | "declining" | "stable";
    performanceGap: number;
  };
}

export interface OEEMetrics {
  overall: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  };
  byShift: Array<{
    shift: string;
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  }>;
  byProduct: Array<{
    productId: string;
    productName: string;
    oee: number;
    unitsProduced: number;
    defectRate: number;
  }>;
  historical: Array<{
    date: string;
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  }>;
}

export interface ProductivityTrends {
  daily: Array<{
    date: string;
    produced: number;
    planned: number;
    efficiency: number;
    oee: number;
    downtime: number;
  }>;
  weekly: Array<{
    week: string;
    avgEfficiency: number;
    avgOEE: number;
    totalProduced: number;
    totalPlanned: number;
  }>;
  monthly: Array<{
    month: string;
    avgEfficiency: number;
    avgOEE: number;
    totalProduced: number;
    totalPlanned: number;
    improvement: number;
  }>;
}

/* ================= ASYNC THUNKS ================= */

export const fetchProductionEfficiencyData = createAsyncThunk(
  "productionEfficiency/fetchData",
  async (dateRange: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const res = await axios.get("/production-efficiency", { params: dateRange });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch production efficiency data");
    }
  }
);

export const fetchOEEMetrics = createAsyncThunk(
  "productionEfficiency/fetchOEE",
  async (dateRange: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const res = await axios.get("/oee-metrics", { params: dateRange });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch OEE metrics");
    }
  }
);

export const fetchProductivityTrends = createAsyncThunk(
  "productionEfficiency/fetchTrends",
  async (dateRange: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const res = await axios.get("/productivity-trends", { params: dateRange });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch productivity trends");
    }
  }
);

export const generateEfficiencyReport = createAsyncThunk(
  "productionEfficiency/generateReport",
  async (params: { 
    startDate: string; 
    endDate: string; 
    format: "pdf" | "excel";
    includeCharts: boolean;
  }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/generate-efficiency-report", params, {
        responseType: 'blob'
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to generate efficiency report");
    }
  }
);

/* ================= SLICE ================= */

interface ProductionEfficiencyState {
  efficiencyData: ProductionEfficiencyData | null;
  oeeMetrics: OEEMetrics | null;
  productivityTrends: ProductivityTrends | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: ProductionEfficiencyState = {
  efficiencyData: null,
  oeeMetrics: null,
  productivityTrends: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

const productionEfficiencySlice = createSlice({
  name: "productionEfficiency",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearData: (state) => {
      state.efficiencyData = null;
      state.oeeMetrics = null;
      state.productivityTrends = null;
      state.lastUpdated = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    /* ===== FETCH EFFICIENCY DATA ===== */
    builder.addCase(fetchProductionEfficiencyData.fulfilled, (state, action) => {
      state.loading = false;
      state.efficiencyData = action.payload;
      state.lastUpdated = new Date().toISOString();
    });

    /* ===== FETCH OEE METRICS ===== */
    builder.addCase(fetchOEEMetrics.fulfilled, (state, action) => {
      state.loading = false;
      state.oeeMetrics = action.payload;
    });

    /* ===== FETCH PRODUCTIVITY TRENDS ===== */
    builder.addCase(fetchProductivityTrends.fulfilled, (state, action) => {
      state.loading = false;
      state.productivityTrends = action.payload;
    });

    /* ===== GENERATE REPORT ===== */
    builder.addCase(generateEfficiencyReport.fulfilled, (state) => {
      state.loading = false;
    });

    /* ===== LOADING STATES ===== */
    builder.addMatcher(
      (action) =>
        action.type.startsWith("productionEfficiency/") &&
        action.type.endsWith("/pending"),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    /* ===== ERROR STATES ===== */
    builder.addMatcher(
      (action) =>
        action.type.startsWith("productionEfficiency/") &&
        action.type.endsWith("/rejected"),
      (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      }
    );
  },
});

export const { clearError, clearData, setLoading } = productionEfficiencySlice.actions;
export default productionEfficiencySlice.reducer;