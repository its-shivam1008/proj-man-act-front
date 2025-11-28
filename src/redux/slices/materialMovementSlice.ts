import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../utils/axiosApi";

export interface MaterialMovement {
  _id?: string;
  organisationId: string;
  projectId?: string;
  materialId: string;
  materialName: string;
  movementType: "inbound" | "outbound" | "return" | "transfer";
  quantity: number;
  unit: string;
  source?: string;
  destination?: string;
  wbsTaskId?: string;
  wbsTaskName?: string;
  mrsId?: string;
  referenceNumber?: string;
  remarks?: string;
  movementDate?: string;
  unitCost?: number;
  totalCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface MaterialMovementState {
  movements: MaterialMovement[];
  loading: boolean;
  error: string | null;
  summary: {
    totalUniqueMaterials: number;
    summary: Array<{
      _id: string;
      totalQuantity: number;
      totalCost: number;
      count: number;
    }>;
  } | null;
}

const initialState: MaterialMovementState = {
  movements: [],
  loading: false,
  error: null,
  summary: null,
};

// Fetch all movements
export const fetchMovements = createAsyncThunk(
  "materialMovement/fetchMovements",
  async (params?: {
    organisationId?: string;
    projectId?: string;
    materialId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.organisationId) queryParams.append("organisationId", params.organisationId);
    if (params?.projectId) queryParams.append("projectId", params.projectId);
    if (params?.materialId) queryParams.append("materialId", params.materialId);
    if (params?.movementType) queryParams.append("movementType", params.movementType);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const response = await api.get(`/material-movements?${queryParams.toString()}`);
    return response.data.data;
  }
);

// Fetch movement summary
export const fetchMovementSummary = createAsyncThunk(
  "materialMovement/fetchSummary",
  async (params?: {
    organisationId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.organisationId) queryParams.append("organisationId", params.organisationId);
    if (params?.projectId) queryParams.append("projectId", params.projectId);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const response = await api.get(`/material-movements/summary?${queryParams.toString()}`);
    return response.data.data;
  }
);

// Create movement
export const createMovement = createAsyncThunk(
  "materialMovement/createMovement",
  async (data: Partial<MaterialMovement>) => {
    const response = await api.post("/material-movements", data);
    return response.data.data;
  }
);

// Update movement
export const updateMovement = createAsyncThunk(
  "materialMovement/updateMovement",
  async ({ id, data }: { id: string; data: Partial<MaterialMovement> }) => {
    const response = await api.put(`/material-movements/${id}`, data);
    return response.data.data;
  }
);

// Delete movement
export const deleteMovement = createAsyncThunk(
  "materialMovement/deleteMovement",
  async (id: string) => {
    await api.delete(`/material-movements/${id}`);
    return id;
  }
);

const materialMovementSlice = createSlice({
  name: "materialMovement",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch movements
      .addCase(fetchMovements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovements.fulfilled, (state, action: PayloadAction<MaterialMovement[]>) => {
        state.loading = false;
        state.movements = action.payload;
      })
      .addCase(fetchMovements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch movements";
      })
      // Fetch summary
      .addCase(fetchMovementSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMovementSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchMovementSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch summary";
      })
      // Create movement
      .addCase(createMovement.pending, (state) => {
        state.loading = true;
      })
      .addCase(createMovement.fulfilled, (state, action: PayloadAction<MaterialMovement>) => {
        state.loading = false;
        state.movements.unshift(action.payload);
      })
      .addCase(createMovement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create movement";
      })
      // Update movement
      .addCase(updateMovement.fulfilled, (state, action: PayloadAction<MaterialMovement>) => {
        const index = state.movements.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.movements[index] = action.payload;
        }
      })
      // Delete movement
      .addCase(deleteMovement.fulfilled, (state, action: PayloadAction<string>) => {
        state.movements = state.movements.filter((m) => m._id !== action.payload);
      });
  },
});

export const { clearError } = materialMovementSlice.actions;
export default materialMovementSlice.reducer;
