import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { PurchaseOrder } from "@/types/purchaseOrder";

interface POState {
  list: PurchaseOrder[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: POState = {
  list: [],
  loading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

/* =================== THUNKS =================== */

// Fetch with pagination + date filter + search
export const fetchPurchaseOrders = createAsyncThunk(
  "purchaseOrders/fetch",
  async (
    params: {
      page?: number;
      limit?: number;
      fromDate?: string;
      toDate?: string;
      search?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // 1. Get the ID from localStorage
      const organisationId = localStorage.getItem("organisationId");

      // 2. Pass it in the headers
      const res = await api.get("/purchase-orders/get", { 
        params,
        headers: {
          "x-organisation-id": organisationId,
        },
      });
      
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// Create PO
export const createPurchaseOrder = createAsyncThunk(
  "purchaseOrders/create",
  async (data: Partial<PurchaseOrder>, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      if (!organisationId) {
        throw new Error("Organisation ID missing");
      }

      const res = await api.post(
        "/purchaseorder/create",
        data,
        {
          headers: {
            "x-organisation-id": organisationId,
          },
        }
      );

      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


// Update PO
export const updatePurchaseOrder = createAsyncThunk(
  "purchaseOrders/update",
  async (
    { id, data }: { id: string; data: Partial<PurchaseOrder> },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.put(
        `/purchase-orders/update/${id}`,
        data,
        {
          headers: {
            "x-organisation-id": organisationId,
          },
        }
      );

      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);


// Soft delete
export const deletePurchaseOrder = createAsyncThunk(
  "purchaseOrders/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      await api.delete(`/purchase-orders/delete/${id}`, {
        headers: {
          "x-organisation-id": organisationId,
        },
      });

      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);


/* =================== SLICE =================== */

const purchaseOrderSlice = createSlice({
  name: "purchaseOrders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // Fetch
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPurchaseOrders.rejected, (state) => {
        state.loading = false;
      })

      // Create
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })

      // Update
      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        const index = state.list.findIndex(
          (po) => po._id === action.payload._id
        );
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })

      // Delete (soft)
      .addCase(deletePurchaseOrder.fulfilled, (state, action) => {
        state.list = state.list.filter((po) => po._id !== action.payload);
      });
  },
});

export default purchaseOrderSlice.reducer;
