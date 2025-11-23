import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { PurchaseAgreement } from "@/types/purchase";

export const fetchPurchaseAgreements = createAsyncThunk(
  "purchaseAgreements/fetchPurchaseAgreements",
  async (params: { page?: number; limit?: number; sort?: string; q?: string } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, sort, q } = params;
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', String(limit));
      if (sort) query.set('sort', sort);
      if (q) query.set('q', q);

      const response = await api.get(`/purchase/agreements?${query.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch purchase agreements");
    }
  }
);

export const createPurchaseAgreement = createAsyncThunk(
  "purchaseAgreements/createPurchaseAgreement",
  async (agreementData: Omit<PurchaseAgreement, "id" | "createdAt" | "updatedAt">, { rejectWithValue }) => {
    try {
      const response = await api.post("/purchase/agreements", agreementData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create purchase agreement");
    }
  }
);

export const updatePurchaseAgreement = createAsyncThunk(
  "purchaseAgreements/updatePurchaseAgreement",
  async ({ id, data }: { id: string; data: Partial<PurchaseAgreement> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/purchase/agreements/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update purchase agreement");
    }
  }
);

export const deletePurchaseAgreement = createAsyncThunk(
  "purchaseAgreements/deletePurchaseAgreement",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/purchase/agreements/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete purchase agreement");
    }
  }
);

interface PurchaseAgreementState {
  purchaseAgreements: PurchaseAgreement[];
  loading: boolean;
  error: string | null;
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  } | null;
}

const initialState: PurchaseAgreementState = {
  purchaseAgreements: [],
  loading: false,
  error: null,
  meta: null,
};

const purchaseAgreementSlice = createSlice({
  name: "purchaseAgreements",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Purchase Agreements
      .addCase(fetchPurchaseAgreements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseAgreements.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseAgreements = action.payload.purchaseAgreements ?? action.payload.data ?? [];
        state.meta = action.payload.meta ?? null;
      })
      .addCase(fetchPurchaseAgreements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Purchase Agreement
      .addCase(createPurchaseAgreement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseAgreement.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseAgreements.push(action.payload);
      })
      .addCase(createPurchaseAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Purchase Agreement
      .addCase(updatePurchaseAgreement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchaseAgreement.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.purchaseAgreements.findIndex((pa) => pa.id === action.payload.id);
        if (index !== -1) {
          state.purchaseAgreements[index] = action.payload;
        }
      })
      .addCase(updatePurchaseAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Purchase Agreement
      .addCase(deletePurchaseAgreement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchaseAgreement.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseAgreements = state.purchaseAgreements.filter((pa) => pa.id !== action.payload);
      })
      .addCase(deletePurchaseAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = purchaseAgreementSlice.actions;
export default purchaseAgreementSlice.reducer;
