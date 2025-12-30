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
  async ({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) => {
    const params = { page, limit, search };
    const res = await axios.get("/reports/dpr", { params });
    return res.data.data;
  }
);

export const createDPR = createAsyncThunk(
  "productionReporting/createDPR",
  (data: any) => creator("/reports/dpr", data)
);

/* Work Center */
export const fetchWorkCenters = createAsyncThunk(
  "productionReporting/fetchWorkCenters",
  async ({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) => {
    const params = { page, limit, search };
    const res = await axios.get("/reports/workcenter", { params });
    return res.data.data;
  }
);

export const createWorkCenter = createAsyncThunk(
  "productionReporting/createWorkCenter",
  (data: any) => creator("/reports/workcenter", data)
);

/* Downtime */
export const fetchDowntimes = createAsyncThunk(
  "productionReporting/fetchDowntimes",
  async ({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) => {
    const params = { page, limit, search };
    const res = await axios.get("/reports/downtime", { params });
    return res.data.data;
  }
);

export const createDowntime = createAsyncThunk(
  "productionReporting/createDowntime",
  (data: any) => creator("/reports/downtime", data)
);

/* OEE */
export const fetchOEE = createAsyncThunk(
  "productionReporting/fetchOEE",
  async ({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) => {
    const params = { page, limit, search };
    const res = await axios.get("/reports/oee", { params });
    return res.data.data;
  }
);

export const fetchCostOutputs = createAsyncThunk(
  "productionReporting/fetchCostOutputs",
  async ({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) => {
    const params = { page, limit, search };
    const res = await axios.get("/cost", { params });
    return res.data.data;
  }
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
    // Pagination states
    dprsPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    workCentersPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    downtimesPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    oeePagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    costsPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    }
  },
  reducers: {},
  extraReducers: (builder) => {
    /* ===== FETCH ===== */
    builder
      .addCase(fetchDPRs.fulfilled, (state, action) => {
        state.dprs = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.dprsPagination = action.payload.pagination;
        }
      })
      .addCase(fetchWorkCenters.fulfilled, (state, action) => {
        state.workCenters = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.workCentersPagination = action.payload.pagination;
        }
      })
      .addCase(fetchDowntimes.fulfilled, (state, action) => {
        state.downtimes = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.downtimesPagination = action.payload.pagination;
        }
      })
      .addCase(fetchOEE.fulfilled, (state, action) => {
        state.oee = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.oeePagination = action.payload.pagination;
        }
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
        state.costs = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.costsPagination = action.payload.pagination;
        }
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
