import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* =========================
   ASYNC THUNKS
========================= */
export const fetchIssueSlips = createAsyncThunk(
  "materialIssue/fetch",
  async () => {
    const res = await axios.get("/material-issue");
    return res.data.data;
  }
);

export const createIssueSlip = createAsyncThunk(
  "materialIssue/create",
  async (data: any) => {
    const res = await axios.post("/material-issue", data);
    return res.data.data;
  }
);

export const backflushIssue = createAsyncThunk(
  "materialIssue/backflush",
  async (id: string) => {
    await axios.post(`/material-issue/${id}/backflush`);
    return id;
  }
);

export const fetchLedger = createAsyncThunk(
  "materialIssue/ledger",
  async () => {
    const res = await axios.get("/material-issue/ledger/all");
    return res.data.data;
  }
);

export const fetchWIP = createAsyncThunk(
  "materialIssue/wip",
  async () => {
    const res = await axios.get("/material-issue/wip/all");
    return res.data.data;
  }
);

/* =========================
   SLICE
========================= */
const materialIssueSlice = createSlice({
  name: "materialIssue",
  initialState: {
    issueSlips: [],   // ✅ FIXED NAME
    ledger: [],
    wip: [],
    loading: false,
    error: null as string | null,
  },
  reducers: {},

  extraReducers: (builder) => {
    /* ---------- FETCH ISSUE SLIPS ---------- */
    builder
      .addCase(fetchIssueSlips.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIssueSlips.fulfilled, (state, action) => {
        state.loading = false;
        state.issueSlips = action.payload;
      })
      .addCase(fetchIssueSlips.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch issue slips";
      });

    /* ---------- CREATE ISSUE ---------- */
    builder.addCase(createIssueSlip.fulfilled, (state, action) => {
      state.issueSlips.unshift(action.payload); // newest first
    });

    /* ---------- BACKFLUSH ---------- */
    builder.addCase(backflushIssue.fulfilled, (state, action) => {
      const slip = state.issueSlips.find(
        (s: any) => s._id === action.payload
      );
      if (slip) slip.autoBackflush = true;
    });

    /* ---------- LEDGER ---------- */
    builder.addCase(fetchLedger.fulfilled, (state, action) => {
      state.ledger = action.payload;
    });

    /* ---------- WIP ---------- */
    builder.addCase(fetchWIP.fulfilled, (state, action) => {
      state.wip = action.payload;
    });

    /* ---------- GLOBAL ERROR HANDLER (LAST) ---------- */
    builder.addMatcher(
      (action) => action.type.endsWith("/rejected"),
      (state) => {
        state.loading = false;
        state.error = "Something went wrong";
      }
    );
  },
});

export default materialIssueSlice.reducer;
