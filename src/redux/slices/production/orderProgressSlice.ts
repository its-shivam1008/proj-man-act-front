import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* ================= TYPES ================= */

export interface WorkOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "on-hold" | "completed" | "cancelled" | "delivered";
  startDate: string;
  dueDate: string;
  completedDate?: string;
  completionPercentage: number;
  workCenterId?: string;
  workCenterName?: string;
  assignedTo?: string;
  assignedToName?: string;
  estimatedHours: number;
  actualHours: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  notes?: string;
  timeline: Array<{
    date: string;
    status: string;
    description: string;
    updatedBy: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderAnalytics {
  summary: {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    pendingOrders: number;
    delayedOrders: number;
    cancelledOrders: number;
    onTimeDeliveryRate: number;
    avgCompletionTime: number;
    totalValue: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
    avgCompletionTime: number;
  }>;
  byWorkCenter: Array<{
    workCenterId: string;
    workCenterName: string;
    orderCount: number;
    completionRate: number;
    avgEfficiency: number;
  }>;
  completionTrend: Array<{
    date: string;
    completed: number;
    started: number;
    cancelled: number;
  }>;
  delayAnalysis: {
    totalDelayed: number;
    avgDelayDays: number;
    delayReasons: Array<{
      reason: string;
      count: number;
    }>;
  };
}

export interface OrderTimeline {
  orderId: string;
  events: Array<{
    date: string;
    status: string;
    description: string;
    updatedBy: string;
    duration?: number;
  }>;
  milestones: Array<{
    name: string;
    plannedDate: string;
    actualDate?: string;
    status: "pending" | "completed" | "delayed";
  }>;
}

/* ================= ASYNC THUNKS ================= */

export const fetchOrderProgressData = createAsyncThunk(
  "orderProgress/fetchData",
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/order-progress", { params: filters });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch order progress data");
    }
  }
);

export const fetchOrderTimelines = createAsyncThunk(
  "orderProgress/fetchTimelines",
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/order-timelines", { params: filters });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch order timelines");
    }
  }
);

export const fetchOrderAnalytics = createAsyncThunk(
  "orderProgress/fetchAnalytics",
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get("/order-analytics", { params: filters });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch order analytics");
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "orderProgress/updateStatus",
  async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/work-orders/${orderId}/status`, { status, notes });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update order status");
    }
  }
);

export const updateOrderProgress = createAsyncThunk(
  "orderProgress/updateProgress",
  async ({ orderId, completionPercentage, notes }: { 
    orderId: string; 
    completionPercentage: number; 
    notes?: string 
  }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/work-orders/${orderId}/progress`, { 
        completionPercentage, 
        notes 
      });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update order progress");
    }
  }
);

export const addOrderNote = createAsyncThunk(
  "orderProgress/addNote",
  async ({ orderId, note }: { orderId: string; note: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/work-orders/${orderId}/notes`, { note });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to add order note");
    }
  }
);

export const generateProgressReport = createAsyncThunk(
  "orderProgress/generateReport",
  async (params: { 
    filters: any;
    format: "pdf" | "excel";
    includeTimelines: boolean;
  }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/generate-progress-report", params, {
        responseType: 'blob'
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to generate progress report");
    }
  }
);

/* ================= SLICE ================= */

interface OrderProgressState {
  orders: WorkOrder[];
  timelines: OrderTimeline[];
  analytics: OrderAnalytics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: OrderProgressState = {
  orders: [],
  timelines: [],
  analytics: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

const orderProgressSlice = createSlice({
  name: "orderProgress",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearData: (state) => {
      state.orders = [];
      state.timelines = [];
      state.analytics = null;
      state.lastUpdated = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    updateOrderInList: (state, action) => {
      const index = state.orders.findIndex(order => order._id === action.payload._id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    /* ===== FETCH ORDER DATA ===== */
    builder.addCase(fetchOrderProgressData.fulfilled, (state, action) => {
      state.loading = false;
      state.orders = action.payload;
      state.lastUpdated = new Date().toISOString();
    });

    /* ===== FETCH TIMELINES ===== */
    builder.addCase(fetchOrderTimelines.fulfilled, (state, action) => {
      state.loading = false;
      state.timelines = action.payload;
    });

    /* ===== FETCH ANALYTICS ===== */
    builder.addCase(fetchOrderAnalytics.fulfilled, (state, action) => {
      state.loading = false;
      state.analytics = action.payload;
    });

    /* ===== UPDATE ORDER STATUS ===== */
    builder.addCase(updateOrderStatus.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.orders.findIndex(order => order._id === action.payload._id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    });

    /* ===== UPDATE ORDER PROGRESS ===== */
    builder.addCase(updateOrderProgress.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.orders.findIndex(order => order._id === action.payload._id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    });

    /* ===== ADD ORDER NOTE ===== */
    builder.addCase(addOrderNote.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.orders.findIndex(order => order._id === action.payload._id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    });

    /* ===== GENERATE REPORT ===== */
    builder.addCase(generateProgressReport.fulfilled, (state) => {
      state.loading = false;
    });

    /* ===== LOADING STATES ===== */
    builder.addMatcher(
      (action) =>
        action.type.startsWith("orderProgress/") &&
        action.type.endsWith("/pending"),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    /* ===== ERROR STATES ===== */
    builder.addMatcher(
      (action) =>
        action.type.startsWith("orderProgress/") &&
        action.type.endsWith("/rejected"),
      (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      }
    );
  },
});

export const { clearError, clearData, setLoading, updateOrderInList } = orderProgressSlice.actions;
export default orderProgressSlice.reducer;