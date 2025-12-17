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
    b.addMatcher(
      (a) => a.type.startsWith("quality/") && a.type.endsWith("/pending"),
      (s) => { s.loading = true; }
    );
    b.addMatcher(
      (a) => a.type.startsWith("quality/") && a.type.endsWith("/fulfilled"),
      (s) => { s.loading = false; }
    );

    b.addCase(fetchPlans.fulfilled, (s, a) => { s.plans = a.payload; });
    b.addCase(fetchInspections.fulfilled, (s, a) => { s.inspections = a.payload; });
    b.addCase(fetchNCRs.fulfilled, (s, a) => { s.ncrs = a.payload; });
    b.addCase(fetchCAPAs.fulfilled, (s, a) => { s.capas = a.payload; });
    b.addCase(createInspection.fulfilled, (s, a) => {
      s.inspections.unshift(a.payload);
    });
  },
});

export default slice.reducer;
