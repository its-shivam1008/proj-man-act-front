import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

interface ProductItem {
  productId: string;
  quantity: number;
}

export interface Receipt {
  _id?: string;
  organisationId: string;
  receiveFrom: string;
  operationType: string;
  products: ProductItem[];
  status: "draft" | "in-progress" | "done" | "cancelled";
  scheduledDate: string;
  warehouse?: string;
  barcode?: string;
}

interface ReceiptState {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
}

const initialState: ReceiptState = {
  receipts: [],
  loading: false,
  error: null,
};

export const fetchReceipts = createAsyncThunk(
  "receipts/fetchReceipts",
  async (location?: string) => {
    const orgId = localStorage.getItem("organisationId");
    const params: any = { organisationId: orgId };
    if (location) params.location = location;
    
    const res = await api.get(`/receipts/get/all`, { params });
    return res.data;
  }
);

export const createReceipt = createAsyncThunk(
  "receipts/createReceipt",
  async (data: Omit<Receipt, "_id">, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const payload = { ...data, organisationId };
      const res = await api.post("/receipts/create", payload);
      toast.success("Receipt created successfully!");
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create receipt");
      return rejectWithValue(err.response?.data);
    }
  }
);

export const updateReceipt = createAsyncThunk(
  "receipts/updateReceipt",
  async ({ id, data }: { id: string; data: Partial<Receipt> }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/receipts/update/${id}`, data);
      toast.success("Receipt updated successfully!");
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update receipt");
      return rejectWithValue(err.response?.data);
    }
  }
);

export const deleteReceipt = createAsyncThunk(
  "receipts/deleteReceipt",
  async (id: string, { rejectWithValue }) => {
    try {

      await api.delete(`/receipts/delete/${id}`);
      toast.success("Receipt deleted successfully!");
      return id;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete receipt");
      return rejectWithValue(err.response?.data);
    }
  }
);
export const approveReceipt = createAsyncThunk<any, string>(
  "receipts/approveReceipt",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.put(`/receipts/approve/${id}`);
      toast.success("Receipt approved & Warehouse created!");
      return res.data.receipt;
    } catch (err: any) {
      toast.error("Failed to approve receipt");
      return rejectWithValue(err.response?.data);
    }
  }
);


const receiptSlice = createSlice({
  name: "receipts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      .addCase(fetchReceipts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.loading = false;
        state.receipts = action.payload;
      })
      .addCase(fetchReceipts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error fetching receipts";
        toast.error("Failed to load receipts");
      })


      .addCase(createReceipt.fulfilled, (state, action) => {
        state.receipts.push(action.payload);
      })


      .addCase(updateReceipt.fulfilled, (state, action) => {
        const index = state.receipts.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.receipts[index] = action.payload;
      })
      .addCase(approveReceipt.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.receipts.findIndex((r) => r._id === updated._id);
        if (index !== -1) {
          state.receipts[index] = updated; // Update status to "approved"
        }
      })

      .addCase(deleteReceipt.fulfilled, (state, action) => {
        state.receipts = state.receipts.filter((r) => r._id !== action.payload);
      });
  },
});

export default receiptSlice.reducer;