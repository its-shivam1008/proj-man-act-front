// redux/slices/workOrderSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* ================= TYPES ================= */
export interface WorkOrder {
  _id: string;
  id?: string; // For compatibility
  batchNo:string;
  batchId:string;
  orderNo: string;
  productId: string;
  productName?: string;
  quantity: number;
  status: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  notes?: string;
  imageUrl?: string;
  location?: string; // ✅ ADD LOCATION FIELD
  plannedHours?: number; // ✅ ADD PLANNED HOURS
  createdAt?: string;
  producedQuantity?: number;
  updatedAt?: string;
}

interface WorkOrderState {
  list: WorkOrder[];
  loading: boolean;
  error: string | null;
  totalProduced: number,
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/* ================= INITIAL STATE ================= */
const initialState: WorkOrderState = {
  list: [],
  loading: false,
  error: null,
  totalProduced: 0,
  pagination: {
    total: 0,
    page: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
};

/* ================= THUNKS ================= */
export const fetchWorkOrders = createAsyncThunk(
  "workOrder/fetch",
  async (params?: {
    location?: string;
    page?: number;
    limit?: number;
    search?: string;
  }, { rejectWithValue }) => {
    try {
      const queryParams = {
        ...(params?.location && params.location !== "all" && { location: params.location }),
        ...(params?.page && { page: params.page }),
        ...(params?.limit && { limit: params.limit }),
        ...(params?.search && { search: params.search })
      };

      const res = await axios.get("/fetch/work-order", { params: queryParams });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Fetch failed");
    }
  }
);

export const createWorkOrder = createAsyncThunk(
  "workOrder/create",
  async (payload: Partial<WorkOrder>, { rejectWithValue }) => {
    try {
      const res = await axios.post("/create/work-order", payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Create failed");
    }
  }
);

export const updateWorkOrder = createAsyncThunk(
  "workOrders/update",
  async ({ id, data }: { id: string; data: any }) => {
    // 🔥 IMPORTANT FIX
    if (!data.productId) {
      delete data.productId;
    }

    const res = await axios.put(`/work-order/${id}`, data);
    return res.data;
  }
);

// export const updateWorkOrder = createAsyncThunk(
//   "workOrder/update",
//   async ({ id, data }: { id: string; data: Partial<WorkOrder> }, { rejectWithValue }) => {
//     try {
//       const res = await axios.put(`/work-order/${id}`, data);
//       return res.data.data;
//     } catch (err: any) {
//       return rejectWithValue(err.response?.data?.message || "Update failed");
//     }
//   }
// );

export const deleteWorkOrder = createAsyncThunk(
  "workOrder/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/work-order/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Delete failed");
    }
  }
);
export const fetchTotalProduced = createAsyncThunk(
  "workOrder/totalProduced",
  async () => {
    const res = await axios.get("/work-order/total-produced");
    return res.data.totalProduced;
  }
);

/* ================= SLICE ================= */
const workOrderSlice = createSlice({
  name: "workOrder",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* FETCH */
      .addCase(fetchWorkOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.pagination = {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          totalPages: action.payload.totalPages || 0,
          hasNext: action.payload.hasNext || false,
          hasPrev: action.payload.hasPrev || false,
        };
      })
      .addCase(fetchWorkOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* CREATE */
      .addCase(createWorkOrder.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })

      /* UPDATE */
      .addCase(updateWorkOrder.fulfilled, (state, action) => {
        const updated = action.payload.data;

        const index = state.list.findIndex(
          (wo) => wo._id === updated._id
        );

        if (index !== -1) {
          state.list[index] = updated; // ✅ update UI instantly
        }
      })
      /* DELETE */
      .addCase(deleteWorkOrder.fulfilled, (state, action) => {
        state.list = state.list.filter(w => w._id !== action.payload);
      })/* TOTAL PRODUCED */
    .addCase(fetchTotalProduced.pending, (state) => {
      state.loading = true;
    })
    .addCase(fetchTotalProduced.fulfilled, (state, action) => {
      state.loading = false;
      state.totalProduced = action.payload; // ✅ STORE VALUE
    })
    .addCase(fetchTotalProduced.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to load total production";
    });
},
});

export default workOrderSlice.reducer;
