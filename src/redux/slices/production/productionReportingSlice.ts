import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* ================= HELPERS ================= */
const fetcher = (url: string) =>
  axios.get(url).then((r) => r.data.data);

const creator = (url: string, data: any) =>
  axios.post(url, data).then((r) => r.data.data);

/* ================= THUNKS ================= */

/* DPR */
export const fetchDPRs = createAsyncThunk(
  "productionReporting/fetchDPRs",
  () => fetcher("/reports/dpr")
);

export const createDPR = createAsyncThunk(
  "productionReporting/createDPR",
  (data: any) => creator("/reports/dpr", data)
);

/* Work Center */
export const fetchWorkCenters = createAsyncThunk(
  "productionReporting/fetchWorkCenters",
  () => fetcher("/reports/workcenter")
);

export const createWorkCenter = createAsyncThunk(
  "productionReporting/createWorkCenter",
  (data: any) => creator("/reports/workcenter", data)
);

/* Downtime */
export const fetchDowntimes = createAsyncThunk(
  "productionReporting/fetchDowntimes",
  () => fetcher("/reports/downtime")
);

export const createDowntime = createAsyncThunk(
  "productionReporting/createDowntime",
  (data: any) => creator("/reports/downtime", data)
);

/* OEE */
export const fetchOEE = createAsyncThunk(
  "productionReporting/fetchOEE",
  () => fetcher("/reports/oee")
);

export const fetchCostOutputs = createAsyncThunk(
  "productionReporting/fetchCostOutputs",
  () => fetcher("/cost")
);

export const createCostOutput = createAsyncThunk(
  "productionReporting/createCostOutput",
  (data: any) => creator("/cost", data)
);

export const updateCostOutput = createAsyncThunk(
  "productionReporting/updateCostOutput",
  async ({ id, data }: { id: string; data: any }) => {
    const res = await axios.put(`/cost/${id}`, data);
    return res.data.data;
  }
);

export const deleteCostOutput = createAsyncThunk(
  "productionReporting/deleteCostOutput",
  async (id: string) => {
    await axios.delete(`/cost/${id}`);
    return id;
  }
);
/* ================= SLICE ================= */

const productionReportingSlice = createSlice({
  name: "productionReporting",
  initialState: {
    dprs: [],
    workCenters: [],
    downtimes: [],
    oee: [],
    costs: [],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    /* ===== FETCH ===== */
    builder
      .addCase(fetchDPRs.fulfilled, (state, action) => {
        state.dprs = action.payload;
      })
      .addCase(fetchWorkCenters.fulfilled, (state, action) => {
        state.workCenters = action.payload;
      })
      .addCase(fetchDowntimes.fulfilled, (state, action) => {
        state.downtimes = action.payload;
      })
      .addCase(fetchOEE.fulfilled, (state, action) => {
        state.oee = action.payload;
      })

      /* ===== CREATE ===== */
      .addCase(createDPR.fulfilled, (state, action) => {
        state.dprs.unshift(action.payload);
      })
      .addCase(createWorkCenter.fulfilled, (state, action) => {
        state.workCenters.unshift(action.payload);
      })
      .addCase(createDowntime.fulfilled, (state, action) => {
        state.downtimes.unshift(action.payload);
      })
      .addCase(fetchCostOutputs.fulfilled, (state, action) => {
        state.costs = action.payload;
      })
      .addCase(createCostOutput.fulfilled, (state, action) => {
        state.costs.unshift(action.payload);
      })
      .addCase(updateCostOutput.fulfilled, (state, action) => {
        const index = state.costs.findIndex(
          (c: any) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.costs[index] = action.payload;
        }
      })
      .addCase(deleteCostOutput.fulfilled, (state, action) => {
        state.costs = state.costs.filter(
          (c: any) => c._id !== action.payload
        );
      })

      /* ===== LOADING ===== */
      .addMatcher(
        (action) =>
          action.type.startsWith("productionReporting/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      /* ===== SUCCESS ===== */
      .addMatcher(
        (action) =>
          action.type.startsWith("productionReporting/") &&
          action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        }
      )

      /* ===== ERROR ===== */
      .addMatcher(
        (action) =>
          action.type.startsWith("productionReporting/") &&
          action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          state.error =
            action.payload || action.error?.message || "Something went wrong";
        }
      )


  },
});

export default productionReportingSlice.reducer;
