import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "sonner";
import axiosApi from "@/utils/axiosApi";

export interface Delivery {
  _id: string;
  deliverTo: string;
  operationType: string;
  productId: string;
  quantity: number;
  shippingMethod: string;
  priority: "low" | "medium" | "high";
  status: "draft" | "ready" | "in-transit" | "delivered" | "cancelled";
  scheduledDate: string;
  organisationId: string;
}

interface DeliveryState {
  deliveries: Delivery[];
  loading: boolean;
  error: string | null;
  selectedDelivery: Delivery | null;
}

const initialState: DeliveryState = {
  deliveries: [],
  loading: false,
  error: null,
  selectedDelivery: null,
};

export const createDelivery = createAsyncThunk(
  "delivery/create",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await axiosApi.post("/delivery/create", data);
      toast.success("Delivery created successfully");
      return res.data.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create delivery";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const getAllDeliveries = createAsyncThunk(
  "delivery/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosApi.get("/delivery/get/all");
      return res.data.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load deliveries";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const getSingleDelivery = createAsyncThunk(
  "delivery/getSingle",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosApi.get(`/delivery/single/${id}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

export const updateDelivery = createAsyncThunk(
  "delivery/update",
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const res = await axiosApi.put(`/delivery/update/${id}`, data);
      toast.success("Delivery updated successfully");
      return res.data.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update delivery";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteDelivery = createAsyncThunk(
  "delivery/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosApi.delete(`/delivery/delete/${id}`);
      toast.success("Delivery deleted successfully");
      return id;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete delivery";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const deliverySlice = createSlice({
  name: "delivery",
  initialState,
  reducers: {
    clearSelectedDelivery: (state) => {
      state.selectedDelivery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDelivery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDelivery.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveries.push(action.payload);
      })
      .addCase(createDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getAllDeliveries.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllDeliveries.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveries = action.payload;
      })
      .addCase(getAllDeliveries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getSingleDelivery.fulfilled, (state, action) => {
        state.selectedDelivery = action.payload;
      })

      .addCase(updateDelivery.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDelivery.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveries = state.deliveries.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
      })
      .addCase(updateDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteDelivery.fulfilled, (state, action) => {
        state.deliveries = state.deliveries.filter(
          (item) => item._id !== action.payload
        );
      });
  },
});

export const { clearSelectedDelivery } = deliverySlice.actions;
export default deliverySlice.reducer;