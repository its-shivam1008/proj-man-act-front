// redux/slices/workOrderSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* ================= TYPES ================= */
export interface WorkOrder {
  _id: string;
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
}

interface WorkOrderState {
  list: WorkOrder[];
  loading: boolean;
  error: string | null;
}

/* ================= INITIAL STATE ================= */
const initialState: WorkOrderState = {
  list: [],
  loading: false,
  error: null,
};

/* ================= THUNKS ================= */
export const fetchWorkOrders = createAsyncThunk(
  "workOrder/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/fetch/work-order");
      return res.data.data;
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
  "workOrder/update",
  async ({ id, data }: { id: string; data: Partial<WorkOrder> }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/work-order/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
);

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
        state.list = action.payload;
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
        const idx = state.list.findIndex(w => w._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })

      /* DELETE */
      .addCase(deleteWorkOrder.fulfilled, (state, action) => {
        state.list = state.list.filter(w => w._id !== action.payload);
      });
  },
});

export default workOrderSlice.reducer;
