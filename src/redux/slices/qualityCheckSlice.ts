import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export interface QualityCheck {
  _id: string;
  checkId: string;
  product: string;
  batchNumber?: string;
  relatedOperation: "incoming" | "manufacturing" | "delivery" | "storage";
  testType?: string;
  quantityChecked: number;
  measurementValue?: number | null;
  result: "pass" | "fail" | "pending";
  performedBy: string;
  notes?: string;
  photo?: string;
  location?: string;
  organisationId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QualityCheckState {
  qualityChecks: QualityCheck[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalChecks: number;
}

const initialState: QualityCheckState = {
  qualityChecks: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalChecks: 0,
};

// Fetch Quality Checks
export const fetchQualityChecks = createAsyncThunk(
  "qualityChecks/fetch",
  async (args: any, { rejectWithValue }) => {
    const { page, limit, result, operation, search, location } = args;
    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.get(`/api/quality/get/quality-checks`, {
        params: {
          organisationId,
          page,
          limit,
          result,
          operation,
          search,
          location,
        },
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch quality checks."
      );
    }
  }
);

// Add Quality Check
export const addQualityCheck = createAsyncThunk(
  "qualityChecks/add",
  async (data: Partial<QualityCheck>, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post(`/api/quality/create/quality-check`, {
        ...data,
        organisationId,
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to create quality check."
      );
    }
  }
);

// Update Quality Check
export const updateQualityCheck = createAsyncThunk(
  "qualityChecks/update",
  async ({ id, data }: { id: string; data: Partial<QualityCheck> }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/quality/quality-check/update/${id}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update quality check."
      );
    }
  }
);

// Delete Quality Check
export const deleteQualityCheck = createAsyncThunk(
  "qualityChecks/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/quality/quality-check/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete quality check."
      );
    }
  }
);

// Get Quality Check by ID
export const getQualityCheckById = createAsyncThunk(
  "qualityChecks/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/quality/quality-check/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch quality check."
      );
    }
  }
);

const qualityCheckSlice = createSlice({
  name: "qualityChecks",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchQualityChecks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQualityChecks.fulfilled, (state, action) => {
        state.loading = false;
        state.qualityChecks = action.payload.qualityChecks;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalChecks = action.payload.totalChecks;
      })
      .addCase(fetchQualityChecks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ADD
      .addCase(addQualityCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addQualityCheck.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityChecks.unshift(action.payload);
          state.totalChecks += 1;
        }
      })
      .addCase(addQualityCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // UPDATE
      .addCase(updateQualityCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQualityCheck.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityChecks = state.qualityChecks.map((check) =>
            check._id === action.payload._id ? action.payload : check
          );
        }
      })
      .addCase(updateQualityCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // DELETE
      .addCase(deleteQualityCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQualityCheck.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityChecks = state.qualityChecks.filter(
            (check) => check._id !== action.payload
          );
          state.totalChecks -= 1;
        }
      })
      .addCase(deleteQualityCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // GET BY ID
      .addCase(getQualityCheckById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQualityCheckById.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(getQualityCheckById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = qualityCheckSlice.actions;
export default qualityCheckSlice.reducer;