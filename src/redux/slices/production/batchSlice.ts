import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi"
import type { RootState } from "@/redux/store";

/* -----------------------------
   Async Thunks
----------------------------- */

// 1️⃣ Fetch batch list
export const fetchBatches = createAsyncThunk(
  "batch/fetchBatches",
  async (
    params: { page?: number; limit?: number; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.get("/batches/list", { params });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch batches"
      );
    }
  }
);

// 2️⃣ Fetch batch detail
export const fetchBatchDetail = createAsyncThunk(
  "batch/fetchBatchDetail",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/batches/details/${id}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch batch detail"
      );
    }
  }
);

/* -----------------------------
   Slice
----------------------------- */

type BatchState = {
  list: any[];
  detail: any | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
};

const initialState: BatchState = {
  list: [],
  detail: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
  },
};

const batchSlice = createSlice({
  name: "batch",
  initialState,
  reducers: {
    clearBatchDetail(state) {
      state.detail = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // 🔹 Fetch batch list
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
        };
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // 🔹 Fetch batch detail
      .addCase(fetchBatchDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatchDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
      })
      .addCase(fetchBatchDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearBatchDetail } = batchSlice.actions;

export default batchSlice.reducer;

/* -----------------------------
   Selectors
----------------------------- */

export const selectBatches = (state: RootState) => state.batch.list;
export const selectBatchDetail = (state: RootState) => state.batch.detail;
export const selectBatchLoading = (state: RootState) => state.batch.loading;
