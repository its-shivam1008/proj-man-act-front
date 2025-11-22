import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

export interface InventoryHistory {
  _id?: string;
  organisationId?: string;
  date: string;
  reference: string;
  productId: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  operationType: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface InventoryHistoryState {
  inventoryHistory: InventoryHistory[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryHistoryState = {
  inventoryHistory: [],
  loading: false,
  error: null,
};

export const fetchInventoryHistory = createAsyncThunk(
  "inventoryHistory/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const orgId = localStorage.getItem("organisationId");
      if (!orgId) {
        toast.error("No organisationId found");
        return rejectWithValue("No organisationId found");
      }

      const res = await api.get(`/inventory-history/all/${orgId}`);
      return res.data.inventoryHistory;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to fetch inventory history";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const addInventoryHistory = createAsyncThunk(
  "inventoryHistory/add",
  async (data: InventoryHistory, { rejectWithValue }) => {
    try {
      const res = await api.post(`/inventory-history/create`, data);
      toast.success("Transaction history added successfully");
      return res.data.inventoryHistory;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to add transaction history";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateInventoryHistory = createAsyncThunk(
  "inventoryHistory/update",
  async (
    { id, data }: { id: string; data: Partial<InventoryHistory> },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/inventory-history/update/${id}`, data);
      toast.success("Transaction history updated");
      return res.data.inventoryHistory;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update transaction history";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteInventoryHistory = createAsyncThunk(
  "inventoryHistory/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/inventory-history/delete/${id}`);
      toast.success("Transaction history deleted");
      return id;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete transaction history";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const inventoryHistorySlice = createSlice({
  name: "inventoryHistory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // FETCH
    builder.addCase(fetchInventoryHistory.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchInventoryHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.inventoryHistory = action.payload || [];
    });
    builder.addCase(fetchInventoryHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ADD
    builder.addCase(addInventoryHistory.fulfilled, (state, action) => {
      state.inventoryHistory.unshift(action.payload);
    });

    // UPDATE
    builder.addCase(updateInventoryHistory.fulfilled, (state, action) => {
      state.inventoryHistory = state.inventoryHistory.map((ih) =>
        ih._id === action.payload._id ? action.payload : ih
      );
    });

    // DELETE
    builder.addCase(deleteInventoryHistory.fulfilled, (state, action) => {
      state.inventoryHistory = state.inventoryHistory.filter(
        (ih) => ih._id !== action.payload
      );
    });
  },
});

export default inventoryHistorySlice.reducer;

