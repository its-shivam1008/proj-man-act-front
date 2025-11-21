import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

export interface StockReport {
  _id?: string;
  organisationId?: string;
  itemId: string;
  unitCost: number;
  incomingQuantity: number;
  outgoingQuantity: number;
  category: string;
  warehouse: string;
  productType: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StockReportState {
  stockReports: StockReport[];
  loading: boolean;
  error: string | null;
}

const initialState: StockReportState = {
  stockReports: [],
  loading: false,
  error: null,
};

export const fetchStockReports = createAsyncThunk(
  "stockReports/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const orgId = localStorage.getItem("organisationId");
      if (!orgId) {
        toast.error("No organisationId found");
        return rejectWithValue("No organisationId found");
      }

      const res = await api.get(`/stock-report/all/${orgId}`);
      return res.data.stockReports;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to fetch stock reports";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const addStockReport = createAsyncThunk(
  "stockReports/add",
  async (data: StockReport, { rejectWithValue }) => {
    try {
      const res = await api.post(`/stock-report/create`, data);
      toast.success("Stock report added successfully");
      return res.data.stockReport;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to add stock report";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateStockReport = createAsyncThunk(
  "stockReports/update",
  async (
    { id, data }: { id: string; data: Partial<StockReport> },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/stock-report/update/${id}`, data);
      toast.success("Stock report updated");
      return res.data.stockReport;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update stock report";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteStockReport = createAsyncThunk(
  "stockReports/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/stock-report/delete/${id}`);
      toast.success("Stock report deleted");
      return id;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete stock report";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const stockReportSlice = createSlice({
  name: "stockReports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // FETCH
    builder.addCase(fetchStockReports.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchStockReports.fulfilled, (state, action) => {
      state.loading = false;
      state.stockReports = action.payload || [];
    });
    builder.addCase(fetchStockReports.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ADD
    builder.addCase(addStockReport.fulfilled, (state, action) => {
      state.stockReports.unshift(action.payload);
    });

    // UPDATE
    builder.addCase(updateStockReport.fulfilled, (state, action) => {
      state.stockReports = state.stockReports.map((sr) =>
        sr._id === action.payload._id ? action.payload : sr
      );
    });

    // DELETE
    builder.addCase(deleteStockReport.fulfilled, (state, action) => {
      state.stockReports = state.stockReports.filter(
        (sr) => sr._id !== action.payload
      );
    });
  },
});

export default stockReportSlice.reducer;

