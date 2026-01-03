import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export interface ControlPoint {
  _id: string;
  controlPointId: string;
  controlPointName: string;
  operationType: "manufacturing" | "reception" | "delivery" | "storage";
  product: string;
  qualityTeamId: string;
  controlType: "all-operations" | "random" | "periodic";
  frequency?: number | null;
  instruction: string;
  responsible: string;
  typeOfCheck: "text" | "measurement" | "pass-fail" | "picture";
  toleranceMin?: number | null;
  toleranceMax?: number | null;
  active: boolean;
  location?: string;
  organisationId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ControlPointState {
  controlPoints: ControlPoint[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalControlPoints: number;
}

const initialState: ControlPointState = {
  controlPoints: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalControlPoints: 0,
};

// Fetch Control Points
export const fetchControlPoints = createAsyncThunk(
  "controlPoints/fetch",
  async (args: any, { rejectWithValue }) => {
    const { page, limit, operationType, controlType, active, search, location } = args;
    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.get(`/api/quality/get/control-points`, {
        params: {
          organisationId,
          page,
          limit,
          operationType,
          controlType,
          active,
          search,
          location,
        },
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch control points."
      );
    }
  }
);

// Add Control Point
export const addControlPoint = createAsyncThunk(
  "controlPoints/add",
  async (data: Partial<ControlPoint>, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post(`/api/quality/create/control-point`, {
        ...data,
        organisationId,
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to create control point."
      );
    }
  }
);

// Update Control Point
export const updateControlPoint = createAsyncThunk(
  "controlPoints/update",
  async ({ id, data }: { id: string; data: Partial<ControlPoint> }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/quality/control-point/update/${id}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update control point."
      );
    }
  }
);

// Delete Control Point
export const deleteControlPoint = createAsyncThunk(
  "controlPoints/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/quality/control-point/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete control point."
      );
    }
  }
);

// Get Control Point by ID
export const getControlPointById = createAsyncThunk(
  "controlPoints/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/quality/control-point/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch control point."
      );
    }
  }
);

// Get Control Points by Operation
export const getControlPointsByOperation = createAsyncThunk(
  "controlPoints/getByOperation",
  async (operationType: string, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.get(`/api/quality/control-points/operation/${operationType}`, {
        params: { organisationId },
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch control points."
      );
    }
  }
);

// Get Control Points by Team
export const getControlPointsByTeam = createAsyncThunk(
  "controlPoints/getByTeam",
  async (teamId: string, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.get(`/api/quality/control-points/team/${teamId}`, {
        params: { organisationId },
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch control points."
      );
    }
  }
);

const controlPointSlice = createSlice({
  name: "controlPoints",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchControlPoints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchControlPoints.fulfilled, (state, action) => {
        state.loading = false;
        state.controlPoints = action.payload.controlPoints;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalControlPoints = action.payload.totalControlPoints;
      })
      .addCase(fetchControlPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ADD
      .addCase(addControlPoint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addControlPoint.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.controlPoints.unshift(action.payload);
          state.totalControlPoints += 1;
        }
      })
      .addCase(addControlPoint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // UPDATE
      .addCase(updateControlPoint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateControlPoint.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.controlPoints = state.controlPoints.map((cp) =>
            cp._id === action.payload._id ? action.payload : cp
          );
        }
      })
      .addCase(updateControlPoint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // DELETE
      .addCase(deleteControlPoint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteControlPoint.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.controlPoints = state.controlPoints.filter(
            (cp) => cp._id !== action.payload
          );
          state.totalControlPoints -= 1;
        }
      })
      .addCase(deleteControlPoint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // GET BY ID
      .addCase(getControlPointById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getControlPointById.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(getControlPointById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = controlPointSlice.actions;
export default controlPointSlice.reducer;