import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { BarcodeScan } from "@/types/barcode.types";

interface BarcodeState {
  data: BarcodeScan[];
  loading: boolean;
  error?: string;
}

const initialState: BarcodeState = {
  data: [],
  loading: false,
};

/* ---------- THUNKS ---------- */

export const fetchBarcodeScans = createAsyncThunk(
  "barcode/fetch",
  async (location?: string) => {
    const res = await api.get("/barcode-scans/fetch", {
      params: location ? { location } : {},
    });
    return res.data.data as BarcodeScan[];
  }
);

export const createBarcodeScan = createAsyncThunk(
  "barcode/create",
  async (payload: Partial<BarcodeScan>) => {
    const res = await api.post("/barcode-scans/create", payload);
    return res.data.data as BarcodeScan;
  }
);

export const updateBarcodeScan = createAsyncThunk(
  "barcode/update",
  async ({ id, data }: { id: string; data: Partial<BarcodeScan> }) => {
    const res = await api.put(`/barcode-scans/update/${id}`, data);
    return res.data.data as BarcodeScan;
  }
);

export const deleteBarcodeScan = createAsyncThunk(
  "barcode/delete",
  async (id: string) => {
    await api.delete(`/barcode-scans/delete/${id}`);
    return id;
  }
);

/* ---------- SLICE ---------- */

const barcodeSlice = createSlice({
  name: "barcode",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBarcodeScans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBarcodeScans.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchBarcodeScans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(createBarcodeScan.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      .addCase(updateBarcodeScan.fulfilled, (state, action) => {
        const idx = state.data.findIndex(
          (s) => s._id === action.payload._id
        );
        if (idx !== -1) state.data[idx] = action.payload;
      })

      .addCase(deleteBarcodeScan.fulfilled, (state, action) => {
        state.data = state.data.filter((s) => s._id !== action.payload);
      });
  },
});

export default barcodeSlice.reducer;
