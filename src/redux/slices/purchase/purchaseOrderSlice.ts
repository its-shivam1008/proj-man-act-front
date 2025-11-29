import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { PurchaseOrder } from "@/types/purchase";

export const fetchPurchaseOrders = createAsyncThunk(
  "purchaseOrders/fetchPurchaseOrders",
  async (
    params: { page?: number; limit?: number; sort?: string; q?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const { page = 1, limit = 10, sort, q } = params;
      const query = new URLSearchParams();

      query.set("page", String(page));
      query.set("limit", String(limit));

      if (sort) query.set("sort", sort);
      if (q) query.set("q", q);

      // 🔥 ADD organisationId HERE
      const organisationId = localStorage.getItem("organisationId");
      if (organisationId) query.set("organisationId", organisationId);

      const response = await api.get(`/purchase/orders?${query.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch purchase orders"
      );
    }
  }
);


export const createPurchaseOrder = createAsyncThunk(
  "purchaseOrders/createPurchaseOrder",
  async (
    poData: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt">,
    { rejectWithValue }
  ) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      const poPayload = {
        ...poData,
        organisationId,
      };

      const response = await api.post("/purchase/orders", poPayload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create purchase order"
      );
    }
  }
);


export const updatePurchaseOrder = createAsyncThunk(
  "purchaseOrders/updatePurchaseOrder",
  async ({ id, data }: { id: string; data: Partial<PurchaseOrder> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/purchase/orders/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update purchase order");
    }
  }
);

export const deletePurchaseOrder = createAsyncThunk(
  "purchaseOrders/deletePurchaseOrder",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/purchase/orders/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete purchase order");
    }
  }
);

interface PurchaseOrderState {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  } | null;
}

const initialState: PurchaseOrderState = {
  purchaseOrders: [],
  loading: false,
  error: null,
  meta: null,
};

const purchaseOrderSlice = createSlice({
  name: "purchaseOrders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Purchase Orders
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders = action.payload.purchaseOrders ?? action.payload.data ?? [];
        state.meta = action.payload.meta ?? null;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Purchase Order
      .addCase(createPurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders.push(action.payload);
      })
      .addCase(createPurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Purchase Order
      .addCase(updatePurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.purchaseOrders.findIndex((po) => po.id === action.payload.id);
        if (index !== -1) {
          state.purchaseOrders[index] = action.payload;
        }
      })
      .addCase(updatePurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Purchase Order
      .addCase(deletePurchaseOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders = state.purchaseOrders.filter((po) => po.id !== action.payload);
      })
      .addCase(deletePurchaseOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = purchaseOrderSlice.actions;
export default purchaseOrderSlice.reducer;
