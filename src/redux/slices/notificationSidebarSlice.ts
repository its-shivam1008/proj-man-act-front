import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

interface NotificationState {
  list: Notification[];
  loading: boolean;
  unreadCount: number;
}

const initialState: NotificationState = {
  list: [],
  loading: false,
  unreadCount: 0,
};

/* ============================
   THUNKS
============================ */

// 🔹 Fetch notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async () => {
    const res = await api.get("/api/notifications");
    return res.data;
  }
);

// 🔹 Mark one as read
export const markNotificationRead = createAsyncThunk(
  "notifications/read",
  async (id: string) => {
    await api.patch(`/api/notifications/${id}/read`);
    return id;
  }
);

// 🔹 Mark all as read
export const markAllNotificationsRead = createAsyncThunk(
  "notifications/readAll",
  async () => {
    await api.patch("/api/notifications/read-all");
  }
);

// 🔹 Delete notification
export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (id: string) => {
    await api.delete(`/api/notifications/${id}`);
    return id;
  }
);

/* ============================
   SLICE
============================ */

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // Fetch
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;

        // Handle both cases: if payload is an array OR an object with notifications property
        const fetchedList = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.notifications || [];

        state.list = fetchedList;

        // Safely calculate unread count
        state.unreadCount = fetchedList.filter(
          (n: Notification) => !n.isRead
        ).length;
      })


      // Mark one read
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = state.list.find(n => n._id === action.payload);
        if (n) n.isRead = true;
        state.unreadCount = state.list.filter(n => !n.isRead).length;
      })

      // Mark all read
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.list.forEach(n => n.isRead = true);
        state.unreadCount = 0;
      })

      // Delete
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.list = state.list.filter(n => n._id !== action.payload);
        state.unreadCount = state.list.filter(n => !n.isRead).length;
      });
  },
});

export default notificationSlice.reducer;
