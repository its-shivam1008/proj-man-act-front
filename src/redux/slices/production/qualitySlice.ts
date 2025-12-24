import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* THUNKS */
export const fetchPlans = createAsyncThunk("quality/plans", async () => {
  const res = await axios.get("/quality/plans");
  return res.data.data;
});

export const fetchInspections = createAsyncThunk("quality/inspections", async () => {
  const res = await axios.get("/quality/inspections");
  return res.data.data;
});

export const fetchNCRs = createAsyncThunk("quality/ncrs", async () => {
  const res = await axios.get("/quality/ncrs");
  return res.data.data;
});

export const fetchCAPAs = createAsyncThunk("quality/capas", async () => {
  const res = await axios.get("/quality/capas");
  return res.data.data;
});

export const createInspection = createAsyncThunk(
  "quality/inspection/create",
  async (data: any) => {
    const res = await axios.post("/quality/inspections", data);
    return res.data.data;
  }
);

export const createPlan = createAsyncThunk(
  "quality/plan/create",
  async (data: any) => {
    const res = await axios.post("/quality/plans", data);
    return res.data.data;
  }
);

export const createNCR = createAsyncThunk(
  "quality/ncr/create",
  async (data: any) => {
    const res = await axios.post("/quality/ncrs", data);
    return res.data.data;
  }
);

export const createCAPA = createAsyncThunk(
  "quality/capa/create",
  async (data: any) => {
    const res = await axios.post("/quality/capas", data);
    return res.data.data;
  }
);

const slice = createSlice({
  name: "quality",
  initialState: {
    plans: [],
    inspections: [],
    ncrs: [],
    capas: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (b) => {
    // All addCase calls must come before addMatcher calls
    b.addCase(fetchPlans.fulfilled, (s, a) => { s.plans = a.payload; });
    b.addCase(fetchInspections.fulfilled, (s, a) => { s.inspections = a.payload; });
    b.addCase(fetchNCRs.fulfilled, (s, a) => { s.ncrs = a.payload; });
    b.addCase(fetchCAPAs.fulfilled, (s, a) => { s.capas = a.payload; });
    b.addCase(createInspection.fulfilled, (s, a) => {
      s.inspections.unshift(a.payload);
    });
    b.addCase(createPlan.fulfilled, (s, a) => {
      s.plans.unshift(a.payload);
    });
    b.addCase(createNCR.fulfilled, (s, a) => {
      s.ncrs.unshift(a.payload);
    });
    b.addCase(createCAPA.fulfilled, (s, a) => {
      s.capas.unshift(a.payload);
    });

    // All addMatcher calls must come after addCase calls
    b.addMatcher(
      (a) => a.type.startsWith("quality/") && a.type.endsWith("/pending"),
      (s) => { s.loading = true; }
    );
    b.addMatcher(
      (a) => a.type.startsWith("quality/") && a.type.endsWith("/fulfilled"),
      (s) => { s.loading = false; }
    );
  },
});

export default slice.reducer;
