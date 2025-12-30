import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* =========================
   ASYNC THUNKS
========================= */
export const fetchIssueSlips = createAsyncThunk(
  "materialIssue/fetch",
  async ({ location, page = 1, limit = 10, search = "" }: { location?: string; page?: number; limit?: number; search?: string } = {}) => {
    const params: any = { page, limit, search };
    if (location) params.location = location;
    const res = await axios.get("/material-issue/get", { params });
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
  async ({ location, page = 1, limit = 10, search = "" }: { location?: string; page?: number; limit?: number; search?: string } = {}) => {
    const params: any = { page, limit, search };
    if (location) params.location = location;
    const res = await axios.get("/material-issue/ledger/all", { params });
    return res.data.data;
  }
);

export const fetchWIP = createAsyncThunk(
  "materialIssue/wip",
  async ({ location, page = 1, limit = 10, search = "" }: { location?: string; page?: number; limit?: number; search?: string } = {}) => {
    const params: any = { page, limit, search };
    if (location) params.location = location;
    const res = await axios.get("/material-issue/wip/all", { params });
    return res.data.data;
  }
);

export const deleteIssueSlip = createAsyncThunk(
  "materialIssue/delete",
  async (id: string) => {
    await axios.delete(`/material-issue/${id}`);
    return id;
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
    // Pagination states
    issueSlipsPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    ledgerPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    wipPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    }
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
        state.issueSlips = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.issueSlipsPagination = action.payload.pagination;
        }
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
      state.ledger = action.payload.data || action.payload;
      if (action.payload.pagination) {
        state.ledgerPagination = action.payload.pagination;
      }
    })
      .addCase(deleteIssueSlip.fulfilled, (state, action) => {
        state.issueSlips = state.issueSlips.filter(
          (s: any) => s._id !== action.payload
        );
      });

    /* ---------- WIP ---------- */
    builder.addCase(fetchWIP.fulfilled, (state, action) => {
      state.wip = action.payload.data || action.payload;
      if (action.payload.pagination) {
        state.wipPagination = action.payload.pagination;
      }
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
