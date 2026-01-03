import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import {
  QualityAlert,
  CreateQualityAlertData,
  UpdateQualityAlertData,
  QualityAlertFilters,
} from "@/types/quality.types";

interface QualityAlertState {
  qualityAlerts: QualityAlert[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalAlerts: number;
}

const initialState: QualityAlertState = {
  qualityAlerts: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalAlerts: 0,
};

// Fetch Quality Alerts
export const fetchQualityAlerts = createAsyncThunk(
  "qualityAlerts/fetch",
  async (args: QualityAlertFilters, { rejectWithValue }) => {
    const { page, limit, status, priority, operation, search, location } = args;
    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.get(`/api/quality/get/quality-alerts`, {
        params: {
          organisationId,
          page,
          limit,
          status,
          priority,
          operation,
          search,
          location,
        },
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch quality alerts."
      );
    }
  }
);

// Add Quality Alert
export const addQualityAlert = createAsyncThunk(
  "qualityAlerts/add",
  async (data: CreateQualityAlertData, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post(`/api/quality/create/quality-alert`, {
        ...data,
        organisationId,
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to create quality alert."
      );
    }
  }
);

// Update Quality Alert
export const updateQualityAlert = createAsyncThunk(
  "qualityAlerts/update",
  async ({ id, data }: { id: string; data: UpdateQualityAlertData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/quality/quality-alert/update/${id}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update quality alert."
      );
    }
  }
);

// Delete Quality Alert
export const deleteQualityAlert = createAsyncThunk(
  "qualityAlerts/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/quality/quality-alert/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete quality alert."
      );
    }
  }
);

// Get Quality Alert by ID
export const getQualityAlertById = createAsyncThunk(
  "qualityAlerts/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/quality/quality-alert/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch quality alert."
      );
    }
  }
);

const qualityAlertSlice = createSlice({
  name: "qualityAlerts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchQualityAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQualityAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.qualityAlerts = action.payload.qualityAlerts;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalAlerts = action.payload.totalAlerts;
      })
      .addCase(fetchQualityAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ADD
      .addCase(addQualityAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addQualityAlert.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityAlerts.unshift(action.payload);
          state.totalAlerts += 1;
        }
      })
      .addCase(addQualityAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // UPDATE
      .addCase(updateQualityAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQualityAlert.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityAlerts = state.qualityAlerts.map((alert) =>
            alert._id === action.payload._id ? action.payload : alert
          );
        }
      })
      .addCase(updateQualityAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // DELETE
      .addCase(deleteQualityAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQualityAlert.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityAlerts = state.qualityAlerts.filter(
            (alert) => alert._id !== action.payload
          );
          state.totalAlerts -= 1;
        }
      })
      .addCase(deleteQualityAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // GET BY ID
      .addCase(getQualityAlertById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQualityAlertById.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(getQualityAlertById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = qualityAlertSlice.actions;
export default qualityAlertSlice.reducer;