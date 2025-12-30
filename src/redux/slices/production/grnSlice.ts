import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* ======================
   THUNKS
====================== */
export const fetchGRNs = createAsyncThunk("grn/fetchAll", async ({ location, page = 1, limit = 10, search = "" }: { location?: string; page?: number; limit?: number; search?: string } = {}) => {
  const params: any = { page, limit, search };
  if (location) params.location = location;
  
  const res = await axios.get("/grn", { params });
  return res.data.data;
});

export const fetchPendingQC = createAsyncThunk("grn/fetchPendingQC", async ({ location, page = 1, limit = 10, search = "" }: { location?: string; page?: number; limit?: number; search?: string } = {}) => {
  const params: any = { page, limit, search };
  if (location) params.location = location;
  
  const res = await axios.get("/grn/pending-qc", { params });
  return res.data.data;
});

export const createGRN = createAsyncThunk("grn/create", async (data: any) => {
  const res = await axios.post("/grn", data);
  return res.data.data;
});

export const updateQC = createAsyncThunk(
  "grn/updateQC",
  async (data: { productId: string; batchNo: string; action: "Accepted" | "Rejected" }) => {
    await axios.post("/grn/qc", data);
    return data;
  }
);

export const fetchGRNTrend = createAsyncThunk(
  "grn/valueTrend",
  async (range: "daily" | "weekly" | "monthly") => {
    const res = await axios.get("/trend/value", {
      params: { range },
    });
    return res.data.data;
  }
);


/* ======================
   SLICE
====================== */
const slice = createSlice({
  name: "grn",
  initialState: {
    grns: [],
    pendingQC: [],
    trend: [],
    wipTrend: [],
    loading: false,
    error: null as string | null,
    // Pagination states
    grnsPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    pendingQCPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      /* GRNs */
      .addCase(fetchGRNs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGRNs.fulfilled, (state, action) => {
        state.loading = false;
        state.grns = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.grnsPagination = action.payload.pagination;
        }
      })

      /* Pending QC */
      .addCase(fetchPendingQC.fulfilled, (state, action) => {
        state.pendingQC = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.pendingQCPagination = action.payload.pagination;
        }
      })

      /* Create GRN */
      .addCase(createGRN.fulfilled, (state, action) => {
        state.grns.unshift(action.payload);
      })

      /* Update QC */
      .addCase(updateQC.fulfilled, (state, action) => {
        const { batchNo } = action.payload;
        state.pendingQC = state.pendingQC.filter(
          (item: any) => item.batchNo !== batchNo
        );
      })

      .addCase(fetchGRNTrend.fulfilled, (state, action) => {
        state.trend = action.payload;
      })
      /* Error */
      .addCase(fetchGRNs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default slice.reducer;
