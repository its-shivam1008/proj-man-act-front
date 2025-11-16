import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { PurchaseOrder } from "@/types/procurement";
import { BASE_URL } from "@/utils/constants";
import api from "@/utils/axiosApi";

export const fetchPOs = createAsyncThunk<PurchaseOrder[]>(
  "po/fetchPOs",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`/procurement/get/pos`); // Ensure /procurement prefix
      return res.data.pos || res.data || [];
    } catch (err: any) {
      console.error('Fetch POs error:', err.response?.data || err.message);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const receivePO = createAsyncThunk<
  PurchaseOrder,
  { poId: string; qty: number }
>("po/receivePO", async ({ poId, qty }, { rejectWithValue }) => {
  console.log('Sending receivePO with poId:', poId); // Enhanced debug: Log exact poId
  if (!poId) {
    return rejectWithValue('Missing poId');
  }
  try {
    const res = await api.post(`/procurement/receive-po`, { poId, qty }); // Ensure /procurement prefix
    return res.data.po as PurchaseOrder;
  } catch (err: any) {
    console.error('Receive PO error:', {
      status: err.response?.status,
      data: err.response?.data,
      poId, // Log poId in error too
    });
    return rejectWithValue(err.response?.data || err.message);
  }
});

interface POState {
  list: PurchaseOrder[];
  loading: boolean;
  error: string | null;
}

const initialState: POState = {
  list: [],
  loading: false,
  error: null,
};

const poSlice = createSlice({
  name: "po",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchPOs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPOs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPOs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(receivePO.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(receivePO.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        let idx = state.list.findIndex((p) => p._id === updated._id);
        if (idx === -1) {
          idx = state.list.findIndex((p) => p.id === updated.id); // Fallback for id vs _id
        }
        if (idx !== -1) {
          state.list[idx] = updated;
        } else {
          state.list.push(updated); // Append if not found (e.g., fetched separately)
        }
      })
      .addCase(receivePO.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = poSlice.actions;
export default poSlice.reducer;