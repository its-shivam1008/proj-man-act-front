import { createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi"; // or wherever your axios instance is
import { RootState } from "../store";

/* ================= TYPES ================= */

export interface Bill {
  _id: string;
  wbsId: string;
  gstWithheld: number;
  retentionWithheld: number;
  totalAmount: number;
  amountReceived: number;
  maturityDate?: string;
  billImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WbsBillState {
  bills: Bill[];
  selectedBill: Bill | null;
  loading: boolean;
  error: string | null;
}

/* ================= INITIAL STATE ================= */

const initialState: WbsBillState = {
  bills: [],
  selectedBill: null,
  loading: false,
  error: null,
};

/* ================= THUNKS ================= */

// CREATE
export const createBill = createAsyncThunk<
  Bill,
  FormData,
  { rejectValue: string }
>("wbsBill/create", async (formData, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/create/bills", formData);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to create bill"
    );
  }
});

// FETCH BY WBS
export const fetchBillsByWbs = createAsyncThunk<
  Bill[],
  string,
  { rejectValue: string }
>("wbsBill/fetchByWbs", async (wbsId, { rejectWithValue }) => {
  try {
    const res = await axios.get(`/fetch/bills/wbs/${wbsId}`);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch bills"
    );
  }
});

// FETCH SINGLE
export const fetchBillById = createAsyncThunk<
  Bill,
  string,
  { rejectValue: string }
>("wbsBill/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const res = await axios.get(`/id/bills/${id}`);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch bill"
    );
  }
});

// UPDATE
export const updateBill = createAsyncThunk<
  Bill,
  { id: string; formData: FormData },
  { rejectValue: string }
>("wbsBill/update", async ({ id, formData }, { rejectWithValue }) => {
  try {
    const res = await axios.put(`/update/bills/${id}`, formData);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to update bill"
    );
  }
});

// DELETE
export const deleteBill = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("wbsBill/delete", async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`/delete/bills/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to delete bill"
    );
  }
});

/* ================= SLICE ================= */

const wbsBillSlice = createSlice({
  name: "wbsBill",
  initialState,
  reducers: {
    clearSelectedBill(state) {
      state.selectedBill = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ===== CREATE ===== */
      .addCase(createBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.loading = false;
        state.bills.unshift(action.payload);
      })
      .addCase(createBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      })

      /* ===== FETCH BY WBS ===== */
      .addCase(fetchBillsByWbs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBillsByWbs.fulfilled, (state, action) => {
        state.loading = false;
        state.bills = action.payload;
      })
      .addCase(fetchBillsByWbs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      })

      /* ===== FETCH SINGLE ===== */
      .addCase(fetchBillById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBillById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBill = action.payload;
      })
      .addCase(fetchBillById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      })

      /* ===== UPDATE ===== */
      .addCase(updateBill.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBill.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.bills.findIndex(
          (b) => b._id === action.payload._id
        );
        if (index !== -1) {
          state.bills[index] = action.payload;
        }
        state.selectedBill = action.payload;
      })
      .addCase(updateBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      })

      /* ===== DELETE ===== */
      .addCase(deleteBill.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.loading = false;
        state.bills = state.bills.filter(
          (bill) => bill._id !== action.payload
        );
      })
      .addCase(deleteBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      });
  },
});

/* ================= EXPORTS ================= */

export const { clearSelectedBill } = wbsBillSlice.actions;

export const selectBills = (state: RootState) => state.wbsBill.bills;
export const selectSelectedBill = (state: RootState) =>
  state.wbsBill.selectedBill;
export const selectBillLoading = (state: RootState) =>
  state.wbsBill.loading;

export default wbsBillSlice.reducer;
