import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

export const fetchGRNs = createAsyncThunk("grn/fetch", async () => {
  const res = await axios.get("/grn");
  return res.data.data;
});

export const createGRN = createAsyncThunk(
  "grn/create",
  async (data: any) => {
    const res = await axios.post("/grn", data);
    return res.data.data;
  }
);

export const fetchPendingQC = createAsyncThunk("grn/pendingQC", async () => {
  const res = await axios.get("/grn/pending-qc");
  return res.data.data;
});

export const updateBatchQC = createAsyncThunk(
  "grn/qc",
  async (data: any) => {
    await axios.post("/grn/qc", data);
    return data;
  }
);

const slice = createSlice({
  name: "grn",
  initialState: {
    list: [],
    pendingQC: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addMatcher(
      (a) => a.type.startsWith("grn/") && a.type.endsWith("/pending"),
      (s) => { s.loading = true; }
    );
    b.addMatcher(
      (a) => a.type.startsWith("grn/") && a.type.endsWith("/fulfilled"),
      (s) => { s.loading = false; }
    );

    b.addCase(fetchGRNs.fulfilled, (s, a) => {
      s.list = a.payload;
    });

    b.addCase(fetchPendingQC.fulfilled, (s, a) => {
      s.pendingQC = a.payload;
    });
  },
});

export default slice.reducer;
