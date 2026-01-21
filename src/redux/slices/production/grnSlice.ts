import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* ======================
   THUNKS
====================== */
export const fetchGRNs = createAsyncThunk("grn/fetchAll", async ({ location, page = 1, limit = 10, search = "" }: { location?: string; page?: number; limit?: number; search?: string } = {}) => {
  const params: any = { page, limit, search };
  if (location) params.location = location;

  const res = await axios.get("/grn", { params });
  // ✅ FIXED: Return full response structure
  return res.data;
});

export const fetchPendingQC = createAsyncThunk(
  "grn/fetchPendingQC",
  async ({ location }: { location?: string }, { rejectWithValue }) => {
    try {
      console.log("🔵 fetchPendingQC called");
      console.log("➡ location param:", location);

      const res = await axios.get("/grn/pending-qc", {
        params: { location },
      });


      console.log("🟢 fetchPendingQC RAW RESPONSE:", res.data);

      return res.data.data; // expected to be array
    } catch (err: any) {
      console.error("🔴 fetchPendingQC ERROR:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data);
    }
  }
);

export const createGRN = createAsyncThunk("grn/create", async (data: any) => {
  console.log('=== REDUX CREATE GRN DEBUG ===');
  console.log('Data being sent:', JSON.stringify(data, null, 2));

  try {
    const res = await axios.post("/grn", data);
    console.log('Response received:', res.data);
    console.log('=== END REDUX DEBUG ===');
    return res.data.data;
  } catch (error: any) {
    console.error('Redux createGRN error:', error.response?.data || error.message);
    throw error;
  }
});

export const updateQC = createAsyncThunk(
  "grn/updateQC",
  async (
    { grnId, batchNo, result }: { grnId: string; batchNo: string; result: "Accepted" | "Rejected" },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post("/grn/qc", {
        grnId,
        batchNo,
        result, // ✅ MATCHES BACKEND
      });

      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// export const updateQC = createAsyncThunk(
//   "grn/updateQC",
//   async (data: { productId: string; batchNo: string; action: "Accepted" | "Rejected" }) => {
//     await axios.post("/grn/qc", data);
//     return data;
//   }
// );

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
    pendingQCBatches: [],
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
        // ✅ FIXED: Properly handle backend response structure
        state.grns = action.payload.data || [];
        if (action.payload.pagination) {
          state.grnsPagination = {
            currentPage: action.payload.pagination.currentPage,
            totalPages: action.payload.pagination.totalPages,
            totalItems: action.payload.pagination.totalItems,
            itemsPerPage: action.payload.pagination.itemsPerPage
          };
        }
      })
      /* Pending QC */
      .addCase(fetchPendingQC.fulfilled, (state, action) => {
        state.loading = false;

        console.log("🟢 fetchPendingQC.fulfilled PAYLOAD:", action.payload);

        const rawData = action.payload || [];
        console.log("🟢 rawData length:", rawData.length);

        state.pendingQC = rawData;
        state.pendingQCBatches = rawData; // ✅ FIX
      })



      /* Pending QC */
      // .addCase(fetchPendingQC.fulfilled, (state, action) => {
      //   // ✅ FIXED: Properly handle backend response structure
      //   state.pendingQC = action.payload.data || [];
      //   if (action.payload.pagination) {
      //     state.pendingQCPagination = {
      //       currentPage: action.payload.pagination.currentPage,
      //       totalPages: action.payload.pagination.totalPages,
      //       totalItems: action.payload.pagination.totalItems,
      //       itemsPerPage: action.payload.pagination.itemsPerPage
      //     };
      //   }
      // })

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
      })
      .addCase(fetchPendingQC.pending, (state) => {
        state.loading = true;
      })
      // .addCase(fetchPendingQC.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.pendingQCBatches = action.payload;
      // })
      .addCase(fetchPendingQC.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
    ;
  },
});

export default slice.reducer;
