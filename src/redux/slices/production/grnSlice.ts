import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* THUNKS */
export const fetchGRNs = createAsyncThunk("grn/fetchAll", async () => {
  const res = await axios.get("/grn");
  return res.data.data;
});

export const fetchPendingQC = createAsyncThunk("grn/fetchPendingQC", async () => {
  const res = await axios.get("/grn/pending-qc");
  return res.data.data;
});

export const createGRN = createAsyncThunk(
  "grn/create",
  async (data: any) => {
    const res = await axios.post("/grn", data);
    return res.data.data;
  }
);

export const updateQC = createAsyncThunk(
  "grn/updateQC",
  async (data: { productId: string; batchNo: string; action: "Accepted" | "Rejected" }) => {
    const res = await axios.post("/grn/qc", data);
    return { ...data, success: res.data.success };
  }
);

const slice = createSlice({
  name: "grn",
  initialState: {
    grns: [],
    pendingQC: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch GRNs
    builder.addCase(fetchGRNs.fulfilled, (state, action) => {
      state.grns = action.payload;
    });
    
    // Fetch Pending QC
    builder.addCase(fetchPendingQC.fulfilled, (state, action) => {
      state.pendingQC = action.payload;
    });
    
    // Create GRN
    builder.addCase(createGRN.fulfilled, (state, action) => {
      state.grns.unshift(action.payload);
    });
    
    // Update QC
    builder.addCase(updateQC.fulfilled, (state, action) => {
      // Refresh pending QC list after update
      const { batchNo, action: qcAction } = action.payload;
      state.pendingQC = state.pendingQC.filter((item: any) => item.batchNo !== batchNo);
    });

    // Loading states
    builder.addMatcher(
      (action) => action.type.startsWith("grn/") && action.type.endsWith("/pending"),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );
    
    builder.addMatcher(
      (action) => action.type.startsWith("grn/") && action.type.endsWith("/fulfilled"),
      (state) => {
        state.loading = false;
      }
    );
    
    builder.addMatcher(
      (action) => action.type.startsWith("grn/") && action.type.endsWith("/rejected"),
      (state, action) => {
        state.loading = false;
        state.error = action.payload;
      }
    );
  },
});

export default slice.reducer;