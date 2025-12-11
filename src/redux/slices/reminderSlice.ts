import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../utils/axiosApi";

export interface Reminder {
  _id: string;
  organisationId: string;
  projectId: {
    _id: string;
    name: string;
    code: string;
  };
  wbsId: {
    _id: string;
    name: string;
    type: string;
  };
  title: string;
  note: string;
  deadline: string;
  isActive: boolean;
  isNotified: boolean;
  notificationSent: boolean;
  reminderType: "deadline" | "milestone" | "task" | "phase";
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
}

const initialState: ReminderState = {
  reminders: [],
  loading: false,
  error: null,
};

// Fetch all reminders
export const fetchReminders = createAsyncThunk(
  "reminders/fetchReminders",
  async (params?: {
    projectId?: string;
    isActive?: boolean;
    upcoming?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.projectId) queryParams.append("projectId", params.projectId);
    if (params?.isActive !== undefined) queryParams.append("isActive", params.isActive.toString());
    if (params?.upcoming !== undefined) queryParams.append("upcoming", params.upcoming.toString());

    const response = await api.get(`/reminders?${queryParams.toString()}`);
    return response.data.data;
  }
);

// Create reminder
export const createReminder = createAsyncThunk(
  "reminders/createReminder",
  async (data: {
    projectId: string;
    wbsId: string;
    title: string;
    note?: string;
    deadline: string;
    reminderType?: string;
  }) => {
    const response = await api.post("/reminders", data);
    return response.data.data;
  }
);

// Update reminder
export const updateReminder = createAsyncThunk(
  "reminders/updateReminder",
  async ({ id, data }: { 
    id: string; 
    data: Partial<{
      title: string;
      note: string;
      deadline: string;
      isActive: boolean;
      reminderType: string;
    }> 
  }) => {
    const response = await api.put(`/reminders/${id}`, data);
    return response.data.data;
  }
);

// Delete reminder
export const deleteReminder = createAsyncThunk(
  "reminders/deleteReminder",
  async (id: string) => {
    await api.delete(`/reminders/${id}`);
    return id;
  }
);

// Check due reminders
export const checkDueReminders = createAsyncThunk(
  "reminders/checkDueReminders",
  async () => {
    const response = await api.get("/reminders/check-due");
    return response.data.data;
  }
);

const reminderSlice = createSlice({
  name: "reminders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reminders
      .addCase(fetchReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action: PayloadAction<Reminder[]>) => {
        state.loading = false;
        state.reminders = action.payload;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch reminders";
      })
      // Create reminder
      .addCase(createReminder.pending, (state) => {
        state.loading = true;
      })
      .addCase(createReminder.fulfilled, (state, action: PayloadAction<Reminder>) => {
        state.loading = false;
        state.reminders.unshift(action.payload);
      })
      .addCase(createReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create reminder";
      })
      // Update reminder
      .addCase(updateReminder.fulfilled, (state, action: PayloadAction<Reminder>) => {
        const index = state.reminders.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.reminders[index] = action.payload;
        }
      })
      // Delete reminder
      .addCase(deleteReminder.fulfilled, (state, action: PayloadAction<string>) => {
        state.reminders = state.reminders.filter((r) => r._id !== action.payload);
      });
  },
});

export const { clearError } = reminderSlice.actions;
export default reminderSlice.reducer;