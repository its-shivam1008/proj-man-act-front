import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { RFQ } from "@/types/purchase";

export const fetchRFQs = createAsyncThunk(
  "rfqs/fetchRFQs",
  async (params: { page?: number; limit?: number; sort?: string; q?: string } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, sort, q } = params;
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', String(limit));
      if (sort) query.set('sort', sort);
      if (q) query.set('q', q);

      const response = await api.get(`/purchase/rfq?${query.toString()}`);
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

//send RFQ emails
export const sendRFQ = createAsyncThunk(
  "rfqs/sendRFQ",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/purchase/rfq/${id}/send`);
      console.log("sendRFQ response:", response.data);
      // Expect backend to return something like { success: true, message, rfq? }
      return { id, rfq: response.data.rfq, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to send RFQ");
    }
  }
);

interface RFQState {
  rfqs: RFQ[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  loading: boolean;
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  } | null;
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
    resetRFQs: (state) => {
      state.rfqs = [];
      state.meta = null;
      state.status = 'idle';
      state.error = null;
    }
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
        state.rfqs = action.payload.rfqs ?? action.payload.data ?? [];
        state.meta = action.payload.meta ?? null;
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
      })

            // Send RFQ
      .addCase(sendRFQ.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendRFQ.fulfilled, (state, action) => {
        state.loading = false;
        console.log("sendRFQ.fulfilled payload:", action.payload);
        
        const id = action.payload.id;
        const returnedRfq = action.payload.rfq;

        const index = state.rfqs.findIndex(r => (r.id ?? (r as any)._id) === id);
        console.log("Found RFQ at index:", index, "RFQ ID:", id);
        
        if (index !== -1) {
          if (returnedRfq) {
            console.log("Updating RFQ with returned data:", returnedRfq);
            state.rfqs[index] = { ...returnedRfq, id: returnedRfq._id || returnedRfq.id };
          } else {
            console.log("No RFQ returned, setting status to sent");
            state.rfqs[index] = { ...state.rfqs[index], status: 'sent' } as RFQ;
          }
        }
        state.status = 'succeeded';
      })
      .addCase(sendRFQ.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.status = 'failed';
      })
  },
});

export const { clearError } = rfqSlice.actions;
export default rfqSlice.reducer;
