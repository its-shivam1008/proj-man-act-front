import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

export const fetchForecasts = createAsyncThunk("ppc/forecast/get", async () => {
  const res = await axios.get("/ppc/forecast");
  return res.data.data;
});

export const createForecast = createAsyncThunk(
  "ppc/forecast/create",
  async (data: any) => {
    const res = await axios.post("/ppc/forecast", data);
    return res.data.data;
  }
);

export const generateMPS = createAsyncThunk(
  "ppc/mps/generate",
  async () => {
    const res = await axios.post("/ppc/mps/generate");
    return res.data.data;
  }
);

export const fetchMPS = createAsyncThunk("ppc/mps/get", async () => {
  const res = await axios.get("/ppc/mps");
  return res.data.data;
});

export const fetchPlannedOrders = createAsyncThunk(
  "ppc/orders/get",
  async () => {
    const res = await axios.get("/ppc/orders");
    return res.data.data;
  }
);

const ppcSlice = createSlice({
  name: "ppc",
  initialState: {
    forecasts: [],
    mps: [],
    plannedOrders: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addMatcher(
      (a) => a.type.startsWith("ppc/") && a.type.endsWith("/pending"),
      (s) => { s.loading = true; }
    );
    b.addMatcher(
      (a) => a.type.startsWith("ppc/") && a.type.endsWith("/fulfilled"),
      (s) => { s.loading = false; }
    );
    b.addCase(fetchForecasts.fulfilled, (s, a) => { s.forecasts = a.payload; });
    b.addCase(fetchMPS.fulfilled, (s, a) => { s.mps = a.payload; });
    b.addCase(fetchPlannedOrders.fulfilled, (s, a) => { s.plannedOrders = a.payload; });
  },
});

export default ppcSlice.reducer;
