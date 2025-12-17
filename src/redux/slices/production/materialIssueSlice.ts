import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

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

const slice = createSlice({
  name: "materialIssue",
  initialState: {
    issues: [],
    ledger: [],
    wip: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addMatcher(
      (a) => a.type.startsWith("materialIssue/") && a.type.endsWith("/pending"),
      (s) => { s.loading = true; }
    );
    b.addMatcher(
      (a) => a.type.startsWith("materialIssue/") && a.type.endsWith("/fulfilled"),
      (s) => { s.loading = false; }
    );
    b.addCase(fetchIssueSlips.fulfilled, (s, a) => { s.issues = a.payload; });
    b.addCase(fetchLedger.fulfilled, (s, a) => { s.ledger = a.payload; });
    b.addCase(fetchWIP.fulfilled, (s, a) => { s.wip = a.payload; });
  },
});

export default slice.reducer;
