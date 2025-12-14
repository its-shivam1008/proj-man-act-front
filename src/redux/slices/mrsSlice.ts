import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { MRSItem } from "@/types/procurement";
import { BASE_URL } from "@/utils/constants";
import api from "@/utils/axiosApi";

export const fetchMRS = createAsyncThunk<MRSItem[]>(
  "mrs/fetchMRS",
  async (_, { rejectWithValue }) => {
    try {
      console.log("📋 Fetching MRS items...");
      const res = await api.get(`/get/mrs`);
      console.log("✅ Fetched MRS items:", res.data.length, "items");
      // Filter out deleted items on frontend as well (double safety)
      const filteredData = res.data.filter((item: any) => !item.isDeleted);
      console.log("✅ Filtered MRS items (non-deleted):", filteredData.length, "items");
      return filteredData as MRSItem[];
    } catch (err: any) {
      console.error("❌ Fetch MRS error:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createMRS = createAsyncThunk<MRSItem, Partial<MRSItem>>(
  "mrs/createMRS",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(`/create/mrs`, data);
      return res.data.mrs as MRSItem;
    } catch (err: any) {
      // Log full error for debugging
      console.error("Create MRS Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createBulkMRS = createAsyncThunk<MRSItem[], Partial<MRSItem>[]>(
  "mrs/createBulkMRS",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(`/create/mrs/bulk`, data);
      return res.data.data as MRSItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


export const updateMRS = createAsyncThunk<
  MRSItem,
  { id: string; data: Partial<MRSItem> }
>("mrs/updateMRS", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/update/mrs/${id}`, data);
    return res.data.data as MRSItem;
  } catch (err: any) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const deleteMRS = createAsyncThunk<string, string>(
  "mrs/deleteMRS",
  async (id, { rejectWithValue }) => {
    try {
      console.log("🗑️ Redux: Deleting MRS item with ID:", id);
      console.log("🌐 Redux: Making DELETE request to:", `/delete/mrs/${id}`);
      
      const response = await api.delete(`/delete/mrs/${id}`);
      console.log("✅ Redux: Delete MRS response:", response.data);
      console.log("✅ Redux: Response status:", response.status);
      
      return id;
    } catch (err: any) {
      console.error("❌ Redux: Delete MRS error:", err);
      console.error("❌ Redux: Error response:", err.response?.data);
      console.error("❌ Redux: Error status:", err.response?.status);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 🚀 NEW: Delivery Status Management Actions

export const updateDeliveryStatus = createAsyncThunk<
  MRSItem,
  { id: string; deliveryStatus: string; transportDetails?: any; deliveryNotes?: string }
>("mrs/updateDeliveryStatus", async ({ id, deliveryStatus, transportDetails, deliveryNotes }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/mrs/${id}/delivery-status`, {
      deliveryStatus,
      transportDetails,
      deliveryNotes
    });
    return res.data.data as MRSItem;
  } catch (err: any) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const markAsSent = createAsyncThunk<
  MRSItem,
  { id: string; transportDetails?: any }
>("mrs/markAsSent", async ({ id, transportDetails }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/mrs/${id}/mark-sent`, { transportDetails });
    return res.data.data as MRSItem;
  } catch (err: any) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const markAsInTransit = createAsyncThunk<
  MRSItem,
  { id: string; transportDetails?: any }
>("mrs/markAsInTransit", async ({ id, transportDetails }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/mrs/${id}/mark-in-transit`, { transportDetails });
    return res.data.data as MRSItem;
  } catch (err: any) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const markAsReceived = createAsyncThunk<
  MRSItem,
  { id: string; receivedBy?: string; receivedQuantity?: number; deliveryNotes?: string }
>("mrs/markAsReceived", async ({ id, receivedBy, receivedQuantity, deliveryNotes }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/mrs/${id}/mark-received`, {
      receivedBy,
      receivedQuantity,
      deliveryNotes
    });
    return res.data.data as MRSItem;
  } catch (err: any) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const returnMaterial = createAsyncThunk<
  MRSItem,
  { id: string; returnedQuantity: number; returnReason?: string; returnedBy?: string }
>("mrs/returnMaterial", async ({ id, returnedQuantity, returnReason, returnedBy }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/mrs/${id}/return-material`, {
      returnedQuantity,
      returnReason,
      returnedBy
    });
    return res.data.data as MRSItem;
  } catch (err: any) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const fetchDeliveryStatistics = createAsyncThunk<any>(
  "mrs/fetchDeliveryStatistics",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`/delivery-statistics`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
interface MRSState {
  list: MRSItem[];
  loading: boolean;
  error: string | null;
  deliveryStatistics: {
    total: number;
    pending: number;
    sent: number;
    'in-transit': number;
    received: number;
    returned: number;
  };
}

const initialState: MRSState = {
  list: [],
  loading: false,
  error: null,
  deliveryStatistics: {
    total: 0,
    pending: 0,
    sent: 0,
    'in-transit': 0,
    received: 0,
    returned: 0,
  },
};
const mrsSlice = createSlice({
  name: "mrs",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchMRS.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchMRS.fulfilled,
        (state, action: PayloadAction<MRSItem[]>) => {
          state.loading = false;
          state.list = action.payload;
        }
      )
      .addCase(fetchMRS.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMRS.fulfilled, (state, action: PayloadAction<MRSItem>) => {
        state.list.push(action.payload);
      })
      .addCase(createBulkMRS.fulfilled, (state, action) => {
        state.list.push(...action.payload);
      })
      .addCase(updateMRS.fulfilled, (state, action: PayloadAction<MRSItem>) => {
        const updated = action.payload;
        const idx = state.list.findIndex((i) => i._id === updated._id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(deleteMRS.fulfilled, (state, action: PayloadAction<string>) => {
        // Since backend sets isDeleted: true and getAllMRS filters them out,
        // we should remove from frontend list to match backend behavior
        state.list = state.list.filter((i) => i._id !== action.payload);
      })
      // 🚀 NEW: Delivery Status Actions
      .addCase(updateDeliveryStatus.fulfilled, (state, action: PayloadAction<MRSItem>) => {
        const updated = action.payload;
        const idx = state.list.findIndex((i) => i._id === updated._id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(markAsSent.fulfilled, (state, action: PayloadAction<MRSItem>) => {
        const updated = action.payload;
        const idx = state.list.findIndex((i) => i._id === updated._id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(markAsInTransit.fulfilled, (state, action: PayloadAction<MRSItem>) => {
        const updated = action.payload;
        const idx = state.list.findIndex((i) => i._id === updated._id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(markAsReceived.fulfilled, (state, action: PayloadAction<MRSItem>) => {
        const updated = action.payload;
        const idx = state.list.findIndex((i) => i._id === updated._id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(returnMaterial.fulfilled, (state, action: PayloadAction<MRSItem>) => {
        const updated = action.payload;
        const idx = state.list.findIndex((i) => i._id === updated._id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(fetchDeliveryStatistics.fulfilled, (state, action) => {
        state.deliveryStatistics = action.payload;
      });
  },
});

export default mrsSlice.reducer;
