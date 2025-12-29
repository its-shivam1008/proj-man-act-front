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
export const updatePlan = createAsyncThunk(
  "quality/updatePlan",
  async ({ id, data }: any) => {
    const res = await axios.put(`/quality/plans/${id}`, data);
    return res.data.data;
  }
);

export const deletePlan = createAsyncThunk(
  "quality/deletePlan",
  async (id: string) => {
    await axios.delete(`/quality/plans/${id}`);
    return id;
  }
);
/* NCR */
export const updateNCR = createAsyncThunk(
  "quality/updateNCR",
  async ({ id, data }: any) => {
    const res = await axios.put(`/quality/ncrs/${id}`, data);
    return res.data.data;
  }
);

export const deleteNCR = createAsyncThunk(
  "quality/deleteNCR",
  async (id: string) => {
    await axios.delete(`/quality/ncrs/${id}`);
    return id;
  }
);
/* CAPA */
export const updateCAPA = createAsyncThunk(
  "quality/updateCAPA",
  async ({ id, data }: any) => {
    const res = await axios.put(`/quality/capas/${id}`, data);
    return res.data.data;
  }
);

export const deleteCAPA = createAsyncThunk(
  "quality/deleteCAPA",
  async (id: string) => {
    await axios.delete(`/quality/capas/${id}`);
    return id;
  }
);
export const updateInspection = createAsyncThunk(
  "quality/updateInspection",
  async ({ id, data }: any) => {
    const res = await axios.put(`/quality/inspections/${id}`, data);
    return res.data.data;
  }
);

export const deleteInspection = createAsyncThunk(
  "quality/deleteInspection",
  async (id: string) => {
    await axios.delete(`/quality/inspections/${id}`);
    return id;
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
    })
      .addCase(updatePlan.fulfilled, (state, action) => {
        const i = state.plans.findIndex((p: any) => p._id === action.payload._id);
        if (i !== -1) state.plans[i] = action.payload;
      })
      .addCase(deletePlan.fulfilled, (state, action) => {
        state.plans = state.plans.filter(
          (p: any) => p._id !== action.payload
        );
      }).addCase(updateNCR.fulfilled, (state, action) => {
        const i = state.ncrs.findIndex(
          (n: any) => n._id === action.payload._id
        );
        if (i !== -1) state.ncrs[i] = action.payload;
      })
      .addCase(deleteNCR.fulfilled, (state, action) => {
        state.ncrs = state.ncrs.filter(
          (n: any) => n._id !== action.payload
        );
      })
      .addCase(updateCAPA.fulfilled, (state, action) => {
        const i = state.capas.findIndex(
          (c: any) => c._id === action.payload._id
        );
        if (i !== -1) state.capas[i] = action.payload;
      })
      .addCase(deleteCAPA.fulfilled, (state, action) => {
        state.capas = state.capas.filter(
          (c: any) => c._id !== action.payload
        );
      }).addCase(updateInspection.fulfilled, (state, action) => {
        const i = state.inspections.findIndex(
          (ins: any) => ins._id === action.payload._id
        );
        if (i !== -1) state.inspections[i] = action.payload;
      })
      .addCase(deleteInspection.fulfilled, (state, action) => {
        state.inspections = state.inspections.filter(
          (i: any) => i._id !== action.payload
        );
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
