import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

export interface MovesAnalysis {
  _id?: string;
  organisationId?: string;
  productId: string;
  demand: number;
  snLots: number;
  packagingQty: number;
  quantity: number;
  realQuantity: number;
  unitPrice: number;
  inboundTrend: 'up' | 'down' | 'stable';
  outboundTrend: 'up' | 'down' | 'stable';
  turnoverRate: number;
  createdAt?: string;
  updatedAt?: string;
}

interface MovesAnalysisState {
  movesAnalysis: MovesAnalysis[];
  loading: boolean;
  error: string | null;
}

const initialState: MovesAnalysisState = {
  movesAnalysis: [],
  loading: false,
  error: null,
};

export const fetchMovesAnalysis = createAsyncThunk(
  "movesAnalysis/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const orgId = localStorage.getItem("organisationId");
      if (!orgId) {
        toast.error("No organisationId found");
        return rejectWithValue("No organisationId found");
      }

      const res = await api.get(`/moves-analysis/all/${orgId}`);
      return res.data.movesAnalysis;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to fetch moves analysis";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const addMovesAnalysis = createAsyncThunk(
  "movesAnalysis/add",
  async (data: MovesAnalysis, { rejectWithValue }) => {
    try {
      const res = await api.post(`/moves-analysis/create`, data);
      toast.success("Moves analysis added successfully");
      return res.data.movesAnalysis;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to add moves analysis";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateMovesAnalysis = createAsyncThunk(
  "movesAnalysis/update",
  async (
    { id, data }: { id: string; data: Partial<MovesAnalysis> },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/moves-analysis/update/${id}`, data);
      toast.success("Moves analysis updated");
      return res.data.movesAnalysis;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update moves analysis";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteMovesAnalysis = createAsyncThunk(
  "movesAnalysis/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/moves-analysis/delete/${id}`);
      toast.success("Moves analysis deleted");
      return id;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete moves analysis";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const movesAnalysisSlice = createSlice({
  name: "movesAnalysis",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // FETCH
    builder.addCase(fetchMovesAnalysis.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchMovesAnalysis.fulfilled, (state, action) => {
      state.loading = false;
      state.movesAnalysis = action.payload || [];
    });
    builder.addCase(fetchMovesAnalysis.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ADD
    builder.addCase(addMovesAnalysis.fulfilled, (state, action) => {
      state.movesAnalysis.unshift(action.payload);
    });

    // UPDATE
    builder.addCase(updateMovesAnalysis.fulfilled, (state, action) => {
      state.movesAnalysis = state.movesAnalysis.map((ma) =>
        ma._id === action.payload._id ? action.payload : ma
      );
    });

    // DELETE
    builder.addCase(deleteMovesAnalysis.fulfilled, (state, action) => {
      state.movesAnalysis = state.movesAnalysis.filter(
        (ma) => ma._id !== action.payload
      );
    });
  },
});

export default movesAnalysisSlice.reducer;

