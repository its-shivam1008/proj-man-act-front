import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

export interface Valuation {
  _id?: string;
  organisationId?: string;
  date: string;
  reference: string;
  productId: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  method: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ValuationState {
  valuations: Valuation[];
  loading: boolean;
  error: string | null;
}

const initialState: ValuationState = {
  valuations: [],
  loading: false,
  error: null,
};

export const fetchValuations = createAsyncThunk(
  "valuations/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const orgId = localStorage.getItem("organisationId");
      if (!orgId) {
        toast.error("No organisationId found");
        return rejectWithValue("No organisationId found");
      }

      const res = await api.get(`/valuation/all/${orgId}`);
      return res.data.valuations;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to fetch valuations";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const addValuation = createAsyncThunk(
  "valuations/add",
  async (data: Valuation, { rejectWithValue }) => {
    try {
      const res = await api.post(`/valuation/create`, data);
      toast.success("Valuation added successfully");
      return res.data.valuation;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to add valuation";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateValuation = createAsyncThunk(
  "valuations/update",
  async (
    { id, data }: { id: string; data: Partial<Valuation> },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/valuation/update/${id}`, data);
      toast.success("Valuation updated");
      return res.data.valuation;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update valuation";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteValuation = createAsyncThunk(
  "valuations/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/valuation/delete/${id}`);
      toast.success("Valuation deleted");
      return id;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete valuation";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const valuationSlice = createSlice({
  name: "valuations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // FETCH
    builder.addCase(fetchValuations.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchValuations.fulfilled, (state, action) => {
      state.loading = false;
      state.valuations = action.payload || [];
    });
    builder.addCase(fetchValuations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ADD
    builder.addCase(addValuation.fulfilled, (state, action) => {
      state.valuations.unshift(action.payload);
    });

    // UPDATE
    builder.addCase(updateValuation.fulfilled, (state, action) => {
      state.valuations = state.valuations.map((v) =>
        v._id === action.payload._id ? action.payload : v
      );
    });

    // DELETE
    builder.addCase(deleteValuation.fulfilled, (state, action) => {
      state.valuations = state.valuations.filter(
        (v) => v._id !== action.payload
      );
    });
  },
});

export default valuationSlice.reducer;

