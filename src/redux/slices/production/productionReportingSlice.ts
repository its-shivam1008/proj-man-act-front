import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* Generic */
const fetcher = (url: string) => axios.get(url).then(r => r.data.data);
const creator = (url: string, data: any) =>
  axios.post(url, data).then(r => r.data.data);

/* THUNKS */
export const fetchDPRs = createAsyncThunk("report/dpr", () => fetcher("/reports/dpr"));
export const createDPR = createAsyncThunk("report/dpr/create", (d: any) => creator("/reports/dpr", d));

export const fetchWorkCenters = createAsyncThunk("report/workcenter", () => fetcher("/reports/workcenter"));
export const fetchDowntimes = createAsyncThunk("report/downtime", () => fetcher("/reports/downtime"));
export const fetchOEE = createAsyncThunk("report/oee", () => fetcher("/reports/oee"));

/* SLICE */
const slice = createSlice({
  name: "productionReporting",
  initialState: {
    dprs: [],
    workCenters: [],
    materials: [],
    downtimes: [],
    quality: [],
    oee: [],
    orders: [],
    wip: [],
    costs: [],
    labour: [],
    equipment: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addMatcher(
      (a) => a.type.startsWith("report/") && a.type.endsWith("/pending"),
      (s) => { s.loading = true; }
    );
    b.addMatcher(
      (a) => a.type.startsWith("report/") && a.type.endsWith("/fulfilled"),
      (s) => { s.loading = false; }
    );
    b.addCase(fetchDPRs.fulfilled, (s, a) => { s.dprs = a.payload; });
    b.addCase(fetchWorkCenters.fulfilled, (s, a) => { s.workCenters = a.payload; });
    b.addCase(fetchDowntimes.fulfilled, (s, a) => { s.downtimes = a.payload; });
    b.addCase(fetchOEE.fulfilled, (s, a) => { s.oee = a.payload; });
  },
});

export default slice.reducer;
