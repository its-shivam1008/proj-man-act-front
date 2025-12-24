import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

// Forecast actions
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

export const updateForecast = createAsyncThunk(
  "ppc/forecast/update",
  async ({ id, data }: { id: string; data: any }) => {
    const res = await axios.put(`/ppc/forecast/${id}`, data);
    return res.data.data;
  }
);

export const deleteForecast = createAsyncThunk(
  "ppc/forecast/delete",
  async (id: string) => {
    await axios.delete(`/ppc/forecast/${id}`);
    return id;
  }
);

// MPS actions
export const fetchMPS = createAsyncThunk("ppc/mps/get", async () => {
  const res = await axios.get("/ppc/mps");
  return res.data.data;
});

export const createMPS = createAsyncThunk(
  "ppc/mps/create",
  async (data: any) => {
    const res = await axios.post("/ppc/mps", data);
    return res.data.data;
  }
);

export const updateMPS = createAsyncThunk(
  "ppc/mps/update",
  async ({ id, data }: { id: string; data: any }) => {
    const res = await axios.put(`/ppc/mps/${id}`, data);
    return res.data.data;
  }
);

export const deleteMPS = createAsyncThunk(
  "ppc/mps/delete",
  async (id: string) => {
    await axios.delete(`/ppc/mps/${id}`);
    return id;
  }
);

export const generateMPS = createAsyncThunk(
  "ppc/mps/generate",
  async () => {
    const res = await axios.post("/ppc/mps/generate");
    return res.data.data;
  }
);

// MRP actions
export const fetchMRPLines = createAsyncThunk("ppc/mrp/get", async () => {
  const res = await axios.get("/ppc/mrp");
  return res.data.data;
});

export const runMRP = createAsyncThunk(
  "ppc/mrp/run",
  async () => {
    const res = await axios.post("/ppc/mrp/run");
    return res.data.data;
  }
);

// Planned Orders actions
export const fetchPlannedOrders = createAsyncThunk(
  "ppc/orders/get",
  async () => {
    const res = await axios.get("/ppc/orders");
    return res.data.data;
  }
);

export const createPlannedOrder = createAsyncThunk(
  "ppc/orders/create",
  async (data: any) => {
    const res = await axios.post("/ppc/orders", data);
    return res.data.data;
  }
);

export const updatePlannedOrder = createAsyncThunk(
  "ppc/orders/update",
  async ({ id, data }: { id: string; data: any }) => {
    const res = await axios.put(`/ppc/orders/${id}`, data);
    return res.data.data;
  }
);

export const deletePlannedOrder = createAsyncThunk(
  "ppc/orders/delete",
  async (id: string) => {
    await axios.delete(`/ppc/orders/${id}`);
    return id;
  }
);

const ppcSlice = createSlice({
  name: "ppc",
  initialState: {
    forecasts: [],
    mps: [],
    mrpLines: [],
    plannedOrders: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Forecast cases
    builder.addCase(fetchForecasts.fulfilled, (state, action) => {
      state.forecasts = action.payload;
    });
    
    builder.addCase(createForecast.fulfilled, (state, action) => {
      state.forecasts.push(action.payload);
    });
    
    builder.addCase(updateForecast.fulfilled, (state, action) => {
      const index = state.forecasts.findIndex((f: any) => f._id === action.payload._id);
      if (index !== -1) {
        state.forecasts[index] = action.payload;
      }
    });
    
    builder.addCase(deleteForecast.fulfilled, (state, action) => {
      state.forecasts = state.forecasts.filter((f: any) => f._id !== action.payload);
    });

    // MPS cases
    builder.addCase(fetchMPS.fulfilled, (state, action) => {
      state.mps = action.payload;
    });
    
    builder.addCase(createMPS.fulfilled, (state, action) => {
      state.mps.push(action.payload);
    });
    
    builder.addCase(updateMPS.fulfilled, (state, action) => {
      const index = state.mps.findIndex((m: any) => m._id === action.payload._id);
      if (index !== -1) {
        state.mps[index] = action.payload;
      }
    });
    
    builder.addCase(deleteMPS.fulfilled, (state, action) => {
      state.mps = state.mps.filter((m: any) => m._id !== action.payload);
    });
    
    builder.addCase(generateMPS.fulfilled, (state, action) => {
      state.mps = action.payload;
    });

    // MRP cases
    builder.addCase(fetchMRPLines.fulfilled, (state, action) => {
      state.mrpLines = action.payload;
    });
    
    builder.addCase(runMRP.fulfilled, (state, action) => {
      state.mrpLines = action.payload;
    });

    // Planned Orders cases
    builder.addCase(fetchPlannedOrders.fulfilled, (state, action) => {
      state.plannedOrders = action.payload;
    });
    
    builder.addCase(createPlannedOrder.fulfilled, (state, action) => {
      state.plannedOrders.push(action.payload);
    });
    
    builder.addCase(updatePlannedOrder.fulfilled, (state, action) => {
      const index = state.plannedOrders.findIndex((p: any) => p._id === action.payload._id);
      if (index !== -1) {
        state.plannedOrders[index] = action.payload;
      }
    });
    
    builder.addCase(deletePlannedOrder.fulfilled, (state, action) => {
      state.plannedOrders = state.plannedOrders.filter((p: any) => p._id !== action.payload);
    });

    // Loading states - these must come AFTER all addCase calls
    builder.addMatcher(
      (action) => action.type.startsWith("ppc/") && action.type.endsWith("/pending"),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );
    
    builder.addMatcher(
      (action) => action.type.startsWith("ppc/") && action.type.endsWith("/fulfilled"),
      (state) => {
        state.loading = false;
      }
    );
    
    builder.addMatcher(
      (action) => action.type.startsWith("ppc/") && action.type.endsWith("/rejected"),
      (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      }
    );
  },
});

export const { clearError } = ppcSlice.actions;
export default ppcSlice.reducer;
