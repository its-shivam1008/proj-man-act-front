import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

export interface ItemMaster {
  _id: string;
  itemCode: string;
  itemName: string;
  description?: string;
  type: "raw" | "semi-finished" | "finished";
  unit: string;
  stockQuantity: number;
  reorderLevel: number;
  standardCost: number;
  location?: string;
}

const initialState = {
  list: [] as ItemMaster[],
  loading: false,
  error: null as string | null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

/* THUNKS */
export const fetchItems = createAsyncThunk(
  "itemMaster/fetch",
  async (params: { page?: number; limit?: number; search?: string }) => {
    const res = await axios.get("/items", { params });
    return res.data;
  }
);

export const createItem = createAsyncThunk(
  "itemMaster/create",
  async (data: Partial<ItemMaster>) => {
    const res = await axios.post("/items", data);
    return res.data.data;
  }
);

export const updateItem = createAsyncThunk(
  "itemMaster/update",
  async ({ id, data }: { id: string; data: Partial<ItemMaster> }) => {
    const res = await axios.put(`/items/${id}`, data);
    return res.data.data;
  }
);

export const deleteItem = createAsyncThunk(
  "itemMaster/delete",
  async (id: string) => {
    await axios.delete(`/items/${id}`);
    return id;
  }
);

/* SLICE */
const itemMasterSlice = createSlice({
  name: "itemMaster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        const i = state.list.findIndex(i => i._id === action.payload._id);
        if (i !== -1) state.list[i] = action.payload;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.list = state.list.filter(i => i._id !== action.payload);
      });
  },
});

export default itemMasterSlice.reducer;
