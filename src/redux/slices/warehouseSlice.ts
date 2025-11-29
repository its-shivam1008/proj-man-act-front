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
  "warehouse/fetchWarehouses",
  async ({ page = 1, limit = 10 }: { page: number; limit: number }) => {
    const res = await api.get(
      `/getall/warehouse?page=${page}&limit=${limit}`
    );
    return res.data;  // { warehouses, total, page, limit }
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
    total: 0,
    page: 1,
    limit: 10,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      .addCase(fetchWarehouses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.loading = false;
        state.warehouses = action.payload.warehouses;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
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
