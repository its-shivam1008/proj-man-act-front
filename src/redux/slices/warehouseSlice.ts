import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export interface Warehouse {
  _id: string;
  name: string;
  type: string;
  location: string;
  capacity: number;
  totalItems: number;
  organisationId: string;
}

export const fetchWarehouses = createAsyncThunk(
  "warehouse/fetch",
  async (args: any, { rejectWithValue }) => {
    const { page, limit, search, type } = args;

    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.get(`/getall/warehouse`, {
        params: {
          organisationId,
          page,
          limit,
          search,
          type,
        },
      });

      return res.data; // { warehouses, currentPage, totalPages, totalWarehouses }
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch warehouses."
      );
    }
  }
);


export const addWarehouse = createAsyncThunk(
  "warehouse/add",
  async (data: any, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.post(`/warehouse/create`, {
        ...data,
        organisationId,
      });

      return res.data.warehouse;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to create warehouse."
      );
    }
  }
);


export const updateWarehouse = createAsyncThunk(
  "warehouse/update",
  async ({ id, data }: any, { rejectWithValue }) => {
    try {
      const res = await api.put(`/warehouse/update/${id}`, data);
      return res.data.warehouse;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update warehouse."
      );
    }
  }
);


export const deleteWarehouse = createAsyncThunk(
  "warehouse/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/warehouse/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete warehouse."
      );
    }
  }
);


const warehouseSlice = createSlice({
  name: "warehouse",
  initialState: {
    warehouses: [],
    loading: false,
    error: null,

    // Pagination state exactly like your project slice
    currentPage: 1,
    totalPages: 1,
    totalWarehouses: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
    
      .addCase(fetchWarehouses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.warehouses = action.payload.warehouses || [];
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalWarehouses = action.payload.totalWarehouses;
        state.loading = false;
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as any;
      })

      .addCase(addWarehouse.fulfilled, (state, action) => {
        state.warehouses.push(action.payload);
      })
      .addCase(addWarehouse.rejected, (state, action) => {
        state.error = action.payload as any;
      })

      .addCase(updateWarehouse.fulfilled, (state, action) => {
        state.warehouses = state.warehouses.map((w: any) =>
          w._id === action.payload._id ? action.payload : w
        );
      })
      .addCase(updateWarehouse.rejected, (state, action) => {
        state.error = action.payload as any;
      })

      .addCase(deleteWarehouse.fulfilled, (state, action) => {
        state.warehouses = state.warehouses.filter(
          (w: any) => w._id !== action.payload
        );
      })
      .addCase(deleteWarehouse.rejected, (state, action) => {
        state.error = action.payload as any;
      });
  },
});

export default warehouseSlice.reducer;
