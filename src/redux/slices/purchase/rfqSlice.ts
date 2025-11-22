import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { RFQ } from "@/types/purchase";

export const fetchRFQs = createAsyncThunk(
  "rfqs/fetchRFQs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/purchase/rfq");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch RFQs");
    }
  }
);

export const createRFQ = createAsyncThunk(
  "rfqs/createRFQ",
  async (rfqData: Omit<RFQ, "id" | "createdAt" | "updatedAt">, { rejectWithValue }) => {
    try {
      const response = await api.post("/purchase/rfq", rfqData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create RFQ");
    }
  }
);

export const updateRFQ = createAsyncThunk(
  "rfqs/updateRFQ",
  async ({ id, data }: { id: string; data: Partial<RFQ> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/purchase/rfq/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update RFQ");
    }
  }
);

export const deleteRFQ = createAsyncThunk(
  "rfqs/deleteRFQ",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/purchase/rfq/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete RFQ");
    }
  }
);

interface RFQState {
  rfqs: RFQ[];
  loading: boolean;
  error: string | null;
}

const initialState: RFQState = {
  rfqs: [],
  loading: false,
  error: null,
};

const rfqSlice = createSlice({
  name: "rfqs",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch RFQs
      .addCase(fetchRFQs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRFQs.fulfilled, (state, action) => {
        state.loading = false;
        state.rfqs = action.payload.rfqs;
      })
      .addCase(fetchRFQs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create RFQ
      .addCase(createRFQ.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRFQ.fulfilled, (state, action) => {
        state.loading = false;
        state.rfqs.push(action.payload);
      })
      .addCase(createRFQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update RFQ
      .addCase(updateRFQ.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRFQ.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.rfqs.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.rfqs[index] = action.payload;
        }
      })
      .addCase(updateRFQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete RFQ
      .addCase(deleteRFQ.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRFQ.fulfilled, (state, action) => {
        state.loading = false;
        state.rfqs = state.rfqs.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteRFQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = rfqSlice.actions;
export default rfqSlice.reducer;
