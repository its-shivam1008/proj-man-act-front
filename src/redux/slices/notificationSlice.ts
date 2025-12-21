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
  type?: string;
  title?: string;
  message?: string;
  metadata?: any;
}

// Define the Filter arguments
interface FetchNotificationFilters {
  source?: string;
  destination?: string;
  itemId?: string;
  status?: string;
  receiverId?:any;
  type?: string;
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
      if (filters.receiverId) params.append("receiverId", filters.receiverId);
      if (filters.type) params.append("type", filters.type);

      const url = `/notifications/list?${params.toString()}`;
      console.log('🚀 Fetching notifications from:', url, 'with filters:', filters);
      
      const response = await api.get(url);
      console.log('✅ Notifications API response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Notifications API error:', error.response?.data || error.message);
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

export const sendInvite = createAsyncThunk(
  "notifications/sendInvite",
  async (email: string, { rejectWithValue }) => {
    try {
      // This maps to the backend route we will create in Step 3
      const response = await api.post("/notifications/invite", { email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to invite user");
    }
  }
);

export const respondToInvite = createAsyncThunk(
  "notifications/respondToInvite",
  async ({ notificationId, response }: { notificationId: string, response: "accepted" | "rejected" }, { rejectWithValue }) => {
    try {
      const apiResponse = await api.post("/notifications/invite/respond", { notificationId, response });
      return { ...apiResponse.data, notificationId, response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to respond to invite");
    }
  }
);

export const respondToMaterialRequest = createAsyncThunk(
  "notifications/respondToMaterialRequest",
  async ({ notificationId, response }: { notificationId: string, response: "accepted" | "rejected" }, { rejectWithValue }) => {
    try {
      console.log("🚀 Sending material request response:", { notificationId, response });
      const apiResponse = await api.post("/notifications/material-request/respond", { notificationId, response });
      console.log("✅ Material request response success:", apiResponse.data);
      return { ...apiResponse.data, notificationId, response };
    } catch (error: any) {
      console.error("❌ Material request response error:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      return rejectWithValue(error.response?.data?.message || "Failed to respond to material request");
    }
  }
);

export const respondToMaterialPurchase = createAsyncThunk(
  "notifications/respondToMaterialPurchase",
  async ({ notificationId, response }: { notificationId: string, response: "accepted" | "rejected" }, { rejectWithValue }) => {
    try {
      console.log("🚀 Sending material purchase response:", { notificationId, response });
      const apiResponse = await api.post("/purchase/orders/material-response", { notificationId, response });
      console.log("✅ Material purchase response success:", apiResponse.data);
      return { ...apiResponse.data, notificationId, response };
    } catch (error: any) {
      console.error("❌ Material purchase response error:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      return rejectWithValue(error.response?.data?.message || "Failed to respond to material purchase");
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await api.post("/notifications/mark-read", { notificationId });
      return { ...response.data, notificationId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark as read");
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

    // Handle Send Invite
    builder.addCase(sendInvite.pending, (state) => {
      state.loading = true;
      state.inviteStatus = 'sending';
    });
    builder.addCase(sendInvite.fulfilled, (state) => {
      state.loading = false;
      state.inviteStatus = 'sent';
      state.success = true;
    });
    builder.addCase(sendInvite.rejected, (state, action) => {
      state.loading = false;
      state.inviteStatus = 'failed';
      state.error = action.payload as string;
    });
    builder.addCase(respondToInvite.fulfilled, (state, action) => {
      // Update the specific notification in the list
      const index = state.list.findIndex(n => n._id === action.payload.notificationId);
      if (index !== -1) {
        state.list[index].inviteResponse = action.payload.response;
        state.list[index].status = 'read'; // Usually responding marks it as read
      }
    });
    builder.addCase(respondToMaterialRequest.fulfilled, (state, action) => {
      // Update the specific material request notification in the list
      const index = state.list.findIndex(n => n._id === action.payload.notificationId);
      if (index !== -1) {
        state.list[index].inviteResponse = action.payload.response;
        state.list[index].status = 'read'; // Mark as read after responding
      }
    });
    builder.addCase(respondToMaterialPurchase.fulfilled, (state, action) => {
      // Update the specific material purchase notification in the list
      const index = state.list.findIndex(n => n._id === action.payload.notificationId);
      if (index !== -1) {
        state.list[index].inviteResponse = action.payload.response;
        state.list[index].status = 'read'; // Mark as read after responding
      }
    });
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      // Remove the notification from the list after marking as read
      state.list = state.list.filter(n => n._id !== action.payload.notificationId);
    });
  },
});

export const { resetStatus } = notificationSlice.actions;
export default notificationSlice.reducer;