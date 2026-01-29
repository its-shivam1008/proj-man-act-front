import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

export interface Store {
  _id: string;
  organisationId: string;
  name: string;
  location: string | { _id: string; name: string };
  dailySales: number;
  stock: number;
  fastMoving: string[];
  slowMoving: string[];
  manager: string;
  last7DaysSales: number[];
  returns: number;
  scrap: number;
  transferHistory: { date: string; qty: number; from: string }[];
  lowStockAlerts: string[];
  isDeleted?: boolean;
}

interface FetchStoresParams {
  page?: number;
  limit?: number;
  location?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const fetchStores = createAsyncThunk(
  "storages/fetch",
  async (params: FetchStoresParams = {}, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      if (!organisationId)
        return rejectWithValue("No organisationId found");

      const {
        page = 1,
        limit = 10,
        location = "",
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc"
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        location: location || "",
        search: search || "",
        sortBy,
        sortOrder
      });

      const res = await api.get(`/storage/all/${organisationId}?${queryParams}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch stores");
    }
  }
);


export const addStore = createAsyncThunk(
  "storages/add",
  async (data: Partial<Store>, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post("/storage/create", { ...data, organisationId });
      toast.success("Store added successfully");
      return res.data.store;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to create store";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateStore = createAsyncThunk(
  "storages/update",
  async ({ id, data }: { id: string; data: Partial<Store> }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/storage/update/${id}`, data);
      toast.success("Store updated successfully");
      return res.data.store;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to update store";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteStore = createAsyncThunk(
  "storages/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/storage/delete/${id}`);
      toast.success("Store deleted successfully");
      return id;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to delete store";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

interface StorageState {
  stores: Store[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalStores: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const initialState: StorageState = {
  stores: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalStores: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const storageSlice = createSlice({
  name: "storages",
  initialState,
  reducers: {
    resetStores: (state) => {
      state.stores = [];
      state.currentPage = 1;
      state.totalPages = 1;
      state.totalStores = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload.stores || [];
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.totalStores = action.payload.totalStores || 0;
        state.hasNextPage = action.payload.hasNextPage || false;
        state.hasPrevPage = action.payload.hasPrevPage || false;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== "No organisationId found") {
          state.error = action.payload as string;
        } else {
          state.stores = [];
        }
      })
      .addCase(addStore.fulfilled, (state, action) => {
        state.stores.unshift(action.payload);
        state.totalStores += 1;
      })
      .addCase(updateStore.fulfilled, (state, action) => {
        const index = state.stores.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.stores[index] = action.payload;
      })
      .addCase(deleteStore.fulfilled, (state, action) => {
        state.stores = state.stores.filter((s) => s._id !== action.payload);
        state.totalStores -= 1;
      });
  },
});

export const { resetStores } = storageSlice.actions;
export default storageSlice.reducer;