import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

/* ================= TYPES ================= */

export interface Operation {
  id?: string | number;
  seq: number;
  name: string;
  workCenter: string;
  setupTime: number;
  runTime: number;
  inspection: boolean;
  location?: string;
}

export interface Routing {
  _id: string;
  routingName: string;
  product: string;
  bomId: string;
  plant?: string;
  shop?: string;
  line?: string;
  description?: string;
  operations: Operation[];
  status: "DRAFT" | "ACTIVE";
}

/* ================= STATE ================= */

interface RoutingState {
  routings: Routing[];
  selectedRouting: Routing | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: RoutingState = {
  routings: [],
  selectedRouting: null,
  status: "idle",
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

/* ================= THUNKS ================= */

/* FETCH ROUTINGS */
export const fetchRoutings = createAsyncThunk(
  "routing/fetchRoutings",
  async (
    { page = 1, limit = 10 }: { page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/get/routing?page=${page}&limit=${limit}`
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch routings"
      );
    }
  }
);

/* FETCH ROUTING BY ID */
export const fetchRoutingById = createAsyncThunk(
  "routing/fetchRoutingById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/getid/routing/${id}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch routing"
      );
    }
  }
);

/* CREATE ROUTING */
export const createRouting = createAsyncThunk(
  "routing/createRouting",
  async (data: Partial<Routing>, { rejectWithValue }) => {
    try {
      const res = await api.post("/create/routing", data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create routing"
      );
    }
  }
);

/* UPDATE ROUTING */
export const updateRouting = createAsyncThunk(
  "routing/updateRouting",
  async (
    { id, data }: { id: string; data: Partial<Routing> },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/update/routins/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update routing"
      );
    }
  }
);

/* DELETE ROUTING (SOFT DELETE) */
export const deleteRouting = createAsyncThunk(
  "routing/deleteRouting",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/delete/routing/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete routing"
      );
    }
  }
);

/* ================= SLICE ================= */

const routingSlice = createSlice({
  name: "routing",
  initialState,
  reducers: {
    clearSelectedRouting(state) {
      state.selectedRouting = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* FETCH LIST */
      .addCase(fetchRoutings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRoutings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.routings = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRoutings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      /* FETCH ONE */
      .addCase(fetchRoutingById.fulfilled, (state, action) => {
        state.selectedRouting = action.payload;
      })

      /* CREATE */
      .addCase(createRouting.fulfilled, (state, action) => {
        state.routings.unshift(action.payload);
      })

      /* UPDATE */
      .addCase(updateRouting.fulfilled, (state, action) => {
        const index = state.routings.findIndex(
          (r) => r._id === action.payload._id
        );
        if (index !== -1) {
          state.routings[index] = action.payload;
        }
      })

      /* DELETE */
      .addCase(deleteRouting.fulfilled, (state, action) => {
        state.routings = state.routings.filter(
          (r) => r._id !== action.payload
        );
      });
  },
});

export const { clearSelectedRouting } = routingSlice.actions;
export default routingSlice.reducer;
