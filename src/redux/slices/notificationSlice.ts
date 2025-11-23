import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

// Define the shape of the Notification object
export interface NotificationItem {
  _id: string;
  source: string;
  destination: string;
  remark?: string;
  itemId?: string;
  itemName?: string;
  status: "unread" | "read" | "archived";
  createdAt: string;
}

// Define the Filter arguments
interface FetchNotificationFilters {
  source?: string;
  destination?: string;
  itemId?: string;
  status?: string;
}

// 1. Async Thunk for Fetching with Filters
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (filters: FetchNotificationFilters, { rejectWithValue }) => {
    try {
      // Construct query string automatically
      // Example: params becomes { source: "procurement...", status: "unread" }
      const params = new URLSearchParams();
      if (filters.source) params.append("source", filters.source);
      if (filters.destination) params.append("destination", filters.destination);
      if (filters.itemId) params.append("itemId", filters.itemId);
      if (filters.status) params.append("status", filters.status);

      const response = await api.get(`/notifications/list?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch");
    }
  }
);

export const createNotification = createAsyncThunk(
  "notifications/create",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post("/notifications/create", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to send");
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    list: [] as NotificationItem[],
    loading: false,
    error: null as string | null,
    success: false,
  },
  reducers: {
    resetStatus(state) {
      state.success = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Handle Fetch
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Handle Create
    builder.addCase(createNotification.fulfilled, (state) => {
      state.success = true;
    });
  },
});

export const { resetStatus } = notificationSlice.actions;
export default notificationSlice.reducer;